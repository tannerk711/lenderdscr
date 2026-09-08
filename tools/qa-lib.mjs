// Shared helpers for the QA tools in tools/ (shoot, step-walk-qa, tcpa-test, gtag-test, lh).
// puppeteer-core + node built-ins only. Every tool reads QA_BASE + CHROME_PATH from the
// environment, regex-reads brand.name / gtagId / gtagConversion from src/config/site.ts,
// and refuses to trust a server whose <title> lacks brand.name (port-squatter check).
//
// Selector source of truth: BRIEF.md section 6 "DOM contract". Tools click by
// [data-value] / [data-action] and read h2[data-step-title]; never by visible text.
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const SHOTS_DIR = fileURLToPath(new URL('./shots/', import.meta.url));
// Variant B dev port is 4332 (BRIEF section 1); never 4321.
export const QA_BASE = (process.env.QA_BASE || 'http://localhost:4332').replace(/\/+$/, '');
export const CHROME_PATH = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

// One browser per viewport, defaultViewport at launch. No isMobile: on Windows headless
// Chrome it inflates the fixed-position containing block by ~35px (memory:
// reference_mobile_screenshot_emulation + template-2 CLAUDE.md).
export const VIEWPORTS = {
  desktop: { name: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1 },
  mobile: { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 2, hasTouch: true },
};

export const settle = (ms) => new Promise((r) => setTimeout(r, ms));
export const norm = (s) =>
  String(s ?? '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

// ---------------------------------------------------------------------------
// site.ts reader (regex, never an import: the tools run without Vite/TS)
// ---------------------------------------------------------------------------
const unescape = (s) => s.replace(/\\(['"\\])/g, '$1');

function pick(text, key) {
  const re = new RegExp('\\b' + key + ':\\s*([\'"])((?:\\\\.|(?!\\1)[^\\n])*)\\1');
  const m = text.match(re);
  return m ? unescape(m[2]) : '';
}

// Returns the `{ ... }` block that starts at the first `{` after `marker`, brace-balanced.
function block(text, marker) {
  const i = text.indexOf(marker);
  if (i < 0) return '';
  const open = text.indexOf('{', i);
  if (open < 0) return '';
  let depth = 0;
  for (let j = open; j < text.length; j++) {
    if (text[j] === '{') depth++;
    else if (text[j] === '}') {
      depth--;
      if (depth === 0) return text.slice(open, j + 1);
    }
  }
  return text.slice(open);
}

let cachedSite = null;
export function readSiteConfig() {
  if (cachedSite) return cachedSite;
  const path = `${ROOT}src/config/site.ts`;
  if (!existsSync(path)) throw new Error(`site config not found at ${path}`);
  const src = readFileSync(path, 'utf8');
  const brandBlock = block(src, 'export const brand');
  const siteBlock = block(src, 'export const site');
  const trackingBlock = block(src, 'export const tracking');
  const formBlock = block(src, 'export const form');
  const titlesBlock = block(formBlock, 'titles:');
  const errorsBlock = block(formBlock, 'errors:');
  const brandName = pick(brandBlock, 'name');
  if (!brandName) throw new Error('could not regex-read brand.name from src/config/site.ts');
  cachedSite = {
    brandName,
    mode: pick(siteBlock, 'mode') || 'network',
    gtagId: pick(trackingBlock, 'gtagId'),
    gtagConversion: pick(trackingBlock, 'gtagConversion'),
    titles: Object.fromEntries(
      ['goal', 'propertyType', 'credit', 'pricePurchase', 'priceRefi', 'down', 'balance', 'rehab', 'state', 'contact', 'phone', 'phoneNetwork'].map(
        (k) => [k, pick(titlesBlock, k)]
      )
    ),
    submit: pick(formBlock, 'submit'),
    submitting: pick(formBlock, 'submitting'),
    errors: { consent: pick(errorsBlock, 'consent') },
  };
  return cachedSite;
}

// ---------------------------------------------------------------------------
// Browser / page
// ---------------------------------------------------------------------------
export async function launchBrowser(vp = VIEWPORTS.desktop, extraArgs = []) {
  if (!existsSync(CHROME_PATH)) {
    throw new Error(`Chrome not found at CHROME_PATH=${CHROME_PATH} (set CHROME_PATH to chrome.exe)`);
  }
  const { name, ...viewport } = vp;
  return puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: viewport,
    args: ['--hide-scrollbars', '--force-color-profile=srgb', '--window-size=1500,1000', '--no-first-run', '--no-default-browser-check', ...extraArgs],
  });
}

export function attachErrorLog(page, sink, label) {
  page.on('console', (m) => {
    if (m.type() === 'error') sink.push(`[console ${label}] ${m.text()}`);
  });
  page.on('pageerror', (e) => sink.push(`[pageerror ${label}] ${e.message}`));
}

// Intercepts POST /api/lead, records the parsed JSON body into `posts`, and answers
// {ok:true} so no webhook is ever hit from a QA run.
export async function interceptLead(page, posts, extra) {
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    try {
      if (r.url().includes('/api/lead') && r.method() === 'POST') {
        let body = {};
        try {
          body = JSON.parse(r.postData() || '{}');
        } catch {
          body = { __unparseable: r.postData() };
        }
        posts.push(body);
        r.respond({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
        return;
      }
      if (extra && extra(r)) return;
      r.continue();
    } catch {
      /* request already handled */
    }
  });
}

// Loads QA_BASE + path, asserts the layout width matches the viewport, asserts the
// <title> carries brand.name (strict on `/`, warn elsewhere), returns the page.
export async function openPage(browser, path = '/', opts = {}) {
  const vp = opts.vp || VIEWPORTS.desktop;
  const { name, ...viewport } = vp;
  const page = await browser.newPage();
  await page.setViewport(viewport);
  if (opts.errors) attachErrorLog(page, opts.errors, `${name} ${path}`);
  if (opts.init) await page.evaluateOnNewDocument(opts.init, ...(opts.initArgs || []));
  if (opts.posts) await interceptLead(page, opts.posts, opts.intercept);
  const url = QA_BASE + path;
  for (let i = 0; i < 4; i++) {
    try {
      await page.goto(url, { waitUntil: opts.waitUntil || 'networkidle0', timeout: 45000 });
    } catch (e) {
      throw new Error(`no server at QA_BASE (${url}): ${e.message.split('\n')[0]}`);
    }
    // clientWidth = layout width; innerWidth adds the emulated scrollbar gutter on Windows
    const w = await page.evaluate(() => document.documentElement.clientWidth);
    if (w === viewport.width) break;
    if (i === 3) throw new Error(`viewport never settled at ${viewport.width}px for ${path} (got ${w})`);
    console.warn(`  viewport drift on ${path}: got ${w}, want ${viewport.width}; re-applying + reloading`);
    await page.setViewport(viewport);
  }
  await assertServer(page, path, opts.strictTitle);
  return page;
}

export async function assertServer(page, path = '/', strict) {
  const site = readSiteConfig();
  const title = await page.title();
  const ok = title.includes(site.brandName);
  const isStrict = strict ?? /^\/(\?.*)?$/.test(path);
  if (!ok && isStrict) {
    throw new Error(`no server at QA_BASE (${QA_BASE}): title "${title}" lacks brand.name "${site.brandName}" (a foreign server may be squatting the port)`);
  }
  if (!ok) console.warn(`  WARN title on ${path} lacks brand.name: "${title}"`);
  return title;
}

// Scrolls the page in 600px steps so reveals fire and cv-auto sections paint, then back to top.
export async function scrollThrough(page, step = 600) {
  await page.evaluate(
    (s) =>
      new Promise((res) => {
        let y = 0;
        const tick = () => {
          y += s;
          window.scrollTo(0, y);
          if (y < document.documentElement.scrollHeight) setTimeout(tick, 110);
          else res(null);
        };
        tick();
      }),
    step
  );
  await settle(900);
  await page.evaluate(() => window.scrollTo(0, 0));
  await settle(600);
}

export async function overflowReport(page) {
  return page.evaluate(() => {
    const cw = document.documentElement.clientWidth;
    const sw = document.documentElement.scrollWidth;
    const offenders = [];
    if (sw > cw) {
      document.querySelectorAll('body *').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > cw + 1 && r.width > 2) offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} right=${Math.round(r.right)}`);
      });
    }
    return { clientWidth: cw, scrollWidth: sw, offenders: offenders.slice(0, 12) };
  });
}

// ---------------------------------------------------------------------------
// Form drivers (DOM contract, BRIEF section 6)
// ---------------------------------------------------------------------------
export const stepSel = (id) => `#start [data-step="${id}"]`;

export async function waitStep(page, id, timeout = 8000) {
  try {
    await page.waitForSelector(stepSel(id), { timeout });
  } catch {
    const mounted = await page.evaluate(() => [...document.querySelectorAll('#start [data-step]')].map((e) => e.getAttribute('data-step')));
    throw new Error(
      `step "${id}" never mounted (mounted: ${mounted.join(',') || 'none'}). ` +
        `If every step misses in dev, the island may be dead: delete node_modules/.vite and .astro, restart astro dev.`
    );
  }
  await settle(360); // step-enter + auto-advance settle
}

export async function clickValue(page, value) {
  const ok = await page.evaluate((v) => {
    const el = document.querySelector(`#start [data-value="${v}"]`);
    if (!el) return false;
    el.click();
    return true;
  }, value);
  if (!ok) throw new Error(`no #start [data-value="${value}"] on the mounted step`);
}

export async function clickAction(page, action) {
  const ok = await page.evaluate((a) => {
    const el = document.querySelector(`#start [data-action="${a}"]`);
    if (!el) return false;
    el.click();
    return true;
  }, action);
  if (!ok) throw new Error(`no #start [data-action="${action}"] on the mounted step`);
}

// Real keystrokes so React's controlled inputs see every change.
export async function typeInto(page, sel, text) {
  await page.waitForSelector(sel, { timeout: 8000 });
  await page.click(sel, { clickCount: 3 });
  await page.type(sel, text, { delay: 6 });
}

export async function stepTitle(page) {
  return page.evaluate(() => document.querySelector('#start [data-step-title]')?.textContent ?? '');
}

export async function mountedStep(page) {
  return page.evaluate(() => document.querySelector('#start [data-step]')?.getAttribute('data-step') ?? '');
}

// DOM click on the native checkbox (its visual is a sibling/pseudo, so a coordinate click
// can land on the label text instead). Returns the checked state after the click.
export async function toggleTcpa(page) {
  return page.evaluate(() => {
    const cb = document.querySelector('#ff-tcpa');
    if (!cb) return null;
    cb.click();
    return cb.checked;
  });
}

export async function visibleError(page) {
  return page.evaluate(() => {
    const els = [...document.querySelectorAll('#start [data-error]')];
    const vis = els.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 1 && r.height > 1 && getComputedStyle(el).visibility !== 'hidden';
    });
    return vis.map((el) => el.textContent.trim()).join(' | ');
  });
}

// In-page: no VISIBLE "Step N of T" text inside #start (the sr-only label is allowed).
export const noVisibleStepText = () => {
  const root = document.querySelector('#start');
  if (!root) return { ok: false, why: 'no #start' };
  const re = /\bStep\s+\d+\s+of\s+\d+\b/i;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let label = null;
  while (walker.nextNode()) {
    const t = walker.currentNode.nodeValue || '';
    if (!re.test(t)) continue;
    const el = walker.currentNode.parentElement;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const visible = r.width > 1 && r.height > 1 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.clip !== 'rect(0px, 0px, 0px, 0px)';
    if (visible) return { ok: false, why: `visible "${t.trim()}" in <${el.tagName.toLowerCase()}>` };
    label = t.trim();
  }
  return { ok: true, label, hasLabelAttr: !!root.querySelector('[data-step-label]') };
};

export const DEFAULT_LEAD = {
  name: 'Quinn Walker',
  email: 'qa@example.com',
  phone: '5555550123',
};

// Purchase path: purchase -> sfr -> 700-739 -> price Continue -> down Continue ->
// [state: type "tex" + click texas] -> name/email Continue -> phone (+ consent).
// `onStep(name)` fires once per mounted step (after it settles) so callers can shoot/assert.
export async function walkPurchase(page, opts = {}) {
  const { fixedState = false, lead = DEFAULT_LEAD, consent = false, onStep = async () => {} } = opts;
  await waitStep(page, 'goal');
  await onStep('goal');
  await clickValue(page, 'purchase');
  await waitStep(page, 'propertyType');
  await onStep('propertyType');
  await clickValue(page, 'sfr');
  await waitStep(page, 'credit');
  await onStep('credit');
  await clickValue(page, '700-739');
  await waitStep(page, 'price');
  await onStep('price');
  await clickAction(page, 'continue');
  await waitStep(page, 'secondary');
  await onStep('secondary');
  await clickAction(page, 'continue');
  if (!fixedState) {
    await waitStep(page, 'state');
    await onStep('state');
    await typeInto(page, '#ff-state', 'tex');
    try {
      await page.waitForSelector('#start .opt-btn[data-value="texas"]', { timeout: 6000 });
    } catch {
      throw new Error('typing "tex" into #ff-state never produced .opt-btn[data-value="texas"]');
    }
    await settle(150);
    await onStep('state-typed');
    await clickValue(page, 'texas');
  }
  await waitStep(page, 'contact');
  await onStep('contact');
  await typeInto(page, '#ff-name', lead.name);
  await typeInto(page, '#ff-email', lead.email);
  await clickAction(page, 'continue');
  await waitStep(page, 'phone');
  await typeInto(page, '#ff-phone', lead.phone);
  await settle(150);
  await onStep('phone');
  if (consent) {
    const checked = await toggleTcpa(page);
    if (checked !== true) throw new Error(`#ff-tcpa did not become checked (got ${checked})`);
    await settle(150);
    await onStep('phone-consented');
  }
}

// Clicks submit and resolves when the browser lands on /thank-you (or throws).
export async function submitAndWaitThankYou(page, timeout = 15000) {
  const nav = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout }).catch(() => null);
  await clickAction(page, 'submit');
  await nav;
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (/\/thank-you/.test(page.url())) return page.url();
    await settle(200);
  }
  throw new Error(`did not land on /thank-you after submit (url=${page.url()})`);
}

// sessionStorage['lead-summary'] in the BRIEF section 5 shape (what the /start V1
// form writes on a buy-path submit); /thank-you reads exactly these keys.
export function seedLeadSummary(extra = {}) {
  return {
    firstName: 'Tanner',
    goal: 'purchase',
    goalLabel: 'Buy a rental',
    propertyType: 'sfr',
    propertyTypeLabel: 'Single-family',
    credit: '680-739',
    price: 350000,
    priceDisplay: '$350,000',
    state: 'Texas',
    ...extra,
  };
}

// evaluateOnNewDocument payload: seeds sessionStorage before any page script runs.
export const seedSession = (entries) => {
  try {
    for (const [k, v] of Object.entries(entries)) sessionStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
  } catch {
    /* private mode */
  }
};

export function ensureShots() {
  mkdirSync(SHOTS_DIR, { recursive: true });
  return SHOTS_DIR;
}

export const shotPath = (viewport, name) => `${SHOTS_DIR}${viewport}-${name}.png`;

// Tiny check harness shared by the assertion tools.
export function makeChecker() {
  const results = [];
  const check = (label, ok, detail = '') => {
    results.push({ label, ok, detail });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
    return ok;
  };
  const summary = () => {
    const failed = results.filter((r) => !r.ok);
    console.log('');
    console.log(`${results.length - failed.length}/${results.length} checks passed${failed.length ? `; FAILED: ${failed.map((f) => f.label).join('; ')}` : ''}`);
    return failed.length === 0;
  };
  return { check, summary, results };
}

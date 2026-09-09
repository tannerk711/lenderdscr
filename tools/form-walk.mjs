// Real-browser walk of the V1 form (variant B; nine steps since the 2026-09-08
// city step: goal, stage, property, credit, price, fork, CITY, contact, phone). Drives the form
// by its DOM contract (#start [data-step], [data-value], [data-action], #ff-*),
// screenshots every step at desktop 1440x900 (dsf 1) and mobile 390x844 (dsf 2,
// hasTouch, never isMobile), captures the real POST /api/lead body + response,
// and diffs the payload keys against BRIEF section 5 in order. Also proves:
//   - ?goal= preselect opens on step 2 and Back returns to a highlighted step 1
//   - refi + flip forks (balance / rehab options, $3M+ price edge) submit cleanly
//   - Below 620 = in-form kick-out with zero POSTs and a link to /not-yet
//   - a double Enter on the contact step advances exactly once
//   - an unchecked consent box blocks submit with zero POSTs
//   - a failed POST shows the inline error and the retry lands on /thank-you
//   - Back from steps 2 to 7 returns to the previous step with the pick still
//     highlighted (and slider / typed values retained)
//   - hand-built POSTs to /api/lead (QA stage): no consent = 400, honeypot and
//     sub-620 = silent 200 without testMode, incomplete lead = 400
//   - mobile fold on /start: the step-1 question and all three options above 844px
//   - no request leaves localhost during any walk (TEST MODE contract)
// Exit 1 on any failed check. Needs the dev server: CI=true npx astro dev --port 4332
//
//   node tools/form-walk.mjs [desktop|mobile]
//
// LIVE MODE (QA_LEAD_MODE=live, since the 2026-09-09 go-live): the dev server runs
// with leadDelivery 'live' and LEAD_WEBHOOK_URL=http://localhost:4399/hook; this
// walker hosts that hook, expects /api/lead to answer {ok:true, forwarded:true},
// asserts the hook received the same payload plus the three server stamps, skips
// the test-lead storage checks, and keeps the browser hermetic (every non-localhost
// host resolves to 127.0.0.1, so the deferred gtag.js request is attempted and
// fails, which is the only foreign request allowed).
//
//   $env:QA_LEAD_MODE='live'; node tools/form-walk.mjs
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const SHOTS = `${ROOT}tools/shots/`;
const BASE = (process.env.QA_BASE || 'http://localhost:4332').replace(/\/+$/, '');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BRAND = 'Internet Loans Direct';
const only = process.argv.slice(2).find((a) => !a.startsWith('--'));
// QA_FORM_PATH=/ walks the form embedded in the landing-page hero (2026-09-08);
// default /start (the full-page fallback). Both share the #start DOM contract.
const FORM = (process.env.QA_FORM_PATH || '/start').replace(/\/+$/, '') || '/';
const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, (m) => '\\' + m);
// full-URL test (page.url(), tcpaConsentUrl) and pathname test (landingPage)
const FORM_RE = FORM === '/' ? /^https?:\/\/[^/]+\/(\?|$)/ : new RegExp(esc(FORM));
const FORM_PATH_RE = FORM === '/' ? /^\/(\?|$)/ : new RegExp('^' + esc(FORM));
const FORM_QUERY_RE = new RegExp((FORM === '/' ? '^/' : '^' + esc(FORM)) + '\\?gclid=QAGCLID123');
const formUrl = (q = '') => FORM + q;

const LIVE = process.env.QA_LEAD_MODE === 'live';
const HOOK_PORT = Number(process.env.QA_HOOK_PORT || 4399);
const hookBodies = [];
let hookServer = null;
if (LIVE) {
  hookServer = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        hookBodies.push({ path: req.url, contentType: req.headers['content-type'] || '', body: JSON.parse(raw) });
      } catch {
        hookBodies.push({ path: req.url, contentType: req.headers['content-type'] || '', body: null, raw });
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"status":"success"}');
    });
  });
  await new Promise((resolve, reject) => hookServer.listen(HOOK_PORT, '127.0.0.1', resolve).on('error', reject));
  console.log(`live mode: hosting the webhook at http://localhost:${HOOK_PORT}/hook (dev server must carry LEAD_WEBHOOK_URL=that)`);
}

const VIEWPORTS = {
  desktop: { name: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1 },
  mobile: { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 2, hasTouch: true },
};

// BRIEF section 5, in order. The attribution block ships only the keys present.
const HEAD_KEYS = [
  'goal', 'goalLabel', 'stage', 'stageLabel', 'propertyType', 'propertyTypeLabel', 'credit',
  'price', 'priceDisplay', 'downPct', 'downPctDisplay', 'downPayment', 'downPaymentDisplay',
  'balance', 'balanceDisplay', 'equity', 'equityDisplay', 'rehab', 'rehabDisplay', 'scenarioDetail',
  'city', 'state', 'firstName', 'lastName', 'email', 'phone',
  'partial',
  'tcpaConsent', 'tcpaConsentText', 'tcpaConsentAt', 'tcpaConsentUrl',
];
const ATTR_KEYS = ['gclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
const TAIL_KEYS = ['landingPage', 'secondsToComplete', 'website', 'submittedAt', 'variant', 'source'];

const results = [];
const check = (label, ok, detail = '') => {
  results.push({ label, ok });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
  return ok;
};
const settle = (ms) => new Promise((r) => setTimeout(r, ms));
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

if (!existsSync(CHROME)) {
  console.error(`Chrome not found at ${CHROME}`);
  process.exit(1);
}
mkdirSync(SHOTS, { recursive: true });

// ---------------------------------------------------------------------------
// page helpers
// ---------------------------------------------------------------------------
async function newPage(browser, vp, sink) {
  const { name, ...viewport } = vp;
  const page = await browser.newPage();
  await page.setViewport(viewport);
  // Record the /api/lead response INSIDE the page, before the form navigates to
  // /thank-you: puppeteer's response.json() races that navigation and can read
  // null. The wrapper awaits the cloned body before handing the response back,
  // and sessionStorage survives the same-origin navigation.
  await page.evaluateOnNewDocument(() => {
    const orig = window.fetch;
    window.fetch = async (...args) => {
      const res = await orig(...args);
      try {
        const url = typeof args[0] === 'string' ? args[0] : args[0] && args[0].url;
        if (url && String(url).includes('/api/lead')) {
          const body = await res.clone().text();
          sessionStorage.setItem('__qa_lead_response', JSON.stringify({ status: res.status, body }));
        }
      } catch {
        /* ignore */
      }
      return res;
    };
  });
  page.on('request', (r) => {
    sink.requests.push(r.url());
    if (r.url().includes('/api/lead') && r.method() === 'POST') {
      try {
        sink.posts.push(JSON.parse(r.postData() || '{}'));
      } catch {
        sink.posts.push({ __unparseable: r.postData() });
      }
    }
  });
  page.on('response', (r) => {
    if (r.url().includes('/api/lead')) {
      r.json()
        .then((body) => sink.responses.push({ status: r.status(), body }))
        .catch(() => sink.responses.push({ status: r.status(), body: null }));
    }
  });
  page.on('pageerror', (e) => sink.errors.push(`[pageerror ${name}] ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    // a deliberate 400 from the hand-built POSTs logs "Failed to load resource"; not a page error
    if (sink.expect400 && /status of 400/.test(m.text())) return;
    sink.errors.push(`[console ${name}] ${m.text()}`);
  });
  return page;
}

const makeSink = () => ({ requests: [], posts: [], responses: [], errors: [], expect400: false });

async function open(page, path) {
  await page.goto(BASE + path, { waitUntil: 'networkidle0', timeout: 45000 });
  const title = await page.title();
  if (!title.includes(BRAND)) throw new Error(`title "${title}" lacks "${BRAND}" on ${path}: wrong server on ${BASE}?`);
  await settle(300);
}

async function waitStep(page, id, timeout = 8000) {
  try {
    await page.waitForSelector(`#start [data-step="${id}"]`, { timeout });
  } catch {
    const mounted = await page.evaluate(() => [...document.querySelectorAll('#start [data-step]')].map((e) => e.getAttribute('data-step')));
    throw new Error(`step "${id}" never mounted (mounted: ${mounted.join(',') || 'none'}; if every step misses in dev, rm -rf node_modules/.vite .astro and restart)`);
  }
  await settle(420); // auto-advance delay + slide
}

async function mountedStep(page) {
  return page.evaluate(() => document.querySelector('#start [data-step]')?.getAttribute('data-step') ?? '');
}

async function clickValue(page, value) {
  const ok = await page.evaluate((v) => {
    const el = document.querySelector(`#start [data-value="${v}"]`);
    if (!el) return false;
    el.scrollIntoView({ block: 'center' });
    el.click();
    return true;
  }, value);
  if (!ok) throw new Error(`no #start [data-value="${value}"] on step ${await mountedStep(page)}`);
}

async function clickAction(page, action) {
  const ok = await page.evaluate((a) => {
    const el = document.querySelector(`#start [data-action="${a}"]`);
    if (!el) return false;
    el.scrollIntoView({ block: 'center' });
    el.click();
    return true;
  }, action);
  if (!ok) throw new Error(`no #start [data-action="${action}"] on step ${await mountedStep(page)}`);
}

async function setRange(page, value) {
  await page.evaluate((v) => {
    const el = document.querySelector('#start #ff-range');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(el, String(v));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
  await settle(150);
}

async function typeInto(page, sel, text) {
  await page.waitForSelector(sel, { timeout: 8000 });
  await page.click(sel, { clickCount: 3 });
  await page.type(sel, text, { delay: 8 });
}

// Step 7 (2026-09-08): the typed Texas city between the fork and the contact
// step. Continue is disabled until 2+ chars; the value ships title-cased.
async function cityStep(page, city) {
  await waitStep(page, 'city');
  await typeInto(page, '#ff-city', city);
  await settle(120);
  await clickAction(page, 'continue');
}

async function isDisabled(page, action) {
  return page.evaluate((a) => document.querySelector(`#start [data-action="${a}"]`)?.disabled ?? null, action);
}

async function visibleError(page) {
  return page.evaluate(() => {
    const el = document.querySelector('#start [data-error]');
    if (!el) return '';
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1 ? el.textContent.trim() : '';
  });
}

async function stepLabel(page) {
  return page.evaluate(() => document.querySelector('#start [data-step-label]')?.textContent.trim() ?? '');
}

function shooter(page, vp) {
  return async (name) => {
    const file = `${SHOTS}walk-${vp.name}-${name}.png`;
    await page.screenshot({ path: file });
    console.log(`  shot ${file}`);
  };
}

async function submitAndLand(page) {
  const nav = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null);
  await clickAction(page, 'submit');
  await nav;
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (/\/thank-you/.test(page.url())) break;
    await settle(200);
  }
  await settle(700);
  return page.url();
}

// ---------------------------------------------------------------------------
// payload assertions
// ---------------------------------------------------------------------------
function expectedKeys(payload) {
  const attrs = ATTR_KEYS.filter((k) => k in payload);
  return [...HEAD_KEYS, ...attrs, ...TAIL_KEYS];
}

function checkPayloadShape(label, p, city = '') {
  const got = Object.keys(p);
  const want = expectedKeys(p);
  const missing = want.filter((k) => !got.includes(k));
  const extra = got.filter((k) => !want.includes(k));
  const sameOrder = got.length === want.length && got.every((k, i) => k === want[i]);
  check(`${label}: payload keys = BRIEF section 5 in order`, sameOrder && !missing.length && !extra.length,
    missing.length || extra.length ? `missing [${missing}] extra [${extra}]` : `${got.length} keys`);
  check(`${label}: no missing keys (null/'' allowed, absent not)`, missing.length === 0, missing.join(',') || 'none');
  check(`${label}: tcpaConsent === true`, p.tcpaConsent === true);
  check(`${label}: tcpaConsentText is ILD tcpaCopy verbatim`,
    typeof p.tcpaConsentText === 'string' &&
      p.tcpaConsentText.startsWith(`By continuing you expressly consent to having ${BRAND} contact you about your inquiry by email, text message, or phone call at the number you provided`) &&
      p.tcpaConsentText.endsWith('Consent is not a condition of purchase or of receiving services and can be revoked at any time.'),
    `${String(p.tcpaConsentText).length} chars`);
  check(`${label}: tcpaConsentAt is an ISO click timestamp`, ISO.test(String(p.tcpaConsentAt)), String(p.tcpaConsentAt));
  check(`${label}: tcpaConsentUrl is the /start URL`, FORM_RE.test(String(p.tcpaConsentUrl)), String(p.tcpaConsentUrl));
  check(`${label}: landingPage = pathname + search`, FORM_PATH_RE.test(String(p.landingPage)), String(p.landingPage));
  check(`${label}: state Texas, city "${city}"`, p.state === 'Texas' && p.city === city, `${p.state} / ${p.city}`);
  check(`${label}: partial false, website ''`, p.partial === false && p.website === '');
  check(`${label}: variant b-t4-v1, source lenderdscr`, p.variant === 'b-t4-v1' && p.source === 'lenderdscr', `${p.variant}/${p.source}`);
  check(`${label}: phone is 10 digits`, /^\d{10}$/.test(String(p.phone)), String(p.phone));
  check(`${label}: secondsToComplete is a number`, typeof p.secondsToComplete === 'number', String(p.secondsToComplete));
  check(`${label}: submittedAt ISO`, ISO.test(String(p.submittedAt)));
  check(`${label}: consent click precedes submit`, ISO.test(String(p.tcpaConsentAt)) && ISO.test(String(p.submittedAt)) && Date.parse(p.tcpaConsentAt) <= Date.parse(p.submittedAt), `${p.tcpaConsentAt} <= ${p.submittedAt}`);
}

async function checkResponse(label, page, sink) {
  // primary: the in-page record (survives the navigation); fallback: puppeteer's listener
  let res = null;
  try {
    const raw = await page.evaluate(() => sessionStorage.getItem('__qa_lead_response'));
    if (raw) {
      const rec = JSON.parse(raw);
      res = { status: rec.status, body: JSON.parse(rec.body) };
    }
  } catch {
    res = null;
  }
  if (!res) res = sink.responses[sink.responses.length - 1] ?? null;
  if (LIVE) {
    check(`${label}: /api/lead answered {ok:true, forwarded:true} (live)`,
      !!res && res.status === 200 && !!res.body && res.body.ok === true && res.body.forwarded === true && !('testMode' in res.body),
      JSON.stringify(res));
    const posted = sink.posts[sink.posts.length - 1] || {};
    const hit = [...hookBodies].reverse().find((h) => h.body && h.body.firstName === posted.firstName && h.body.submittedAt === posted.submittedAt);
    check(`${label}: webhook received the same payload (firstName + submittedAt match)`, !!hit, `${hookBodies.length} hook bodies`);
    if (hit) {
      const b = hit.body;
      check(`${label}: webhook body is JSON at /hook`, hit.path === '/hook' && /application\/json/.test(hit.contentType), `${hit.path} ${hit.contentType}`);
      const browserKeys = Object.keys(posted);
      const hookKeys = Object.keys(b);
      check(`${label}: webhook keys = browser payload keys + tcpaConsentIp, tcpaConsentUserAgent, tcpaConsentReceivedAt`,
        hookKeys.join(',') === [...browserKeys, 'tcpaConsentIp', 'tcpaConsentUserAgent', 'tcpaConsentReceivedAt'].join(','),
        `${hookKeys.length} keys`);
      check(`${label}: server stamps present (UA string, ISO receivedAt, ip key)`,
        typeof b.tcpaConsentUserAgent === 'string' && b.tcpaConsentUserAgent.length > 10 && ISO.test(String(b.tcpaConsentReceivedAt)) && 'tcpaConsentIp' in b,
        `${String(b.tcpaConsentIp)} / ${String(b.tcpaConsentReceivedAt)}`);
      check(`${label}: webhook values equal the browser payload on every shared key`,
        browserKeys.every((k) => JSON.stringify(b[k]) === JSON.stringify(posted[k])),
        browserKeys.filter((k) => JSON.stringify(b[k]) !== JSON.stringify(posted[k])).join(',') || 'all equal');
    }
    return;
  }
  check(`${label}: /api/lead answered {ok:true, forwarded:false, testMode:true}`,
    !!res && res.status === 200 && !!res.body && res.body.ok === true && res.body.forwarded === false && res.body.testMode === true,
    JSON.stringify(res));
}

function checkNetwork(label, sink) {
  const hosts = new Set();
  for (const u of sink.requests) {
    try {
      const h = new URL(u).hostname;
      if (h) hosts.add(h);
    } catch {
      /* data: / about: */
    }
  }
  const foreign = [...hosts].filter((h) => h !== 'localhost' && h !== '127.0.0.1');
  if (LIVE) {
    // live mode: the deferred gtag.js loader is the ONE allowed foreign request
    // (it resolves to 127.0.0.1 under --host-resolver-rules and fails, so nothing
    // downstream of it ever loads); the Zap is called by the server, never the browser.
    const other = foreign.filter((h) => h !== 'www.googletagmanager.com');
    check(`${label}: only localhost + the gtag.js loader host requested (live)`, other.length === 0, other.join(',') || `${sink.requests.length} requests`);
    check(`${label}: no zapier / google-analytics / doubleclick request from the browser`, !sink.requests.some((u) => /zapier|google-analytics|doubleclick|googleadservices/.test(u)));
    return;
  }
  check(`${label}: every request stayed on localhost`, foreign.length === 0, foreign.join(',') || `${sink.requests.length} requests`);
  check(`${label}: no zapier / googletagmanager / google-analytics request`, !sink.requests.some((u) => /zapier|googletagmanager|google-analytics/.test(u)));
}

// ---------------------------------------------------------------------------
// walks
// ---------------------------------------------------------------------------
async function buyWalk(browser, vp) {
  const label = `${vp.name} buy`;
  console.log(`\n-- ${label}`);
  const sink = makeSink();
  const page = await newPage(browser, vp, sink);
  const shot = shooter(page, vp);
  // desktop carries attribution so the optional keys get exercised; mobile is bare
  await open(page, vp.name === 'desktop' ? formUrl('?gclid=QAGCLID123&utm_source=qa-walk&utm_campaign=split-b') : formUrl(''));

  await waitStep(page, 'goal');
  await shot('01-goal');
  check(`${label}: step 1 label reads "Step 1 of 9"`, (await stepLabel(page)) === 'Step 1 of 9', await stepLabel(page));
  if (vp.name === 'mobile') {
    // BRIEF section 8: /start at 390x844 shows the question and all of step 1's options
    const fold = await page.evaluate((h) => {
      const title = document.querySelector('#start [data-step-title]')?.getBoundingClientRect();
      const cards = [...document.querySelectorAll('#start [data-step="goal"] [data-value]')].map((c) => Math.round(c.getBoundingClientRect().bottom));
      return { titleBottom: title ? Math.round(title.bottom) : null, cardBottoms: cards, inFold: cards.length === 3 && cards.every((b) => b <= h) };
    }, vp.height);
    check(`${label}: mobile fold shows the question and all three step-1 options`, fold.inFold, JSON.stringify(fold));
  }
  await clickValue(page, 'purchase');
  await waitStep(page, 'stage');
  await shot('02-stage');
  await clickValue(page, 'actively-looking-at-properties');
  await waitStep(page, 'propertyType');
  await shot('03-property');
  await clickValue(page, 'sfr');
  await waitStep(page, 'credit');
  await shot('04-credit');
  await clickValue(page, '680-739');
  await waitStep(page, 'price');
  await shot('05-price');
  await setRange(page, 350000);
  await shot('05-price-350k');
  await clickAction(page, 'continue');
  await waitStep(page, 'secondary');
  const fork = await page.evaluate(() => document.querySelector('#start [data-step="secondary"]')?.getAttribute('data-fork'));
  check(`${label}: buy fork is the down slider`, fork === 'down', String(fork));
  await shot('06-down');
  await clickAction(page, 'continue');
  await waitStep(page, 'city');
  check(`${label}: down Continue lands on the city step (Step 7 of 9)`, (await stepLabel(page)) === 'Step 7 of 9', await stepLabel(page));
  const cityTitle = await page.evaluate(() => document.querySelector('#start [data-step-title]')?.textContent.trim());
  check(`${label}: buy city title`, cityTitle === 'Where in Texas are you buying?', String(cityTitle));
  check(`${label}: city Continue disabled while empty`, (await isDisabled(page, 'continue')) === true);
  await shot('07-city');
  await typeInto(page, '#ff-city', 'f');
  await settle(100);
  check(`${label}: city Continue still disabled at 1 char`, (await isDisabled(page, 'continue')) === true);
  await page.keyboard.press('Backspace'); // a triple-click cannot select a lone character reliably
  await typeInto(page, '#ff-city', 'fort worth');
  await settle(120);
  check(`${label}: city Continue enabled at 2+ chars`, (await isDisabled(page, 'continue')) === false);
  await shot('07-city-typed');
  // Enter guard on the city step too: two Enters advance exactly once
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await waitStep(page, 'contact');
  check(`${label}: double Enter on city advanced exactly one step (contact mounted)`, (await mountedStep(page)) === 'contact' && sink.posts.length === 0);
  await shot('08-contact');
  check(`${label}: contact Continue disabled while empty`, (await isDisabled(page, 'continue')) === true);
  await typeInto(page, '#ff-first', 'Quinn');
  await typeInto(page, '#ff-last', 'Walker');
  await typeInto(page, '#ff-email', 'qa@example.com');
  await settle(120);
  await shot('08-contact-filled');
  // Enter guard: two Enters in a row must advance exactly once (no skip, no submit)
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await waitStep(page, 'phone');
  check(`${label}: double Enter advanced exactly one step (phone mounted, 0 POSTs)`, (await mountedStep(page)) === 'phone' && sink.posts.length === 0, `${sink.posts.length} posts`);
  check(`${label}: phone step label reads "Step 9 of 9"`, (await stepLabel(page)) === 'Step 9 of 9', await stepLabel(page));
  const chips = await page.evaluate(() => [...document.querySelectorAll('#start [data-chips] span span')].map((c) => c.textContent.trim()));
  check(`${label}: recap chips = goal, property, "City, TX", price`, chips.join('|') === 'Buy a rental|Single-family|Fort Worth, TX|$350,000', chips.join('|'));
  const phoneSub = await page.evaluate(() => document.querySelector('#start [data-step="phone"] p')?.textContent.trim());
  check(`${label}: phone step carries the "will personally text and call you" line`, /loan officer will personally text and call you about your eligibility/.test(String(phoneSub)), String(phoneSub));
  await shot('09-phone');
  await typeInto(page, '#ff-phone', '5555550123');
  await settle(120);
  await shot('09-phone-typed');
  check(`${label}: submit disabled with consent unchecked`, (await isDisabled(page, 'submit')) === true);
  await clickAction(page, 'submit');
  await settle(400);
  check(`${label}: unchecked consent = zero POSTs, still on /start`, sink.posts.length === 0 && FORM_RE.test(page.url()), page.url());
  const checked = await page.evaluate(() => {
    const cb = document.querySelector('#ff-tcpa');
    cb.click();
    return cb.checked;
  });
  check(`${label}: consent box checks on click`, checked === true);
  await settle(200);
  const boxAboveSubmit = await page.evaluate(() => {
    const cb = document.querySelector('#ff-tcpa')?.getBoundingClientRect();
    const btn = document.querySelector('#start [data-action="submit"]')?.getBoundingClientRect();
    return !!cb && !!btn && cb.bottom <= btn.top;
  });
  check(`${label}: consent box sits above the submit button`, boxAboveSubmit);
  await shot('09-phone-consented');
  check(`${label}: submit enabled after consent`, (await isDisabled(page, 'submit')) === false);

  const url = await submitAndLand(page);
  check(`${label}: landed on /thank-you`, /\/thank-you/.test(url), url);
  check(`${label}: exactly one POST /api/lead`, sink.posts.length === 1, `${sink.posts.length}`);
  const p = sink.posts[0] || {};
  await checkResponse(label, page, sink);
  checkPayloadShape(label, p, 'Fort Worth'); // "fort worth" typed, title-cased on the way out
  check(`${label}: goal/goalLabel`, p.goal === 'purchase' && p.goalLabel === 'Buy a rental', `${p.goal}/${p.goalLabel}`);
  check(`${label}: stage slug + label`, p.stage === 'actively-looking-at-properties' && p.stageLabel === 'Actively looking at properties', `${p.stage}/${p.stageLabel}`);
  check(`${label}: propertyType sfr / Single-family`, p.propertyType === 'sfr' && p.propertyTypeLabel === 'Single-family', `${p.propertyType}/${p.propertyTypeLabel}`);
  check(`${label}: credit 680-739`, p.credit === '680-739', String(p.credit));
  check(`${label}: price 350000 / $350,000`, p.price === 350000 && p.priceDisplay === '$350,000', `${p.price}/${p.priceDisplay}`);
  check(`${label}: downPct 25 / 25% / 87500 / $87,500`, p.downPct === 25 && p.downPctDisplay === '25%' && p.downPayment === 87500 && p.downPaymentDisplay === '$87,500', `${p.downPct}/${p.downPctDisplay}/${p.downPayment}/${p.downPaymentDisplay}`);
  check(`${label}: refi/flip fields null`, p.balance === null && p.balanceDisplay === null && p.equity === null && p.equityDisplay === null && p.rehab === null && p.rehabDisplay === null);
  check(`${label}: scenarioDetail "25% down (about $87,500)"`, p.scenarioDetail === '25% down (about $87,500)', String(p.scenarioDetail));
  check(`${label}: names + email`, p.firstName === 'Quinn' && p.lastName === 'Walker' && p.email === 'qa@example.com', `${p.firstName} ${p.lastName} ${p.email}`);
  if (vp.name === 'desktop') {
    check(`${label}: attribution shipped (gclid, utm_source, utm_campaign) in order`, p.gclid === 'QAGCLID123' && p.utm_source === 'qa-walk' && p.utm_campaign === 'split-b' && !('utm_medium' in p), `${p.gclid}/${p.utm_source}/${p.utm_campaign}`);
    check(`${label}: landingPage carries the query`, FORM_QUERY_RE.test(String(p.landingPage)), String(p.landingPage));
  } else {
    check(`${label}: no attribution keys when none present`, !ATTR_KEYS.some((k) => k in p));
  }
  writeFileSync(`${SHOTS}walk-payload-${vp.name}-buy.json`, JSON.stringify(p, null, 2));

  // thank-you personalization + storage side effects
  const ty = await page.evaluate(() => {
    let leads = [];
    let summary = null;
    try {
      leads = JSON.parse(localStorage.getItem('ild_variant_test_leads') || '[]');
    } catch {}
    try {
      summary = JSON.parse(sessionStorage.getItem('lead-summary') || 'null');
    } catch {}
    return {
      name: document.querySelector('#ty-name')?.textContent.trim() ?? null,
      chips: document.querySelectorAll('#ty-chips .lo-chip').length,
      leads: leads.length,
      summaryKeys: summary ? Object.keys(summary) : [],
      summary,
    };
  });
  check(`${label}: /thank-you H1 personalized with the first name`, !!ty.name && ty.name.includes('Quinn'), String(ty.name));
  check(`${label}: /thank-you chips rendered`, ty.chips > 0, `${ty.chips} chips`);
  if (LIVE) {
    check(`${label}: live mode keeps no test lead in localStorage`, ty.leads === 0, `${ty.leads}`);
  } else {
    check(`${label}: localStorage ild_variant_test_leads holds the lead`, ty.leads >= 1, `${ty.leads}`);
  }
  check(`${label}: lead-summary keys per BRIEF`, ty.summaryKeys.join(',') === 'firstName,goal,goalLabel,propertyType,propertyTypeLabel,credit,price,priceDisplay,state', ty.summaryKeys.join(','));
  check(`${label}: lead-summary state Texas + priceDisplay`, ty.summary?.state === 'Texas' && ty.summary?.priceDisplay === '$350,000');
  await shot('10-thank-you');

  if (LIVE) {
    // live mode: the page carries the gtag stub + loader and the conversion pushes
    // into the (never-drained) dataLayer because gtag.js cannot load here.
    const gt = await page.evaluate(() => {
      const dl = Array.isArray(window.dataLayer) ? window.dataLayer : [];
      const conv = dl.filter((e) => e && e[0] === 'event' && e[1] === 'conversion').map((e) => e[2] && e[2].send_to);
      const stub = [...document.head.querySelectorAll('script')].some((s) => /dataLayer.*gtag\('config'/.test(s.textContent || ''));
      const loader = [...document.head.querySelectorAll('script')].some((s) => /window\.addEventListener\('load'.*googletagmanager\.com\/gtag\/js/.test(s.textContent || ''));
      return { conv, stub, loader, fired: sessionStorage.getItem('conv_fired') };
    });
    check(`${label}: /thank-you head carries the dataLayer stub + deferred gtag loader (live)`, gt.stub && gt.loader, JSON.stringify({ stub: gt.stub, loader: gt.loader }));
    check(`${label}: one conversion event pushed for the accepted lead (no ?qa=1 on this walk)`, gt.conv.length === 1 && gt.conv[0] === 'AW-16956033989/cwbHCNCflbAaEMWXopU_' && gt.fired === '1', JSON.stringify(gt.conv));
  } else {
    // /test-leads lists it
    await open(page, '/test-leads');
    await page.waitForSelector('[data-lead-count]', { timeout: 8000 });
    await settle(300);
    const count = await page.evaluate(() => Number(document.querySelector('[data-lead-count]')?.getAttribute('data-lead-count')));
    check(`${label}: /test-leads lists the captured lead`, count >= 1, `${count}`);
    await shot('11-test-leads');
  }

  checkNetwork(label, sink);
  await page.close();
  return sink;
}

async function preselectAndForks(browser, vp) {
  const label = `${vp.name} preselect/forks`;
  console.log(`\n-- ${label}`);
  const sink = makeSink();
  const page = await newPage(browser, vp, sink);
  const shot = shooter(page, vp);

  // preselect: opens on step 2, Back returns to a highlighted step 1
  await open(page, formUrl('?goal=refinance'));
  await waitStep(page, 'stage');
  check(`${label}: /start?goal=refinance opens on step 2`, (await mountedStep(page)) === 'stage' && (await stepLabel(page)) === 'Step 2 of 9', await stepLabel(page));
  await shot('preselect-stage');
  await clickAction(page, 'back');
  await waitStep(page, 'goal');
  const highlighted = await page.evaluate(() => document.querySelector('#start [data-value="refinance"]')?.getAttribute('data-selected'));
  check(`${label}: Back from step 2 highlights Refinance on step 1`, highlighted === 'true', String(highlighted));
  await shot('preselect-back');

  // refi path with the $3M+ edge and the balance fork
  await clickValue(page, 'refinance');
  await waitStep(page, 'stage');
  await clickValue(page, 'comparing-lenders');
  await waitStep(page, 'propertyType');
  await clickValue(page, 'condo');
  await waitStep(page, 'credit');
  await clickValue(page, '740+');
  await waitStep(page, 'price');
  const refiTitle = await page.evaluate(() => document.querySelector('#start [data-step-title]')?.textContent.trim());
  check(`${label}: refi price title`, refiTitle === "About what's the property worth?", String(refiTitle));
  await setRange(page, 3000000);
  await shot('refi-price-3m');
  await clickAction(page, 'continue');
  await waitStep(page, 'secondary');
  const refiFork = await page.evaluate(() => document.querySelector('#start [data-step="secondary"]')?.getAttribute('data-fork'));
  check(`${label}: refi fork = balance options`, refiFork === 'balance', String(refiFork));
  await shot('fork-refi');
  await clickValue(page, 'less-than-50');
  await waitStep(page, 'city');
  const refiCity = await page.evaluate(() => document.querySelector('#start [data-step-title]')?.textContent.trim());
  check(`${label}: refi city title`, refiCity === 'Where in Texas is the property?', String(refiCity));
  await shot('city-refi');
  await cityStep(page, 'Austin');
  await waitStep(page, 'contact');
  await typeInto(page, '#ff-first', 'Riley');
  await typeInto(page, '#ff-last', 'Refi');
  await typeInto(page, '#ff-email', 'refi@example.com');
  await clickAction(page, 'continue');
  await waitStep(page, 'phone');
  await typeInto(page, '#ff-phone', '5555550124');
  await page.evaluate(() => document.querySelector('#ff-tcpa').click());
  await settle(200);
  const refiUrl = await submitAndLand(page);
  check(`${label}: refi submit landed on /thank-you`, /\/thank-you/.test(refiUrl), refiUrl);
  const r = sink.posts[sink.posts.length - 1] || {};
  await checkResponse(`${label} refi`, page, sink);
  checkPayloadShape(`${label} refi`, r, 'Austin');
  check(`${label}: refi goal/goalLabel`, r.goal === 'refinance' && r.goalLabel === 'Refinance', `${r.goal}/${r.goalLabel}`);
  check(`${label}: refi price string '3000000+' / '$3,000,000+'`, r.price === '3000000+' && r.priceDisplay === '$3,000,000+', `${r.price}/${r.priceDisplay}`);
  check(`${label}: refi balanceDisplay + scenarioDetail`, r.balance === null && r.balanceDisplay === 'Less than 50%' && r.equity === null && r.equityDisplay === null && r.scenarioDetail === 'Owes: Less than 50% of the value', `${r.balanceDisplay} / ${r.scenarioDetail}`);
  check(`${label}: refi buy/flip fields null`, r.downPct === null && r.downPctDisplay === null && r.downPayment === null && r.downPaymentDisplay === null && r.rehab === null && r.rehabDisplay === null);
  check(`${label}: refi propertyType condo`, r.propertyType === 'condo' && r.propertyTypeLabel === 'Townhome or condo');
  writeFileSync(`${SHOTS}walk-payload-${vp.name}-refi.json`, JSON.stringify(r, null, 2));

  // flip path: rehab fork
  await open(page, formUrl('?goal=bridge'));
  await waitStep(page, 'stage');
  await clickValue(page, 'deal-under-contract');
  await waitStep(page, 'propertyType');
  await clickValue(page, '2-4');
  await waitStep(page, 'credit');
  await clickValue(page, '620-679');
  await waitStep(page, 'price');
  const flipTitle = await page.evaluate(() => document.querySelector('#start [data-step-title]')?.textContent.trim());
  check(`${label}: flip price title`, flipTitle === "About what's the purchase price?", String(flipTitle));
  await clickAction(page, 'continue');
  await waitStep(page, 'secondary');
  const flipFork = await page.evaluate(() => document.querySelector('#start [data-step="secondary"]')?.getAttribute('data-fork'));
  check(`${label}: flip fork = rehab options`, flipFork === 'rehab', String(flipFork));
  await shot('fork-flip');
  await clickValue(page, '25k-to-50k');
  await waitStep(page, 'city');
  const flipCity = await page.evaluate(() => document.querySelector('#start [data-step-title]')?.textContent.trim());
  check(`${label}: flip city title`, flipCity === 'Where in Texas are you flipping?', String(flipCity));
  await cityStep(page, 'san antonio');
  await waitStep(page, 'contact');
  await typeInto(page, '#ff-first', 'Finn');
  await typeInto(page, '#ff-last', 'Flip');
  await typeInto(page, '#ff-email', 'flip@example.com');
  await clickAction(page, 'continue');
  await waitStep(page, 'phone');
  await typeInto(page, '#ff-phone', '5555550125');
  await page.evaluate(() => document.querySelector('#ff-tcpa').click());
  await settle(200);
  const flipUrl = await submitAndLand(page);
  check(`${label}: flip submit landed on /thank-you`, /\/thank-you/.test(flipUrl), flipUrl);
  const f = sink.posts[sink.posts.length - 1] || {};
  await checkResponse(`${label} flip`, page, sink);
  checkPayloadShape(`${label} flip`, f, 'San Antonio'); // "san antonio" typed
  check(`${label}: flip goal bridge / Fix & Flip/Hold`, f.goal === 'bridge' && f.goalLabel === 'Fix & Flip/Hold', `${f.goal}/${f.goalLabel}`);
  check(`${label}: flip rehabDisplay + scenarioDetail`, f.rehab === null && f.rehabDisplay === '$25K to $50K' && f.scenarioDetail === 'Rehab budget: $25K to $50K', `${f.rehabDisplay} / ${f.scenarioDetail}`);
  check(`${label}: flip buy/refi fields null`, f.downPct === null && f.downPayment === null && f.balance === null && f.balanceDisplay === null && f.equity === null && f.equityDisplay === null);
  check(`${label}: flip stage slug`, f.stage === 'deal-under-contract' && f.stageLabel === 'Deal under contract', `${f.stage}`);
  check(`${label}: flip price default 300000`, f.price === 300000 && f.priceDisplay === '$300,000', `${f.price}`);
  writeFileSync(`${SHOTS}walk-payload-${vp.name}-flip.json`, JSON.stringify(f, null, 2));

  checkNetwork(label, sink);
  await page.close();
  return sink;
}

async function kickout(browser, vp) {
  const label = `${vp.name} kick-out`;
  console.log(`\n-- ${label}`);
  const sink = makeSink();
  const page = await newPage(browser, vp, sink);
  const shot = shooter(page, vp);
  await open(page, formUrl(''));
  await waitStep(page, 'goal');
  await clickValue(page, 'purchase');
  await waitStep(page, 'stage');
  await clickValue(page, 'just-starting-my-research');
  await waitStep(page, 'propertyType');
  await clickValue(page, 'sfr');
  await waitStep(page, 'credit');
  await clickValue(page, '<620');
  await waitStep(page, 'kickout');
  check(`${label}: Below 620 mounts the in-form kick-out`, (await mountedStep(page)) === 'kickout');
  check(`${label}: kick-out shows Step 4 of 9`, (await stepLabel(page)) === 'Step 4 of 9', await stepLabel(page));
  const href = await page.evaluate(() => document.querySelector('#start [data-action="not-yet"]')?.getAttribute('href'));
  check(`${label}: kick-out links to /not-yet`, href === '/not-yet', String(href));
  check(`${label}: still on /start, zero POSTs`, FORM_RE.test(page.url()) && sink.posts.length === 0);
  await shot('kickout');
  await clickAction(page, 'back');
  await waitStep(page, 'credit');
  const anySelected = await page.evaluate(() => !!document.querySelector('#start [data-step="credit"] [data-selected="true"]'));
  check(`${label}: "I picked the wrong range" returns to credit with nothing selected`, !anySelected);
  checkNetwork(label, sink);
  await page.close();
}

async function failedPostRetry(browser, vp) {
  const label = `${vp.name} failed-POST retry`;
  console.log(`\n-- ${label}`);
  const sink = makeSink();
  const page = await newPage(browser, vp, sink);
  const shot = shooter(page, vp);
  let failed = 0;
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    try {
      if (r.url().includes('/api/lead') && r.method() === 'POST' && failed === 0) {
        failed++;
        r.respond({ status: 500, contentType: 'application/json', body: '{"ok":false,"error":"qa-induced"}' });
        return;
      }
      r.continue();
    } catch {
      /* already handled */
    }
  });
  await open(page, formUrl('?goal=purchase'));
  await waitStep(page, 'stage');
  await clickValue(page, 'made-an-offer-or-under-contract');
  await waitStep(page, 'propertyType');
  await clickValue(page, '5-9');
  await waitStep(page, 'credit');
  await clickValue(page, '740+');
  await waitStep(page, 'price');
  await clickAction(page, 'continue');
  await waitStep(page, 'secondary');
  await setRange(page, 50);
  await clickAction(page, 'continue');
  await cityStep(page, 'Plano');
  await waitStep(page, 'contact');
  await typeInto(page, '#ff-first', 'Retry');
  await typeInto(page, '#ff-last', 'Case');
  await typeInto(page, '#ff-email', 'retry@example.com');
  await clickAction(page, 'continue');
  await waitStep(page, 'phone');
  await typeInto(page, '#ff-phone', '5555550126');
  await page.evaluate(() => document.querySelector('#ff-tcpa').click());
  await settle(200);
  await clickAction(page, 'submit');
  await settle(1200);
  const err = await visibleError(page);
  check(`${label}: 500 shows the inline error`, /didn't go through/.test(err), err || 'no [data-error]');
  check(`${label}: still on /start after the failure`, FORM_RE.test(page.url()), page.url());
  check(`${label}: submit re-enabled for the retry`, (await isDisabled(page, 'submit')) === false);
  await shot('retry-error');
  const url = await submitAndLand(page);
  check(`${label}: retry landed on /thank-you`, /\/thank-you/.test(url), url);
  check(`${label}: two POSTs total (fail + retry)`, sink.posts.length === 2, `${sink.posts.length}`);
  const p = sink.posts[1] || {};
  check(`${label}: 50%+ down ships downPct 50 / '50%+'`, p.downPct === 50 && p.downPctDisplay === '50%+' && p.downPayment === 150000 && p.scenarioDetail === '50%+ down (about $150,000)', `${p.downPct}/${p.downPctDisplay}/${p.downPayment}/${p.scenarioDetail}`);
  checkNetwork(label, sink);
  await page.close();
}

// Back from every step 2..7 returns to the previous step with the pick still
// highlighted; slider and typed values survive a round trip.
async function backNavigation(browser, vp) {
  const label = `${vp.name} back-nav`;
  console.log(`\n-- ${label}`);
  const sink = makeSink();
  const page = await newPage(browser, vp, sink);
  const shot = shooter(page, vp);
  const selectedOn = (step) => page.evaluate((s) => document.querySelector(`#start [data-step="${s}"] [data-selected="true"]`)?.getAttribute('data-value') ?? null, step);
  await open(page, formUrl(''));
  await waitStep(page, 'goal');
  await clickValue(page, 'purchase');
  await waitStep(page, 'stage');
  await clickValue(page, 'actively-looking-at-properties');
  await waitStep(page, 'propertyType');
  await clickValue(page, 'condo');
  await waitStep(page, 'credit');
  await clickValue(page, '740+');
  await waitStep(page, 'price');
  await setRange(page, 400000);
  await clickAction(page, 'continue');
  await waitStep(page, 'secondary');
  await setRange(page, 30);
  await clickAction(page, 'continue');
  await cityStep(page, 'McKinney');
  await waitStep(page, 'contact');
  await typeInto(page, '#ff-first', 'Back');
  await typeInto(page, '#ff-last', 'Walker');
  await typeInto(page, '#ff-email', 'back@example.com');
  await clickAction(page, 'continue');
  await waitStep(page, 'phone');
  check(`${label}: reached the phone step`, (await stepLabel(page)) === 'Step 9 of 9', await stepLabel(page));

  await clickAction(page, 'back');
  await waitStep(page, 'contact');
  const contact = await page.evaluate(() => ({
    first: document.querySelector('#ff-first')?.value,
    last: document.querySelector('#ff-last')?.value,
    email: document.querySelector('#ff-email')?.value,
  }));
  check(`${label}: Back from phone keeps the typed contact fields`, contact.first === 'Back' && contact.last === 'Walker' && contact.email === 'back@example.com', JSON.stringify(contact));
  check(`${label}: contact step reads Step 8 of 9`, (await stepLabel(page)) === 'Step 8 of 9', await stepLabel(page));
  await shot('back-08-contact');

  await clickAction(page, 'back');
  await waitStep(page, 'city');
  const cityKept = await page.evaluate(() => document.querySelector('#ff-city')?.value);
  check(`${label}: Back from contact keeps the typed city`, cityKept === 'McKinney', String(cityKept));
  check(`${label}: city step reads Step 7 of 9`, (await stepLabel(page)) === 'Step 7 of 9', await stepLabel(page));
  await shot('back-07-city');

  await clickAction(page, 'back');
  await waitStep(page, 'secondary');
  const down = await page.evaluate(() => ({
    display: document.querySelector('#start [data-down-display]')?.textContent.trim(),
    range: document.querySelector('#start #ff-range')?.value,
  }));
  check(`${label}: Back from contact keeps the 30% down pick`, down.display === '30%' && down.range === '30', JSON.stringify(down));
  await shot('back-06-down');

  await clickAction(page, 'back');
  await waitStep(page, 'price');
  const price = await page.evaluate(() => ({
    display: document.querySelector('#start [data-price-display]')?.textContent.trim(),
    range: document.querySelector('#start #ff-range')?.value,
  }));
  check(`${label}: Back from the fork keeps the $400,000 price`, price.display === '$400,000' && price.range === '400000', JSON.stringify(price));
  await shot('back-05-price');

  await clickAction(page, 'back');
  await waitStep(page, 'credit');
  check(`${label}: Back from price highlights 740+`, (await selectedOn('credit')) === '740+', String(await selectedOn('credit')));
  check(`${label}: credit step reads Step 4 of 9`, (await stepLabel(page)) === 'Step 4 of 9', await stepLabel(page));
  // sticky-hover guard: only the selected card wears the gold border (the pointer
  // is parked over another card after the typed steps; on touch that hover must not paint)
  const borders = await page.evaluate(() =>
    [...document.querySelectorAll('#start [data-step="credit"] [data-value]')].map((c) => ({
      v: c.getAttribute('data-value'),
      gold: getComputedStyle(c).borderColor !== 'rgb(219, 229, 236)', // #dbe5ec, the ILD-theme resting border (2026-09-08)
      hoverMedia: matchMedia('(hover: hover)').matches,
    }))
  );
  if (vp.name === 'mobile') {
    check(`${label}: touch emulation reports (hover: none)`, borders.every((b) => !b.hoverMedia));
    check(`${label}: only the selected credit card carries the gold border on touch`, borders.filter((b) => b.gold).map((b) => b.v).join(',') === '740+', JSON.stringify(borders.map((b) => `${b.v}:${b.gold}`)));
  }
  await shot('back-04-credit');

  await clickAction(page, 'back');
  await waitStep(page, 'propertyType');
  check(`${label}: Back from credit highlights Townhome or condo`, (await selectedOn('propertyType')) === 'condo', String(await selectedOn('propertyType')));
  await shot('back-03-property');

  await clickAction(page, 'back');
  await waitStep(page, 'stage');
  check(`${label}: Back from property highlights the stage pick`, (await selectedOn('stage')) === 'actively-looking-at-properties', String(await selectedOn('stage')));

  await clickAction(page, 'back');
  await waitStep(page, 'goal');
  check(`${label}: Back from stage highlights Buy a rental`, (await selectedOn('goal')) === 'purchase', String(await selectedOn('goal')));
  check(`${label}: step 1 has no Back button`, (await page.evaluate(() => !document.querySelector('#start [data-action="back"]'))));
  await shot('back-01-goal');

  // forward again: the retained answers carry through to the phone step in four picks
  await clickValue(page, 'purchase');
  await waitStep(page, 'stage');
  await clickValue(page, 'actively-looking-at-properties');
  await waitStep(page, 'propertyType');
  await clickValue(page, 'condo');
  await waitStep(page, 'credit');
  await clickValue(page, '740+');
  await waitStep(page, 'price');
  await clickAction(page, 'continue');
  await waitStep(page, 'secondary');
  await clickAction(page, 'continue');
  await waitStep(page, 'city');
  check(`${label}: forward again reaches city with the value retained`, (await page.evaluate(() => document.querySelector('#ff-city')?.value)) === 'McKinney');
  await clickAction(page, 'continue');
  await waitStep(page, 'contact');
  const again = await page.evaluate(() => document.querySelector('#ff-email')?.value);
  check(`${label}: forward again reaches contact with the email retained`, again === 'back@example.com', String(again));
  check(`${label}: zero POSTs during back navigation`, sink.posts.length === 0, `${sink.posts.length}`);
  checkNetwork(label, sink);
  await page.close();
  return sink;
}

// Hand-built POSTs straight at /api/lead from the page context (same origin):
// every server gate must hold without the form in front of it.
async function handBuiltPosts(browser, vp) {
  const label = `${vp.name} hand-built POST`;
  console.log(`\n-- ${label}`);
  const sink = makeSink();
  sink.expect400 = true;
  const page = await newPage(browser, vp, sink);
  await open(page, formUrl(''));
  const base = {
    goal: 'purchase', goalLabel: 'Buy a rental', stage: 'comparing-lenders', stageLabel: 'Comparing lenders',
    propertyType: 'sfr', propertyTypeLabel: 'Single-family', credit: '740+', price: 300000, priceDisplay: '$300,000',
    downPct: 25, downPctDisplay: '25%', downPayment: 75000, downPaymentDisplay: '$75,000',
    balance: null, balanceDisplay: null, equity: null, equityDisplay: null, rehab: null, rehabDisplay: null,
    scenarioDetail: '25% down (about $75,000)', city: '', state: 'Texas',
    firstName: 'Hand', lastName: 'Built', email: 'hand@example.com', phone: '5555550199', partial: false,
    tcpaConsent: true, tcpaConsentText: 'x', tcpaConsentAt: new Date().toISOString(), tcpaConsentUrl: 'http://localhost/start',
    landingPage: '/start', secondsToComplete: 5, website: '', submittedAt: new Date().toISOString(),
    variant: 'b-t4-v1', source: 'ild-split-test',
  };
  const post = (body) =>
    page.evaluate(async (b) => {
      const res = await fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
      let json = null;
      try {
        json = await res.json();
      } catch {}
      return { status: res.status, json };
    }, body);

  const noConsent = await post({ ...base, tcpaConsent: false });
  check(`${label}: tcpaConsent false = 400 consent required`, noConsent.status === 400 && noConsent.json?.ok === false && /consent/.test(String(noConsent.json?.error)), JSON.stringify(noConsent));
  const missingConsent = await post((() => { const b = { ...base }; delete b.tcpaConsent; return b; })());
  check(`${label}: tcpaConsent absent = 400`, missingConsent.status === 400 && /consent/.test(String(missingConsent.json?.error)), JSON.stringify(missingConsent));
  const stringConsent = await post({ ...base, tcpaConsent: 'true' });
  check(`${label}: tcpaConsent "true" (string) = 400`, stringConsent.status === 400, JSON.stringify(stringConsent));
  const honeypot = await post({ ...base, website: 'http://spam.example' });
  check(`${label}: honeypot filled = silent 200 without testMode`, honeypot.status === 200 && honeypot.json?.ok === true && !('testMode' in (honeypot.json || {})), JSON.stringify(honeypot));
  const sub620 = await post({ ...base, credit: '<620' });
  check(`${label}: credit <620 = silent 200 without testMode`, sub620.status === 200 && sub620.json?.ok === true && !('testMode' in (sub620.json || {})), JSON.stringify(sub620));
  const noPhone = await post({ ...base, phone: '' });
  check(`${label}: missing phone = 400 incomplete lead`, noPhone.status === 400 && /incomplete/.test(String(noPhone.json?.error)), JSON.stringify(noPhone));
  const badEmail = await post({ ...base, email: 'nope' });
  check(`${label}: bad email = 400 incomplete lead`, badEmail.status === 400 && /incomplete/.test(String(badEmail.json?.error)), JSON.stringify(badEmail));
  const badJson = await page.evaluate(async () => {
    const res = await fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{nope' });
    return res.status;
  });
  check(`${label}: malformed JSON = 400`, badJson === 400, String(badJson));
  const full = await post(base);
  if (LIVE) {
    check(`${label}: complete consented lead = {ok:true, forwarded:true} (live)`, full.status === 200 && full.json?.ok === true && full.json?.forwarded === true && !('testMode' in (full.json || {})), JSON.stringify(full));
    const hookHits = hookBodies.filter((h) => h.body && h.body.firstName === base.firstName && h.body.email === base.email).length;
    check(`${label}: exactly one webhook hit for the hand-built lead (gated POSTs never reached the hook)`, hookHits === 1, `${hookHits}`);
  } else {
    check(`${label}: complete consented lead = {ok:true, forwarded:false, testMode:true}`, full.status === 200 && full.json?.ok === true && full.json?.forwarded === false && full.json?.testMode === true, JSON.stringify(full));
  }
  checkNetwork(label, sink);
  await page.close();
  return sink;
}

// ---------------------------------------------------------------------------
// run
// ---------------------------------------------------------------------------
console.log(`form-walk: ${BASE}`);
const allErrors = [];
for (const vp of Object.values(VIEWPORTS)) {
  if (only && only !== vp.name) continue;
  console.log(`\n== ${vp.name} ${vp.width}x${vp.height} ==`);
  const { name, ...viewport } = vp;
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    defaultViewport: viewport,
    args: [
      '--hide-scrollbars', '--force-color-profile=srgb', '--window-size=1500,1000', '--no-first-run', '--no-default-browser-check',
      // live mode: hermetic browser; every non-localhost host dead-ends on 127.0.0.1
      ...(LIVE ? ['--host-resolver-rules=MAP * 127.0.0.1, EXCLUDE localhost'] : []),
    ],
  });
  try {
    const walks = [buyWalk, preselectAndForks, kickout, failedPostRetry, backNavigation];
    if (vp.name === 'desktop') walks.push(handBuiltPosts); // server gates are viewport-independent
    for (const fn of walks) {
      try {
        const sink = await fn(browser, vp);
        if (sink?.errors?.length) allErrors.push(...sink.errors);
      } catch (e) {
        check(`${vp.name} ${fn.name}: completed`, false, e.message);
      }
    }
  } finally {
    await browser.close();
  }
}

const pageErrors = allErrors.filter((e) => e.startsWith('[pageerror'));
if (allErrors.length) console.log(`\nbrowser errors:\n  ${allErrors.join('\n  ')}`);
check('no uncaught page errors during the walks', pageErrors.length === 0, `${pageErrors.length}`);
if (LIVE) {
  check('live mode: the webhook host saw only /hook POSTs', hookBodies.every((h) => h.path === '/hook' && h.body), `${hookBodies.length} bodies`);
  hookServer?.close();
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed${failed.length ? `\nFAILED:\n  ${failed.map((f) => f.label).join('\n  ')}` : ''}`);
process.exit(failed.length ? 1 : 0);

// Live-mode Google Ads tag check (2026-09-09 go-live). Works against the dev
// server or any deployed origin (QA_BASE). The browser is hermetic: every host
// except localhost and the target resolves to 127.0.0.1, so gtag.js never loads
// and `gtag` stays the head stub that queues into window.dataLayer. That queue
// is what we read. Proves:
//   - / carries the dataLayer stub + gtag('config', AW-16956033989) inline in <head>
//   - the gtag.js loader request is made after the load event (deferred), not before
//   - every page carries <meta name="robots" content="noindex, nofollow"> (seo.noindexSite)
//   - /thank-you bare: no conversion
//   - /thank-you after a real submit (lead-summary seeded): exactly one conversion, once per tab
//   - /thank-you with ?qa=1 on the session: zero conversions
//   - /thank-you?demo=1: one conversion (Tag Assistant path)
//
//   node tools/gtag-live-check.mjs                     # dev server on 4332
//   QA_BASE=https://go.lenderdscr.com node tools/gtag-live-check.mjs
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const BASE = (process.env.QA_BASE || 'http://localhost:4332').replace(/\/+$/, '');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const HOST = new URL(BASE).hostname;
const GTAG_ID = 'AW-16956033989';
const CONV = 'AW-16956033989/cwbHCNCflbAaEMWXopU_';
const BRAND = 'Internet Loans Direct';

const results = [];
const check = (label, ok, detail = '') => {
  results.push({ label, ok });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
  return ok;
};
const settle = (ms) => new Promise((r) => setTimeout(r, ms));
if (!existsSync(CHROME)) {
  console.error(`Chrome not found at ${CHROME}`);
  process.exit(1);
}

const SUMMARY = JSON.stringify({ firstName: 'Quinn', goal: 'purchase', goalLabel: 'Buy a rental', propertyType: 'sfr', propertyTypeLabel: 'Single-family', credit: '680-739', price: 350000, priceDisplay: '$350,000', state: 'Texas' });

async function fresh(browser) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  const requests = [];
  page.on('request', (r) => requests.push({ url: r.url() }));
  // In-page timing (puppeteer's own load event arrives after the page's load
  // listeners have already run): when did load fire, and when was a gtag.js
  // <script> appended to the head, in performance.now() ms.
  await page.evaluateOnNewDocument(() => {
    window.__qa = { loadAt: 0, gtagAppendedAt: 0, appended: 0 };
    window.addEventListener('load', () => (window.__qa.loadAt = performance.now()));
    new MutationObserver((muts) => {
      for (const m of muts) {
        for (const n of m.addedNodes) {
          if (n.tagName === 'SCRIPT' && /googletagmanager\.com\/gtag\/js/.test(n.src || '')) {
            window.__qa.appended++;
            if (!window.__qa.gtagAppendedAt) window.__qa.gtagAppendedAt = performance.now();
          }
        }
      }
    }).observe(document, { childList: true, subtree: true }); // documentElement is null this early
  });
  const goto = async (path) => {
    await page.goto(BASE + path, { waitUntil: 'networkidle0', timeout: 45000 }).catch(() => {});
    const title = await page.title();
    if (!title.includes(BRAND)) throw new Error(`title "${title}" lacks "${BRAND}" on ${path}`);
    await settle(800);
  };
  const convs = () =>
    page.evaluate(() => {
      const dl = Array.isArray(window.dataLayer) ? window.dataLayer : [];
      return dl.filter((e) => e && e[0] === 'event' && e[1] === 'conversion').map((e) => e[2] && e[2].send_to);
    });
  const robots = () => page.evaluate(() => document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '');
  return { ctx, page, requests, goto, convs, robots };
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-first-run', '--no-default-browser-check', `--host-resolver-rules=MAP * 127.0.0.1, EXCLUDE localhost, EXCLUDE ${HOST}`],
});
console.log(`gtag-live-check: ${BASE}`);
try {
  // 1. landing page: stub, deferred loader, robots
  {
    const t = await fresh(browser);
    await t.goto('/');
    const head = await t.page.evaluate(() => {
      const scripts = [...document.head.querySelectorAll('script')].map((s) => s.textContent || '');
      const stub = scripts.some((s) => s.includes('window.dataLayer=window.dataLayer||[]') && s.includes(`gtag('config','${'AW-16956033989'}')`));
      const loader = scripts.some((s) => /addEventListener\('load'/.test(s) && s.includes('googletagmanager.com/gtag/js?id=AW-16956033989'));
      const dlLen = Array.isArray(window.dataLayer) ? window.dataLayer.length : -1;
      const gtagFn = typeof window.gtag;
      return { stub, loader, dlLen, gtagFn, timing: window.__qa };
    });
    check('/: inline dataLayer stub + gtag config in <head>', head.stub, `dataLayer len ${head.dlLen}, gtag ${head.gtagFn}`);
    check('/: gtag.js loader is the deferred window-load pattern', head.loader);
    // the SERVER html must not carry a static googletagmanager <script src>
    // (the loader appends one at runtime, which is the point)
    const html = await t.page.evaluate(async () => (await fetch(location.href, { cache: 'no-store' })).text());
    check('/: server HTML has no static googletagmanager <script src>', !/<script[^>]+src=["']https:\/\/www\.googletagmanager\.com/i.test(html));
    const gtReqs = t.requests.filter((r) => /googletagmanager\.com\/gtag\/js\?id=AW-16956033989/.test(r.url)).length;
    const tm = head.timing || {};
    check('/: gtag.js appended once, at or after the load event (deferred)', gtReqs === 1 && tm.appended === 1 && tm.loadAt > 0 && tm.gtagAppendedAt >= tm.loadAt, `requests ${gtReqs}, load ${Math.round(tm.loadAt)}ms, appended ${Math.round(tm.gtagAppendedAt)}ms`);
    check('/: robots meta = noindex, nofollow (seo.noindexSite)', (await t.robots()) === 'noindex, nofollow', await t.robots());
    check('/: dataLayer has js + config, no conversion', (await t.convs()).length === 0 && head.dlLen >= 2, `${head.dlLen} entries`);
    for (const p of ['/start', '/thank-you', '/not-yet', '/privacy']) {
      await t.goto(p);
      check(`${p}: robots meta = noindex, nofollow`, (await t.robots()) === 'noindex, nofollow', await t.robots());
    }
    await t.ctx.close();
  }
  // 2. bare thank-you: nothing
  {
    const t = await fresh(browser);
    await t.goto('/thank-you');
    const c = await t.convs();
    check('/thank-you bare: zero conversions', c.length === 0, JSON.stringify(c));
    const view = await t.page.evaluate(() => (window.dataLayer || []).some((e) => e && e.event === 'thank_you_view' && e.lead === false));
    check('/thank-you bare: thank_you_view pushed with lead=false', view);
    await t.ctx.close();
  }
  // 3. real submission path: one conversion, once per tab
  {
    const t = await fresh(browser);
    await t.goto('/');
    await t.page.evaluate((s) => sessionStorage.setItem('lead-summary', s), SUMMARY);
    await t.goto('/thank-you');
    const c = await t.convs();
    check('/thank-you with lead-summary: exactly one conversion to the ILD label', c.length === 1 && c[0] === CONV, JSON.stringify(c));
    check('/thank-you: conv_fired set for the tab', (await t.page.evaluate(() => sessionStorage.getItem('conv_fired'))) === '1');
    const name = await t.page.evaluate(() => document.querySelector('#ty-name')?.textContent.trim());
    check('/thank-you: personalized H1', !!name && name.includes('Quinn'), String(name));
    await t.goto('/thank-you');
    const again = await t.convs();
    check('/thank-you reload in the same tab: zero new conversions (once per tab)', again.length === 0, JSON.stringify(again));
    await t.ctx.close();
  }
  // 4. ?qa=1 session: suppressed
  {
    const t = await fresh(browser);
    await t.goto('/?qa=1');
    check('/?qa=1: sessionStorage.qa = 1', (await t.page.evaluate(() => sessionStorage.getItem('qa'))) === '1');
    await t.page.evaluate((s) => sessionStorage.setItem('lead-summary', s), SUMMARY);
    await t.goto('/thank-you');
    const c = await t.convs();
    check('/thank-you after ?qa=1: zero conversions (QA suppression)', c.length === 0, JSON.stringify(c));
    check('/thank-you after ?qa=1: conv_fired NOT set', (await t.page.evaluate(() => sessionStorage.getItem('conv_fired'))) === null);
    await t.ctx.close();
  }
  // 5. ?demo=1 (Tag Assistant path)
  {
    const t = await fresh(browser);
    await t.goto('/thank-you?demo=1');
    const c = await t.convs();
    check('/thank-you?demo=1: one conversion (Tag Assistant path)', c.length === 1 && c[0] === CONV, JSON.stringify(c));
    await t.ctx.close();
  }
} finally {
  await browser.close();
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed${failed.length ? `\nFAILED:\n  ${failed.map((f) => f.label).join('\n  ')}` : ''}`);
process.exit(failed.length ? 1 : 0);

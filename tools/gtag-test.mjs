// Google Ads conversion gate test. The conversion must fire for a REAL lead
// and for ?demo=1 (Tag Assistant verification), and must NOT fire on a bare
// visit to /thank-you, or bots and stray loads inflate the conversion count.
//
// Intercepts the real googletagmanager request and records every gtag() call,
// so this proves what the browser actually does, not what the source says.
// Run with the dev server up: node tools/gtag-test.mjs
import puppeteer from 'puppeteer-core';

const base = 'http://localhost:4321';
const CONV = 'AW-16956033989/cwbHCNCflbAaEMWXopU_';
const TAG = 'AW-16956033989';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--hide-scrollbars'],
});

const settle = (ms) => new Promise((r) => setTimeout(r, ms));

// Loads a page with gtag stubbed BEFORE any script runs, and returns every
// gtag() call plus whether the real GTM script was requested.
async function probe(url, { seedLead = false } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const gtmRequests = [];
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    if (r.url().includes('googletagmanager.com/gtag/js')) {
      gtmRequests.push(r.url());
      // stub the real library so the recorder below is the only gtag
      r.respond({ status: 200, contentType: 'application/javascript', body: '' });
      return;
    }
    r.continue();
  });

  await page.evaluateOnNewDocument((seed) => {
    window.__calls = [];
    window.dataLayer = [];
    // the inline snippet defines gtag() itself; wrap dataLayer.push to record
    const origPush = window.dataLayer.push.bind(window.dataLayer);
    window.dataLayer.push = function (...args) {
      window.__calls.push([...args[0]]);
      return origPush(...args);
    };
    if (seed) {
      sessionStorage.setItem('lead-summary', JSON.stringify({
        firstName: 'GtagTest', goal: 'purchase', propertyType: 'sfr',
        state: 'Texas', price: 350000, credit: '700-739',
      }));
    }
  }, seedLead);

  // seeding sessionStorage needs a same-origin document first
  if (seedLead) {
    await page.goto(base, { waitUntil: 'domcontentloaded' });
  }
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await settle(1500);

  const calls = await page.evaluate(() => window.__calls || []);
  await page.close();
  return { calls, gtmRequests };
}

const fired = (calls) =>
  calls.some((c) => c[0] === 'event' && c[1] === 'conversion' && c[2]?.send_to === CONV);
const configured = (calls) => calls.some((c) => c[0] === 'config' && c[1] === TAG);

let pass = true;
const check = (label, actual, expected) => {
  const ok = actual === expected;
  if (!ok) pass = false;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: fired=${actual} (expect ${expected})`);
};

// 1. global tag loads site-wide
const home = await probe(base);
console.log(`global tag requested on home: ${home.gtmRequests.length > 0}`);
console.log(`gtag config ${TAG} on home   : ${configured(home.calls)}`);
console.log();

// 2. bare visit to thank-you must NOT convert
const bare = await probe(`${base}/thank-you`);
check('bare /thank-you visit', fired(bare.calls), false);

// 3. ?demo=1 must convert (Tag Assistant verification path)
const demo = await probe(`${base}/thank-you?demo=1`);
check('/thank-you?demo=1     ', fired(demo.calls), true);

// 4. real lead (lead-summary in sessionStorage) must convert
const real = await probe(`${base}/thank-you`, { seedLead: true });
check('real lead              ', fired(real.calls), true);

console.log();
console.log(pass ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED');
await browser.close();
process.exit(pass ? 0 : 1);

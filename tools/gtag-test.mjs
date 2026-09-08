// Google Ads conversion gate test (BRIEF section 13). Proves what the browser does, not what
// the source says: the real googletagmanager request is intercepted (and stubbed when a tag is
// set), and every dataLayer push / gtag() call is recorded from before the first page script.
//
// tracking.gtagId EMPTY  -> NEGATIVE contract only: no googletagmanager request on /, no
//   `conversion` push on /thank-you, /thank-you?demo=1, or the seeded-lead case. Prints
//   "SKIP positive cases: tracking.gtagId is empty" and exits 0 when the negatives hold.
// tracking.gtagId SET    -> full contract: config on /, conversion fires with a seeded lead and
//   with ?demo=1, NOT on a bare visit, NOT with seeded lead + sessionStorage.qa='1'.
// No localhost hooks, no config edits.
//
//   CI=true npm run dev ; node tools/gtag-test.mjs
import { QA_BASE, readSiteConfig, launchBrowser, openPage, seedLeadSummary, makeChecker, settle } from './qa-lib.mjs';

const site = readSiteConfig();
const { gtagId, gtagConversion } = site;
const { check, summary } = makeChecker();
const errors = [];
console.log(`gtag-test: ${QA_BASE}  brand "${site.brandName}"  gtagId "${gtagId || '(empty)'}"  conversion "${gtagConversion || '(empty)'}"\n`);

const browser = await launchBrowser({ name: 'desktop', width: 1280, height: 900, deviceScaleFactor: 1 });

// Records every dataLayer push, surviving `window.dataLayer = window.dataLayer || []` and a
// plain reassignment: the property is a getter/setter that re-wraps push on every assignment.
const recorder = (seed) => {
  window.__calls = [];
  const wrap = (arr) => {
    if (arr.__wrapped) return arr;
    const orig = arr.push.bind(arr);
    arr.push = function (...items) {
      for (const it of items) {
        try {
          // gtag() pushes an arguments object (array-like); GTM-style pushes are
          // plain objects. Array.from({}) is [] and would drop the event, so wrap
          // non-array-likes as a one-element entry instead.
          const arrayLike = it != null && typeof it === 'object' && typeof it.length === 'number';
          window.__calls.push(arrayLike ? Array.from(it) : [it]);
        } catch {
          window.__calls.push([String(it)]);
        }
      }
      return orig(...items);
    };
    Object.defineProperty(arr, '__wrapped', { value: true });
    return arr;
  };
  let dl = wrap([]);
  Object.defineProperty(window, 'dataLayer', {
    configurable: true,
    enumerable: true,
    get() {
      return dl;
    },
    set(v) {
      dl = wrap(Array.isArray(v) ? v : []);
    },
  });
  try {
    if (seed) for (const [k, v] of Object.entries(seed)) sessionStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
  } catch {
    /* private mode */
  }
};

async function probe(path, seed = null) {
  const gtmRequests = [];
  const page = await openPage(browser, path, {
    vp: { name: 'desktop', width: 1280, height: 900, deviceScaleFactor: 1 },
    errors,
    init: recorder,
    initArgs: [seed],
    posts: [],
    intercept: (r) => {
      if (r.url().includes('googletagmanager.com/gtag/js')) {
        gtmRequests.push(r.url());
        r.respond({ status: 200, contentType: 'application/javascript', body: '' });
        return true;
      }
      return false;
    },
    strictTitle: path === '/',
  });
  await settle(1800); // gtag.js is injected on window load; give the load handler time
  const calls = await page.evaluate(() => window.__calls || []);
  await page.close();
  return { calls, gtmRequests };
}

const isConversion = (c) => c[0] === 'event' && c[1] === 'conversion';
const fired = (calls) => calls.some((c) => isConversion(c) && (!gtagConversion || c[2]?.send_to === gtagConversion));
const anyConversion = (calls) => calls.some(isConversion);
const configured = (calls) => calls.some((c) => c[0] === 'config' && c[1] === gtagId);
const thankYouView = (calls) => calls.some((c) => c[0] === 'event' ? c[1] === 'thank_you_view' : c.some((x) => x && x.event === 'thank_you_view'));

const home = await probe('/');
const bare = await probe('/thank-you');
const demo = await probe('/thank-you?demo=1');
const real = await probe('/thank-you', { 'lead-summary': seedLeadSummary() });

if (!gtagId) {
  console.log('NEGATIVE contract (tracking.gtagId is empty):');
  check('no googletagmanager request on /', home.gtmRequests.length === 0, `${home.gtmRequests.length} requests`);
  check('no conversion push on bare /thank-you', !anyConversion(bare.calls));
  check('no conversion push on /thank-you?demo=1', !anyConversion(demo.calls));
  check('no conversion push with seeded lead-summary', !anyConversion(real.calls));
  console.log('SKIP positive cases: tracking.gtagId is empty');
} else {
  console.log('FULL contract (tracking.gtagId is set):');
  check('googletagmanager requested on / (after load)', home.gtmRequests.length > 0, `${home.gtmRequests.length} requests`);
  check(`gtag config ${gtagId} on /`, configured(home.calls));
  check('gtagConversion is set alongside gtagId', !!gtagConversion);
  check('bare /thank-you does NOT convert', !fired(bare.calls));
  check('/thank-you?demo=1 converts', fired(demo.calls));
  check('seeded lead-summary converts', fired(real.calls));
  const qa = await probe('/thank-you', { 'lead-summary': seedLeadSummary(), qa: '1' });
  check('seeded lead + sessionStorage.qa="1" does NOT convert', !fired(qa.calls));
  check('conversion send_to matches tracking.gtagConversion', demo.calls.filter(isConversion).every((c) => c[2]?.send_to === gtagConversion));
}
if (!thankYouView(real.calls)) console.log('      WARN no thank_you_view push recorded on the seeded /thank-you visit');

await browser.close();
const pageErrors = errors.filter((e) => e.startsWith('[pageerror'));
if (errors.length) console.log(`browser errors:\n  ${errors.join('\n  ')}`);
check('no uncaught page errors', pageErrors.length === 0, `${pageErrors.length}`);
process.exit(summary() ? 0 : 1);

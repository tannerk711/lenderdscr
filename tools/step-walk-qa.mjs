// Step-walk QA (BRIEF section 13). Drives the real island at 390x844 and asserts:
//   A. purchase path is 8 steps; every [data-step-title] is non-empty; no VISIBLE "Step N of T"
//   B. refinance branch titles (priceRefi, balance) and bridge branch titles (pricePurchase, rehab)
//   C. sub-620 hard-exits to /not-yet
//   D. /dscr-loans/texas walk is 7 steps (no state step) and the phone-step recap chip reads Texas
//   E. full submit on /?qa=1 ends on /thank-you with lead-summary present (POST intercepted)
//   F. full submit on /dscr-loans/texas?qa=1: intercepted POST has state 'Texas' + stateSlug 'texas'
// Exit 1 on any failure. Never hits a webhook: POST /api/lead is intercepted and stubbed.
//
//   CI=true npm run dev ; node tools/step-walk-qa.mjs
import {
  QA_BASE,
  VIEWPORTS,
  readSiteConfig,
  launchBrowser,
  openPage,
  walkPurchase,
  waitStep,
  clickValue,
  clickAction,
  stepTitle,
  noVisibleStepText,
  submitAndWaitThankYou,
  makeChecker,
  norm,
  settle,
  DEFAULT_LEAD,
} from './qa-lib.mjs';

const site = readSiteConfig();
const vp = VIEWPORTS.mobile;
const { check, summary } = makeChecker();
const errors = [];
console.log(`step-walk-qa: ${QA_BASE}  brand "${site.brandName}"  mode ${site.mode}\n`);

const browser = await launchBrowser(vp);
const open = (path, opts = {}) => openPage(browser, path, { vp, errors, ...opts });

async function section(label, fn) {
  console.log(`-- ${label}`);
  try {
    await fn();
  } catch (e) {
    check(`${label}: completed`, false, e.message);
  }
  console.log('');
}

// A. purchase path, 8 steps
await section('A. purchase path (8 steps)', async () => {
  const page = await open('/');
  const seen = [];
  await walkPurchase(page, {
    onStep: async (id) => {
      if (id === 'state-typed') return;
      seen.push(id);
      const title = norm(await stepTitle(page));
      const vis = await page.evaluate(noVisibleStepText);
      check(`[${id}] title non-empty`, title.length > 0, title || 'EMPTY');
      check(`[${id}] no visible "Step N of T"`, vis.ok, vis.ok ? `sr-only: ${vis.label || 'none'}` : vis.why);
      if (!vis.hasLabelAttr) console.log(`      WARN [${id}] no [data-step-label] element found`);
    },
  });
  check('purchase path mounted 8 distinct steps', seen.length === 8, seen.join(' > '));
  const expectedPhoneTitle = site.mode === 'network' ? site.titles.phoneNetwork : site.titles.phone;
  check('phone-step title matches mode', norm(await stepTitle(page)) === norm(expectedPhoneTitle), `expected "${expectedPhoneTitle}"`);
  await page.close();
});

// B. branch titles
async function branch(goal, priceKey, secondaryKey) {
  const page = await open('/');
  await waitStep(page, 'goal');
  await clickValue(page, goal);
  await waitStep(page, 'propertyType');
  await clickValue(page, 'sfr');
  await waitStep(page, 'credit');
  await clickValue(page, '700-739');
  await waitStep(page, 'price');
  const priceTitle = norm(await stepTitle(page));
  check(`${goal}: price title = titles.${priceKey}`, priceTitle === norm(site.titles[priceKey]), `got "${priceTitle}"`);
  await clickAction(page, 'continue');
  await waitStep(page, 'secondary');
  const secTitle = norm(await stepTitle(page));
  check(`${goal}: secondary title = titles.${secondaryKey}`, secTitle === norm(site.titles[secondaryKey]), `got "${secTitle}"`);
  const hasRange = await page.evaluate(() => !!document.querySelector('#start #ff-range'));
  check(`${goal}: secondary step has #ff-range`, hasRange);
  await page.close();
}
await section('B. refinance + bridge branch titles', async () => {
  await branch('refinance', 'priceRefi', 'balance');
  await branch('bridge', 'pricePurchase', 'rehab');
});

// C. sub-620 hard exit
await section('C. sub-620 -> /not-yet', async () => {
  const page = await open('/');
  await waitStep(page, 'goal');
  await clickValue(page, 'purchase');
  await waitStep(page, 'propertyType');
  await clickValue(page, 'sfr');
  await waitStep(page, 'credit');
  const nav = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => null);
  await clickValue(page, '<620');
  await nav;
  await settle(400);
  check('sub-620 landed on /not-yet', /\/not-yet/.test(page.url()), page.url());
  await page.close();
});

// D. state page walk: 7 steps, no state step, Texas chip
await section('D. /dscr-loans/texas walk (7 steps, Texas chip)', async () => {
  const page = await open('/dscr-loans/texas', { strictTitle: true });
  const seen = [];
  await walkPurchase(page, { fixedState: true, onStep: async (id) => seen.push(id) });
  check('state page mounted 7 distinct steps', seen.length === 7, seen.join(' > '));
  check('state step never mounted', !seen.includes('state'));
  const chips = await page.evaluate(() => [...document.querySelectorAll('#start .deal-chip')].map((c) => c.textContent.trim()));
  check('phone-step recap chip reads Texas', chips.some((c) => /Texas/.test(c)), chips.join(' | ') || 'no .deal-chip');
  const title = await page.title();
  check('state page <title> names Texas', /Texas/.test(title), title);
  await page.close();
});

// E. full submit on /?qa=1
await section('E. full submit on /?qa=1 -> /thank-you', async () => {
  const posts = [];
  const page = await open('/?qa=1', { posts });
  await walkPurchase(page, { consent: true });
  const url = await submitAndWaitThankYou(page);
  check('landed on /thank-you', /\/thank-you/.test(url), url);
  check('exactly one POST /api/lead', posts.length === 1, `${posts.length} posts`);
  const p = posts[0] || {};
  check('payload.source is dscr-funnel-template-4', p.source === 'dscr-funnel-template-4', String(p.source));
  check('payload.partial === false', p.partial === false);
  check('payload.phone is 10 digits', /^\d{10}$/.test(String(p.phone)), String(p.phone));
  check('payload.state Texas / stateSlug texas (typed)', p.state === 'Texas' && p.stateSlug === 'texas', `${p.state}/${p.stateSlug}`);
  // ILD contract (BRIEF sec 6 "identical to ILD"): firstName carries the FULL
  // name as typed; thank-you splits the first token for display only.
  check('payload.firstName carries the typed full name', norm(p.firstName) === DEFAULT_LEAD.name, String(p.firstName));
  await settle(800);
  const summaryRaw = await page.evaluate(() => {
    try {
      return sessionStorage.getItem('lead-summary');
    } catch {
      return null;
    }
  });
  check('sessionStorage lead-summary present on /thank-you', !!summaryRaw);
  let ls = {};
  try {
    ls = JSON.parse(summaryRaw || '{}');
  } catch {
    /* ignore */
  }
  check('lead-summary carries firstName + state + stateSlug', !!ls.firstName && ls.state === 'Texas' && ls.stateSlug === 'texas', JSON.stringify(ls).slice(0, 160));
  const tyName = await page.evaluate(() => document.querySelector('#ty-name')?.textContent?.trim() ?? null);
  check('#ty-name personalized', tyName !== null && tyName.includes(DEFAULT_LEAD.name.split(' ')[0]), tyName ?? 'no #ty-name');
  const qa = await page.evaluate(() => {
    try {
      return sessionStorage.getItem('qa');
    } catch {
      return null;
    }
  });
  check('sessionStorage.qa === "1" (conversion suppressed)', qa === '1', String(qa));
  await page.close();
});

// F. full submit from the state page: state/stateSlug from fixedState
await section('F. full submit on /dscr-loans/texas?qa=1', async () => {
  const posts = [];
  const page = await open('/dscr-loans/texas?qa=1', { posts, strictTitle: true });
  await walkPurchase(page, { fixedState: true, consent: true });
  const url = await submitAndWaitThankYou(page);
  check('state page submit landed on /thank-you', /\/thank-you/.test(url), url);
  const p = posts[0] || {};
  check('state-page POST state === "Texas"', p.state === 'Texas', String(p.state));
  check('state-page POST stateSlug === "texas"', p.stateSlug === 'texas', String(p.stateSlug));
  check('state-page POST tcpaConsent === true', p.tcpaConsent === true);
  await page.close();
});

await browser.close();

const pageErrors = errors.filter((e) => e.startsWith('[pageerror'));
if (errors.length) console.log(`browser errors:\n  ${errors.join('\n  ')}\n`);
check('no uncaught page errors during the walks', pageErrors.length === 0, `${pageErrors.length} pageerror(s)`);
const ok = summary();
process.exit(ok ? 0 : 1);

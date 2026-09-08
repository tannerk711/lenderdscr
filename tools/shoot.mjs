// Screenshot sweep (BRIEF section 13). One browser per viewport (desktop 1440x900 dsf1,
// mobile 390x844 dsf2 hasTouch, no isMobile); every load asserts clientWidth === width.
// Shots: / (fold + full page after a scroll-through), every purchase-path step, /not-yet,
// /thank-you (seeded lead-summary), mobile sticky (scroll 1800), /dscr-loans/texas, /dscr-loans.
// Output: tools/shots/<viewport>-<name>.png
//
//   CI=true npm run dev        (server on QA_BASE, default http://localhost:4321)
//   node tools/shoot.mjs [desktop|mobile]
import {
  QA_BASE,
  VIEWPORTS,
  readSiteConfig,
  launchBrowser,
  openPage,
  scrollThrough,
  overflowReport,
  walkPurchase,
  seedLeadSummary,
  seedSession,
  ensureShots,
  shotPath,
  settle,
} from './qa-lib.mjs';

const site = readSiteConfig();
const only = process.argv[2];
ensureShots();
console.log(`shoot: ${QA_BASE}  brand "${site.brandName}"  mode ${site.mode}`);

const written = [];
const failures = [];
const errors = [];

async function snap(page, vp, name, full = false) {
  const path = shotPath(vp.name, name);
  if (full) {
    // 1. cv-auto sections render blank when captured offscreen; force them visible for
    //    the capture only (QA-side CSS, never shipped).
    // 2. Chrome tiles/repeats full-page captures taller than 16384 device px; drop to
    //    deviceScaleFactor 1 when height * dsf would cross the limit (layout width unchanged).
    await page.evaluate(() => {
      const s = document.createElement('style');
      s.id = '__qa_cv';
      s.textContent = '.cv-auto{content-visibility:visible!important;contain-intrinsic-size:none!important}';
      document.head.appendChild(s);
    });
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    const dropDsf = vp.deviceScaleFactor > 1 && h * vp.deviceScaleFactor > 16000;
    if (dropDsf) await page.setViewport({ ...vpViewport(vp), deviceScaleFactor: 1 });
    await settle(400);
    await page.screenshot({ path, fullPage: true });
    if (dropDsf) await page.setViewport(vpViewport(vp));
    await page.evaluate(() => document.getElementById('__qa_cv')?.remove());
  } else {
    await page.screenshot({ path });
  }
  written.push(path);
}

function vpViewport(vp) {
  const { name, ...viewport } = vp;
  return viewport;
}

async function run(vp, label, fn) {
  try {
    await fn();
  } catch (e) {
    failures.push(`${vp.name} ${label}: ${e.message}`);
    console.log(`  FAIL ${vp.name} ${label}: ${e.message}`);
  }
}

for (const vp of Object.values(VIEWPORTS)) {
  if (only && only !== vp.name) continue;
  console.log(`\n== ${vp.name} ${vp.width}x${vp.height} ==`);
  const browser = await launchBrowser(vp);
  const open = (path, opts = {}) => openPage(browser, path, { vp, errors, ...opts });

  // 1. home: fold, then full page after a scroll-through (reveals + cv-auto paint)
  await run(vp, 'home', async () => {
    const page = await open('/');
    await settle(900);
    const ov = await overflowReport(page);
    console.log(`  widths client=${ov.clientWidth} scroll=${ov.scrollWidth}${ov.offenders.length ? '\n  overflow offenders:\n    ' + ov.offenders.join('\n    ') : ''}`);
    if (vp.name === 'mobile') {
      const fold = await page.evaluate((h) => {
        const cards = [...document.querySelectorAll('#start .opt-card')];
        const third = cards[2]?.getBoundingClientRect();
        const start = document.querySelector('#start')?.getBoundingClientRect();
        return {
          optCards: cards.length,
          thirdCardBottom: third ? Math.round(third.bottom) : null,
          formCardBottom: start ? Math.round(start.bottom) : null,
          thirdCardInFold: third ? third.bottom <= h : false,
        };
      }, vp.height);
      console.log(`  mobile fold: ${JSON.stringify(fold)} (acceptance: third option card bottom <= ${vp.height})`);
    }
    await snap(page, vp, 'home-fold');
    await scrollThrough(page);
    await snap(page, vp, 'home-full', true);
    await page.close();
  });

  // 2. every form step on the purchase path
  await run(vp, 'form steps', async () => {
    const page = await open('/');
    await settle(500);
    const names = {
      goal: 'step1-goal',
      propertyType: 'step2-property',
      credit: 'step3-credit',
      price: 'step4-price',
      secondary: 'step5-down',
      state: 'step6-state',
      'state-typed': 'step6-state-typed',
      contact: 'step7-contact',
      phone: 'step8-phone',
      'phone-consented': 'step8-phone-filled',
    };
    await walkPurchase(page, {
      consent: true,
      onStep: async (id) => {
        await settle(250);
        await snap(page, vp, names[id] || id);
      },
    });
    await page.close();
  });

  // 3. /not-yet
  await run(vp, 'not-yet', async () => {
    const page = await open('/not-yet');
    await settle(600);
    await scrollThrough(page);
    await snap(page, vp, 'not-yet', true);
    await page.close();
  });

  // 4. /thank-you with a seeded lead-summary
  await run(vp, 'thank-you', async () => {
    const page = await open('/thank-you', { init: seedSession, initArgs: [{ 'lead-summary': seedLeadSummary() }] });
    await settle(900);
    await scrollThrough(page);
    await snap(page, vp, 'thank-you', true);
    await page.close();
  });

  // 5. mobile sticky CTA after a 1800px scroll
  if (vp.name === 'mobile') {
    await run(vp, 'sticky', async () => {
      const page = await open('/');
      await settle(800);
      await page.evaluate(() => window.scrollTo(0, 1800));
      await settle(1000);
      const sticky = await page.evaluate(() => {
        const el = document.querySelector('#sticky-cta');
        if (!el) return 'missing #sticky-cta';
        const r = el.getBoundingClientRect();
        return `hidden=${el.hidden} top=${Math.round(r.top)} height=${Math.round(r.height)}`;
      });
      console.log(`  #sticky-cta at scrollY 1800: ${sticky} (expect hidden=false)`);
      await snap(page, vp, 'sticky');
      await page.close();
    });
  }

  // 6. state page + hub
  await run(vp, 'state-texas', async () => {
    const page = await open('/dscr-loans/texas');
    await settle(700);
    const chip = await page.evaluate(() => document.querySelector('#start [data-step]')?.getAttribute('data-step'));
    console.log(`  /dscr-loans/texas first step: ${chip} (expect goal; state step is skipped later)`);
    await scrollThrough(page);
    await snap(page, vp, 'state-texas', true);
    await page.close();
  });
  await run(vp, 'hub', async () => {
    const page = await open('/dscr-loans');
    await settle(600);
    const links = await page.evaluate(() => document.querySelectorAll('a[href^="/dscr-loans/"]').length);
    console.log(`  /dscr-loans state links: ${links} (expect 51)`);
    await scrollThrough(page);
    await snap(page, vp, 'hub', true);
    await page.close();
  });

  await browser.close();
}

console.log('\nshots written:');
for (const p of written) console.log('  ' + p);
console.log(`\nbrowser errors: ${errors.length ? '\n  ' + errors.join('\n  ') : 'none'}`);
if (failures.length) {
  console.log(`\n${failures.length} shot group(s) FAILED:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log('\nshoot complete');

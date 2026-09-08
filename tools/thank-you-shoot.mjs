// /thank-you verification, variant B stage 3 (the LeaderOne clone). Real dev server,
// real browser. Per viewport (desktop 1440x900 dsf1, mobile 390x844 dsf2 hasTouch, plus
// a 1200-wide desktop capture that lines up with _ref/leaderone/lo-thankyou-desktop.png):
//   - opens / (title guard), seeds sessionStorage['lead-summary'] in the BRIEF section 5
//     shape, then navigates to /thank-you (the same-origin path the form takes)
//   - asserts: title, noindex, no gtag / googletagmanager anywhere, every request stayed on
//     localhost, the personalized H1, the five chips in order, the italic pine em,
//     Fraunces + Hanken resolved, the seal finished drawing, no horizontal overflow,
//     zero console/page errors
//   - shoots the fold and the full page (after the seal draws)
//   - a fresh context with NO summary: default H1, zero chips, shot
//   - prefers-reduced-motion: the seal renders complete at once
//   - /not-yet: title, H1, the "Run it again" link, shot
//   - the in-form kick-out on /start: Below 620 mounts the kick-out whose gold link points
//     at /not-yet, and clicking it lands there
// Exit 1 on any failed check. Needs the dev server: CI=true npx astro dev --port 4332
//   node tools/thank-you-shoot.mjs [desktop|mobile|lo]
import {
  QA_BASE,
  VIEWPORTS,
  readSiteConfig,
  launchBrowser,
  seedLeadSummary,
  ensureShots,
  shotPath,
  settle,
  makeChecker,
  waitStep,
  clickValue,
} from './qa-lib.mjs';

const site = readSiteConfig();
const only = process.argv.slice(2).find((a) => !a.startsWith('--'));
ensureShots();
const { check, summary } = makeChecker();

const VPS = {
  desktop: VIEWPORTS.desktop,
  mobile: VIEWPORTS.mobile,
  // LO's reference PNG is 1200 wide; this capture lines up with it side by side.
  lo: { name: 'lo', width: 1200, height: 900, deviceScaleFactor: 1 },
};

const SUMMARY = seedLeadSummary();
const EXPECT_CHIPS = ['Buy a rental', 'Single-family', 'Texas', '$350,000', 'Credit 680 to 739'];
const EXPECT_H1 = 'Nice work, Tanner. Your credit clears the DSCR floor.';
const DEFAULT_H1 = 'Nice work. Your credit clears the DSCR floor.';

const isLocal = (url) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(url) || url.startsWith('data:');
const h1Text = (page) => page.evaluate(() => (document.querySelector('h1')?.textContent || '').replace(/\s+/g, ' ').trim());

function wire(page, label, errors, requests) {
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`[console ${label}] ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`[pageerror ${label}] ${e.message}`));
  page.on('request', (r) => requests.push(r.url()));
}

async function newPage(browser, vp, label, errors, requests, context) {
  const page = context ? await context.newPage() : await browser.newPage();
  const { name, ...viewport } = vp;
  await page.setViewport(viewport);
  wire(page, `${vp.name} ${label}`, errors, requests);
  return page;
}

for (const vp of Object.values(VPS)) {
  if (only && only !== vp.name) continue;
  console.log(`\n== ${vp.name} ${vp.width}x${vp.height} ==`);
  const browser = await launchBrowser(vp);
  const errors = [];
  const requests = [];

  // ---- 1. seeded visit: / (seed) -> /thank-you --------------------------------------
  const page = await newPage(browser, vp, 'thank-you', errors, requests);
  await page.goto(`${QA_BASE}/`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  const homeTitle = await page.title();
  check(`${vp.name}: / served by this variant`, homeTitle.includes(site.brandName), homeTitle);
  await page.evaluate((s) => sessionStorage.setItem('lead-summary', JSON.stringify(s)), SUMMARY);
  await page.goto(`${QA_BASE}/thank-you`, { waitUntil: 'networkidle0', timeout: 45000 });
  await settle(300);

  const title = await page.title();
  check(`${vp.name}: /thank-you title`, title.includes('Eligibility Check Received') && title.includes(site.brandName), title);
  const head = await page.evaluate(() => ({
    robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') || '',
    html: document.documentElement.outerHTML,
    gtag: typeof window.gtag,
    dataLayer: Array.isArray(window.dataLayer),
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  check(`${vp.name}: noindex,nofollow`, /noindex/.test(head.robots) && /nofollow/.test(head.robots), head.robots);
  check(`${vp.name}: no googletagmanager / gtag in the document`, !/googletagmanager|gtag\.js/i.test(head.html) && head.gtag === 'undefined', `gtag=${head.gtag}`);
  check(`${vp.name}: no dataLayer created in test mode`, !head.dataLayer);
  check(`${vp.name}: layout width = viewport`, head.width === vp.width, `${head.width}`);
  check(`${vp.name}: no horizontal overflow`, head.scrollWidth <= head.width, `scroll=${head.scrollWidth} client=${head.width}`);

  const h1 = await h1Text(page);
  check(`${vp.name}: H1 personalized`, h1 === EXPECT_H1, h1);
  const chips = await page.evaluate(() => [...document.querySelectorAll('#ty-chips .lo-chip')].map((c) => c.textContent.trim()));
  check(`${vp.name}: five chips in order`, JSON.stringify(chips) === JSON.stringify(EXPECT_CHIPS), chips.join(' | '));

  const type = await page.evaluate(() => {
    const cs = (sel) => getComputedStyle(document.querySelector(sel));
    const h1 = cs('h1');
    const em = cs('h1 em');
    const eyebrow = cs('.lo-eyebrow');
    const lede = cs('.lo-lede');
    const band = cs('.lo-band');
    const hero = cs('.lo-hero');
    return {
      h1Family: h1.fontFamily,
      h1Weight: h1.fontWeight,
      h1Size: h1.fontSize,
      h1Tracking: h1.letterSpacing,
      emStyle: em.fontStyle,
      emColor: em.color,
      eyebrowFamily: eyebrow.fontFamily,
      eyebrowTracking: eyebrow.letterSpacing,
      eyebrowTransform: eyebrow.textTransform,
      ledeFamily: lede.fontFamily,
      heroBg: hero.backgroundColor,
      bandBg: band.backgroundColor,
      fraunces: document.fonts.check('16px Fraunces'),
      frauncesItalic: document.fonts.check('italic 16px Fraunces'),
      hanken: document.fonts.check('16px "Hanken Grotesk"'),
      hanken600: document.fonts.check('600 16px "Hanken Grotesk"'),
      mono: [...document.querySelectorAll('.lo *')].some((el) => /mono|consolas|courier/i.test(getComputedStyle(el).fontFamily)),
    };
  });
  check(`${vp.name}: H1 is Fraunces (resolved)`, /Fraunces/.test(type.h1Family) && type.fraunces, `${type.h1Family} loaded=${type.fraunces}`);
  check(`${vp.name}: H1 italic face loaded`, type.frauncesItalic);
  check(`${vp.name}: H1 weight 400`, type.h1Weight === '400', type.h1Weight);
  check(`${vp.name}: em italic + pine`, type.emStyle === 'italic' && type.emColor === 'rgb(30, 74, 140)', `${type.emStyle} ${type.emColor}`);
  check(`${vp.name}: body face Hanken (resolved)`, /Hanken/.test(type.ledeFamily) && type.hanken && type.hanken600, `${type.ledeFamily} loaded=${type.hanken}/${type.hanken600}`);
  check(`${vp.name}: eyebrow is Hanken, uppercase, tracked`, /Hanken/.test(type.eyebrowFamily) && type.eyebrowTransform === 'uppercase' && parseFloat(type.eyebrowTracking) > 1.5, `${type.eyebrowTracking}`);
  check(`${vp.name}: no monospace anywhere on the page`, !type.mono);
  check(`${vp.name}: hero paper #f8f6f1`, type.heroBg === 'rgb(248, 246, 241)', type.heroBg);
  check(`${vp.name}: band paper-2 #efece3`, type.bandBg === 'rgb(239, 236, 227)', type.bandBg);
  console.log(`  H1 ${type.h1Size} tracking ${type.h1Tracking}`);

  await page.screenshot({ path: shotPath(vp.name, 'thank-you-fold') });
  await settle(2200); // seal: ring 0.2s + 1.1s, check 1.0s + 0.7s
  const seal = await page.evaluate(() => ({
    ring: getComputedStyle(document.getElementById('seal-ring')).strokeDashoffset,
    checkMark: getComputedStyle(document.getElementById('seal-check')).strokeDashoffset,
  }));
  check(`${vp.name}: seal finished drawing`, seal.ring === '0px' && seal.checkMark === '0px', `ring=${seal.ring} check=${seal.checkMark}`);
  await page.evaluate(() => {
    const s = document.createElement('style');
    s.id = '__qa_cv';
    s.textContent = '.cv-auto{content-visibility:visible!important;contain-intrinsic-size:none!important}';
    document.head.appendChild(s);
  });
  await settle(200);
  await page.screenshot({ path: shotPath(vp.name, 'thank-you-full'), fullPage: true });
  await page.evaluate(() => document.getElementById('__qa_cv')?.remove());

  const foreign = requests.filter((u) => !isLocal(u));
  check(`${vp.name}: every request stayed on localhost`, foreign.length === 0, foreign.slice(0, 3).join(', '));
  await page.close();

  // ---- 2. no summary at all: graceful defaults --------------------------------------
  const ctx = await browser.createBrowserContext();
  const bare = await newPage(browser, vp, 'thank-you-default', errors, requests, ctx);
  await bare.goto(`${QA_BASE}/thank-you`, { waitUntil: 'networkidle0', timeout: 45000 });
  await settle(300);
  const bareH1 = await h1Text(bare);
  const bareChips = await bare.evaluate(() => ({
    n: document.querySelectorAll('#ty-chips .lo-chip').length,
    display: getComputedStyle(document.getElementById('ty-chips')).display,
  }));
  check(`${vp.name}: default H1 without a summary`, bareH1 === DEFAULT_H1, bareH1);
  check(`${vp.name}: no chips and the chip row collapses`, bareChips.n === 0 && bareChips.display === 'none', JSON.stringify(bareChips));
  await settle(2200);
  await bare.screenshot({ path: shotPath(vp.name, 'thank-you-default') });

  // ---- 3. reduced motion: seal complete immediately -----------------------------------
  await bare.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await bare.reload({ waitUntil: 'domcontentloaded' });
  const rm = await bare.evaluate(() => ({
    ring: getComputedStyle(document.getElementById('seal-ring')).strokeDashoffset,
    checkMark: getComputedStyle(document.getElementById('seal-check')).strokeDashoffset,
  }));
  check(`${vp.name}: reduced motion renders the seal complete`, rm.ring === '0px' && rm.checkMark === '0px', `ring=${rm.ring} check=${rm.checkMark}`);
  await bare.close();
  await ctx.close();

  if (vp.name !== 'lo') {
    // ---- 4. /not-yet ------------------------------------------------------------------
    const ny = await newPage(browser, vp, 'not-yet', errors, requests);
    await ny.goto(`${QA_BASE}/not-yet`, { waitUntil: 'networkidle0', timeout: 45000 });
    await settle(400);
    const nyTitle = await ny.title();
    const nyInfo = await ny.evaluate(() => ({
      h1: (document.querySelector('h1')?.textContent || '').replace(/\s+/g, ' ').trim(),
      again: [...document.querySelectorAll('a')].filter((a) => /run it again/i.test(a.textContent)).map((a) => a.getAttribute('href')),
      nmls: /NMLS\s*#\s*\d/.test(document.body.textContent || ''),
      rate: /\d(\.\d+)?\s*%\s*(rate|apr)/i.test(document.body.textContent || ''),
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
    }));
    check(`${vp.name}: /not-yet served`, nyTitle.includes('Not yet') && nyTitle.includes(site.brandName), nyTitle);
    check(`${vp.name}: /not-yet H1 carries the 620 line`, /620/.test(nyInfo.h1), nyInfo.h1);
    check(`${vp.name}: /not-yet "Run it again" -> /start`, nyInfo.again.length > 0 && nyInfo.again.every((h) => h === '/start'), nyInfo.again.join(','));
    check(`${vp.name}: /not-yet invents no NMLS and publishes no rate`, !nyInfo.nmls && !nyInfo.rate);
    check(`${vp.name}: /not-yet no horizontal overflow`, nyInfo.sw <= nyInfo.cw, `scroll=${nyInfo.sw} client=${nyInfo.cw}`);
    await ny.evaluate(async () => {
      const d = document.documentElement;
      for (let y = 0; y < d.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); }
      window.scrollTo(0, 0);
      const s = document.createElement('style');
      s.textContent = '.cv-auto{content-visibility:visible!important;contain-intrinsic-size:none!important}';
      document.head.appendChild(s);
    });
    await settle(600);
    await ny.screenshot({ path: shotPath(vp.name, 'not-yet-full'), fullPage: true });
    await ny.close();

    // ---- 5. the in-form kick-out links to /not-yet ---------------------------------------
    const ko = await newPage(browser, vp, 'kickout', errors, requests);
    await ko.goto(`${QA_BASE}/start`, { waitUntil: 'networkidle0', timeout: 45000 });
    await waitStep(ko, 'goal');
    await clickValue(ko, 'purchase');
    await waitStep(ko, 'stage');
    await clickValue(ko, 'just-starting-my-research');
    await waitStep(ko, 'propertyType');
    await clickValue(ko, 'sfr');
    await waitStep(ko, 'credit');
    await clickValue(ko, '<620');
    await waitStep(ko, 'kickout');
    const link = await ko.evaluate(() => {
      const a = document.querySelector('#start [data-action="not-yet"]');
      return a ? { href: a.getAttribute('href'), text: a.textContent.trim() } : null;
    });
    check(`${vp.name}: kick-out gold link -> /not-yet`, !!link && link.href === '/not-yet', JSON.stringify(link));
    await ko.screenshot({ path: shotPath(vp.name, 'kickout') });
    const nav = ko.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null);
    await ko.evaluate(() => document.querySelector('#start [data-action="not-yet"]')?.click());
    await nav;
    await settle(300);
    check(`${vp.name}: clicking it lands on /not-yet`, /\/not-yet$/.test(ko.url()) && (await ko.title()).includes('Not yet'), ko.url());
    await ko.close();
  }

  check(`${vp.name}: zero console / page errors`, errors.length === 0, errors.slice(0, 3).join(' || '));
  await browser.close();
}

const ok = summary();
process.exit(ok ? 0 : 1);

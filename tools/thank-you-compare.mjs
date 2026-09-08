// Side-by-side capture of /thank-you against the LeaderOne reference PNGs (BRIEF section 6:
// "make it look almost exactly like the LeaderOne thank-you page"). Seeds
// sessionStorage['lead-summary'] on / then navigates to /thank-you (the path the form takes),
// shoots the full page at the reference PNGs' scales (1200 wide dsf1, 390 wide dsf1) and
// composites [LO | ours] with sharp into tools/shots/compare-{desktop,mobile}.png for a Read.
// Also prints the rect of every LO-mirrored element so spacing can be diffed by number.
// Needs the dev server: CI=true npx astro dev --port 4332
//   node tools/thank-you-compare.mjs [desktop|mobile]
import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { QA_BASE, ROOT, launchBrowser, seedLeadSummary, ensureShots, settle, readSiteConfig } from './qa-lib.mjs';

const REF = `${ROOT}../_ref/leaderone/`;
const OUT = ensureShots();
const site = readSiteConfig();
const only = process.argv.slice(2).find((a) => !a.startsWith('--'));
const SUMMARY = seedLeadSummary();

const VPS = [
  { name: 'desktop', width: 1200, height: 900, deviceScaleFactor: 1, ref: 'lo-thankyou-desktop.png' },
  { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 1, hasTouch: true, ref: 'lo-thankyou-mobile.png' },
];

const SELS = {
  topbar: '.lo-topbar', hairline: '.lo-hairline', hero: '.lo-hero', seal: '.lo-seal', eyebrow: '.lo-eyebrow-hero',
  h1: 'h1', lede: '.lo-lede', chips: '#ty-chips', band: '.lo-band', bandEyebrow: '.lo-eyebrow-band', h2: '.lo-h2',
  cards: '.lo-cards', card1: '.lo-card', human: '.lo-human', call: '.lo-call', tel: '.lo-tel', footer: 'footer',
};

for (const vp of VPS) {
  if (only && only !== vp.name) continue;
  const { ref, ...viewport } = vp;
  const browser = await launchBrowser(viewport);
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto(`${QA_BASE}/`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  const title = await page.title();
  if (!title.includes(site.brandName)) throw new Error(`no server at QA_BASE (${QA_BASE}): title "${title}"`);
  await page.evaluate((s) => sessionStorage.setItem('lead-summary', JSON.stringify(s)), SUMMARY);
  await page.goto(`${QA_BASE}/thank-you`, { waitUntil: 'networkidle0', timeout: 45000 });
  await settle(2400); // seal: ring 0.2s + 1.1s, check 1.0s + 0.7s
  await page.evaluate(() => {
    const s = document.createElement('style');
    s.textContent = '.cv-auto{content-visibility:visible!important;contain-intrinsic-size:none!important}';
    document.head.appendChild(s);
  });
  await settle(200);

  const rects = await page.evaluate((sels) => {
    const out = {};
    for (const [k, sel] of Object.entries(sels)) {
      const el = document.querySelector(sel);
      if (!el) { out[k] = null; continue; }
      const b = el.getBoundingClientRect();
      out[k] = `top ${Math.round(b.top + scrollY)} h ${Math.round(b.height)} w ${Math.round(b.width)} left ${Math.round(b.left)}`;
    }
    const cs = (sel, p) => getComputedStyle(document.querySelector(sel))[p];
    out.type = `h1 ${cs('h1', 'fontSize')} / h2 ${cs('.lo-h2', 'fontSize')} / lede ${cs('.lo-lede', 'fontSize')} / tel ${cs('.lo-tel', 'fontSize')} / eyebrow ${cs('.lo-eyebrow-hero', 'fontSize')}`;
    out.h1Lines = Math.round(document.querySelector('h1').getBoundingClientRect().height / parseFloat(cs('h1', 'lineHeight')));
    out.h1Text = document.querySelector('h1').textContent.replace(/\s+/g, ' ').trim();
    out.chipsText = [...document.querySelectorAll('#ty-chips .lo-chip')].map((c) => c.textContent).join(' | ');
    out.overflow = `${document.documentElement.scrollWidth} <= ${document.documentElement.clientWidth}`;
    return out;
  }, SELS);

  const ours = `${OUT}compare-${vp.name}-ours.png`;
  await page.screenshot({ path: ours, fullPage: true });
  await browser.close();

  const refPath = REF + ref;
  if (!existsSync(refPath)) {
    console.log(`${vp.name}: no reference at ${refPath}; wrote ${ours} only`);
  } else {
    const lo = await sharp(refPath).toBuffer();
    const loMeta = await sharp(lo).metadata();
    const our = await sharp(ours).toBuffer();
    const ourMeta = await sharp(our).metadata();
    const gutter = 24;
    await sharp({
      create: { width: loMeta.width + ourMeta.width + gutter, height: Math.max(loMeta.height, ourMeta.height), channels: 3, background: '#ff00ff' },
    })
      .composite([{ input: lo, left: 0, top: 0 }, { input: our, left: loMeta.width + gutter, top: 0 }])
      .png()
      .toFile(`${OUT}compare-${vp.name}.png`);
    console.log(`${vp.name}: LO ${loMeta.width}x${loMeta.height} | ours ${ourMeta.width}x${ourMeta.height} -> tools/shots/compare-${vp.name}.png`);
  }
  for (const [k, v] of Object.entries(rects)) console.log(`  ${k}: ${v}`);
  if (errors.length) console.log(`  ERRORS: ${errors.join(' || ')}`);
}

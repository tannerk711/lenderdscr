// Visual QA harness for the funnel. Usage:
//   npm i -D puppeteer-core        (one time; not a runtime dep)
//   npm run dev                    (server on :4321)
//   node tools/shoot.mjs <outPrefix>
// Captures desktop hero + full page, mobile-emulated hero + full page (with
// horizontal-overflow diagnostics), every form step, the credit-decline
// branch, and the personalized thank-you page into ./shots/.
// Mobile shots MUST come from this (viewport emulation); bare headless
// chrome --screenshot clamps window width ~500px and fakes overflow.
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';

const prefix = process.argv[2] || 'shot';
const base = 'http://localhost:4321';
// fileURLToPath, not .pathname: pathname keeps %20 for spaces and breaks fs writes
const outDir = fileURLToPath(new URL('./shots/', import.meta.url));

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--hide-scrollbars', '--force-color-profile=srgb'],
});

const errors = [];

async function newPage(w, h, mobile = false) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[console] ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
  return page;
}

const settle = (ms) => new Promise((r) => setTimeout(r, ms));

// --- desktop hero (above fold) ---
let page = await newPage(1440, 900);
await page.goto(base, { waitUntil: 'networkidle0', timeout: 30000 });
await settle(2500);
await page.screenshot({ path: `${outDir}${prefix}-desktop-hero.png` });

// scrollWidth diagnostic
const dw = await page.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth,
  clientW: document.documentElement.clientWidth,
}));
console.log('desktop widths:', JSON.stringify(dw));

// --- desktop full (scroll through to fire all reveals, then full capture) ---
await page.evaluate(async () => {
  await new Promise((resolve) => {
    let y = 0;
    const step = () => {
      y += 600;
      window.scrollTo(0, y);
      if (y < document.body.scrollHeight) setTimeout(step, 120);
      else resolve(null);
    };
    step();
  });
});
await settle(1800);
await page.screenshot({ path: `${outDir}${prefix}-desktop-full.png`, fullPage: true });
await page.close();

// --- mobile full ---
page = await newPage(390, 844, true);
await page.goto(base, { waitUntil: 'networkidle0', timeout: 30000 });
await settle(2000);
const mw = await page.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth,
  clientW: document.documentElement.clientWidth,
}));
console.log('mobile widths:', JSON.stringify(mw));
if (mw.scrollW > mw.clientW) {
  // find offenders
  const offenders = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > document.documentElement.clientWidth + 1) {
        out.push(`${el.tagName}.${String(el.className).slice(0, 80)} w=${Math.round(r.width)}`);
      }
    });
    return out.slice(0, 20);
  });
  console.log('overflow offenders:\n' + offenders.join('\n'));
}
await page.screenshot({ path: `${outDir}${prefix}-mobile-hero.png` });
await page.evaluate(async () => {
  await new Promise((resolve) => {
    let y = 0;
    const step = () => {
      y += 500;
      window.scrollTo(0, y);
      if (y < document.body.scrollHeight) setTimeout(step, 100);
      else resolve(null);
    };
    step();
  });
});
await settle(1500);
await page.screenshot({ path: `${outDir}${prefix}-mobile-full.png`, fullPage: true });
await page.close();

// --- form steps walk (desktop) ---
page = await newPage(1440, 980);
await page.goto(base, { waitUntil: 'networkidle0', timeout: 30000 });
await settle(1200);
const clickByText = async (text) => {
  const ok = await page.evaluate((t) => {
    const btns = [...document.querySelectorAll('#eligibility button')];
    const b = btns.find((x) => x.textContent.toLowerCase().includes(t.toLowerCase()));
    if (b) { b.click(); return true; }
    return false;
  }, text);
  if (!ok) console.log('CLICK MISS:', text);
  await settle(700);
};
await clickByText('Buy a rental');
await page.screenshot({ path: `${outDir}${prefix}-form-step2.png` });
await clickByText('Single family');
await clickByText('700');
await page.screenshot({ path: `${outDir}${prefix}-form-price.png` });
await clickByText('Continue');
await page.screenshot({ path: `${outDir}${prefix}-form-down.png` });
await clickByText('Continue');
// Texas-only funnel: no state step; down % Continue lands on contact
await page.screenshot({ path: `${outDir}${prefix}-form-contact.png` });
await page.evaluate(() => {
  const inputs = [...document.querySelectorAll('#eligibility input')].filter((i) => i.id !== 'ff-company');
  const setVal = (el, v) => {
    const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    s.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  setVal(inputs[0], 'Tanner');
  setVal(inputs[1], 'test@example.com');
});
await settle(300);
await clickByText('Continue');
await settle(600);
await page.screenshot({ path: `${outDir}${prefix}-form-phone.png` });
await page.close();

// --- credit decline branch ---
page = await newPage(1440, 980);
await page.goto(base, { waitUntil: 'networkidle0', timeout: 30000 });
await settle(1000);
await clickByText.call(null, 'Refinance');
// redefine helper bound to this page
const clickByText2 = async (text) => {
  await page.evaluate((t) => {
    const btns = [...document.querySelectorAll('#eligibility button')];
    const b = btns.find((x) => x.textContent.toLowerCase().includes(t.toLowerCase()));
    if (b) b.click();
  }, text);
  await settle(700);
};
await clickByText2('Refinance');
await clickByText2('Single family');
await clickByText2('Below 620');
await page.screenshot({ path: `${outDir}${prefix}-form-decline.png` });
await page.close();

// --- thank-you (seed sessionStorage first) ---
page = await newPage(1440, 1600);
await page.goto(base, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => {
  sessionStorage.setItem('lead-summary', JSON.stringify({
    firstName: 'Tanner', goal: 'purchase', propertyType: 'sfr', credit: '700-739', price: 350000, state: 'Texas',
  }));
});
await page.goto(`${base}/thank-you`, { waitUntil: 'networkidle0', timeout: 30000 });
await settle(2200);
await page.screenshot({ path: `${outDir}${prefix}-thankyou.png`, fullPage: true });
await page.close();

console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
console.log('done');

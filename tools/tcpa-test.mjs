// TCPA gate test. Drives the real form to the phone step and asserts:
//   1. the checkbox exists, starts UNCHECKED, and sits ABOVE the submit button
//   2. submitting unchecked is blocked and fires NO network call
//   3. checking it and submitting fires exactly one POST carrying the full
//      consent record (flag + verbatim text + timestamp + url)
// Run with the dev server up: node tools/tcpa-test.mjs
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const base = 'http://localhost:4321';
const outDir = fileURLToPath(new URL('./shots/', import.meta.url));
mkdirSync(outDir, { recursive: true });   // shots/ is gitignored, so it may not exist on a fresh clone

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--hide-scrollbars', '--force-color-profile=srgb'],
});

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });

const posts = [];
await page.setRequestInterception(true);
page.on('request', (r) => {
  if (r.url().includes('/api/lead') && r.method() === 'POST') {
    posts.push(JSON.parse(r.postData() || '{}'));
    r.respond({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    return;
  }
  r.continue();
});

const settle = (ms) => new Promise((r) => setTimeout(r, ms));
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

await page.goto(base, { waitUntil: 'networkidle0', timeout: 30000 });
await settle(1200);

await clickByText('Buy a rental');
await clickByText('Single family');
await clickByText('700');
await clickByText('Continue');   // price
await clickByText('Continue');   // down payment
await page.evaluate(() => {
  const inputs = [...document.querySelectorAll('#eligibility input')].filter((i) => i.id !== 'ff-company');
  const setVal = (el, v) => {
    const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    s.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  setVal(inputs[0], 'GateTest');
  setVal(inputs[1], 'tanner@creloanpro.com');
});
await settle(300);
await clickByText('Continue');
await settle(600);

// phone
await page.evaluate(() => {
  const tel = document.querySelector('#eligibility input[type=tel]');
  const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  s.call(tel, '8555452022');
  tel.dispatchEvent(new Event('input', { bubbles: true }));
});
await settle(500);

const initial = await page.$eval('#ff-tcpa', (el) => el.checked).catch(() => 'NOT FOUND');
console.log('checkbox initial checked =', initial, '(expect false)');

const order = await page.evaluate(() => {
  const cb = document.querySelector('#ff-tcpa');
  const btn = [...document.querySelectorAll('#eligibility button')].find((b) => b.textContent.includes('Get My DSCR Pricing Options'));
  if (!cb || !btn) return 'missing';
  return cb.getBoundingClientRect().top < btn.getBoundingClientRect().top ? 'ABOVE' : 'BELOW';
});
console.log('checkbox is', order, 'the submit button (expect ABOVE)');
await page.screenshot({ path: `${outDir}tcpa-mobile-phone-step.png` });

// TEST 1: unchecked submit must be blocked
await clickByText('Get My DSCR Pricing Options');
await settle(1000);
console.log('TEST 1 unchecked -> POSTs:', posts.length, '(expect 0)');
console.log('TEST 1 error shown:', await page.evaluate(() => {
  const p = [...document.querySelectorAll('#eligibility p')].find((n) => n.textContent.includes('consent box'));
  return p ? p.textContent.trim() : 'NO ERROR SHOWN';
}));
await page.screenshot({ path: `${outDir}tcpa-mobile-blocked.png` });

// TEST 2: checked submit goes through with the consent record
await page.click('#ff-tcpa');
await settle(400);
await clickByText('Get My DSCR Pricing Options');
await settle(1800);
console.log('TEST 2 checked -> POSTs:', posts.length, '(expect 1)');
if (posts[0]) {
  const p = posts[0];
  console.log('  tcpaConsent    :', p.tcpaConsent);
  console.log('  tcpaConsentAt  :', p.tcpaConsentAt);
  console.log('  tcpaConsentUrl :', p.tcpaConsentUrl);
  console.log('  tcpaConsentText:', String(p.tcpaConsentText).slice(0, 60) + '...');
  console.log('  partial        :', p.partial, '| phone:', p.phone);
}

await browser.close();

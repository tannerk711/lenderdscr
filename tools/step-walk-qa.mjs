// Step-walk QA for the PMF-model 7-step form (2026-08-24).
// Shoots every step at 390x844, then verifies the sub-620 hard exit.
// Run with the dev server up: ILD_BASE=http://localhost:4323 node tools/step-walk-qa.mjs
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const base = process.env.ILD_BASE || 'http://localhost:4321';
const outDir = fileURLToPath(new URL('./shots/', import.meta.url));
mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--hide-scrollbars', '--force-color-profile=srgb'],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

const settle = (ms) => new Promise((r) => setTimeout(r, ms));
const click = async (text) => {
  const ok = await page.evaluate((t) => {
    const btns = [...document.querySelectorAll('#eligibility button')];
    const b = btns.find((x) => x.textContent.toLowerCase().includes(t.toLowerCase()));
    if (b) { b.click(); return true; }
    return false;
  }, text);
  console.log(ok ? 'clicked' : 'CLICK MISS', ':', text);
  await settle(700);
};
const shootStep = async (name) => {
  await page.screenshot({ path: `${outDir}walk-${name}.png` });
  const title = await page.evaluate(() => document.querySelector('#eligibility h3')?.textContent?.trim() || '(none)');
  console.log(`  [${name}] title: ${title}`);
};

await page.goto(base, { waitUntil: 'networkidle0', timeout: 30000 });
await settle(1200);
await shootStep('1-goal');
await click('Purchase');
await shootStep('2-property');
await click('Single Family');
await shootStep('3-credit');
await click('700');
await shootStep('4-price');
await click('Continue');
await shootStep('5-down');
await click('Continue');
await shootStep('6-name');
await page.evaluate(() => {
  const inputs = [...document.querySelectorAll('#eligibility input')].filter((el) => el.id !== 'ff-company');
  const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  s.call(inputs[0], 'QA Walk'); inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
  s.call(inputs[1], 'qa@example.com'); inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
});
await settle(300);
await click('Continue');
await shootStep('7-phone');

// refi branch: fresh load, Cash Out Refinance -> value/balance titles
await page.goto(base, { waitUntil: 'networkidle0' });
await settle(900);
await click('Cash Out Refinance');
await click('Single Family');
await click('700');
await shootStep('refi-price');
await click('Continue');
await shootStep('refi-balance');

// sub-620 hard exit
await page.goto(base, { waitUntil: 'networkidle0' });
await settle(900);
await click('Purchase');
await click('Single Family');
await click('619 or less');
await settle(1200);
const url = page.url();
console.log('sub-620 landed on:', url, url.includes('/not-yet') ? 'PASS' : 'FAIL');
await page.screenshot({ path: `${outDir}walk-not-yet.png` });

await browser.close();
console.log('done ->', outDir);

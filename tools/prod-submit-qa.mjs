// Real-browser PRODUCTION submit QA. Walks the live funnel end to end and
// submits a clearly-labeled test lead so the whole chain proves out:
// form -> /api/lead -> Zapier -> GHL. Started with ?qa=1, so the Ads
// conversion on /thank-you is suppressed and the test never pollutes data.
//
//   node tools/prod-submit-qa.mjs [baseUrl]     (default https://lenderdscr.com)
//
// The lead lands in GHL as "TEST ProdQA DeleteMe": delete it after checking.
import puppeteer from 'puppeteer-core';

const base = (process.argv[2] || 'https://lenderdscr.com').replace(/\/$/, '');

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });

let apiStatus = null;
page.on('response', (r) => {
  if (r.url().includes('/api/lead')) apiStatus = r.status();
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
  await settle(800);
};
const fillInput = async (idx, val) => {
  await page.evaluate(({ i, v }) => {
    const inputs = [...document.querySelectorAll('#eligibility input')].filter((el) => el.id !== 'ff-company');
    const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    s.call(inputs[i], v);
    inputs[i].dispatchEvent(new Event('input', { bubbles: true }));
  }, { i: idx, v: val });
  await settle(300);
};

console.log(`walking ${base}/?qa=1 ...`);
await page.goto(`${base}/?qa=1`, { waitUntil: 'networkidle0', timeout: 45000 });
await settle(2000);

await clickByText('Buy a rental');
await clickByText('Making offers');
await clickByText('Single family');
await clickByText('700');
await clickByText('Continue');           // price
await clickByText('Continue');           // deal structure
await fillInput(0, 'Fort Worth');        // city
await clickByText('Continue');
await fillInput(0, 'TEST ProdQA DeleteMe');
await fillInput(1, 'tanner@creloanpro.com');
await clickByText('Continue');
await settle(600);
await page.evaluate(() => {
  const tel = document.querySelector('#eligibility input[type=tel]');
  const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  s.call(tel, '8555452022');
  tel.dispatchEvent(new Event('input', { bubbles: true }));
});
await settle(400);
await page.click('#ff-tcpa');
await settle(400);
await clickByText('Get My DSCR Pricing Options');

// wait for the redirect to /thank-you
try {
  await page.waitForFunction(() => window.location.pathname === '/thank-you', { timeout: 20000 });
} catch { /* fall through to the report below */ }
await settle(2500);

const url = page.url();
const conversionSuppressed = await page.evaluate(() => sessionStorage.getItem('qa') === '1');
console.log('POST /api/lead status :', apiStatus, '(expect 200)');
console.log('landed on            :', url, '(expect /thank-you)');
console.log('qa suppression active:', conversionSuppressed, '(expect true; no Ads conversion fired)');
console.log(url.includes('/thank-you') && apiStatus === 200
  ? '\nPROD SUBMIT OK. Delete "TEST ProdQA DeleteMe" from GHL after checking the Zap mapping.'
  : '\nPROD SUBMIT FAILED, investigate before calling this shipped.');
await browser.close();
process.exit(url.includes('/thank-you') && apiStatus === 200 ? 0 : 1);

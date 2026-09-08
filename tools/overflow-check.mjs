import puppeteer from 'puppeteer-core';
const BASE = process.env.QA_BASE || 'http://localhost:4323';
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const pages = ['/', '/dscr-loans', '/dscr-loans/texas', '/dscr-loans/district-of-columbia', '/thank-you', '/not-yet', '/privacy', '/terms', '/nope-404'];
const widths = [390, 320];
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
let fail = 0;
for (const w of widths) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: 844, deviceScaleFactor: 1, hasTouch: true });
  for (const p of pages) {
    await page.goto(BASE + p, { waitUntil: 'networkidle0', timeout: 30000 });
    // scroll through so lazy/reveal content mounts
    await page.evaluate(async () => {
      const d = document.documentElement;
      for (let y = 0; y < d.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
      window.scrollTo(0, 0);
    });
    const r = await page.evaluate(() => {
      const d = document.documentElement;
      const res = { sw: d.scrollWidth, cw: d.clientWidth, offenders: [] };
      if (d.scrollWidth > d.clientWidth) {
        for (const el of document.querySelectorAll('*')) {
          const rect = el.getBoundingClientRect();
          if (rect.right > d.clientWidth + 1 || rect.left < -1) {
            res.offenders.push(`${el.tagName}.${(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className) || ''} r=${Math.round(rect.right)} l=${Math.round(rect.left)}`);
            if (res.offenders.length > 8) break;
          }
        }
      }
      return res;
    });
    const ok = r.sw <= r.cw;
    if (!ok) fail++;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${w}px ${p}  scrollWidth=${r.sw} clientWidth=${r.cw}`);
    if (!ok) r.offenders.forEach(o => console.log('       ', o));
  }
  await page.close();
}
await browser.close();
process.exit(fail ? 1 : 0);

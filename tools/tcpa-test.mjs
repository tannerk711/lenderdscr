// TCPA gate test (BRIEF section 13). Drives the real form to the phone step at 390x844 and asserts:
//   1. #ff-tcpa exists and starts UNCHECKED
//   2. its <label class="tcpa-box"> sits ABOVE [data-action=submit] in DOM order AND visually
//   3. submitting unchecked fires ZERO POSTs to /api/lead and shows a [data-error] containing "consent box"
//   4. checked submit fires exactly one POST whose body carries the full consent record:
//      tcpaConsent true, tcpaConsentText non-empty with no substring "mode", ISO tcpaConsentAt,
//      tcpaConsentUrl, tcpaConsentMode, tcpaConsentParties.length >= 1
//   5. the rendered label text contains the shipped tcpaConsentText (record and legal text cannot desync)
// The POST is intercepted and stubbed; no webhook is ever hit.
//
//   CI=true npm run dev ; node tools/tcpa-test.mjs
import {
  QA_BASE,
  VIEWPORTS,
  readSiteConfig,
  launchBrowser,
  openPage,
  walkPurchase,
  clickAction,
  toggleTcpa,
  visibleError,
  makeChecker,
  ensureShots,
  shotPath,
  norm,
  settle,
} from './qa-lib.mjs';

const site = readSiteConfig();
const vp = VIEWPORTS.mobile;
const { check, summary } = makeChecker();
const errors = [];
ensureShots();
console.log(`tcpa-test: ${QA_BASE}  brand "${site.brandName}"  mode ${site.mode}\n`);

const browser = await launchBrowser(vp);
let exit = 1;
try {
  const posts = [];
  const page = await openPage(browser, '/', { vp, errors, posts });
  await walkPurchase(page, { consent: false });

  // 1. exists + unchecked
  const initial = await page.evaluate(() => {
    const cb = document.querySelector('#ff-tcpa');
    return cb ? { found: true, checked: cb.checked, type: cb.type } : { found: false };
  });
  check('#ff-tcpa exists', initial.found);
  check('#ff-tcpa is a native checkbox', initial.type === 'checkbox', String(initial.type));
  check('#ff-tcpa starts UNCHECKED', initial.found && initial.checked === false);

  // 2. label above submit, DOM order + visually
  const pos = await page.evaluate(() => {
    const cb = document.querySelector('#ff-tcpa');
    const label = cb?.closest('label.tcpa-box') || cb?.closest('label');
    const btn = document.querySelector('#start [data-action="submit"]');
    if (!cb || !label || !btn) return { missing: `${!cb ? '#ff-tcpa ' : ''}${!label ? 'label ' : ''}${!btn ? '[data-action=submit]' : ''}`.trim() };
    const lr = label.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    return {
      domBefore: !!(label.compareDocumentPosition(btn) & Node.DOCUMENT_POSITION_FOLLOWING),
      labelBottom: Math.round(lr.bottom),
      buttonTop: Math.round(br.top),
      visuallyAbove: lr.bottom <= br.top + 1,
      labelIsTcpaBox: label.classList.contains('tcpa-box'),
      labelText: label.textContent,
    };
  });
  check('tcpa label + submit button found', !pos.missing, pos.missing || '');
  check('label is <label class="tcpa-box"> wrapping #ff-tcpa', pos.labelIsTcpaBox === true);
  check('label precedes submit in DOM order', pos.domBefore === true);
  check('label sits visually above submit', pos.visuallyAbove === true, `label bottom ${pos.labelBottom} vs button top ${pos.buttonTop}`);
  await page.screenshot({ path: shotPath('tcpa', 'phone-step') });

  // 3. unchecked submit is blocked
  const urlBefore = page.url();
  await clickAction(page, 'submit');
  await settle(1200);
  check('unchecked submit -> zero POSTs to /api/lead', posts.length === 0, `${posts.length} posts`);
  check('unchecked submit -> no navigation', page.url() === urlBefore, page.url());
  const err = await visibleError(page);
  check('visible [data-error] contains "consent box"', /consent box/i.test(err), err || 'NO VISIBLE ERROR');
  if (site.errors.consent) check('error text equals form.errors.consent', norm(err) === norm(site.errors.consent), `config: "${site.errors.consent}"`);
  const stillUnchecked = await page.evaluate(() => document.querySelector('#ff-tcpa')?.checked);
  check('checkbox still unchecked after blocked submit', stillUnchecked === false);
  await page.screenshot({ path: shotPath('tcpa', 'blocked') });

  // 4. checked submit goes through with the consent record
  const beforeClick = Date.now();
  const checked = await toggleTcpa(page);
  check('clicking #ff-tcpa checks it', checked === true, String(checked));
  const consented = await page.evaluate(() => document.querySelector('#ff-tcpa')?.closest('label')?.classList.contains('is-consented'));
  if (consented !== true) console.log('      WARN label did not gain .is-consented after the click');
  await settle(200);
  const nav = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null);
  await clickAction(page, 'submit');
  const deadline = Date.now() + 10000;
  while (posts.length === 0 && Date.now() < deadline) await settle(200);
  await nav;
  check('checked submit -> exactly one POST', posts.length === 1, `${posts.length} posts`);

  const p = posts[0] || {};
  const text = String(p.tcpaConsentText ?? '');
  check('tcpaConsent === true', p.tcpaConsent === true, String(p.tcpaConsent));
  check('tcpaConsentText non-empty', text.length > 50, `${text.length} chars`);
  check('tcpaConsentText contains no substring "mode"', !/mode/i.test(text));
  check('tcpaConsentText carries the automated-technology clause', /automated technology/i.test(text) && /prerecorded/i.test(text));
  const at = String(p.tcpaConsentAt ?? '');
  const atMs = Date.parse(at);
  check('tcpaConsentAt is an ISO timestamp', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(at) && Number.isFinite(atMs), at);
  check('tcpaConsentAt stamped at the click (not at submit/load)', Number.isFinite(atMs) && atMs >= beforeClick - 2000 && atMs <= Date.now() + 2000, at);
  check('tcpaConsentUrl is an http(s) URL', /^https?:\/\//.test(String(p.tcpaConsentUrl)), String(p.tcpaConsentUrl));
  check('tcpaConsentMode present', typeof p.tcpaConsentMode === 'string' && p.tcpaConsentMode.length > 0, String(p.tcpaConsentMode));
  if (p.tcpaConsentMode && p.tcpaConsentMode !== site.mode) console.log(`      WARN tcpaConsentMode "${p.tcpaConsentMode}" != site.mode "${site.mode}"`);
  check('tcpaConsentParties.length >= 1', Array.isArray(p.tcpaConsentParties) && p.tcpaConsentParties.length >= 1, JSON.stringify(p.tcpaConsentParties));
  check('partial === false', p.partial === false);
  check('phone is 10 digits', /^\d{10}$/.test(String(p.phone)), String(p.phone));

  // 5. label text matches the shipped record
  check('rendered label contains the shipped tcpaConsentText', text.length > 0 && norm(pos.labelText).includes(norm(text)));

  console.log(`\nlanded on: ${page.url()}`);
  await page.close();

  const pageErrors = errors.filter((e) => e.startsWith('[pageerror'));
  if (errors.length) console.log(`browser errors:\n  ${errors.join('\n  ')}`);
  check('no uncaught page errors', pageErrors.length === 0, `${pageErrors.length}`);
  exit = summary() ? 0 : 1;
} catch (e) {
  console.log(`\nFATAL: ${e.message}`);
  exit = 1;
} finally {
  await browser.close();
}
process.exit(exit);

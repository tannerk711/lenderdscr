// Real-browser production submit (the mandatory last QA step for every form
// deploy). Drives the LIVE form on QA_BASE end to end with ?qa=1 on the landing
// URL (posts a REAL lead through /api/lead to the Zap, but suppresses the Ads
// conversion on /thank-you), using the "TEST ProdQA DeleteMe" name so Tanner can
// find and delete it in GHL. Asserts the server answered {ok:true, forwarded:true},
// the payload carried lastName + city + variant, the page landed on /thank-you,
// and no conversion was pushed. Uses real Chrome networking (the deployed origin
// must be reachable), so run it against the branch deployment or the subdomain.
//
//   QA_BASE=https://go.lenderdscr.com node tools/prod-submit-qa.mjs
//   QA_BASE=https://<branch-deployment>.vercel.app QA_FORM_PATH=/start node tools/prod-submit-qa.mjs
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const BASE = (process.env.QA_BASE || '').replace(/\/+$/, '');
if (!BASE) {
  console.error('QA_BASE is required (the deployed origin)');
  process.exit(1);
}
const FORM = (process.env.QA_FORM_PATH || '/').replace(/\/+$/, '') || '/';
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BRAND = 'Internet Loans Direct';
const LEAD = {
  first: 'TEST ProdQA',
  last: 'DeleteMe',
  email: process.env.QA_EMAIL || 'tanner+qa@creloanpro.com',
  phone: process.env.QA_PHONE || '3035550123',
  city: 'Fort Worth',
};

const results = [];
const check = (label, ok, detail = '') => {
  results.push({ label, ok });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
  return ok;
};
const settle = (ms) => new Promise((r) => setTimeout(r, ms));
if (!existsSync(CHROME)) {
  console.error(`Chrome not found at ${CHROME}`);
  process.exit(1);
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-first-run', '--no-default-browser-check'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, hasTouch: true });
// A .vercel.app preview URL sits behind Vercel Authentication; the custom domain
// does not. QA_BYPASS = the project's Protection Bypass for Automation secret.
if (process.env.QA_BYPASS) await page.setExtraHTTPHeaders({ 'x-vercel-protection-bypass': process.env.QA_BYPASS, 'x-vercel-set-bypass-cookie': 'true' });
const posts = [];
let response = null;
await page.evaluateOnNewDocument(() => {
  const orig = window.fetch;
  window.fetch = async (...args) => {
    const res = await orig(...args);
    try {
      const url = typeof args[0] === 'string' ? args[0] : args[0] && args[0].url;
      if (url && String(url).includes('/api/lead')) {
        const body = await res.clone().text();
        sessionStorage.setItem('__qa_lead_response', JSON.stringify({ status: res.status, body }));
      }
    } catch {}
    return res;
  };
});
page.on('request', (r) => {
  if (r.url().includes('/api/lead') && r.method() === 'POST') {
    try {
      posts.push(JSON.parse(r.postData() || '{}'));
    } catch {
      posts.push({ __unparseable: r.postData() });
    }
  }
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

const waitStep = async (id) => {
  await page.waitForSelector(`#start [data-step="${id}"]`, { timeout: 15000 });
  await settle(450);
};
const clickValue = (v) => page.evaluate((v) => { const el = document.querySelector(`#start [data-value="${v}"]`); el.scrollIntoView({ block: 'center' }); el.click(); }, v);
const clickAction = (a) => page.evaluate((a) => { const el = document.querySelector(`#start [data-action="${a}"]`); el.scrollIntoView({ block: 'center' }); el.click(); }, a);
const typeInto = async (sel, text) => {
  await page.waitForSelector(sel, { timeout: 8000 });
  await page.click(sel, { clickCount: 3 });
  await page.type(sel, text, { delay: 8 });
};

console.log(`prod-submit-qa: ${BASE}${FORM}?qa=1&utm_source=prodqa&utm_content=prodqa-b`);
try {
  await page.goto(`${BASE}${FORM}?qa=1&utm_source=prodqa&utm_content=prodqa-b`, { waitUntil: 'networkidle2', timeout: 60000 });
  const title = await page.title();
  check('page title carries the brand', title.includes(BRAND), title);
  // the LP indexes on the apex (seo.noindexSite false); a noindex,nofollow LP means the site flag is on
  check('LP robots meta absent (indexable apex funnel)', (await page.evaluate(() => document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '')) === '');
  check('sessionStorage.qa = 1 (conversion suppressed for this tab)', (await page.evaluate(() => sessionStorage.getItem('qa'))) === '1');
  await waitStep('goal');
  await clickValue('purchase');
  await waitStep('stage');
  await clickValue('actively-looking-at-properties');
  await waitStep('propertyType');
  await clickValue('sfr');
  await waitStep('credit');
  await clickValue('680-739');
  await waitStep('price');
  await clickAction('continue');
  await waitStep('secondary');
  await clickAction('continue');
  await waitStep('city');
  await typeInto('#ff-city', LEAD.city.toLowerCase());
  await settle(150);
  await clickAction('continue');
  await waitStep('contact');
  await typeInto('#ff-first', LEAD.first);
  await typeInto('#ff-last', LEAD.last);
  await typeInto('#ff-email', LEAD.email);
  await settle(150);
  await clickAction('continue');
  await waitStep('phone');
  await typeInto('#ff-phone', LEAD.phone);
  await settle(150);
  await page.evaluate(() => document.querySelector('#ff-tcpa').click());
  await settle(250);
  const nav = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null);
  await clickAction('submit');
  await nav;
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline && !/\/thank-you/.test(page.url())) await settle(250);
  await settle(1500);
  check('landed on /thank-you', /\/thank-you/.test(page.url()), page.url());
  try {
    const raw = await page.evaluate(() => sessionStorage.getItem('__qa_lead_response'));
    if (raw) {
      const rec = JSON.parse(raw);
      response = { status: rec.status, body: JSON.parse(rec.body) };
    }
  } catch {}
  check('/api/lead answered {ok:true, forwarded:true}', !!response && response.status === 200 && response.body?.ok === true && response.body?.forwarded === true, JSON.stringify(response));
  check('exactly one POST /api/lead', posts.length === 1, `${posts.length}`);
  const p = posts[0] || {};
  check('payload: firstName / lastName / city / variant / source', p.firstName === LEAD.first && p.lastName === LEAD.last && p.city === LEAD.city && p.variant === 'b-t4-v1' && p.source === 'lenderdscr', `${p.firstName} ${p.lastName} / ${p.city} / ${p.variant} / ${p.source}`);
  check('payload: attribution shipped (utm_source, utm_content) + landingPage with the query', p.utm_source === 'prodqa' && p.utm_content === 'prodqa-b' && /qa=1/.test(String(p.landingPage)), `${p.utm_source}/${p.utm_content}/${p.landingPage}`);
  check('payload: tcpaConsent true + consent record fields', p.tcpaConsent === true && typeof p.tcpaConsentText === 'string' && p.tcpaConsentText.length > 400 && /^\d{4}-/.test(String(p.tcpaConsentAt)) && String(p.tcpaConsentUrl).startsWith(BASE), `${String(p.tcpaConsentText).length} chars`);
  check('payload: state Texas, phone 10 digits, partial false', p.state === 'Texas' && /^\d{10}$/.test(String(p.phone)) && p.partial === false);
  const ty = await page.evaluate(() => ({
    name: document.querySelector('#ty-name')?.textContent.trim() ?? null,
    chips: [...document.querySelectorAll('#ty-chips .lo-chip')].map((c) => c.textContent.trim()),
    convs: (Array.isArray(window.dataLayer) ? window.dataLayer : []).filter((e) => e && e[0] === 'event' && e[1] === 'conversion').length,
    fired: sessionStorage.getItem('conv_fired'),
    gtagLoaded: typeof window.google_tag_manager === 'object' || [...document.scripts].some((s) => /googletagmanager\.com\/gtag\/js/.test(s.src)),
  }));
  // the H1 greets by the FIRST TOKEN of firstName by design ("Nice work, TEST")
  check('/thank-you personalized with the first name (first token)', !!ty.name && ty.name.includes(LEAD.first.split(' ')[0]), String(ty.name));
  check('/thank-you chips rendered', ty.chips.length >= 4, ty.chips.join('|'));
  check('/thank-you: gtag.js actually loaded from Google (live tag)', ty.gtagLoaded === true);
  check('/thank-you: conversion suppressed by ?qa=1 (no conversion event, conv_fired unset)', ty.convs === 0 && ty.fired === null, `${ty.convs} events, fired=${ty.fired}`);
  check('no uncaught page errors', errors.length === 0, errors.join(' | '));
} catch (e) {
  check('walk completed', false, e.message);
} finally {
  await browser.close();
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed${failed.length ? `\nFAILED:\n  ${failed.map((f) => f.label).join('\n  ')}` : ''}`);
console.log('\nGHL: find the contact "TEST ProdQA DeleteMe" and delete it.');
process.exit(failed.length ? 1 : 0);

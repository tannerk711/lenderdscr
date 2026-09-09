// Payload key diff against BRIEF section 5 (QA stage, item 6). Reads every
// tools/shots/walk-payload-<viewport>-<path>.json that form-walk.mjs captured
// from a real POST /api/lead and reports, per file: missing keys, extra keys,
// order mismatches, and any key that looks like a rename of a contract key
// (case-insensitive or underscore/camel variant). Also asserts the value
// contract that the Zap map depends on (null/'' present, never absent; the
// attribution block only when present; variant + source last).
// Exit 1 on any defect. Prints CLEAN when every file matches.
//
//   node tools/payload-diff.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SHOTS = fileURLToPath(new URL('./shots/', import.meta.url));

// BRIEF section 5, verbatim order.
const HEAD = [
  'goal', 'goalLabel', 'stage', 'stageLabel', 'propertyType', 'propertyTypeLabel', 'credit',
  'price', 'priceDisplay', 'downPct', 'downPctDisplay', 'downPayment', 'downPaymentDisplay',
  'balance', 'balanceDisplay', 'equity', 'equityDisplay', 'rehab', 'rehabDisplay', 'scenarioDetail',
  'city', 'state', 'firstName', 'lastName', 'email', 'phone',
  'partial',
  'tcpaConsent', 'tcpaConsentText', 'tcpaConsentAt', 'tcpaConsentUrl',
];
const ATTR = ['gclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
const TAIL = ['landingPage', 'secondsToComplete', 'website', 'submittedAt', 'variant', 'source'];
const CONTRACT = [...HEAD, ...ATTR, ...TAIL];

const norm = (k) => k.toLowerCase().replace(/[_-]/g, '');

const files = readdirSync(SHOTS).filter((f) => /^walk-payload-.*\.json$/.test(f)).sort();
if (!files.length) {
  console.error(`payload-diff: no walk-payload-*.json in ${SHOTS}; run tools/form-walk.mjs first`);
  process.exit(1);
}

let defects = 0;
for (const f of files) {
  const p = JSON.parse(readFileSync(SHOTS + f, 'utf8'));
  const got = Object.keys(p);
  const attrsPresent = ATTR.filter((k) => k in p);
  const want = [...HEAD, ...attrsPresent, ...TAIL];
  const missing = want.filter((k) => !got.includes(k));
  const extra = got.filter((k) => !want.includes(k));
  const renamed = extra
    .map((k) => {
      const hit = CONTRACT.find((c) => norm(c) === norm(k) && c !== k);
      return hit ? `${k} (looks like ${hit})` : null;
    })
    .filter(Boolean);
  const orderOk = got.length === want.length && got.every((k, i) => k === want[i]);
  const firstMismatch = got.findIndex((k, i) => k !== want[i]);

  const valueIssues = [];
  if (p.city !== '') valueIssues.push(`city=${JSON.stringify(p.city)} (want '')`);
  if (p.state !== 'Texas') valueIssues.push(`state=${JSON.stringify(p.state)} (want 'Texas')`);
  if (p.partial !== false) valueIssues.push(`partial=${JSON.stringify(p.partial)} (want false)`);
  if (p.tcpaConsent !== true) valueIssues.push(`tcpaConsent=${JSON.stringify(p.tcpaConsent)} (want true)`);
  if (typeof p.tcpaConsentText !== 'string' || !/^By continuing you expressly consent to having Internet Loans Direct contact you/.test(p.tcpaConsentText) || !/can be revoked at any time\.$/.test(p.tcpaConsentText)) valueIssues.push('tcpaConsentText is not the ILD tcpaCopy');
  if (!/^\d{4}-\d{2}-\d{2}T/.test(String(p.tcpaConsentAt))) valueIssues.push('tcpaConsentAt not ISO');
  if (!/^\d{4}-\d{2}-\d{2}T/.test(String(p.submittedAt))) valueIssues.push('submittedAt not ISO');
  if (!/^https?:\/\/[^/]+\/start/.test(String(p.tcpaConsentUrl))) valueIssues.push(`tcpaConsentUrl=${p.tcpaConsentUrl}`);
  if (!/^\/start/.test(String(p.landingPage))) valueIssues.push(`landingPage=${p.landingPage}`);
  if (typeof p.secondsToComplete !== 'number') valueIssues.push(`secondsToComplete=${JSON.stringify(p.secondsToComplete)}`);
  if (p.website !== '') valueIssues.push(`website=${JSON.stringify(p.website)}`);
  if (p.variant !== 'b-t4-v1') valueIssues.push(`variant=${p.variant}`);
  if (p.source !== 'ild-split-test') valueIssues.push(`source=${p.source}`);
  if (!/^\d{10}$/.test(String(p.phone))) valueIssues.push(`phone=${p.phone}`);
  if (!(typeof p.price === 'number' || p.price === '3000000+')) valueIssues.push(`price=${JSON.stringify(p.price)}`);
  for (const k of ['tcpaConsentIp', 'tcpaConsentUserAgent', 'tcpaConsentReceivedAt']) {
    if (k in p) valueIssues.push(`${k} present in the BROWSER payload (server-only stamp)`);
  }
  // per-path nulls
  if (p.goal === 'purchase') {
    if (typeof p.downPct !== 'number' || typeof p.downPctDisplay !== 'string') valueIssues.push('buy: downPct/downPctDisplay');
    if (!(p.balance === null && p.balanceDisplay === null && p.equity === null && p.equityDisplay === null && p.rehab === null && p.rehabDisplay === null)) valueIssues.push('buy: refi/flip fields not null');
  } else if (p.goal === 'refinance') {
    if (!(p.downPct === null && p.downPctDisplay === null && p.downPayment === null && p.downPaymentDisplay === null && p.rehab === null && p.rehabDisplay === null)) valueIssues.push('refi: buy/flip fields not null');
    if (!(p.balance === null && typeof p.balanceDisplay === 'string' && p.equity === null && p.equityDisplay === null)) valueIssues.push('refi: balance/equity shape');
  } else if (p.goal === 'bridge') {
    if (!(p.downPct === null && p.downPayment === null && p.balance === null && p.balanceDisplay === null && p.equity === null && p.equityDisplay === null)) valueIssues.push('flip: buy/refi fields not null');
    if (!(p.rehab === null && typeof p.rehabDisplay === 'string')) valueIssues.push('flip: rehab shape');
  } else {
    valueIssues.push(`goal=${p.goal}`);
  }

  const ok = !missing.length && !extra.length && orderOk && !valueIssues.length;
  if (!ok) defects++;
  console.log(`${ok ? 'CLEAN  ' : 'DEFECT '} ${f}  ${got.length} keys${attrsPresent.length ? ` (attribution: ${attrsPresent.join(', ')})` : ''}`);
  if (missing.length) console.log(`         missing: ${missing.join(', ')}`);
  if (extra.length) console.log(`         extra:   ${extra.join(', ')}`);
  if (renamed.length) console.log(`         renamed: ${renamed.join(', ')}`);
  if (!orderOk && firstMismatch >= 0) console.log(`         order:   position ${firstMismatch} has ${got[firstMismatch]} (want ${want[firstMismatch]})`);
  for (const v of valueIssues) console.log(`         value:   ${v}`);
}

console.log(defects ? `\npayload-diff: ${defects} file(s) with defects` : `\npayload-diff: CLEAN (${files.length} files match BRIEF section 5 in order)`);
process.exit(defects ? 1 : 0);

// Flow spec for the /start form: the V1 (LeaderOne-style) eight-step DSCR
// eligibility form exactly as Tanner edited it on 2026-09-04
// (_ref/form-templates/flow.ts), minus the state step because Texas is fixed
// (BRIEF section 4). Option VALUES come from src/config/site.ts: they are the
// Zap field-map contract and never change here. Question wording comes from
// site.ts `form` where it exists and from this file otherwise.
//
// buildPayload() is the ONLY place the lead payload is assembled. Key order is
// BRIEF section 5, verbatim; the CRM map depends on it. Never rename a key,
// never let one go missing: null / '' when a path does not use it.

import {
  brand,
  goals,
  propertyTypes,
  creditBands,
  tcpaCopy,
  form,
  fixedState,
  variant,
  leadDelivery,
} from '../config/site';

export type PathId = 'buy' | 'refi' | 'flip';
export type GoalValue = 'purchase' | 'refinance' | 'bridge';

export interface PathDef {
  id: PathId;
  goal: GoalValue;
  label: string;
}

const goalLabel = (v: GoalValue) => goals.find((g) => g.value === v)?.label ?? v;

// Step 1: What are you looking to do? (label-only; icons live in steps.tsx)
export const PATHS: PathDef[] = [
  { id: 'buy', goal: 'purchase', label: goalLabel('purchase') },
  { id: 'refi', goal: 'refinance', label: goalLabel('refinance') },
  { id: 'flip', goal: 'bridge', label: goalLabel('bridge') },
];

/** `/start?goal=purchase|refinance|bridge` -> the path it preselects (or undefined). */
export const pathForGoal = (goal: string | null | undefined): PathDef | undefined =>
  PATHS.find((p) => p.goal === goal);

export const STEP1_SUB = 'Takes about 60 seconds.';

// Step 2: Where are you in the process? (options vary by path)
export const PROCESS_OPTIONS: Record<PathId, string[]> = {
  buy: ['Just starting my research', 'Actively looking at properties', 'Made an offer or under contract'],
  refi: ['Just exploring my options', 'Comparing lenders', 'Ready to move now'],
  flip: ['Scouting deals', 'Deal under contract', 'Own it, planning the rehab'],
};

// Step 3: Tell us about the property. Seven types; value = Zap contract.
export const PROPERTY_TYPES: { value: string; label: string }[] = propertyTypes.map((p) => ({
  value: p.value,
  label: p.label,
}));

// Step 4: How's your credit right now? Kick out below 620.
export interface CreditOption {
  value: string;
  label: string;
  micro: string; // right-aligned micro-label (LeaderOne pattern)
  kickOut: boolean;
}
const CREDIT_MICRO: Record<string, string> = {
  '740+': 'Strongest terms',
  '680-739': 'Great DSCR range',
  '620-679': 'DSCR eligible',
};
export const CREDIT_OPTIONS: CreditOption[] = creditBands.map((c) => ({
  value: c.value,
  label: c.label,
  micro: CREDIT_MICRO[c.value] ?? '',
  kickOut: c.value === '<620',
}));

// In-form kick-out (honest, no fake workaround, door left open). Nothing is
// recorded and nothing is posted; /not-yet carries the five score moves.
export const KICKOUT = {
  headline: '620 is the line for DSCR.',
  body: `The DSCR programs at ${brand.name} start at a 620 credit score. The honest move is to work the score first. Once you cross 620, come back and run it again.`,
  linkLabel: 'See the fastest way back',
  linkHref: '/not-yet',
  backLabel: 'I picked the wrong range',
};

// Step 5: price. Wording varies by path; slider bounds shared.
export const PRICE_LABELS: Record<PathId, string> = {
  buy: form.titles.priceBuy,
  refi: form.titles.priceRefi,
  flip: form.titles.priceFlip,
};
export const PRICE_SUB = form.subs.price;
export const PRICE_MIN = 100_000;
export const PRICE_MAX = 3_000_000; // top of range renders "$3M+" and ships as the string '3000000+'
export const PRICE_STEP = 50_000;
export const PRICE_DEFAULT = 300_000;

// Step 6, buy path: down-payment slider 20% to 50%+ in 5% steps.
export const DOWN_MIN = 20;
export const DOWN_MAX = 50; // top renders "50%+"; ships as the number 50
export const DOWN_STEP = 5;
export const DOWN_DEFAULT = 25;

// Step 6, refi + flip: option forks in the same slot.
export const FORK_QUESTIONS: Record<PathId, { label: string; sub?: string; options: string[] }> = {
  buy: { label: form.titles.down, options: [] },
  refi: {
    label: form.titles.balance,
    sub: form.subs.balance,
    options: ['Free and clear', 'Less than 50%', '50% to 70%', 'Over 70%'],
  },
  flip: {
    label: form.titles.rehab,
    options: ['Under $25K', '$25K to $50K', '$50K to $100K', '$100K+'],
  },
};

// Steps 7 + 8
export const CONTACT_LABEL = form.titles.contact;
export const PHONE_LABEL = form.titles.phone; // no phone-step subtitle (Tanner, 2026-08-26)
export const SUBMIT_LABEL = form.submit;
export const SUBMITTING_LABEL = form.submitting;
export const ERRORS = form.errors;
export const CONSENT_TEXT = tcpaCopy; // ILD's verbatim tcpaCopy: rendered next to the box AND shipped

export const TOTAL_STEPS = form.totalSteps;
export const isTestMode = leadDelivery === 'test';

// ---------------------------------------------------------------------------
// Answers
// ---------------------------------------------------------------------------
export interface Answers {
  path?: PathId;
  stage?: string; // option text; slugged into payload.stage
  propertyType?: string; // value
  credit?: string; // value
  price: number; // PRICE_MIN..PRICE_MAX (PRICE_MAX = "3M+")
  downPct: number; // DOWN_MIN..DOWN_MAX (buy path)
  balance?: string; // option text (refi path)
  rehab?: string; // option text (flip path)
  firstName: string;
  lastName: string;
  email: string;
  phone: string; // formatted for display; digits only in the payload
}

export const INITIAL_ANSWERS: Answers = {
  price: PRICE_DEFAULT,
  downPct: DOWN_DEFAULT,
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
};

// ---------------------------------------------------------------------------
// Formatting + validation
// ---------------------------------------------------------------------------
export const fmtUsd = (n: number): string => '$' + Math.round(n).toLocaleString('en-US');
export const isMaxPrice = (v: number): boolean => v >= PRICE_MAX;
/** UI: "$350,000" / "$3M+" */
export const formatPrice = (v: number): string => (isMaxPrice(v) ? '$3M+' : fmtUsd(v));
/** Payload priceDisplay: "$350,000" / "$3,000,000+" */
export const formatPriceFull = (v: number): string => (isMaxPrice(v) ? '$3,000,000+' : fmtUsd(v));
export const formatDownPct = (v: number): string => (v >= DOWN_MAX ? '50%+' : `${v}%`);

export function phoneDigits(raw: string): string {
  return raw.replace(/\D/g, '').replace(/^1/, '').slice(0, 10);
}

export function formatPhone(raw: string): string {
  const d = phoneDigits(raw);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

// Same rule as /api/lead so a value the client accepts can never 400 server side.
export const isValidEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
export const isValidPhone = (v: string): boolean => phoneDigits(v).length === 10;
export const isValidFirstName = (v: string): boolean => v.trim().length >= 2; // server floor
export const isValidLastName = (v: string): boolean => v.trim().length >= 1;

export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// ---------------------------------------------------------------------------
// Attribution: first-touch gclid / utm_* captured to sessionStorage by
// Layout.astro on whichever page the visitor landed on (LP or /start). The
// URL is the fallback when storage is unavailable. Shipped only when present.
// ---------------------------------------------------------------------------
const ATTR_KEYS = ['gclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

export function readAttribution(): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof window === 'undefined') return out;
  let params: URLSearchParams | null = null;
  try {
    params = new URLSearchParams(window.location.search);
  } catch {
    params = null;
  }
  for (const k of ATTR_KEYS) {
    let v = '';
    try {
      v = window.sessionStorage.getItem(`attr_${k}`) || '';
    } catch {
      v = '';
    }
    if (!v && params) v = params.get(k) || '';
    if (v) out[k] = v;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Payload (BRIEF section 5, keys in this exact order)
// ---------------------------------------------------------------------------
export interface ConsentRecord {
  at: string; // ISO timestamp of the checkbox click
  url: string; // window.location.href where consent was captured
}

export interface PayloadMeta {
  consent: ConsentRecord;
  startedAt: number; // Date.now() of the first interaction, 0 if none
  honeypot: string; // value of the hidden `website` field ('' for humans)
}

export type LeadPayload = Record<string, unknown>;

const pathOf = (a: Answers): PathDef => PATHS.find((p) => p.id === a.path) ?? PATHS[0];
const propertyOf = (a: Answers) => PROPERTY_TYPES.find((p) => p.value === a.propertyType);

export function buildPayload(a: Answers, meta: PayloadMeta): LeadPayload {
  const path = pathOf(a);
  const prop = propertyOf(a);
  const isBuy = path.id === 'buy';
  const isRefi = path.id === 'refi';
  const isFlip = path.id === 'flip';
  const maxed = isMaxPrice(a.price);

  const price: number | string = maxed ? '3000000+' : a.price;
  const priceDisplay = formatPriceFull(a.price);

  const downPct = isBuy ? a.downPct : null;
  const downPctDisplay = isBuy ? formatDownPct(a.downPct) : null;
  const downPayment = isBuy && !maxed ? Math.round((a.downPct / 100) * a.price) : null;
  const downPaymentDisplay = downPayment !== null ? fmtUsd(downPayment) : null;

  const balanceDisplay = isRefi ? (a.balance ?? null) : null;
  const rehabDisplay = isFlip ? (a.rehab ?? null) : null;

  const scenarioDetail = isBuy
    ? `${downPctDisplay} down${downPayment !== null ? ` (about ${fmtUsd(downPayment)})` : ''}`
    : isRefi
      ? `Owes: ${balanceDisplay ?? ''}${balanceDisplay && /%/.test(balanceDisplay) ? ' of the value' : ''}`
      : `Rehab budget: ${rehabDisplay ?? ''}`;

  const attribution = readAttribution();
  const loc = typeof window !== 'undefined' ? window.location : null;

  return {
    goal: path.goal,
    goalLabel: path.label,
    stage: a.stage ? slugify(a.stage) : '',
    stageLabel: a.stage ?? '',
    propertyType: a.propertyType ?? '',
    propertyTypeLabel: prop?.label ?? '',
    credit: a.credit ?? '',
    price,
    priceDisplay,
    downPct,
    downPctDisplay,
    downPayment,
    downPaymentDisplay,
    balance: null,
    balanceDisplay,
    equity: null,
    equityDisplay: null,
    rehab: null,
    rehabDisplay,
    scenarioDetail,
    city: '',
    state: fixedState,
    firstName: a.firstName.trim(),
    lastName: a.lastName.trim(),
    email: a.email.trim(),
    phone: phoneDigits(a.phone),
    partial: false,
    // ---- TCPA consent record: what was agreed to, when, and where ----
    tcpaConsent: true,
    tcpaConsentText: CONSENT_TEXT,
    tcpaConsentAt: meta.consent.at,
    tcpaConsentUrl: meta.consent.url,
    ...attribution,
    landingPage: loc ? loc.pathname + loc.search : '',
    secondsToComplete: meta.startedAt ? Math.round((Date.now() - meta.startedAt) / 1000) : null,
    website: meta.honeypot,
    submittedAt: new Date().toISOString(),
    variant,
    source: 'ild-split-test',
  };
}

/** sessionStorage['lead-summary'], read by /thank-you. */
export function buildLeadSummary(a: Answers) {
  const path = pathOf(a);
  const prop = propertyOf(a);
  return {
    firstName: a.firstName.trim(),
    goal: path.goal,
    goalLabel: path.label,
    propertyType: a.propertyType ?? '',
    propertyTypeLabel: prop?.label ?? '',
    credit: a.credit ?? '',
    price: isMaxPrice(a.price) ? '3000000+' : a.price,
    priceDisplay: formatPriceFull(a.price),
    state: fixedState,
  };
}

/** Recap chips on the phone step: goal, property, Texas, price. */
export function summaryChips(a: Answers): string[] {
  const chips: string[] = [];
  const path = PATHS.find((p) => p.id === a.path);
  if (path) chips.push(path.label);
  const prop = propertyOf(a);
  if (prop) chips.push(prop.label);
  chips.push(fixedState);
  chips.push(formatPrice(a.price));
  return chips;
}

// ---------------------------------------------------------------------------
// TEST MODE capture (BRIEF section 3): every accepted payload is kept in this
// browser so Tanner can inspect on /test-leads what WOULD have been sent.
// ---------------------------------------------------------------------------
export const TEST_LEADS_KEY = 'ild_variant_test_leads';

export function recordTestLead(payload: LeadPayload): void {
  try {
    const existing: LeadPayload[] = JSON.parse(localStorage.getItem(TEST_LEADS_KEY) || '[]');
    existing.push(payload);
    localStorage.setItem(TEST_LEADS_KEY, JSON.stringify(existing));
  } catch {
    // storage unavailable (private mode); the console log still fires
  }
}

export function readTestLeads(): LeadPayload[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(TEST_LEADS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearTestLeads(): void {
  try {
    localStorage.removeItem(TEST_LEADS_KEY);
  } catch {
    // ignore
  }
}

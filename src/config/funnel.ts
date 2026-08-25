// ============================================================
// FUNNEL CONFIG: Internet Loans Direct (Paul Howarth).
// Everything brandable, legal, or client-specific lives here.
// Texas-only funnel. Every proof claim below is lifted from the
// client's own live site (lenderdscr.com), nothing invented:
// rates from 100+ lenders, same-day income & credit approval,
// 620 minimum credit, 15-25 day closings, no tax returns.
// NMLS: the client publishes NO NMLS number; the footer runs his
// site's lead-generator disclaimer instead. If Paul supplies an
// NMLS, set it here and it renders automatically.
// ============================================================

export const brand = {
  // Company
  name: 'Internet Loans Direct',
  shortName: 'Internet Loans Direct',
  nmls: '',                                 // none published on lenderdscr.com (open item for Paul)
  phone: '(855) 545-2022',
  phoneHref: 'tel:+18555452022',
  address: '',                              // none published (open item for Paul)
  site: 'lenderdscr.com',
  logo: '/images/ild-logo.png',             // transparent PNG, sky/deep blue + charcoal
  licensingUrl: 'https://www.nmlsconsumeraccess.org',

  // Proof (client's own published claims only, do not inflate)
  lenderCount: '100+',
  avgDaysToClose: 15,                       // "close in 15-25 days" per client FAQ; used as "as little as"
  closeRangeDays: '15 to 25',
  minCredit: '620',

  // Where the form submits (server-side forward target).
  // Set LEAD_WEBHOOK_URL in the environment; this is just the doc pointer.

  // Thank-you page booking embed. Leave '' to hide calendar and show phone CTA.
  bookingEmbedUrl: '',

  // Google Ads conversion. Acct 340-440-3562. Global tag renders site-wide from
  // Layout.astro; the conversion fires on the thank-you page only, and only for
  // a real submission or ?demo=1 (see thank-you.astro), so bots and stray loads
  // never inflate conversions. Set 2026-07-27 from Paul's Ads account.
  gtagId: 'AW-16956033989',
  gtagConversion: 'AW-16956033989/cwbHCNCflbAaEMWXopU_',   // "Submit lead form"

  // Loan officer / specialist shown on thank-you page
  specialist: {
    name: 'Paul Howarth',
    title: 'DSCR Loan Specialist',
    nmls: '',                               // open item for Paul
  },

  // Social-proof counter under the form (PMF-model rebuild 2026-08-24).
  // PMF shows "3,189 Investors Checked Their Eligibility!". Renders ONLY when
  // set, and ONLY with a REAL number from Paul (all-time inquiry count).
  // NEVER fabricate this. '' hides the line entirely.
  eligibilityCount: '',
};

// Texas-only funnel: the form skips the state step and stamps every
// lead with this state. Set to '' to restore the 50-state type-ahead.
export const fixedState = 'Texas';

// ---------- form option sets ----------

// PMF-model rebuild 2026-08-24: labels and order match the proven
// dscr.promortgagefunding.com survey verbatim (Purchase / Fix and Hold/Flip /
// Cash Out Refinance). VALUES unchanged so the Zap -> GHL field map and the
// downstream slider branches never break.
export const goals = [
  {
    value: 'purchase',
    label: 'Purchase',
    icon: ['M3 10.5 12 3l9 7.5', 'M5 9.5V21h14V9.5', 'M9.5 21v-6h5v6'],
  },
  {
    value: 'bridge',
    label: 'Fix and Hold/Flip',
    icon: ['m14 6 8 8-2.5 2.5-8-8z', 'M12.5 7.5 10 5C8 3 5 3 3 5l4.5 4.5', 'm2 22 7.5-7.5'],
  },
  {
    value: 'refinance',
    label: 'Cash Out Refinance',
    icon: ['M21 2v6h-6', 'M3 12a9 9 0 0 1 15-6.7L21 8', 'M3 22v-6h6', 'M21 12a9 9 0 0 1-15 6.7L3 16'],
  },
] as const;

// Deal-stage question (overhaul 2026-08-19): the opener for Paul's first text.
// "Under contract" texts different than "still running numbers".
export const dealStages = [
  { value: 'contract', label: 'Under contract' },
  { value: 'offers', label: 'Making offers now' },
  { value: 'research', label: 'Still running the numbers' },
] as const;

export const refiStages = [
  { value: 'ready', label: 'Ready to move forward' },
  { value: 'exploring', label: 'Comparing my options' },
] as const;

// Labels match the PMF survey; values unchanged for the Zap field map.
// Icons added 2026-08-24 (design pass): the form's icon grammar continues
// through steps 2-3 instead of downgrading to bare text rows.
export const propertyTypes = [
  { value: 'sfr', label: 'Single Family', icon: ['M3 11 12 4l9 7', 'M5 10v10h14V10', 'M9.5 20v-5h5v5'] },
  { value: '2-4', label: '2-4 Units', icon: ['M2 10.5 7 6.5l5 4', 'M12 10.5l5-4 5 4', 'M4 10v10h16V10', 'M12 11v9', 'M7 14h.01', 'M17 14h.01'] },
  { value: '5-9', label: '5-9 Units', icon: ['M4 21V8h10v13', 'M14 21v-9h6v9', 'M4 21h16', 'M7.5 11h.01', 'M10.5 11h.01', 'M7.5 14h.01', 'M10.5 14h.01', 'M17 15h.01'] },
  { value: '10+', label: '10-15 Units', icon: ['M3 21h18', 'M5 21V4h9v17', 'M14 21V9h5v12', 'M8 8h.01', 'M11 8h.01', 'M8 12h.01', 'M11 12h.01', 'M8 16h.01', 'M11 16h.01', 'M16.5 13h.01', 'M16.5 17h.01'] },
  { value: 'commercial', label: 'Commercial', icon: ['M4 5h16l1.5 4h-19z', 'M5 9v11h14V9', 'M9.5 20v-5.5h5V20', 'M4 20h16'] },
  { value: 'other', label: 'Other', icon: ['M5 12h.01', 'M12 12h.01', 'M19 12h.01'] },
] as const;

// Credit bands carry a gauge glyph whose needle steps down with the band:
// data styling on real answers, not a rating claim.
export const creditBands = [
  { value: '740+', label: '740+', icon: ['M4 16a8 8 0 0 1 16 0', 'M12 16l5.2-4.2', 'M12 16h.01'] },
  { value: '700-739', label: '700-739', icon: ['M4 16a8 8 0 0 1 16 0', 'M12 16l2.8-6', 'M12 16h.01'] },
  { value: '660-699', label: '660-699', icon: ['M4 16a8 8 0 0 1 16 0', 'M12 16v-7', 'M12 16h.01'] },
  { value: '620-659', label: '620-659', icon: ['M4 16a8 8 0 0 1 16 0', 'M12 16l-2.8-6', 'M12 16h.01'] },
  { value: '<620', label: '619 or less', icon: ['M4 16a8 8 0 0 1 16 0', 'M12 16l-5.2-4.2', 'M12 16h.01'] },
] as const;

// Minimum credit gate. Selecting below this shows the soft-stop screen.
export const MIN_CREDIT = 620;

export const usStates = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
  'Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky',
  'Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi',
  'Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico',
  'New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania',
  'Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
];

// TCPA consent copy (shown at the phone step; keep legal team happy).
// The "automated technology / prerecorded" clause is load-bearing: it is what
// qualifies this as prior express written consent for automated marketing SMS.
export const tcpaCopy =
  `By continuing you expressly consent to having ${brand.name} contact you about your inquiry by email, text message, or phone call at the number you provided, including via automated technology, autodialer, or prerecorded or artificial voice messages, even if your number is on a Do Not Call registry. Message and data rates may apply; message frequency varies; reply STOP to opt out. Consent is not a condition of purchase or of receiving services and can be revoked at any time.`;

// Capability ticker. Every line is a claim the client already publishes on
// lenderdscr.com. No invented funded-deal amounts, no fabricated stats.
export const tickerItems = [
  'DSCR purchase & cash-out',
  'Long term rentals',
  'Short term rentals · Airbnb & VRBO',
  'Fix & flip programs',
  'Rates from 100+ lenders',
  'No tax returns required',
  'Same-day income & credit approval',
  'LLC closings welcome',
];

// Reviews: the client has no published testimonials. The reviews section is
// removed from index.astro until Paul supplies real ones. NEVER fabricate.

// PMF-model rebuild 2026-08-24: the five questions from the proven PMF page,
// answers adapted to Paul's PUBLISHED claims only (620 floor, 20-25% down,
// same-day income & credit approval, 15-25 day closings, 100+ lenders).
// NO interest rates anywhere, ever (standing rule, Tanner 2026-08-19).
export const faqs = [
  {
    q: 'Is it harder to get approved for a DSCR loan as a real estate investor?',
    a: 'Not with a DSCR program. While traditional lenders focus heavily on personal income verification, DSCR (Debt Service Coverage Ratio) loans are designed specifically for real estate investors. You qualify based on the rental income potential of the investment property, not your personal W-2s or tax returns. That makes the process much simpler for investors who want to grow a portfolio without the income-documentation circus. Programs start at a 620 credit score with 20 to 25 percent down, and your scenario gets priced across 100+ lenders.',
  },
  {
    q: 'What credit score do I need for a DSCR loan?',
    a: "Programs are available down to a 620 credit score. Pricing improves meaningfully at 680 and again above 720, so a 680+ score with 20 to 25 percent down puts you in the most competitive tier for investment property financing. The property's rental income carries more of the weight than your personal credit history.",
  },
  {
    q: 'What down payment is required for DSCR loans?',
    a: 'Plan on a minimum of 20 percent down for purchases, with 20 to 25 percent being the standard range for investment property financing. For cash-out refinances, roughly 25 percent equity left in the property is the typical requirement. A larger down payment usually means stronger cash flow and sharper pricing, and many investors later use a cash-out refinance to recover the down payment for the next deal.',
  },
  {
    q: 'How long does the DSCR loan approval process take?',
    a: "Faster than a traditional investment property loan, because there is no income documentation to verify. Income and credit approval typically happens the same day, and most files close in 15 to 25 days from application to funding. Since qualification is based on the property's rental income rather than your personal financials, the appraisal with a rent schedule is usually the longest step. That speed matters when you are making offers: sellers take a fast, reliable close seriously.",
  },
  {
    q: 'Can I qualify for a DSCR loan without showing personal income?',
    a: "Absolutely. That is the whole point of a DSCR loan. Qualification is based on the debt service coverage ratio: whether the property's rental income covers the mortgage payment plus taxes and insurance. No tax returns, no pay stubs, no employment verification. That is perfect for investors with complex income situations, multiple LLCs, or those who simply want privacy in their financing. An appraisal or rent roll establishes the property's income potential, with most programs looking for a DSCR around 1.0 to 1.25 depending on the loan.",
  },
];

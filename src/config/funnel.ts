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
};

// Texas-only funnel: the form skips the state step and stamps every
// lead with this state. Set to '' to restore the 50-state type-ahead.
export const fixedState = 'Texas';

// ---------- form option sets ----------

export const goals = [
  {
    value: 'purchase',
    label: 'Buy a rental',
    sub: 'Purchase an investment property',
    icon: ['M3 10.5 12 3l9 7.5', 'M5 9.5V21h14V9.5', 'M9.5 21v-6h5v6'],
  },
  {
    value: 'refinance',
    label: 'Refinance',
    sub: 'Improve my rate or terms',
    icon: ['M21 2v6h-6', 'M3 12a9 9 0 0 1 15-6.7L21 8', 'M3 22v-6h6', 'M21 12a9 9 0 0 1-15 6.7L3 16'],
  },
  {
    value: 'cashout',
    label: 'Pull cash out',
    sub: 'Tap equity for the next deal',
    icon: ['M12 2v20', 'M17 6.5H9.5a3.25 3.25 0 0 0 0 6.5h5a3.25 3.25 0 0 1 0 6.5H6'],
  },
  {
    value: 'bridge',
    label: 'Fix & flip / bridge',
    sub: 'Short-term or rehab money',
    icon: ['m14 6 8 8-2.5 2.5-8-8z', 'M12.5 7.5 10 5C8 3 5 3 3 5l4.5 4.5', 'm2 22 7.5-7.5'],
  },
] as const;

export const propertyTypes = [
  { value: 'sfr', label: 'Single family' },
  { value: '2-4', label: '2–4 units' },
  { value: '5-9', label: '5–9 units' },
  { value: '10+', label: '10+ units' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'other', label: 'Other' },
] as const;

export const creditBands = [
  { value: '740+', label: '740+', note: 'Excellent' },
  { value: '700-739', label: '700–739', note: 'Great' },
  { value: '660-699', label: '660–699', note: 'Good' },
  { value: '620-659', label: '620–659', note: 'Fair' },
  { value: '<620', label: 'Below 620', note: '' },
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

export const faqs = [
  {
    q: "Aren't DSCR loan rates higher than conventional loans?",
    a: 'Typically 1 to 2 percent higher, and for investors the trade is usually worth it. A DSCR loan lets you qualify on the property instead of your personal income, close in an LLC, and keep scaling without your debt-to-income ratio getting in the way. Conventional loans simply cannot do that.',
  },
  {
    q: 'What credit score do I need?',
    a: 'Programs start at 620. Pricing improves meaningfully at 680 and again at 740, so a 680+ score with 20 to 25 percent down puts you in the most competitive tier. The property carries more of the weight than your personal credit history.',
  },
  {
    q: 'How much do I need to put down?',
    a: 'Plan on 20 to 25 percent for most purchases. A larger down payment means lower payments and stronger cash flow, and many investors use a cash-out refinance after seasoning to recover the down payment for the next property.',
  },
  {
    q: 'How is the DSCR calculated?',
    a: 'Monthly rent divided by the full monthly payment (principal, interest, taxes, insurance, and any HOA). A ratio of 1.0 means the rent exactly covers the payment; most lenders want 1.0 to 1.25 or better, and stronger ratios earn better pricing.',
  },
  {
    q: 'How fast can I close?',
    a: 'Income and credit approval the same day, and most files close in 15 to 25 days. There are no tax returns or pay stubs to verify, so the appraisal with a rent schedule is usually the longest step.',
  },
  {
    q: "What if the property doesn't have rental income yet?",
    a: "No problem. For purchases without rental history, the appraiser's market rent estimate does the qualifying. That works for vacant properties, renovations, and homes being converted to rentals for the first time.",
  },
  {
    q: 'Do short-term rentals like Airbnb qualify?',
    a: 'Yes. Programs exist specifically for Airbnb and VRBO properties, qualifying on either market rent or documented short-term rental income, including income methods that account for seasonality.',
  },
  {
    q: 'Can I close in an LLC?',
    a: 'Yes, many investors do. DSCR loans are built for LLC vesting, and with most programs closing in an entity does not affect your rate.',
  },
];

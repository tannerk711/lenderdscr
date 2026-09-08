// ============================================================================
// DSCR Funnel Template 4 ("Directory"): THE REBRAND SURFACE.
// Every brandable, legal, or client-specific token lives here. Sections and
// pages import from this file and never hardcode copy that belongs here.
//
// REBRAND CHECKLIST (do these in order, then `npm run build && npm run qa`):
//   1. site.mode: 'network' (independent lender directory) or 'lender' (one brand).
//   2. brand: name, legalName, tagline, domain, phone + phoneHref, privacyEmail,
//      nmls (lender mode), address, logoText / logoSrc, housingMark.
//   3. specialist (lender mode thank-you card) and routing.lender (network mode:
//      set ONLY when every lead is contractually routed to one named lender).
//   4. tracking.gtagId + gtagConversion (Google Ads). Empty strings render nothing.
//   5. booking.embedUrl (lender mode thank-you calendar). Empty hides it.
//   6. legal: read every string; the defaults are network-safe generic language.
//   7. partners / lenders: replace placeholders with REAL entries (placeholder:false,
//      verified:true, nmls set). Production excludes anything not verified.
//   8. stats: flip confirmed:true ONLY for figures the client stands behind.
//   9. Images: public/images/aerial-dusk.webp, duplex-dusk.webp, og.jpg
//      (regenerate via `npm run images` from assets-src/).
//  10. Env: LEAD_WEBHOOK_URL in Vercel (see .env.example for the printf recipe).
//  11. Legal pages: src/pages/privacy.astro + terms.astro placeholder copy.
//  12. astro.config.mjs `site` must equal `https://${brand.domain}`.
//  NOTE: site.year and lenderPicksMonth are evaluated at BUILD time. Redeploy
//  at the turn of the month / year or the page shows a stale month.
//
// LEGAL: PLACEHOLDER DATA
//   Every partners/lenders entry below is a SAMPLE (placeholder:true,
//   verified:false, nmls:''). Production builds (import.meta.env.PROD) EXCLUDE
//   every entry that is placeholder or not verified; a section with zero real
//   entries renders nothing. Dev builds show them with a "SAMPLE" tag. Ribbons,
//   badges and highlights must be factual attributes supplied by the lender
//   (states served, programs offered), never outcomes, superlatives, or speed.
//   No testimonials or reviews exist in this template. Add a reviews section
//   only with real, attributable feedback. NEVER publish interest rates.
// ============================================================================

export type SiteMode = 'network' | 'lender';

export const site = {
  mode: 'network' as SiteMode,
  year: new Date().getFullYear(), // build-time
  showYearInH1: true,
  stateIntroFallback:
    "DSCR lenders in {name} qualify the loan on the property's rent, not your tax returns. If the rent covers the payment, the deal can stand on its own numbers, whether it is a single family rental, a small multifamily, or a short-term rental. Answer a few questions about the {name} property and see which lenders fit.",
};

export const brand = {
  name: 'DSCRlenders.com',
  legalName: 'DSCR Lenders Network LLC',
  tagline: 'An independent DSCR lender network', // lender mode: 'DSCR rental property loans'
  domain: 'dscrlenders.example',
  phone: '(866) 555-0190',
  phoneHref: 'tel:+18665550190',
  privacyEmail: '', // renders in privacy#do-not-sell when set
  nmls: '',
  address: '',
  logoText: 'DSCRlenders',
  logoSrc: '',
  // 'lender' is honored ONLY when site.mode === 'lender' AND nmls is non-empty;
  // otherwise it is coerced to 'opportunity' (see housingPhrase below).
  housingMark: 'opportunity' as 'lender' | 'opportunity',
  licensingUrl: 'https://www.nmlsconsumeraccess.org',
};

export const specialist = { name: 'Alex Morgan', title: 'DSCR Loan Specialist', nmls: '' };

// Network thank-you names a lender ONLY when this is set.
export const routing = { lender: null as null | { name: string; nmls: string } };

export const tracking = { gtagId: '', gtagConversion: '' };

export const booking = { embedUrl: '' }; // honored in lender mode only

// ---------------------------------------------------------------------------
// Icons: hand-drawn 24-viewBox stroke path sets. Rendered by Icon.astro /
// IconSvg.tsx (stroke currentColor, width 1.8, round caps). Legible at 20px
// and 40px. Keys are the contract in BRIEF section 5b (+ equal-housing).
// ---------------------------------------------------------------------------
export const icons = {
  'house-key': ['M3 11 12 4l9 7', 'M5 10v10h5', 'M19 10v2.5', 'M13.5 17.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z', 'm15.3 16.8 4.7 4.7', 'm18 19.5 1.5-1.5'],
  'house-refresh': ['M3 11 12 4l9 7', 'M5 10v10h4', 'M19 10v1', 'M11.5 18a4 4 0 0 1 7.2-2.4', 'M19.5 18a4 4 0 0 1-7.2 2.4', 'M19 13.5v2.3h-2.3', 'M12 22.3V20h2.3'],
  'house-hammer': ['M3 11 12 4l9 7', 'M5 10v10h5', 'M19 10v1', 'M13 21.5 17.5 17', 'm16 14 2.5-2.5 4 4-2.5 2.5z', 'M18.5 11.5 20 10'],
  shield: ['M12 3 4 6v6c0 4.6 3.4 8.1 8 9 4.6-.9 8-4.4 8-9V6z', 'm9 12 2 2 4-4'],
  'doc-x': ['M6 3h8l4 4v14H6z', 'M14 3v4h4', 'm10 12 4 4', 'm14 12-4 4'],
  llc: ['M4 21h16', 'M6 21V8l6-4 6 4v13', 'M10 21v-4h4v4', 'M9 11h.01', 'M15 11h.01', 'M9 14.5h.01', 'M15 14.5h.01'],
  sfr: ['M3 11 12 4l9 7', 'M5 10v10h14V10', 'M9.5 20v-5h5v5'],
  units2: ['M2 10.5 7 6.5l5 4', 'm12 10.5 5-4 5 4', 'M4 10v10h16V10', 'M12 11v9', 'M7 15h.01', 'M17 15h.01'],
  units5: ['M4 21V8h10v13', 'M14 21v-9h6v9', 'M4 21h16', 'M7.5 11h.01', 'M10.5 11h.01', 'M7.5 14h.01', 'M10.5 14h.01', 'M7.5 17h.01', 'M10.5 17h.01', 'M17 15h.01', 'M17 18h.01'],
  condo: ['M5 21V5h9v16', 'M14 21V10h5v11', 'M4 21h16', 'M8 8h.01', 'M11 8h.01', 'M8 12h.01', 'M11 12h.01', 'M8 16h.01', 'M11 16h.01', 'M16.5 14h.01', 'M16.5 18h.01'],
  str: ['M3 11 12 4l9 7', 'M5 10v10h14V10', 'M9 19v-5h6v5', 'M11 14v-1.5h2V14', 'M9 16.5h6'],
  other: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M8 12h.01', 'M12 12h.01', 'M16 12h.01'],
  gauge5: ['M4 16a8 8 0 0 1 16 0', 'M12 16l5.2-4.2', 'M12 16h.01'],
  gauge4: ['M4 16a8 8 0 0 1 16 0', 'M12 16l2.8-6', 'M12 16h.01'],
  gauge3: ['M4 16a8 8 0 0 1 16 0', 'M12 16v-7', 'M12 16h.01'],
  gauge2: ['M4 16a8 8 0 0 1 16 0', 'M12 16l-2.8-6', 'M12 16h.01'],
  gauge1: ['M4 16a8 8 0 0 1 16 0', 'M12 16l-5.2-4.2', 'M12 16h.01'],
  check: ['m5 12.5 4.5 4.5L19 7.5'],
  arrow: ['M5 12h14', 'm13 6 6 6-6 6'],
  phone: ['M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z'],
  calendar: ['M4 6h16v15H4z', 'M4 10h16', 'M8 3v5', 'M16 3v5', 'M8 14h.01', 'M12 14h.01', 'M16 14h.01'],
  chat: ['M4 5h16v11H9l-5 4z', 'M8 9h8', 'M8 12h5'],
  ledger: ['M6 3h12v18H6z', 'M9 8h6', 'M9 12h6', 'M9 16h4', 'M3.5 7H6', 'M3.5 12H6', 'M3.5 17H6'],
  portfolio: ['M3 8h18v12H3z', 'M9 8V5h6v3', 'M3 13h18', 'M12 12v3'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
  'map-pin': ['M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z', 'M12 13.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
  star: ['m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z'],
  home: ['M3 11 12 4l9 7', 'M5 10v10h14V10', 'M10 20v-6h4v6'],
  reply: ['m9 7-5 5 5 5', 'M4 12h10a6 6 0 0 1 6 6v1'],
  handshake: ['M2 8h4l6 6', 'M22 8h-4l-2-2-4 4 1.5 1.5a1.5 1.5 0 0 0 2 0', 'm12 14 2 2a1.5 1.5 0 0 1-2 2', 'm10 16 2 2a1.5 1.5 0 0 1-2 2', 'M6 8v7', 'M18 8v7'],
  'file-text': ['M6 3h8l4 4v14H6z', 'M14 3v4h4', 'M9 12h6', 'M9 16h6'],
  'equal-housing': ['M3 11 12 4l9 7', 'M5 10v10h14V10', 'M9 12.5h6', 'M9 16h6'],
} satisfies Record<string, string[]>;

export type IconName = keyof typeof icons;

// ---------------------------------------------------------------------------
// Shared shapes
// ---------------------------------------------------------------------------
export type Spec = { icon: IconName; label: string };
export type Partner = { name: string; logoSrc?: string; href?: string; placeholder: boolean; verified: boolean };
export type Lender = {
  name: string;
  nmls: string;
  ribbon: string;
  badge: string;
  highlights: string[];
  href: string;
  logoSrc?: string;
  placeholder: boolean;
  verified: boolean;
};
export type Stat = { value: number; from?: number; suffix: string; decimals: number; label: string; confirmed: boolean };
export type Advantage = { icon: IconName; title: string; body: string };
export type Step = { title: string; body: string };
export type Faq = { q: string; a: string };
export type Option = { value: string; label: string; icon: IconName; sub?: string };
export type DirectoryLink = { label: string; href: string };
export type DirectoryColumn = { title: string; links: DirectoryLink[] };

// ---------------------------------------------------------------------------
// SEO + hero
// ---------------------------------------------------------------------------
export const seo = {
  title: `Check Your ${site.year} DSCR Loan Eligibility | ${brand.name}`,
  description: `DSCR rental property loans. Qualify on the rent, not your tax returns. 620 minimum credit. Check your ${site.year} eligibility in about a minute.`,
};

export const hero = {
  h1: site.showYearInH1 ? `Check Your ${site.year} DSCR Loan Eligibility` : 'Check Your DSCR Loan Eligibility',
  subNetwork: 'Rent qualifies the loan, not your tax returns. See which lenders fit your deal.',
  subLender: 'Rent qualifies the loan, not your tax returns. See if your deal fits.',
};

/** Copy tokens for /dscr-loans/[state]. `intro` falls back to site.stateIntroFallback. */
export function stateCopy(name: string, blurb?: string) {
  return {
    title: `${name} DSCR Loans: Check Your ${site.year} Eligibility | ${brand.name}`,
    h1: `Check Your ${site.year} ${name} DSCR Loan Eligibility`,
    sub: `Rent qualifies the loan, not your tax returns. See which lenders fit your ${name} deal.`,
    description: `DSCR rental property loans in ${name}. Qualify on the rent, not your tax returns. 620 minimum credit. Check your ${site.year} eligibility in about a minute.`,
    intro: blurb ?? site.stateIntroFallback.replaceAll('{name}', name),
  };
}

// Header bullets + trust band: SPEC-SHEET claims only.
export const specs: Spec[] = [
  { icon: 'shield', label: '620 minimum credit score' },
  { icon: 'doc-x', label: 'No tax returns or W-2s' },
  { icon: 'llc', label: 'Close in your LLC' },
];

export const trustStrip = { text: 'Find the DSCR lender that fits your deal.', cta: 'Check My Eligibility' };

// Repeated 4x in markup, aria-hidden on repeats 2-4.
export const marqueeText = 'Qualify on the rent. Not your tax returns.';

// StatsBand renders ONLY confirmed:true. `from` = count-down start (optional).
export const stats: Stat[] = [
  { value: 620, from: 0, suffix: '', decimals: 0, label: 'Minimum credit score', confirmed: true },
  { value: 0, from: 24, suffix: '', decimals: 0, label: 'Tax returns required', confirmed: true }, // counts DOWN 24 -> 0
  { value: 80, from: 0, suffix: '%', decimals: 0, label: 'Max loan-to-value on purchases', confirmed: false }, // CONFIRM PER CLIENT
  { value: 30, from: 0, suffix: 'yr', decimals: 0, label: 'Fixed-payment terms available', confirmed: false }, // CONFIRM PER CLIENT
];

// ---------------------------------------------------------------------------
// Network-mode rows (placeholders; production excludes anything not verified)
// ---------------------------------------------------------------------------
export const partners: Partner[] = [
  { name: 'Sample Lender One', placeholder: true, verified: false },
  { name: 'Sample Lender Two', placeholder: true, verified: false },
  { name: 'Sample Lender Three', placeholder: true, verified: false },
  { name: 'Sample Lender Four', placeholder: true, verified: false },
];

// ribbon / badge / highlights are FACTUAL ATTRIBUTES supplied by the lender,
// never outcomes, superlatives, or speed.
export const lenders: Lender[] = [
  {
    name: 'Sample Lender One',
    nmls: '',
    ribbon: 'Rental loans in 40+ states',
    badge: 'Network member',
    highlights: ['No tax returns', 'Closes in LLCs', 'Short-term rental programs'],
    href: '#start',
    placeholder: true,
    verified: false,
  },
  {
    name: 'Sample Lender Two',
    nmls: '',
    ribbon: 'Closes in LLCs',
    badge: 'Network member',
    highlights: ['No tax returns', 'Single family and 2-4 units', 'Cash-out refinance programs'],
    href: '#start',
    placeholder: true,
    verified: false,
  },
  {
    name: 'Sample Lender Three',
    nmls: '',
    ribbon: 'Short-term rental programs',
    badge: 'Network member',
    highlights: ['No tax returns', '5+ unit programs', 'Closes in LLCs'],
    href: '#start',
    placeholder: true,
    verified: false,
  },
];

export const lenderPicksMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }); // build-time

// ---------------------------------------------------------------------------
// Advantages (right-column 2x2 illustrated cards + left prose)
// ---------------------------------------------------------------------------
export const advantages: Advantage[] = [
  {
    icon: 'ledger',
    title: 'The rent does the qualifying',
    body: "A DSCR lender looks at one ratio: does the property's rent cover the mortgage payment, taxes, and insurance. If it does, the deal can stand on its own numbers.",
  },
  {
    icon: 'doc-x',
    title: 'No personal income docs',
    body: 'No tax returns, no W-2s, no pay stubs. Your CPA can keep writing everything off. The appraisal and a rent schedule establish the income instead.',
  },
  {
    icon: 'llc',
    title: 'Close in your LLC',
    body: 'Most DSCR programs let you take title in an LLC, so the loan sits with the entity that owns the property, not on your personal balance sheet.',
  },
  {
    icon: 'portfolio',
    title: 'Each property carries its own weight',
    body: "Because every deal qualifies on its own rent, the next one is not waiting on your personal debt-to-income. That's how investors keep adding doors.",
  },
];

export const advantagesProse: string[] = [
  "If you've ever been told no by a bank because your tax returns don't show enough income, you already understand the problem DSCR loans solve. A conventional lender underwrites you. A DSCR lender underwrites the property. It asks whether the rent covers the payment, and that answer, not your personal debt-to-income ratio, decides the deal.",
  "DSCR stands for debt service coverage ratio: the property's monthly rent divided by its monthly payment, taxes, insurance, and any HOA dues. A ratio of 1.0 means the rent exactly covers the costs. Most programs want to see something at or above that line, and a stronger ratio usually opens up better terms. Because the math is about the property, an investor with heavy write-offs, multiple entities, or a new self-employed business can still get a straight answer.",
  "The trade-off is worth understanding. DSCR loans typically ask for more down than an owner-occupied mortgage, and pricing is set by each lender based on the ratio, your credit score, and the loan-to-value. What you get in return is a loan that closes in your LLC, does not touch your personal income documents, and lets each rental qualify on its own numbers. For a lot of investors, that is the difference between one property and a portfolio.",
];

// ---------------------------------------------------------------------------
// How it works (mode-specific)
// ---------------------------------------------------------------------------
export const howItWorks: { network: Step[]; lender: Step[] } = {
  network: [
    {
      title: 'Answer a few questions',
      body: 'Property type, credit range, price, and where the property is. It takes about a minute and never touches your credit.',
    },
    {
      title: 'Hear from a participating lender',
      body: `A participating DSCR lender whose programs cover your property type and state reaches out by text or call, and mentions ${brand.name} so you know it's real.`,
    },
    {
      title: 'Get terms from the lender',
      body: 'The lender runs the numbers on the rent, walks you through the program, and puts terms in writing if the deal fits. No obligation at any step.',
    },
  ],
  lender: [
    {
      title: 'Answer a few questions',
      body: 'Property type, credit range, price, and where the property is. It takes about a minute and never touches your credit.',
    },
    {
      title: `${specialist.name} reaches out`,
      body: `A text or call from ${brand.phone} to talk through the deal, answer questions, and, if you want, run the numbers on the rent.`,
    },
    {
      title: 'Terms in writing',
      body: 'If the deal fits, you get the program details and terms in writing so you can decide with the numbers in front of you.',
    },
  ],
};

// ---------------------------------------------------------------------------
// FAQ (NO RATES; pricing is quoted by the lender, never published here)
// ---------------------------------------------------------------------------
export const faqs: Faq[] = [
  {
    q: 'What is a DSCR loan?',
    a: "A DSCR loan is a rental property mortgage that qualifies on the property's income instead of yours. DSCR stands for debt service coverage ratio: the monthly rent divided by the monthly payment, taxes, insurance, and HOA dues. If the rent covers the costs, the ratio is 1.0 or better and the property can qualify on its own. Your tax returns and W-2s stay out of it.",
  },
  {
    q: 'What credit score do I need?',
    a: "The DSCR programs in this network start at a 620 credit score. A higher score generally opens up more programs and better terms, and most lenders step up their offerings around 680 and again at 720 and above. Your best guess on the form is fine. Nothing here pulls or touches your credit.",
  },
  {
    q: 'How much do I need to put down?',
    a: 'Plan on a minimum of 20 percent down for a purchase, with 20 to 25 percent being the common range. A larger down payment lowers the monthly payment, which raises the DSCR, which usually improves the terms a lender can offer. On a cash-out refinance, lenders look at the equity you leave in the property the same way.',
  },
  {
    q: 'Do I really not need tax returns?',
    a: "Correct. DSCR lenders verify the property's income, not yours. The appraisal includes a rent schedule (and a lease if the property is already rented), and that establishes the income for the loan. No tax returns, no W-2s, no pay stubs, no employment verification. If your CPA writes everything off, that is no longer a problem.",
  },
  {
    q: 'Can I close in an LLC, and do short-term rentals qualify?',
    a: 'Most DSCR programs allow you to take title in an LLC, and many investors do exactly that so each property sits with its own entity. Short-term rentals are covered by specific programs that use projected or documented nightly income instead of a long-term lease. Tell the form the property is a short-term rental and your inquiry goes to participating lenders whose programs cover it.',
  },
  {
    q: 'What does a DSCR loan cost?',
    a: `Pricing is set by each lender based on the DSCR, your credit score, the loan-to-value, and the property type, and it changes with the market. That is why ${brand.name} does not publish rates or fees. Once a lender has your scenario, they quote it directly and put it in writing, and you compare from there.`,
  },
];

// ---------------------------------------------------------------------------
// Footer directory (state column is generated from states.ts)
// Hrefs here must resolve on THIS build: '/', '/dscr-loans', '/dscr-loans/<slug>',
// '#faq', '#start', '/privacy', '/terms', '/privacy#do-not-sell'.
// The "Advertiser Disclosure" link anchors to id="advertiser-disclosure",
// which the Footer places on its own disclosure block.
// ---------------------------------------------------------------------------
export const directory: { columns: DirectoryColumn[] } = {
  columns: [
    {
      title: 'Company',
      links: [
        { label: 'Check eligibility', href: '#start' },
        { label: 'DSCR loans by state', href: '/dscr-loans' },
        { label: 'Questions', href: '#faq' },
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms', href: '/terms' },
        // Network mode only: lender mode renders no disclosure block anywhere,
        // so the anchor would be a dead link on a single-lender site.
        ...(site.mode === 'network' ? [{ label: 'Advertiser Disclosure', href: '#advertiser-disclosure' }] : []),
        { label: 'Do Not Sell or Share My Personal Information', href: '/privacy#do-not-sell' },
      ],
    },
    // Add these columns when the routes exist (check-links fails on dead hrefs):
    // { title: 'DSCR loan articles', links: [
    //   { label: 'How DSCR is calculated', href: '/learn/how-dscr-is-calculated' },
    //   { label: 'DSCR loan requirements', href: '/learn/dscr-loan-requirements' },
    // ] },
    // { title: 'Tools', links: [
    //   { label: 'DSCR calculator', href: '/tools/dscr-calculator' },
    // ] },
  ],
};

// ---------------------------------------------------------------------------
// Form copy (titles, subs, errors, phases)
// ---------------------------------------------------------------------------
export const form = {
  titles: {
    goal: 'What are you looking to do?',
    propertyType: 'What type of property is it?',
    credit: "What's your credit like?",
    pricePurchase: "What's the estimated purchase price?",
    priceRefi: "What's the property worth?",
    down: 'How much are you putting down?',
    balance: 'Roughly what do you still owe?',
    rehab: "What's the rehab budget?",
    state: 'What state is the property in?',
    contact: "What's your name and email?",
    phone: "What's the best number to reach you?",
    phoneNetwork: "What's the best number for your lender to reach you?",
  },
  subs: {
    credit: 'Your best guess is fine. This never touches your credit.',
    down: '(Minimum 20% for purchases)',
  },
  submit: 'Check My Eligibility',
  submitting: 'Checking your eligibility…',
  reassurance: 'No obligation.',
  phases: [
    { id: 'property', label: 'Property' },
    { id: 'credit', label: 'Credit' },
    { id: 'deal', label: 'Deal' },
    { id: 'contact', label: 'Contact' },
  ],
  errors: {
    name: 'Add your full name so we know who to address.',
    email: "That email doesn't look right. Mind checking it?",
    phone: 'Enter a 10-digit mobile number so we can text you.',
    consent: 'Please check the consent box so we have your permission to contact you.',
  },
  back: 'Back',
  continue: 'Continue',
  statePlaceholder: 'Start typing a state',
  namePlaceholder: 'Full name',
  emailPlaceholder: 'Email',
  phonePlaceholder: '(555) 555-0123',
};

export const cta = {
  primary: 'Check My Eligibility',
  sticky: 'Check Eligibility',
  final: {
    heading: 'Check DSCR loan requirements',
    body: 'Answer a few questions about the property and see which DSCR lenders fit your deal. No tax returns, nothing here touches your credit, and no obligation.',
  },
};

// ---------------------------------------------------------------------------
// Thank-you (CONVERSATION OPENER, never results delivery; never promise an email)
// Tokens: {firstName} {brand} {goalLabel} {propertyTypeLabel} {state} {specialist} {phone}
// ---------------------------------------------------------------------------
export const thankYou = {
  network: {
    heading: "{firstName}, you're in.",
    body: 'A DSCR lender from the {brand} network will text or call you shortly to talk through your {goalLabel} and, if you want, run the numbers.',
    band: {
      heading: "It will come from a number you don't recognize.",
      body: "Lenders call from their own lines. The text or call will mention {brand} and your {propertyTypeLabel} in {state}, so you know it's real.",
    },
    steps: [
      { title: 'Reply to the text', body: 'When the lender reaches out, a quick reply is all it takes to get the conversation going. A call only if you want one.' },
      { title: 'Talk it through', body: 'Tell them about the property and what you are trying to do. Ask anything. They see deals like yours every week.' },
      { title: 'Terms from the lender', body: 'If the deal fits their program, they run the numbers on the rent and put terms in writing so you can decide.' },
    ],
  },
  lender: {
    heading: "{firstName}, you're in.",
    body: '{specialist} will text or call you from {phone} to talk through your deal and, if you want, run the numbers.',
    band: {
      heading: 'Save this number.',
      body: "That's the line {specialist} texts and calls from. Saving it now means the message lands where you'll see it.",
    },
    steps: [
      { title: 'Reply to the text', body: 'A quick reply is all it takes to get the conversation going. A call only if you want one.' },
      { title: 'Talk it through', body: 'Tell {specialist} about the property and what you are trying to do. Ask anything.' },
      { title: 'Terms in writing', body: 'If the deal fits, you get the program details and terms in writing so you can decide with the numbers in front of you.' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Not-yet page (sub-620 hard exit). Five concrete score moves; no hype.
// ---------------------------------------------------------------------------
export const notYet = {
  heading: "Below 620, the lenders in this network can't say yes yet. Here's the fastest way back.",
  body: "We'd rather tell you now than waste your time: the DSCR programs on {brand} start at a 620 credit score. Most investors are closer than they think, and these are the moves that actually move a score.",
  moves: [
    {
      title: 'Pay revolving balances down before the statement date',
      body: 'Utilization is reported on the statement closing date, not the due date. Getting every card under 30 percent of its limit (under 10 percent is better) before that date is the single fastest lift most people have.',
    },
    {
      title: 'Pull all three reports and dispute what is wrong',
      body: 'AnnualCreditReport.com is free. Late payments that were not late, accounts that are not yours, and balances reported twice all come off with a dispute, and each one counts.',
    },
    {
      title: 'Get added as an authorized user on an old, clean card',
      body: "A family member's long-standing card with a low balance and perfect history can add years of age to your file. You never need to touch the card.",
    },
    {
      title: 'Do not close old cards, and do not open new ones',
      body: 'Closing an old account shortens your average age; a new application adds an inquiry and a brand-new account. Leave the file alone until after you have applied.',
    },
    {
      title: 'Resolve collections and ask for the deletion in writing',
      body: 'A paid collection that stays on the report helps less than one that comes off. Negotiate the payment against a written agreement to delete the tradeline, then keep the paperwork.',
    },
  ],
  comeBack: 'When you cross 620, come back and run it again.',
};

// ---------------------------------------------------------------------------
// Option sets. VALUES are the Zap contract; never rename.
// Sophisticated avatar: label + icon only (`sub` optional and unset by default).
// ---------------------------------------------------------------------------
export const goals: Option[] = [
  { value: 'purchase', label: 'Purchase', icon: 'house-key' },
  { value: 'bridge', label: 'Fix and Hold/Flip', icon: 'house-hammer' },
  { value: 'refinance', label: 'Cash Out Refinance', icon: 'house-refresh' },
];

export const propertyTypes: Option[] = [
  { value: 'sfr', label: 'Single family', icon: 'sfr' },
  { value: '2-4', label: '2-4 units', icon: 'units2' },
  { value: '5+', label: '5+ units', icon: 'units5' },
  { value: 'condo', label: 'Condo or townhome', icon: 'condo' },
  { value: 'str', label: 'Short-term rental', icon: 'str' },
  { value: 'other', label: 'Other', icon: 'other' },
];

export const creditBands: Option[] = [
  { value: '740+', label: '740+', icon: 'gauge5' },
  { value: '700-739', label: '700-739', icon: 'gauge4' },
  { value: '660-699', label: '660-699', icon: 'gauge3' },
  { value: '620-659', label: '620-659', icon: 'gauge2' },
  { value: '<620', label: '619 or less', icon: 'gauge1' },
];

export const MIN_CREDIT = 620;

// ---------------------------------------------------------------------------
// TCPA. ONE constant, imported by the island (rendered next to the checkbox)
// AND shipped verbatim as payload.tcpaConsentText, so the record and the legal
// text can never desync. The automated-technology / prerecorded clause is
// load-bearing. The string must never contain the word "mode".
// ---------------------------------------------------------------------------
const consentParties =
  site.mode === 'network'
    ? `${brand.legalName} and one or more participating DSCR lenders in its network`
    : brand.legalName;

export const tcpaCopy = `By checking this box you expressly consent to having ${consentParties} contact you about your inquiry by email, text message, or phone call at the phone number and email address you provided, including via automated technology, autodialer, or prerecorded or artificial voice messages, even if your number is on a Do Not Call registry. Message and data rates may apply; message frequency varies; reply STOP to opt out. Consent is not a condition of purchase or of receiving services and can be revoked at any time.`;

export const tcpaParties: string[] =
  site.mode === 'network'
    ? [brand.legalName, ...lenders.filter((l) => l.verified && !l.placeholder).map((l) => `${l.name} (NMLS ${l.nmls})`)]
    : [brand.legalName];

// ---------------------------------------------------------------------------
// Legal
// ---------------------------------------------------------------------------
// Built from parts so the "Lender" variant never appears as a literal in a
// network build's HTML or island bundle (a network build must contain zero
// occurrences of that phrase).
export const housingPhrase =
  'Equal Housing ' + (site.mode === 'lender' && brand.nmls && brand.housingMark === 'lender' ? 'Lender' : 'Opportunity');

export const legal = {
  networkNotice: `${brand.name} is not a lender, mortgage broker, or loan originator and does not make credit decisions. It is an independent service that connects real estate investors with participating DSCR lenders and may be paid by those lenders.`,
  advertiserDisclosure: `Advertiser Disclosure: Lenders shown on this page are paid advertisers. ${brand.name} does not rank, endorse, or recommend any lender, and compensation may affect which lenders appear and where. Your choice of lender should not be based on this page alone.`,
  notCommitment: `Submitting this form is not a loan application and does not result in a credit decision or a credit inquiry. Nothing on this site is a commitment to lend or an offer of credit. All loans are subject to lender approval, and program terms vary by lender, property, and state.`,
  noticeBar:
    site.mode === 'network'
      ? `Not a lender. ${brand.name} connects investors with independent DSCR lenders.`
      : `${brand.name}${brand.nmls ? ` · NMLS #${brand.nmls}` : ''}`,
  notAffiliated: `${brand.name} is a property of ${brand.legalName} and is not affiliated with or endorsed by any government agency.`,
  deviceLine: 'Information from your device may be used to personalize your ad experience.',
  /** Under-form fine print, built per mode (section 4 legal placement rule b). */
  underForm:
    site.mode === 'network'
      ? `Provided by ${brand.legalName}. Not a lender.`
      : `${brand.legalName}${brand.nmls ? `, NMLS #${brand.nmls}` : ''}.`,
};

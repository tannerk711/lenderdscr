// ============================================================================
// Internet Loans Direct, split-test variant B ("b-t4-v1"): THE REBRAND SURFACE.
// DSCR funnel template 4 ("Civic ledger", claret/amber) rebranded for Paul
// Howarth's Internet Loans Direct (lenderdscr.com). Texas only. Every claim in
// this file is one of ILD's published claims (BRIEF section 2); do not inflate,
// do not add. No NMLS exists: the lead-generator disclaimer stands in for it.
//
// LEAD DELIVERY (BRIEF section 3): `leadDelivery` below is the ONE flag. While it is
// 'test', nothing leaves the browser except the same-origin POST to /api/lead,
// which logs the payload and returns { ok: true, forwarded: false, testMode: true },
// and no gtag renders. 'live' (since 2026-09-09, the split test): /api/lead forwards
// to LEAD_WEBHOOK_URL (the lenderdscr Vercel project's PREVIEW scope, because this
// branch deploys as a branch domain) and Layout renders the deferred gtag.
// Indexing is a SEPARATE switch (`seo.noindexSite` below): this funnel is a paid
// traffic challenger on a subdomain and stays noindex even while live.
// ============================================================================

export type SiteMode = 'network' | 'lender';
export type LeadDelivery = 'test' | 'live';

/** ONE flag. 'test' = no webhook, no gtag. 'live' = webhook + gtag. Flipped 2026-09-09. */
export const leadDelivery: LeadDelivery = 'live';

/** Ships on every payload as `variant` so the split test can be read in the CRM. */
export const variant = 'b-t4-v1';

/** Texas-only client: the form never asks for a state; every payload ships this. */
export const fixedState = 'Texas';

export const site = {
  mode: 'lender' as SiteMode,
  year: new Date().getFullYear(), // build-time
  showYearInH1: true,
};

export const brand = {
  name: 'Internet Loans Direct',
  legalName: 'Internet Loans Direct',
  tagline: 'DSCR rental property loans for Texas investors',
  domain: 'lenderdscr.com',
  phone: '(855) 545-2022',
  phoneHref: 'tel:+18555452022',
  privacyEmail: '', // none published; privacy page routes requests to the phone
  nmls: '', // none published (open item for Paul); never invent one
  address: '',
  logoText: 'Internet Loans Direct',
  logoSrc: '/images/ild-logo.png', // transparent PNG, 220x161: sky #22a0dd + deep #1f78b4 + charcoal roof
  // 'lender' is honored ONLY when site.mode === 'lender' AND nmls is non-empty;
  // otherwise it is coerced to 'opportunity' (see housingPhrase below).
  housingMark: 'opportunity' as 'lender' | 'opportunity',
  licensingUrl: 'https://www.nmlsconsumeraccess.org',
};

// Thank-you page ONLY. The LP and the form say "a DSCR specialist" / "our team".
export const specialist = { name: 'Paul Howarth', title: 'DSCR Loan Specialist', nmls: '' };

// Network mode only; unused in lender mode.
export const routing = { lender: null as null | { name: string; nmls: string } };

// Google Ads (acct 340-440-3562). Rendered in LIVE mode only (Layout + thank-you).
export const tracking = { gtagId: 'AW-16956033989', gtagConversion: 'AW-16956033989/cwbHCNCflbAaEMWXopU_' };

export const booking = { embedUrl: '' }; // Paul declined the calendar; phone CTA branch renders

// ---------------------------------------------------------------------------
// Icons: hand-drawn 24-viewBox stroke path sets. Rendered by Icon.astro /
// IconSvg.tsx (stroke currentColor, width 1.8, round caps). Legible at 20px
// and 40px.
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
export type Advantage = { icon: IconName; title: string; body: string };
export type Faq = { q: string; a: string };
export type Option = { value: string; label: string; icon: IconName; sub?: string };
export type DirectoryLink = { label: string; href: string };
export type DirectoryColumn = { title: string; links: DirectoryLink[] };

// ---------------------------------------------------------------------------
// SEO + hero
// ---------------------------------------------------------------------------
export const seo = {
  title: `Check Your ${site.year} Texas DSCR Loan Eligibility | ${brand.name}`,
  description: `DSCR rental property loans for Texas real estate investors. Qualify on the rent, not your tax returns. Check your ${site.year} eligibility in about a minute.`,
  /**
   * Every page carries noindex,nofollow while true, independent of leadDelivery.
   * The split-test challenger lives on a subdomain of the live site; a second
   * indexable copy of the funnel helps nobody and splits organic signals. Test
   * mode forces noindex regardless (Layout.astro).
   */
  noindexSite: true,
};

export const hero = {
  h1: site.showYearInH1 ? `Check Your ${site.year} Texas DSCR Loan Eligibility` : 'Check Your Texas DSCR Loan Eligibility',
  subNetwork: 'Rent qualifies the loan, not your tax returns. See which lenders fit your Texas deal.',
  subLender: 'Check Updated Requirements. See What You Qualify For.', // Tanner, 2026-09-09
};

// Topbar (desktop only): the three program words. Says WHAT once, in the header.
export const programs: string[] = ['Long-term rentals', 'Short-term rentals', 'Fix and flip'];

// CityMarquee: the Texas geo strip that slides under the hero form (Tanner,
// 2026-09-08 video: "get the exact same thing as LeaderOne's, right underneath
// the form"). Cities only, never claims (marquees carry names, not copy).
export const texasCities: string[] = [
  'Dallas', 'Fort Worth', 'Houston', 'San Antonio', 'Austin', 'El Paso',
  'Arlington', 'Corpus Christi', 'Plano', 'Lubbock', 'Laredo', 'Irving',
  'Garland', 'Frisco', 'McKinney', 'Amarillo', 'Waco', 'Killeen',
  'Tyler', 'Round Rock', 'Denton', 'Midland', 'Abilene', 'College Station',
];
export const marqueeLabel = 'Serving investors across Texas';

// TrustBand: ILD's speed and structure specs. (StatsBand + HowItWorks were CUT
// 2026-09-08, Tanner: the numbers content made no sense; 620 now lives only in the FAQ.)
export const specs: Spec[] = [
  { icon: 'clock', label: 'Same-day income and credit approval' },
  { icon: 'calendar', label: 'Close in 15 to 25 days' },
  { icon: 'llc', label: 'LLC closings welcome' },
];

export const trustStrip = {
  text: 'Under contract or still running the numbers? Check it before you need it.',
  cta: 'Check My Eligibility',
};

// ---------------------------------------------------------------------------
// Network-mode rows: EMPTY for ILD (lender mode). Partners + LenderPicks render nothing.
// ---------------------------------------------------------------------------
export const partners: Partner[] = [];
export const lenders: Lender[] = [];
export const lenderPicksMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }); // build-time

// ---------------------------------------------------------------------------
// Advantages: left prose teaches the mechanism (the one place on the page that
// explains DSCR); right cards carry four investor outcomes that no other
// section states. Page-level say-it-once: no 620, no tax-return count, no
// closing days, no LLC line here (TrustBand owns those).
// ---------------------------------------------------------------------------
export const advantages: Advantage[] = [
  {
    icon: 'portfolio',
    title: 'Each property carries its own weight',
    body: 'Every deal qualifies on its own rent, so the next one is not waiting on your personal debt-to-income. That is how investors keep adding doors.',
  },
  {
    icon: 'house-refresh',
    title: 'Cash out and roll it forward',
    body: 'Refinance a rental you already own, leave roughly 25 percent of the value in it, and put the rest toward the next deal.',
  },
  {
    icon: 'str',
    title: 'Short-term rentals count',
    body: 'Airbnb and VRBO properties run on their own programs, using projected or documented nightly income instead of a long-term lease.',
  },
  {
    icon: 'house-hammer',
    title: 'Fix and flip, or fix and hold',
    body: 'Buy it, rehab it, then sell it or keep it as a rental. The financing is built around the project and its exit, not a bank\'s checklist.',
  },
];

export const advantagesProse: string[] = [
  "If you've ever been told no by a bank because your tax returns don't show enough income, you already understand the problem a DSCR loan solves. A conventional lender underwrites you. A DSCR lender underwrites the property. It asks whether the rent covers the payment, and that answer, not your personal debt-to-income ratio, decides the deal.",
  "DSCR stands for debt service coverage ratio: the property's monthly rent divided by its monthly payment, taxes, insurance, and any HOA dues. A ratio of 1.0 means the rent exactly covers the costs. Most programs want to see something at or above that line, and a stronger ratio usually opens up better terms. Because the math is about the property, an investor with heavy write-offs, multiple entities, or a new self-employed business can still get a straight answer.",
  'The trade-off is worth understanding. A DSCR loan asks for more down than an owner-occupied mortgage, and the pricing follows the ratio, your credit score, and the loan-to-value. In return, the deal gets judged on what it earns, which is the only thing that matters when you are buying Texas rentals on purpose.',
];

// ---------------------------------------------------------------------------
// FAQ: ILD's five (Paul's published claims only, NO RATES) plus the two BRIEF
// section 2 allows. FAQ 1's closing stat line was trimmed.
// ---------------------------------------------------------------------------
export const faqs: Faq[] = [
  {
    q: 'Is it harder to get approved for a DSCR loan as a real estate investor?',
    a: 'Not with a DSCR program. While traditional lenders focus heavily on personal income verification, DSCR (Debt Service Coverage Ratio) loans are designed specifically for real estate investors. You qualify based on the rental income potential of the investment property, not your personal W-2s or tax returns. That makes the process much simpler for investors who want to grow a portfolio without the income-documentation circus.',
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
  {
    q: 'Does checking my eligibility pull my credit?',
    a: 'No. The credit range you pick on the form is your own estimate, and nothing on this site pulls, checks, or touches your credit. A credit report only comes into play later, if you decide to move forward with an application.',
  },
  {
    q: 'What does a DSCR loan cost?',
    a: `Pricing follows the DSCR, your credit score, the loan-to-value, and the property type, and it moves with the market. That is why ${brand.name} does not publish rates or fees here. Once a specialist has your scenario, it gets priced across the lender network and put in writing, and you decide from there.`,
  },
];

// ---------------------------------------------------------------------------
// Footer Company column. Every href must resolve on THIS build:
// '/', '/start', '/privacy', '/legal', '/privacy#do-not-sell', '#faq', '#start'.
// (Footer.astro throws at build time on anything else.)
// ---------------------------------------------------------------------------
export const directory: { columns: DirectoryColumn[] } = {
  columns: [
    {
      title: 'Company',
      links: [
        { label: 'Check eligibility', href: '#start' },
        { label: 'Questions', href: '#faq' },
        { label: 'Privacy', href: '/privacy' },
        { label: 'Legal', href: '/legal' },
        { label: 'Do Not Sell or Share My Personal Information', href: '/privacy#do-not-sell' },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Form copy (BRIEF section 4; the wording source of truth is
// _ref/form-templates/flow.ts as Tanner edited it). The /start V1 form reads
// these through src/lib/flow.ts (question wording, submit label, errors); the
// LP's static step-1 tiles read `titles.goal` + `phases`.
// ---------------------------------------------------------------------------
export const form = {
  titles: {
    goal: 'What are you looking to do?',
    stage: 'Where are you in the process?',
    propertyType: 'Tell us about the property.',
    credit: "How's your credit right now?",
    priceBuy: 'About what price range?',
    priceRefi: "About what's the property worth?",
    priceFlip: "About what's the purchase price?",
    down: 'Please estimate your down payment.',
    balance: 'About how much do you still owe?',
    rehab: "What's your rehab budget?",
    // Step 7 (Tanner, 2026-09-08 video): the LeaderOne city question, after the
    // down payment / balance / rehab fork on every path. Free-typed city.
    cityBuy: 'Where in Texas are you buying?',
    cityRefi: 'Where in Texas is the property?',
    cityFlip: 'Where in Texas are you flipping?',
    contact: 'Almost done. Who are we talking to?',
    phone: 'Last step: best mobile number?',
  },
  subs: {
    price: 'An estimate is fine.',
    balance: "Of the property's value, roughly.",
    city: 'City is perfect.',
    // Phone-step sub headline (Tanner, 2026-09-08 video; mirrors LeaderOne's line).
    phone: `An ${brand.name} loan officer will personally text and call you about your eligibility.`,
  },
  submit: 'Check My DSCR Eligibility', // V1's own Tanner-edited submit label (BRIEF section 4)
  submitting: 'Checking your eligibility…',
  reassurance: 'No obligation.',
  totalSteps: 9,
  // Goal · Details · Contact: matches the /start V1 form's milestone frame.
  phases: [
    { id: 'goal', label: 'Goal' },
    { id: 'details', label: 'Details' },
    { id: 'contact', label: 'Contact' },
  ],
  errors: {
    name: 'Add your first and last name so we know who to address.',
    email: "That email doesn't look right. Mind checking it?",
    city: 'Add the city so your options get priced to the right market.',
    phone: 'Enter a 10-digit mobile number so we can text you.',
    consent: 'Please check the consent box so we have your permission to contact you.',
    submit: "That didn't go through. Give it one more try. Your answers are saved.",
  },
  back: 'Back',
  continue: 'Continue',
  firstNamePlaceholder: 'First name',
  lastNamePlaceholder: 'Last name',
  emailPlaceholder: 'Email',
  cityPlaceholder: 'City',
  phonePlaceholder: '(555) 555-0123',
};

export const cta = {
  primary: 'Check My Eligibility',
  sticky: 'Check Eligibility',
  final: {
    heading: 'Ready when you are.',
    body: 'Nine quick questions, about a minute, no obligation.',
  },
};

// ---------------------------------------------------------------------------
// Thank-you (stage 3 rebuilds the page as the LeaderOne clone; these tokens
// keep the interim page honest). CONVERSATION OPENER, never results delivery;
// the promise sentence is Tanner's verbatim; never promise an email.
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
    body: "Now keep your phone close. Paul or Mike will text you from {phone} to answer any questions you have and, if you're interested, run some numbers for you. Save the number so you know it's them.",
    band: {
      heading: 'Save this number.',
      body: "That's the line Paul or Mike texts and calls from. Saving it now means the message lands where you'll see it.",
    },
    steps: [
      { title: 'Watch for the text', body: "It comes from {phone}. If you see a Texas rental inquiry from Paul or Mike, that's it. Reply and the conversation starts." },
      { title: 'Have your numbers handy', body: 'Nothing is required yet. The rent, the price, and what you are putting down are what turn a quick text into same-day income and credit approval.' },
      { title: 'Keep shopping deals', body: 'Once terms are in writing you can write offers sellers take seriously, with closings in 15 to 25 days.' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Not-yet page (sub-620 hard exit). Five concrete score moves; no hype.
// ---------------------------------------------------------------------------
export const notYet = {
  heading: "Below 620, a DSCR loan can't say yes yet. Here's the fastest way back.",
  body: "We'd rather tell you now than waste your time: the DSCR programs at {brand} start at a 620 credit score. Most investors are closer than they think, and these are the moves that actually move a score.",
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
// Option sets (BRIEF section 4). VALUES are the Zap contract; never rename.
// Sophisticated avatar: label + icon only.
// ---------------------------------------------------------------------------
export const goals: Option[] = [
  { value: 'purchase', label: 'Buy a rental', icon: 'house-key' },
  { value: 'refinance', label: 'Refinance', icon: 'house-refresh' },
  { value: 'bridge', label: 'Fix & Flip/Hold', icon: 'house-hammer' },
];

export const propertyTypes: Option[] = [
  { value: 'sfr', label: 'Single-family', icon: 'sfr' },
  { value: 'condo', label: 'Townhome or condo', icon: 'condo' },
  { value: '2-4', label: '2 to 4 units', icon: 'units2' },
  { value: '5-9', label: '5 to 9 units', icon: 'units5' },
  { value: '10+', label: '10 to 15 units', icon: 'units5' },
  { value: 'commercial', label: 'Commercial', icon: 'ledger' },
  { value: 'other', label: 'Other', icon: 'other' },
];

export const creditBands: Option[] = [
  { value: '740+', label: '740 or above', icon: 'gauge5' },
  { value: '680-739', label: '680 to 739', icon: 'gauge4' },
  { value: '620-679', label: '620 to 679', icon: 'gauge3' },
  { value: '<620', label: 'Below 620', icon: 'gauge1' },
];

export const MIN_CREDIT = 620;

// ---------------------------------------------------------------------------
// TCPA. ILD's `tcpaCopy` VERBATIM (it is the legal record already mapped in
// Paul's Zap). ONE constant: rendered next to the checkbox AND shipped as
// payload.tcpaConsentText, so the record and the legal text can never desync.
// ---------------------------------------------------------------------------
export const tcpaCopy = `By continuing you expressly consent to having ${brand.name} contact you about your inquiry by email, text message, or phone call at the number you provided, including via automated technology, autodialer, or prerecorded or artificial voice messages, even if your number is on a Do Not Call registry. Message and data rates may apply; message frequency varies; reply STOP to opt out. Consent is not a condition of purchase or of receiving services and can be revoked at any time.`;

export const tcpaParties: string[] = [brand.legalName];

// ---------------------------------------------------------------------------
// Legal. No NMLS exists, so Paul's lead-generator disclaimer (verbatim from the
// live lenderdscr.com footer) carries the footer and the /legal page.
// ---------------------------------------------------------------------------
export const housingPhrase =
  'Equal Housing ' + (site.mode === 'lender' && brand.nmls && brand.housingMark === 'lender' ? 'Lender' : 'Opportunity');

export const legal = {
  /** Footer + /legal, rendered as before + link + after (the link sits mid-sentence). */
  disclaimer: {
    before: `${brand.name}. No advertisement or solicitation from ${brand.name} is meant to be a mortgage brokering activity or mortgage lending activity. All brokering or lending activities can only be completed by a licensed loan originator. To see if your loan officer is licensed in your state, visit `,
    linkText: 'www.nmlsconsumeraccess.org',
    after: '. This is not a commitment to lend. All loans subject to credit approval, underwriting, and property review. Rates, terms, and programs subject to change without notice. This company is not endorsed by, or acting on behalf of, any government agency. For informational purposes only.',
  },
  networkNotice: '',
  advertiserDisclosure: '',
  notCommitment: 'This is not a commitment to lend. All loans subject to credit approval, underwriting, and property review. Rates, terms, and programs subject to change without notice.',
  notAffiliated: `${brand.name} is not endorsed by, or acting on behalf of, any government agency.`,
  deviceLine: 'Information from your device may be used to personalize your ad experience.',
  /** Under-form fine print (one line; the Equal Housing mark renders next to it). */
  underForm: `Provided by ${brand.name}.`,
};

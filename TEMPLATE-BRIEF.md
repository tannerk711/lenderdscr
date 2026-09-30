# DSCR Funnel Template 4 ("Directory"): BUILD CONTRACT (v2, post spec-review)

Every agent building any part of this project reads this file FIRST, then the files it
names. This is the single source of truth for names, tokens, selectors, config shape,
payload, and rules. If you need something that is not defined here, define it in the
most obvious place and note it in your return summary so the integrator can reconcile.
v2 folds in a three-lens adversarial spec review (compliance, architecture, design).

## 0. What this is

A brand-new DSCR (rental-property investor loan) funnel template modeled on the
STRUCTURE of https://www.fhaloans.com/start/ (Mortgage Research Center's directory-style
lead-gen page), rebuilt for DSCR, and layered with the "premium scroll-driven"
techniques from the `video-to-website` skill (Lenis smooth scroll, 4+ distinct entrance
animations, staggered reveals, oversized horizontal marquee text, dark stats band with
count-up counters, persistent final CTA, direction variety, massive-but-readable type).
There is NO video, so there is no canvas frame sequence: the scroll techniques are
applied to real page sections below a form-as-hero.

It must work two ways from one config switch (`site.mode`):
- `'network'` (DEFAULT, the modeled site): an independent DSCR lender directory that
  connects investors with lenders. Lender-picks section, partner wordmarks, advertiser
  disclosure, "not a lender" notices, Equal Housing Opportunity (never "Lender").
- `'lender'`: a single lender/broker brand. NMLS + Equal Housing mark, specialist card on
  thank-you, lender-picks and partner rows hidden.

It ships directory-ready: `/dscr-loans/[state]` generates a page per US state (+DC) from
`src/data/states.ts` with the state pre-selected in the form, a `/dscr-loans` hub, a
sitemap, robots.txt, canonicals, and a footer whose links are verified against built
routes. Adding directory content later (articles, tools, city pages) is a data-file +
route job, not a redesign.

Reference screenshots of the modeled page: `reference/fhaloans-start.png` (the /start
page) and `reference/fhaloans-home.png` (homepage). The modeled page's section order:
1. thin notice bar ("Not affiliated or endorsed by...")
2. header: logo + "An Independent Lender Network" tagline; right side: audience line +
   three spec bullets
3. H1 "Check Your 2026 FHA Home Loan Eligibility" + sub + TWO big illustrated option
   cards (buy / refinance) = step 1 of the form, inline; later steps replace the cards
4. "Provided by MRC. NMLS ID 1907. Equal Housing Lender..." fine print under the form
5. blue trust band: three icon stats + amber strip "Find Your ... Lender! [Get Started]"
6. "Connect with FHA home loan experts." + lender logo row
7. "FHA lender picks for September 2026" + disclosure + lender cards (ribbon label, logo,
   NMLS, [Check Eligibility] button)
8. "Advantages of an FHA Home Loan": left prose, right 2x2 illustrated cards
9. dark footer: 4 directory nav columns + legal/disclosure paragraphs

Sister templates (read for proven MECHANICS, never copy their look): v1
`templates/funnels/dscr-1-private-credit` (ink green + brass, Fraunces), v2
`templates/funnels/dscr-2-blueprint` (blueprint cobalt/orange, Big Shoulders), v3
`templates/funnels/dscr-3-light-directory` (IMPORTANT: also an fhaloans-style light directory LP,
navy/pine/blue/gold, Archivo + Hanken; built 2026-08-31 in another session), and the live
PMF-model client build `clients/Internet-Loans-Direct/` (current best-practice form, API,
consent record, tracking, perf, QA tools). Template 4 must look like none of them. What
separates t4 from t3 (same structural model): the claret/amber "Civic ledger" identity,
Bricolage + Manrope, the full video-to-website scroll layer (Lenis, oversized marquee,
count-up stats band, desktop pin, persistent CTA, tilt/magnet), 51 generated state PAGES
+ hub + sitemap (t3 routes states, t4 also builds pages), and PROD-gated placeholder
lenders.

## 1. Folder, stack, versions (ALREADY INSTALLED)

Folder: `templates/funnels/dscr-4-civic-ledger`. Package `dscr-funnel-template-4`.
`package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore` exist; `node_modules`
is installed; the two variable woff2 fonts are already in `public/fonts/`; the fal PNG
sources are in `assets-src/`.

Stack: Astro 5.18 + React 19 island + Tailwind v4 (`@tailwindcss/vite`) + GSAP 3.15 +
Lenis 1.3 + `@astrojs/vercel` 8 + `@astrojs/sitemap` 3. `output: 'static'`; only
`/api/lead` is serverless (`export const prerender = false`). NEVER `output: 'hybrid'`.
Dev deps: puppeteer-core 25, sharp 0.35, lighthouse 13 (used via its node API with a
puppeteer-launched Chrome; no chrome-launcher dependency).

Scripts: `dev` = `astro dev --port 4321`; `build` = `astro build`; NO `preview` script (the
Vercel adapter has no preview entrypoint; use `tools/serve-dist.mjs`); `shoot`; `qa` =
`node tools/step-walk-qa.mjs && node tools/tcpa-test.mjs && node tools/gtag-test.mjs &&
node scripts/check-links.mjs` (expects a dev server at `QA_BASE`; does not start one);
`lh` = `node tools/lh.mjs`; `images` = `node scripts/convert-images.mjs`.

Windows notes for every agent: the workspace path contains spaces; always quote paths,
forward slashes are fine. Background `astro dev` needs `CI=true` in the environment.
PORTS: 4321 is currently held by `templates/funnels/dscr-3-light-directory`'s dev server from ANOTHER
session and 4322 by another session too; NEVER kill either. Run THIS project's dev server
on port 4323 (`CI=true npx astro dev --port 4323`) and point every QA tool at it with
`QA_BASE=http://localhost:4323`. Always check the served `<title>` contains `brand.name`
before trusting any screenshot. Kill only the dev server you started, by PID, when done. After `npm install`
or any `astro.config` change, delete `node_modules/.vite` and `.astro` before restarting
dev: a stale dep cache leaves the React island dead in dev only (`jsxDEV is not a
function`, island renders then vanishes).

`.env.example` ships `LEAD_WEBHOOK_URL=` with the comment: set the prod value from Git
Bash with `printf '%s' 'https://hooks.zapier.com/...' | npx vercel env add
LEAD_WEBHOOK_URL production` (PowerShell pipes append CRLF and break the fetch). Match an
existing Vercel project (`vercel project ls`) before `vercel link`.

## 2. Files and OWNERSHIP (one owner per file; nobody else writes it)

```
LANE 0 (already on disk): package.json, astro.config.mjs, tsconfig.json, .gitignore, public/fonts/*, assets-src/*, reference/*, BRIEF.md

LANE F, foundation (runs FIRST; its files are then FROZEN except by the integrator):
  src/styles/global.css              @font-face, @theme tokens, ALL shared component classes (section 5)
  src/config/site.ts                 EVERY brandable/legal token, option sets, copy blocks, icons (section 4)
  src/data/states.ts                 StateEntry list + findState()
  src/layouts/Layout.astro           head, font preloads, canonical, dataLayer stub + attribution, gtag defer (section 8)
  src/components/Icon.astro          <Icon name size class />  (icon renderer contract below)
  src/components/IconSvg.tsx         React twin of Icon.astro
  src/env.d.ts, .env.example, public/robots.txt, public/favicon.svg
  scripts/convert-images.mjs (+ runs it) -> public/images/aerial-dusk.webp, duplex-dusk.webp, og.jpg, src/data/lqip.ts
  a temporary src/pages/index.astro smoke page (overwritten by LANE C)

LANE B, form + plumbing:
  src/components/EligibilityForm.tsx, src/components/HeroForm.astro, src/pages/api/lead.ts, src/pages/not-yet.astro

LANE A, sections (top half):
  src/components/Topbar.astro, TrustBand.astro, Marquee.astro, Partners.astro, LenderPicks.astro, StickyCta.astro

LANE S, sections (bottom half):
  src/components/StatsBand.astro, Advantages.astro, HowItWorks.astro, Faq.astro, FinalCta.astro, Footer.astro

LANE C, compose + routes + motion:
  src/components/LandingPage.astro, src/pages/index.astro, src/pages/dscr-loans/index.astro (hub),
  src/pages/dscr-loans/[state].astro, src/pages/404.astro, src/scripts/motion.ts, scripts/check-links.mjs

LANE P, pages:
  src/pages/thank-you.astro, src/pages/privacy.astro, src/pages/terms.astro

LANE T, tools:
  tools/shoot.mjs, step-walk-qa.mjs, tcpa-test.mjs, gtag-test.mjs, lh.mjs, serve-dist.mjs, tools/README.md

INTEGRATOR / QA / FIXER agents may edit anything. DOCS writes CLAUDE.md + WIRING.md.
```

Styling rule that makes single ownership work: shared classes (section 5) live ONLY in
`global.css`. A section's private decor goes in that component's own `<style>` block
(Astro-scoped). Inside a component `<style>` never use `@layer` (a second `@layer`
declaration reorders Tailwind's layers and preflight wins) and never set a property that
a Tailwind utility on the same element also sets. If a section needs a new SHARED class,
it requests it in its return summary under NEEDS; it does not add it to global.css.

Icon renderer contract: `Icon.astro` props `{ name: keyof typeof icons; size?: number;
class?: string }` and `IconSvg.tsx` props `{ name; size?; className? }` both render
`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` with one `<path d>`
per entry in `icons[name]`. Unknown name renders nothing and logs a build warning.

## 2b. State route + directory plumbing

- `astro.config.mjs`: `site` (REBRAND item; must match `brand.domain`), `trailingSlash:
  'never'`, `integrations: [react(), sitemap({ filter: p => !/\/(thank-you|not-yet|404)$/.test(p) })]`.
- `Layout.astro` renders `<link rel="canonical" href={new URL(Astro.url.pathname, Astro.site)}>`
  (no trailing slash) on every page and `<meta name="robots" content="noindex">` when
  `noindex`. thank-you, not-yet, 404 are noindex.
- `public/robots.txt`: allow all, disallow /thank-you and /not-yet, Sitemap line (domain is
  a REBRAND item).
- `states.ts`: `export type StateEntry = { name: string; abbr: string; slug: string; blurb?: string }`;
  `slug` = name lowercased, spaces to hyphens (`new-york`, `district-of-columbia`); `abbr`
  uppercase; `export const states: StateEntry[]` (50 + DC); `findState(q)` matches name or
  abbr case-insensitively; `topStates` = the 12 most-populous slugs for the footer.
- Tokens for `/dscr-loans/[state]`: `<title>` = `{name} DSCR Loans: Check Your {year}
  Eligibility | {brand.name}`; H1 = `Check Your {year} {name} DSCR Loan Eligibility`; sub =
  `Rent qualifies the loan, not your tax returns. See which lenders fit your {name} deal.`;
  meta description = `DSCR rental property loans in {name}. Qualify on the rent, not your
  tax returns. 620 minimum credit. Check your {year} eligibility in about a minute.`. When
  `blurb` is absent the page renders `site.stateIntroFallback` with `{name}` substituted
  in a short intro paragraph under the trust band (unique-ish content per page, never a
  doorway wall of identical pages).
- `src/pages/dscr-loans/index.astro`: hub listing all 51 states as `<a href="/dscr-loans/{slug}">`
  in a 3-4 column grid under H1 `DSCR Loans by State`; indexable; linked from the footer
  and every state page.
- Footer: a generated "DSCR loans by state" column (hub link + `topStates`) built from
  `states.ts`, plus a "Company" column (Privacy, Terms, Advertiser Disclosure anchor, Do
  Not Sell or Share My Personal Information -> `/privacy#do-not-sell`). `directory.columns`
  defaults may contain ONLY hrefs that resolve on this build (`/`, `/dscr-loans`,
  `/dscr-loans/<slug>`, `#faq`, `#start`, `/privacy`, `/terms`). Article/Tools/Guide columns
  are commented-out examples for when those routes exist.
- `scripts/check-links.mjs` (LANE C): scans `dist/client/**/*.html` (fallback
  `.vercel/output/static`), collects every internal `href`, fails (exit 1) if any has no
  matching built file (`/x` -> `/x/index.html` or `/x.html`; `#anchors` and `/api/*` ignored).
  Runs as part of `npm run qa` after a build.

## 3. Design system ("Civic ledger": light, authoritative, warm)

Deliberately unlike v1 (dark luxury editorial), v2 (blueprint drafting), and ILD (sky/slate).
The mood: a public-facing consumer-finance directory that feels like a well-funded
institution, not a lead-gen scraper. Light mode default. Depth from real layered shadows,
not just 1px borders.

Tokens are named by ROLE (brand, amber, ink, paper), never by hue, so a client rebrand
is a values-only edit in `@theme` with zero markup changes. Tailwind v4 `@theme` in
global.css; use these names everywhere:
```
--color-paper:      #f7f4ee   page ground (warm off-white)
--color-sheet:      #ffffff   cards
--color-mist:       #f1ece6   quiet section ground (warm, not green-tinted)
--color-line:       #e3dcd3   hairlines / borders
--color-ink:        #1a1418   warm near-black: text + darkest surfaces
--color-ink-2:      #2a1f27   dark band gradient partner
--color-brand:      #5c1f2e   brand primary: claret. Bands, links, heading accents. Institutional, warm, unlike v1 pine / v2 cobalt / ILD sky.
--color-brand-deep: #3f1420   final CTA ground
--color-brand-soft: #f5e7e9   tinted chips / icon coins
--color-amber:      #f2a51a   THE action color (buttons, progress fill, highlights)
--color-amber-deep: #c9820a   hover GROUND for .btn-amber and large display accents only (>= 24px, or >= 19px bold). Never body/label/link text on paper, sheet or mist (3.2:1 fails AA). Amber as TEXT only on ink/ink-2/brand-deep.
--color-cream:      #f4efe3   text on dark
--shadow-card:      0 1px 2px rgba(26,20,24,.06), 0 14px 34px -16px rgba(92,31,46,.28)
--shadow-card-lg:   0 2px 4px rgba(26,20,24,.06), 0 30px 70px -28px rgba(92,31,46,.38)
--shadow-btn:       0 2px 0 rgba(26,20,24,.12), 0 12px 26px -12px rgba(242,165,26,.6)
```
Green is NOT used. Purple gradients are banned. No glassmorphism/frosted cards. Links,
eyebrows and text accents on light grounds use `--color-brand` (11:1).

Type (self-hosted, latin subset only, `font-display: optional`, preloaded in Layout).
Exactly two files are already in `public/fonts/`: `bricolage-grotesque-latin-wght-normal.woff2`
(41KB, wght axis only; NEVER the 131KB `-standard-` all-axes file or the `-opsz-`/`-wdth-`
files) and `manrope-latin-wght-normal.woff2` (25KB). Do NOT import the fontsource packages'
CSS (it registers "Bricolage Grotesque Variable" with extra subsets). Own `@font-face` in
global.css: `font-family: 'Bricolage Grotesque'` / `'Manrope'`, `font-weight: 200 800`,
`src: url(/fonts/...) format('woff2-variations')`, `font-display: optional`, latin
`unicode-range`. No `font-variation-settings` for axes the wght file does not carry.
- Display: **Bricolage Grotesque**. Headlines 700-800.
- Body/UI: **Manrope**. Body 400/500, labels 600-700.
- Metric-matched fallbacks so the fold does not move when the web font is skipped:
  `@font-face { font-family: 'Bricolage Fallback'; src: local('Arial'); size-adjust: 106%;
  ascent-override: 94%; descent-override: 24%; }` as the second family in `--font-display`;
  `'Manrope Fallback'` from `local('Segoe UI')` at `size-adjust: 101%` for body. QA tunes
  the percentages by overlaying web-font vs blocked-font screenshots until the H1 line
  count and the form-card top edge match within 4px at 390 and 1440.
  `--font-display: 'Bricolage Grotesque', 'Bricolage Fallback', Arial, sans-serif;`
  `--font-body: 'Manrope', 'Manrope Fallback', system-ui, sans-serif;`
- NO monospace anywhere, including "data" labels. Data styling = Manrope 600-700,
  uppercase, 0.12-0.18em tracking, small size.
- Readability floors (HARD): display tracking never tighter than -0.008em. Line-height:
  hero H1 1.15 at every breakpoint (set via `--tw-leading`, never a bare line-height in a
  component class); section H2 1.15; step titles 1.2; body 1.55+. The only exemptions are
  single-line numerals: `.stat-number` and `.marquee-text` use line-height 1.0 because they
  never wrap. No 1.08 anywhere.
- Sizes: hero H1 `clamp(2.4rem, 5.6vw, 4.6rem)` (must not exceed 3 lines at 390px);
  section H2 `clamp(2rem, 4vw, 3.4rem)`; step title `clamp(1.35rem, 2.4vw, 1.7rem)`;
  marquee `clamp(3.5rem, 11vw, 12rem)`; stat numbers `clamp(3.2rem, 6vw, 5.5rem)`; section
  labels 0.72rem uppercase 0.16em tracking muted, e.g. "01 / Requirements".

Shape: cards 18px radius, buttons 12px, chips 999px. Buttons: amber ground, ink text,
700 weight, `--shadow-btn`, hover lifts 1px onto amber-deep, active presses. Ghost
buttons: 1px brand border, brand text. Min height 3rem (44px+ targets).

Iconography: hand-drawn inline SVG via the Icon renderer contract (section 2). All icon
path sets live in `site.ts` `icons`. No emoji, no icon fonts, no external icon CDN.

Imagery (fal, images only; no video anywhere):
- `public/images/aerial-dusk.webp` (from `assets-src/aerial-dusk-01.png`, 1600 wide max,
  q70): golden-hour aerial of a suburban rental neighborhood. Used ONLY behind the stats
  band under a 0.84 ink overlay plus a brand-deep duotone layer (`mix-blend-mode:
  multiply`) so the photo reads as texture instead of vanishing; cream text on the
  composite must measure >= 7:1 (checked on a screenshot). `loading="lazy"`, sized.
- `public/images/duplex-dusk.webp` (from `assets-src/duplex-dusk-01.png`, 1280 wide, q70):
  modern duplex at dusk. Accent photo with an offset frame in HowItWorks (or Advantages);
  `loading="lazy"`, sized.
- `public/images/og.jpg` (1200x630): duplex photo cover-cropped with a solid ink band across
  the bottom third; NO text baked in.
- `scripts/convert-images.mjs` (sharp) produces the above and writes `src/data/lqip.ts`
  exporting a 24px-wide base64 data URI per image for background placeholders.
- The HERO has NO photograph: the H1 must be the LCP element. Hero atmosphere is CSS only:
  `.hero-atmo` = `position:absolute; inset:0; overflow:hidden; contain: paint;
  pointer-events:none; z-index:0` with static backgrounds on the element itself (soft
  radial brand glow + faint dot grid: radial-gradient 1px dots at 28px, opacity .35). The
  light sweep is a `::after` pseudo-element (a 40vw-wide soft diagonal gradient stripe,
  opacity .18) animated with `transform: translateX` ONLY (keyframes 14s linear infinite,
  `will-change: transform`), INERT until motion.ts adds `html.motion-ready` after window
  load + 1.2s (the keyframe rule is scoped under `html.motion-ready .hero-atmo::after`),
  desktop-only (`min-width: 1024px`), removed under `prefers-reduced-motion`. No
  `filter: blur()` on any hero layer (mobile paint killer); use gradient falloff.

## 4. `src/config/site.ts` (the rebrand surface)

Top of file: a `REBRAND CHECKLIST` comment (site/brand/specialist/tracking/booking/legal/
images/env/legal pages/`astro.config site`; note that `site.year` and `lenderPicksMonth`
are evaluated at BUILD time, so redeploy at the turn of the month/year) and a `LEGAL:
PLACEHOLDER DATA` block (see rules below).

```ts
export const site = {
  mode: 'network' as 'network' | 'lender',
  year: new Date().getFullYear(),          // build-time
  showYearInH1: true,
  stateIntroFallback: 'DSCR lenders in {name} qualify the loan on the property\'s rent, not your tax returns. ...',
};
export const brand = {
  name: 'DSCRlenders.com', legalName: 'DSCR Lenders Network LLC',
  tagline: 'An independent DSCR lender network',   // lender mode: 'DSCR rental property loans'
  domain: 'dscrlenders.example',
  phone: '(866) 555-0190', phoneHref: 'tel:+18665550190',
  privacyEmail: '',                         // renders in privacy#do-not-sell when set
  nmls: '', address: '',
  logoText: 'DSCRlenders', logoSrc: '',
  housingMark: 'opportunity' as 'lender' | 'opportunity',  // 'lender' honored ONLY when site.mode==='lender' AND nmls non-empty; else coerced to 'opportunity'
  licensingUrl: 'https://www.nmlsconsumeraccess.org',
};
export const specialist = { name: 'Alex Morgan', title: 'DSCR Loan Specialist', nmls: '' };
export const routing = { lender: null as null | { name: string; nmls: string } }; // network thank-you names a lender ONLY when this is set
export const tracking = { gtagId: '', gtagConversion: '' };
export const booking = { embedUrl: '' };                 // honored in lender mode only
export const seo = { title: `Check Your ${site.year} DSCR Loan Eligibility | ${brand.name}`, description: '...' };
export const hero = {
  h1: `Check Your ${site.year} DSCR Loan Eligibility`,   // showYearInH1 false drops the year
  subNetwork: 'Rent qualifies the loan, not your tax returns. See which lenders fit your deal.',
  subLender: 'Rent qualifies the loan, not your tax returns. See if your deal fits.',
};
export const specs = [  // header bullets + trust band: SPEC-SHEET claims only
  { icon: 'shield', label: '620 minimum credit score' },
  { icon: 'doc-x',  label: 'No tax returns or W-2s' },
  { icon: 'llc',    label: 'Close in your LLC' },
];
export const trustStrip = { text: 'Find the DSCR lender that fits your deal.', cta: 'Check My Eligibility' };
export const marqueeText = 'Qualify on the rent. Not your tax returns.';   // repeated 4x in markup, aria-hidden on repeats 2-4
export const stats = [  // StatsBand renders ONLY confirmed:true; every entry carries all keys; `from` = count-down start (optional)
  { value: 620, from: 0,  suffix: '',   decimals: 0, label: 'Minimum credit score',            confirmed: true },
  { value: 0,   from: 24, suffix: '',   decimals: 0, label: 'Tax returns required',            confirmed: true },   // counts DOWN 24 -> 0
  { value: 80,  from: 0,  suffix: '%',  decimals: 0, label: 'Max loan-to-value on purchases',  confirmed: false },  // CONFIRM PER CLIENT
  { value: 30,  from: 0,  suffix: 'yr', decimals: 0, label: 'Fixed-rate terms available',      confirmed: false },  // CONFIRM PER CLIENT
];
export const partners = [ { name: 'Sample Lender One', placeholder: true, verified: false }, ... x4 ];
export const lenders = [  // ribbon/badge/highlights are FACTUAL ATTRIBUTES supplied by the lender, never outcomes/superlatives/speed
  { name: 'Sample Lender One', nmls: '', ribbon: 'Rental loans in 40+ states', badge: 'Network member',
    highlights: ['No tax returns', 'Closes in LLCs', 'Short-term rental programs'], href: '#start',
    placeholder: true, verified: false },
  ... x3 (ribbons: 'Closes in LLCs', 'Short-term rental programs')
];
export const lenderPicksMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }); // build-time
export const advantages = [ { icon, title, body } x4 ];
export const advantagesProse = [ 'para', 'para', 'para' ];
export const howItWorks = { network: [ {title, body} x3 ], lender: [ {title, body} x3 ] };
export const faqs = [ { q, a } x6 ];   // NO RATES; one answer may say pricing is quoted by the lender, not published
export const directory = { columns: [ { title: 'Company', links: [...] } ] };  // state column is generated; article/tool columns commented out
export const form = {
  titles: { goal: 'What are you looking to do?', propertyType: 'What type of property is it?', credit: "What's your credit like?",
            pricePurchase: "What's the estimated purchase price?", priceRefi: "What's the property worth?",
            down: 'How much are you putting down?', balance: 'Roughly what do you still owe?', rehab: "What's the rehab budget?",
            state: 'What state is the property in?', contact: "What's your name and email?",
            phone: "What's the best number to reach you?", phoneNetwork: "What's the best number for your lender to reach you?" },
  subs: { credit: 'Your best guess is fine. This never touches your credit.', down: '(Minimum 20% for purchases)' },
  submit: 'Check My Eligibility', submitting: 'Checking your eligibility…', reassurance: 'No obligation.',
  phases: [ { id: 'property', label: 'Property' }, { id: 'credit', label: 'Credit' }, { id: 'deal', label: 'Deal' }, { id: 'contact', label: 'Contact' } ],
  errors: { name: 'Add your full name so we know who to address.', email: "That email doesn't look right. Mind checking it?",
            phone: 'Enter a 10-digit mobile number so we can text you.', consent: 'Please check the consent box so we have your permission to contact you.' },
};
export const cta = { primary: 'Check My Eligibility', sticky: 'Check Eligibility', final: { heading: 'Check DSCR loan requirements', body: '...' } };
export const thankYou = { network: { heading: "{firstName}, you're in.", body: 'A DSCR lender from the {brand} network will text or call you shortly to talk through your {goalLabel} and, if you want, run the numbers.',
                                     band: { heading: "It will come from a number you don't recognize.", body: 'Lenders call from their own lines. The text or call will mention {brand} and your {propertyTypeLabel} in {state}, so you know it\'s real.' },
                                     steps: [ 'Reply to the text', 'Talk it through', 'Terms from the lender' with bodies ] },
                          lender:  { heading: "{firstName}, you're in.", body: '{specialist} will text or call you from {phone} to talk through your deal and, if you want, run the numbers.',
                                     band: { heading: 'Save this number.', body: '...' }, steps: [...] } };
export const notYet = { heading: "Below 620, the lenders in this network can't say yes yet. Here's the fastest way back.",
                        body: "We'd rather tell you now than waste your time: the DSCR programs on {brand} start at a 620 credit score. Most investors are closer than they think, and these are the moves that actually move a score.",
                        moves: [ 5 x { title, body } ], comeBack: 'When you cross 620, come back and run it again.' };
export const goals = [  // PMF-proven labels and order; VALUES are the Zap contract
  { value: 'purchase',  label: 'Purchase',            icon: 'house-key' },
  { value: 'bridge',    label: 'Fix and Hold/Flip',   icon: 'house-hammer' },
  { value: 'refinance', label: 'Cash Out Refinance',  icon: 'house-refresh' },
];  // `sub` is optional and UNSET by default (sophisticated avatar: label + icon only)
export const propertyTypes = [ { value:'sfr', label:'Single family', icon:'sfr' }, { value:'2-4', label:'2-4 units', icon:'units2' },
  { value:'5+', label:'5+ units', icon:'units5' }, { value:'condo', label:'Condo or townhome', icon:'condo' },
  { value:'str', label:'Short-term rental', icon:'str' }, { value:'other', label:'Other', icon:'other' } ];
export const creditBands = [ { value:'740+', label:'740+', icon:'gauge5' }, { value:'700-739', label:'700-739', icon:'gauge4' },
  { value:'660-699', label:'660-699', icon:'gauge3' }, { value:'620-659', label:'620-659', icon:'gauge2' }, { value:'<620', label:'619 or less', icon:'gauge1' } ];
export const MIN_CREDIT = 620;

// TCPA. ONE constant, imported by the island (rendered next to the checkbox) AND shipped
// verbatim as payload.tcpaConsentText, so the record and the legal text can never desync.
// The automated-technology / prerecorded clause is load-bearing. The string must never
// contain the word "mode".
const consentParties = site.mode === 'network'
  ? `${brand.legalName} and one or more participating DSCR lenders in its network`
  : brand.legalName;
export const tcpaCopy = `By checking this box you expressly consent to having ${consentParties} contact you about your inquiry by email, text message, or phone call at the number you provided, including via automated technology, autodialer, or prerecorded or artificial voice messages, even if your number is on a Do Not Call registry. Message and data rates may apply; message frequency varies; reply STOP to opt out. Consent is not a condition of purchase or of receiving services and can be revoked at any time.`;
export const tcpaParties: string[] = site.mode === 'network'
  ? [brand.legalName, ...lenders.filter(l => l.verified && !l.placeholder).map(l => `${l.name} (NMLS ${l.nmls})`)]
  : [brand.legalName];

export const housingPhrase = (site.mode === 'lender' && brand.nmls && brand.housingMark === 'lender') ? 'Equal Housing Lender' : 'Equal Housing Opportunity';
export const legal = {
  networkNotice: `${brand.name} is not a lender, mortgage broker, or loan originator and does not make credit decisions. It is an independent service that connects real estate investors with participating DSCR lenders and may be paid by those lenders.`,
  advertiserDisclosure: `Advertiser Disclosure: Lenders shown on this page are paid advertisers. ${brand.name} does not rank, endorse, or recommend any lender, and compensation may affect which lenders appear and where. Your choice of lender should not be based on this page alone.`,
  notCommitment: `Submitting this form is not a loan application and does not result in a credit decision or a credit inquiry. Nothing on this site is a commitment to lend or an offer of credit. All loans are subject to lender approval, and program terms vary by lender, property, and state.`,
  noticeBar: site.mode === 'network' ? `Not a lender. ${brand.name} connects investors with independent DSCR lenders.` : `${brand.name}${brand.nmls ? ` · NMLS #${brand.nmls}` : ''}`,
  notAffiliated: `${brand.name} is a property of ${brand.legalName} and is not affiliated with or endorsed by any government agency.`,
  deviceLine: 'Information from your device may be used to personalize your ad experience.',
};
export const icons: Record<string, string[]> = { /* section 3 iconography; keys listed in section 5b */ };
```

LEGAL / PLACEHOLDER rules (enforce in code, not just comments):
- In production builds (`import.meta.env.PROD`) every `partners`/`lenders` entry with
  `placeholder: true` OR `verified !== true` is EXCLUDED. If a section has zero real
  entries it renders nothing (no heading, no disclosure). Dev builds render placeholders
  with a `.sample-tag` "SAMPLE". The build logs `WARN: N placeholder lenders excluded`.
- Placeholder NMLS is `''` (never a numeric string); NMLS lines render only when non-empty.
- `stats` render only `confirmed: true`; with fewer than 3 confirmed, StatsBand uses a
  2-up layout, never blank tiles.
- There are NO testimonials/reviews in this template. Add a section only with real,
  attributable reviews.

Legal placement rules: (a) Topbar notice bar renders `legal.noticeBar`; (b) directly under
the form card, ONE fine-print line: network = `Provided by {legalName}. Not a lender.
Equal Housing Opportunity. [Advertiser Disclosure]` (anchor to the LenderPicks disclosure
when rendered, else the footer disclosure); lender = `{legalName}{, NMLS #x}. {housingPhrase}.`;
(c) `advertiserDisclosure` renders under the LenderPicks H2 AND in the footer legal block
(network); (d) `notCommitment` renders in the footer legal block on every page and on
thank-you; (e) network footer also carries `notAffiliated`; both modes carry `deviceLine`
and the Do Not Sell link. The Equal Housing mark renders as the HUD house glyph + the
words spelled out, `role="img"` with matching aria-label, in the footer and in the
under-form fine print. A network build must contain zero occurrences of the string
"Equal Housing Lender".

## 5. CSS class contract (global.css, ALL inside `@layer components`)

Ground: `.ground-paper`, `.ground-mist`, `.ground-dark` (ink -> ink-2 gradient),
`.ground-brand`, `.ground-brand-deep`, `.container-x` (max-w 72rem, px 1.25rem / 2.5rem).
Type: `.h-display` (Bricolage 800, tracking -0.008em, `--tw-leading: 1.15`, hero clamp),
`.h-section` (section H2 clamp, 1.15), `.h-step` (step title clamp, 1.2), `.label`,
`.eyebrow` (label + brand), `.prose-body` (1.55 leading, max-w 62ch).
Cards: `.card`, `.card-lg`, `.card-dark`, `.card-tilt` (perspective 1200px wrapper).
Buttons: `.btn-amber`, `.btn-ghost`, `.btn-ghost-light`. Links: `.link`.
Form: `.opt-card` (+`.is-selected`; below 768px it becomes a horizontal row: 44px icon coin
left, label right, min-height 64px), `.opt-btn` (+`.is-selected`), `.opt-coin`,
`.field-input`, `.amber-range` (`--fill`), `.tcpa-box` (+`.is-consented`), `.tcpa-check`,
`.deal-chip`, `.phase-pill` (+`.is-active`, `.is-done`), `.progress-track`, `.progress-fill`,
`.step-enter`, `.step-enter-back`, `.sr-only` (Tailwind has it; do not redefine).
Decor: `.hero-atmo` (section 3), `.seam`, `.ribbon`, `.sample-tag`, `.offset-frame`,
`.eh-mark`, `.hp-field`, and the marquee set:
- `.marquee-wrap`: `overflow:hidden; contain: paint; padding-block: clamp(1.5rem, 4vw, 3rem)`.
- `.marquee-track`: `display:flex; white-space:nowrap; width:max-content; transform: translateX(-4%)`
  (`will-change: transform` is set from JS only while the section is within one viewport).
- `.marquee-text`: Bricolage 800, `clamp(3.5rem, 11vw, 12rem)`, line-height 1, uppercase,
  tracking 0.02em, brand color; `.is-outline` (`-webkit-text-stroke: 1px currentColor;
  color: transparent`) alternates every other repeat on >= 1024px ONLY; below that every
  repeat is solid (text-stroke is a paint cost).
- `.stat-number`: `font-variant-numeric: tabular-nums; display:inline-block; min-width: <N>ch`
  (N = final digit count, set via a `--digits` var); `text-align:right`; line-height 1.
  `.stat-suffix` smaller, baseline-aligned.
Utilities: `.cv-auto` (`content-visibility:auto; contain-intrinsic-size: auto 720px`),
applied ONLY to Partners, LenderPicks, StatsBand, HowItWorks, Faq, Footer. NEVER on
TrustBand (can sit in the first desktop viewport), Marquee (scrub geometry), Advantages
(pin: paint containment turns fixed pinning into a no-op), FinalCta (persist + sticky
observer target). `.tabular`.
Globals: `body { overflow-x: clip }`; `html { scroll-behavior: auto }` (never smooth; Lenis
owns smooth scroll on desktop, `scrollIntoView({behavior:'smooth'})` elsewhere);
`::selection` amber; `:focus-visible` brand ring; reduced-motion kills keyframes and
transitions; `[hidden] { display: none !important }`; `html.motion-ready` gates the hero
sweep.

### 5b. Icon keys (site.ts `icons`)
`house-key, house-refresh, house-hammer, shield, doc-x, llc, sfr, units2, units5, condo,
str, other, gauge5, gauge4, gauge3, gauge2, gauge1, check, arrow, phone, calendar, chat,
ledger, portfolio, clock, map-pin, star, home, reply, handshake, file-text`.

## 6. The form (`EligibilityForm.tsx`, React island, mounted `client:load` inside HeroForm)

Props: `{ fixedState?: StateEntry }` passed as a serializable prop from `HeroForm.astro`
(`<EligibilityForm client:load fixedState={fixedState} />`); never read from a module
global or `window`. Inside: `state: fixedState?.name ?? ''` seeds answers; the `state` step
is omitted when `fixedState` is set; payload `state` is ALWAYS the full name (`'Texas'`)
and `stateSlug` the slug (`'texas'`); the type-ahead resolves names and abbreviations to
the same `StateEntry`, so `stateSlug` is never empty when `state` is set.

Mount: `client:load` (above the fold, primary interaction; Astro SSRs step 1 into the
HTML so it paints before hydration). Preselect: any element with `data-goal` triggers an
inline script in HeroForm.astro that sets `document.getElementById('start').dataset.preselect = goal`
AND dispatches `new CustomEvent('funnel:preselect', { detail: goal })`. The island reads
`dataset.preselect` on mount (covers a pre-hydration click) and listens for the event.
Any element with `data-scroll-to="#start"` (always an `<a href="#start">`) scrolls to the
form; motion.ts intercepts with Lenis when loaded, native anchor otherwise.

Steps (8; 7 when `fixedState`):
1. `goal` -> 3 big `.opt-card`s in a row on >= 768px (icon coin on top, label below);
   below 768px each card is a horizontal row (44px icon coin left, label right, min-height
   64px, 12px gap) so all three options sit above the 390x844 fold together with the H1,
   sub and phase pills. Header spec bullets and the hero sub-line are hidden below 768px.
   Acceptance: the mobile screenshot of the initial load shows the bottom edge of the
   third option card and the fine-print line without scrolling. Icon + label only.
2. `propertyType` -> 2-col `.opt-btn` grid with icons.
3. `credit` -> `.opt-btn` list; sub from `form.subs.credit`; `<620` => `location.href='/not-yet'`
   (hard exit; server also drops it).
4. `price` -> `#ff-range` $100K..$2M step 25K default 300K, display `$2,000,000+` at max;
   title purchase/bridge `pricePurchase`, refinance `priceRefi`; Continue.
5. `secondary` purchase: `down` 20..50 step 5 default 25 with "≈ $X down", sub
   `form.subs.down`; refinance: `balance` 0..price step 25K with "≈ $X in equity"; bridge:
   `rehab` 0..500K step 25K; Continue.
6. `state` -> `#ff-state` type-ahead (names + abbreviations), suggestions are
   `.opt-btn[data-value="<slug>"]`; skipped when `fixedState`.
7. `contact` -> `#ff-name` (Full name) + `#ff-email`; Continue.
8. `phone` -> `.deal-chip` recap (goal, property, state, price), `#ff-phone`, `.tcpa-box`
   with `#ff-tcpa` ABOVE the submit button, starts UNCHECKED, blocks submit; button
   `form.submit` / `form.submitting`; under it `form.reassurance` ("No obligation.").
   Title: `form.titles.phoneNetwork` in network mode, `form.titles.phone` in lender mode.

Phase pills (`form.phases`): Property (goal, propertyType) · Credit (credit) · Deal (price,
secondary, state) · Contact (contact, phone); visually rendered with `.progress-fill`; the
"Step N of T" text is `.sr-only` with `aria-live="polite"` (NOT visible; the reference uses
pills only). Back link from step 2 on. The form must NOT imply an instant result (no "see
your results", no "your match is ready").

### DOM contract (tools depend on these; never rename)
```
#start                         form card wrapper (HeroForm.astro); anchor target; NO data-tilt, no motion
#eligibility-form              island root
#start [data-step="<stepId>"]  mounted step body; stepId in goal|propertyType|credit|price|secondary|state|contact|phone
#start [data-step-title]       <h2 class="h-step"> step title (one per mounted step)
#start [data-step-sub]         optional subtitle <p>
#start [data-phase-pill][data-phase="property|credit|deal|contact"]   .is-active / .is-done
#start [data-step-label]       sr-only "Step N of T"
#start .progress-fill          style width = progress%
.opt-card[data-value="purchase|refinance|bridge"]   step 1 (button type=button)
.opt-btn[data-value="<option value>"]                steps 2, 3 and state suggestions (slug values)
#ff-range                      the <input type=range> on price/secondary
#ff-state                      state type-ahead input
#ff-name, #ff-email, #ff-phone contact + phone inputs (autoComplete name / email / tel-national)
#ff-tcpa                       the native checkbox; its <label class="tcpa-box"> wraps it
[data-action="continue"] [data-action="back"] [data-action="submit"]
[data-error]                   visible validation error <p> (consent case text MUST contain "consent box")
#ff-ref-b                      honeypot (no name attr; id must not resemble any autofill category)
.deal-chip                     recap chips on the phone step
#sticky-cta                    mobile sticky CTA wrapper (StickyCta.astro), toggled via the `hidden` attribute
#ty-name, #ty-chips            thank-you personalization targets
```
Stable option labels used by tools: goal "Purchase"; propertyType "Single family"; credit
"700-739" and "619 or less"; state suggestion "Texas". Tools click by `[data-value]` /
`[data-action]`, never by text.

Mechanics (proven; adapt from ILD's FunnelForm.tsx and v2's Funnel.tsx):
- Sub-components at MODULE scope (nested components remount every render and kill slider drag).
- Auto-advance 180ms after an option pick; height tween between steps (useLayoutEffect,
  reduced-motion aware); on step change keep the card in view via
  `window.__lenis?.scrollTo(el, { offset: -16, duration: 0.6 }) ?? el.scrollIntoView({ block: 'nearest' })`;
  keyed `.step-enter` / `.step-enter-back`. The state suggestion list container carries
  `data-lenis-prevent` so wheel scrolling inside it is never swallowed.
- The island imports NOTHING beyond react/react-dom, site.ts and states.ts (name/abbr/slug
  only; blurbs live in a separate file the state route imports). No icon lib, no date lib.
- The form card (`#start`) and everything inside it NEVER receive any GSAP set/tween,
  tilt, magnet, or CSS entrance. Form-internal motion (step-enter, height tween,
  `.is-selected`) is React/CSS only.
- `funnel_start`, `funnel_step`, `lead_submit` dataLayer events.
- Attribution: `?qa=1` => `sessionStorage.qa='1'`; gclid/utm_* captured to `attr_*` (Layout
  does first-touch; the island reads them at submit).
- Phone formatting strips a leading `1` from 11-digit input, then 10 digits max.
- Honeypot `<input id="ff-ref-b" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp-field" />`
  in the always-mounted shell; payload key stays `website`.
- TCPA: `tcpaConsentAt` stamped at the click; consent gate in `submit()` with the
  `form.errors.consent` text; duplicate-submit guard via a synchronous ref.
- sessionStorage access wrapped in try/catch everywhere (Safari private mode throws).
- On success: `sessionStorage['lead-summary'] = { firstName, goal, goalLabel, propertyType, propertyTypeLabel, credit, price, priceDisplay, state, stateSlug, mode }`, then `location.href='/thank-you'`.

Payload (keys are the CRM contract; never rename; add new keys only at the END and note
them): `source:'dscr-funnel-template-4', mode, goal, goalLabel, stage:'', stageLabel:'',
propertyType, propertyTypeLabel, credit, price ('2000000+' at max), priceDisplay, downPct,
downPctDisplay, downPayment, downPaymentDisplay, balance, balanceDisplay, equity,
equityDisplay, rehab, rehabDisplay, scenarioDetail, city:'', state, stateSlug, firstName,
email, phone (10 digits), partial:false, tcpaConsent:true, tcpaConsentText, tcpaConsentAt,
tcpaConsentUrl, tcpaConsentMode, tcpaConsentParties (string[]), gclid, utm_source,
utm_medium, utm_campaign, utm_term, utm_content, landingPage, referrer, secondsToComplete,
website, submittedAt`.
Branch semantics (identical to ILD): `downPct`, `balance`, `rehab`, `price` always carry
their slider numbers regardless of goal; `downPayment`, `equity` are numbers on their branch
and `null` otherwise; every `*Display` key is a string on its branch and `null` otherwise;
`stage`, `stageLabel`, `city` are always `''`; `secondsToComplete` is a number or `null`;
`gclid`/`utm_*` are OMITTED (not null) when absent; `landingPage` and `referrer` are always
present.

## 7. `/api/lead` (server route, `prerender = false`)

Order in `POST`:
1. `request.json()` fails => 400 `bad json`.
2. `website` (honeypot) non-empty string => 200 `{ok:true}` silent drop.
3. `credit === '<620'` => 200 silent drop.
4. `tcpaConsent !== true` => 400 `consent required`.
5. `firstName` trimmed length < 2, or `email` fails `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/`, or
   `phone` not exactly 10 digits => 400 `incomplete lead` (one webhook per lead means a
   complete lead).
6. Stamp `tcpaConsentIp` (x-vercel-forwarded-for, else first x-forwarded-for, else null),
   `tcpaConsentUserAgent`, `tcpaConsentReceivedAt`, `receivedAt` (ISO).
7. `const webhook = process.env.LEAD_WEBHOOK_URL ?? import.meta.env.LEAD_WEBHOOK_URL;`
   (process.env FIRST; import.meta.env non-PUBLIC vars are inlined at build).
8. `!webhook`: `import.meta.env.PROD` => 500 `not configured` (fail loudly); otherwise
   `console.warn('[lead] LEAD_WEBHOOK_URL not set; payload:', JSON.stringify(data))` and 200.
9. `fetch(webhook, POST JSON)`; non-2xx => 502 `webhook <status>`; throw => 502 `webhook
   unreachable`; else 200 `{ok:true}`.
The form posts JSON via `fetch` (Astro's `security.checkOrigin` does not inspect it); never
switch to FormData without `security: { checkOrigin: false }`.

## 8. Layout.astro (head)

Props: `title, description, noindex?, ogImage?`. Charset/viewport/title/description/og
tags (og:image defaults to `/images/og.jpg`); canonical per section 2b; favicon; preload
both woff2 (same-origin, `crossorigin`); inline `<script is:inline>`: `dataLayer` stub +
`gtag()` queue function + `gtag('js')`/`gtag('config', id)` when `tracking.gtagId`;
first-touch capture of gclid/utm_* into `sessionStorage.attr_*`, `attr_landing`,
`attr_referrer`, and `qa=1` -> `sessionStorage.qa` (all in try/catch); gtag.js injected on
`window load` (never in the startup path). `<body class="ground-paper">`. The motion spine
is imported by LandingPage/thank-you via `<script>import '../scripts/motion.ts'</script>`.

## 9. thank-you.astro

`noindex`. Mode branching is BUILD-TIME from `site.mode` (`lead-summary.mode` is
informational only). Personalizes from `sessionStorage['lead-summary']` into `#ty-name`
and `#ty-chips`. Frame = CONVERSATION OPENER, never results delivery; copy from
`thankYou[site.mode]`. Network mode: NO lender name, logo, or NMLS is rendered unless
`routing.lender` is set (then that single lender card renders); the dark band is "It will
come from a number you don't recognize." Lender mode: dark save-the-number band with
`brand.phone` as the sole focal, specialist card, optional GHL booking iframe
(`scrolling="yes"`, `height: min(1060px, calc(100vh - 120px))`, no overflow-hidden wrapper).
"What happens next" 3 steps from config. `notCommitment` in the footer. Never promise an
email. Conversion: an inline script at the TOP of the page script, before any motion
import, guarded by `tracking.gtagConversion && typeof gtag === 'function'`, fires
`gtag('event','conversion',{send_to})` ONLY when `lead-summary` exists (or `?demo=1`), NOT
when `sessionStorage.qa==='1'`, once per tab (`sessionStorage.conv_fired`); pushes
`thank_you_view` to dataLayer. Static H1. `not-yet.astro` and `404.astro` are also noindex.

## 10. Motion spine (`src/scripts/motion.ts`), the video-to-website layer without the video

Imported by `LandingPage.astro` ONLY (thank-you, not-yet, privacy, terms, 404 never load
it; lenis.css disables pointer-events on iframes while smooth-scrolling, which would break
the booking embed). Loads NOTHING before `window load`; then `setTimeout 1200`; then
`await import('gsap')`, `import('gsap/ScrollTrigger')`, and (desktop only) `import('lenis')`
+ `import('lenis/dist/lenis.css')`. Adds `html.motion-ready` once loaded. Bails entirely on
`prefers-reduced-motion`. Reveal states are applied FROM JS (`gsap.set`) so a failed load
can never hide content. A `belowFold(el)` guard (`rect.top > innerHeight*1.05`) skips
every element already in or near the viewport. The H1 and the form card NEVER animate.
Never call `ScrollTrigger.normalizeScroll()` (conflicts with Lenis).

Lenis runs ONLY under `gsap.matchMedia('(min-width:1024px) and (pointer:fine)')` from day
one (touch scrolling is native in Lenis anyway, so mobile would pay the bundle + RAF loop
for nothing). Options: `new Lenis({ duration: 1.2, easing: t => Math.min(1, 1.001 - Math.pow(2, -10*t)),
smoothWheel: true, syncTouch: false, autoRaf: false, anchors: { offset: -16 },
prevent: (node) => node.hasAttribute('data-lenis-prevent') })`; `lenis.on('scroll', ScrollTrigger.update)`;
`gsap.ticker.add(t => lenis.raf(t*1000))`; `gsap.ticker.lagSmoothing(0)`; `window.__lenis = lenis`;
`document.fonts.ready.then(() => ScrollTrigger.refresh())`. `[data-scroll-to]` click handler
(registered on every device): `if (window.__lenis) { e.preventDefault(); lenis.scrollTo(target, { offset: -16 }) }`
else let the native `<a href="#start">` jump happen but upgrade it with
`target.scrollIntoView({ behavior: 'smooth', block: 'start' })`.

Data-attribute animation contract (sections use DIFFERENT types, never the same type on
consecutive sections). Every reveal is once (`toggleActions: 'play none none none'`),
start `top 88%` (cards `top 90%`), duration 0.7s (clip-up 0.9s), ease `power3.out`
(scale-up `power2.out`, clip-up `power4.out`), stagger 0.1s in DOM order. Offsets are
halved under `(max-width: 767px)`: fade-up y:24, slide x:±36, rotate y:20.
```
data-reveal="fade-up"     y:40  -> 0
data-reveal="slide-left"  x:-70 -> 0
data-reveal="slide-right" x:70  -> 0
data-reveal="scale-up"    scale:.9 -> 1
data-reveal="rotate-in"   y:36, rotation:2.5 -> 0
data-reveal="clip-up"     clipPath inset(100% 0 0 0) -> inset(0 0 0 0)
data-stagger              on a parent: children with [data-child] stagger 0.1s in DOM order (label -> heading -> body -> CTA)
data-counter="620" data-from="0" data-decimals="0"   gsap.fromTo(el, {textContent: from}, {textContent: value, snap: {textContent: decimals ? 0.1 : 1}, duration: 1.8, ease: 'power1.out'}) once, trigger 'top 75%'; `from` > value counts DOWN
data-marquee="-28"        gsap.fromTo(track, {xPercent: -4}, {xPercent: -28, ease: 'none', scrollTrigger: {trigger: section, start: 'top bottom', end: 'bottom top', scrub: 0.6}}); when cut on mobile the track stays at translateX(-12%)
data-draw                 SVG path stroke-dash draw on enter
data-seam                 scaleX 0 -> 1
data-pin="advantages"     desktop-only (matchMedia '(min-width:1024px)'). ScrollTrigger.create({ trigger: prose, start: 'top 96px', endTrigger: grid, end: 'bottom bottom', pin: prose, pinSpacing: false, invalidateOnRefresh: true, anticipatePin: 1 }). Pin travel = grid.offsetHeight - prose.offsetHeight must be >= 320px at 1440x900; if not, the card column renders as ONE stacked column (4 tall cards, rotate-in one at a time) instead of 2x2. Never on mobile. The Advantages section is never .cv-auto.
data-persist              excluded from every reverse/kill path, never .cv-auto, and is the IntersectionObserver target that hides StickyCta (FinalCta)
data-tilt                 pointer tilt, max 4deg, perspective 1200px, `(hover:hover) and (pointer:fine)` only, spring-eased (quickTo). Applied to Advantages cards and LenderPicks cards ONLY. NEVER on #start, the H1, or any element containing an input, select, or dropdown.
data-magnet               capped magnetic pull on CTAs (12px / 8px), fine pointer only
```
Section -> type map: TrustBand `fade-up` stagger; Marquee scrub; Partners `scale-up`
stagger; LenderPicks alternate `slide-left`/`slide-right` + tilt; StatsBand `clip-up`
heading + counters; Advantages prose `slide-left` + cards `rotate-in` stagger + tilt +
desktop pin; HowItWorks `scale-up` + `data-draw` connector; Faq `fade-up` batch; FinalCta
`clip-up` + `data-persist` + `data-magnet`.

Composition order (LandingPage.astro), ground, reveal carrier, stagger, cv-auto, mode:
```
1  Topbar            paper       none                          -      no   both
2  HeroForm #start   paper       none (static, LCP)            -      no   both
3  TrustBand         brand       inner .container-x            yes    no   both
4  Marquee           paper       .marquee-track (scrub)        -      no   both
5  Partners          sheet       each wordmark tile            batch  yes  network
6  LenderPicks       mist        each card (alt L/R)           -      yes  network
7  StatsBand         dark        h2 clip-up; .stat counters    yes    yes  both
8  Advantages        paper       prose col + each card         yes    NO   both (pin)
9  HowItWorks        mist        each step + connector         yes    yes  both
10 Faq               paper       each details (batch)          batch  yes  both
11 FinalCta          brand-deep  inner .container-x            yes    NO   both (persist)
12 Footer            ink         none                          -      yes  both
```
Rules: `data-reveal` is NEVER placed on the `<section>` that carries a ground class; it
goes on the inner wrapper or the cards, so bands never flash paper. Reveals are applied
only to elements passing `belowFold()`; everything else renders static. State pages
insert a short intro paragraph between TrustBand and Marquee (section 2b).

Listen for `contentvisibilityautostatechange` and debounce `ScrollTrigger.refresh()`; also
refresh once on first scroll. `ScrollTrigger.batch` for card grids (target <= 12 triggers
total on mobile). `gsap.matchMedia()` for desktop-only Lenis/pin/tilt/magnet. Everything
in try/catch: the page never breaks because of motion.

## 11. Copy doctrine (READ `foundation/copywriting-tanner-style/golden-rules.md` and
`form-simplification.md` before writing any customer-facing text)

- Honesty floor: say only what the template can stand behind. NEVER publish interest
  rates (hard rule). No closing-day-count claims in default copy.
- BANNED PHRASES in all default copy (specs, marquee, trust band, advantages, FAQ, lender
  highlights, thank-you, not-yet): interest rates or rate comparisons ("lower rates",
  "competitive rates"); closing day counts; "no income verification" (DSCR verifies rent;
  say "no personal income docs"); "no limit on properties" / "unlimited"; "guaranteed" /
  "approved" / "pre-approved"; "instant" as a result (allowed only as "instant to fill
  out"); any investor count or funded volume; "Updated Requirements" / "{year} guidelines"
  (DSCR has no annually published requirements); "everywhere" / "no DSCR lender" / "no
  lender" on the not-yet page.
- No fabricated proof: no review quotes, no funded-volume stats, no "N investors checked".
- Invite, don't hard-sell. Enter the conversation in the investor's head ("my CPA writes
  everything off, so banks think I'm broke").
- Sophisticated avatar => label-only options; say each reassurance once, at the objection
  (credit step carries "never touches your credit"; the phone step carries only "No
  obligation.").
- No em-dashes anywhere (hard rule). Use periods, commas, or colons.
- Eligibility frame ("Check Your {year} DSCR Loan Eligibility", "Check My Eligibility") is
  the deliberate choice (modeled on the reference; PMF-proven), but nothing may imply an
  instant result.

## 12. Performance budget (HARD)

Mobile Lighthouse >= 90 on the BUILT output, median of runs 2-4 (run 1 is a cold outlier).
Rules: H1 static (no entrance animation of any kind); no hero photo; fonts self-hosted
`font-display: optional` + preload; CSS external (never inline all); island `client:load`
(it is the hero; keep its bundle lean: no heavy deps inside the island); gtag deferred;
GSAP/Lenis dynamic-imported after load; `belowFold` guard; `.cv-auto` below the fold;
images lazy + sized + webp. Lenis and pin are desktop-only by construction and never
count against mobile. If the mobile median is < 90, cut in this order and re-measure
after each: (1) marquee `.is-outline` text-stroke on mobile (already solid) then marquee
scrub on mobile (static `translateX(-12%)`); (2) rotate-in and clip-up on mobile become
fade-up (no rotation/clip-path layers); (3) raise the post-load delay from 1200ms to
2200ms or move the import behind `requestIdleCallback({timeout: 2200})` after load; (4)
collapse per-element ScrollTriggers into `ScrollTrigger.batch` per section; (5) counters.
Never ship a slow page for a visual. Read
`C:/Users/tanne/.claude/projects/c--Users-tanne-Downloads-Claude-Code-Master-Projects/memory/reference_astro_perf_pagespeed_gotchas.md`
and `.../reference_astro_tailwind_v4_gotchas.md` before touching perf or CSS.

## 13. QA tools contract (tools/)

Every tool reads `QA_BASE` (default `http://localhost:4321`) and `CHROME_PATH` (default
`C:/Program Files/Google/Chrome/Application/chrome.exe`), reads ids it needs from
`src/config/site.ts` with a regex (`gtagId:\s*'([^']*)'`, `gtagConversion:\s*'([^']*)'`,
`name:\s*'([^']*)'` inside brand), and fails fast with `no server at QA_BASE` if
`document.title` does not contain `brand.name` (port-squatter check).

- `shoot.mjs`: puppeteer-core; ONE browser per viewport (desktop 1440x900 dsf1; mobile
  390x844 dsf2 hasTouch, NO isMobile); asserts `document.documentElement.clientWidth ===
  width` on every load. Shoots: `/` full page after a scroll-through (so reveals fire and
  cv-auto sections paint) and back to top; every form step (click by `[data-value]` /
  `[data-action]`: purchase, sfr, 700-739, Continue, Continue, type "tex" + click texas,
  fill name/email + Continue, fill phone + check `#ff-tcpa`) with a shot per step;
  `/not-yet`; `/thank-you` with seeded `lead-summary`; mobile sticky (scroll 1800);
  `/dscr-loans/texas` full page; `/dscr-loans` hub. Output `tools/shots/<viewport>-<name>.png`.
- `step-walk-qa.mjs`: purchase path (8 steps, asserts each `[data-step-title]` text is
  non-empty and no visible `Step \d of \d` text); refinance and bridge branches to the
  secondary step (asserts the branch titles); sub-620 lands on `/not-yet`;
  `/dscr-loans/texas` walk is 7 steps with no state step and the phone-step recap chip reads
  Texas; a full submit on `/?qa=1` ends on `/thank-you` with `lead-summary` present
  (intercept the POST; assert `state==='Texas'` and `stateSlug==='texas'` on the state-page
  submit). Exit 1 on failure.
- `tcpa-test.mjs`: `#ff-tcpa` starts unchecked; its label sits above `[data-action=submit]`
  in DOM order and visually (boundingClientRect); zero POSTs to `/api/lead` when submitting
  unchecked; when checked the intercepted body has `tcpaConsent:true`, non-empty
  `tcpaConsentText` containing no substring `mode`, ISO `tcpaConsentAt`, `tcpaConsentUrl`,
  `tcpaConsentMode`, and `tcpaConsentParties.length >= 1`; the error text contains "consent box".
- `gtag-test.mjs`: when `gtagId` is empty it asserts the NEGATIVE contract only (no
  googletagmanager request on `/`; no `conversion` push on `/thank-you`, `/thank-you?demo=1`,
  and the seeded-lead case) and prints `SKIP positive cases: tracking.gtagId is empty`;
  exit 0. When set: stub `gtag` via `evaluateOnNewDocument`, assert conversion fires with
  seeded lead and with `?demo=1`, not bare, and not with seeded lead + `sessionStorage.qa='1'`.
- `serve-dist.mjs`: serves `dist/client` (fallback `.vercel/output/static`) on `LH_PORT`
  (default 4399): `/` -> index.html, `/a/b` -> `/a/b/index.html` then `/a/b.html`, 404
  otherwise; MIME map for html/css/js/mjs/svg/webp/jpg/png/woff2/json/ico/txt/xml; `/api/*`
  returns 404 (serverless is not part of the audit).
- `lh.mjs`: `astro build`, start serve-dist in-process, launch Chrome with puppeteer-core
  (`args: ['--headless=new', '--remote-debugging-port=0']`), `port = new URL(browser.wsEndpoint()).port`,
  then `lighthouse(url, { port, output: ['json','html'], onlyCategories: ['performance'],
  formFactor: 'mobile', screenEmulation: { mobile: true, width: 412, height: 823,
  deviceScaleFactor: 1.75, disabled: false }, throttlingMethod: 'simulate' })` 4 times on
  `/` and once on `/dscr-loans/texas`; print each score + LCP/TBT/CLS, the median of runs
  2-4, write reports to `tools/lh-reports/`, exit 1 if the median < 90.

## 14. Accessibility & misc

Semantic landmarks; every icon `aria-hidden`; buttons are `<button type="button">`; inputs
labeled (aria-label ok); focus-visible rings; contrast AA on all text (amber text only on
ink/dark); `prefers-reduced-motion` respected everywhere; touch targets >= 44px; no
horizontal overflow at 320px; `<details>` FAQ keyboard-operable; the Equal Housing mark
has `role="img"` + aria-label.

## 15. Definition of done

`npm run build` clean; `npm run qa` all pass (incl. check-links); `npm run lh` median >= 90
mobile; three screenshot passes (desktop + mobile + every state) with defects fixed;
adversarial review findings addressed; CLAUDE.md + WIRING.md written; no em-dash
(U+2014) in any shipped file under src/ public/ tools/ scripts/; a network build contains
zero "Equal Housing Lender"; no default copy matches
`\brates?\b|\bapr\b|days to close|guarantee|unlimited|no income verification` except two
sanctioned spots: the FAQ answer that says pricing is quoted by the lender and not
published, and the verbatim TCPA consent text ("Message and data rates may apply" is
required consent language, not a rate claim).

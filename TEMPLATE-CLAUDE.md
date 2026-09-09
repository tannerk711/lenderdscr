# DSCR Funnel Template 4 ("Directory")

Fourth master DSCR funnel template, built 2026-09-01. Modeled on the STRUCTURE of fhaloans.com/start (Mortgage Research Center's directory-style lead-gen page), rebuilt for DSCR, and layered with the full `video-to-website` premium scroll system with no video anywhere: Lenis smooth scroll (desktop only), six distinct entrance types, an oversized horizontal marquee scrub, a dark stats band with count-up counters, a desktop pin, tilt/magnet micro-interactions, and a persistent final CTA. Sister templates: v1 (dark luxury editorial), v2 (blueprint drafting), v3 (also an fhaloans-style light directory, navy/gold). Zero visual reuse between any of them. What separates t4 from t3: the claret/amber "Civic ledger" identity, Bricolage + Manrope, the scroll layer, 51 GENERATED state pages + hub + sitemap (t3 only routes states), and PROD-gated placeholder lenders.

`BRIEF.md` in this folder is the binding build contract (tokens, class names, DOM contract, payload keys, copy rules). Read it before changing anything structural.

## Always-on visual layer

Every funnel/landing/premium build reuses the **advanced visual/motion layer** by default (Tanner's standing preference, 2026-07-22). Canonical spec: `foundation/creative/advanced-visual-motion-layer.md`. Keep it on any rebrand. Guardrail: never drop mobile pagespeed below 90. This build ships the full layer and still measured a **mobile Lighthouse median of 99** (see Performance below), so there is no excuse to cut it on a rebrand.

## Stack

Astro 5.18 + React 19 island + Tailwind v4 (`@tailwindcss/vite`) + GSAP 3.15 + Lenis 1.3 + `@astrojs/vercel` 8 + `@astrojs/sitemap`. `output: 'static'`; only `/api/lead` is serverless. Never `output: 'hybrid'`. Fonts are self-hosted variable woff2 (latin subset only) in `public/fonts/`.

- `npm run dev`: port 4321 (background shells need `CI=true`; verify the served `<title>` says the brand name before trusting anything on that port)
- `npm run build`: must pass before any commit. Expected output: "WARN: N placeholder partners/lenders excluded" per page; that is the intended PROD gating, not a defect.
- `npm run qa`: step-walk-qa + tcpa-test + gtag-test + check-links (check-links needs a prior build). Expects a dev server at `QA_BASE`; does not start one.
- `npm run shoot`: full screenshot sweep to `tools/shots/`
- `npm run lh`: build, serve dist gzipped on 4399, mobile Lighthouse x4 on `/` + x1 on `/dscr-loans/texas`, median of runs 2-4, exit 1 below 90
- `npm run images`: `assets-src/` PNGs to `public/images/` webp + `src/data/lqip.ts`
- No `preview` script (the Vercel adapter has none); use `node tools/serve-dist.mjs`.

## Design system ("Civic ledger")

Light, authoritative, warm: a public-facing consumer-finance directory that feels like a well-funded institution. Deliberately unlike v1, v2, v3, and ILD. Do not blend them.

- Palette (role-named tokens in `src/styles/global.css` `@theme`; a rebrand is a values-only edit): paper `#f7f4ee` ground, sheet white cards, mist `#f1ece6` quiet sections, ink `#1a1418` warm near-black, **brand claret `#5c1f2e`** (links, bands, accents), brand-deep `#3f1420` (final CTA), **amber `#f2a51a`** as THE action color (buttons, progress fill), cream `#f4efe3` text on dark. Green banned, purple gradients banned, no glassmorphism. Amber as text only on dark grounds (fails AA on light).
- Type: **Bricolage Grotesque** display 700-800, **Manrope** body/UI. Metric-matched local fallbacks (`Bricolage Fallback` from Arial at size-adjust 106%, `Manrope Fallback` from Segoe UI at 101%) so the fold does not move when `font-display: optional` skips the web font. No monospace anywhere; data styling = Manrope 600-700 uppercase tracked.
- Readability floors: display tracking never tighter than -0.008em; H1/H2 line-height 1.15; body 1.55+. Only `.stat-number` and `.marquee-text` run line-height 1 (single-line numerals).
- Signature elements per section: form-as-hero (`#start`, no photo, CSS-only atmosphere with a motion-gated light sweep), claret trust band with spec stats, oversized claret marquee ("Qualify on the rent. Not your tax returns.", outline alternates on desktop), dark StatsBand over the aerial photo (0.72 ink + 0.78 duotone overlays, measured 7:1+ cream contrast), Advantages prose pin + rotate-in tilt cards, HowItWorks numbered coins with a drawn SVG connector, FAQ details, brand-deep FinalCta with magnet CTA, ink footer with generated state directory columns.
- Animation map (`src/scripts/motion.ts`, dynamically imported after `window load` + 1200ms, only by LandingPage): TrustBand fade-up, Marquee scrub, Partners scale-up batch, LenderPicks alternating slide L/R + tilt, StatsBand clip-up + counters, Advantages slide-left prose + rotate-in cards + desktop pin, HowItWorks scale-up + data-draw, FAQ fade-up batch, FinalCta clip-up + persist + magnet. The H1 and the form card NEVER animate (LCP + conversion). Lenis/pin/tilt/magnet are desktop-only via `gsap.matchMedia`. Reduced motion bails entirely; reveal states are set FROM JS so a failed load can never hide content.

## The mode switch: `site.mode` in `src/config/site.ts`

One flag, `'network'` (default) vs `'lender'`, branches everything at BUILD time:

| Surface | network | lender |
| --- | --- | --- |
| Notice bar | "Not a lender. {brand} connects investors with independent DSCR lenders." | brand name + NMLS |
| Partners + LenderPicks sections | render (verified entries only in PROD) | hidden entirely |
| Advertiser disclosure | under LenderPicks H2 + footer + Company column link | none anywhere (link removed too) |
| Under-form fine print | "Provided by {legalName}. Not a lender." + Equal Housing Opportunity | legalName + NMLS + housingPhrase |
| Housing mark | always "Equal Housing Opportunity" | "Equal Housing Lender" only when nmls set AND housingMark 'lender' |
| Phone step title | "best number for your lender to reach you?" | "best number to reach you?" |
| TCPA parties | legalName + verified lenders list | legalName only |
| Thank-you | no lender named (unless `routing.lender` set); dark band = "It will come from a number you don't recognize." | specialist card, save-the-number band with `brand.phone`, optional GHL booking iframe |
| HowItWorks steps | participating-lender language | specialist-by-name language |

A network build must contain zero occurrences of the literal string "Equal Housing Lender" (the phrase is assembled from parts in `housingPhrase` so it can never leak into the bundle; the build is grepped for it).

## How to rebrand for a client

Follow the REBRAND CHECKLIST comment at the top of **`src/config/site.ts`**. Everything brandable lives there. In order:

1. `site.mode`, then `brand` (name, legalName, tagline, domain, phone, privacyEmail, nmls, logoText/logoSrc, housingMark), `specialist`, `routing.lender`, `tracking` (gtagId + gtagConversion), `booking.embedUrl`.
2. `legal` strings, `partners`/`lenders` (real entries need `placeholder: false, verified: true`, nmls set; PROD excludes everything else and a section with zero real entries renders nothing), `stats` (flip `confirmed: true` only for figures the client stands behind; fewer than 3 confirmed = 2-up layout).
3. Two images: regenerate `public/images/aerial-dusk.webp` + `duplex-dusk.webp` (+ og.jpg) via fal, drop PNGs in `assets-src/`, run `npm run images`.
4. `LEAD_WEBHOOK_URL`: a **Zapier catch hook, never a GHL inbound webhook**. Set from Git Bash with `printf '%s' 'https://hooks.zapier.com/...' | npx vercel env add LEAD_WEBHOOK_URL production` (PowerShell pipes append CRLF and break the fetch). `/api/lead` reads it at RUNTIME via `process.env`; in PROD a missing webhook returns 500 so leads fail loudly. Send a test lead after every deploy.
5. Legal pages: replace `src/pages/privacy.astro` + `terms.astro` placeholder copy.
6. `astro.config.mjs` `site` must equal `https://{brand.domain}` (canonicals + sitemap come from it). Run `vercel project ls` before `vercel link` (a guessed name silently creates a duplicate project).
7. **LEGAL: PLACEHOLDER DATA warning.** Everything in `partners`/`lenders` ships as samples. PROD builds exclude them automatically and log "WARN: N placeholder lenders excluded", so a lazy rebrand ships empty sections, not fake lenders. No testimonials/reviews exist in this template; add them only with real attributable feedback. Never publish interest rates. `site.year` and `lenderPicksMonth` are BUILD-time: redeploy at the turn of the month/year.

## Directory extension recipe

The whole point of this edition: adding directory content is a data + route job, not a redesign.

- **States**: `src/data/states.ts` (50 + DC already). `/dscr-loans/[state]` generates a page per entry with the state pre-selected in the form (the state step is skipped, 7 steps instead of 8). Add a `blurb` to an entry for unique intro copy; otherwise `site.stateIntroFallback` substitutes `{name}`. `topStates` drives the footer state column. Hub at `/dscr-loans`.
- **Lender picks / partners**: append verified entries to `lenders` / `partners` in site.ts. Ribbons, badges and highlights must be factual attributes supplied by the lender (states served, programs), never outcomes, superlatives, or speed.
- **Nav columns**: `directory.columns` in site.ts carries commented-out Article and Tools column examples. Uncomment them only when the routes exist; `scripts/check-links.mjs` fails the QA run on any footer href with no built file behind it, so dead links cannot ship.
- **Articles / tools later**: add `src/pages/learn/[slug].astro` or `src/pages/tools/*.astro` routes, then the matching directory column. The sitemap and canonicals pick new routes up automatically; the sitemap filter only excludes thank-you/not-yet/404.

## Funnel architecture

LP (`LandingPage.astro`, composed into `index.astro` and every state page) with the form AS the hero -> 8 steps in place (goal -> property type -> credit -> price slider -> conditional money step (purchase: down %; refi: balance with live equity; bridge: rehab) -> state type-ahead -> name+email -> phone + TCPA + submit) -> `/thank-you`. Credit `<620` hard-exits to `/not-yet` (five concrete score moves) and the server silently drops any hand-built sub-620 POST.

- `data-goal` on any element preselects step 1 (works pre-hydration via `dataset.preselect` + a CustomEvent); preselect is ignored once past step 0 so a late click just scrolls. `data-scroll-to="#start"` scrolls to the form (Lenis on desktop, a rAF-driven animated scroll elsewhere; see gotchas).
- Auto-advance 180ms on option pick, height tween between steps, phase pills (Property / Credit / Deal / Contact) with sr-only "Step N of T", back link from step 2.
- Attribution: gclid/utm_* first-touch captured to sessionStorage in Layout.astro, submitted with the lead. `secondsToComplete` for lead-quality scoring. dataLayer events: `funnel_start`, `funnel_step`, `lead_submit`, `thank_you_view`.
- Honeypot `#ff-ref-b` (payload key `website`); bots get a silent 200 AND no Ads conversion fires for them.
- Thank-you personalizes from `sessionStorage['lead-summary']`; the gtag conversion fires only when that key exists (or `?demo=1` for Tag Assistant), never with `?qa=1` (`sessionStorage.qa`), once per tab. Frame is a conversation opener, never results delivery, and never promises an email.
- Payload + consent: **one webhook per lead, no partials** (server 400s an incomplete lead). TCPA is an explicit gated checkbox above submit, unchecked by default, gated client AND server side, shipping the verbatim `tcpaCopy` text (one constant renders next to the box and ships as `tcpaConsentText`, so record and legal text can never desync) plus click-timestamp, URL, mode, parties, and server-stamped IP / user agent / receivedAt. Full field table: `WIRING.md`.
- `payload.firstName` is the FULL typed name (ILD semantics), not the first token. Payload keys are the CRM contract; never rename, append new keys only at the end.

## QA tools (`tools/`, docs in `tools/README.md`)

All read `QA_BASE` (default `http://localhost:4321`) + `CHROME_PATH`, and abort with `no server at QA_BASE` when the served title lacks the brand name (port-squatter guard). Run the dev server with `CI=true` in background shells.

- `step-walk-qa.mjs`: 45 checks; all branches, sub-620 exit, 7-step state-page walk with the Texas chip, full intercepted submits on `/?qa=1` and `/dscr-loans/texas?qa=1`.
- `tcpa-test.mjs`: 27 checks; unchecked blocks with zero POSTs, box above submit DOM + visually, full consent record.
- `gtag-test.mjs`: negative contract when `gtagId` is empty (prints SKIP, exits 0); full conversion gating once a client id is set. The positive cases have NOT run yet on this template; they run automatically on the first client with a real gtagId.
- `scripts/check-links.mjs`: every internal href in dist must resolve to a built file.
- `shoot.mjs`: full sweep, one browser per viewport (desktop 1440x900, mobile 390x844 dsf2 hasTouch, never `isMobile`), asserts `documentElement.clientWidth` on every load, prints the mobile fold report. Full-page captures force `content-visibility: visible` on `.cv-auto` and drop to dsf1 when height would exceed Chrome's 16384px capture limit (see gotchas).
- `overflow-check.mjs`: asserts `scrollWidth <= clientWidth` on all 9 routes at 390 and 320.
- `lh.mjs` / `serve-dist.mjs`: Lighthouse pipeline as above.

Quality gate: minimum three screenshot passes (desktop + mobile + states) before design work is done. This build took three, each finding real defects.

## Performance

**Mobile Lighthouse median 99** (runs 2-4: FCP 1.28s, LCP 2.04s, TBT 9ms, CLS 0.000) on the built output; `/dscr-loans/texas` also 99. **Nothing was cut**: full motion layer, marquee, counters, Lenis, pin all ship as designed. Why it holds: H1 is the LCP and never animates, no hero photo, self-hosted `font-display: optional` fonts with preload, gtag deferred behind a dataLayer stub until `window load`, GSAP/Lenis dynamically imported after load + 1200ms, `.cv-auto` on below-fold sections, Lenis/pin desktop-only by construction. If a rebrand ever dips below 90, the BRIEF section 12 cut order applies (marquee stroke first, counters last). Read the perf gotchas memory file before touching anything in the load path.

## Gotchas learned building this (t4-specific, beyond v1/v2's lists)

- **Native `scrollIntoView({behavior:'smooth'})` dies mid-flight on this page.** As cv-auto sections stream past during the scroll, `contentvisibilityautostatechange` fires a debounced `ScrollTrigger.refresh()` that cancels the native smooth scroll, stranding the user ~200px short of `#start` on every non-Lenis device (all mobile). motion.ts now uses a rAF-driven `animateScrollTo()` that re-reads the target position every frame; do not "simplify" it back.
- **A pin needs its `data-pin-end` marker in the DOM, not just in motion.ts.** The Advantages pin was silently dead because the component never rendered the end-trigger attribute; motion.ts bailed without error. If a future design restores a 2x2 card grid, the runtime 320px travel guard disables the pin again by design.
- **Chrome full-page screenshots lie twice.** Captures taller than 16384 device px tile/repeat the page inside one PNG, and `.cv-auto` sections capture blank when offscreen. shoot.mjs compensates (forces content-visibility visible, drops dsf); judge cv-auto sections from in-viewport shots if using any other capture tool.
- **`-webkit-text-stroke: 1px currentColor` + `color: transparent` = invisible text.** The stroke resolves against the transparent color. Stroke with an explicit token (`var(--color-brand)`).
- **One id per page for `advertiser-disclosure`.** LenderPicks owns the anchor when it renders; `Footer.astro` takes `disclosureAnchor={false}` in that case (computed in LandingPage from the same visibility condition, PROD gating included).
- **Footer/Topbar `#start`/`#faq` config links only work on landing pages.** `resolveHref()` in Footer and the Topbar CTA rewrite them to `/#start` (no `data-scroll-to`) on privacy/terms/thank-you/not-yet/404/hub, else they are dead anchors.
- **`Array.from` on a plain object returns `[]`.** The gtag-test dataLayer recorder silently dropped GTM-style object pushes (`{event: 'thank_you_view'}`) and reported them missing. Wrap non-array-likes as `[it]`.
- **Photo-under-overlay opacity needs a measurement, not a vibe.** The StatsBand aerial vanished (gutter luminance 0.004) under 0.84 ink + 0.9 duotone; 0.72/0.78 keeps texture visible AND 7:1+ cream contrast. Measure on a screenshot when changing either value.
- **11-digit phone input**: after stripping a leading 1, extra digits now unformat the field to raw digits and fail the 10-digit gate honestly instead of silently truncating into a fabricated callback number.
- Stale Vite dep cache after `npm install`/astro.config changes leaves the island dead in dev only (`jsxDEV is not a function`): delete `node_modules/.vite` and `.astro`.
- `pageshow` with `persisted` (bfcache back-nav) must reset the submitting state or the button sticks on "Checking your eligibility…".

## Deploy

Vercel, root = this folder, framework preset Astro. `vercel project ls` first, then link. Set `LEAD_WEBHOOK_URL` (printf recipe above), redeploy, send a test lead, confirm it lands in the Zap/CRM before sending traffic. Confirm the Lighthouse number on PSI after first deploy.

## Known open items (deliberate, from the build)

- Fallback-font metric overrides (Bricolage 106/94/24, Manrope 101/100/27) are untuned estimates; tune with the web-font-blocked overlay comparison if fold shift ever shows up.
- Mobile phase pills wrap 3+1 at 390 (accepted: readability floor beats a one-line fit).
- Bare-PROD builds (zero verified partners/lenders) jump Marquee -> StatsBand with no visual bridge; revisit only if a client launches with no lender entries.
- `SUBMIT_FAILED` error string is an island-local literal; move to `form.errors.submit` in site.ts if config purity matters on a rebrand.
- gtag positive test cases unexercised until the first client sets `tracking.gtagId`.

## Lessons Learned

- **[2026-09-01] A reported fix is not a landed fix:** a lane's return summary claimed a scoped marquee patch that did not exist in the file, shipping invisible outline text until integration re-verified. Verify subagent-reported edits against the actual file before building on them.
- **[2026-09-01] Screenshot tooling must be proven before its output is trusted:** two capture artifacts (16384px tiling, blank cv-auto sections) burned a QA pass on phantom and hidden defects. Now baked into shoot.mjs; assert the rig before judging the page.
- **[2026-09-01] Numbered eyebrows need a page-order check:** two lanes independently shipped "01" and "02" sections that rendered in reverse page order. Any numbered-label system needs one cross-lane ordering pass at integration.
- **[2026-09-01] Motion features fail silently:** the dead Advantages pin and the derailed mobile scroll both shipped through two passes because nothing errored. Probe motion behavior (positions, travel, landing offsets) explicitly; do not assume a wired-looking feature runs.

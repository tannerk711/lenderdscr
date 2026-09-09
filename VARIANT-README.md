# Internet Loans Direct, split-test variant B (`b-t4-v1`)

Branch `split/b-t4-v1`, worktree `clients/Internet-Loans-Direct-variants/b/`. Binding
contract: `../BRIEF.md`. Template docs for the underlying codebase: `TEMPLATE-CLAUDE.md`,
`TEMPLATE-BRIEF.md`, `TEMPLATE-WIRING.md` (DSCR funnel template 4). The root `CLAUDE.md` is
the ILD main-site doc carried over by the worktree; this file is the variant's own doc.

## What this variant is

DSCR funnel template 4 (the claret/amber "Civic ledger" landing page with the full
scroll layer: Lenis on desktop, entrance reveals, count-up stats band, Advantages pin,
tilt/magnet, persistent final CTA) rebranded for Paul Howarth's Internet Loans Direct,
Texas only, in lender mode. The hero card is a STATIC step-1 tile group (Buy a rental /
Refinance / Fix & Flip/Hold) that links to `/start?goal=purchase|refinance|bridge`. The
form itself (`/start`, stage 2) is the V1 LeaderOne-style eight-step form (cream, Fraunces
serif, gold gradient CTAs), and the thank-you page (stage 3) is a LeaderOne clone. Every
claim on the page is one of ILD's published claims (BRIEF section 2); no NMLS exists and
none is invented; Paul is named on the thank-you page only.

## Run it locally

```
cd clients/Internet-Loans-Direct-variants/b
npm install
CI=true npm run dev -- --port 4332        # background shells need CI=true
```

Open `http://localhost:4332/`, `/start`, `/thank-you`, `/test-leads` (stage 2), `/not-yet`,
`/privacy`, `/legal`. Verify the served `<title>` contains "Internet Loans Direct" before
trusting a screenshot (another project auto-respawns on 4321; never use that port).

Build and static server for Lighthouse: `npm run build`, then `LH_PORT=4342 node
tools/serve-dist.mjs` (gzip, like Vercel) or `npm run lh` for the full mobile gate.

Kill the dev server when done (PowerShell):
`Get-NetTCPConnection -LocalPort 4332 -State Listen | % { Stop-Process -Id $_.OwningProcess -Force }`

## LIVE since 2026-09-09 (the split test)

`leadDelivery = 'live'` in `src/config/site.ts`: `/api/lead` forwards to `LEAD_WEBHOOK_URL`
(the `lenderdscr` project's PREVIEW scope, the same Zapier catch hook as the live funnel)
and Layout renders the deferred gtag. `seo.noindexSite = true` keeps every page
noindex,nofollow regardless (a paid-traffic challenger on a subdomain is never indexed).

- Branch `split/b-t4-v1` is pushed; every push deploys a preview on the SAME `lenderdscr`
  Vercel project. Domain `go.lenderdscr.com` is assigned to this branch (DNS: CNAME `go` ->
  `cname.vercel-dns.com`, Paul's GoDaddy). The .vercel.app preview URL is behind Vercel
  Authentication; the custom domain is not.
- Ads: 7 PAUSED "-b" duplicate RSAs in DSCR - TX point at `https://go.lenderdscr.com/`
  (`google-ads/clients/paul-howarth/split_b_ads.py`); Tanner enables them once DNS resolves.
- Live QA: `$env:QA_LEAD_MODE='live'; node tools/form-walk.mjs` against a dev server started
  with `LEAD_WEBHOOK_URL=http://localhost:4399/hook` (the walker hosts that hook);
  `node tools/gtag-live-check.mjs`; `QA_BASE=https://go.lenderdscr.com node
  tools/prod-submit-qa.mjs` for the real-browser prod submit (posts a "TEST ProdQA DeleteMe"
  lead with ?qa=1, conversion suppressed; delete it in GHL). Record: QA-REPORT.md Edit 6.

## Test mode (the pre-launch state) and the one-line flip

`src/config/site.ts` exports `leadDelivery: 'test' | 'live'` (now `'live'`) and
`variant = 'b-t4-v1'`. While `leadDelivery === 'test'`:

- `/api/lead` runs every gate (honeypot silent 200, `credit === '<620'` silent 200,
  `tcpaConsent !== true` returns 400, incomplete lead returns 400, server stamps
  `tcpaConsentIp` / `tcpaConsentUserAgent` / `tcpaConsentReceivedAt`), then logs
  `[lead][TEST MODE] would forward: {...}` and returns
  `{ ok: true, forwarded: false, testMode: true }`. It never reads or calls a webhook.
- `Layout.astro` renders NO gtag (no stub, no loader, no googletagmanager script) and
  `<meta name="robots" content="noindex, nofollow">` on every page.
- `thank-you.astro` keeps the gated conversion code but it is additionally guarded by
  `leadDelivery === 'live'`, so nothing can fire.
- Stage 2 adds: the form pushes each accepted payload into
  `localStorage['ild_variant_test_leads']`, logs `[variant TEST LEAD]`, and `/test-leads`
  lists them with a Clear button.
- Proof: `grep -ri "zapier\|googletagmanager" dist/client` finds nothing (checked at stage 1).

To go live: set `leadDelivery = 'live'` in `src/config/site.ts`, set `LEAD_WEBHOOK_URL`
on the Vercel project (Zapier catch hook, never a GHL inbound webhook; from Git Bash:
`printf '%s' 'https://hooks.zapier.com/...' | npx vercel env add LEAD_WEBHOOK_URL production`),
redeploy, send one test lead on `/?qa=1`. Live mode restores the template's deferred
gtag (`AW-16956033989`, conversion `AW-16956033989/cwbHCNCflbAaEMWXopU_`).

## Payload keys (BRIEF section 5, in this order; stage 2 ships them)

```
goal, goalLabel, stage, stageLabel, propertyType, propertyTypeLabel, credit,
price, priceDisplay, downPct, downPctDisplay, downPayment, downPaymentDisplay,
balance, balanceDisplay, equity, equityDisplay, rehab, rehabDisplay, scenarioDetail,
city (''), state ('Texas'), firstName, lastName, email, phone,
partial (false),
tcpaConsent (true), tcpaConsentText (verbatim ILD tcpaCopy), tcpaConsentAt, tcpaConsentUrl,
gclid, utm_source, utm_medium, utm_campaign, utm_term, utm_content (only when present),
landingPage, secondsToComplete, website (''), submittedAt,
variant ('b-t4-v1'), source ('ild-split-test')
```

Server adds `tcpaConsentIp`, `tcpaConsentUserAgent`, `tcpaConsentReceivedAt`.
`sessionStorage['lead-summary']` (read by `/thank-you`):
`{ firstName, goal, goalLabel, propertyType, propertyTypeLabel, credit, price, priceDisplay, state: 'Texas' }`.

## Stage log

### Stage 1 (LP + config + plumbing), 2026-09-07

- `src/config/site.ts` rewritten for ILD: lender mode, brand facts, Paul as specialist,
  tracking ids, `partners: []`, `lenders: []`, confirmed stats only (620 / 0 tax returns /
  100+ lenders), `leadDelivery`, `variant`, `fixedState`, ILD `tcpaCopy` verbatim, Paul's
  lead-generator disclaimer as `legal.disclaimer`, ILD's five FAQs plus the credit-pull
  and cost entries, option sets per BRIEF section 4, form titles/phases for stage 2.
- `HeroForm.astro`: static step-1 tiles (t4 `.opt-card` anchors, goal icons, phase pills
  Goal / Details / Contact, progress track at 1/8), `#start` id kept. No React island on
  the LP any more; `EligibilityForm.tsx` deleted (git history has it).
- Cut: Marquee section (+ its CSS), `/dscr-loans` hub, `[state].astro`, `state-blurbs.ts`,
  footer state column, `terms.astro`, duplex/aerial-dusk images. `states.ts` untouched.
- Topbar: ILD logo on paper + wordmark (>= 480px) + tagline (>= 768px), the three program
  words (>= 1024px), phone, CTA to `/start`. Notice bar: "Not affiliated with or endorsed
  by any government agency."
- Footer: logo in a white chip, Company column (Check eligibility, Questions, Privacy,
  Legal, Do Not Sell), Paul's disclaimer verbatim with the NMLS Consumer Access link.
- Images: `assets-src/` holds ILD's `hero-property.png` + `aerial-golden.png`;
  `npm run images` writes `ild-aerial-golden.webp` (StatsBand), `ild-hero-property.webp`
  (HowItWorks figure), `og.jpg`, and `src/data/lqip.ts` (+ `imageDims`).
- Legal: `/privacy` = ILD copy + a "Do Not Sell or Share" section (anchor `#do-not-sell`);
  `/legal` = ILD disclosures. `astro.config.mjs`: `site: 'https://lenderdscr.com'` + ILD's
  five redirects. `robots.txt` sitemap domain updated.
- Test-mode plumbing: Layout gating + noindex,nofollow; `/api/lead` test branch;
  thank-you conversion guard.
- `/start` is a stage-1 PLACEHOLDER (noindex) so every tile/CTA resolves and
  `scripts/check-links.mjs` passes; it highlights the `?goal=` preselect. Stage 2 replaces
  it wholesale.
- Every LP CTA (topbar, trust strip, advantages, how-it-works, final, sticky, footer)
  links straight to `/start`.
- Say-it-once sweep (page-level): hero sub owns "rent qualifies, not tax returns";
  TrustBand owns same-day approval / 15 to 25 days / LLC closings; StatsBand owns the
  three numbers; Topbar owns the program words; Advantages prose owns the DSCR
  explainer and its cards carry four outcomes stated nowhere else; HowItWorks owns the
  contact promise (step 2 never names Paul); FinalCta owns "about a minute". FAQ 1's
  closing stat line was trimmed.
- Tools: `tools/qa-lib.mjs` default `QA_BASE` 4332, `serve-dist.mjs` default 4342,
  `shoot.mjs` rewritten for this route set (`--sections` shoots every LP section
  in-viewport), `overflow-check.mjs` routes updated, `lh.mjs` audits `/` x4 + `/start` +
  `/thank-you`. `step-walk-qa.mjs`, `tcpa-test.mjs`, `gtag-test.mjs` still target the
  t4 island DOM contract and need the stage 2/QA rewrite.
- Stage 1 checks: `npm run build` clean (no placeholder warnings), `check-links` PASS
  (7 html files, 100 hrefs), zero zapier/googletagmanager strings in `dist/client`, no em
  dashes under src/public/tools/scripts, mobile fold at 390x844: H1 bottom 250px, third
  tile bottom 622px, form card bottom 639px.

### Stage 2 (form), 2026-09-07

- `/start` is now the V1 (LeaderOne-style) eight-step form, full page: cream `#F6F3EC`
  ground, Fraunces headlines (self-hosted `standard` woff2 in `public/fonts/`, `font-display:
  optional`, `opsz 72`; the unused `fraunces-latin-full-normal.woff2` was dropped), gold
  gradient CTAs, "Step n of 8" + percent progress bar, no wordmark inside the form, a slim
  ILD topbar (logo + `Call (855) 545-2022`) above it, and a one-line footer (Privacy, Legal,
  Equal Housing Opportunity, copyright). Body face is the brand sans (Manrope).
- Files: `src/lib/flow.ts` (flow spec + `buildPayload()` + `buildLeadSummary()` + test-lead
  storage; option VALUES come from `site.ts`, wording from `site.ts` `form` and
  `_ref/form-templates/flow.ts`), `src/components/start/{FormV1,steps,ui,LeadInspector}.tsx`,
  `src/styles/start.css` (page-scoped, unlayered like the V1 original), `src/pages/start.astro`,
  `src/pages/test-leads.astro`. `Layout.astro` takes `preloadFonts` so `/start` preloads
  Fraunces + Manrope instead of Bricolage + Manrope. The stage-1 `/start` placeholder is gone.
- Steps (BRIEF section 4): goal (Buy a rental / Refinance / Fix & Flip/Hold, `?goal=` preselect
  opens on step 2 and Back returns to a highlighted step 1) > process (per path) > property
  (7) > credit (4, micro labels; Below 620 = in-form kick-out with a gold link to `/not-yet`
  and an "I picked the wrong range" undo, nothing recorded, never posted) > price slider
  ($100K to $3M+, $50K steps, default $300K) > fork (buy: down slider 20% to 50%+ with the
  exact live dollar line; refi: balance options; flip: rehab options) > first/last/email >
  phone + ONE gated TCPA box (ILD `tcpaCopy` verbatim, unchecked, click-stamped) + submit
  (`Check My DSCR Eligibility`, V1's own label). Auto-advance 250ms after the selected
  state shows. Enter on the two typed steps is guarded (nav lock + 350ms mount guard) so a
  held key advances once. `submit()` re-validates name, email, 10-digit phone and consent
  itself; a failed POST shows `form.errors.submit` inline and the button re-enables for a
  retry.
- Payload: exactly the section-5 keys in order (attribution keys only when present), then
  `variant: 'b-t4-v1'`, `source: 'ild-split-test'`. Price ships the number or the string
  `'3000000+'` (`priceDisplay` `$3,000,000+`); buy ships `downPct` / `downPctDisplay` /
  `downPayment` (`round(pct/100 * price)`, null at $3M+) / `downPaymentDisplay`; refi ships
  `balanceDisplay` = option text with `balance` / `equity` / `equityDisplay` null; flip ships
  `rehabDisplay` with `rehab` null; `scenarioDetail` = one human line. `stage` is the kebab
  slug of the option text, `stageLabel` the text.
- Test mode: on a 200 the payload goes to `localStorage['ild_variant_test_leads']` +
  `console.log('[variant TEST LEAD]', payload)`, `sessionStorage['lead-summary']` is set,
  then `window.location.href = '/thank-you'`. `/test-leads` (noindex, not in the sitemap)
  lists the captured leads newest first as pretty JSON in the brand sans, with Clear.
- Verified with `tools/form-walk.mjs` (puppeteer, real dev server, both viewports): 218/218
  checks; every request during every walk stayed on localhost; `/api/lead` answered
  `{ok:true, forwarded:false, testMode:true}`; payload keys match section 5 in order for
  buy, refi and flip; unchecked consent = zero POSTs; kick-out = zero POSTs; 500 then retry
  lands on `/thank-you`. Screenshot passes on every step at 1440x900 and 390x844 fixed two
  defects: the buy-fork dollar line rounded to $1,000 while the payload shipped the exact
  figure (now exact, `$87,500` both places), and the LP topbar program-word separators
  hugged the previous word (`margin-inline` on the dot). `overflow-check` OK at 390 and
  320 on all nine routes. Mobile fold at 390x844: step 1 shows the question and all three
  options (third card bottom ~645px).
- Left as is for later stages: the interim template thank-you page (stage 3 replaces it with
  the LeaderOne clone); `tools/step-walk-qa.mjs` / `tcpa-test.mjs` / `gtag-test.mjs` still
  assert template 4's contract (form-walk covers their ground; the QA stage decides);
  Lighthouse (perf stage). The `/start` JS is React + framer-motion + lucide (about 107 KB gz
  total); if the perf stage finds `/start` under 90 on mobile, swapping framer-motion for the
  CSS step transitions already in `global.css` is the first cut.

### Stage 3 (thank-you), 2026-09-07

- `/thank-you` is now the LeaderOne clone (BRIEF section 6): `src/pages/thank-you.astro` +
  `src/styles/thank-you.css` (page-scoped, unlayered, imported by that page only, like
  `start.css`). The LO palette (paper `#f8f6f1`, paper-2 `#efece3`, ink `#112647`, pine
  `#1e4a8c`, moss `#2c5a9e` for eyebrows, brass `#b0873a` / `#d7b264`, cream `#edf1f9`) lives
  as CSS variables on the `.lo` wrapper, so the LP keeps template 4's claret/amber identity.
  Faces: Fraunces (self-hosted standard woff2, `opsz 72`, weight 400, italic for the H1's
  "the DSCR floor.") and Hanken Grotesk 400/500/600/700 (self-hosted, `font-display:
  optional`, declared in `thank-you.css`). `/thank-you` preloads Fraunces normal + italic and
  Hanken 400/600/700 through `Layout` `preloadFonts`.
- Top to bottom, mirroring `_ref/leaderone/thank-you.astro`: white topbar (ILD logo + the name
  in LO's NMLS slot, "Texas DSCR loans" tag with the brass dot on >= 768px, phone; 52px bar +
  32px logo on phones, 64px + 36px from 768px, per LO's reference PNGs), 6px brass gradient
  hairline (LO's `h-1.5`) at the top of the paper hero, 80px brass seal (ring draws on over
  1.1s after 0.2s, pine check over 0.7s after 1s, CSS keyframes, no GSAP on this page; reduced
  motion renders it complete; the dash state lives in CSS so a page without the sheet shows
  the finished seal), eyebrow "Eligibility check received", serif H1 `Nice work{, First}.
  Your credit clears` + italic pine `the DSCR floor.` (the H1 never animates), the verbatim
  promise paragraph (Paul or Mike, the phone as a tel link, "Save the number so you know it's
  them."), scenario chips; paper-2 band with hairlines: "While you wait" / "Three things
  worth doing right now." / the three cards with brass serif numerals (Watch for the text /
  Have your numbers handy / Keep shopping deals, BRIEF copy verbatim) / ONE centered Paul
  card (pine "P", Paul Howarth, DSCR Loan Specialist, no NMLS line) / "Rather not wait?" +
  the big serif phone link; then the variant's ILD footer (Paul's disclaimer). noindex.
- Two deliberate deltas from LO: the mono eyebrows/labels render in Hanken 600 uppercase
  tracked 0.2em / 0.18em (no monospace rule), and display tracking is -0.008em (BRIEF
  section 8 floor) instead of Tailwind's `tracking-tight`.
- Personalization: an inline script right after the hero (runs while the document parses,
  ahead of first paint) reads `sessionStorage['lead-summary']`, sets `#ty-name` to
  `Nice work, {first token}` and fills `#ty-chips` with `.lo-chip` spans: goal label,
  property label, Texas, priceDisplay, `Credit {band label}` (values map to labels through
  `goals` / `propertyTypes` / `creditBands` from `site.ts`, so `680-739` reads "Credit 680 to
  739" and a summary carrying only values still reads well). No summary = "Nice work. Your
  credit clears the DSCR floor." and the chip row collapses (`:empty`).
- Test mode: no gtag, no dataLayer, no conversion. The live-mode conversion script is the
  first script on the page and is LO's gating (lead-summary or `?demo=1`, suppressed by
  `sessionStorage.qa`, once per tab via `conv_fired`) plus the `leadDelivery === 'live'`
  guard: with `live` false it returns before touching anything.
- `/not-yet` kept on template 4's design with ILD-safe copy (620 line, five score moves, "Run
  it again" -> `/start`, no NMLS, no rate); the in-form Below 620 kick-out's gold link
  `[data-action="not-yet"]` points at `/not-yet` and lands there (re-verified this stage).
- Verified with `tools/thank-you-shoot.mjs` (real dev server, desktop 1440x900, mobile
  390x844, plus a 1200-wide capture that lines up with `lo-thankyou-desktop.png`): 86/86
  checks (title, noindex, zero gtag/googletagmanager, every request on localhost, the
  personalized H1, the five chips in order, Fraunces + Hanken resolved, italic pine em,
  no monospace, LO paper/paper-2 backgrounds, seal finished, no overflow, default state,
  reduced motion, /not-yet, kick-out link, zero console errors). A rect diff of every LO
  spacing interval (py-20/24, mb-8, mb-5, mt-5, mt-7, mb-4, mb-14, p-7, mt-14, mt-10, mb-3,
  max-w-xl / max-w-md) matched within 1px at both viewports. Shots: `tools/shots/
  {desktop,mobile,lo}-thank-you-{fold,full,default}.png`, `*-not-yet-full.png`, `*-kickout.png`.
- Tool updates: `tools/qa-lib.mjs` `seedLeadSummary()` now returns the BRIEF section 5
  shape (`goalLabel` "Buy a rental", `propertyTypeLabel` "Single-family", `credit`
  `680-739`, no `stateSlug` / `mode`); `tools/form-walk.mjs` counts `#ty-chips .lo-chip`.
- Not on this branch: `/call-prep` (BRIEF section 6 says "keep available"; stage 1 never
  carried it over, the LO clone has no prep-sheet link, and ILD's version was the target of
  the summary email ILD cannot send). Port `_ref/ild-main/call-prep.astro` onto template 4's
  tokens if Tanner wants it.

### Stage 2 re-verification (form), 2026-09-08

The workflow re-ran the stage 2 brief against the branch, which already carried the
form (c8c3df6) and the thank-you page (1d7f87c). Nothing was rebuilt; the form was
re-read against BRIEF sections 3, 4, 5 and 10 and walked again in a real browser.

- Contract read: eight steps and three paths per section 4 (goal, process per path,
  seven property types, credit with the in-form Below 620 kick-out, price slider $100K
  to $3M+, buy down slider / refi balance options / flip rehab options, first + last +
  email, phone + ONE gated TCPA box), no state step, no phone-step subtitle, "Step n of
  8", `?goal=` preselect opening on step 2, ~250 ms auto-advance, Enter guard on the
  typed steps, `submit()` re-validation, V1's own submit label, inline error + retry,
  navigation to `/thank-you`, hidden `website` honeypot, first-touch attribution on both
  the LP and `/start` (Layout head script), `?qa=1`, `secondsToComplete`. Payload keys
  in `src/lib/flow.ts` `buildPayload()` are section 5 verbatim, in order, then `variant`
  + `source`; `tcpaConsentText` is the ILD `tcpaCopy` constant (one source, rendered
  next to the box and shipped). Test mode per section 3: `localStorage`
  `ild_variant_test_leads`, `[variant TEST LEAD]` log, `sessionStorage['lead-summary']`,
  `/test-leads` inspector (noindex, filtered out of the sitemap). No `EligibilityForm`
  import survives; no Playfair, no Google Fonts link, no dscrbroker `PHONE_SUB` or
  `CONSENT_TEXT`.
- Pass 1, `tools/form-walk.mjs` on the dev server (desktop 1440x900 dsf 1, mobile
  390x844 dsf 2 + touch): 268/268. Captured `/api/lead` bodies for buy (desktop with
  gclid + utm, mobile bare), refi ($3M+ edge, balance option) and flip (rehab option)
  were diffed key by key against section 5: 40 keys with attribution, 37 without, order
  exact, none missing. Response `{ok:true, forwarded:false, testMode:true}` every time;
  every request on localhost; unchecked consent and the kick-out produce zero POSTs; a
  500 shows the inline error and the retry lands on `/thank-you`; the double Enter on
  the contact step advances once; hand-built POSTs hit every server gate. Payloads are
  in `tools/shots/walk-payload-<viewport>-<path>.json`.
- Pass 2 (edges the walk skips): 320 px wide, step 1 / property grid / phone step have
  no horizontal overflow and every interactive target is 44 px or taller; keyboard Tab
  reaches the first card with the gold ring and Enter selects it; the $3M+ buy path
  shows "$3M+", "About $750,000 or more", chips `Buy a rental | 10 to 15 units | Texas |
  $3M+`, ships `price '3000000+'`, `downPct 25`, `downPayment null`, `scenarioDetail
  '25% down'`, and the lead-summary carries the same price; `prefers-reduced-motion:
  reduce` still advances and mounts steps at full opacity. 19/19.
- Pass 3 after the one defect found by reading the shots: the V1 source's
  `.v1lo-root :focus-visible { border-radius: 6px }` reshaped a 14 px card the moment it
  took keyboard focus (corners visibly tightened in the focus shot). The radius is gone
  from the generic focus rule (the outline now follows each element's own radius) and
  the radius-less Back text button carries `rounded-[6px]` itself. Re-checked at both
  viewports: card 14 px, Continue 14 px, Back 6 px, all with the 2 px gold ring. 8/8.
- Read and cleared: the "50%+" slider cap label looked two-toned in the desktop shot;
  a 6x crop shows it is subpixel antialiasing of the thin "+" at 11 px (clean at dsf 2),
  not a color split. `overflow-check` OK on all nine routes at 390 and 320; `check-links`
  PASS (8 html files, 107 hrefs); `dist/client` carries no zapier / googletagmanager
  string; no em dash anywhere in the tree.
- Folded into this commit (found uncommitted in the worktree from the interrupted QA
  stage, reviewed line by line, all in-contract): hover styles behind `@media (hover:
  hover)` in `start.css` (sticky touch hover painted a second gold border after Back),
  label alphas raised for AA on the LP topbar tagline and the thank-you page's small
  labels, `tools/form-walk.mjs` gained the back-navigation, mobile-fold and hand-built
  POST walks, `tools/shoot.mjs` gained the 404 + open-FAQ shots, and the three
  template-4 island scripts (`step-walk-qa`, `tcpa-test`, `gtag-test`) were retired in
  favor of `npm run qa` (`form-walk` + `thank-you-shoot` + `overflow-check` +
  `check-links`).
- Deliberate delta from the BRIEF's font note: Fraunces is served from `public/fonts/`
  with `font-display: optional` (the fontsource CSS ships `swap`, which repaints the
  headline late and moves LCP; memory `reference_astro_perf_pagespeed_gotchas`). Same
  files, same axes, no Google Fonts request.

### Stage 3 re-verification (thank-you), 2026-09-08

The workflow re-issued stage 3 against a branch that already carried the LeaderOne clone
(1d7f87c). Nothing was rebuilt; the page was compared against the reference PNGs in a
real browser and the defects that reading the shots surfaced were fixed.

- Side by side (`tools/thank-you-compare.mjs`, `tools/shots/compare-{desktop,mobile}.png`,
  LO's PNGs left, ours right, same 1200 / 390 scales, plus native-scale crops of the hero
  and the band): topbar (white, logo left, tag + phone right, 64 / 52 px), 6 px brass
  hairline, 80 px seal, eyebrow, serif H1 with the italic pine tail, four-line lede,
  paper-2 band with hairlines, three numeral cards (radius 16, padding 28, brass 2.2rem
  numerals, 18 px serif h3, 14 px copy), ONE centered human card, "Rather not wait?" and
  the big serif phone all sit at LO's positions within a pixel; type sizes match (H1 54 /
  35.2 px, H2 36 / 28.8, lede 18, phone 41.6 / 28.8, eyebrow 11.5). Ours runs taller only
  by the chip row (LO's shot had no summary) and the ILD footer. Palette byte-identical
  (paper `#f8f6f1`, paper-2 `#efece3`, pine em `rgb(30,74,140)`).
- Fixed from the shots: (1) with a first name in the H1 the mobile wrap split the italic
  tail ("the" alone at the end of line two); `.lo-h1 em` is now `white-space: nowrap`, and
  the tail stays whole at 390 and 320 with a short, a long (Christopher) and no name, zero
  overflow; (2) `/not-yet` on a phone broke "(855) 545-2022" across two lines in the
  "Questions in the meantime?" line; the tel link is `whitespace-nowrap`.
- Suite: `tools/thank-you-shoot.mjs` 86/86 at desktop, mobile and the 1200-wide LO
  viewport (title, noindex,nofollow, zero gtag / dataLayer, every request on localhost,
  personalized H1, five chips in order, defaults without a summary, reduced motion, seal
  drawn, `/not-yet` ILD-safe with "Run it again" -> `/start`, the kick-out's gold link
  lands on `/not-yet`, zero console errors). `overflow-check` OK on all nine routes at
  390 and 320; `check-links` PASS (8 html, 107 hrefs); `dist/client` has no zapier /
  googletagmanager string.
- Font finding (new, worth reading before the perf stage): `document.fonts.check` said
  "loaded" while the page painted in Georgia / Segoe. Every first-paint face is
  `font-display: optional` (BRIEF section 8), so a face that is not ready at first
  layout is dropped for the page's lifetime, and on `/thank-you` two faces are cold
  even on the funnel path (`/start` warms the Fraunces roman only). New
  `tools/thank-you-cold-fonts.mjs` measures what actually paints. What moved the rate:
  fewer and smaller preloaded files. `scripts/instance-fonts.py` (fontTools) now
  instances the fontsource files: roman opsz pinned at 72 with wght kept (67 -> 37 KB),
  italic static 400 (81 -> 23 KB), and Hanken is ONE variable file wght 400..700
  (`@fontsource-variable/hanken-grotesk` added as a dependency, 23 KB) replacing the four
  static weights (500 was declared and never used). `/thank-you` preloads exactly those
  three, Hanken first (the lede and cards paint biggest), and the topbar logo lost its
  `fetchpriority="high"` (this page's LCP is text). Measured on the built output over the
  gzip server, machine idle, 8 fresh contexts per regime: funnel path roman 8/8, italic
  4/8, Hanken 5/8; direct cold hit roman 8/8, italic 6/8, Hanken 8/8. Tried and reverted:
  declaring the faces earlier (no change), inlining the two cold faces as data URIs in
  the page sheet (Chrome loads `data:` faces asynchronously too, the rate got worse and
  the sheet grew 62 KB), immutable vs must-revalidate on the local `/fonts/` (no
  difference). The remaining miss rate is the `optional` doctrine's cost and the
  fallback stack is Georgia / Segoe UI; the two untested ways to make the funnel path
  deterministic are a `vercel.json` immutable header on `/fonts/` plus a `rel=prefetch`
  of the two cold files on `/start` (Vercel serves `public/` with `max-age=0,
  must-revalidate`, so today every navigation revalidates the woff2 and even the roman
  is one RTT from missing), or `font-display: fallback` with metric-matched fallbacks on
  the two cold faces. Both touch the 90+ gate, so they are the perf stage's call.
- Topbar: this page keeps its own LO-style white bar (ILD logo + name in LO's NMLS slot,
  "Texas DSCR loans" tag, phone) rather than the LP's claret notice-bar Topbar. The BRIEF
  says "the variant's own Topbar (ILD logo + phone)"; the LP bar carries a "Check My
  Eligibility" CTA the visitor just completed and the notice bar, and Tanner's brief for
  this page is "almost exactly like the LeaderOne thank-you page". `/start` uses the same
  slim treatment, so the sequence reads LP -> slim cream bar -> slim white bar.
- Tools: `thank-you-compare.mjs`, `thank-you-cold-fonts.mjs`, `serve-dist.mjs`
  `FONT_CACHE=immutable` knob, `scripts/instance-fonts.py`. `fonttools` + `brotli` were
  installed with `pip install --user` on this machine.
- Still not on this branch: `/call-prep` (see the stage 3 note above).

### QA: pending (`QA-REPORT.md`)

# QA Report, Variant B (b-t4-v1)

Date: 2026-09-08

## Build
`npm run build`: success, zero warnings, zero errors.

## Dev server
`CI=true npx astro dev --port 4332`: answered 200 on `http://localhost:4332/`.
Title: `Check Your 2026 Texas DSCR Loan Eligibility | Internet Loans Direct`.

## Checks (a-g)

a. POST /api/lead exact response on buy path: PASS. `{"ok":true,"forwarded":false,"testMode":true}` confirmed on desktop and mobile buy walks, plus the hand-built complete-lead POST.

b. Payload keys match BRIEF section 5: PASS. `payload-diff.mjs` reports CLEAN on all 6 captured payloads (desktop/mobile x buy/refi/flip), correct order, `variant: 'b-t4-v1'` and `source: 'ild-split-test'` last. No missing, renamed, or extra keys.

c. Zero foreign-host requests: PASS. Every walk scenario (buy, refi, flip, kick-out, failed-POST retry, back-nav, both viewports) asserted "every request stayed on localhost" and "no zapier / googletagmanager / google-analytics request". `grep -ril "zapier" dist/` and `grep -ril "googletagmanager" dist/` both returned zero matches.

d. /thank-you personalized: PASS. H1 reads "Nice work, Tanner. Your credit clears the DSCR floor." (walker used a Quinn fixture: "Nice work, Quinn"), 5 recap chips rendered on both viewports.

e. /test-leads lists submitted lead: PASS. Confirmed on desktop and mobile buy walks ("1" lead listed after submit).

f. Kick-out path (credit Below 620): PASS. In-form kick-out mounts at Step 4 of 8, zero POSTs, links to /not-yet, "I picked the wrong range" returns to credit step with nothing selected.

g. TCPA hand-built POST without consent: PASS. `tcpaConsent` false, absent, or string `"true"` all return 400 `{"ok":false,"error":"consent required"}`.

## Additional walker coverage (bonus, all passed)
- Honeypot filled and credit <620 hand-built POSTs: silent 200 without testMode.
- Missing phone / bad email: 400 incomplete lead.
- Malformed JSON: 400.
- Double-Enter guard on contact step: advances exactly once.
- Back navigation from every step 2-8: picks stay highlighted, slider/typed values retained.
- Failed-POST retry: inline error shown, retry succeeds, lands on /thank-you.
- `?goal=` preselect + Back-to-step-1 highlight.
- 268/268 checks passed in `form-walk.mjs`.

## Screenshots read (6 of 6 allotted)
1. `tools/shots/walk-desktop-01-goal.png`, buy step 1 desktop: clean.
2. `tools/shots/walk-mobile-08-phone-consented.png`, buy final step mobile: clean, TCPA copy fully legible, no overflow.
3. `tools/shots/desktop-thank-you-full.png`: clean, chips render, no overflow.
4. `tools/shots/mobile-thank-you-full.png`: clean, chips render, no overflow.
5. `tools/shots/mobile-kickout.png`, /not-yet path (Below 620 in-form screen) mobile: clean, no overflow.
6. `tools/shots/mobile-home-fold.png`, LP mobile fold: clean, no overflow.

No overflow, clipped/invisible text, broken images, or blocking layout bugs found in any of the 6. Cosmetic-only observations, if any, were not treated as defects per instructions.

## Defects found and fixed
None. All checks a-g passed on first run; no screenshot defects found. No code changes made, no commit needed beyond this report.

## Commit
This report only. Commit hash: see below (added after commit).

## Lighthouse (mobile, built output over gzip static server, 2026-09-08)

Median of runs 2-3 on /: perf 100, FCP 1.02s, LCP 1.74s, TBT 29ms, CLS 0.000. Gate 90: PASS.

## Edit 1: form embedded on the landing page (2026-09-08, commit 56d5909)

The #start hero card now mounts the live V1 form (client:load, embedded). All LP CTAs target #start; /start stays as the full-page fallback.

- `QA_FORM_PATH=/ node tools/form-walk.mjs` (PowerShell): 268/268 checks pass on / at desktop 1440x900 and mobile 390x844. Mobile fold: question + all three options above 844px.
- Mobile Lighthouse on built output, median of runs 2-4 on /: perf 96, FCP 1.37s, LCP 2.66s, TBT 52ms, CLS 0.000 (was 100 with the static tiles; the delta is React + framer-motion now hydrating the fold). /start 99, /thank-you 99 single runs. Gate 90: PASS.

## Edit 2: ILD theme (2026-09-08)

Recolored from template 4 claret/amber + V1 navy/gold to the live ILD "sky & slate" theme (deep blue #1f78b4, sky #29a3e0 for accents on dark, ink #122431, PMF green action #0e7c69) and ILD's own type pairing (Fraunces display at 600, Hanken Grotesk body). Token names unchanged, values only; Bricolage + Manrope faces dropped, metric fallbacks retargeted to Georgia + Arial. Fresh shoot.mjs sweep read on /, /start, /not-yet, /thank-you: no defects.

- Mobile Lighthouse on built output, median of runs 2-4 on /: perf 98, FCP 1.34s, LCP 2.28s, TBT 23ms, CLS 0.000. /start 99, /thank-you 100. Gate 90: PASS.

## Edit 3: one type family, Manrope (2026-09-08)

Tanner: the ILD logo has no serif. Display and body are now Manrope (self-hosted variable file): 800 for the H1, section heads, form headlines, stat numbers and the thank-you display; 400-600 body. Fraunces and Hanken Grotesk faces removed from the CSS; every page preloads the single Manrope file. Fresh shoot.mjs sweep read on / (desktop + mobile fold, full page) and /thank-you: no defects.

- Mobile Lighthouse on built output, median of runs 2-4 on /: perf 98, FCP 1.39s, LCP 2.15s, TBT 55ms, CLS 0.000. /start 99, /thank-you 100. Gate 90: PASS.

## Edit 4: Tanner's video edits (2026-09-08, "ILD Page Changes" clip)

Phase 1, content: government-agency notice bar cut (mobile + desktop); the header's
"Check My Eligibility" button replaced by the ILD phone number, LeaderOne-style (logo left,
number right, on every viewport); a ninth form step, the LeaderOne city question, after the
down payment / balance / rehab fork on every path ("Where in Texas are you buying? / is the
property? / are you flipping?", typed, 2+ chars, title-cased into payload `city`, recap chip
"City, TX"); the phone step's sub headline is back ("An Internet Loans Direct loan officer
will personally text and call you about your eligibility."). Phase 2, mobile sizing: the H1
holds two lines at 375px, hero / card / option-list spacing tightened under 640px so step 1
(question + all three options) fits an iPhone SE 375x667 fold (last option bottom at 527px);
LeaderOne's city marquee (CSS-only 42s loop, edge-fade mask, reduced-motion static) sits
between the hero and the blue TrustBand.

- `node tools/form-walk.mjs` on /start and `QA_FORM_PATH=/ node tools/form-walk.mjs` on
  the LP: 292/292 checks each, desktop 1440x900 + mobile 390x844 (new checks: city step
  label / titles per path, disabled-until-2-chars, double-Enter guard, Back keeps the
  typed city, payload `city` per walk, phone sub headline, "City, TX" chip).
- Fold shots read at 375x667, 390x844, 430x932 and 1440x900: H1 two lines everywhere,
  step 1 inside every fold, marquee present, no notice bar, no header CTA.
- overflow-check 390 + 320: OK on every route. check-links: PASS.
- Mobile Lighthouse on built output, median of runs 2-4 on /: perf 98, FCP 1.37s,
  LCP 2.13s, TBT 38ms, CLS 0.000. /start 99, /thank-you 100. Gate 90: PASS.
- Walker fix: the touch-border check still compared against the pre-retheme cream border
  (#e7e1d2); it now uses the ILD resting border #dbe5ec.

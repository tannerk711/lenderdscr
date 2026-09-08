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

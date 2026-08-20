# DSCR Overhaul Plan v2 (LeaderOne teardown + Tanner's decisions, 2026-08-19)

Full report artifact: https://claude.ai/code/artifact/c567a898-d7c0-4a50-95bc-8533c6d4683b
Evidence: API pull of both Ads accounts (LeaderOne 211-922-5117 `FHA - TX (SKAG)` 24128351485 vs ILD 340-440-3562 `DSCR - TX` 24041061079), live screenshots both funnels, full source review, 14-agent analysis + adversarial verify. v2 incorporates Tanner's section-by-section notes same day. **This file is the execution spec; his decisions are already baked in. Do not re-litigate them.**

## THE SMOKING GUN (operator-confirmed)

The 2026-08-13 form-copy pass reframed the funnel around "See If I Qualify" (submit button, CTAs, badge, phone step; see client CLAUDE.md). Conversions collapsed immediately after: 2 on 8/14, then ZERO on 33 clicks through 8/19. **The tag is VERIFIED firing (Tanner).** The qualify frame is the prime suspect: an investor asked to "see if he qualifies" is offered an audition; an investor offered pricing options is offered the thing he searched for. Rolling this back is move #1. NOTE: this frame was also back-ported to the master template `clients/dscr-funnel-template/`; do not deploy it to future DSCR/investor clients (it may still be fine for consumer avatars like FHA, where approval anxiety is the emotion).

## Headline numbers (life to date, pulled 2026-08-19)

| | LeaderOne FHA - TX (8/10+) | ILD DSCR - TX (7/15+) |
|---|---|---|
| Spend / clicks | $340 / 51 | $2,067 / 288 |
| Click-to-lead | 21.6% (11 conv, 13 CRM) | 5.6% (16 conv) |
| CPC / CPL | $6.67 / ~$26-31 | $7.18 / ~$129 |
| Mobile conv vs desktop | 20.0% vs 33% | 4.9% vs 9.8% |

Realistic DSCR target: 9-15% click-to-lead, $40-75 CPL. Plan targets 9-12% and $50-75. Caveat on LO: 21.6% sits on 51 clicks (honest range 12-35%), and a meaningful share of the 11/13 engaged replies are UNQUALIFIABLE on review (engaged is not qualified).

## VERIFIED causes of the gap

1. **Reply-loop expectation gap.** Paul HAS a GHL follow-up automation similar to LeaderOne's (Tanner confirmed; it was not visible in the repo). The gap is upstream: LO's ads promise "a licensed TX loan officer will reach out fast" (100% of serving ads), thank-you scripts "watch for the text, reply to start" with named humans. ILD's ads promise nothing about contact, phone step volunteers the spam objection, thank-you gives the verdict ("you pre-qualify") and asks the lead to CALL. Same automation, unprimed lead, silence.
2. **Mobile fold**: LO fits full step 1 above the 390px fold (deliberate); ILD buries 3 of 4 options. 85-88% of traffic is mobile; ILD converts 4.9% mobile vs 9.8% desktop.
3. **[dscr loan texas] missing**: legacy's best keyword (70 conv @ $23.88, QS 8) is not in the new campaign. Geo queries convert 10.2% vs 3.0% non-geo.
4. **Exclusionary ad specifics**: "Minimum 20% Down" in every serving description; callout "660+ credit" vs real 620 floor. LO leads inclusive and qualifies in the form.
5. **Identity gap** (fact, causal weight unproven): no NMLS, lead-gen disclaimer, "100+ lenders" aggregator framing x4, no named human pre-thank-you.
6. **Avatar**: 37% of LO clicks carry approval-anxiety language, 0% of ILD's. Investor equivalent = certainty of terms. ~Half the 4x gap is market structure.

## REFUTED / calibrated (do not act on these)

- "New Astro funnel caused the drop": same ads did 4.2% on old GHL page (7/15-7/22) vs 6.0% on new funnel (7/28+). Never resurrect the GHL page.
- "Legacy 11.1% is the baseline": legacy counting used the native lead-form action and shows term rows above 100% conv. Calibration (Tanner): Google's search-term report only surfaces ~60-70% of real queries and lags, so >100% term rows are partly a reporting artifact, not pure fake counting; and the 19.1%->3.8% swings span months of repeated overhauls. Either way: not comparable to today's gated code-fired counting. Never quote legacy numbers to Paul as a baseline.
- "'dscr loan' head term drags the campaign": 1/66 is statistically indistinguishable from other non-geo terms. CPC cap as hedge only.
- "Keyword hygiene explains LO": ILD's live campaign has MORE negatives (48 vs 21); LO converts junk queries; funnel does the converting. BUT (Tanner): junk searches are real and negatives still trim real waste; they just will not close a 4x gap.

## STANDING RULES for this client (locked by Tanner 2026-08-19)

- **NEVER publish rates.** Not in headlines, ads, FAQs, anywhere. Spec-sheet claims are fine (620 floor, LTV, 15-25 day closes, LLC closings, speed-to-terms). Speed to real numbers is the certainty signal that requires publishing nothing.
- **No call or appointment conversion actions.** Paul does not take appointments; LeaderOne's funnel does not book them either. Form-submit webpage action only.
- **Max Clicks + CPC ceiling**, never a ceiling bolted onto Max Conversions.
- All prior standing rules hold: Zapier catch hook only, one webhook per lead, TCPA gated checkbox untouched, no fabricated proof/testimonials, no em-dashes.

## THE PLAN (execution order)

### Phase 0: stop the bleed (half day, FIRST)
- [ ] **Replace the "See If I Qualify" frame sitewide immediately** with the pricing-options frame: submit button "Get My DSCR Pricing Options", badge/CTAs/phone-step copy to match. Small deploy, do not wait for Phase 3 polish. (Edit `src/config/funnel.ts` + `FunnelForm.tsx` copy strings; push main = deploy on Vercel project `lenderdscr`.)
- [ ] **Switch DSCR - TX (24041061079) to Max Clicks with a CPC ceiling** (~$6-7 to start; legacy CPC was $4.92). Launch days burned $14-17 CPCs; 8/19 hit $26.63.
- [ ] **Demote native "Lead form - Submit" conversion action to secondary** (or remove); confirm no lead-form assets attached. Do NOT add call/appointment actions.

### Phase 1: rebuild the funnel's side of the reply loop (week 1)
- [ ] **Align Paul's EXISTING GHL automation** (it exists, similar to LO's): first touch SMS-first, from Paul by name, term-sheet framed, fires within minutes. Draft first text: "Hey [first name], Paul Howarth with Internet Loans Direct. Got your details on the [city] rental. I can have DSCR pricing options from my top lenders back to you today. Want me to run your numbers? Reply YES and I'll get started." NEEDS PAUL: sign off on framing. (The [city] merge field arrives with the Phase 3 city question.)
- [ ] **Thank-you rebuild**: kill "you pre-qualify" (overclaim, kills the follow-up's job); withhold verdict; "Your numbers are in. Paul is pricing your deal now. He'll text you first from (855) 545-2022, reply to that text to start."; named Paul, human presence.
- [ ] **Contact promise into the ads** (Phase 2 rewrite carries it): "A Texas DSCR specialist will text you your pricing options fast."

### Phase 2: campaign surgery (week 1-2, via API, verify after)
- [ ] **[dscr loan texas] SKAG**: exact + phrase + [dscr loans texas], TX-mirrored headlines, budget priority. Highest-confidence change in the account.
- [ ] **Control-ad rewrite**: inclusive specifics + contact promise; move "Minimum 20% Down" out of descriptions; fix 660 callout to the real 620 floor; qualification happens in the form. Fair A/B: pause old Ad 1s for 2 weeks (do not let Google starve the challenger). Caveat: eligibility-style variant lost CTR in a tiny earlier sample; treat as a test.
- [ ] **Campaign negatives** (single-word phrase): meaning, explained, explain, definition, why, commercial, apartment, construction, renovation, rehab, dsr, dslr, griffin, kiavi, visio, lima, angel. **DO NOT negative best/top/rates/lenders** (shopper cluster; legacy converted it ~25%). Hold flip/bridge negatives pending Paul's fix&flip decision.
- [ ] **PARKED (Tanner's call): ad-group 'dscr' negatives** on the Investment/Rental Property Loan groups. Revisit after the SKAG restructure settles.
- [ ] **Break the keyword set into true SKAGs**: one theme per ad group, keyword-mirrored H1, matching path2, lender-worded headlines for lender terms. Cap/pause the $10-15.50-CPC investment/rental keywords (QS 5 vs 8 = most of the CPC gap).

### Phase 3: LP/form surgery (week 2)
- [ ] **Mobile fold compression** (clone the LeaderOne hero pattern: 1-line subhead, drop checkmark rows, compact option cards, full step 1 visible at 390px). Targets the 4.9% mobile conv.
- [ ] **Headline with the investor's numbers, NO RATES**: "Finance your next Texas rental on the rent alone. 620 credit. Closings in as little as 15 days." or speed-to-terms: "Your Texas DSCR pricing options, from 100+ lenders, back to you today."
- [ ] **"100+ lenders" reframe, said once**: "Term sheets from 100+ DSCR lenders, best 2-3 in 24 hours. One credit pull, no rate-shopping grind."
- [ ] **Named Paul on the page** + NMLS if he has one + real funded-deal cards only (never fabricated). NEEDS PAUL.
- [ ] **Form surgery**: step 1 from 4 options to 2-3 (all visible on a phone); add stage question (opener for the first text); **add a CITY question, LeaderOne-style, right after the down-payment step and right before contact info** (feeds the "[city] rental" SMS opener + low-friction commitment beat); phone step positive-frame ("Paul will text your pricing options first, then call if you want to talk"); sub-620 hard exit (/not-yet pattern) instead of "Change my answer"; down-payment step reframed to deal structure ("How are you structuring the deal?" + payoff shown).

### Phase 4: measurement cadence
- [ ] Weekly reconcile: Google conv vs Zapier tasks vs GHL leads vs SMS replies, both accounts, same definitions.
- [ ] 30-day success line: 9-12% click-to-lead, $50-75 CPL, measured reply rate to Paul's first text. Clock starts the day the Phase 0 language rollback ships.

## Build/QA requirements (from client CLAUDE.md + workspace doctrine)

- `npm run build` must pass; deploy = push `main` (Vercel project `lenderdscr`, git-connected; NEVER `vercel link` a new project).
- QA: `node tools/shoot.mjs <prefix>` (desktop + 390px mobile emulation + form steps), `node tools/gtag-test.mjs`, `node tools/tcpa-test.mjs` after touching thank-you/layout/form. Minimum 3 screenshot passes.
- Conversion gating stays exactly as is (sessionStorage lead-summary or ?demo=1).
- Golden rules doctrine applies to all customer-facing copy: `foundation/copywriting-tanner-style/golden-rules.md` + `form-simplification.md` + `engagement-machine.md`.

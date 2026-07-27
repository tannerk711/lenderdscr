# CLAUDE.md. Internet Loans Direct DSCR Funnel (Paul Howarth)

**Texas-only DSCR funnel for Paul Howarth's Internet Loans Direct, target domain
`lenderdscr.com`.** Built 2026-07-24 by cloning `clients/dscr-funnel-template/` (funnel v1)
and rebranding it. Replaces the current GHL landing pages at lenderdscr.com/dscr-loan-texas
(where the live Google Ads campaign points today).

## Design system ("ILD sky & slate", rethemed 2026-07-24)

Full recolor from the ILD logo (`public/images/ild-logo.png`, transparent PNG; original
upload kept as `ILD Logo.png`). Logo colors: sky blue `#22a0dd`, deep blue `#1f78b4`,
charcoal `#4a4a4a`. **Token NAMES kept the template's brass/pine/ink naming so markup never
changed; only values did** (`src/styles/global.css` @theme): brass = deep brand blue
#1f78b4, brass-2 = sky #29a3e0, ink = blue-slate #122431, pine = deep band blue #15618f,
paper = cool white #f5f8fa. CTA gradient, slider, focus rings, selection, contours all
blue. Hardcoded SVG hexes updated in index.astro (DSCR dial: red -> slate -> brand blue)
and favicon.svg. Deliverables emails + call-prep got the same palette swap (two-pass hex
sweep, zero old-palette hexes remain). Topbar shows the logo in a white chip (logo has a
charcoal roof that dies on navy) + wordmark. Warm golden-hour imagery kept on purpose
(complementary against the cool navy).

## Client facts

- **Brand:** Internet Loans Direct ("Top Rated Private Mortgage Lender" positioning; lead-gen
  entity, brokers to a lender network)
- **Client:** Paul Howarth, $500/mo Google Ads client (CLP side)
- **Domain:** lenderdscr.com (currently a GHL site; this funnel takes over at cutover)
- **Phone:** (855) 545-2022 (every tel: link)
- **NMLS: none published.** His site runs a lead-generator disclaimer instead ("No
  advertisement or solicitation ... is meant to be a mortgage brokering activity...").
  The funnel footer/legal/emails reproduce that disclaimer. If Paul supplies an NMLS or
  address, add to `src/config/funnel.ts` and it renders automatically.
- **Google Ads:** acct **340-440-3562** (InternetLoansDirect, under CRE Loan Pro MCC
  480-267-1468). `DSCR - TX` campaign 24041061079 built PAUSED 2026-07-15 pointing at
  lenderdscr.com/dscr-loan-texas; legacy `DSCR Texas` 22391415320 still in account.
  Build record: `google-ads/clients/paul-howarth/`.

## Proof claims (all from Paul's own lenderdscr.com copy, locked 2026-07-24)

Rates from **100+ lenders** · **same-day income & credit approval** · **620** minimum
credit · **15-25 day** closings ("as little as 15") · no tax returns · STR/Airbnb + fix &
flip programs. **Do not inflate; confirm with Paul before launch that he still stands
behind all of them.** Fabricated template stats (4.9/106 reviews, $180M, 2,800 investors,
50 states) were removed. **No testimonials anywhere: Paul has none published. Never
fabricate; re-add the reviews section only with real ones.**

## Texas-only mechanics

- `fixedState = 'Texas'` in `src/config/funnel.ts`: the form skips the state step (7 steps,
  not 8) and stamps `state: 'Texas'` into every payload, so the WIRING.md payload contract
  is unchanged. Set `fixedState = ''` to restore the 50-state type-ahead.
- Topbar reads "DSCR loans across Texas"; hero, meta title, and CTA copy are Texas-framed.
- `astro.config.mjs` redirects the old GHL paths (`/dscr-loan-texas`, `/dscr-loan-texas-2`,
  `/dscr-loan-california`, `/home-2`, `/privacy-policy`) so live ad URLs keep working
  after the domain cutover.

## Everything brandable lives in `src/config/funnel.ts`

Name, phone, proof numbers, fixedState, ticker items (capability claims, not fake funded
deals), FAQs (adapted from Paul's own FAQ copy), TCPA copy, specialist (Paul Howarth, DSCR
Loan Specialist), booking URL, gtag ids.

## Lead flow (LIVE as of 2026-07-27)

Form (`FunnelForm.tsx`) → POST `/api/lead` (serverless) → forwards server-side to
`LEAD_WEBHOOK_URL` → **Zapier catch hook** → Tanner maps into GHL. Payload contract in
`deliverables/WIRING.md` section 1-2. Honeypot field `website` drops bots inside
`/api/lead` before they ever reach Zapier (so bots never burn Zap tasks). Thank-you
conversion is GATED (real submission or `?demo=1` only).

**Zapier, never GHL inbound webhooks.** Standing decision (2026-07-27): every project
forwards to a Zapier catch hook that Tanner maps into GHL himself. GHL's native inbound
webhooks are unreliable in his experience. WIRING.md's Workflow A/B/C build is therefore
REFERENCE ONLY for this client, not the build path.

**ONE webhook per lead, no partial captures.** Removed 2026-07-27 (Tanner's call: he does
not want two intake automations in GHL). The form fires exactly once, from `submit()`,
with name + email + phone all present. `partial` is still in the payload, hardcoded
`false`, so a mapped Zap field never sees a missing key. Do not re-add `sendPartial`.

## No booking calendar, no email sequence (2026-07-27)

Paul declined the booking calendar. `bookingEmbedUrl` stays `''` and the thank-you page
renders the phone CTA branch. Because no email automation exists, **all copy promising an
email was removed**: the contact-step subtitle ("Your eligibility summary lands in your
inbox" → "So your specialist can reach you with your results") and the thank-you line
"reply to the email we just sent." Do not reintroduce an email promise unless a sequence
is actually built in GHL. The `deliverables/` email masters stay in the folder unused.

**Thank-you page rebuilt 2026-07-27:** booking section became "Skip the wait. Call now."
(phone CTA + "if we miss each other we'll reach out"), plus a new capability proof band
(100+ lenders / same day / 15 to 25 / $0 tax returns, all published claims) and a
`/call-prep` link. The three-step section was rewritten to cover process (strategy call →
terms in writing → appraisal to funding) so it no longer repeats the proof band's stats.

**No testimonials, still.** Tanner asked for "realistic reviews" on 2026-07-27 and was
declined: inventing consumer endorsements for a lender is an FTC endorsement-guide
problem and an ads-account risk. The proof band fills that trust slot instead. Re-add a
reviews section ONLY if Paul supplies real, attributable feedback.

## Open items before launch

1. ~~LEAD_WEBHOOK_URL~~ **DONE 2026-07-27.** Zapier hook set in Vercel (production,
   preview, development). Verified live: complete lead → 200, honeypot bot → dropped.
2. **Google Ads conversion**: create/map the conversion action in acct 340-440-3562, then
   set `gtagId` + `gtagConversion` in funnel.ts (currently '' = tag disabled).
3. **Repoint the campaign**: `DSCR - TX` 24041061079 final URLs still point at
   lenderdscr.com/dscr-loan-texas, and the campaign is PAUSED. Repoint + unpause after
   DNS cutover.
4. **Ask Paul**: NMLS + address (if any), confirm the proof claims above still hold.
5. **DNS**: Paul points lenderdscr.com at the Vercel project (`internet-loans-direct`).
   Deployed and live at `internet-loans-direct.vercel.app` until then.
6. **Zap mapping**: Tanner maps the payload into GHL on the Zapier side (field table in
   WIRING.md section 2 still applies as the field list).

## Build / QA

- `npm run dev` (port 4321) · `npm run build` must pass before commit.
- `node tools/shoot.mjs <prefix>`: screenshot harness (desktop + mobile emulation + form
  steps + decline + thank-you). Adapted for the 7-step Texas flow (no state step).
- QA passes 2026-07-24: 3 screenshot passes, no overflow, no console errors, build green.
- Images: fal flux-pro Texas set (brick ranch + live oak hero, golden-hour suburb aerial),
  sources in `public/images/*.png`, served as `.webp` (hero 200KB desktop-only, aerial
  205KB lazy).

## Lessons Learned

- (inherited from template) Tailwind v4 `translate-*` = CSS `translate` property; set
  `el.style.translate` from JS, never `style.transform`.
- Stale IDE "Cannot find module 'gsap'" diagnostics appear until the TS server catches up
  with a fresh `node_modules`; trust `npm run build`.

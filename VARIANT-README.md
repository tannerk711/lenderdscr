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

## Test mode (the current state) and the one-line flip

`src/config/site.ts` exports `leadDelivery: 'test' | 'live'` (currently `'test'`) and
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

### Stage 2 (form): pending

### Stage 3 (thank-you): pending

### QA: pending (`QA-REPORT.md`)

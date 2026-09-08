# QA tools (variant B, `b-t4-v1`)

All tools use puppeteer-core against the installed Chrome (`CHROME_PATH`, default
`C:/Program Files/Google/Chrome/Application/chrome.exe`) and the dev server at `QA_BASE`
(default `http://localhost:4332`, variant B's port; never 4321, another project auto-respawns
there). They regex-read `brand.name`, `gtagId`, `gtagConversion` from `src/config/site.ts` and
abort with `no server at QA_BASE` when the served `<title>` lacks the brand name.

## Start the dev server first (Git Bash)

```
CI=true npx astro dev --port 4332      # background astro dev needs CI=true
```

After `npm install` or an `astro.config` change, delete `node_modules/.vite` and `.astro` before
starting dev (a stale dep cache leaves a React island dead in dev only).

Kill it when done (PowerShell):
`Get-NetTCPConnection -LocalPort 4332 -State Listen | % { Stop-Process -Id $_.OwningProcess -Force }`

## Run

| Command | What it does | Status |
| --- | --- | --- |
| `node tools/shoot.mjs [desktop\|mobile] [--sections]` | Screenshots to `tools/shots/<viewport>-<name>.png`: home fold + full page (+ every LP section in-viewport with `--sections`), `/start` bare + `?goal=refinance`, `/not-yet`, `/thank-you` (seeded lead-summary), mobile sticky, `/privacy`, `/legal`. Prints the mobile fold report (H1 + all three tiles above 844px). | Stage 1, working |
| `node tools/form-walk.mjs [desktop\|mobile]` (`npm run walk`) | Real-browser walk of the `/start` V1 form: buy path end to end (every step shot at both viewports, real POST to `/api/lead`, payload keys diffed against BRIEF section 5 in order, values asserted, `{ok:true, forwarded:false, testMode:true}` response, `/thank-you` personalization, `localStorage` capture, `/test-leads` listing), `?goal=refinance` preselect + Back highlight, refi fork ($3M+ edge) and flip fork submits, Below 620 kick-out, double-Enter guard, unchecked-consent block, failed-POST retry, and a zero-foreign-host network assertion on every walk. Writes `tools/shots/walk-<viewport>-*.png` and `walk-payload-<viewport>-<path>.json`. 218 checks. | Stage 2, 218/218 |
| `node tools/thank-you-shoot.mjs [desktop\|mobile\|lo]` | Stage 3 verification of the LeaderOne-clone `/thank-you`: opens `/`, seeds `sessionStorage['lead-summary']` (BRIEF section 5 shape via `seedLeadSummary()`), navigates to `/thank-you`, asserts title / noindex / zero gtag / localhost-only requests / personalized H1 / five chips in order / Fraunces + Hanken resolved / italic pine em / no monospace / LO backgrounds / seal drawn / no overflow / zero console errors, shoots fold + full page (`lo` = 1200 wide, lines up with `_ref/leaderone/lo-thankyou-desktop.png`), then the no-summary default, reduced motion, `/not-yet`, and the in-form Below 620 kick-out link to `/not-yet`. Writes `tools/shots/<vp>-thank-you-{fold,full,default}.png`, `*-not-yet-full.png`, `*-kickout.png`. 86 checks. | Stage 3, 86/86 |
| `node tools/overflow-check.mjs` | `scrollWidth <= clientWidth` at 390 and 320 on every variant B route (includes `/test-leads`). | Stage 2, all OK |
| `node scripts/check-links.mjs` | Every internal href in `dist/client` resolves to a built file (needs a prior `npm run build`). | Stage 2, PASS |
| `npm run lh` | `astro build`, serve `dist` gzipped on `LH_PORT` (default 4342), Lighthouse mobile x4 on `/` + x1 each on `/start` and `/thank-you`, median of runs 2-4, reports in `tools/lh-reports/`, exit 1 below 90. `--skip-build` reuses the existing dist. Kill other servers and Chrome windows first. Runs in the perf stage, not before. | Ready |
| `node tools/serve-dist.mjs` | Just the gzip static server for the built output on 4342. | Ready |
| `node tools/step-walk-qa.mjs` / `tcpa-test.mjs` / `gtag-test.mjs` | Written for template 4's in-hero island (credit values `700-739`, `#ff-name`, state step, `source: dscr-funnel-template-4`). The `/start` V1 form keeps the same primitives (`#start [data-step]`, `[data-value]`, `[data-action]`, `#ff-range`, `#ff-tcpa`, `[data-step-title]`, `[data-error]`) so `qa-lib.mjs` still drives it, but these three scripts assert the old contract; `form-walk.mjs` covers their ground for now and the QA stage retires or rewrites them. `gtag-test` also predates TEST MODE, where no gtag renders at all. | Superseded by form-walk (QA stage decides) |

## /start DOM contract (what form-walk drives)

`#start` root; each step root carries `data-step="goal|stage|propertyType|credit|price|secondary|contact|phone|kickout"`
(`secondary` also carries `data-fork="down|balance|rehab"`); option cards `[data-value]` (goal values,
kebab-slugged option text for stage / balance / rehab, property + credit values) with
`data-selected="true|false"`; sliders `#ff-range`; inputs `#ff-first`, `#ff-last`, `#ff-email`,
`#ff-phone`; consent `#ff-tcpa` (label `[data-consent]`); buttons `[data-action="continue|back|submit|not-yet"]`;
headline `h1[data-step-title]`; visible `[data-step-label]` ("Step n of 8"); inline error `[data-error]`;
recap chips `[data-chips]`; honeypot `#ff-website` (`name="website"`).

`?qa=1` sets `sessionStorage.qa = '1'` (kept for live-mode conversion suppression on `/thank-you`);
`?demo=1` fires the conversion for Tag Assistant in live mode only. In TEST MODE nothing fires.
`tools/qa-lib.mjs` holds the shared drivers (viewport assertion, title guard, lead interception).

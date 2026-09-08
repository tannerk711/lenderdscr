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
| `node tools/overflow-check.mjs` | `scrollWidth <= clientWidth` at 390 and 320 on every variant B route (includes `/test-leads`, stage 2). | Stage 1, working |
| `node scripts/check-links.mjs` | Every internal href in `dist/client` resolves to a built file (needs a prior `npm run build`). | Stage 1, PASS |
| `npm run lh` | `astro build`, serve `dist` gzipped on `LH_PORT` (default 4342), Lighthouse mobile x4 on `/` + x1 each on `/start` and `/thank-you`, median of runs 2-4, reports in `tools/lh-reports/`, exit 1 below 90. `--skip-build` reuses the existing dist. Kill other servers and Chrome windows first. Runs in the perf stage, not before. | Ready |
| `node tools/serve-dist.mjs` | Just the gzip static server for the built output on 4342. | Ready |
| `node tools/step-walk-qa.mjs` / `tcpa-test.mjs` / `gtag-test.mjs` | Written for template 4's in-hero React island (`#start [data-step]`, `#ff-*` ids). Stage 2 moves the form to `/start` (V1 form) and the QA stage rewrites these against the BRIEF section 4/5 contract (or adapts `foundation/tools/walk-form.mjs`). `gtag-test` also predates TEST MODE, where no gtag renders at all. | Needs rewrite (stage 2 / QA) |

`?qa=1` sets `sessionStorage.qa = '1'` (kept for live-mode conversion suppression on `/thank-you`);
`?demo=1` fires the conversion for Tag Assistant in live mode only. In TEST MODE nothing fires.
`tools/qa-lib.mjs` holds the shared drivers (viewport assertion, title guard, lead interception).

# QA tools

All tools use puppeteer-core against the installed Chrome (`CHROME_PATH`, default
`C:/Program Files/Google/Chrome/Application/chrome.exe`) and the dev server at `QA_BASE`
(default `http://localhost:4321`). They regex-read `brand.name`, `gtagId`, `gtagConversion`
from `src/config/site.ts` and abort with `no server at QA_BASE` when the served `<title>` lacks
the brand name (a stale server from another project can answer on 4321).

## Start the dev server first (Git Bash)

```
netstat -ano | findstr 4321          # must be free; 4322 belongs to another session, never kill it
CI=true npm run dev                   # background astro dev needs CI=true
```

After `npm install` or an `astro.config` change, delete `node_modules/.vite` and `.astro` before
starting dev (a stale dep cache leaves the React island dead in dev only). If every step-walk
click misses, that is the first thing to check.

## Run

| Command | What it does |
| --- | --- |
| `npm run qa` | `step-walk-qa` + `tcpa-test` + `gtag-test` + `scripts/check-links` (check-links needs a prior `npm run build`). Exit 1 on any failure. |
| `node tools/step-walk-qa.mjs` | 8-step purchase path, no visible "Step N of T", refinance/bridge titles, sub-620 to `/not-yet`, 7-step `/dscr-loans/texas` walk with the Texas chip, full submits on `/?qa=1` and `/dscr-loans/texas?qa=1` (POST intercepted, never a webhook). |
| `node tools/tcpa-test.mjs` | Checkbox starts unchecked, label above submit (DOM + visual), zero POSTs when unchecked, full consent record when checked, label text equals the shipped `tcpaConsentText`. |
| `node tools/gtag-test.mjs` | Negative contract when `gtagId` is empty (prints SKIP for the positives, exit 0); full conversion gating when set. |
| `npm run shoot` | Screenshots to `tools/shots/<viewport>-<name>.png`: home fold + full, every form step, not-yet, thank-you (seeded), mobile sticky, `/dscr-loans/texas`, `/dscr-loans`. `node tools/shoot.mjs mobile` for one viewport. Prints the mobile fold report (third option card must sit above 844px). |
| `npm run lh` | `astro build`, serve `dist` on `LH_PORT` (4399) with gzip, Lighthouse mobile x4 on `/` + x1 on `/dscr-loans/texas`, median of runs 2-4, reports in `tools/lh-reports/`, exit 1 below 90. `--skip-build` reuses the existing dist. Kill other servers and Chrome windows first. |
| `node tools/serve-dist.mjs` | Just the static server for the built output (prod-like screenshots, manual checks). |

`?qa=1` posts a real lead but suppresses the Ads conversion on `/thank-you`; `?demo=1` fires it
for Tag Assistant. `tools/qa-lib.mjs` holds the shared drivers (viewport assertion, title guard,
form walk by `[data-value]` / `[data-action]`, lead interception).

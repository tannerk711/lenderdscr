// Mobile Lighthouse gate (BRIEF sections 12 + 13). Builds, serves dist in-process (serve-dist.mjs
// on LH_PORT, default 4399), launches Chrome with puppeteer-core, and runs Lighthouse through
// its node API against that Chrome: 4 runs on `/` + 1 on `/dscr-loans/texas`. Prints each score
// with LCP / TBT / CLS (and FCP), the MEDIAN of runs 2-4 on `/` (run 1 is the cold outlier),
// writes HTML + JSON reports to tools/lh-reports/, and exits 1 when that median is < 90.
// The state-page run is informational (a single run has no warm median).
//
//   npm run lh                 build + audit
//   node tools/lh.mjs --skip-build     reuse the existing dist
// Kill other dev servers and stray Chrome windows first: a busy CPU skews TBT and the score.
import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer-core';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { startServer, DEFAULT_PORT } from './serve-dist.mjs';
import { CHROME_PATH, ROOT, readSiteConfig } from './qa-lib.mjs';

const argv = process.argv.slice(2);
const skipBuild = argv.includes('--skip-build');
const GATE = 90;
const reportsDir = fileURLToPath(new URL('./lh-reports/', import.meta.url));
mkdirSync(reportsDir, { recursive: true });
const site = readSiteConfig();

if (!skipBuild) {
  console.log('lh: astro build');
  const r = spawnSync('npm run build', { cwd: ROOT, stdio: 'inherit', shell: true });
  if (r.status !== 0) {
    console.error('lh: astro build failed');
    process.exit(1);
  }
}

let srv;
try {
  srv = await startServer(DEFAULT_PORT);
} catch (e) {
  console.error(`lh: ${e.message}`);
  process.exit(1);
}

// Port-squatter check on the served output itself.
try {
  const html = await (await fetch(`${srv.url}/`)).text();
  const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1] || '';
  if (!title.includes(site.brandName)) throw new Error(`served <title> "${title}" lacks brand.name "${site.brandName}"`);
  const enc = (await fetch(`${srv.url}/`, { headers: { 'accept-encoding': 'gzip' } })).headers.get('content-encoding');
  console.log(`lh: serving ${srv.root} on ${srv.url} (title ok, content-encoding ${enc || 'none'})`);
} catch (e) {
  console.error(`lh: no server at ${srv.url}: ${e.message}`);
  await srv.close();
  process.exit(1);
}

const METRICS = [
  ['first-contentful-paint', 'FCP', 's'],
  ['largest-contentful-paint', 'LCP', 's'],
  ['total-blocking-time', 'TBT', 'ms'],
  ['cumulative-layout-shift', 'CLS', ''],
];
const fmt = (v, unit) => (!Number.isFinite(v) ? 'n/a' : unit === 's' ? `${(v / 1000).toFixed(2)}s` : unit === 'ms' ? `${Math.round(v)}ms` : v.toFixed(3));
const median = (arr) => {
  const a = arr.filter(Number.isFinite).sort((x, y) => x - y);
  if (!a.length) return NaN;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
};

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: true,
  args: ['--headless=new', '--remote-debugging-port=0', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', '--disable-extensions'],
});
const port = Number(new URL(browser.wsEndpoint()).port);

const flags = {
  port,
  output: ['json', 'html'],
  logLevel: 'error',
  onlyCategories: ['performance'],
  formFactor: 'mobile',
  screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false },
  throttlingMethod: 'simulate',
};

async function audit(path, label, i) {
  const url = `${srv.url}${path}`;
  let result;
  try {
    result = await lighthouse(url, flags);
  } catch (e) {
    console.log(`  ${label} run ${i}: ERROR ${e.code || ''} ${e.friendlyMessage || e.message}`);
    return null;
  }
  const { lhr } = result;
  if (!lhr || lhr.runtimeError) {
    console.log(`  ${label} run ${i}: RUNTIME ERROR ${lhr?.runtimeError?.code || ''} ${lhr?.runtimeError?.message || ''}`);
    return null;
  }
  const reports = Array.isArray(result.report) ? result.report : [result.report];
  const base = `${reportsDir}${label}-run${i}`;
  writeFileSync(`${base}.json`, reports[0] ?? JSON.stringify(lhr));
  if (reports[1]) writeFileSync(`${base}.html`, reports[1]);
  const row = {
    score: Math.round((lhr.categories.performance?.score ?? 0) * 100),
    metrics: Object.fromEntries(METRICS.map(([id, key]) => [key, lhr.audits[id]?.numericValue ?? NaN])),
    lhr,
  };
  const line = METRICS.map(([, key, unit]) => `${key} ${fmt(row.metrics[key], unit)}`).join('  ');
  console.log(`  ${label} run ${i}${i === 1 ? ' (cold)' : ''}: perf ${row.score}  ${line}`);
  return row;
}

let exitCode = 0;
try {
  console.log('\nlighthouse MOBILE (412x823 @1.75, simulated slow 4G, 4x CPU), performance only');
  const home = [];
  for (let i = 1; i <= 4; i++) {
    const r = await audit('/', 'home', i);
    if (r) home.push({ i, ...r });
  }
  const warm = home.filter((r) => r.i >= 2);
  if (!warm.length) {
    console.log('\nno warm runs on /: cannot compute the median');
    exitCode = 1;
  } else {
    const medScore = median(warm.map((r) => r.score));
    const medLine = METRICS.map(([, key, unit]) => `${key} ${fmt(median(warm.map((r) => r.metrics[key])), unit)}`).join('  ');
    console.log(`\nMEDIAN of runs 2-4 on /: perf ${medScore}  ${medLine}`);
    const ok = medScore >= GATE;
    console.log(`GATE (mobile perf median >= ${GATE}): ${ok ? 'PASS' : 'FAIL'}`);
    if (!ok) exitCode = 1;

    // Top opportunities from the last warm run, ranked by metric savings (Lighthouse 12+).
    const last = home[home.length - 1].lhr;
    const rows = Object.values(last.audits)
      .filter((a) => !['notApplicable', 'manual', 'error', 'informative'].includes(a.scoreDisplayMode) || a.metricSavings)
      .map((a) => {
        const ms = a.metricSavings || {};
        const savings = (ms.FCP || 0) + (ms.LCP || 0) + (ms.TBT || 0) + (ms.INP || 0) + (a.details?.overallSavingsMs || 0);
        return { a, savings, cls: ms.CLS || 0, bytes: a.details?.overallSavingsBytes || 0 };
      })
      .filter((r) => r.savings > 0 || r.cls > 0 || (r.a.score !== null && r.a.score < 1 && r.a.details?.type === 'opportunity'))
      .sort((x, y) => y.savings + y.cls * 1000 + y.bytes / 1000 - (x.savings + x.cls * 1000 + x.bytes / 1000))
      .slice(0, 5);
    console.log(`\ntop ${rows.length} opportunities / diagnostics (last run on /):`);
    if (!rows.length) console.log('  none flagged');
    for (const { a, savings, cls, bytes } of rows) {
      const parts = [];
      if (savings) parts.push(`-${Math.round(savings)}ms`);
      if (cls) parts.push(`CLS -${cls.toFixed(3)}`);
      if (bytes) parts.push(`${Math.round(bytes / 1024)}KiB`);
      console.log(`  - ${a.title} [${a.id}]${parts.length ? ': ' + parts.join(', ') : ''}${a.displayValue ? `  (${a.displayValue})` : ''}`);
    }
  }

  console.log('');
  const tx = await audit('/dscr-loans/texas', 'state-texas', 1);
  if (tx && tx.score < GATE) console.log(`  WARN /dscr-loans/texas scored ${tx.score} on a single cold run (informational; re-run with more runs before treating as a regression)`);
  if (!tx) console.log('  WARN /dscr-loans/texas did not audit (route missing?)');
} finally {
  await browser.close();
  await srv.close();
}
console.log(`\nreports -> ${reportsDir}`);
process.exit(exitCode);

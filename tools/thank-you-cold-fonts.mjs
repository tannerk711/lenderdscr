// Font-paint guard for /thank-you. Every first-paint face ships font-display: optional
// (memory: reference_astro_perf_pagespeed_gotchas), so a face that is not ready at first
// layout is dropped for the page's lifetime: the page paints in Georgia / Segoe UI instead
// of Fraunces / Hanken and the LeaderOne clone quietly stops looking like one.
// document.fonts.check() cannot see that (it reports "loaded" either way), so this tool
// measures what actually PAINTED: the rendered width of a probe string in the H1's and the
// lede's computed families against the web font and the fallback.
//
// Two regimes, N rounds each, every round in a fresh browser context (no cache):
//   funnel   /start first, then /thank-you: the visitor's path. The Fraunces roman is warm
//            from /start and the renderer is warm; Hanken and the italic load cold.
//   direct   straight to /thank-you: cold cache AND a cold headless renderer. First layout
//            lands within ~150 ms of the preloads in a CPU-starved process, so later
//            preloads lose a decode race. Not the regime a real device is in.
//
// The cold faces are a RATE, not a pass/fail: font-display: optional (BRIEF section 8)
// trades a late repaint for a fallback paint on slow loads by design, and the measured
// rate on 2026-09-08 (localhost, gzip, machine otherwise idle) was funnel: roman 8/8,
// italic 5/8, Hanken 6/8; direct: roman 6/8, italic 3/8, Hanken 8/8, with the three
// instanced files. What moved it: fewer and smaller preloaded files. What did not:
// declaring the faces earlier, data-URI inlining (worse), Cache-Control on the server.
// Exit 1 only when the WARM roman misses in the funnel regime (a wiring regression:
// preload, declaration or file), never on the cold-face rate.
//
// Run it against the BUILT output over the gzip server (the dev server's Vite CSS chain
// misses the optional window on every cold load and proves nothing), with nothing else
// running (a concurrent puppeteer job halves the hit rate):
//   npm run build && LH_PORT=4342 node tools/serve-dist.mjs   (background)
//   QA_BASE=http://localhost:4342 node tools/thank-you-cold-fonts.mjs [rounds=6] [--regime=funnel|direct|both]
import { QA_BASE, launchBrowser, settle, makeChecker } from './qa-lib.mjs';

const args = process.argv.slice(2);
const rounds = Number(args.find((a) => /^\d+$/.test(a)) || 6);
const regimeArg = (args.find((a) => a.startsWith('--regime=')) || '--regime=both').split('=')[1];
const regimes = regimeArg === 'both' ? ['funnel', 'direct'] : [regimeArg];
const { check, summary } = makeChecker();
const vp = { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 2, hasTouch: true };

const PROBE = () => {
  const probe = (family, style = '') => {
    const s = document.createElement('span');
    s.style.cssText = `position:absolute;visibility:hidden;font-size:40px;white-space:nowrap;font-family:${family};${style}`;
    s.textContent = 'Nice work. Your credit clears the DSCR floor.';
    document.body.appendChild(s);
    const w = Math.round(s.getBoundingClientRect().width);
    s.remove();
    return w;
  };
  const h1Family = getComputedStyle(document.querySelector('h1')).fontFamily;
  const ledeFamily = getComputedStyle(document.querySelector('.lo-lede')).fontFamily;
  const mono = probe('monospace');
  const fraunces = probe('Fraunces, monospace');
  const frauncesItalic = probe('Fraunces, monospace', 'font-style:italic');
  const hanken = probe('"Hanken Grotesk", monospace');
  return {
    // a face Chrome dropped measures as the monospace fallback in the probe
    h1: fraunces !== mono && probe(h1Family) === fraunces,
    em: frauncesItalic !== mono && frauncesItalic !== fraunces && probe(h1Family, 'font-style:italic') === frauncesItalic,
    lede: hanken !== mono && probe(ledeFamily) === hanken,
    detail: `h1=${probe(h1Family)} fraunces=${fraunces} em=${probe(h1Family, 'font-style:italic')} frauncesItalic=${frauncesItalic} lede=${probe(ledeFamily)} hanken=${hanken} mono=${mono}`,
  };
};

for (const regime of regimes) {
  console.log(`\n== ${regime} (${rounds} rounds, fresh context each) ==`);
  const hits = { h1: 0, em: 0, lede: 0 };
  for (let round = 1; round <= rounds; round++) {
    const browser = await launchBrowser(vp);
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2, hasTouch: true });
    if (regime === 'funnel') {
      await page.goto(`${QA_BASE}/start`, { waitUntil: 'networkidle0', timeout: 45000 });
      await settle(300);
    }
    await page.goto(`${QA_BASE}/thank-you`, { waitUntil: 'networkidle0', timeout: 45000 });
    await settle(500);
    const r = await page.evaluate(PROBE);
    await browser.close();
    hits.h1 += r.h1 ? 1 : 0;
    hits.em += r.em ? 1 : 0;
    hits.lede += r.lede ? 1 : 0;
    const ok = r.h1 && r.em && r.lede;
    console.log(`${ok ? 'ok  ' : 'miss'}  ${regime} round ${round}: Fraunces=${r.h1} italic=${r.em} Hanken=${r.lede}${ok ? '' : `  (${r.detail})`}`);
    if (regime === 'funnel') {
      check(`funnel round ${round}: the warm Fraunces roman painted the H1`, r.h1, r.detail);
    }
  }
  console.log(`${regime}: Fraunces ${hits.h1}/${rounds}, italic ${hits.em}/${rounds}, Hanken ${hits.lede}/${rounds}`);
}

const ok = summary();
process.exit(ok ? 0 : 1);

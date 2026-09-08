// Verifies every internal href in the BUILT html resolves to a built file.
// BRIEF 2b: scans dist/client/**/*.html (fallback .vercel/output/static),
// ignores #anchors and /api/*, fails (exit 1) on any unresolved internal href.
// Runs as the last step of `npm run qa` after `npm run build`.
//
// Usage: node scripts/check-links.mjs [--dir <built-root>]
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const argDir = (() => {
  const i = process.argv.indexOf('--dir');
  return i > -1 ? path.resolve(process.argv[i + 1] ?? '') : null;
})();

const CANDIDATES = argDir
  ? [argDir]
  : [path.join(root, 'dist', 'client'), path.join(root, '.vercel', 'output', 'static'), path.join(root, 'dist')];

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function findBuildDir() {
  for (const dir of CANDIDATES) {
    if ((await exists(dir)) && (await exists(path.join(dir, 'index.html')))) return dir;
  }
  return null;
}

async function walkHtml(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walkHtml(p, out);
    else if (e.isFile() && e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const HREF_RE = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
const ID_RE = /\bid\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;

function decode(s) {
  return s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
}

/** true when the href is something we should verify against the build */
function isInternal(href) {
  if (!href) return false;
  if (href.startsWith('#')) return false; // same-page anchor (checked softly below)
  if (href.startsWith('//')) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return false; // http:, https:, mailto:, tel:, data:
  return href.startsWith('/');
}

async function resolves(buildDir, href) {
  const clean = href.split('#')[0].split('?')[0];
  if (clean.startsWith('/api/')) return true;
  const rel = clean.replace(/^\/+/, '').replace(/\/+$/, '');
  const base = path.join(buildDir, rel);
  const tries = rel === '' ? [path.join(buildDir, 'index.html')] : [path.join(base, 'index.html'), `${base}.html`, base];
  for (const t of tries) {
    try {
      const st = await fs.stat(t);
      if (st.isFile()) return true;
    } catch {
      /* next */
    }
  }
  return false;
}

async function main() {
  const buildDir = await findBuildDir();
  if (!buildDir) {
    console.error(`check-links: no built output found. Run \`npm run build\` first. Looked in:\n  ${CANDIDATES.join('\n  ')}`);
    process.exit(1);
  }

  const files = await walkHtml(buildDir);
  const failures = [];
  const anchorWarnings = [];
  let checked = 0;
  const cache = new Map();

  for (const file of files) {
    const html = await fs.readFile(file, 'utf8');
    const page = '/' + path.relative(buildDir, file).split(path.sep).join('/');
    const ids = new Set();
    for (const m of html.matchAll(ID_RE)) ids.add(decode(m[1] ?? m[2] ?? ''));

    for (const m of html.matchAll(HREF_RE)) {
      const href = decode(m[1] ?? m[2] ?? '');
      if (href.startsWith('#') && href.length > 1) {
        // soft check: same-page anchor should exist (warn only; anchors are ignored by contract)
        if (!ids.has(href.slice(1))) anchorWarnings.push(`${page} -> ${href}`);
        continue;
      }
      if (!isInternal(href)) continue;
      checked++;
      let ok = cache.get(href);
      if (ok === undefined) {
        ok = await resolves(buildDir, href);
        cache.set(href, ok);
      }
      if (!ok) failures.push(`${page} -> ${href}`);
    }
  }

  const uniqueFailures = [...new Set(failures)];
  const uniqueWarnings = [...new Set(anchorWarnings)];

  console.log(`check-links: ${files.length} html files, ${checked} internal hrefs checked in ${path.relative(root, buildDir) || '.'}`);
  if (uniqueWarnings.length) {
    console.log(`check-links: ${uniqueWarnings.length} same-page anchor(s) without a matching id (warning only):`);
    for (const w of uniqueWarnings.slice(0, 40)) console.log(`  ${w}`);
  }
  if (uniqueFailures.length) {
    console.error(`check-links: FAIL, ${uniqueFailures.length} unresolved internal href(s):`);
    for (const f of uniqueFailures) console.error(`  ${f}`);
    process.exit(1);
  }
  console.log('check-links: PASS');
}

main().catch((err) => {
  console.error('check-links: error', err);
  process.exit(1);
});

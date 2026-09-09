"""Regenerate the self-hosted Fraunces + Hanken Grotesk files in public/fonts from the
pristine fontsource packages.

Every first-paint face here ships font-display: optional (BRIEF section 8), so a face that
is not ready at first layout is dropped for the page's lifetime. /thank-you preloads THREE
files, each as small as its use allows (tools/thank-you-cold-fonts.mjs measures what paints):

  fraunces roman:  pin opsz=72 (every use sets opsz 72), KEEP wght (/start 600, /thank-you 400)
                   67 KB -> 37 KB
  fraunces italic: pin opsz=72 and wght=400 (the /thank-you H1 tail only), static
                   81 KB -> 23 KB
  hanken grotesk:  one variable file, wght restricted to 400..700 (the page uses 400, 600,
                   700) instead of three static weights                  35 KB -> 23 KB

Tried and measured worse (2026-09-08): the same two faces inlined as data URIs in the page
stylesheet (Chrome still loads data: faces asynchronously, so optional dropped them just as
often, and the sheet grew by 62 KB); declaring the faces in a later, page-scoped sheet;
immutable vs must-revalidate Cache-Control on the local server (no difference).

Run from the worktree root (needs `python -m pip install --user fonttools brotli`):
  python scripts/instance-fonts.py
Then: npm run build, LH_PORT=4342 node tools/serve-dist.mjs (background),
      QA_BASE=http://localhost:4342 node tools/thank-you-cold-fonts.mjs 8
"""
import os
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NM = os.path.join(ROOT, 'node_modules', '@fontsource-variable')
OUT = os.path.join(ROOT, 'public', 'fonts')

JOBS = [
    ('fraunces', 'fraunces-latin-standard-normal.woff2', {'opsz': 72}),
    ('fraunces', 'fraunces-latin-standard-italic.woff2', {'opsz': 72, 'wght': 400}),
    ('hanken-grotesk', 'hanken-grotesk-latin-wght-normal.woff2', {'wght': (400, 700)}),
]

for pkg, name, limits in JOBS:
    src = os.path.join(NM, pkg, 'files', name)
    font = TTFont(src)
    axes = {a.axisTag: (a.minValue, a.defaultValue, a.maxValue) for a in font['fvar'].axes}
    inst = instancer.instantiateVariableFont(font, limits, inplace=False, updateFontNames=False)
    inst.flavor = 'woff2'
    dst = os.path.join(OUT, name)
    inst.save(dst)
    left = 'static' if 'fvar' not in inst else {a.axisTag: (a.minValue, a.maxValue) for a in inst['fvar'].axes}
    print(f'{name}: {axes} {os.path.getsize(src)} B -> {left} {os.path.getsize(dst)} B')

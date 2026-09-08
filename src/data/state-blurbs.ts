// Optional per-state intro paragraphs for /dscr-loans/[state]. Keyed by slug.
// ONLY the state route imports this file (never the form island). When a slug
// is absent the route renders site.stateIntroFallback with {name} substituted.
// Keep every blurb factual and spec-sheet only: no rates, no day counts, no
// investor counts, no "guaranteed". Empty by default; fill in as content lands.

export const stateBlurbs: Record<string, string> = {};

export function stateBlurb(slug: string): string | undefined {
  return stateBlurbs[slug];
}

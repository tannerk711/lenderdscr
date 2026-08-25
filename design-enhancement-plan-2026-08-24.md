# ILD Funnel Design Enhancement Plan (2026-08-24)

**Scope: design only. Not one word of copy changes.** The 8/24 PMF-model structure, section
order, form flow, TCPA behavior, conversion gating, and every string are locked. This plan
upgrades visual design, illustration/imagery, section treatment, and animation on top of the
converting skeleton.

Produced by a 6-lens design analysis (desktop layout, mobile/form UX, motion, imagery,
post-submit flow, brand aesthetic) over full-funnel screenshots + source, filtered by two
adversarial reviewers (conversion guardian + constraint auditor). 57 raw findings, 42
survived, 15 killed as duplicates or conversion risks.

## The pitch

The page converts-first but reads template-grade: a white void hero, flat cards, a
fog-washed photo band, dead option taps, and zero motion below the fold. The fix is one
design system applied everywhere: white cards on tinted ground, one bespoke icon grammar,
green reserved for actions only, a lazy GSAP reveal spine, and a thank-you page that makes
SAVE THE NUMBER the unmistakable focal point. Everything is CSS/inline-SVG/lazy-JS; the
whole plan is net positive or neutral on pagespeed.

## Hard constraints (verified against every item)

1. Zero copy changes (aria-labels/alt text excepted, they are accessibility).
2. PMF section order locked. No new copy-bearing sections, no reordering.
3. Full form step 1 stays above the 390x844 fold. Hero entrance stays CSS-only (LCP).
4. Mobile pagespeed 90+. GSAP only via dynamic import after window load.
   prefers-reduced-motion disables transforms everywhere.
5. No fabricated proof: no stars, counters, testimonials, badges. Trust via craft.
6. No monospace. Light mode with real shadows. Headline tracking >= -0.008em, LH >= 1.12.
7. TCPA checkbox behavior, ids (#eligibility, #sticky-cta), payload, step logic untouched.
   The 180ms option-advance timing stays.
8. fal is images-only (flux-pro photo, recraft-v3 stylized). Animation is in-browser.

---

## Phase 1: System foundations (all CSS/markup hygiene, zero visual risk)

1. **Font payload cleanup** (`Layout.astro:30`, `global.css`). Delete Fragment Mono from
   the Google Fonts URL now (verified dead: `--font-mono` aliases to Hanken). Trim Hanken
   to rendered weights (400/600/700/800). Drop Fraunces ENTIRELY after the Phase 5 retypes
   land (footer wordmark, thank-you accent, not-yet page are its only users), and remove
   the SOFT/WONK helpers at `global.css:70-78`. Pure pagespeed gain that funds the motion
   layer.
2. **Green = action only** (`index.astro:174,180`). Recolor the FAQ H2 and all five FAQ
   question headings from CTA green to pine. Grammar: green is for things you click or
   things confirmed true (buttons, check marks, the "Instant Qualification Check" kicker);
   pine is for things you read. Makes the final green button the destination of a thread
   instead of one more green heading.
3. **Card recipe consolidation** (`global.css`). Three tokenized recipes, all rounded-2xl:
   `.card-hero` (white, ink/10 border, --shadow-card) for form + credibility cards;
   `.card-quiet` (white, ink/10 border, new --shadow-card-sm) for FAQ + thank-you cards;
   `.card-dark` (ink-2, cream/10 border, inset top highlight) for dark-band cards. Delete
   the one-off inline FAQ shadow. Sweep thank-you and not-yet onto the same recipes.
4. **Check-glyph sweep + micro-mark system**. Replace every text `✓` (`index.astro:124,153`)
   with an 18px inline-SVG roof-check mark derived from the favicon (gabled house + check)
   in a green tint disc, 1.8 stroke geometry matching the icon suite. Reserve the roof-check
   for identity moments (bullets, logo chip, photo watermark, thank-you medallion).
5. **Image asset hygiene** (`public/images/`). Move PNG originals (643KB + 796KB) out of
   public/, delete the duplicate `ILD Logo.png`, recompress both webps to q70 (~140KB each,
   scrim and crop hide the artifacts).
6. **Footer wordmark to bold Hanken** (`Footer.astro:7`), matching the Topbar identity
   exactly (cream on ink). Codify in global.css comments: serif never appears anywhere
   once Phase 5 lands; one wordmark identity everywhere.

## Phase 2: Form UX polish (highest felt impact per lead, all inside the island)

1. **Selected-state tap feedback** (`FunnelForm.tsx`, `global.css`). Add `.is-selected`
   inside `pick()` before the existing 180ms advance (timing unchanged): border fills
   brass, background tints brass-2 at ~8%, icon coin inverts to solid pine with white
   glyph, small check fades in on the right edge. Plus `@media (hover: none)` shows the
   `.opt-arrow` at rest at ~35% so touch users see the affordance. Kills the dead-tap feel
   on every option step.
2. **TCPA container restyle** (container only, text/behavior locked). White surface with
   soft ambient shadow instead of the hard gray box; custom 22px checkbox visual over the
   native input (appearance:none, brass border, pine fill + animated white check); on
   checked, a 2px pine left accent and pine/4 warm-up so consenting visibly settles the
   box. Unchecked state must read unmistakably as an empty checkbox; keep visible focus
   ring and 44px effective tap area. Screenshot both states at 390px.
3. **Icon system through steps 2-3**. Property types get duotone glyphs in the step 1 coin
   style (house, duplex, small multi, larger multi, storefront, dots); credit bands get a
   five-segment arc meter glyph stepping down per band (data styling, not a rating claim).
   Row heights unchanged.
4. **Slider modernize** (`global.css` brass-range). Flat white 28px thumb with 2px brass
   ring + layered soft shadow (replaces the glossy marble), ~44px effective touch height,
   faint tick dots at step intervals (repeating-linear-gradient), brass-to-brass-2 gradient
   fill with a soft glow at the fill head. Keep the big tabular money display as-is.
5. **Step height tween + transition fix**. Animate the card shell height ~300-350ms with
   --ease-lux on step change (measure incoming step inside the island) so the reassurance
   line and dark band stop jumping. Fix the dead rotateY: either add perspective on the
   card so the page-turn reads, or drop rotateY for clean translateX + fade.
6. **Deal-ticket summary chips** (phone step + thank-you reuse). White pills, hairline
   border, soft shadow, 12px glyph per value (tag, home, pin, dollar), balanced 2+2 wrap at
   390px, slightly larger type. Data-driven values, no copy.
7. **Micro details**: slider thumb scales 1.15 on :active with a 120ms value-display pop;
   submitting button gets a left-to-right sheen sweep; reassurance line under the card gets
   [text-wrap:balance] + ~0.1em tracking below 400px to kill the "OBLIGATION" orphan.

## Phase 3: LP section treatments (top to bottom)

1. **Hero atmosphere + figure-ground flip** (the canonical merged spec). Tinted CSS-only
   backdrop: radial sky wash (#29a3e0 at 5-8%) behind the card, paper-2 bleeding in from
   the edges, soft elliptical halo directly behind the card (radial-gradient, no blur
   filters). Form card flips to pure white with the existing border, slightly deepened
   shadow, and a 3px brass-to-brass-2 gradient top edge inside the rounded corner.
   Optional: the faint parcel-grid/lot-line data-URI motif in the desktop gutters only
   (4% ink max, hidden under 480px, cut without debate if it reads as pattern). All
   background/absolute decoration: zero height added, fold and CSS entrance untouched.
   Verify 390x844 fold after.
2. **Why Choose card layering** (dark band). Vertical surface gradient (ink-2 to ink-3),
   2px brass-2 top hairline, oversized ghost of each card's icon at 4-6% opacity anchored
   lower-right, icon discs to w-16 with radial rim, hover -3px lift with shadow-pop. Apply
   the existing `.contours` atmosphere to the band (and footer, for a bookend).
3. **Aerial band rescue** (`index.astro:102-105`). Replace the flat white/55 veil with an
   art-directed two-layer scrim: vertical paper gradient (~90% over the headline zone
   falling to ~20% behind/below the card) + a pine multiply layer at 8-12% pulling midtones
   toward brand blue while golden highlights stay warm. Remove the H2 text-shadow hack.
   Optionally regenerate the aerial (asset A1 below) so pale sky sits behind the headline.
4. **Credibility card plaque**. Logo seated on a paper chip with hairline ring + faint
   inset shadow (reads as a mounted seal, not a floating PNG); vertical hairline divider
   between logo and content columns on sm+; roof-check SVG bullets (Phase 1.4).
5. **Discover section photo mount**. 2px pine/20 offset frame behind the house photo
   (shifted ~10px down-right), explicit width/height attrs on the img.
6. **FAQ + final CTA staging**. FAQ cards get the cascade treatment in Phase 4.3; the
   final CTA button gets a closing moment: soft radial spotlight glow behind it, flanking
   hairlines, size bump. Behind the block: an oversized single-path Texas outline in pine
   at 5-6% opacity offset right per rule of thirds (aria-hidden), and a thin roofline
   contour divider above, its gable angle echoing the ILD logo. Texas becomes a visual
   claim, no words added. Any button pulse runs once on first visibility, never loops.
7. **Sticky CTA bar**. Upward soft shadow (0 -10px 30px ink ~25%), top border to cream/10
   (green button stays the only saturated element), --ease-lux entry, one-shot sheen sweep
   on first appearance (animationend cleanup, once per session).

## Phase 4: Motion layer (lazy spine, one signature per section)

1. **Lazy GSAP reveal spine** (`index.astro`). On window load: dynamic import of gsap +
   ScrollTrigger; bail entirely under prefers-reduced-motion; apply reveal classes FROM JS
   via `data-reveal` attributes (never hard-coded in markup, so a failed load can never
   hide content); ScrollTrigger.batch for grids; transform/opacity only; ~0.7s power3.out.
   Add content-visibility:auto to FAQ + Discover with the ScrollTrigger refresh hook.
   ~35KB gzipped, fully off the critical path; the Phase 1 font cleanup pays for it.
2. **Why Choose signature: icon stroke draw**. Staggered card rise (y:28, 90ms stagger) and
   each NEW bespoke icon (Phase 6) draws itself via stroke-dashoffset as its card lands.
   The band's only moving element.
3. **FAQ cascade + accent draw**. Cards rise/fade with 110ms stagger; each draws a 3px PINE
   left accent bar (scaleY from top, 0.4s after landing). Closing CTA reveals last and
   slightly larger. Reduced motion shows bars fully drawn.
4. **Discover signature: contained Ken Burns**. Photo scales 1.08 to 1.0 scrubbed on
   desktop inside the clipped frame; mobile gets a paused-until-in-view CSS drift. Headline
   group fades up, three checklist rows stagger from the left with the check popping per
   row, button reveals last.
5. **Section seam draws**. 1px brass-to-brass-2-to-transparent hairline at the top of Why
   Choose, Discover, and FAQ, scaleX 0 to 1 (origin left) as each seam crosses 80vh. Not on
   the hero, not on the photo band.
6. **Hero ambient (calm)**. The Phase 3.1 light field ships STATIC; at most a barely
   perceptible desktop drift, cut if it draws any eye during form filling. Optional
   last-priority polish, desktop hover:hover only: pointer-tracked border sheen on the form
   card (two CSS vars + masked gradient, ~10 lines JS after load), and magnetic hover
   (6px cap, gsap.quickTo) on the three anchor CTAs. Skip both if the build runs long.

## Phase 5: Post-submit pages (harmonize to the LP language)

1. **Thank-you: save-the-number contrast flip** (the page's one job). Flip the "Watch for
   the text" section to the dark ink band treatment (bg-ink, cream text, contours) and make
   the phone card the ONE white object on it, elevated with --shadow-pop: brass-2 hairline
   across the card top, small ILD mark top center, number at clamp(2.2rem,5vw,3.4rem)
   tabular-nums with a brass-2 underline swell on the tel hover. Stitches the page into the
   LP's white/dark/white rhythm.
2. **Arrival moment, CSS-first**. Rebuild the seal draw as pure CSS keyframes (the current
   GSAP-only version is invisible if JS fails and animates for reduced-motion users, a real
   defect). Enlarge to ~112px with a second faint concentric ring and a one-time radial
   bloom behind the heading. Then a GSAP timeline (behind the same window-load dynamic
   import) sequences around it: headline/subhead fade up, chips stagger in on insertion
   (60ms), phone card settles, proof tiles stagger on scroll. Count-ups ONLY on the two
   real numeric strings (100+ and $0); "Same day" and "15 to 25" stay static.
3. **Aesthetic drift fix**. Restyle the three mono-tracked eyebrows to the LP's proof-line
   treatment (0.78rem semibold uppercase 0.14em ink/45); drop the italic serif accent in
   the H1 (accent becomes color, not italics); remove the brass gradient top strip; teal
   appears exactly once, on the tel-link hover.
4. **Step-1 emphasis**. "Reply to the text" card goes white with a 1.5px teal border,
   elevation, and a filled teal numeral badge; steps 2-3 stay quiet paper-2 with outlined
   numerals; thin dashed connector line through the numerals (vertical rail on mobile).
   Design weight points at the one action that produces revenue.
5. **Specialist medallion**. Replace the bare "P" circle with a designed inline-SVG badge:
   brass tick-notched outer ring, navy disc with top-light gradient, bold cream "P",
   hairline inner ring. Card goes white with a brass top hairline. Nothing invented.
   (Alternative: use the ILD mark as the avatar.)
6. **Stat tile craft**. White cards, 20px stroke icons in the LP's 1.8 grammar
   (network / clock / calendar / struck document), values in tabular-nums with
   whitespace-nowrap + clamp so "Same day" and "15 to 25" never fracture at 390px, shared
   baseline across the row.
7. **Thank-you imagery** (two assets max). A3 dusk exterior (below) at 12-15% opacity under
   a paper scrim behind the three-steps band, lazy. One recraft-v3 spot illustration by the
   phone card: stylized phone with incoming message bubble, duotone sky grammar, bubble
   content as abstract dashes only, adapted to read on the new dark band (or living inside
   the white card), never competing with the number.
8. **not-yet page**. Retype H1/H2/titles/numerals to bold sans at the readability floors
   (current serif tracking-tight violates the -0.008em rule); italic accent becomes a
   brass-2 color accent. Draw the path: vertical brass rail connecting the five move cards
   through numbered nodes, terminating at the "When you cross 620, come back." card styled
   as the destination (teal border, stronger elevation). Swap the alarm glyph for a calmer
   route/signpost pictogram. Hard-exit logic untouched.
9. **call-prep page**. Purge the pre-recolor palette: cards from #fffdf6 to white with
   var(--line-ink), all rgba(15,35,28,...) inks to the blue-slate tokens, headline to bold
   sans with color accent, backdrop to a quiet paper-2 to paper-3 gradient desk surface,
   Print button docked to the sheet edge. @page/@media print rules untouched.

## Phase 6: Generated assets (fal), one style lock

Style lock for every photo prompt: warm low sun, muted natural grade, slight film grain,
no people, no signage or readable text, palette anchors sky #22a0dd haze, amber highlights,
#122431 shadows. Serve as q70 webp, ~140KB.

- **A1, aerial regen (flux-pro)**: "high aerial drone view over a modest Texas suburban
  rental neighborhood at golden hour, long warm shadows on rooftops in the lower two
  thirds, pale hazy sky filling the upper third" (headline sits on the pale sky).
- **A2, qualify house re-shot (flux-pro)**: "single-story brick Texas rental home under a
  mature oak, late golden hour side light from the left, house on the left-third
  intersection, 4:3."
- **A3, thank-you dusk (flux-pro)**: "Texas single-family rental at dusk, warm interior
  light glowing in two windows, deep blue-hour sky" (quietly says someone is home and
  reachable).
- **Icon suite (recraft-v3 for sketching only; ship hand-tuned inline SVG paths)**: Why
  Choose trio (struck tax-return sheet; house key over calendar tile; three ascending
  property tiles breaking a dashed ceiling), form goal trio with the house gable echoing
  the ILD roofline, property-type + credit-arc glyphs, roof-check micro-mark.
- **TY spot illustration (recraft-v3)**: phone + message bubble, duotone, abstract dashes.

## Deliberately rejected (do not resurrect)

- Pinned/scrubbed 60vh lender-band build: scroll-jacking between the form and the CTAs.
- Count-up on "100+ lenders" in the LP credibility card: flirts with gimmick on the
  central trust number (thank-you tiles get it instead, real strings only).
- Infinite CTA pulse, brass hairline on the sticky bar, green section-heading underlines,
  dot-grid hero gutters as a second texture, propagating the brass top strip as a brand
  signature (it is legacy dialect being removed from thank-you).
- Any generated human photo for Paul/Mike: implies real staff, prohibited. Initial
  medallion until Paul supplies a real headshot.

## QA gate (before any deploy)

1. `npm run build` zero errors after each phase.
2. Three screenshot passes minimum (desktop + mobile + form states), fold check at
   390x844: full step 1 above the fold, every phase.
3. prefers-reduced-motion pass: transforms dead, content visible, seal/bars in final state.
4. Lighthouse mobile on built output, median of 3 runs: 90+, or the heaviest technique
   ships dead last or not at all.
5. Re-run `node tools/gtag-test.mjs`, `node tools/tcpa-test.mjs`, `node tools/step-walk-qa.mjs`
   (layout changes touch their selectors' surroundings).
6. Update `tools/shoot.mjs` / `shoot-live.mjs` form-walk labels (still clicking the dead
   8/19 labels "Buy a rental" / "Making offers"; current flow uses "Purchase" etc.).

## Back-port to the master template (after ILD ships and Tanner approves the look)

Generic wins that belong in `clients/dscr-funnel-template/`: font cleanup, card recipes,
green-action grammar, selected-state tap feedback, TCPA container restyle, slider
modernize, step height tween, lazy reveal spine pattern, CSS-first seal, stat tile
nowrap/clamp fix. Client-specific (stays here): ILD palette, Texas watermark, roofline
divider, icon motifs, photo set.

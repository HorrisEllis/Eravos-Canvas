# spec_id: eravos.themes · version 1.0.0 · phase P69 · status mapped (not built)
# "maybe add a new theme and add a options · Apply its theme" (the v10 FINAL look, as a choice) ·
# "stop changing the style" — so: the current look stays the default and is frozen; v10 is a second theme you pick.

## Rule (binding on every session)
  The look changes ONLY through a theme. No session restyles the current theme or v10 unless the user asks for that
  change in words. New UI uses the theme tokens (below), never its own colours or fonts.

## Themes
  current   the look today (canvas/runtime/eravos.css + domain css) — default, unchanged
  v10       ERAVOS v10 FINAL (his uploaded ERAVOS_v10_FINAL.html), read from its own CSS:
    colours   bg0 #010308 · bg1 #060a12 · bg2 #0b1020 · bg3 #101828 · bg4 #161f30 · bg5 #1c2738
              borders b1 #182035 · b2 #243048 · b3 #2e3d58 · b4 #3a4e68 · text #eef4ff · dim #4a6080 · dim2 #6a88a8
              accent #00ff88 (green) · accent2 #00d4ff · accent3 #ff2266 · accent4 #aa44ff · amber #ffaa00 · red #ff2244
              pink #ff44aa · orange #ff6b00 · lime #aaff00
    type      Orbitron 600/700/900 (logo, window titles, page and section headings: caps, .2em tracking)
              Share Tech Mono (values, labels, readouts) · Rajdhani 500/600/700 (body, buttons: caps, .1em tracking)
              bundled in canvas/runtime/fonts/ as woff2 (OFL; licences in LICENSES/) — no network, works in the exe
    shapes    hairline b1/b2 borders, 3–4 px corners, flat panels on bg1/bg2, tab bars with a 2 px accent underline,
              knobs: a recessed disc (radial bg4→bg1, 2 px b3 ring, inset shadow) with the existing arc on top,
              faders: 10 px b2 track, accent fill, a bg4→bg5 thumb ringed in accent
    texture   a 2 px scanline overlay (4 % black) and a low green floor glow (body::before/::after, pointer-events none)
    motion    scanline sweep on the top bar's bottom edge · padPop on a hit · beatFlash (inset accent glow) on the
              beat · beamFly on a wire/send · the existing sound-reactive accents drive every glow (--acc / --tool-level)
  Reduced motion: no sweep, flash or pop; colours still follow the sound, calmly.

## How (domain-free runtime)
  canvas/runtime/themes.js → window.Themes { list(), get(), set(id) }; the choice in localStorage 'eravos.theme'
  an inline line in canvas/index.html's <head> sets <html data-theme> before first paint (no flash of the other look)
  canvas/runtime/theme-v10.css: every rule scoped html[data-theme="v10"] — token overrides on :root first, then the
  element rules (top bar, windows, groups, knobs, faders, buttons, segmented, selects, pages, ＋ Add, scrollbars).
  Domain css (music.css …) keeps using the tokens, so it follows; anything hard-coded found on the way is moved to a token.
  ⋯ Options › "◐ Theme: Current / v10" (cycles; remembered). ERAVOS.exe and the web build: identical (same files).

## Acceptance
  switching is instant and survives a reload with no flash · every window, page, menu and the top bar take v10 ·
  fonts load from disk with the network off · boundary test (no domain words in theme-v10.css / themes.js) ·
  screenshots of: canvas with 3 tools, a tool page, a suite page, ＋ Add, the piano roll — sent before merging

## ADDENDUM 2026-10-30 (3.76) — previews for his pick (nothing applied)
Seven candidates rendered from the real app (token overrides only): current (Neon Lab) · Studio Calm · Graphite + Amber · Blueprint ·
Midnight Synthwave · v10 Terminal · Paper (light). Screens: first screen, canvas with a Synthwave song, ＋ Add, Retro Poly's page.
Finding: ~600 hard-coded colours in CSS and ~1000 in tool JS ignore the tokens (pink buttons stay pink; Paper shows black boxes).
Before any theme ships: move those onto the tokens, then a theme is one file. The current look stays the default until he chooses.


# ADDENDUM 3.72–3.77 (2026-10-24 … 10-30) — the look kit and the living UI
# 3.72 LOOK KIT ("all of them pro-plugin look. the whole ui"): same controls, class names and SIZES (the timeline tests measure them) —
#   only the drawing: knobs with a shaded cap (#uk-cap, defined once), pointer and glowing value ring, a moving knob's swing as a violet
#   outer arc; lit segmented strips; LED toggles; machined buttons; recessed fields and LCD numbers; metal fader caps; drawn displays as
#   recessed screens; windows and sections as a chassis with inset panels and mono caps headings. canvas/runtime/eravos.css + ui-kit.js.
# 3.73 LIVING: --lvl (the mix; inside a window its own sound, or what it plays, or the mix) drives accent text glow, labels and values
#   warming to the accent, LCDs, panel edges, drawn displays. Fluid: values set from outside glide, keys/strips/faders ease, tabs and
#   pages slide in, windows fade in, sections reflow (container queries). Square pads.
# 3.77 REACTIVE COLOURS — Off · Static · Changing · Custom, Amount, custom colours (low end · top · hits) + palettes:
#   colourFor(colour, k, {mode, shift, colors, low, high, pulse}); EVERY inline colour variable on every element in a window reacts (base kept
#   per element; a base the tool changes is taken up); Changing turns each window by ITS own spectrum, hits and drift (--win-shift); Custom
#   leans each colour toward the nearest of yours. Off stops everything, the older UI.alive layer included. Per tool: _react on every music
#   tool ({mode: follow|off|static|changing|custom, amount, colors}) set in its ⚙ settings, saved with it, wins over the app's (even Off).
#   The panel: core/react-panel.js (⋯ Options → Reactive colours, and every tool's settings) — mode cards with live previews of the real
#   colour code, Amount, swatches, palettes. Tests: p58, p73-living, p77-reactive-modes. Numbers: these are main's names for this work (3.71 Motion + Perform, 3.72 look kit, 3.73 living UI, 3.76 Deep Sub + tool zips, 3.77 Destroyer + reactive modes + audit); the Pattern Library's 3.71–3.73 and 3.76 share numbers — tell them apart by title.

## ADDENDUM 2026-10-31 (3.80) — the reactive colours reach every surface (asked, not a restyle)
  Asked: "i love what's in the menu, but nothing in the actual theme changes, and it's supposed to be all the colors in the canvas,
  tools, ui, anywhere." The look at rest is unchanged (every value below is restored exactly in silence and with Off).
  tools/music/core/sound-css.js SURFACES: --bg .10 · --bg2 .12 · --panel .14 · --panel2 .16 · --chassis .14 · --chassis2 .16 · --well .10
  · --grid .50 · --line .45 · --line2 .50 · --dim .25 · --faint .30 — each = mix(its base, the colour of the moment, mix level × share),
  written with the palette (at most 10× a second). The colour of the moment: Changing — the accent turned by the wheel shift; Static —
  the accent, lit; Custom — your low ↔ top colours by where the sound sits, toward your hit colour on each hit.
  New token --grid (#1a2533, the canvas dots — was hard-coded; same colour) so the canvas grid reacts too.
  Test: tests/p77-reactive-modes.test.js "3.80 the surfaces react too …".
  Start screen: the featured song cards (.hero-card, "Make a song for her", "Future Bass song") in Vagal's violet (#8844ff), the device
  look, side by side (.hero-row), a Start pill, a slow breathing glow (none for reduced motion) — asked: "remake those pink sections".
  3.81 the featured cards' icons: small SVG paintings (tools/music/data/featured-art.js), unframed with soft corners (asked: no frame) — the
  recipe's featured.art; .hero-card .big.art 168 × 109; .tw twinkle · .flow / .swirl moving strokes · .shim (none for reduced motion).
  .hero-go: a round pill (999px) in the dawn gradient #ffb36b → #ff6fa8 → #b06bff (asked: "the buttons, too sharp, make them round and the color").

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

## ADDENDUM 2026-10-26 — "okay, what happened to theme?" (and before it: "the ui looks bad")
  What happened, from the history: P69.1 (this spec) was never built: there is no themes.js, no theme css, no Options switch on main.
  Meanwhile another session restyled the CURRENT look directly: 5697b50 "The look kit: pro-plugin controls everywhere" and 95614cb
  "Living UI, square pads, fluid controls" (3.72/3.73 in its numbering), merged to main on 2026-10-26 in PR #48 on his "merge any other
  branches". That broke the rule above ("the look changes ONLY through a theme"): the default look changed without a theme.
  Fix (phase T, replaces P69.1):
    T1 three themes, nothing deleted:
         classic  the look on main before 5697b50 (its css restored, scoped html[data-theme="classic"])
         studio   the look kit as merged (scoped html[data-theme="studio"])
         v10      as specified above
       which one is the DEFAULT is his call (TO CONFIRM). Until he answers: classic, the look he had before he said "the ui looks bad".
    T2 themes.js + the no-flash line in <head> + ⋯ Options › Theme (Classic · Studio · v10), remembered; screenshots of all three
       (canvas with 3 tools, a tool page, a suite page, ＋ Add, the piano roll) sent to him before merging.
    T3 a test that fails when a commit changes a theme's look outside its own theme file (the css of a theme is hashed; a change to
       a hash needs a spec addendum quoting him).
  Acceptance as above, for three themes.

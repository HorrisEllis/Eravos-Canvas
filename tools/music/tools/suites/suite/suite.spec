# spec_id: eravos.suite · version 1.0.0 · status built · template eravos.tool/1 (sound flavour) · map eravos.phase48-map P48.5b
# James, 2026-10-21: "like how there is 4 wub tools, but no primay system. like i want each tool to have its components as tools,
#  then they all connect to the suite, but can be mixed and matched."
identity:
  id: eravos.suite ; label: Suite (the window shows the suite's own name) ; domain: music ; category: suites (Suites)
  purpose: a suite's own window, the primary system. Every part stays its own tool, and every part ends here.
ports:
  in:  in (audio, every output part's last sound) · mod.level
  out: out (audio, Master unless wired on)
params: suite (a suite id, hidden) · scene (the last scene loaded, hidden) · level 0..1.5
behaviour (the logic is canvas/runtime/suites.js, window.Suites, domain-free):
  - members are read from the wires: every window joined to this one (directly or through each other), plus their mods
  - Parts: each part's role, what it does, and its state (here and connected / inside <host> / not here / not installed); ＋ adds one
    part, wired by the suite's wiring and (an output part) into this window; ↗ goes to it. "＋ Build the whole system" adds every
    required part, then the starter scene. "Mix in" offers every part of every other suite: it joins by the first ports that fit
    a member, else into this window. A tool wired in by hand shows as "mixed in".
  - Scenes: Load sets every part here (preset + params), opening a missing required part first
  - Wiring: each wire of the suite, plus each output part → this suite: ✓ on the canvas, · possible, — a part missing
  - a keyboard (it grows with the window, P48.7) plays every part here with a note input, except parts marked notes:false
  - no sound of its own: silence in, silence out
acceptance (suite.test.js): the tool contract · Wub Lab builds whole: 4 required parts, osc→filter, rate→filter.mod_wub, filter and sub →
  suite, sound comes out of the suite window and nowhere else · one part at a time joins what is here · a scene sets every part ·
  a part of another suite mixes in and joins · pulling a wire takes a tool out of the system · every scene preset and every wiring
  hook exists (tests/p48-suites.test.js checks every shipped suite)

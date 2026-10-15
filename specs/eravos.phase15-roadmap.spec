# spec_id: eravos.phase15-roadmap · status planned · each phase ships green tests + regenerated specs (node build/specs.mjs) + one zip
axioms: nothing pretends to work (every feature has a test that would fail if it didn't) · nothing is repeated (each tool is its own first way of making sound) · the map/spec always expands (build/specs.mjs)
P15.1 living accents      window accent (--acc) breathes with each tool's own output level and pulses on the beat; muted tools dim; one shared analyser loop, paused off-screen
P15.2 style lab           genre + artist sound-design knowledge (techniques, tempo, key habits, arrangement, mix) as data; "build kit" mounts the matching tools/presets via recipe:run;
                          reference matcher = recursive section analysis of the user's OWN tracks (segment by novelty → analyse each section → nearest genre profile); never claims to have analysed commercial songs
P15.3 timeline ⇄ recorder MIDI-clip lanes in the Song Recorder (notes recorded from pads/keys), .mid export (MusicTheory.midi.write), drag clips from Clip Maker straight onto lanes
P15.4 canvas pro          snap-to-grid + alignment guides, box-select & move many windows, minimap, zoom buttons, per-window "bring into view", keyboard window switching
P15.5 genre presets       reggae / dancehall riddims for the Sequencer (one drop 75, steppers 80, dancehall 95), synthwave and witch-house starters; Vagal recipe reachable from the boot screen
P15.6 exe parity          desktop pack load test in CI (all packs install, every tool spawns, units expand); build.mjs bundles packs + one-zip release
P15.7 screenshots         DONE in P14 — build/shots.mjs renders every tool to docs/tools/*.png

# eravos.phase37-map.spec — production-grade pass, one tool at a time (mapped before building)
## User's words (3.36 screenshots: Add → Modes "2", Sounds → Kits)
  "why 2? · at 81% the modes need to pop up immediately · kits: no variety, no pad sounds — look into the drum pad,
  make it solid · no mixer · songs + tools that push ERAVOS to the extremes · packs for every major tool · presets
  that help make music · Skrillex 'Make It Bun Dem' is what the tool was created for — rebuild Dub Station ·
  study dubstep / EDM / electronic, DAWs, artists, pros · production-grade, novel, beautiful · one tool at a time ·
  least code tokens."
## Findings (from code)
  F1 Modes = 2 by design (3.26: Music Production + Lab). Not a bug.
  F2 No "%" exists anywhere in the code → "81%" is not ours. GAP: which screen shows 81%?
  F3 Kits: every kit = the same 13 synthesized Drum Machine voices re-tuned (data/kits.js) → variety ceiling is the
     voice engine, not the data. Pads: 1 model per voice.
  F4 Mixer exists (tools/mix/mixer, pack "Music · Mixer"). GAP: verify it shows in the exe's Add → Mix.
## Order (each = research → engine → presets/pack → tests → ship)
  1 Drum Machine (pads) solid: audit silent pads in the exe; 3–4 synthesis models per voice (808/909/tearout/
    acoustic/foley-like), layer + transient + saturation per pad; kits rebuilt on them (variety by model, not tune).
  2 Dub Station rebuild — target: ragga-dubstep fusion (Make It Bun Dem): siren, dub-delay throws (send/feedback
    ride), spring/plate verb, horn stabs, MC vocal chops, half-time 140 riddim, growl/reese layer. Technique only:
    no melody, lyric or sample of the record.
  3 Mixer: visible in exe + Music mode toolbar; group/aux defaults for bass music (sidechain bus).
  4 Packs + presets per major tool (wobble, reese, supersaw, pad forge, FX, master): genre-tagged, ear-checked ranges.
  5 Extreme songs: Sequencer/Song Engine songs that use automation, locks, fills at their limits.
## Rules
  Technique, not copies (no reproduced melodies, lyrics, samples). Code lean; UI as needed.

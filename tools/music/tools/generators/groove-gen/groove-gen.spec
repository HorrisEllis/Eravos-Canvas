# spec_id: eravos.groove-gen · version 1.0.0 · status built · template eravos.tool/1 · map eravos.phase48-map P48.10 · suite music.edm-lab
# James, 2026-10-21: "anything form a tool that other tools can use need to be decomposed, and grouped by the tool suite"
identity: id eravos.groove-gen ; label Groove ; domain music ; category generators
  purpose: EDM Lab 3.0's rhythm brain as a part. A painted density map (8 rows × 32 steps) × ENERGY × seed → drum hits on any drum tool.
ports:
  out: note_out (note:trigger to every instance wired from it, note 36 + pad index: kick 0, snare/ghost 1, clap 2, hat 3, openhat 4,
       perc 9, shaker 10) · step_out (groove:step { step, bar, time, stepDur, kick, snare, energy } every 16th)
  in:  transport_in · mod.energy
params: style [dubstep, ukg, house, neuro, breaks] (resets the map) · energy · swing · seed
behaviour: a row fires at a step when its density > 0 and seeded random < density × (0.35 + 0.65 × energy) (× 1.4 for kick and snare),
  which is EDM Lab's rule. Velocity is density × (0.6 + 0.4 × energy). Odd 16ths are late by swing × step. No sound of its own.
  paint {row, step, value, radius} · clear {row?} · reseed. The map is saved with the window.
acceptance (tests/p48-edm-lab.test.js): same seed and map → the same hits as EDM Lab 3.0 · notes reach only the wired drum tool ·
  energy 0 fires fewer hits than energy 1 · the tool contract (groove-gen.test.js)

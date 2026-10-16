# spec_id: eravos.p38.wub-lab · version 1.0.0 · phase P38 · status BUILDING (stage 1 built) · mapped before building
## User's words (2026-10-16)
  "need tools to make the sounds. like wobble bass like an editor. same with reese bass editor. … make a bunch of contrasting
  songs using the wobble, reese, lfo, traversal, way more precise and adjustable sequencer. each tool, fully editable, like the
  tools to make the sounds to make the tools. wub labs, none of these are toys … make tools that contrast each other, push
  eravos to its limit and then some, then spec inventions around the constraint … the most popular electronic, dubstep, edm,
  techno, modularity, oscillations … skrillex level … fast and wobble … a fuck ton of songs … one tool per tool, novel,
  beautiful … highest leverage, least friction."
## Findings (from the code, before building)
  F1 Already specced, never built: Wub Lab (planned/wobble-designer), LFO Pro with a rate sequencer (planned/lfo-pro), Contrast
     Engine, Resampler (planned/growl-resampler), Relations (planned/mod-matrix). Re-speccing them would be repetition → build.
  F2 The Sequencer is already deeper than it looks: per-step wobble rate, probability, ratchet, gate, slide, accent, knob
     locks, automation lanes, conditions, fill, evolve, per-lane length. "More precise" = surfacing + the gaps in P37.4
     (lanes that target a PART of a tool), not a new sequencer. One tool per tool.
  F3 Wobble Bass's wobble had 4 fixed shapes and no rhythm of its own; the Reese has no drawable movement at all.
  F4 Constraint: Web Audio native nodes + AudioWorklet (already used by 8 tools). No oscillator hard sync, no native
     wavetable/wavefolder oscillator → those need a worklet voice (stage 3). That constraint is the invention seed (§I).
## Rule: one tool per tool
  Wub Lab is NOT a second wobble synth: it is Wobble Bass, grown. LFO Pro replaces LFO (its spec says so). Reese editor = the
  Reese Bass, grown. Songs are data (Song Engine genres + Sequencer packs), not tools.
## Stages (each = engine → window → presets → tests → full suite green → ship)
  S1 BUILT 3.38  Wobble Bass 3.0: drawn wobble shape (points + bends + snap), wub-rate sequencer (a rate / shape / hold / stop
                 per step on the bar grid), vowels UH AE IH ER, 10 presets. 7 tests; suite 816/816.
  S2             Reese Bass editor: drawable detune/comb movement, a voice-spread editor (per-voice detune + pan), the same
                 step-rate roll driving comb + filter (one shared rate-roll widget, not a copy).
  S3             Wub Lab voice (worklet): 2 wavetable oscillators (morph, warp), FM / ring / hard sync between them, wavefolder,
                 distortion stack (shaper · fold · crush) + OTT-style 3-band upward/downward compression; RESAMPLE to a
                 wavetable (the growl-resampler loop). Native-node path stays as the light mode.
  S4             LFO Pro (planned/lfo-pro): drawn shapes (the S1 editor), rate sequencer, many targets each with depth/curve.
  S5             Contrast Engine (planned/contrast-engine): source switching, gaps, flips, stutters + contrast score.
  S6             Songs: a "Bass Lab" song pack — many contrasting songs built ONLY from S1–S5 tools at their limits (riddim,
                 brostep, tearout, complextro, neuro, half-time, colour bass, 140 dub, juke/footwork, hard techno), each
                 a different contrast recipe; technique only — no melody, lyric or sample of any record.
## I. Inventions around the constraint (to research and spec at S3 — listed, not designed yet)
  I1 Fold-as-sync: hard sync is impossible natively → a worklet phase-reset oscillator, or fake it with a fold stage whose
     drive follows the pitch ratio (cheaper, different character — measure both).
  I2 Drawn-shape → wavetable: the S1 drawing used as an oscillator cycle at audio rate (one editor, two time scales).
  I3 Grid-owned phase: S1 made the bar grid own the wobble; extend so ANY tool's motion can be owned by a rate roll (S4).
## Gaps (ask before building the stage they block)
  G1 S6 needs a listening pass — "studio quality" is judged by ear; ERAVOS can measure loudness/spectrum but not taste.
  G2 S3 CPU budget: how many Wub Lab voices on the target PC? (mono today; poly × worklet costs).

## Requests 2026-10-16 (2) — logged, in build order
  "i want to build her a song. from my heart but im not good at this." — the goal every item below serves.
  R1 Drum Machine: "the presets are worthless, the pad sounds are absent beyond default." FINDING (code): every voice has ONE
     synthesis recipe; a pad can change only tune/decay/level/pan/drive; every kit in Sounds = the same 13 recipes re-tuned
     (also P37 F3). → Drum Machine 3.0: several synthesis MODELS per voice (kick 909/808/punch/tearout/thump/zap …) + sound-
     design knobs per pad (tone, snap, sweep, body); kits and presets rebuilt on models. NEXT BUILD.
  R2 Presets, packs and sounds inside each tool's ⚙ Settings (browse, audition, switch packs on/off, make your own).
  R3 A way to make sounds for every tool (sound-design surface per tool; Wobble 3.0 drawn shape = the first).
  R4 Sequencer: "four on floor is terrible" — rewrite the starter patterns; P37.4 (lanes that reach inside a tool).
  R5 Timeline: "hard to use, scrolling up, scrolling down, cluttered" + "when tools are wired in, should add to the timeline?"
  R6 Catalog: each tool's thumbnail (preview.png exists per tool) + its packs listed under it.
  R7 "Tranki" by Skrillex — how it fights the rhythm → Contrast Engine (S5), technique only.
  R8 Fuck-ton of packs + presets per tool; the most contrasting songs possible (S6); invent something new (§I).
  R9 "the arrows on each tool to connect them, and the lines on the sequencer" — GAP: what is wrong with them? (asked)

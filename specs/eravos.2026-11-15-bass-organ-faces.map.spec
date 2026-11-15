# specs/eravos.2026-11-15-bass-organ-faces.map.spec — Bassline + Wobble Bass, Reese absorbs Deep Sub, Groove and EDM Lab made consistent, the Gothic Organ's irrational ranks.
# The ideas and the calls are James's; the reading of them, the cut into phases and the order are the coder's, said where they are.
# Map and spec first (axiom 8). Nothing here is built. Every visual change is shown to him first (rule); every sound change proves itself with the null.

origin: >-
  James, 2026-11-15 07:26 (verbatim), with my_song.wav and the tool index open at row 58:
  "this is bassline and wobble bass. start with the maps and dag. then expand the reese bass to encompass the deep sub. groove looks horrible,
  and edm lab. like so much look great but they aren't consisent. Gothic Organ (1,498) was supposed to be like the hangining tree by queens of
  the stone age. like the beginning irrational freqeuncies. also make it bun dem by skrillex is so close but its like wobble bass is more
  centered in terms of sound, like its clear and not so electric sounding. like making it softer maybe?"

his_song_measured:   # my_song.wav (Bassline + Wobble Bass), 12.5 s, 48 kHz — measured 2026-11-15, numbers only
  stereo: "mono: left and right are identical (side −240 dB, correlation 1.000). This is the 'centered' he hears."
  tempo: "≈134 BPM (beat tracker)"
  bass_pitch: "median f0 ≈135 Hz: the line sits around C#3, not in the sub octave"
  spectrum: "20–60 Hz 0.1 % · 60–120 Hz 9 % · 120–250 Hz 34 % · 250–500 Hz 14 % · 500–2 k 30 % · 2–6 k 12 % · 6–20 k 1.8 %"
  reading: "clear and not electric = mono, almost nothing above 6 kHz, no sub below 60 Hz, a smooth (not noisy) spectrum (flatness 0.0018). The body is 120–250 Hz and the vowel 500–2 k."
  peak: "−1.8 dBFS peak, −14.9 dB RMS"

phases:

  BW0_maps_and_dags:   # "start with the maps and dag"
    what: "This map. Bassline's DAG written in full (today 1 component: progression); Wobble Bass's is written (19 components, specs/eravos.workbench.spec WB1)."
    depends_on: []
    files: [specs/eravos.2026-11-15-bass-organ-faces.map.spec, tools/music/tools/bass/bass-gen/bass-gen.spec]
    exit_test: "node build/spec-dag.mjs lists Bassline's components beyond progression (pattern-store, scale-key, note-follow, humanizer: to confirm against its code)"

  RD1_reese_takes_deep_sub:   # "expand the reese bass to encompass the deep sub"
    what: >-
      Reese Bass gains Deep Sub's layer: its DAG becomes Reese's 9 components + Deep Sub's own (osc-sub, waveshaper, phase-correlation, ducker,
      envelope-follower) = 14. A SUB section on Reese's face (Deep Sub's controls, by element: pure mono sub, 808 drop / slide, phantom
      harmonics). Deep Sub's 15 presets move into Reese as a 'Deep Sub' pack. Deep Sub stays as a name that opens Reese with that pack, so old
      projects open.
    why_measured: "the novelty report: 87 % of Deep Sub's presets are CLOSE to a Reese preset, and 12 of its 15 are twins of each other."
    depends_on: [BW0_maps_and_dags]
    files: [tools/music/tools/bass/reese-bass/, tools/music/tools/bass/sub-engine/tool.json, tools/music/tools/bass/reese-bass/packs/deep-sub/]
    exit_test: "Reese with the SUB section off nulls against Reese today (all its presets); each Deep Sub preset played through Reese's SUB nulls against Deep Sub today (≤ −80 dB) or is listed with its difference; the 12 twins are folded to 3 (his ear picks)"
    preview_first: "the SUB section on Reese's face, shown to him before it is built"

  GF1_groove_and_edm_lab_consistent:   # "groove looks horrible, and edm lab … they aren't consisent"
    what: >-
      Both faces in the grammar the good tools share (Wobble Bass, Retro DCO, Piano): titled cards, controls inside cards, one control kind per
      job (ENERGY is a knob in Groove and a slider in EDM Lab today), no empty panel at rest (EDM Lab's BASS panel), one primary button.
      The design check passes both today (all six rules 0), so it misses this: three rules added — D7 every control sits in a titled card, D8 no
      empty panel at rest, D9 the same job has the same control across tools.
    structure: >-
      Reading, to confirm: Groove is 'EDM Lab's rhythm, as a part', and they repeat 1,209 tokens of each other's code. By axiom 3 (a suite is a
      tool with its components wired), EDM Lab becomes Groove + Bassline + Chords wired, and its face is synthesised from theirs — one face
      grammar, no copy.
    depends_on: []
    files: [tools/music/tools/generators/groove-gen/groove-gen.ui.js, tools/music/tools/generators/edm-lab/edm-lab.ui.js, tests/design-check.mjs]
    exit_test: "D7–D9 written and failing on today's Groove and EDM Lab; both previews approved by him; after the change D7–D9 at 0 and nothing else worse"
    preview_first: "both faces, before and after, shown to him"

  GO1_irrational_ranks:   # "like the hanging tree … the beginning irrational frequencies"
    what: >-
      Today every Gothic Organ rank is a harmonic ratio (0.5, 1.5, 1, 2, 3, 4, 5, 6, 8 — gothic-organ spec). The sound he means is inharmonic:
      partials at irrational ratios that never line up, so they beat and drift. Add IRRATIONAL ranks beside the drawbars: partials at ratios
      such as √2, φ, √3, e/2, π/2 (a set, chosen by ear), each with a level and a slow drift; a BEND that moves the whole set between harmonic and
      irrational; the existing breath and celeste act on them too.
    depends_on: []
    files: [tools/music/tools/genre-instruments/organ/organ.engine.js, tools/music/tools/genre-instruments/organ/organ.spec]
    exit_test: "with the irrational ranks at 0 the organ nulls against today's (every preset); a test measures each rank at its stated ratio ± 0.5 Hz; a 'Hanging' preset he approves by ear"
    note: "the reference is his description of a feeling (an eerie, unresolved opening), not a copy of the recording: no sample of it is used (No toys)."
    preview_first: "the IRRATIONAL ranks on the organ's face"

  WB2s_wobble_reference:   # "make it bun dem … wobble bass is more centered … clear and not so electric … making it softer maybe?"
    what: "OPEN — two readings, his call (below). Nothing changes until he answers."
    depends_on: [BW0_maps_and_dags]
    files: []
    exit_test: "his answer to WB_S1"

decisions:
  WB_S1_which_way:
    status: OPEN (his)
    readings: >-
      (a) Wobble Bass should get closer to that track: wider, grittier, more 'electric' (stereo upper mids, more distortion and air above 6 kHz,
      a real sub under it) — while keeping its clear centre. (b) Wobble Bass is already right — centred, clear, not electric — and what he wants
      is a softer version: rounder, less bright. Measured fact either way: his song is fully mono, has almost no energy above 6 kHz and none below
      60 Hz.
  RD_D1_deep_sub_name:
    status: OPEN (his)
    readings: "keep 'Deep Sub' in the library as a preset pack name that opens Reese (proposed), or retire the name entirely."
  GF_D1_edm_lab_as_suite:
    status: OPEN (his)
    readings: "EDM Lab rebuilt as Groove + Bassline + Chords wired (one face synthesised), or kept its own tool with Groove's face grammar only."

order: >-
  Coder's reading, to confirm: BW0 (maps) → RD1 (measured duplicate, sound-only, proves itself with the null) and GO1 (one engine, null-safe)
  side by side → GF1 (previews first, his eye decides) → WB2s once he answers WB_S1.

## ADDENDUM 2026-11-15 09:50 — his answer to WB_S1, and the Song Recorder (nothing above is changed)
# his words (verbatim): "I want more like full dynamic range. Like I want like nothing that it cannot do wobble wise. … I want like sharper, but I
#   want softer as well, right? Like I want like grittier, like gainier, but I want like clearer and like more like … signal to noise … like it's
#   running through an amp or something" · "Also, the song recorder would be nice. Be able to open that song in the workshop and be able to
#   actually like fully edit that"
WB_S1: "ANSWERED — both ends: (a) and (b) are one range, not a choice."
WB2s_full_range:
  what: >-
    An AMP stage on Wobble Bass that goes from soft to savage while staying clear: split the signal (multiband-splitter) so the sub and body stay
    clean and centred while only the mids and top are driven; drive through the existing waveshaper / clipper / saturator-tube; a cabinet
    (filter-svf) that rounds or opens the top; a noise floor held under −80 dB at every setting (clarity = no hiss, no aliasing: oversampled
    shaping). One CHARACTER control sweeps soft (round, low drive, dark cab) → sharp (bright cab) → gainy (high drive on the mids) without
    moving the sub, plus WIDTH (stereo-tools) for the top band only so the centre he likes stays mono.
  depends_on: [BW0_maps_and_dags]
  stands_on: "waveshaper (planned), clipper (comes out of Wobble), saturator-tube ✓, multiband-splitter (planned), filter-svf ✓, stereo-tools ✓"
  files: [tools/music/tools/bass/wobble-bass/wobble-bass.engine.js, tools/music/tools/bass/wobble-bass/wobble-bass.spec]
  exit_test: "CHARACTER at its default nulls against today (every preset); at every CHARACTER the band under 120 Hz stays within 1 dB of today's and mono; the noise floor with no note is under −80 dB; a preview of the AMP card shown first"
SR1_song_into_the_workshop:
  what: "A take from the Song Recorder opens in the Workshop: its tracks as layers, its notes as notes (the Workshop's notes kind), every part editable and played back through the same tools."
  depends_on: []
  stands_on: "the Workshop's notes kind (W2a, 3.152) and layers (3.175); the Song Recorder (arrange/song-recorder); .erv layers (3.133)"
  files: [tools/music/tools/arrange/song-recorder/, tools/music/tools/arrange/timeline/timeline.workshop.js]
  exit_test: "a recorded take opens in the Workshop, a note moved there plays moved, and saving gives the take back changed"
  open: "his WAV (my_song.wav) is audio, not notes: opening audio as editable notes needs audio-to-notes (pitch + onset detection) — mapped as its own phase if he wants it (SR2)."

# ============================================================
# ERAVOS ORGANISM SPEC — EDM LAB (groove workstation)
# spec_id:      eravos.organism.edm-lab
# version:      4.0.0   (rebuild of 3.0.0 — "rebuild the edm into a complete toolset")
# phase:        P6 → P44
# resolves:     F-18(lab)
# status:       canonical
# ============================================================

identity:
  id: eravos.edm-lab ; label: EDM Lab ; icon: ⚗ ; accent: "#ff2266"
  comp_intent: >
    A groove workstation for people who don't know theory: paint where the drums are busy, turn TENSION and ENERGY, and
    an 8-lane kit, a bassline, chords and a lead follow — always in key. Patterns A–D and chains, a 32-bar song mode,
    DROP / FILL / BREAK performance buttons, a sidechain pump, PRINT into a Sequencer and ⤓ MIDI out.
  novelty: >
    The only generative organism: probability-density rhythm, bass and lead derived from the map and the chords,
    tension-mapped harmony. Every voice is a pure function of (bar, step) — what you hear, PRINT and the MIDI file agree.

rebuild_rules (F-18):
  - no private clock: all timing from transport:tick
  - no duplicated synth engines from other organisms: the lab's voices are its own compact designs below
  - four separate out ports (rhythm · bass · harmony · lead) so each layer can go to its own channel

engines:
  PATTERNS: 4 slots A–D, each 8 kit rows × 32 steps density (0..1); chain off | A·B | A·B·C·D | A·A·B·C | A·B·A·C | A·A·A·B (2 bars each)
            fire if rand(seed, bar, row, step) < density · (0.35 + 0.65·energy) · Density (kick/snare × 1.4) — seeded, repeatable
            groove starters: ukg dubstep house neuro lofi techno trance dnb trap hardstyle breakbeat future moombah drill empty
            MUTATE nudges painted cells ±0.25 and wakes neighbours ; FILL: snare + perc roll on beats 3–4 of the next bar
  KIT:      Lab · 808 · 909 · Breaks · Garage · Techno · Lo-fi · Trap (kick pitch/sweep/decay/click, snare tone/noise, hat colour …)
            per lane: level 0..1.5 · tune ±24 st · decay ×0.2..4 · pan · mute · solo ; drum drive (tanh)
  GROOVE:   swing 0..0.6 · humanize (seeded ±8 ms, ±25 % velocity) · PUMP: every audible lab kick ducks bass/chords/lead (release)
  BASS:     styles follow kick · offbeat · rolling (fills between kicks) · octave pump · half-time · wobble (tempo-locked LFO 1/2…1/16)
            · acid (seeded 16ths, accents, slides) ; wave saw/square/sine/fm ; octave 0..3, cutoff (80 Hz–14.5 kHz), reso, env, drive, glide, sub
  HARMONY:  12 progressions ; bars/chord 1|2|4 ; TENSION voicing 0–0.25 triad · 0.25–0.5 add9 · 0.5–0.75 7sus4 · 0.75–1 cluster (tritone + b9)
            styles pad · stabs · offbeat · pluck · arp ; octave, brightness, width (detune), attack, release
  LEAD:     arp up / down / up-down · random · hook (seeded 2-bar phrase) · chord tones ; rate 1/4 1/8 1/16 ; octave, wave, bright, gate, glide, dotted-8th echo
  ARRANGE:  loop | song (32 bars: intro 8 no bass · build 8 riser + energy climb · drop 8 impact + full · break 8 chords + lead)
            DROP: armed → next bar starts a build of Build bars (1|2|4|8: riser, doubling snare roll), the last beat silent, impact after
  OUT:      PRINT → seq:pattern_suggest (drum lanes + bass lane, 2 bars, muted lanes skipped) ; ⤓ MIDI type 1, 96 ppq (drums ch10 GM, bass, chords, lead)

hooks:
  - lab.hook.out_rhythm / out_bass / out_harmony / out_lead: out ; audio
  - lab.hook.transport_in STD.transport_in ; lab.hook.theory_in STD.theory_in
  - lab.hook.print_out: out ; event_bus ; seq:pattern_suggest {target, track, steps}
  - lab.hook.drop_out: out ; edm:drop-fired {time}
  - lab.hook.mod_energy / mod_tension / mod_pump / mod_cutoff  STD.mod_in

presets: 20 factory (UKG Shuffle … Techno Warehouse, Trance Gate, Big Room Pump, Acid Line, Wobble Dubstep, Song · Festival Arc …), every one fully specified

ui:
  top: presets · pattern slots A–D (shift-click copies here) · copy to · FILL · BREAK · DROP · ⤓ MIDI · PRINT → sequencer
  macro strip: ENERGY · TENSION · Swing · Humanize · Density · PUMP · Pump release · section light (LOOP/INTRO/BUILD/DROP/BREAK)
  pages: RHYTHM (density canvas; lane name click = mute, shift = solo) · BASS (note ribbon) · CHORDS (tension wheel) · LEAD (ribbon) · ARRANGE (32-bar map) · MIX (8 lane strips + 4 outputs)

tests:
  - standard_tests (rhythm, bass, harmony ports non-silent; lead when on)
  - same seed + same map → identical hit list over 4 bars
  - every bass and lead style ⊂ scale ; on chord change bar, follow-kick bass root = chord root ; hook repeats every 2 bars
  - tension 0 → triad pitch classes ; tension 1 → includes b9 or tritone
  - DROP armed at bar 3 → impact at bar 5 beat 1, silence on bar 4 beat 4 ; Build bars 4 → impact 4 bars later
  - song mode: intro → build → drop (edm:drop-fired on bar 17) → break
  - chain A·B plays B on bars 3–4 ; copy A → C exact ; muted lanes absent from PRINT and MIDI
  - MIDI: valid type-1 header, drum note-ons = lab hits ; PRINT drum lanes = lab hits
  - every kit and every factory preset is audible

# ---- dependencies (generated by build/specs.mjs — do not edit by hand)
dependencies:
  mode: music   # Music Production
  toolbar_units: [music.engine, music.transport, music.tempo, music.key, music.meter]   # ui expansion when added: Audio engine · Transport · Tempo · Song key · Master meter
  services:
    - audio: Audio engine — makes sound
    - clock: Master clock & tempo — locks to the beat
    - key: Song key & scale — plays in key
    - mod: 4 modulation inputs — LFO / XY / Macro can move them
  inputs:
    - lab.hook.transport_in (transport:tick|transport:play|transport:stop) — ambient broadcast
    - lab.hook.theory_in (theory:key-change) — ambient broadcast
    - lab.hook.mod_energy (modulation · port mod.energy)
    - lab.hook.mod_tension (modulation · port mod.tension)
    - lab.hook.mod_pump (modulation · port mod.pump)
    - lab.hook.mod_cutoff (modulation · port mod.bassCutoff)
  outputs:
    - lab.hook.out_rhythm (audio · port rhythm)
    - lab.hook.out_bass (audio · port bass)
    - lab.hook.out_harmony (audio · port harmony)
    - lab.hook.out_lead (audio · port lead)
    - lab.hook.print_out (seq:pattern_suggest)
    - lab.hook.drop_out (edm:drop-fired)
  permissions: [audio_out, bus_publish, bus_subscribe, registry_read]
  works_with: [eravos.sequencer]

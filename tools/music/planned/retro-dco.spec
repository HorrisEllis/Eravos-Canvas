# spec_id: eravos.retro-dco · version 0.1.0 · status audited · extends:retro-poly · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (synthwave_retro) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.retro-dco ; label: Retro DCO ; domain: music ; family: synthwave_retro
  lineage: 1980s DCO polys: one stable oscillator per voice with sub and PWM, through a 24 dB filter and a bucket-brigade chorus
  family_from: late-1970s–80s analog and FM polysynths, film and game scores; revived as synthwave, outrun, darksynth, coldwave, vaporwave
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  osc-va · osc-sub · osc-noise · unison-stack · filter-svf · filter-ladder · env-adsr · lfo · ensemble-core · bbd-line · voice-allocator
adds (behaviour only this tool has):
  - per-voice-card variance (each voice its own filter/env offsets, seeded)
  - chorus modes I · II · I+II
  - poly-mod (filter env and osc B into osc A pitch/PW)
modes: poly · mono · unison · chord-memory
engines_0_1_0 (the original list, kept verbatim; each is covered by the components above or by adds):
  analog-oscillator · pulse-width-modulation · sub-oscillator · noise · unison · oscillator-sync
built_today (read from tools/music/tools/genre-instruments/retro-poly/retro-poly.engine.js, eravos.retro-poly 1.0.0 — the code is the source of truth; re-run the extract when it changes):
  ports: audio_out · note_in · midi_in · theory_in · transport_in · mod_in(cutoff) · mod_in(pwm)
  params (31):
    DCO: saw 0..1 · pulse 0..1 · width 0.05..0.5 · pwm 0..1 · pwmRate 0.05..8 Hz · sub 0..1 · noise 0..1 · drift 0..1 · octave -4..4
    VCF: cutoff 60..16000 Hz · res 0.3..20 · envAmt -1..1 · keytrack 0..1 · hpf 0..3
    ENV: fA 0.001..4 s · fD 0.01..6 s · fS 0..1 · attack 0.001..5 s · decay 0.01..6 s · sustain 0..1 · release 0.01..8 s
    FX: chorus [off, I, II, I+II] · unison 1..4 · mono (on/off) · glide 0..3 s
    ARP: arp [off, up, down, up-down, random, played] · arpDiv [1/4, 1/8, 1/16, 1/8t, 1/16t] · arpOct 1..3 · arpGate 0.05..1 · arpHold (on/off)
    OUT: level 0..1.5
component_mapping (where each group's code moves — phase 0; the move changes nothing: every factory preset nulls ≤ −60 dB):
  DCO → osc-va (saw, pulse, width) · lfo (pwm, pwmRate) · osc-sub · osc-noise · analog-drift via random-source + slew-lag (drift)
  VCF → filter-svf (→ filter-ladder as an option) · env-adsr (envAmt) · key track · filter-svf HP (hpf)
  ENV → env-adsr ×2 (filter fA/fD/fS, amp ADSR)
  FX → ensemble-core + bbd-line (chorus I / II / I+II) · unison-stack (unison) · voice-allocator (mono) · slew-lag (glide)
  ARP → NOT a Retro Poly part — the arp component shared with the Arp tool (pattern-store · clock-div · probability-gate). Today Retro Poly has its own arp: one of the duplications components_first removes
  OUT → level
depth_audit — gaps to full range (each new control defaults to the value that reproduces today's sound):
  - per-voice-card variance: each voice its own small filter/env/pitch offsets, seeded (seed-registry)
  - poly-mod: filter env and osc B into osc A pitch / pulse width
  - filter character choice: ladder with drive in the loop (filter-ladder) beside today's filter
  - chord-memory mode (chord-engine)
  - hard sync (osc-va sync)
  - a general LFO to pitch (vibrato), cutoff and PW beyond the PWM LFO (lfo)
  - velocity routing to cutoff and amp
  - its arp moves out to the shared arp component (sound unchanged; the Retro Poly window keeps the same controls through a link)
ports_target (added to today's ports; nothing removed):
  - mod_in for res, envAmt, sub, noise, drift, chorus mix (today: cutoff, pwm)
params_target: today's params unchanged + one control per gap above, named in the component that owns it (no duplicate controls across components)
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Chorus Glass Poly — square-pulse pads breathing through the twin-chorus modes
  - Five-Voice Brass Swell — poly brass with slow filter-envelope swells and poly-mod bite
  - Voice-Card Motion — eight-voice stacks where every voice drifts a little differently
  - VHS Dreams — soft PWM pads with worn tape wobble and rolled-off tops
  - Arcade Pulse — narrow-pulse arps and bleeps with fast decay
  - Analog Machine — mechanical sequenced basses, tight envelopes, ladder drive
  - Coldwave — thin detuned leads and cold, chorus-free minor pads
  - Neon Noir — dark poly-mod stabs and resonant night-drive basses
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

# ---- dag (generated by build/spec-dag.mjs — the map; re-run after changing assembles or a component spec; nothing above is touched)
dag:
  components: 11 it stands on · 6 of 11 built (✓)
  layer 0: bbd-line · ensemble-core · env-adsr ✓ · filter-ladder ✓ · filter-svf ✓ · lfo ✓ · osc-noise · osc-sub · osc-va ✓ · unison-stack ✓ · voice-allocator
  tool: eravos.retro-dco ← osc-va + osc-sub + osc-noise + unison-stack + filter-svf + filter-ladder + env-adsr + lfo + ensemble-core + bbd-line + voice-allocator
  build order: bbd-line → ensemble-core → env-adsr ✓ → filter-ladder ✓ → filter-svf ✓ → lfo ✓ → osc-noise → osc-sub → osc-va ✓ → unison-stack ✓ → voice-allocator → retro-dco
  shared with: bbd-line 2 · ensemble-core 5 · env-adsr 20 · filter-ladder 3 · filter-svf 40 · lfo 27 · osc-noise 7 · osc-sub 10 · osc-va 26 · unison-stack 15 · voice-allocator 4  (other tools on each)

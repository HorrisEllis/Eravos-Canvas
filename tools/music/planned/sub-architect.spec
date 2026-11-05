# spec_id: eravos.sub-architect · version 0.1.0 · status audited · extends:sub-engine · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (wub_bass) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.sub-architect ; label: Sub Architect ; domain: music ; family: wub_bass
  lineage: sound-system sub weight: sine sub, kick-phase alignment, small-speaker harmonics
  family_from: UK dubstep (mid-2000s), brostep (c. 2010), neurofunk (late 1990s on), riddim and tearout (2015 on), melodic and colour bass
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  osc-sub · osc-va · waveshaper · filter-svf · stereo-tools · phase-correlation · ducker · envelope-follower
adds (behaviour only this tool has):
  - phase-align sub start to kick transient
  - harmonic translator (adds 2nd/3rd for phones)
  - sub glide between notes with mono-safe phase
modes: pure · translated · glide
built_today (read from tools/music/tools/bass/sub-engine/sub-engine.engine.js, eravos.sub-engine 1.1.0 — the code is the source of truth; re-run the extract when it changes):
  ports: audio_out · note_in · midi_in · theory_in · mod_in(phantom) · mod_in(level)
  params (16):
    SUB: shape 0..1 · octave -4..1 · floor 12..45 Hz · keepRange (on/off)
    PITCH: drop 0..36 st · dropTime 0.005..2 s · glide 0..1.5 s
    TONE: phantom 0..1 · drive 0..1 · click 0..1 · tone 120..4000 Hz
    ENV: attack 0.001..1 s · decay 0.02..6 s · sustain 0..1 · release 0.01..4 s
    OUT: level 0..1.5
component_mapping (where each group's code moves — phase 0; the move changes nothing: every factory preset nulls ≤ −60 dB):
  SUB → osc-sub (shape 0 sine · 0.5 triangle · 1 rounded square, octave, floor, keepRange)
  PITCH → env-msseg (drop, dropTime) · slew-lag (glide)
  TONE → waveshaper (phantom = harmonic translator, drive) · osc-noise + env (click) · filter-svf (tone)
  ENV → env-adsr
  OUT → level
depth_audit — gaps to full range (each new control defaults to the value that reproduces today's sound):
  - kick-phase alignment: start the sub in phase with the kick transient — needs a kick input (trigger or audio) and onset-detector
  - sidechain duck from the kick (ducker), sub only
  - phase-correlation / mono readout (phase-correlation, stereo-tools) — prove the sub is mono-safe
  - slide modes for drill/dub (bend curves, legato only) beyond glide time
ports_target (added to today's ports; nothing removed):
  - trigger_in or audio_in "kick" for phase alignment and ducking
  - transport_in
  - mod_in for drop, tone, drive (today: phantom, level)
params_target: today's params unchanged + one control per gap above, named in the component that owns it (no duplicate controls across components)
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Rig Pressure — pure sine sub tuned for big systems
  - Phone Translation — sub with harmonics heard on small speakers
  - Kick-Locked Sub — sub starting in phase with every kick
  - Slide Weight — gliding subs for drill and dub
  - Square Floor — rounded-square sub for riddim
  - Breathing Sub — sub with a slow amplitude swell per bar
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

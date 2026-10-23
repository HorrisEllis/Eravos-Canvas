# ============================================================
# ERAVOS ORGANISM SPEC — BASS DROP BUILDER
# spec_id:      eravos.organism.bass-drop-builder
# version:      2.2.0   (2.1.0 + fully editable tension voice; 2.0.0 + tensionTone, P9 G-03)
# phase:        P6
# resolves:     F-18(drop)
# status:       canonical
# ============================================================

identity:
  id: eravos.bass-drop-builder ; label: Drop Builder ; icon: 🔻 ; accent: "#ff2266"
  comp_intent: >
    Build the moment of the track: tension → build → pause → drop,
    with Raven's voice placed exactly where it hits hardest. It
    plays its own riser/snare-roll/impact FX and conducts the rest
    of the canvas (patterns, master filter) on the bar grid.
  novelty: >
    Only organism that is a conductor: a section timeline that emits
    cues to other organisms and automates the master DJ filter, plus
    its own build-FX engine and a vocal slot with beat-aligned placement.

structure:
  sections (ordered, bar lengths draggable, min 0 except DROP ≥ 1):
    TENSION 4 · BUILD 4 · PAUSE 0.25 (fraction allowed: 1 beat) · DROP 8
  per section cues (all optional):
    patternCue: {target sequencer, slot}   → seq:pattern_cue at section start
    djFilter:   start/end values             → kernel setDJFilter ramp across section (via own automation, restored after)
    energy:     target edm-lab energy        → ui:config_change:<lab> {energy}
    mute:       list of channel instanceIds  → ui:config_change:<ch> {mute}
  run: FIRE → arms; begins at next bar (or 'now' at next beat); total length Σ bars; then returns to idle, cues 'after' pattern

fx_engine (own audio port 'fx'):
  riser:      noise → BP swept 200 Hz → 8 kHz + saw pitch rise 1–3 oct, length = BUILD bars, exp curve
  snare roll: accelerating 1/4 → 1/8 → 1/16 → 1/32 across BUILD, velocity crescendo, pitch up 0..12 st
  downlifter: after DROP impact, noise sweep down 1 bar
  impact:     sub boom (sine 50 Hz → 30 Hz, 1.5 s) + noise crash + reverse-cymbal pre-roll ending exactly on DROP bar
  tension voice (2.2 — fully editable; the 2.1 'lush' default was rejected by the user):
    one parametric voice, every value a TENSION-group param shown in the TENSION section editor:
      tensionTone off|pad|pluck · padLevel · tChords (hold i, i→VI, VI→VII, iv→V, i→iv, tritone; in key)
      tVoicing triad|sus2|sus4|add9|seventh|power · tOct · tWave · tVoices (unison) · tDetune · tWidth
      tAttack · tRelease · tSwell (0 = flat level, no build) · tPump (beat sidechain) · tRate (pluck)
      tCutoff → tCutoffEnd (equal = no filter build) · tRes · tMotion/tMotionRate (filter LFO) · tSub · tAir · tSpace (reverb send)
    sounds = complete settings of that group (ui:tension_sound): Mist (default: triangle i→VI sus2, flat,
      no build) · Low hum · Glass · Supersaw lift (old lush) · Rising plucks (old pluck) · Dread (old dark) · Silent
    off → silent; cue any canvas tool through the section's Sequencer/Pattern instead
    ui:tension_audition plays the voice alone (≤4 bars), toggles stop; never touches a run

Drop Builder 3.0 (3.33) — every part editable, voice first (spec eravos.phase33-map § D):
  VOICE panel at the top: drop her clip (panel or strip), ▶ hear, end-on-DROP, trim start/end, stutter, gain, low cut, throw.
  Section tabs, one full editor each (+ ▶ hear this part, length, what else plays here):
    TENSION tension voice (22) · BUILD riser (level, sound noise+saw|noise|saw|supersaw, rise oct, noise, curve, starts)
    + roll (level, sound snare|clap|hat|kick|tom, from 1/4..1/16, to 1/8..1/32, curve, pitch rise, starts) ·
    PAUSE gap sound (silence | reverse cymbal | vocal tail | sub swell), level, swell length ·
    DROP impact (level, boom pitch, boom length, crash) + downlifter (level, length) + after-drop pattern.
  Pointer mapping zoom-safe (UIKit.toContent). Tests: tests/p20-drop-builder.test.js.

vocal slot (Raven):
  source: asset hash from a sample-player (asset:ready) or dropped file directly on the slot
  placement: section + beat offset, or 'end on DROP' (auto-aligns so the clip ends exactly at drop beat 1)
  processing: gain, HPF, reverb throw at end (send tail), optional chop repeat (1/8 stutter ×N before drop)
  output: port 'vocal' (separate so it can go to its own channel)

config:
  bars per section ; startMode enum [nextBar, nextBeat] ; riserOct 1..3 def 2 ; rollCurve 0..1 def 0.6 ; impactLevel 0..1 def 0.8
  vocalSection enum ; vocalBeat float ; vocalEndOnDrop bool def true ; stutter 0..8 def 0 ; vocalGain 0..2 ; throw 0..1

hooks:
  - drop.hook.fx_out:     out ; audio ; port fx
  - drop.hook.vocal_out:  out ; audio ; port vocal
  - drop.hook.transport_in STD.transport_in
  - drop.hook.theory_in   STD.theory_in
  - drop.hook.asset_in:   in ; asset:ready
  - drop.hook.cue_out:    out ; seq:pattern_cue
  - drop.hook.drive_out:  out ; ui:config_change (per target) ; kernel setDJFilter through kernel API only
  - drop.hook.fired_out:  out ; edm:drop-fired {time, bar}
  - drop.hook.fire_in:    in ; ui:drop_fire (also accepts from macro/timeline marker 'DROP')

ui:
  horizontal section bar (kept from 1.0 identity): drag boundaries to set bars, section colours, playhead during run
  per-section cue editor (pattern slot, DJ filter start/end, energy, mutes)
  vocal lane under sections with waveform, drag to place, 'end on drop' toggle
  FX panel: riser/roll/impact levels & shapes ; big FIRE / ABORT
  ui_hooks: [ui:section_edit, ui:cue_edit, ui:vocal_load, ui:vocal_place, ui:fire, ui:abort, standard_ui_hooks]

raises_faults: [ASSET_002 (vocal decode), RUNTIME_003 (cue target gone → cue skipped, logged once)]

tests:
  - standard_tests (fx port non-silent during run)
  - FIRE at bar 2 with 4/4/0.25/8 → DROP starts at bar 2+8.25 → exact AC time ± 1 sample
  - vocal end-on-drop: clip end sample == drop start sample
  - snare roll hit times strictly accelerate; last hit ≤ DROP − 1/32
  - DJ filter restored to prior value after run and after ABORT
  - cue target unmounted mid-run → run continues, single RUNTIME_003

# ---- dependencies (generated by build/specs.mjs — do not edit by hand)
dependencies:
  mode: music   # Music Production
  toolbar_units: [music.engine, music.transport, music.tempo, music.key, music.meter]   # ui expansion when added: Audio engine · Transport · Tempo · Song key · Master meter
  services:
    - audio: Audio engine — makes sound
    - clock: Master clock & tempo — locks to the beat
    - key: Song key & scale — plays in key
    - mod: 75 modulation inputs — LFO / XY / Macro can move them
    - files: Your files — drop audio / MIDI on it
  inputs:
    - drop.hook.transport_in (transport:tick|transport:play|transport:stop) — ambient broadcast
    - drop.hook.theory_in (theory:key-change) — ambient broadcast
    - drop.hook.asset_in (asset:ready)
    - drop.hook.fire_in (ui:drop_fire|timeline:marker)
    - knob.tensionBars (modulation · port mod.knob.tensionBars)
    - knob.buildBars (modulation · port mod.knob.buildBars)
    - knob.pauseBars (modulation · port mod.knob.pauseBars)
    - knob.dropBars (modulation · port mod.knob.dropBars)
    - knob.outroBars (modulation · port mod.knob.outroBars)
    - knob.startMode (modulation · port mod.knob.startMode)
    - knob.autoFire (modulation · port mod.knob.autoFire)
    - knob.riserLevel (modulation · port mod.knob.riserLevel)
    - knob.riserWave (modulation · port mod.knob.riserWave)
    - knob.riserOct (modulation · port mod.knob.riserOct)
    - knob.riserNoise (modulation · port mod.knob.riserNoise)
    - knob.riserCurve (modulation · port mod.knob.riserCurve)
    - knob.riserFrom (modulation · port mod.knob.riserFrom)
    - knob.rollLevel (modulation · port mod.knob.rollLevel)
    - knob.rollVoice (modulation · port mod.knob.rollVoice)
    - knob.rollStart (modulation · port mod.knob.rollStart)
    - knob.rollEnd (modulation · port mod.knob.rollEnd)
    - knob.rollCurve (modulation · port mod.knob.rollCurve)
    - knob.rollPitch (modulation · port mod.knob.rollPitch)
    - knob.rollFrom (modulation · port mod.knob.rollFrom)
    - knob.gapSound (modulation · port mod.knob.gapSound)
    - knob.gapLevel (modulation · port mod.knob.gapLevel)
    - knob.gapLen (modulation · port mod.knob.gapLen)
    - knob.impactLevel (modulation · port mod.knob.impactLevel)
    - knob.impactPitch (modulation · port mod.knob.impactPitch)
    - knob.impactLen (modulation · port mod.knob.impactLen)
    - knob.crashLevel (modulation · port mod.knob.crashLevel)
    - knob.padLevel (modulation · port mod.knob.padLevel)
    - knob.tensionTone (modulation · port mod.knob.tensionTone)
    - knob.tChords (modulation · port mod.knob.tChords)
    - knob.tVoicing (modulation · port mod.knob.tVoicing)
    - knob.tOct (modulation · port mod.knob.tOct)
    - knob.tWave (modulation · port mod.knob.tWave)
    - knob.tVoices (modulation · port mod.knob.tVoices)
    - knob.tDetune (modulation · port mod.knob.tDetune)
    - knob.tWidth (modulation · port mod.knob.tWidth)
    - knob.tAttack (modulation · port mod.knob.tAttack)
    - knob.tRelease (modulation · port mod.knob.tRelease)
    - knob.tCutoff (modulation · port mod.knob.tCutoff)
    - knob.tCutoffEnd (modulation · port mod.knob.tCutoffEnd)
    - knob.tRes (modulation · port mod.knob.tRes)
    - knob.tMotion (modulation · port mod.knob.tMotion)
    - knob.tMotionRate (modulation · port mod.knob.tMotionRate)
    - knob.tSwell (modulation · port mod.knob.tSwell)
    - knob.tPump (modulation · port mod.knob.tPump)
    - knob.tRate (modulation · port mod.knob.tRate)
    - knob.tSub (modulation · port mod.knob.tSub)
    - knob.tAir (modulation · port mod.knob.tAir)
    - knob.tSpace (modulation · port mod.knob.tSpace)
    - knob.subDive (modulation · port mod.knob.subDive)
    - knob.subFrom (modulation · port mod.knob.subFrom)
    - knob.subTo (modulation · port mod.knob.subTo)
    - knob.subLen (modulation · port mod.knob.subLen)
    - knob.spaceTail (modulation · port mod.knob.spaceTail)
    - knob.spaceSize (modulation · port mod.knob.spaceSize)
    - knob.spacePre (modulation · port mod.knob.spacePre)
    - knob.spaceDuck (modulation · port mod.knob.spaceDuck)
    - knob.crossover (modulation · port mod.knob.crossover)
    - knob.spaceWidth (modulation · port mod.knob.spaceWidth)
    - knob.swell (modulation · port mod.knob.swell)
    - knob.swellBeats (modulation · port mod.knob.swellBeats)
    - knob.orbit (modulation · port mod.knob.orbit)
    - knob.orbitBars (modulation · port mod.knob.orbitBars)
    - knob.downLevel (modulation · port mod.knob.downLevel)
    - knob.downLen (modulation · port mod.knob.downLen)
    - knob.vocalTrimStart (modulation · port mod.knob.vocalTrimStart)
    - knob.vocalTrimEnd (modulation · port mod.knob.vocalTrimEnd)
    - knob.vocalSection (modulation · port mod.knob.vocalSection)
    - knob.vocalBeat (modulation · port mod.knob.vocalBeat)
    - knob.vocalEndOnDrop (modulation · port mod.knob.vocalEndOnDrop)
    - knob.stutter (modulation · port mod.knob.stutter)
    - knob.vocalGain (modulation · port mod.knob.vocalGain)
    - knob.vocalHpf (modulation · port mod.knob.vocalHpf)
    - knob.vocalPriority (modulation · port mod.knob.vocalPriority)
    - knob.throw (modulation · port mod.knob.throw)
  outputs:
    - drop.hook.fx_out (audio · port fx)
    - drop.hook.vocal_out (audio · port vocal)
    - drop.hook.cue_out (seq:pattern_cue)
    - drop.hook.drive_out (ui:config_change)
    - drop.hook.fired_out (edm:drop-fired)
    - drop.hook.plan_out (edm:drop-plan)
  permissions: [audio_out, bus_publish, bus_subscribe, filesystem_read, registry_read]
  works_with: [eravos.song-recorder, eravos.sequencer, eravos.macro-automation, eravos.drum-forge, eravos.session, eravos.clip-maker, eravos.sample-player]

# ============================================================
# ERAVOS RUNTIME SPEC — MUSIC LAYER SERVICES
# spec_id:      eravos.runtime.music
# version:      1.0.0
# author:       James Brooks
# status:       canonical
# phase:        P1
# depends_on:   ERAVOS.kernel.amendment-3.1
# resolves:     F-01, F-02, F-06, F-07, F-08
# ============================================================
#
# Shared services every music organism builds on. Services are
# runtime (L1), not kernel: they may know music. Organisms use
# them through their public API only.

# ============================================================
# R1 — music-theory.js  → window.MusicTheory   (pure, no state)
# ============================================================
music_theory:
  song_state_owner: eravos.session (bus theory:key-change {root, scale})
  scales: [major, minor, dorian, phrygian, lydian, mixolydian, harmonic_minor, pentatonic_major, pentatonic_minor, blues, chromatic]
  api:
    degreeToMidi(degree, octave, root, scale) → int        # degree 1-based, wraps octaves
    quantize(midi, root, scale) → int                      # nearest in-scale note
    chord(degree, root, scale, type) → int[]               # type: triad|seventh|sus2|sus4|power
    noteName(midi) → 'C#4'
    hz(midi) → float
    divisionSec(div, bpm) → float                          # '1/4','1/8.','1/8t','1/16','2/1'…
    midi.parse(ArrayBuffer) → {ppq, tracks:[{name, events:[{tick, note, vel, dur}]}], tempo}
    midi.write({ppq, tempo, tracks}) → ArrayBuffer (SMF type 1)
  tests: [scale tables, degree wrap, quantize ties go down, chord spellings, midi round-trip]

# ============================================================
# R2 — organism-sdk.js → window.OrganismSDK
# ============================================================
organism_sdk:
  create(instanceId, sBus, descriptor) → ctx
  descriptor: {id, label, provides, requires, permissions, hooks, config[], ui_hooks[]}
  ctx:
    params:         schema from config[]; get/set/all; clamp to range; wrong type → RUNTIME_002
    onUI(type, schema, fn):  subscribes ui:<type>:<instanceId>, validated
    on(topic, schema, fn):   global topic, validated, auto-unsubscribed on dispose
    emitUI(type, payload):   org:<type>:<instanceId> (scoped only — no global echo)
    emit(topic, payload):    global; topic must be a declared out hook event_type else RUNTIME_002
    port(portId, spec):      kernel audio.registerPort after registry.register
    track(node|timer|raf):   disposed on unmount
    serialize():             {params, extra: ctx.saveExtra?.()}
    deserialize(obj):        params + ctx.loadExtra?.(obj.extra)
    dispose():               idempotent; stops nodes, clears timers, unsubscribes, unregisters
  rule: every engine returns {unmount, serialize, deserialize}

# ============================================================
# R3 — precision-clock.js
# ============================================================
precision_clock:
  worklet_source: inlined string → Blob URL → audioWorklet.addModule   (works on file://)  F-06
  fallback_1:     Blob Worker setInterval(25 ms) tick
  fallback_2:     main-thread setTimeout
  lookahead:      0.100 s ; tick interval 0.025 s
  exposes:        mode ('worklet'|'worker'|'timeout') for diagnostics
  precision-clock.worklet.js file removed (source lives in one place)

# ============================================================
# R4 — master-transport.js → window.MasterTransport  (sole clock owner)
# ============================================================
master_transport:
  state: {playing, recording, bpm, position16 (absolute), loop:{on, startBar, endBar}}
  emits:
    transport:play   {BPM, time}
    transport:stop   {}
    transport:tick   {step16, time, bar, beat, sixteenth, stepDur}   # per 1/16, lookahead-scheduled
    transport:loop   {toStep16, time}
    transport:recorded {arrayBuffer(WAV), duration, sampleRate}
    seq:play / seq:stop   (compat for nexus + legacy)
  consumes: ui:transport-play|stop|record|bpm|seek|loop|bounce
  rules:
    - BPM change: stepDur recomputed next tick; no stop/start (F-08)
    - one Space binding: the shell's. Organisms MUST NOT bind Space (F-07)
    - count-in: optional 1 bar metronome before record
    - metronome: own audio port 'click' (accent on beat 1)
  bounce(bars):  seek 0 → record → play → stop at exact AC time → trim to first tick sample → WAV
  record:        audio-recorder tap on audio.output

# ============================================================
# R5 — audio-recorder.js
# ============================================================
audio_recorder:
  capture:  AudioWorklet (Blob) posting Float32 frames + frame index; fallback ScriptProcessor 4096
  encode:   WAV PCM 16-bit (TPDF dither) | 24-bit | 32-bit float
  trim:     startFrame/endFrame from AC time → exact sample count

# ============================================================
# R6 — workspace.js → window.Workspace
# ============================================================
workspace:
  snapshot(): {workspace_version:'1.0.0', bpm, key, scale, organisms:[{id, instanceId, x,y,w,h, state}], wires:[{src,srcHook,dst,dstHook,type}], assets:{hash: base64}}
  restore(snap): clear → spawn in dependency order → deserialize → re-register wires by remapped instanceIds
  autosave: IndexedDB 'eravos' store 'autosave', every 30 s + on mount/unmount (behavior.autosave spec)
  intake: file with workspace_version → restore (subscribes intake:file; shell untouched)
  assets: audio stored once per FNV hash; organisms reference hash

# ============================================================
# R7 — ui-kit.js → window.UIKit
# ============================================================
ui_kit:
  controls (all bidirectional: control.set(v) updates without re-emitting):
    Knob(drag, wheel fine, dbl-click default, shift = ×0.1), Fader, Toggle, Select, Segmented, Button, NumberDrag
  displays: Meter(dBFS, peak hold), Scope(AnalyserNode, real), Spectrum, Keyboard(scale-highlighted, playable)
  util:     atTime(AC, t, fn) — UI callback at audio time; loops stop when root disconnected
  rule:     no business logic; controls emit ui:config_change {key, value} only

# ============================================================
# R8 — wire-system.js
# ============================================================
wire_system:
  port_rail: dots rendered on window edges from registry hooks — in left, out right   (F-02)
  colours:   event_bus cyan, audio green, modulation violet
  drag:      out-dot → compatible in-dots glow (same wire_type) → release registers kernel wire
  remove:    click wire; organism unmount removes via kernel (K-12)
  event_bus routing unchanged in semantics; routes only payloads whose _from matches source

# ============================================================
# R9 — organism-factory.js
# ============================================================
organism_factory:
  handles:   Map instanceId → engine handle (mountEngine return value)   (F-01)
  unmount triggers (each → handle.unmount once, UI dispose once):
    - canvas:window-closed
    - .wm-win removed from canvas (MutationObserver — covers CLEAR ALL in locked shell)
    - kernel:organism-unmounted
  focus:     window pointerdown → canvas:focus {instanceId}; keyboard features check focus
  ui files:  music UIs move to organisms/<id>/<id>.ui.js calling OrganismFactory.reg
  snapshot:  exposes handles for Workspace

shell_policy: index.html L4 shell stays locked. Only <head> script list changes.

# ============================================================
# R10 — STANDARD CONTRACTS (organism specs inherit by name)
# ============================================================
standard_hooks:
  STD.note_in:
    direction: in ; wire_type: event_bus ; event_type: note:trigger ; contract_version: 2.0.0
    schema: {required:[target, note, velocity, time], properties:{target:string, note:{integer,0..127}, velocity:{number,0..1}, time:number, duration:{number,min 0}, accent:boolean, slide:boolean}}
    rule: act only when target === self instanceId or target === '*'
    failure_mode: RUNTIME_002
  STD.midi_in:
    direction: in ; event_type: midi:note ; schema {required:[note, velocity, on]}
    rule: act only when instance MIDI-armed (ui toggle); note-off honoured
  STD.audio_out:
    direction: out ; wire_type: audio ; port: out ; default route master
  STD.mod_in(<key>):
    direction: in ; wire_type: modulation ; port: mod.<key> ; kind param ; range from config key
  STD.theory_in:
    direction: in ; event_type: theory:key-change {root:int 0..11, scale:string}
  STD.transport_in:
    direction: in ; event_type: transport:tick | transport:play | transport:stop

standard_ui_hooks:
  ui:config_change   {key, value}            ui → org   validated against config[key]
  ui:preset_load     {name}                  ui → org
  ui:preset_save     {name}                  ui → org
  ui:audition        {note?, velocity?}      ui → org   (play a test note from the window)
  org:state_sync     {params, presets, ...}  org → ui   full state on mount/preset/restore
  org:param          {key, value}            org → ui   single param echo (automation, mod, restore)
  org:meter          {peakDb, rmsDb}         org → ui   ≤ 30 Hz
  org:error          {fault_class, message}  org → ui

standard_faults: [MOUNT_002, RUNTIME_001, RUNTIME_002, RUNTIME_003, PORT_001]

standard_tests:
  - renders non-silent audio through out port (OfflineAudioContext or analyser RMS > −60 dBFS)
  - note:trigger for another target → silence
  - every config key: below min, above max → clamped + RUNTIME_002 on wrong type
  - serialize → deserialize → identical params
  - unmount → zero bus subscribers for instanceId, zero kernel ports, zero running nodes
  - presets: every factory preset loads without fault

tests: [clock jitter, bpm change no restart, single space handler, unmount paths ×3, wire drag, bounce length, workspace round trip, midi round trip]

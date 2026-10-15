# ============================================================
# ERAVOS KERNEL AMENDMENT 3.1
# spec_id:      eravos.kernel.amendment-3.1
# version:      1.0.0
# amends:       ERAVOS.kernel.spec v1.0.0 (Layers 1, 3, 12, 13, 14)
# author:       James Brooks
# status:       canonical — approved 2026-09-25
# phase:        P0
# resolves:     F-03, F-04, F-05(partial), F-16
# ============================================================
#
# The kernel still never learns what music is. It learns what
# a signal port is. Ports, wires, and the master chain are
# domain-free: they carry audio or control signal, nothing more.
# Key, scale, notes, BPM-division math live in runtime, not here.

# ============================================================
# LAYER 1 ADDITION — PRIMITIVE: Port
# ============================================================

primitives:
  Port:
    description: >
      A signal connection point owned by an organism and held in the
      kernel port registry. Hooks with wire_type audio|modulation
      reference exactly one port. Organisms never connect nodes
      across organism boundaries themselves (K-3); the kernel does.
    required_fields: [instance_id, port_id, kind, direction]
    kinds:
      audio:  AudioNode signal (sound)
      mod:    AudioNode signal in −1..1 intended for parameter control
      param:  AudioParam destination (direction in only)
    fields:
      node:      AudioNode      # kinds audio, mod
      param:     AudioParam     # kind param
      range:     {min, max}     # kind param — scaling for modulation wires
      tap:       boolean        # audio in only — connecting does NOT remove source from master
      label:     string

# ============================================================
# LAYER 3 AMENDMENT — hook.wire_type
# ============================================================

hook_wire_type:
  values: [event_bus, callto, api, audio, modulation]
  audio:
    source:  hook(direction out) → port kind audio
    target:  hook(direction in)  → port kind audio
    effect:  kernel connects source.node → target.node
  modulation:
    source:  hook(direction out) → port kind mod
    target:  hook(direction in)  → port kind param
    effect:  kernel inserts scaler Gain(g = (range.max − range.min)/2) → target.param
  hook_field_added:
    port:    string   # port_id; required when wire_type ∈ {audio, modulation}

# ============================================================
# AUDIO GRAPH — kernel-owned routing
# ============================================================

audio_graph:
  api:
    registerPort(instanceId, portId, spec):  requires permission audio_out (out) / audio_in (in) else RUNTIME_001
    ports(instanceId):                        list
    connect(wireId, src, dst):                internal — called only by wireRegistry
    disconnect(wireId):                       internal
    removePorts(instanceId):                  called by registry.unregister
  default_route:
    rule: an audio out port with zero non-tap routes is connected to master.in
    on_first_route:   disconnect source from master.in
    on_last_unroute:  reconnect source to master.in
  fan_out:  allowed (one out → many ins)
  fan_in:   allowed (many outs → one in; Web Audio sums)
  cycles:   forbidden at instance level (organism in→out is an implied edge) → WIRE_006
  unmount (K-12):
    - every wire touching instance removed (ledger wire_removed, reason: organism_unmounted)
    - upstream sources that lose their last route return to master
    - instance ports disconnected and dropped

# ============================================================
# MASTER CHAIN — single path (replaces kernel send buses + SNRChain split)
# ============================================================

master_chain:
  path: master.in → dj.hpf → dj.lpf → duck → comp → makeup → limiter → clip → out → destination
  taps:
    out:        recorder + analysers (audio.output)
    meterL/R:   ChannelSplitter → 2 × Analyser(fftSize 2048)
  returns:
    reverb:  reverbSend → predelay → convolver → damp.hpf → damp.lpf → reverbRet → master.in
    delay:   delaySend → pingpong(dL ⇄ dR, loop LP filter, feedback ≤ 0.95) → delayRet → master.in
  rationale: returns enter master.in so duck + comp act on tails (F-04, F-05)
  defaults:
    comp:    {threshold: −12, ratio: 2, attack: 0.010, release: 0.200, knee: 6}   # F-17
    limiter: {threshold: −1, ratio: 20, knee: 0, attack: 0.001, release: 0.050}
    clip:    tanh soft clip above 0.95 linear — safety, not tone
    dj:      hpf 10 Hz, lpf 22 kHz (neutral)
  api (setters, all smoothed with setTargetAtTime τ=0.01):
    setReverb({mix, size, decay, predelay, damping})
    setDelay({mix, time, feedback, tone, width})
    setCompressor({threshold, ratio, attack, release, knee, makeup})
    setLimiter({ceiling})
    setDJFilter({value})              # −1 = full LP sweep … 0 neutral … +1 full HP sweep
    duckAt(t, {depth, attack, hold, release})   # scheduled gain curve on duck node
    output, masterIn, reverbSend, delaySend, meters()
  compat:
    audio.dry            → master.in
    audio.send(n,r,d,c)  → master.in (+ sends); c ignored (comp is always in path)
    SNRChain.boot        → returns kernel chain nodes; performs no rerouting

# ============================================================
# WIRE REGISTRY AMENDMENT (Layer 12)
# ============================================================

register_wire_validation_added:
  - hooks MUST exist for wire_type audio|modulation (event_bus keeps legacy lenience)   → WIRE_002
  - source hook direction out, target direction in                                      → WIRE_003
  - hook.wire_type equal on both ends and port kinds compatible                         → WIRE_005
  - no instance-level cycle for audio                                                   → WIRE_006

# ============================================================
# CONTRACT (Layer 16 enforcement)
# ============================================================

contract:
  validate(schema, payload) → errors[]
  supported_keywords: [type, required, properties, minimum, maximum, enum, items]
  on_error: fault RUNTIME_002 {topic, errors}; payload dropped, handler not called

# ============================================================
# LAYER 13 ADDITIONS — ledger entry types
# ============================================================
ledger_added:
  port_registered:  [instance_id, port_id, kind, direction]
  port_removed:     [instance_id, port_id]
  route_changed:    [instance_id, port_id, from, to]

# ============================================================
# LAYER 14 ADDITIONS — faults
# ============================================================
faults_added:
  WIRE_006: audio_cycle
  PORT_001: port_not_found
  PORT_002: port_kind_invalid
  PORT_003: duplicate_port

# ============================================================
# MISC
# ============================================================
misc:
  semver_compare: numeric per segment (F-16)
  audio.boot: resumes a suspended context on every call
  version: 3.1.0

tests:
  - out port registered → connected to master.in
  - audio wire → source off master; target receives signal
  - remove wire → source back on master
  - A→B, B→A → WIRE_006, first wire intact
  - modulation wire gain = (max−min)/2
  - unregister → zero ports, zero wires, upstream on master
  - permission missing → RUNTIME_001, port not created
  - contract: {type:number, minimum:0} vs −1 → RUNTIME_002
  - duckAt schedules curve: value at t+attack = 1 − depth (± 1e-3)
  - semverGt('3.10.0','3.2.0') === true

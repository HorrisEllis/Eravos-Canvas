# spec_id: eravos.component.filter-svf · version 1.0.0 · status built (2026-11-05: filter-svf.js + filter-svf.test.mjs + tests/p101-filter-svf.test.js; no tool uses it yet — its window is shown to him before it is built) · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: filter-svf ; group: filters ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: LP/HP/BP/notch/peak/shelves, 12/24/36 dB, key-track, env and velocity inputs, 16 Hz–20 kHz, stable to self-oscillation
  extract from: fx-filter, wub-filter (the move must change nothing: null renders ≤ −60 dB on every touched factory preset)
used by: chop-station · cowbell-lead · drum-foundry · dub-siren · dub-skank · dub-techno-chord · echo-architecture · feedback-reactor · filter-house · fm-matrix · fx-dub-echo · fx-rewind · glide-808 · granular-mutation · growl-forge · hard-kick-forge · hoover-engine · log-drum · micro-percussion · morph-engine · organ-bass · pad-forge · percussion-physics · pluck-forge · poly-filter-matrix · psy-roller · rave-stab · reese-architecture · resample-forge · retro-dco · riser-forge · rumble-kick · sample-universe · shimmer-engine · sub-architect · supersaw-cathedral · swarm-oscillator · tape-memory · wub-organism
inputs / outputs / limits (built 1.0.0):
  audio in 1 (mono or stereo) → audio out 1 (channels as asked, default 2) · latency 0 samples
  params (AudioParams, every one a modulation destination): frequency 16–20000 Hz (and < 0.49 × sample rate) · detune ±9600 cents
    (key-track, envelope, velocity, LFOs sum here) · resonance 0–1 (0 = Butterworth, 1 = Q 500) · gain ±36 dB (bell, shelves) ·
    mode 0–8 (lowpass, highpass, bandpass, notch, peak, bell, low shelf, high shelf, all-pass) · stages 1–3 (12/24/36 dB/oct, LP/HP/BP)
  kernel: Simper's trapezoidal (zero-delay-feedback) SVF — stable at every cutoff and resonance, smooth under audio-rate modulation
  cpu: 193 ns per stereo sample, 3 stages, cutoff moving every sample (≈ 0.9 % of one core at 48 kHz; measured in node, 2026-11-05)
  proved: LP/HP −3.01 dB at the cutoff (±0.15), 12/24/36 dB/oct (±1.2), BP 0 dB at centre, notch < −60 dB, bell ±9 dB, shelves ±6 dB,
    detune +1200 c = one octave, clamped range never NaN, 20 s at resonance 1 swept at audio rate stays bounded, decays to exact
    zero, process() allocates nothing; the worklet = the kernel in the real engine (residual < −60 dB)
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

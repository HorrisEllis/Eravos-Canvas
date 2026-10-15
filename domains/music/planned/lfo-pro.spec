# spec_id: eravos.organism.lfo-pro · version 1.0.0 · phase P38 · status planned · category modulation
# Replaces the simple LFO with a full one (the old one stays loadable; its presets map 1:1).
identity:
  id: eravos.lfo-pro ; label: LFO ; icon: 〰 ; accent: "#00e5ff"
  comp_intent: Move anything on the canvas in time — any shape, any rate, synced or free, to many targets at once, each with its own depth and curve.
  novelty: Drawable multi-target modulator with per-step rate sequencing (the wobble-writing tool).
engine:
  shapes: sine, tri, saw up/down, square (pulse width), S&H, smooth random, drunk walk, exponential, log, user-drawn (64-point curve with per-segment bend), wavetable scan of 8 shapes (morph)
  timing: free Hz 0.01–40 | synced 8 bars … 1/64 incl. dotted & triplet ; phase 0–360 ; retrig on note / bar / never ; one-shot (envelope mode) ; fade-in ; swing ; delay start
  RATE SEQUENCER: up to 32 steps, each step has its own rate (1/4, 1/8T, 1/16…) and shape — the "wub rhythm" of dubstep and riddim
  outputs: unlimited targets {tool, param, depth −100..100 %, curve lin|exp|log|stepped, range clamp} ; bipolar/unipolar ; polyphonic per-voice when the target supports note-scoped params ; audio-rate mode (≤ 2 kHz) for FM-style effects on worklet params
  envelope follower mode: audio_in → level → modulation (sidechain-pump anything)
  quality: sample-accurate on AudioParams (scheduled curves, not timers) ; value smoothing 1–20 ms to avoid zipper ; jitter < 1 sample vs transport
config: shape ; rate ; sync ; phase ; retrig ; fadeIn ; swing ; steps[] {rate, shape} ; targets[] ; mode lfo|envelope|follower ; smooth
hooks: STD.transport_in ; STD.note_in (retrig) ; audio_in (follower) ; mod_out (control wire to any param) ; data_out value (number)
ui: big shape display with playhead ; draw mode ; rate-step lane ; target list with depth sliders ; drag the round "mod" handle onto any knob on the canvas to add a target (the knob shows a ring of its modulation range)
packs: factory — Classic Wobble 1/8, Triplet Wub, Riddim 1/4→1/16 sequence, Half-time Pump, Trance Gate, Tape Drift, Random Shimmer, Sidechain Follower, Vowel Sweep, Growl Stutter
tests: synced 1/8 at 120 BPM → period 250 ms ±0.1 ms on the rendered param ; rate sequence [1/4,1/8,1/16] changes exactly at step boundaries ; 3 targets with depths 100/−50/25 % move proportionally ; retrig on note resets phase within 1 sample

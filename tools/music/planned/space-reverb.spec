# spec_id: eravos.organism.space-reverb · version 1.0.0 · phase P38 · status planned · category effects
identity:
  id: eravos.space-reverb ; label: Space ; icon: 🏛 ; accent: "#a0c4ff"
  comp_intent: Studio reverb — rooms, plates, halls, chambers, springs, shimmer and real-space impulse responses.
  novelty: Algorithmic (FDN 16-line) + convolution in one, with early/late split and modulation.
engine: FDN with Hadamard mixing, per-line modulation (chorus-free density), frequency-dependent decay (3 bands) ; early reflections from room geometry (size, shape, source/listener position) ; plate & spring models ; shimmer (pitch ±12 in the feedback) ; convolution mode with user IRs (partitioned, zero-latency head) ; freeze ; ducking ; pre-delay sync
config: type ; size ; decay s ; preDelay ; damping lo/hi ; diffusion ; modulation ; width ; earlyLate ; shimmer ; duck ; IR (asset)
hooks: STD.audio_in ; STD.audio_out ; STD.transport_in ; audio_in key (duck)
ui: decay graph per band ; room shape picture ; IR drop zone
packs: factory — Vocal Plate, Small Room, Drum Room, Big Hall, Cathedral, Spring Dub, Shimmer Heaven, Reverse Swell, Gated 80s Snare, Infinite Freeze
tests: RT60 measured within ±10 % of decay ; mono input → stereo correlation 0.2–0.6 at width 1 ; convolution null vs offline reference < −90 dB

# spec_id: eravos.organism.de-noise · version 1.0.0 · phase P38 · status planned · category voice
identity:
  id: eravos.de-noise ; label: Clean Up ; icon: 🧽 ; accent: "#9be7ff"
  comp_intent: Remove room hiss, hum, clicks and some room echo from a recording.
  novelty: Spectral repair suite (noise print, hum, declick, de-reverb).
engine: denoise: noise print (learn 0.5 s) + spectral subtraction with Wiener smoothing and musical-noise suppression ; dehum 50/60 Hz + harmonics (adaptive notch, tracks drift) ; declick (AR interpolation of detected spikes) ; de-reverb (late-reflection spectral decay estimate) ; live (higher latency) and offline modes
config: denoise dB ; dehum enum off|50|60|auto ; harmonics ; declick ; dereverb ; quality enum live|best
hooks: STD.audio_in ; STD.audio_out
ui: spectrum before/after ; LEARN button ; difference listen
tests: speech + white noise at −30 dB → noise −15 dB, speech band loss < 1 dB ; 60 Hz hum + 5 harmonics removed ≥ 30 dB

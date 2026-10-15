# spec_id: eravos.organism.pitch-to-notes · version 1.0.0 · phase P38 · status planned · category voice
identity:
  id: eravos.pitch-to-notes ; label: Sing to Notes ; icon: 🎼 ; accent: "#00e0a4"
  comp_intent: Hum or sing a melody, beatbox a rhythm — get notes (to any instrument) or drum hits (to the Drum Machine).
  novelty: Voice → note:trigger converter with a beatbox classifier.
engine: melody mode: pYIN + onset → notes quantized to scale and optional grid ; beatbox mode: onset + spectral features (centroid, flatness, low-energy) → kick / snare / hat classes (user-trainable: record 5 of each) ; live and clip modes
config: mode melody|beatbox ; quantize grid ; scale snap ; minNote ms ; velocity from level bool ; transpose
hooks: STD.audio_in ; note_out (note:trigger) ; data_out notes ; STD.theory_in
ui: live note roll ; training pads for beatbox ; target picker
tests: sung C-E-G (300 ms each) → 3 notes 60/64/67 ±0 ; beatbox: trained classes ≥ 90 % accuracy on a 40-hit test set

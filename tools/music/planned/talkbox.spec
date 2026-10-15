# spec_id: eravos.organism.talkbox · version 1.0.0 · phase P38 · status planned · category voice
identity:
  id: eravos.talkbox ; label: Talkbox ; icon: 📯 ; accent: "#ffcc33"
  comp_intent: The funk / G-funk / modern-pop talkbox — a synth that "talks" with your mouth shapes.
  novelty: Built-in carrier synth + LPC vowel filter tuned for the talkbox tone (vocoder spec = filter-bank, broader sound).
engine: LPC order 24 analysis of the voice, 10 ms frames ; carrier = internal saw/square poly synth (note_in) or external audio_in ; tube colour (2-pole resonance ~ 1 kHz) ; consonant pass-through (high-band of the voice mixed in on unvoiced frames)
config: carrier internal|external ; wave ; detune ; glide ; formantShift ; consonants 0..1 ; tube 0..1
hooks: audio_in voice ; audio_in carrier ; STD.note_in ; STD.audio_out
ui: mouth-shape display (LPC envelope) ; keyboard ; carrier controls
packs: factory — G-Funk Lead, Robot Talk, Soft Pop Box, Daft Vocoder-ish, Bass Talk
tests: carrier C3 + vowel "ah" → output F0 = C3 ±2 c, spectral envelope correlates ≥ 0.85 with voice envelope

# spec_id: eravos.organism.doubler · version 1.0.0 · phase P38 · status planned · category voice
identity:
  id: eravos.doubler ; label: Doubler ; icon: 👥 ; accent: "#88ffee"
  comp_intent: Makes one take sound like two to eight takes — width and thickness without chorus wobble.
  novelty: Natural ADT with per-voice independent micro-variation (not periodic modulation).
engine: up to 8 voices, each: delay 8–45 ms with random-walk drift (filtered noise, not LFO) ; pitch ±15 c random-walk ; level variation ; HP/LP per voice ; pan spread ; mono-compatibility guard (correlation meter, auto-reduce if < 0)
config: voices 1..8 ; spread ; timing ms ; pitch c ; tone ; mix ; monoSafe bool
hooks: STD.audio_in ; STD.audio_out
ui: voice dots in a stereo field ; correlation meter ; mono check button
tests: 2 voices, mono sum level change < 3 dB at all frequencies (no comb notches deeper than 6 dB) ; output never periodic (autocorrelation of delay curve < 0.3 at any lag 0.1–4 s)

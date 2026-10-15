# spec_id: eravos.organism.tape-deck · version 1.0.0 · phase P38 · status planned · category effects
identity:
  id: eravos.tape-deck ; label: Tape ; icon: 📼 ; accent: "#c1a57b"
  comp_intent: The sound of tape on a mix or a part — saturation, head bump, hiss, wow & flutter, tape stop / start.
  novelty: Hysteresis tape model (Jiles–Atherton) with machine presets.
engine: hysteresis saturation (×4 oversampled) ; record/playback EQ curves per speed (7.5/15/30 ips) ; head bump ; wow (0.5–2 Hz) & flutter (5–15 Hz) as filtered noise-modulated delay ; hiss ; dropouts ; tape stop/start with transport-sync button
config: machine ; speed ; drive ; bias ; wow ; flutter ; hiss ; age ; stop/start time
hooks: STD.audio_in ; STD.audio_out ; STD.transport_in ; trigger_in stop
ui: two reels (speed = rotation) ; VU meters ; STOP button
tests: drive 0 + wow/flutter 0 + hiss 0 → THD < 0.1 % ; tape stop: pitch falls to 0 in set time ±5 %

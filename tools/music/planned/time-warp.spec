# spec_id: eravos.organism.time-warp · version 1.0.0 · phase P38 · status planned · category voice-and-samples
identity:
  id: eravos.time-warp ; label: Warp ; icon: ⏳ ; accent: "#ffb703"
  comp_intent: Fit any audio to the song tempo without changing pitch (or change pitch without tempo) — and drag individual beats onto the grid.
  novelty: Elastic audio with transient-aware warp markers.
engine: modes: transient (WSOLA with transient lock — drums), tonal (phase vocoder with phase locking — pads, vocals), complex (hybrid), repitch (varispeed) ; BPM detection (onset autocorrelation + tempogram) ; warp markers auto-placed on beats, draggable ; formant-preserving pitch ; offline high-quality render
config: mode ; sourceBPM ; follow song bpm bool ; pitch st ; formant bool ; markers (data)
hooks: STD.audio_out ; STD.transport_in ; asset in/out
ui: waveform with warp markers ; BPM tap/detect ; mode chips
tests: 100 BPM loop → 128 BPM: length × 100/128 ±1 ms, transients within 2 ms of grid ; pitch ±0 c after stretch (tonal mode)

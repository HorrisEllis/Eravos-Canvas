# spec_id: eravos.organism.meter-bridge · version 1.0.0 · phase P38 · status planned · category mix
identity:
  id: eravos.meter-bridge ; label: Meters ; icon: 📏 ; accent: "#00ffaa"
  comp_intent: Every meter a mix engineer uses — LUFS (M/S/I), true peak, RMS, correlation, goniometer, spectrum, spectrogram, phase per band.
  novelty: Read-only analysis bridge with EBU/ITU-compliant loudness.
engine: BS.1770-4 K-weighting, gating ; true peak ×4 ; correlation ; vectorscope ; FFT 8192 with 1/6 oct smoothing ; spectrogram ; per-band correlation (low end mono check)
config: views ; integration reset ; spectrum slope 0/3/4.5 dB/oct
hooks: STD.audio_in ; data_out readings (json)
ui: tiled meters, resizable ; pop-out
tests: EBU 3341 test signals within ±0.1 LU ; −1 dBFS sine at fs/4 phase 45° → true peak +3 dB detected

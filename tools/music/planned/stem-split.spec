# spec_id: eravos.organism.stem-split · version 1.0.0 · phase P38 · status planned · category voice-and-samples
# Honest note: real stem separation needs a trained model (~30–80 MB ONNX, e.g. an open-licensed hybrid demucs export)
# run with onnxruntime-web (WebGPU, WASM fallback). It ships as an optional pack, never inside the core.
identity:
  id: eravos.stem-split ; label: Stems ; icon: 🧬 ; accent: "#ff6b6b"
  comp_intent: Split a song into vocals, drums, bass and other — to study how it is built, practise over it, or remix your own material.
  novelty: Only ML-backed tool; requires the model pack.
engine: chunked inference (10 s, 1 s overlap, crossfaded) in a Worker ; WebGPU if available ; progress + cancel ; results become assets ; model pack checksum verified before load
config: model (pack) ; stems 2|4 ; quality fast|best
hooks: asset in ; audio_out per stem (4) ; data_out progress
ui: drop a file → four stem lanes with solo/mute ; send stem to Pads / Sampler / Timeline
tests: model missing → plain message with the pack name, no crash ; sum of stems vs input residual < −20 dB on the test clip

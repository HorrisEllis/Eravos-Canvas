# spec_id: eravos.organism.chroma-key · version 1.0.0 · phase P38 · status planned · category effects
identity:
  id: eravos.video.chroma-key ; label: Green Screen ; icon: 🟩 ; accent: "#80ed99"
  comp_intent: Remove a green/blue background (or any colour) cleanly — spill suppression, edge softness — and put something else behind.
  novelty: WebGL keyer with spill suppression and matte view.
engine: YCbCr distance key ; clip black/white ; edge blur/choke ; spill suppression ; background layer input ; WebGL2 fragment pipeline (CPU fallback)
config: key colour ; tolerance ; softness ; choke ; spill ; view composite|matte
hooks: data_in frame (image) ; data_in background (image) ; data_out frame (image)
ui: eyedropper on the frame ; matte toggle
tests: synthetic green background with subject → matte alpha ≥ 0.98 on subject, ≤ 0.02 on background

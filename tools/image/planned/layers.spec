# spec_id: eravos.organism.layers · version 1.0.0 · phase P38 · status planned · category compose
identity:
  id: eravos.image.layers ; label: Layers ; icon: 🗂 ; accent: "#ffcfd2"
  comp_intent: Compose pictures from layers — images, text, shapes, adjustments — with blend modes and masks; make covers and posters.
  novelty: Non-destructive layer stack where each layer can be fed by a wire (a frame from video, an AI image, Image Adjust output).
engine: layers {kind image|text|shape|adjust, transform, opacity, blend (16 modes), mask} ; WebGL2 compositing ; export PNG/JPEG/WebP at any size ; text with web fonts
config: layers[] ; canvas size
hooks: data_in per layer (generated) ; data_out image
ui: canvas with handles ; layer list ; properties panel
tests: multiply of white over X = X exactly ; export size matches setting

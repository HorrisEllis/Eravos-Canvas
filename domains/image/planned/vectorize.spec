# spec_id: eravos.organism.vectorize · version 1.0.0 · phase P38 · status planned · category convert
identity:
  id: eravos.image.vectorize ; label: Vectorize ; icon: ✒ ; accent: "#cdb4db"
  comp_intent: Turn a bitmap (logo, drawing, silhouette) into clean SVG paths.
  novelty: Colour quantize + contour tracing + curve fitting.
engine: k-means colour quantize (2–16) ; marching squares contours ; Potrace-style curve fitting with corner threshold ; despeckle ; SVG out
config: colours ; detail ; smoothness ; despeckle px
hooks: data_in image ; data_out svg (text)
ui: side-by-side bitmap / SVG ; path count readout
tests: black circle bitmap → one closed path, area within 2 % of the circle

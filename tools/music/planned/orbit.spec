# spec_id: eravos.organism.orbit · version 1.0.0 · phase P8.4 · status canonical
# source: v10 SPATIAL_INSTRUMENT "orbital XY note placer" (+ SPATIAL mode)
identity:
  id: eravos.orbit ; label: Orbit ; icon: ◌ ; accent: "#00ccff"
  comp_intent: Place notes in space — angle is time, distance from centre is pitch; orbits loop. Melody by drawing, always in key.
  novelty: Only polar-coordinate sequencer; gravity mode bends timing (notes attracted to wells drift in phase).
engine:
  space: circle = loop of loopBars ; note = {angle 0..1, radius 0..1, size = velocity, colour = target}
  pitch: radius → scale degree (outer = high) via MusicTheory, song key ; rings drawn per degree
  scheduling: transport:tick → notes whose angle falls in [phase, phase+step) emit note:trigger (sub-tick offset preserved)
  gravity: up to 3 wells; each pass, notes move Δangle ∝ strength / distance² (bounded), producing evolving rhythm ; reset restores placement
  multiple orbits: up to 4 concentric loops with different lengths (1, 2, 3, 4 bars)
config: loopBars 1..8 def 2 ; octaves 1..4 def 2 ; target per orbit ; gravity bool ; wells[] ; quantize angle enum [off, 1/16, 1/8] ; length (note duration) div
presets: Pentatonic Rain, Slow Gravity, Twin Orbit 3:4
hooks: STD.transport_in ; STD.theory_in ; note_out (out ; note:trigger) ; print_out (seq:pattern_suggest)
ui: hero = orbit canvas: click place, drag move, right-click delete, scroll = velocity ; sweeping radius hand ; wells draggable
tests: note at angle 0.25 in 1-bar loop @120 fires at beat 2 ± 1 sample ; radius maps to in-scale notes only ; gravity off → identical loop each pass

# spec_id: eravos.organism.voice-character · version 1.0.0 · phase P38 · status planned · category voice
identity:
  id: eravos.voice-character ; label: Voice FX ; icon: 🎭 ; accent: "#ff3d7f"
  comp_intent: Fast creative voice transformations — robot, radio, alien, monster, chipmunk, ghost, glitch stutter.
  novelty: Character macros that combine pitch, formant, ring-mod, bit-crush, filter and stutter into one dial each.
engine: modules: ring modulator (sine/square, follow pitch), bitcrush/decimate, formant/pitch (shared DSP with Formant), comb, band-pass radio, stutter (beat-synced word repeats), reverse-reverb swell, freeze ; each character = a recipe over the modules ; MORPH between two characters
config: character A ; character B ; morph 0..1 ; intensity ; sync to transport bool
hooks: STD.audio_in ; STD.audio_out ; STD.transport_in
ui: character grid (tap) ; morph slider ; intensity knob
packs: factory — Robot, Radio, Megaphone, Alien, Monster, Chipmunk, Ghost, Glitch Stutter, Underwater, Cyborg Choir
tests: morph 0 equals character A exactly ; robot ring-mod at 120 Hz: sidebands present at f±120

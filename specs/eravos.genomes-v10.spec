# ============================================================
# ERAVOS GENOMES + RECIPES FROM v10 MODES
# spec_id:      eravos.genomes-v10
# version:      1.0.0
# phase:        P8.6
# conforms_to:  ERAVOS.kernel.spec Layers 6–8
# source:       v10 MODE SYSTEM (boot screen: SPATIAL, VISUAL, EMERGE, VAGAL + per-mode padSounds)
# ============================================================
#
# v10 modes were UI takeovers. In ERAVOS they become genomes
# (what belongs) + recipes (how to assemble + wire). The boot-screen
# chooser becomes a recipe picker in eravos.session ("Start from…").

genomes:
  eravos.genome.spatial:
    tagline: ORBITAL · MELODIC · GENERATIVE
    archetypes: [eravos.orbit, eravos.supersaw, eravos.arp, eravos.fx-echo, eravos.channel]
    accent: "#00ccff"
  eravos.genome.visual:
    tagline: GRID PAINTER · PATTERN SEQUENCER
    archetypes: [eravos.pads, eravos.sequencer (paint view), eravos.euclid, eravos.sidechain-compressor]
    accent: "#ff44aa"
  eravos.genome.emerge:
    tagline: GRANULAR CLOUD · EMERGENCE
    archetypes: [eravos.granular, eravos.sample-player, eravos.fx-moddelay, eravos.fx-echo, eravos.lfo]
    accent: "#aaff44"
  eravos.genome.vagal:
    tagline: BREATH · EMOTION · RESONANCE
    archetypes: [eravos.breath, eravos.organ, eravos.granular, eravos.channel]
    accent: "#8844ff"

recipes:
  eravos.recipe.spatial:
    steps:
      - mount orbit @ (40,40) ; mount supersaw @ (560,40) ; mount fx-echo @ (560,380) ; mount channel @ (900,40)
      - configure orbit.target = supersaw ; supersaw preset 'Trance Pluck'
      - wire audio supersaw.out → fx-echo.in ; fx-echo.out → channel.in
  eravos.recipe.visual:
    steps:
      - mount pads @ (40,40) ; mount sequencer @ (340,40) (view = paint) ; mount euclid @ (340,480) ; mount sidechain @ (960,40)
      - configure sequencer drum lanes target = pads ; euclid ring1 target = pads note 42 E(5,16)
      - configure sidechain target master, tempo 1/4
  eravos.recipe.emerge:
    steps:
      - mount sample-player @ (40,40) ; mount granular @ (480,40) ; mount lfo @ (480,420) ; mount fx-moddelay @ (900,40)
      - asset flow: sample-player asset:ready → granular (source)
      - wire modulation lfo.out → granular.mod_position (div 4/1, depth 0.3)
      - wire audio granular.out → fx-moddelay.in
  eravos.recipe.vagal:
    steps:
      - mount breath @ (40,40) pattern COHERENCE ; mount organ @ (420,40) preset 'Hanging Tree' ; mount channel @ (860,40)
      - wire modulation breath.breath → organ.breath_in
      - wire audio organ.out → channel.in ; channel sendRev 0.6
  eravos.recipe.raven-drop:     # the purpose recipe (not from v10 — from James's intent)
    steps:
      - mount session ; pads ; sequencer (starter 'dubstep half-time 140') ; wobble-bass ; sample-player ; clip-maker ; bass-drop-builder ; master-fx
      - sequencer lane 'bass' target = wobble-bass
      - clip-maker asset:ready → sample-player ; sample-player asset:ready → bass-drop-builder vocal slot (end on drop)

tests:
  - each recipe mounts exactly its organisms, all wires register (no WIRE_* faults)
  - each recipe produces non-silent output within 2 bars of transport:play

# spec_id: eravos.organism.sound-atlas · version 1.0.0 · phase P38 · status planned · category library
identity:
  id: eravos.sound-atlas ; label: Sound Atlas ; icon: 🗺 ; accent: "#ffbe0b"
  comp_intent: The whole spectrum of sounds in one browsable map — every kind of kick, snare, hat, perc, 808, bass, wub, dub, impact, riser, foley, texture, vocal chop — synthesized, so it ships small and every sound is editable.
  novelty: A generative sound library: each entry is a RECIPE for a synth model (Drum Forge / Bass Forge / FX Box / Wub Lab), not a recording; packs add recipes or samples.
engine:
  taxonomy (≥ 2,000 recipes across packs): kicks (sub, punchy, distorted, clicky, boomy, tight, 909/808/acoustic models, peaks & dips: pitch-env depth × decay × drive grid) · snares/claps (body/noise ratio × tune × room) · hats/cymbals (metal partial sets × decay × openness) · percussion (wood, metal, skin, glass, water, plastic — modal materials) · 808s (glide, distortion, length) · basses · wubs (rate × vowel × table) · dubs (sirens, melodica-style stabs, spring hits, delay throws) · impacts, risers, downers, sweeps, noise · foley (steps, cloth, paper, keys — physical models) · vocal chops (formant synth "ah/oh/hey") · textures/drones
  map: every recipe analysed once (spectral centroid, attack, decay, pitch, noisiness, brightness, "punch") → 2-D similarity map (UMAP-like, precomputed at build time) ; browse by area, by tag, by similarity ("more like this", "brighter", "shorter")
  generator: VARY (mutate a recipe ±n %), BREED (cross two recipes), RANGE (generate a peak-to-dip series of one sound: 8 versions from softest to hardest)
  preview: ▶ on everything (runtime Preview) ; drag to a pad / sampler / track
config: packs enabled ; filters ; target tool
hooks: asset_out ; data_out (recipe) ; note_out (audition)
ui: map view (dots coloured by type, hover = preview) + list view ; similarity strip ; drag-to-pad
packs: factory core (≈300 recipes) + Kicks 400, Snares & Claps 300, Hats & Cymbals 250, Percussion 300, 808 & Sub 150, Wubs 200, Dub FX 120, Impacts & Transitions 200, Foley 150, Vocal Chops 120, Textures 100
tests: every recipe renders non-silent, peak ≤ −0.3 dBFS, no DC (> 5 Hz filter), length within its declared range ; RANGE series is monotonic in the chosen feature ; map neighbours have feature distance < global median

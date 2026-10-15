# spec_id: eravos.organism.bass-guitar · version 1.0.0 · phase P38 · status planned · category instruments
identity:
  id: eravos.bass-guitar ; label: Bass Guitar ; icon: 🪕 ; accent: "#a0522d"
  comp_intent: Real electric and upright bass — finger, pick, slap/pop, muted dub thump — for funk, reggae, rock, jazz, hip-hop.
  novelty: Modelled bass with articulation by velocity zones and string choice.
engine: 4/5-string waveguide ; pluck types finger|pick|slap|pop|muted ; string/fret position selection (same note, different tone) ; fret buzz ; slides between legato notes ; upright model (body + bow option) ; DI + amp blend out
config: model electric|upright ; technique ; tone ; position ; mute ; slide ; amp blend
hooks: STD.note_in ; STD.midi_in ; STD.audio_out
ui: neck view ; technique chips
packs: factory — Motown Finger, Slap Funk, Dub Thump (heavy mute, low pass), Rock Pick, Jazz Upright, Neo-Soul Round
tests: slap → transient ≥ 6 dB above finger at same velocity ; legato C→D slide audible pitch glide 30–80 ms

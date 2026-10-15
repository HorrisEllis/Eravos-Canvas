# spec_id: eravos.organism.vocal-chain · version 1.0.0 · phase P38 · status planned · category voice
identity:
  id: eravos.vocal-chain ; label: Vocal Chain ; icon: 🎙 ; accent: "#ff8f5c"
  comp_intent: A studio vocal channel in one window — the order engineers use, every stage switchable and re-orderable.
  novelty: Re-orderable multi-stage strip with gain-staging between stages; single effects stay in their own tools.
engine:
  stages (default order): gate/expander → HPF (12/18/24 dB) → subtractive EQ (3 bands) → de-esser → comp 1 (FET-style: fast, 4:1, colour) → comp 2 (opto-style: program-dependent release) → tone EQ (low shelf, presence, air shelf) → saturation (tape/tube) → de-breath → output
  gain staging: each stage shows in/out level ; auto-gain on comps ; stage reorder by drag (drag reorder is undoable)
  sidechain: de-esser and comps can key from any audio wire
  quality bar: 64-bit internal, oversampling ×2 on saturation and FET comp ; no denormals ; all stages bypassed = bit-transparent
config: per-stage parameters (≈40) ; order array ; inputTrim ; outputTrim ; oversample enum 1|2|4
hooks: STD.audio_in ; STD.audio_out ; audio_in key (sidechain)
ui: horizontal strip of stage cards (on/off, 3 main knobs each, expand for all) ; GR meters per comp ; spectrum behind the EQ stages
packs: factory — Pop Lead, Rap Upfront, R&B Silk, Rock Grit, Podcast/Speech, Whisper Close, Backing Stack, Telephone, Radio Announcer, Live Stage
tests: all bypassed → output equals input exactly ; comp1 4:1 at −20 dB thr, −10 dB sine in → −17.5 dB ±0.3 ; reorder stages preserves params ; de-esser reduces 7 kHz band ≥ 6 dB on "s" while 1 kHz < 0.5 dB

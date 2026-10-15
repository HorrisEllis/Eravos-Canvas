# spec_id: eravos.organism.growl-resampler · version 1.0.0 · phase P38 · status planned · category sound-forge
identity:
  id: eravos.growl-resampler ; label: Resampler ; icon: ♻ ; accent: "#b2ff59"
  comp_intent: Record anything on the canvas, chop it, and turn it back into an instrument — the resampling loop heavy bass music is built on.
  novelty: Capture → process chain → slice/wavetable/sampler in one place, repeatable generations.
engine: capture (like Sounds › Capture) with bar-locked length ; generations: each resample keeps its parent (undo tree) ; outputs: sliced kit (onset slices → Drum Machine), wavetable (cycle extraction, normalize, phase-align), multi-sample (to Sampler) ; processing per generation: pitch, reverse, stretch, formant, crush, stutter
config: source ; length ; output kind ; per-generation processing
hooks: audio_in (or pick from canvas) ; asset_out ; STD.transport_in
ui: generation tree ; waveform with slices ; send-to buttons
tests: 4 generations kept and auditionable ; slices land on onsets ±3 ms

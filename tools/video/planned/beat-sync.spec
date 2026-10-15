# spec_id: eravos.organism.beat-sync · version 1.0.0 · phase P38 · status planned · category edit
identity:
  id: eravos.video.beat-sync ; label: Beat Sync ; icon: 🎞 ; accent: "#ffadad"
  comp_intent: Make video react to your music — cuts on beats, flashes on kicks, zooms on drops, effects following the Contrast or Alchemy score.
  novelty: Music → video bridge (audio features drive visual events).
engine: inputs: transport beats, onset detection on any audio wire, Contrast score, Alchemy tension ; outputs: cut events to Video Timeline, visual effect params (zoom, shake, flash, RGB split, blur) with envelopes
config: rules[] {source, threshold, action, amount, decay}
hooks: STD.transport_in ; audio_in ; data_in score ; control_out ; data_out events
ui: rule list ; live trigger lights
tests: kick on every beat at 120 BPM → flash events every 500 ms ±5 ms

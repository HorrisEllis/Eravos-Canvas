# spec_id: eravos.organism.sampler-pro · version 1.0.0 · phase P38 · status planned · category instruments
identity:
  id: eravos.sampler-pro ; label: Sampler ; icon: 💿 ; accent: "#7c83fd"
  comp_intent: A full multi-sample instrument — map many recordings across keys and velocities, round-robins, loop points, filters, envelopes, and play it like any synth.
  novelty: Zones/layers mapping (Sample Player is one sample, slice or chromatic).
engine: zones {key range, velocity range, root, tune, gain, pan, round-robin group, loop start/end/crossfade, release sample} ; auto-map by file names (C3, 60, "vel3") or pitch detection ; per-voice filter (SVF + ladder), 3 envelopes, 2 LFOs, mod matrix ; disk-free: all in memory, decoded once ; time-stretch per zone (keep length across keys) ; SFZ import (subset: regions, groups, keys, vel, loop, amp_env) ; export kit as pack
config: zones (pack data) ; voice params ; polyphony ; glide ; stretch bool
hooks: STD.note_in ; STD.midi_in ; STD.audio_out
ui: key × velocity map with zones as boxes (drag edges) ; zone editor with waveform + loop points ; drop files to auto-map
tests: SFZ with 3 velocity layers loads and maps correctly ; round-robin cycles 4 samples in order ; loop crossfade has no click (< −50 dB discontinuity)

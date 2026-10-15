# spec_id: eravos.organism.granular · version 1.0.0 · phase P8.3 · status canonical
# source: v10 EMERGE_INSTRUMENT (rebuild — v10 grains were synth voices, F-21)
identity:
  id: eravos.granular ; label: Emerge ; icon: ∞ ; accent: "#aaff44"
  comp_intent: Scatter Raven's voice (or any sample) into a cloud of tiny grains — textures, drones, shimmering pads.
  novelty: Only buffer-granular engine; keeps v10's emergence identity (density breeds texture, click to burst).
engine:
  source: asset (sample-player asset:ready, drop on window, or looper bounce)
  scheduler: on transport lookahead window, spawn grains at density (1..200/s) with jitter ; each grain = BufferSource(offset = position ± spread, duration = size) → Hann env (GainNode curve) → pan (random × width) → out
  pitch: base + random ± spray (st) ; optional scale-quantized pitch spray (song key)
  freeze: position locked ; scan: position moves at speed (−2..2 × realtime)
  burst: click on cloud → N grains at click position (x = position, y = pitch)
  polyphony guard: max 256 live grains, oldest dropped
config: position 0..1 ; spread 0..1 ; density 1..200 ; size 10..500 ms ; pitch −24..24 ; spray 0..12 st ; quantize bool ; scan −2..2 ; freeze bool ; width 0..1 ; reverse prob 0..1 ; level
presets: Voice Cloud, Frozen Word, Shimmer Pad (+12 spray quantized), Rain, Glitch Dust
hooks: STD.audio_out ; STD.note_in (note → pitch, gate → cloud on/off) ; asset_in (asset:ready) ; mod_position, mod_density, mod_pitch STD.mod_in
ui: hero = waveform with grain particles drawn where they read (x) and pitched (y) — v10 aesthetic, real data ; click to burst
tests: density 50 → 50 ± 5 grains/s ; freeze → all grain offsets within spread of position ; no clicks: each grain starts/ends at env 0

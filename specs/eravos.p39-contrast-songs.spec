# spec_id: eravos.p39.contrast-songs · version 1.0.0 · phase P39 · status MAPPED · order 8 (after the tools they use)
# R11 "i want the most contrast for songs you can find, like the least similar songs you can make, to push eravos"
# R8  "a fuck ton of songs" · "skrillex level … fast and wobble"
# Songs are DATA (Song Engine genres + Sequencer/Contrast packs + Timeline templates), not tools (one tool per tool).

## Contrast genome (invention I6) — what "least similar" means, measured
  every song is a vector of 14 features ERAVOS computes from its own render + its data:
    tempo (BPM) · meter (4/4, 3/4, 6/8, 5/4, 7/8, 13/16) · grid (straight / swung % / triplet / polymeter) · syncopation
    index · onset density (events/s) · silence ratio · register centre (median pitch) · register span · spectral centroid
    (brightness) · roughness (beating, distortion) · harmonic tension (dissonance curve) · tuning (12-TET / just / EDO-n /
    irrational — the xen tools) · dynamic range (PLR) · form contrast (mean section-to-section distance)
  normalised 0..1 per feature over the whole set.
## Generation — farthest-point sampling
  the set is built greedily: each new song is chosen (from many seeded Song Engine / Contrast candidates) to MAXIMISE its
  minimum distance to every song already in the set → no two songs are close; the set covers the corners of the space.
  The build prints the distance matrix; a song closer than d_min to another is rejected.
## The first set — 24 corners (each line: name · tempo/meter · grid · the extreme it owns · tools pushed to the limit)
   1 Lost Love Lift        122 4/4  straight, soft swing · melodic house, wide pads, her voice in the break · Pad Forge,
                           Supersaw, Drum Machine (Melodic House kit), sidechain (her-song defaults — the warm corner)
   2 Tearout Stairwell     150 4/4  half-time · max roughness + wub-seq stairs to 1/32 · Wobble 3.0, Destroyer, Contrast
   3 Grid Fight 3:4        140 4/4  cross 3:4 rebel, snap every 8 · max syncopation · Contrast Rivalry, Reese, perc
   4 Glass Silence         72  4/4  rubato feel · max silence ratio, fewest events · Waveform-style FM bells, Space
   5 Footwork Storm        160 4/4  triplet kick, 1/32 rolls · max onset density · Drum Machine, Sequencer ratchet ramps
   6 Seven Teeth           174 7/8  straight · odd meter DnB · Reese 2.0 neuro roll, Sequencer polymeter 7:8
   7 Waltz for a Robot     96  3/4  straight · meter contrast, square-gate wobble · Wobble Gate shape, Organ
   8 Just Intonation Bloom 108 4/4  ratios from Ratio Lattice · tuning corner (just) · Xen Synth, Recursive Spectra
   9 19-Tone Riddim        140 4/4  half-time · EDO-19 riddim — tuning × bass music · Xen Synth + Wobble
  10 Dembow Pressure       100 4/4  dembow 3+3+2 skeleton · dancehall/reggaeton grid · Contrast skeleton, Dub Station
  11 One Drop Ghost        76  4/4  one-drop, kick on 3 · lowest density with heavy weight · Dub Station, Sub Engine
  12 Hardstyle Key Kick    150 4/4  four-on-floor · tonal kick in key, reverse bass · Drum Machine 3.0 hardstyle model
  13 Synthwave Night Drive 104 4/4  straight 8ths · brightness + gated snare era · Retro Poly, 80s kit, Arp (when built)
  14 Witch House Fog       70  4/4  half-time crawl · darkest centroid, pitched-down voices · Coven, Haunt, Organ
  15 UKG Skip              132 4/4  2-step shuffle 58 % · swing corner · Drum Machine UKG kit, chopped chords
  16 Complextro Chop       128 4/4  source switch every 1/16 · max source-switch rate · Contrast SWITCH over 6 synths
  17 Metric Slip           126 4/4  hats in 5s over 4 · metric modulation · Contrast METRIC MOD
  18 Breath Ambient        60  free (no grid) · zero kick, breath-paced swells · Breath, Embodiment Lab, Pad Forge
  19 Phonk Cowbell Drift   135 4/4  half-time trap · cowbell melody, max saturation on 808 · Drum Machine 808 distorted
  20 Hemiola Anthem        138 4/4 → 6/8 feel · trance lift that regroups · Supersaw, Contrast HEMIOLA
  21 Stop-Start Bun        140 4/4  gaps as hits · max silence inside a dense drop · Contrast GAP + FLIP, Wobble seq stops
  22 Polymeter Garden      118 16:12:7 · three lanes that realign every 336 steps · Sequencer polymeter, FM perc
  23 Tape Lo-fi Love       84  4/4  swung 62 % · lowest brightness, dusty · lo-fi kit, Curve Synth, Tape (when built)
  24 Impossible Drop       200→100 · tempo halving mid-song (metric modulation of the WHOLE song) · every tool at once
  each song ships: Song Engine recipe (seeded) + Timeline template + the presets it uses (in the genre packs) + a one-line
  "what to listen for" + "what makes it different from its nearest neighbour" (the distance, in words).
## Focus (user 2026-10-16): NEW songs start in the "Lost Love" region first (specs/eravos.p39-her-song.spec 1.1 L4:
  LL1–LL10); the 24 corners above follow. The farthest-point sampler runs inside that region before the whole space.
## Then: more sets — the same sampler run per genre family (bass music · house · techno · breaks · urban · cinematic),
  ≥ 24 songs each, every set measured against ALL earlier songs (no repeats across sets).
## Acceptance
  - the 24 songs' pairwise distances: minimum ≥ d_min, and every feature's full 0..1 range is used by at least one song
  - every song renders ≥ 2:00 with zero faults, peak ≤ −1 dBFS, and loads as ordinary editable tools
  - every song credits technique only; no melody/lyric/sample of any record (review checklist per song)
  gap: "skrillex level" is a taste judgement — the set is built for range; the user's ears pick which corners to deepen.

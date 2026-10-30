# Sound audit

2026-10-30 · 45 tools · default settings · `node build/sound-audit.mjs`

Flagged: 9. Effects: intermodulation = a loud 50 Hz + a quiet 1 kHz, sidebands under the 1 kHz (−20 dB or lower is clean; the Destroyer was −1.6, now −49). CPU = ms of work per second of sound (one instance).

| Tool | Kind | Flags | IMD dB | Gain dB | Peak dBFS | <20 Hz dB | Tail dBFS | DC | CPU ms/s |
|---|---|---|---|---|---|---|---|---|---|
| Pad Forge | instrument | does not go quiet after release (-41.4 dBFS); heavy (221 ms per second of sound) | — | — | -15.6 | -64.5 | -41.4 | -0.000 | 221 |
| Gothic Organ | instrument | does not go quiet after release (-32.2 dBFS); heavy (148 ms per second of sound) | — | — | -6.1 | -33.0 | -32.2 | -0.000 | 148 |
| Xen Synth | instrument | does not go quiet after release (-48.9 dBFS); heavy (134 ms per second of sound) | — | — | -5.0 | -36.2 | -48.9 | -0.000 | 134 |
| Partials | instrument | heavy (117 ms per second of sound) | — | — | -1.8 | -59.2 | -240.0 | -0.000 | 117 |
| Coven | instrument | heavy (97 ms per second of sound) | — | — | -16.2 | -19.2 | -55.8 | 0.000 | 97 |
| Morph Osc | instrument | heavy (90 ms per second of sound) | — | — | -0.2 | -73.2 | -240.0 | 0.000 | 90 |
| Retro Poly | instrument | heavy (68 ms per second of sound) | — | — | -10.0 | -38.1 | -240.0 | -0.000 | 68 |
| Channel | effect | DC offset -0.015 | -78.0 | 0.0 | -5.8 | — | — | -0.015 | 37 |
| Wub Filter | effect | bass chews the music (intermodulation -4.2 dB) | -4.2 | -1.0 | -3.8 | — | — | 0.000 | 32 |
| Embodiment Lab | instrument | ok — a drone: it sounds continuously | — | — | -16.7 | -62.3 | -26.0 | -0.000 | 76 |
| Recursive Spectra | instrument | ok — a drone: it sounds continuously | — | — | -5.5 | -60.4 | -22.2 | -0.000 | 61 |
| Supersaw | instrument | ok | — | — | -0.2 | -59.9 | -240.0 | -0.000 | 57 |
| Wobble Bass | instrument | ok | — | — | -3.6 | -54.1 | -240.0 | -0.000 | 56 |
| Reese Bass | instrument | ok | — | — | -2.3 | -47.8 | -240.0 | -0.000 | 49 |
| Bass Forge | instrument | ok | — | — | -5.4 | -38.5 | -240.0 | -0.000 | 42 |
| Phaser | effect | ok | -73.7 | 0.6 | -4.2 | — | — | -0.000 | 38 |
| Haunt | effect | ok | -32.9 | 0.0 | -0.8 | — | — | -0.000 | 36 |
| Drum Forge | instrument | ok | — | — | -240.0 | -240.0 | -240.0 | 0.000 | 35 |
| Drop Builder | source | ok | — | — | -240.0 | -240.0 | -240.0 | 0.000 | 33 |
| Destroyer | effect | ok | -49.5 | 1.1 | -5.9 | — | — | -0.000 | 32 |
| EQ | effect | ok | -78.0 | -0.0 | -5.9 | — | — | 0.007 | 31 |
| Squash | effect | ok — upward compression (OTT) raises quiet sound — Depth and Out set it | -77.3 | 9.8 | -1.9 | — | — | 0.000 | 30 |
| Breath | source | ok — a breathing guide: it sounds continuously | — | — | -2.9 | -59.6 | -9.4 | -0.000 | 30 |
| Curve | instrument | ok | — | — | -11.0 | -49.5 | -240.0 | 0.000 | 28 |
| Deep Sub | instrument | ok | — | — | -2.4 | -65.3 | -240.0 | 0.000 | 28 |
| Granular | instrument | ok | — | — | -240.0 | -240.0 | -240.0 | 0.000 | 27 |
| Dub Station | effect | ok | -54.8 | -3.8 | -5.8 | — | — | 0.000 | 25 |
| Dynamics | effect | ok | -42.7 | -1.8 | -13.7 | — | — | -0.000 | 25 |
| Tape Echo | effect | ok | -70.4 | -0.0 | -6.0 | — | — | 0.002 | 24 |
| Pitch | effect | ok | -78.0 | -0.0 | -6.0 | — | — | 0.000 | 24 |
| Wub Osc | instrument | ok | — | — | -13.6 | -42.2 | -240.0 | 0.000 | 22 |
| Mod Delay | effect | ok | -69.0 | -4.7 | -6.0 | — | — | 0.001 | 22 |
| Filter | effect | ok | -78.0 | -4.4 | -9.4 | — | — | -0.000 | 22 |
| Acid Synth | instrument | ok | — | — | -4.7 | -42.3 | -240.0 | 0.000 | 21 |
| Glitch | effect | ok | -78.0 | -0.0 | -6.0 | — | — | -0.000 | 21 |
| FX Box | instrument | ok | — | — | -240.0 | -240.0 | -240.0 | 0.000 | 21 |
| Wub Sub | instrument | ok | — | — | -8.5 | -61.2 | -240.0 | 0.000 | 18 |
| Drum Machine | instrument | ok | — | — | -240.0 | -240.0 | -240.0 | 0.000 | 18 |
| Timeline | source | ok | — | — | -240.0 | -240.0 | -240.0 | 0.000 | 18 |
| Suite | effect | ok | -78.0 | -0.0 | -6.0 | — | — | -0.000 | 16 |
| Sidechain | effect | ok | -78.0 | -0.0 | -6.0 | — | — | -0.000 | 16 |
| Ratio Lattice | source | ok | — | — | -240.0 | -240.0 | -240.0 | 0.000 | 15 |
| Song Recorder | source | ok | — | — | -240.0 | -240.0 | -240.0 | 0.000 | 14 |
| Sample | instrument | ok | — | — | -240.0 | -240.0 | -240.0 | 0.000 | 14 |
| Clip Maker | effect | ok — records and slices — it does not pass sound through | — | -222.0 | -240.0 | — | — | 0.000 | 14 |

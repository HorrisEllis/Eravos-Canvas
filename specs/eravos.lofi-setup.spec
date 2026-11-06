# spec_id: music.lofi · kind setup · version 0.1.0 · status planned (spec first — Axiom 8; not built, waiting for his yes)
# his words: "i also want to be able to make lofi" (2026-11-05) · "Lofi tools: UI previews first." · "those are lofi tools?" ·
#   "nope look at the claude.md" (2026-11-06) — lofi is not one tool (Axiom 1, parts, not monoliths): it is a SETUP (a system of whole tools,
#   Start › SETUPS, tools/music/suites/<id>/suite.json — Axiom 3) plus PACKS (data beside each tool), and two tools it lacks (Piano, Tape Memory)
identity:
  id: music.lofi ; label: Lofi ; kind: setup ; hub: eravos.suite-hub ; accent: "#d6b37a" (the tape's tan)
  blurb: dusty swung drums, jazzy 7th and 9th chords on soft keys, a round bass, everything low and wobbly, a little crackle, a gentle pump
parts (whole tools; preset = a pack preset; ✓ exists today · ✗ to write as a pack):
  eravos.groove-gen      rhythm    boom-bap swing ~58 %, ghost snares, lazy hats                     ✗ pack "Lofi" (groove-gen)
  eravos.pads            drums     the Lo-fi Dust kit                                                  ✓ pack cinematic-lofi · Lo-fi Dust
  eravos.chord-gen       key       ii–V–I, iii–vi–ii–V, IVmaj7–iii7–vi7 in the song's key, 7ths and 9ths  ✗ pack "Lofi" + 7th/9th voicings (open gap below)
  eravos.retro-poly      keys      soft electric-piano-like keys (until Piano is built)                ✓ Lo-fi Drift · Chillwave Juno Wash
  eravos.bass-gen        bassline  round, behind the beat, root and fifth, slides                      ✗ pack "Lofi" (bass-gen)
  eravos.sub-engine      sub       a soft sine under it                                                ✓ (a gentle preset; else ✗)
  eravos.fx-filter       tone      low-pass ~3 kHz over the keys and drums                             ✗ preset "Lofi Low"
  eravos.fx-destroyer    grit      a little bit-depth and sample-rate on the drums                     ✓ Lo-fi 12-bit 22k
  eravos.fx-echo         space     short warm tape echo on the keys                                    ✓ (a gentle preset; else ✗)
  eravos.sidechain-compressor pump gentle, the kick ducks the keys and bass                            ✓ (a gentle preset; else ✗)
  later (once built and his yes): eravos.piano (tine or felt) replaces Retro Poly as keys · eravos.tape-memory over the whole mix (cassette)
wiring:
  groove-gen → pads (rhythm) · chord-gen → retro-poly, bass-gen (key) · bass-gen → sub-engine · pads → fx-destroyer → fx-filter
  retro-poly → fx-filter → fx-echo · pads (kick) → sidechain-compressor (key in) · everything → sidechain-compressor → out (later: → tape-memory → out)
macros (one knob, many tools — as Sound System's):
  DUST   destroyer bits / rate + (later) Tape Memory wear
  WARMTH filter cutoff down + echo darker
  SWING  groove-gen swing 50–66 %
  PUMP   sidechain depth
scenes: Study (soft, slow, warm) · Rainy (darker, more dust) · Late Night (sparser drums, longer echo)
decisions (2026-11-06):
  - no "Lofi Lab" all-in-one: it would hard-wire packs and parts into one engine (Axiom 1); the setup opens the real tools, each its own window
  - every sound made live: the dust from Destroyer now and Tape Memory later, never a recording (No toys)
  - Retro Poly stands in for keys today, so the setup works before Piano exists; Piano replaces it by a one-line change of the part
open gaps (none hidden):
  - Chords: jazzy progressions need 7th/9th voicings in chord-gen (today: triads + tension); a component or a chord-gen change — spec first
  - packs to write (data only): groove-gen Lofi, chord-gen Lofi, bass-gen Lofi, fx-filter Lofi Low (+ gentle sub, echo, sidechain if missing)
  - Piano and Tape Memory: specs written 2026-11-06 (tools/music/planned/piano.spec, tape-memory.spec), UI previews shown, his yes pending

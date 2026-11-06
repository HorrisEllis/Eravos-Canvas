# spec_id: music.lofi · kind setup · version 1.0.0 · status built 2026-11-06 (3.132, his "yes") → tools/music/suites/lofi/suite.json
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

# ---- ADDENDUM 2026-11-06 · built (3.132) — everything above kept
built:
  - tools/music/suites/lofi/suite.json: the parts above with Lofi presets; wiring; output Destroyer + Sidechain; macros DUST WARMTH SWING
    PUMP; scenes Study (starter) · Rainy · Late Night; steps: tempo 82 BPM first (a setup may now carry its domain's steps — the canvas
    passes them through unread, canvas/runtime/suites.js)
  - Chords: Voicing [tension, 7th, 9th, rootless 9] (default unchanged) + the jazz six (components/progression JAZZ_PROGRESSIONS); Bassline
    offers the jazz six too; Groove: the "boom bap" style; Lofi packs (data) for Groove, Chords, Bassline, Retro Poly, Filter, Deep Sub,
    Echo, Sidechain
  - played in the app: no faults, output −7…−10 dB RMS, peaks held under 0 dB by the master (the master compressor pulls 3–5 dB: the
    parts' levels could come down — open)
proof: tests/p132-lofi-setup.test.js 3/3; P119 (8 setups), Chords 12/12, Bassline 16/16, Groove, Echo, Filter, Sidechain, Deep Sub,
  Retro Poly, Drum Machine, Destroyer, boundary 10/10; progression component 14,884 checks; validate 244 manifests

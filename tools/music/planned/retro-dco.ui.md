# Tool UI — Retro DCO

Written with `docs/templates/TOOL-UI.md`. **Built 2026-11-06** (his "Build it.") as `tools/music/tools/genre-instruments/retro-dco/` — decision A for now (beside Retro Poly). The preview below is kept as it was shown.
Preview: `docs/previews/retro-dco.preview.js` (the real kit, in the real canvas, silent) · pictures: `node docs/previews/retro-dco.shots.mjs`
→ `retro-dco-preview.png`, `retro-dco-beside-retro-poly.png`, `retro-dco-more-depth.png`.

- **Tool:** `eravos.retro-dco` · genre instruments · spec: `tools/music/planned/retro-dco.spec` (extends Retro Poly)
- **Accent:** `#3be8ff` — night-drive cyan (Retro Poly is magenta), so the two read apart side by side.
- **Components it assembles (all 11 built and proved):** osc-va ✓ · osc-sub ✓ · osc-noise ✓ · unison-stack ✓ · filter-svf ✓ · filter-ladder ✓ ·
  env-adsr ✓ · lfo ✓ · ensemble-core ✓ · bbd-line ✓ · voice-allocator ✓
- **His words** (2026-11-06): "Retro poly is buggy. I love it though. Like I want more synthwave. Is there more coming?" · "Which components,
  like what overlap can we focus on to speed this up?" · "Do it." · "1, 2".

## What it is for, in one line

Retro Poly's sound and face, rebuilt from the shared parts — with the depth of the real 80s DCO polys: voice cards, a ladder filter with
drive, poly-mod and sync, an LFO with delay, the Juno chorus with its bucket brigade.

## The face (Retro Poly's, kept)

| Where | Controls | Component |
|---|---|---|
| header | preset bar · **Voice** poly / mono / legato / unison · **Filter** svf 24 / ladder · Chorus off / I / II / I+II · Hold | voice-allocator · filter-svf / filter-ladder · ensemble-core + bbd-line |
| display | Retro Poly's horizon at night (a cyan moon over the grid) + the **voice cards**: one cell per voice, lit when it plays, tilted by its own offset | voice-allocator |
| ARP row | Arp · Rate · Latch (as Retro Poly) | (the shared arp, later) |
| spectrum | as Retro Poly | — |
| DCO | Saw · Pulse · Width · PWM · PWM rate · Sub · Noise · Drift · Octave (same names and defaults as Retro Poly) | osc-va · lfo · osc-sub · osc-noise |
| VCF | Cutoff · Reso · **Drive** (ladder) · Env amt · Keytrack · HPF | filter-svf / filter-ladder · env-adsr |
| ENV | F att · F dec · F sus · Attack · Decay · Sustain · Release | env-adsr ×2 |
| VOICE · ARP · OUT | Glide · Octaves · Gate · Level | — |
| keyboard | as Retro Poly | — |

**Primary action:** none needed (an instrument: the keys). **Displays:** the horizon + voice cards (cyan on black — C1/C2, S black surfaces).

## More depth ▸ (folded; 26 controls)

VOICE CARDS Voices 1–16 · Card spread · Card seed · Steal (oldest / quietest / same-note / lowest / highest) ·
POLY-MOD Env → pitch · Env → width · Sub → pitch · Hard sync · Sync ratio · LFO Shape · Rate · Delay · → pitch · → cutoff · → width ·
VELOCITY → cutoff · → level · CHORUS+ Chorus mix · BBD hiss · BBD stages · UNISON Unison voices · Detune · Curve · Spread ·
SUB + NOISE Sub shape · Sub octave · Noise colour.

## Dynamic (what does nothing dims and says why — W7)

Drive ← Filter: ladder · Glide ← Voice not poly · Sync ratio ← Hard sync · BBD hiss / stages / Chorus mix ← Chorus not off ·
Unison voices / Detune / Curve / Spread ← Voice: unison.

## Decision for him

- **A:** Retro DCO is a new tool beside Retro Poly (both stay; Retro Poly as it is).
- **B:** Retro DCO **is** Retro Poly rebuilt — the same window gains Voice, Filter and More depth; every Retro Poly preset still plays the same
  (null render ≤ −60 dB, the spec's rule), and its bugs go with the old code. Proposal: B (his "buggy, I love it" — keep the love, lose the bugs).

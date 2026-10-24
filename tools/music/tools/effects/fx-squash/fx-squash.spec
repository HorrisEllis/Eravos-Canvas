# spec_id: eravos.organism.fx-squash · version 1.0.0 · phase 3.66 · status canonical
# "Wub Seq and a multiband squash" — the Wobble Bass's SQUASH (3.4) as a tool anyone can use · inherits STD.fx
identity:
  id: eravos.fx-squash ; label: Squash ; icon: ▤ ; accent: "#ff5533"
  comp_intent: OTT-style three-band squash for bass (and anything): quiet detail up, peaks flat, the growl up front.
  novelty: zero-latency multiband soft limiting (no look-ahead, no worklet) with the low band kept clean and optionally mono.
engine:
  split: Linkwitz–Riley 24 dB/oct — low LP(xLo) → allpass(xHi) · rest HP(xLo) → mid LP(xHi) · high HP(xHi); sums back flat at Squash 0
    (the Wobble Bass's own 12 dB/oct split leaked a tenth of a 50 Hz sub into the stereo mids — too loose for Mono lows)
  each band: drive d = 0.25 × (1 + amount × share × K) (K = 10, 24, 18) → tanh(1.5x)/tanh(1.5) → makeup (d/0.25)^0.55 / (1.66 d) → level
    at Squash 0 every band sits in the curve's straight part at unity: the input untouched (flat ±1 dB)
    quiet material comes up by (d/0.25)^0.55; the loudest peaks stay near where they were
  Lows clean (default on): the low band never leaves the straight part — the sub is never squashed
  Mono lows: the low band summed to mono · after the bands: LP 14 kHz (what the limiters fold up high) · STD mix / in / out / bypass
config: amount 0..1 def .5 ; low/mid/high 0..1 def .3/1/.6 ; xLo 60..600 def 180 ; xHi 1000..8000 def 2400 ; lowClean def on ;
  monoLow def off ; low/mid/high level ±12 dB ; STD fx
hooks: STD.fx ; sq.hook.mod_amount (mod_in: moves every squashed band's drive)
ui: the three bands across a log frequency axis — split points, how hard each band is squashed, its level in and out (want_meter)
presets: OTT Growl, Gentle Glue, Fizz Up Front, Riddim Wall, Mids Only, Sub Clean · Mono, Parallel Smash
tests: contract ; squash lowers a growl's crest factor (peaks flatter) without a big loudness jump ; lows clean = the low band
  passes unchanged ; mono lows = left and right of the low band identical ; flat at Squash 0 (±1 dB, 40 Hz – 10 kHz) ;
  zero latency (an impulse comes out on time)

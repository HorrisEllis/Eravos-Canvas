# spec_id: eravos.deep-songs · version 0.1.0 · status building (batch 1: 80s · Synth, Dubstep) · author: James Brooks (direction) · AI coder (build)
# His words (2026-11-14), verbatim: "what next? the piano is hard for me but l love it. can you look at every major song of all synthwave, edm,
#   dubstep, electronic, etc to make a wide contrast of songs per catagory that are as complex and deep as eravos can be. like per note edits,
#   automation, tools wired to other tools, etc. curves, etc. as deep as possiblr"
# Rules carried: "stop making new catagories. i told you the catagories." (2026-11-12) — every song lands on a shelf that exists, by its genre's
#   name (data/songbook.js CATS). "technique not copies" (3.36) — what is taken from a record is how it is made, never its melody.
# The research: docs/research/landmark-songs-techniques.md (the landmark records of each style and the technique each song takes).
purpose: per style shelf, six songs as different from each other as the style allows — each its own sub-style, form, tempo, groove and palette
  — and each as deep as ERAVOS goes. Not eight variations of one arc (what 3.174 did; his "wide contrast" asks the opposite).
shelves_and_batches:
  batch 1 (now): 🌆 80s · Synth — deepwave-{nightdrive, outrun, darksynth, dream, italo, slowfunk}
                 🔊 Dubstep & Wubs — deepstep-{og, wobble, talker, riddim, melodic, tearout}
  batch 2: 🏠 House · Garage · 🌀 Techno · Trance · Hard · 🎛 Trap · Phonk · Future ("edm")
  batch 3: ⚡ Drum & Bass · Breaks · 🌙 Chill · Ambient · 🖤 Dark · Goth · 🔥 Reggae · Dub ("electronic, etc")
  each batch shown (heard) before the next: his ear decides
depth_checklist (every song — the test measures each):
  notes      a knob set on a note (p) · a knob curve inside a note (c) · a bend with its own LFO (b.osc) · a chord from one note, strummed
             (x.iv) · plays on pass k of every N (x.cond) · chance (pr) · ratchets that speed up / slow down, grow / fade (rt, x.rs, x.rv) ·
             microtiming (mt: swing, a late snare) · humanize per pass (x.ht, x.hv) · per-note tool speed where it earns it (x.tempo)
  curves     ≥ 12 lanes: on instruments (cutoffs, FM, formants, vibrato, @pitch), on effects (echo throws, tape wear, filters, glitch) and on
             modulators (the XY Pad, an LFO's rate / depth)
  wiring     an LFO into a knob · the XY Pad's X and Y into two tools · a tool or an effect driving another tool (sidechain envelope → a
             filter, Swarm coherence → an echo, Tape dropouts → an echo, Dynamics gain reduction, Bass Forge's talk LFO) · effects chained ·
             the Arp playing a synth where the style has an arp
  form       its own (the sub-style's), not Floor Falls Out's arc; impact (the gap before a drop) only where the style drops
acceptance (tests/p188-deep-songs.test.js):
  - six songs a shelf, each its own genre, each on its shelf (Songbook.categoryOf), every tool and preset real
  - every song passes the depth checklist (counted from what it writes)
  - contrast: within a shelf the six songs' tempos span ≥ 30 BPM where the style allows (dubstep: half-time 138–150 → its forms, grooves and
    palettes differ instead: no two share a form or a lead instrument + preset)
  - none hidden as a repeat (Songbook.same), every note in key (P16), the previews levelled (P58)
  - two songs a shelf rendered: no fault, nothing clipping
open: the piano is hard for him (2026-11-14: "the piano is hard for me but l love it") — asked what is hard; a gentler layout shown first

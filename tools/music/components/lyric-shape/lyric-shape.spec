# spec_id: eravos.component.lyric-shape · version 1.0.0 · status built (3.228, 2026-11-25) · template eravos.component/1
# his words (2026-11-25, verbatim): "continue making more tools for eravos. i want to make music with contrast. thats my rhytm" ·
#   "i want to learn how to make music from my lyrics. that is the point of the rhythm tool"
identity:
  id: lyric-shape ; group: words ; component tool: no
  job: the shape of the words — per stanza its density, space, stress, light / dark words, push, opposites, the runs that come back — its
    energy, and the part it becomes (verse · chorus · build · drop · break, split when it holds opposites), each with the reason in words
used by: lyric-rhythm (the SHAPE card), data/rhythm-expand.js (♫ Make a song: the sections and their contrast)
inputs / outputs: in: text (+ a syllable counter, Lyrics → Rhythm's); out: { stanzas, arc, lesson }. Pure data, deterministic.
rules:
  - never imports a tool; tools import it · the word lists only steer (static earns its place) · contrast 0 = every stanza a verse (as before)
  - lines set apart one by one (a blank line after each) are one stanza of spaced lines (up to 4) — the space is part of its shape
proof: lyric-shape.test.mjs (17 checks: stanzas, energy order, drop / break / chorus / split, reasons, contrast 0, deterministic, edges)
open: words in other languages (the lists are English) · his own word lists (a pack beside the tool)

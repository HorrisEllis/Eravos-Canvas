# spec_id: eravos.object-model · version 0.1.0 · status proposed · 2026-11-03
# "The canvas is a way of viewing and manipulating musical objects. It isn't the container that defines what those
#  objects are." — the rule every canvas, engine and relationship in ERAVOS keeps.
# Depends on: eravos.temporal.spec (every time value) · component relationship-graph (eravos.music-ecosystem.spec §3)

## The rule
  ONE STORE   every musical object exists once, with a stable id: note, event, sub-event, clip, track, section, parameter,
              automation curve, binding, modulation source, relationship, motif, phrase, pattern, instrument assignment
  VIEWS       every canvas (eravos.canvas-family.spec) is a view on the store. Opening, closing or zooming a canvas never
              creates, copies or deletes an object
  ASSOCIATION NOT OWNERSHIP  objects nest where useful (project › section › track › clip › events) but membership is an
              association with its own id, not a copy. One note can be in a chord, a melody, a motif, a phrase, a generative
              pattern and an automation relationship at once; edit the note and every dependent view and association updates,
              each association keeping its own identity
  CROSSING    relationships are not bound to the tree: an automation lane inside one section can drive an effect on another
              track; a note can modulate a parameter of a different instrument

## Objects (minimum fields)
  every object   id · kind · created/modified (rev) · associations[] (ids) · time span (eravos.temporal coordinates) where it has one
  note           pitch (+ tuning ref) · start · duration · velocity · release velocity · expression lanes (pressure, slide, bend,
                 lift) · probability · ratchet · microtiming offset · articulation · instrument assignment · per-note automation
  event          trigger, hit, transient marker, automation point — same time model as notes
  association    id · kind · members[] · role per member · own fields
  association kinds (typed, extendable by users):
    temporal     precedes · overlaps · follows-after-gap
    harmonic     chord membership · interval to · voice in a voicing
    rhythmic     pattern member · subdivision of · ratchet of
    expressive   articulation · dynamic group
    instrument   played-by (sound / timbre / preset)
    modulation   source-of · destination-of (relational-modulation edges)
    thematic     motif instance (same motif elsewhere, with the transform that maps it: transpose, invert, augment …)
    generative   produced-by (generator id + seed — the output is still ordinary editable objects)
  relationship   the relational-modulation edge: source · destination · operation · depth · polarity · curve · offset · range ·
                 smoothing · condition · enabled · priority · rate (control | audio) — ONE graph for note associations, timeline
                 crossings and parameter relationships (component relationship-graph: typed edges, cycle detection, explicit
                 one-block feedback nodes)

## Queries (navigable associations)
  - where else does this motif appear (and under which transform)?
  - which notes form this note's harmony at its start?
  - which automation events / relationships shape this note's expression?
  - what depends on this object (impact before an edit or delete)?
  answered from the store, in ≤ 50 ms for a 100-track project; results open in the right canvas with selection kept

## Editing semantics
  - every change is an operation on the store with an inverse → one undo history across all canvases (undo tree, ecosystem §9)
  - deleting an object asks what to do with its associations (remove membership · keep the association with a gap · cancel)
  - non-destructive transforms (quantize, groove, humanize) are stored as operations with strength, re-editable later
  - generators write objects tagged with an association of kind generative; regenerating never overwrites a user edit

## Acceptance
  - one note in 5 associations: edit pitch → all 5 views update, association ids unchanged, one undo step reverts all
  - cross-tree binding: automation in section B drives track C's effect; moving section B moves the binding's time span with it
  - store round-trip: save → load is byte-exact; ids stable across sessions
  - relationship cycle without a feedback node is refused at connect time, with the cycle named

# spec_id: eravos.canvas-family · version 0.1.0 · status proposed · 2026-11-03
# "A canvas inside a canvas. I'd take that literally in Eravos." The piano roll isn't a panel in the timeline; it is its own
# creative canvas. Every canvas is a specialised VIEW on the same objects (eravos.object-model.spec).

## The family (each independently navigable, zoomable, with its own tools)
  Project Canvas      the whole creative environment (today's ERAVOS canvas of tool windows) — every other canvas opens from here
  Arrangement Canvas  tracks, groups, sections, phrases, audio + MIDI clips, automation lanes, transitions, global tempo + meter
                      (eravos.timeline-depth.spec). A clip is an object that opens into its own canvas
  Piano Canvas        notes and musical events (below)
  Automation Canvas   curves and bindings — opens from any parameter binding
  Audio Canvas        waveforms and samples, warp markers, spectral view — opens from an audio clip
  Instrument Canvas   synthesis and signal flow — the tool's components wired (Open as components) — opens from a note's
                      assigned instrument or a track
  Pattern Canvas      rhythms and sequences, polymeter lanes — opens from a pattern clip or a drum tool

## Navigation
  - open by gesture from the object that leads there: clip → Piano or Audio · note → Instrument · binding → Automation ·
    pattern → Pattern · any → back up the chain
  - position, zoom, selection and playhead are kept when moving between canvases (a breadcrumb shows the chain)
  - any canvas can be full-screen, a window on the Project Canvas, or split beside another; two canvases on the same objects stay in sync

## Piano Canvas
  space      infinite / expandable horizontal time · vertical pitch space (any tuning, eravos xen tools) · independent zoom both ways
  scope      NOT confined to one clip: show one clip, several clips, a whole track, or the whole song's notes (others greyed or coloured by track)
  layers     velocity · expression (pressure, slide, bend, lift) · articulation · probability · per-note automation · rhythmic subdivisions
  tools      selection and transform tools at every precision (eravos.timeline-depth.spec editing operations) — from one note to the composition
  built on   timeline.spec P48.1 (exact placement, paint/split/erase, grids, velocity lane, per-note knobs) — that editor becomes this
             canvas's note layer, re-based onto the object store (open question in the handoff doc: re-base vs rebuild)

## Notes as nodes of association
  A note is pitch · position · duration · velocity PLUS typed associations (object-model): temporal (precedes, overlaps) ·
  harmonic (chord, interval) · rhythmic (pattern, subdivision) · expressive (articulation, dynamics) · instrument (sound,
  timbre) · modulation (parameter relationships) · thematic (the motif elsewhere in the song).
  The Piano Canvas draws associations on request (lines, halos, colour by association) and answers, from a selection:
    - where else does this motif appear?           → every instance highlighted, with its transform; jump to any
    - which notes form its harmonic relationship?   → chord members lit
    - which automation events shape its expression? → the bindings listed; open in the Automation Canvas
  Associations are editable here: group notes into a motif, chord or phrase; link a motif instance; break a link.

## Acceptance
  - open a clip in the Piano Canvas, edit a note, return: arrangement shows the change, position and selection unchanged
  - Piano Canvas showing 3 clips from 2 tracks edits each note in its own clip (no copying)
  - "where else does this motif appear" finds every instance including transposed and inverted ones the user linked
  - the same note open in Piano and Arrangement canvases side by side updates in both within one frame

# spec_id: eravos.workshop · version 0.1.0 · status spec (2026-11-06) — a preview to him before any build · a canvas part (names no domain)
# His words (2026-11-06, UTC, verbatim — specs/eravos.2026-11-06-session.map.spec):
#   13:38:50 "Absolutely not. Like I’m talking a full workshop. Editing one note completely like it’s in the center of a work surface or operating
#            table or like photosyop"
#   14:09:18 "Agnostic. I was thinking it could be the beginning of photo manipulation tools. If possible."
# Stands on: eravos.object-model.spec ("The canvas is a way of viewing and manipulating … objects. It isn't the container that defines what
#   those objects are.") · eravos.canvas-family.spec · the canvas/content rule (CLAUDE.md) · Looking Glass's layers-as-a-runtime-operation (v2 note)

## What it is
ONE object on a work surface, edited completely. The surface, its layers, its tools, its history and its zoom are the canvas's; WHAT the
object is — a note, a pattern, an image — is a domain's. Music is the first domain on it; photo manipulation is the second it is built for.

## The surface (canvas, domain-free)
  centre    the object, large, on the table (pan, zoom to any detail; a grid that fades with zoom)
  left      the tool palette — the canvas's generic tools for each layer type, plus any the domain adds
  right     LAYERS (show · solo · lock · amount 0–100 % · order · blend for raster) · the selected layer's PROPERTIES · HISTORY (every edit, step back)
  bottom    the ZOOM PATH (what this object is inside, and what is inside it — click to go up or down a level) · hear / see it (the domain's preview)
  actions   Save to library (the object, or one layer as a stamp) · Apply (back to where it came from) · ⧉ Pop out (its own OS window, still connected)

## Layer types (the canvas draws and edits them; a domain only says what each layer MEANS)
  curve     a value over the object's length (time or space): points + curves — tools: Pen, Bend, Smooth, Jitter (by seed), Mirror, Stamp, Erase
  value     one number (with its range and unit) — the properties panel
  events    things at positions (notes in a pattern; marks) — Select, Move, Stretch, Duplicate, Erase
  raster    pixels (for photo manipulation): Brush, Eraser, Smudge, Clone, Select (rect, lasso), Transform, Fill — blend modes, masks
  adjust    a function over another layer (levels, curves, hue/saturation; for sound: gain, EQ) — non-destructive, reorderable

## The contract a domain gives (Workshop.addKind)
  { id, label, layers(obj) → [{ id, label, type, range?, unit?, get(), set(v) }], preview(obj) (hear / see it), thumb(obj, g, w, h),
    up(obj) → the object it is inside (or null), down(obj, at) → the object inside it at a point (or null), apply(obj) (write it back),
    tools? [extra tools] }
  The workshop knows no domain word: every label, unit and meaning comes from the kind (boundary test).

## First contents
  music · NOTE      layers: pitch (curve, semitones over the note — bends, vibrato, drift) · loudness (curve) · brightness (curve → the
                    instrument's filter for this note) · pan (curve) · timing (value: start nudge, length) · velocity (value) · any knob of
                    its instrument for this note only (curves) — preview: the note alone, with its neighbours, in the song
                    up: its PATTERN (events: notes) → up: the SONG; down: back into a note — the same surface at every scale (the fractal)
                    the components: pattern-store (patterns, versions), seed-registry (jitter, chance), scale-key (pitch layers snap)
  image · PHOTO     (a new domain, tools/image/ — the beginning of photo manipulation): raster layers, adjust layers, masks; open your own
  (proposed)        picture, layer it, brush, erase, clone, adjust, crop, export PNG — Canvas 2D first, WebGL when it needs speed
                    up: a collage / a board; down: a region

## Decisions (2026-11-06)
  - agnostic (his call, 14:09:18): the workshop is the canvas's; music and image are contents (CLAUDE.md: canvas and content stay separate)
  - the note editor IS the workshop at note scale; patterns are the workshop at pattern scale (his call 13:28:34: one editor)
  - the rejected preview (a roll with a tree and a grow strip, 13:38:50) is kept in tools/music/planned/pattern-editor.spec, not built
  - photo manipulation: "if possible" — yes in the browser and Electron (Canvas 2D / WebGL, the user's own pictures, no shipped images);
    its scope is phased, and it is a new domain, never mixed into music

## Phases
  W1 the surface + curve / value / events layers + history + zoom path; music's NOTE kind (fixes "the note editor doesn't work" — what fails: asked)
  W2 music's PATTERN kind (events) and the zoom chain note ↔ pattern ↔ song; library (save, stamp)
  W3 raster + adjust layers; the IMAGE domain's PHOTO kind: open, layers, brush, erase, adjust, crop, export
  W4 Pop out (an Electron BrowserWindow on the same engine), masks, clone, transform

## Acceptance
  - boundary test: canvas/runtime/workshop.js names no domain word; two kinds (note, photo) on the same surface, unchanged code
  - every edit is one undo step; Apply writes back exactly (a note round-trips bit for bit when nothing changed)
  - shown to him as a preview and approved before W1 is built

## ADDENDUM 2026-11-06T15:55:01.373Z — approved: "Nice. That's exactly it." (the preview, docs/previews/workshop-note.png + workshop-photo.png)

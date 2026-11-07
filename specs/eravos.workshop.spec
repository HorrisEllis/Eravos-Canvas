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

# ---- ADDENDUM 2026-11-07 — the field's surface: structure → shape → what emerges (nothing above is changed)
# His words (2026-11-07, verbatim): "workshop next? is that the highest leverage?" · "im struggling with patterns. like the complexity of them.
#   also nexus im working on field, that im trying to make agnostic." · "agnostic. the structure defines the shape which defines the emergent
#   properties of the conditions. no look at the spec workshop in idearium. look at the eravos phases" · "do it."
# Read in Nexus (read only): docs/2026-11-07-eravos-as-a-system-phasemap.spec (ERV0–ERV5: COS the hub; ERAVOS registered, not copied; ERV4 the
#   kind contract as a schema; ERV5 the visual coding and debug environment, after CIE11, EM2, RF1, CF1) · emerge/emerge/spec/field.spec (the
#   constrained relational field: its shape is constraints; a transition is admitted or refused with its cause; state deterministic,
#   observations above it; rewind by refolding history) · idearium/ui/js/workshop.js + phases WK1–WK6 (the spec workshop: documents).

## A new layer type (the canvas's; agnostic)
  constraint  a rule over the object's space that ADMITS or REFUSES positions / values (a scale over pitch, a grid over time, a range, a
              set per region — chords per bar; for a photo: a palette, a crop, a mask) — the canvas draws what is admitted (the possibility
              space) and what is refused (closed), the domain says what the rule means. Constraint layers together are the object's SHAPE.
  emergent    events the conditions produce inside the shape (by a seed, deterministic: the same shape + the same seed → the same events);
              a locked event is the user's and is kept when the shape changes; editing the shape re-derives the rest, live while it plays.
  So a pattern is not a machine with knobs: it is a structure; its shape defines what can emerge. The same surface, at code scale (ERV5),
  is the field's view in Nexus.

## music · PATTERN (the first kind built, before NOTE — patterns are the highest leverage: his "tools where i can have it automate the beat or
## pattern is immensly high leverage")
  structure   Scale (constraint) · Chords (constraint per bar) · Grid (constraint: steps, euclid k of n, swing) · Range (constraint) ·
              Density (curve: how much of the admitted space emerges, over the bars) · Contour (curve: where the line leans)
  emerges     Notes (events) · Yours (locked events) · Variation (value: the seed)
  plays into  any wired instrument (it replaces nothing: Bassline, Arp, Groove keep working; each can open its pattern here and, later,
              stand on this kind — proved by the null render before any tool moves)
  preview     docs/previews/workshop-pattern.png (node docs/previews/workshop.shots.mjs) — shown to him before W1 is built

## Order (revised; W3, W4 as above)
  W1  the surface + layer types (curve, value, events, constraint, emergent) + history + zoom path; Workshop.addKind checked against a
      schema (ERAVOS's side of Nexus ERV4: schemas/workshop-kind.schema.json; a kind missing apply is refused and named); music's PATTERN
  W2  music's NOTE kind and the zoom chain note ↔ pattern ↔ song; library (save, stamp); Bassline / Arp / Groove open their pattern here
  ERAVOS's side of Nexus ERV3: a suite template (templates/suite/) — none exists; schemas here are the source (ERV_D2 (a))
  ERAVOS's side of ERV2 (its own registry at its door) waits on ERV1 (Nexus)

## His calls, as read (to confirm — "do it." answered a message that proposed them)
  ERV_D1 ERAVOS joins Nexus by registration, never copied · ERV_D2 ERAVOS's schemas are the one source, COS's copy checked against them ·
  ERV_D4 the name: "the Workshop", as the field's surface ("field" stays the name of the relational constraint field)

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

# ---- ADDENDUM 2026-11-07 (2) — the look (nothing above is changed)
#   his words: "no that looks like a childs tool. look at the spec workshop ui. something like that. you can add more themes also. cos is meant
#   to be the eco system. my compartmentalizing."
#   The kit preview (docs/previews/workshop-pattern.png) is rejected and kept. The Workshop takes the language of Idearium's spec workshop
#   (Nexus idearium/ui/css/void-theme.css, read, not copied): the Void (near-black, its stars), Bebas Neue wide-tracked, DM Mono for working
#   text, hairlines, 2px corners, capitals, the zoom path as the pipeline's numbered stations, glass panels: layers left (STRUCTURE · WHAT
#   EMERGES), the surface centre, DETAILS right (the selected layer large, its fields, shape, mode, hear, history), APPLY → bottom of the bar.
#   Preview: docs/previews/workshop-void.html (node docs/previews/workshop-void.shots.mjs). The same language comes to ERAVOS as a theme,
#   "Void" — a new choice beside Dusk, Studio, Field, Midnight; today's look stays the default. Fonts: canvas/runtime/fonts (SIL OFL 1.1,
#   licences beside them).

# ---- ADDENDUM 2026-11-07 (3) — a build surface (nothing above is changed)
#   his words: "can you make it more like photoshop? or like a 3d renderer? then it could support a game engine, like this could be the build
#   surface for emerge."
#   The layout of an image editor / a 3D editor, in the Void's language: menu · options bar (the current tool's settings) · tool strip ·
#   document tabs (any kind: pattern, note, photo, scene, .eg module) · ONE viewport (2D or 3D; orbit camera; flat or exploded; wire / lit) ·
#   docked panels: OUTLINER (the zoom chain as a tree), LAYERS (thumbnail, visibility, lock, blend, opacity, grouped), INSPECTOR / HISTORY /
#   FIELD · TIMELINE (dope sheet: keys on any layer over time) · ASSETS (kinds, stamps, the library) · status bar.
#   Agnostic by construction: each panel shows what the open kind gives it; the viewport draws the kind's layers (2D) or its layers as planes
#   in space (3D). New kinds this makes room for (each its own domain, its own spec, later): SCENE (a game: objects, transforms, a camera,
#   play in place) and the Emerge MODULE (code as nodes moving through the field — Nexus ERV5, after Emerge, WARP 2, RF1, CF1).
#   Preview: docs/previews/workshop-studio.html (node docs/previews/workshop-studio.shots.mjs). The Void preview (workshop-void.png) is kept.

## ADDENDUM 2026-11-08 — W2 slice a: notes and patterns open on the Workshop (his report)
# James, 2026-11-08: "The edit pattern or note doesn’t open workshop." · "The workshop should be built. It says in the commit"
# Found: W1 (3.150) built the surface and the PATTERN-structure kind; the Step kind followed (PR #139, #141). The piano roll's "✎ Edit note…"
# still opened the 3.116 inline editor and the Patterns browser's "✎ Edit notes" the piano roll: W2's NOTE kind was never built, so his
# call (13:28:34, 2026-11-06: "one editor"; this spec: "the note editor IS the workshop at note scale; patterns are the workshop at pattern
# scale") was not yet true in the app. The approved note preview (docs/previews/workshop-note.png, "Nice. That's exactly it.") stands.
W2a  music's NOTES kind (`music.notes`, tools/music/tools/arrange/timeline/timeline.workshop.js — content, never canvas/):
       document  { notes: the clip's notes as the roll keeps them (s, l, n, v, pr, rt, mt, b{from,to,at,shape,osc{rate,rateTo,depth,shape,fade}}),
                   sel: the note open, name, drums }
       stations  SONG › PATTERN (its name) › NOTE (its pitch): the zoom chain. Pattern scale = every note drawn; a click on one opens it
                 (pick → sel). Note scale = that note's layers.
       layers    PATTERN (events: which note is open) · TIMING (value: start, length, nudge) · PITCH (value) · VELOCITY (value) ·
                 DEPTH (value: chance, ratchet) · BEND (curve: from, to, starts, curve) · OSCILLATE (curve: depth, rate, shape, fade in);
                 drums: no bend, no oscillate (the roll's own rule).
       live      every edit reaches the clip at once (the roll's commit → clip_edit), one undo step each.
     wired     "✎ Edit note…" opens the note on the Workshop; double-click keeps the quick inline editor (nothing taken away).
               "✎ Edit notes" (Patterns) puts the pattern on the Timeline as before and opens it on the Workshop at pattern scale.
     proof     tests/p154-workshop-notes.test.js: Edit note… opens music.notes on that note; an edit reaches the clip; pick opens another
               note; Patterns › Edit notes opens the Workshop; the inline editor still opens on double-click.

## ADDENDUM 2026-11-08 (later) — W2b: the Workshop hosts the whole piano roll (his words)
# James, 2026-11-08: "need all of the node editor from the timeline, like workshop needs much more. can you continue the workshop."
W2b  The canvas's Workshop may HOST a kind's own editor in its viewport (domain-free: Workshop.open(..., { host, hostLabel, hostKey, onView })):
       view      two tabs over the viewport: the hosted editor (first) and the kind's drawn view (kept: nothing taken away)
       history   api.record(doc, label): an edit made in the hosted editor is one step in HISTORY (no onChange echo);
                 api.sync(doc): the editor's selection reaches the inspector (no step); undo / redo / a HISTORY click restore through onChange
       keys      hostKey(e): the editor keeps its own Esc (a selection, its quick editor, step input); Esc with nothing open closes the Workshop
     music   "✎ Edit note…", Timeline right-click › ✎ Edit notes and Patterns › ✎ Edit notes open the Workshop with the Timeline's piano roll
             in it — every tool (draw, paint, split, erase, select, bend, sketch), grid, zoom, lanes (velocity, curves), patterns, scale lock,
             quantize / humanize / legato / Connect edges, clipboard, step input, per-note knobs — the roll's own code, moved, not copied.
             Each roll edit is a HISTORY step (ADD · EDIT · DELETE, with how many notes); the inspector follows the selected note.
             Closing puts the roll back in the Timeline at the same spot; hiding the roll closes the Workshop. ⛶ and ⧉ hide inside it.
     dag     Workshop(host) ← timeline.pianoroll.el · roll.commit → clip_edit + Workshop.record · Workshop.undo → onChange → roll.commit
             (no record) · roll.select → Workshop.sync · Workshop.close → onClose → the roll back home
     proof   tests/p155-workshop-hosts-roll.test.js 3/3; P154 4/4 (the drawn view is the second tab); Timeline 89/89; boundary 10/10

## ADDENDUM 2026-11-08 (later still) — W2b withdrawn: the roll stays on the canvas; the note editor shapes a note (his correction)
# James, 2026-11-08: "no the note editor, not the piano, the tools are for the canvas. if its going to be in the workshop, it needs to add what the timeline doesn't. like all the ways to manipulate a note, that the piano roll has. im trying to decide if thats better or not. the note editor is for fully shaping, manipulating."
W2b (the Workshop hosting the piano roll, PR #145) is taken back out: the roll's tools are the canvas's (the Timeline). Kept above as it was
(nothing lost). The Workshop's note scale is for FULLY SHAPING one note — what the Timeline and its roll do not do. Open: his decision on
whether that split is better (the coder's read: yes — the roll arranges many notes, the note editor shapes one, no copy between them).

## ADDENDUM 2026-11-08 (night) — W3: the 3D viewport, and SHAPE: a note shaped fractally (his words; nothing above is changed)
# James, 2026-11-08: "yeah, that needs to be moved to the editor. pattern editor. i want you to finish the workshop with the 3d. the preview
#   should be in here if not i have it." · "i want the 3d. like i want like a full modulation, waveform, oscillation, like all the ways to edit
#   a sound, give it as much depth as possible. fractally and recursively."
# "that" = the list of ways to shape one note the Timeline does not have (pitch over its life, volume, tone, time, space, variation…).
# The 3D preview is in the repo: docs/previews/workshop-studio.html / .png (ADDENDUM 2026-11-07 (3)): orbit camera, layers as planes,
#   3D · 2D · TOP · FRONT · EXPLODED · FLAT · WIRE · LIT.
W3a  THE VIEWPORT IN 3D (canvas, domain-free — canvas/runtime/workshop.js)
       modes      2D (the kind's draw, as now) · 3D (the kind's layers as planes in space: each layer drawn by the kind on its own plane,
                  K.drawLayer(g, W, H, doc, layerId, { wire }), stacked EXPLODED (apart) or FLAT (together)); views TOP · FRONT · free orbit
                  (drag to turn, wheel to zoom); WIRE (lines only) · LIT (glow); an axis gizmo. Near-orthographic: a plane is an affine image
                  of its 2D drawing, so Canvas 2D draws it (no WebGL needed; WebGL when it needs speed — Looking Glass later).
       draw       K.stroke(doc, points, W, H, { selected }) → { key, value, label }: a drag in 2D draws (one history step)
       actions    an action may carry { key, value } (an edit, one history step) — K.actions(doc, { selected })
       stations   K.stationKey: a click on a station is an edit (go up the zoom path)
W3b  SHAPE — a note shaped fractally (music, tools/music/tools/arrange/timeline/timeline.workshop.js)
       a SIGNAL  { base: points [t 0…1, value], mods: [MOD] }  — what moves over the note's life
       a MOD     { shape: sine · triangle · saw · ramp · square · random (stepped) · smooth (random, glided) · drawn (a wave you draw),
                   wave (the drawn cycle), rate: SIGNAL (cycles over the note), depth: SIGNAL (in the target's units), phase, fade, seed, on }
       recursion a mod's RATE and DEPTH are SIGNALS, so they have mods, whose rate and depth are signals … — down to any level (bounded at 8 so
                 the sound is always computable); the zoom path shows where you are: SONG › PATTERN › NOTE › PITCH › MOD 1 › RATE › MOD 1 …
       targets   PITCH (semitones over the note — glides, scoops, falls, vibrato with fade-in, trills, drawn melodies inside one note) and
                 ANY number knob of the note's instrument (filter, drive, level, pan, wobble … — what the instrument has), each its own signal
       sound     the tree compiles into what the engine already plays: pitch → the note's drawn bend path (b.path, 64 points), each knob → its
                 per-note curve (c, 64 points, clamped to the knob's range); the tree itself is kept on the note (sh) so it opens again as it
                 was. Live: every edit reaches the clip at once. No toys: nothing recorded, every value the engine rebuilds.
       3D        the open signal's planes: RESULT (what plays), BASE, each MOD's contribution, each mod's RATE and DEPTH — exploded upward,
                 the recursion as height
       dag       note.sh ─ compile ─→ note.b.path + note.c ─→ clip_edit ─→ timeline.engine (cleanB/cleanC, bendNote, per-note curves) ─→ sound
       open      (his to choose next): per-note envelope beyond the instrument's knobs · stereo width · conditions (every Nth loop, fills) ·
                 layering one note into a chord · audition alone / A-B · the IMAGE domain's PHOTO kind (old W3 raster) moves to W4

## ADDENDUM 2026-11-09 — W3c: hear it, give its shape to all, its own knobs (his words; nothing above is changed)
# James, 2026-11-09: "Just ant them to be zipped per tool. With a dag. This is future plans.  Not now. Continue the wokshop"
W3c  ▶ HEAR       the open note alone through its lane's instrument: its bend path, its knob curves, its own knob values, its length
                  (the Timeline's note_audition; at most 4 s) — from any place in the tree, so a change is heard where it is made
     ⇉ ALL NOTES  every note of the pattern takes this note's shape (sh, compiled for each) and its own knob values — one history step
     ITS KNOBS    any number knob of the instrument set for this note only (p): an envelope per note (its attack, its release), its
                  drive, its cutoff … — ＋ Set a knob for this note, its value in the inspector, ✕ KNOB back to the instrument's
     dag          note.p ─→ clip_edit ─→ timeline.engine cleanP ─→ note:trigger params ─→ the instrument for that note
     proof        tests/p157 2/2
     open (his)   conditions (every Nth loop, fills only) · one note into a chord · stereo width beyond the instrument's knobs · A / B

## ADDENDUM 2026-11-09 (2) — W3d: how a note plays (his words; nothing above is changed)
# James, 2026-11-09: "Yes the rest of the note shaping. Enterprise grade. Studio quality."
W3d  note.x — every part played by the Timeline (timeline.engine.js playNotes), absent = the note plays exactly as before (proved)
       when        cond { every 2…16, at 0…every−1, skip? } — plays (or skips) on pass `at` of every `every` passes of its clip / repeat
       chord       iv: up to 6 intervals (−24…+36 st) above / below the note; strum 0…250 ms between voices; dir up · down · out (from the root);
                   fall: each voice that much softer — named shapes in the Workshop (octaves, fifth, power, major, minor, sus, dim, aug, 7th,
                   maj7, min7, add9, minor 9, stack of 4ths); every voice carries the note's bend, curves and knob values
       ratchet     rs: even (as before) · accel (hits speed up) · decel (slow down); rv: fade (as before) · flat · grow
       humanize    ht ± ms (0…60), hv ± velocity (0…0.4), seeded by clip, note and pass — the same pass plays the same, every time
     A / B (the Workshop's): SET A keeps the note as it is; ▶ A hears it; ⇄ A/B swaps (one history step each) — before / after
     ▶ HEAR plays the chord's voices; ⇉ ALL NOTES carries x with the shape
     the view: the chord's voices as their own lines (strum offsets), the ratchet's hits with their velocities, when and humanize in words;
       a long choice list in the options bar is one dropdown (canvas: > 8 options)
     dag   note.x ─→ clip_edit ─→ cleanNotes xn() ─→ playNotes: cond → (jitter) → voices × hits ─→ note:trigger
     proof tests/p158 6/6 (counted from the triggers: 4 of 16 passes, voices and strum to the ms, gaps shrinking / growing, velocities,
       humanize within range and repeatable, plain notes unchanged); P112 13/13 (the old event depth) green
     not here: stereo width as its own control — a note reaches its instrument, not a mixer; width and pan are per note through the
       instrument's own knobs (ITS KNOBS, SHAPE), where the instrument has them

## ADDENDUM 2026-11-09 (3) — W3e: the layout, keys and menus (his words; nothing above is changed) — shown to him before it merges
# James, 2026-11-09: "Okay the ui needs more of a photoshop format. Like layers. I hate the top right. Add key bindings. Right click context menus less explicit buttons for things that make it look low quality and cluttered. Like undo doesn’t need a button. Make it enterprise grade, powerful but as simple as possible without losing control or functionality. Like undo and redo. Shouldn’t be two places to change the chord either. Replace the bottom right with a photoshop esc layers menu and group the layer tools there."
W3e  the bar          the name and the path only (click a station to go up) — no buttons (UNDO, REDO, APPLY, × and the kind's actions gone)
     the options bar  the current tool and what it works on, and the view (2D 3D · TOP FRONT ORBIT · EXPLODED FLAT · WIRE LIT) — no value fields
     the tool strip   SELECT (V: a click opens what is under it) · DRAW (B: drag draws the selected curve) · ORBIT (O: drag turns the 3D view)
     top right        PROPERTIES (the ONE place a value is edited) · HISTORY · OUTLINER
     bottom right     LAYERS, Photoshop's way: eye (show / hide), a thumbnail drawn by the kind, name and what it holds; groups fold;
                      double-click opens it (the kind's `open` action); right-click: hide, show only this, show all, then what the kind can do
                      with it; the LAYER TOOLS in its footer (the kind's actions with an `icon`: up, open, add, remove, unshape)
     keys             Ctrl+Z / Ctrl+Shift+Z (Ctrl+Y) · Ctrl+Enter apply · Esc close · V B O · ↑ ↓ layers · H hide (Alt+H only this) · 2 3 ·
                      T F · E W · ? the key sheet — and the kind's: Space hear · Shift+Space hear A · A keep as A · X swap A/B · Shift+A every
                      note · Enter open · Backspace up · M add a modulator · Delete remove · U stop shaping
     menus            right-click the view: the kind's actions, the view, undo / redo / apply / close — each with its key (context-menu.js
                      gained item.keys); in the Workshop the menu takes the Workshop's look
     contract         an action may carry name (its words in menus), keys, icon (a layer tool), open (what Enter / a double-click does),
                      only ('layer' | 'view'); a choice with > 8 options in the options bar is a dropdown (W3d) — the bar no longer holds fields
     proof            tests/p159 1/1; P150 (its field edit now in PROPERTIES), P151, P154, P156, P157, P158, P110, boundary green
     previews         docs/previews/workshop-layers-layout.png · workshop-layer-menu.png · workshop-keys.png

## ADDENDUM 2026-11-09 (4) — W3f: navigate, the instrument, a note's speed, the note library (his words; nothing above is changed)
# James, 2026-11-09: "I’m glad you got rid of the redundant ass second section for fucking changing the chords. The top half of the canvas should be able to collapse. Unless you can select the other notes, or actually maybe make that like a mini piano roll preview so you can edit one at a time and not have to hit save and then edit again and then write like I’m just saying make it like a way to navigate. OK now the mod section drop down menus not 1 million buttons. … the top left one isn’t even doing anything practical, replace it with a drop-down menu to change to tool."
# Asked which tool the dropdown changes: "Any tool the piano roll can play. Also a note library, inside of the patterns library. Have 2 tabs. One for notes, the other for patterns. Agnostic note. Also the tempo and speed it plays. Like have the tool speed up for a single note. Way more depth."
W3f  NAVIGATOR      the top of the view is the pattern as a mini piano roll (keys, bars and beats, every note, the open one lit, shaped notes
                    marked); a click opens a note — nothing to save, nothing to reopen; [ and ] step through the notes; N (or ▴ fold) folds
                    it to a strip and gives the shaping view the room (kept while ERAVOS runs)
     DROPDOWNS      a choice with more than 3 options is one dropdown in PROPERTIES (the wave, the chord, speed …); on / off stays two
     PICKER         the options bar's top left (it repeated the selected layer) is now PLAYS: a dropdown of every tool the roll can play —
                    those on the canvas and every instrument that can be added (a new one is made); the lane follows, and undo puts the
                    lane back (the document carries the target; the roll keeps the lane in step on every change); the knobs to shape follow
     SPEED          note.x.tempo (¼ … 4 ×): the Timeline sends it with the note; the music SDK gives the TOOL that speed for that note only
                    (ctx.bpm × it while the note owns it — synced LFOs, arps, gates, anything reading the tool's tempo), then its own again;
                    the same ownership as per-note settings (sdk-music noteTempo; note schema `tempo`)
     NOTE LIBRARY   tools/music/data/note-library.js (window.NoteLibrary): a saved note = how a note moves and plays (sh, b, c, p, x,
                    chance, ratchet, nudge, velocity) without its place or pitch — agnostic: it fits any note of any tool; knob parts
                    come along only where the instrument has the knob, the rest is said (LIBRARY in the status bar). Ctrl+S saves the open
                    note; PROPERTIES › From the library puts one on it; Shift+L opens Patterns › Notes. The Patterns library has two
                    tabs: PATTERNS (as before) · NOTES (each saved note drawn, Apply → the note open in the Workshop, rename, delete)
     dag            note.x.tempo ─→ playNotes ─→ note:trigger.tempo ─→ sdk noteTempo ─→ ctx.bpm (bpmFns) ─→ the tool's synced parts
                    Workshop ─Ctrl+S→ NoteLibrary ─→ Patterns › Notes ─Apply→ Workshop.set('libApply') ─→ clip_edit
     proof          tests/p160 4/4 (a navigator click opens G4, [ ], N folds; dropdowns; the picker adds an instrument, the lane follows, undo;
                    the trigger carries ×2 and the tool runs at ×2 bpm for the note, then its own; save, fit another note, what is left out,
                    the Notes tab applies); P154 … P159, Timeline 89/89, boundary green
     previews       docs/previews/workshop-navigator.png · workshop-note-navigator.png · patterns-notes-tab.png

## ADDENDUM 2026-11-09 (5) — W3g: the toolbar (draw, shape, edit on the canvas), tempo, rhythms from the library (his words; nothing above changed)
# James, 2026-11-09: "looks great though, the tool but i want to be able to manipulate it on the canvas, like photoshop, needs the toolbar, for
#   drawing, shaping, editing, etc. tempo. next patterns from the pattern storage, maybe rename it to rhythm library."
W3g  TOOLBAR (canvas, domain-free; the left strip) — every tool works ON the view, live while the hand moves, one history step when it lets go:
       SELECT V (a click opens what is under it) · PEN P (draw freehand: only the stretch drawn changes) · LINE L (a straight line from where the
       drag starts to where it ends) · POINTS D (the curve's points as handles: drag one to move it, click the curve to add one, Alt+click to
       remove one) · SMOOTH S (a brush that smooths what it passes over) · MOVE G (drag the whole curve up or down; Shift scales it around its
       middle) · ERASE E (a brush that flattens what it passes over to the curve's rest value) · ORBIT O (turn the 3D view)
       contract: K.drag(doc, tool, points, W, H, { selected, phase: 'move' | 'end', alt, shift }) → { key, value, label }; the canvas draws
       K.set(doc, key, value) while the hand moves (no history) and records it once at the end; K.draw gets { tool } (handles for POINTS).
       Spread / flat moves to Shift+E (E is the eraser).
     music    the tools work on the open curve — a SIGNAL's base, or, a modulator selected, its wave (one cycle; it becomes drawn). On the
              note itself (nothing open), a tool opens its PITCH to shape (making it if needed).
     TEMPO    the options bar: PLAYS · TEMPO (the song's BPM, the transport's own; undo puts it back) — the per-note Speed stays in HOW IT PLAYS
     RHYTHMS  the Patterns library is the RHYTHM LIBRARY (the name on its button and tab; the code keeps PatternLibrary). From the Workshop,
              R opens it; each rhythm (a pattern with notes) has ⇥ Into the Workshop while a pattern is open there: its notes replace the
              open pattern's (in the song's key; one history step — undo brings the old notes back)
     proof    tests/p161

## ADDENDUM 2026-11-09 (6) — W3h: what to do with it (his words; nothing above is changed)
# James, 2026-11-09 (on 0.2.19, a screenshot of the note in 3D): "what do i even do with this? i cant edit layers or draw, manipulate or do
#   anything with it. no way to close, save or play the note either."
# Found: 0.2.19 was built before the toolbar (W3g) merged; play, save, close lived only on keys and menus with nothing on screen saying so; in 3D
#   every layer was a plane, numbers too (bars that mean nothing), and a drag only turned the view; the canvas's element helper turned
#   disabled: false into a disabled button (the layer tools were never clickable); the tests ran without workshop.css (no real layout).
W3h  AT HAND      ⤓ save to the note library · ▶ play it · ✕ close — at the foot of the tool strip (an action's `strip: true`), always there
     HELP LINE    a line in the view says what the hand can do here (on the note, in a curve, in 3D) — the kind's hint(doc, { tool, mode })
     3D           only shapes are planes (a value layer is a number); a click (no turn) selects the plane under it; a double-click opens it
                  (2D too); OSCILLATE's plane is its oscillation alone
     FIXED        disabled: false no longer disables (el helper); tests/run.html loads workshop.css, so every Workshop test runs the real layout
     proof        tests/p162 1/1; P150 … P161 green with the real layout

# ---- ADDENDUM 2026-11-11 — pattern scale on the Workshop (3.165; nothing above is changed)
#   his words: "the pattern editor is meant to be in the workshop, like more than just a note" · "im struggling with complex patterns."
#   The notes kind edits the pattern too: the map adds a note on an empty spot; ✕ NOTE; ✦ IDEA (notes from a structure in the song's key,
#   another take each press, busier / sparser); SAVE PATTERN → the rhythm library (Yours); Patterns › ＋ New pattern. Open: move / resize a
#   note on the map; every 3D plane editable; an idea per kind of part (bass, chords, drums).

# ---- ADDENDUM 2026-11-12 — a new layer (nothing above is changed)
#   his words: "also why cant i add layers?"
#   A kind may say what can be made: addable(doc) → [{ section, label, key, value, hint }] — each an edit, one history step. The surface shows
#   ＋ on LAYERS (New layer, Ctrl+Shift+N) and a NEW LAYER section in its right-click menus. music · NOTE: SHAPE OVER THE NOTE (pitch, any
#   knob of its instrument — a curve, a plane in 3D) · SET FOR THIS NOTE ONLY (any free knob). Open: per-pad knobs for drum tools (tune, decay).
#   his words, then: "it worked before. when i was able to add mods. we are regressing. it was exploded before and i was able to draw. no it
#   should be under the layers section. also the mods." — in 3D every layer is a plane again (as at 3.156); ＋ (New layer) and ∿ (a modulator
#   on the selected shape) sit at the foot of LAYERS; ＋'s menu adds MODULATE.

# ---- ADDENDUM 2026-11-12 (2) — drawing draws (nothing above is changed)
#   his words: "okay exploded view works. drawing does nothing."
#   At the note a drag draws into the shape it is over (pitch, or a pad's first knob), making it if needed — one step. In 3D the pen draws on
#   the plane under it: a kind with planeDraw: true gets drag(…, { norm: true }) with points 0–1 across and up that plane; the camera turns
#   with Alt, the middle button, O (Orbit), or a drag that starts off every plane.

# ---- ADDENDUM 2026-11-13 — layers, finished (nothing above is changed)
#   his words: "make sure we can edit, change and manipulate layers in workshop. Let's get that finished."
#   A kind says what each layer can do: layerOps(doc, id, { clip }) → { enable, amount, rename, duplicate, remove, reset, move, copy, paste,
#   label: { op: words } } and does it: set(doc, '@layer', { id, op, value }) (it may name the layer to select next: __sel); copyLayer(doc, id).
#   The surface: the eye (off in the result where the kind can, else the view's hide; Alt+click = only this) · lock (the surface's: no edit,
#   field or pen reaches a locked layer) · amount in PROPERTIES · drag / Ctrl+[ ] to order · F2 / double-click to rename · Ctrl+J · Delete ·
#   Ctrl+C / V (one clipboard for every document) · reset — each one undo step; the layer's menu lists only what it can do.

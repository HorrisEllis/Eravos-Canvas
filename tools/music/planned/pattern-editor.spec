# spec_id: eravos.pattern-editor · version 0.1.0 · status spec (2026-11-06) — UI preview to him before any build · template eravos.tool/1
# His words (2026-11-06, UTC, verbatim — specs/eravos.2026-11-06-session.map.spec):
#   09:23:29 "Also. I don’t think the note editor works and it would be nice to open in a popout window windows.  Or the option. Even a window
#            separate like from the canvas but still connected. That way I can alt tab."
#   09:23:29 "Also maybe full, I keep envisioning like a whole ass extremely detailed note and pattern editor. Like fractals. Then can save for
#            later. I’m struggling with the complicated patterns."
#   13:28:34 "The pattern and note editor are the same."
#   13:30:25 "First."  (the editor track first: this spec, then pattern-store · seed-registry · scale-key, then the UI preview)
identity:
  id: eravos.pattern-editor ; label: Pattern Editor (notes and patterns: one editor) ; domain: music ; family: musical_intelligence
  lineage: the piano roll and the step sequencer (one thing, not two); tracker-style nesting; L-systems and self-similar rhythm (fractals)
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  pattern-store · seed-registry · scale-key
adds (behaviour only this tool has):
  - one editor for every note and every pattern: a pattern is notes AND patterns placed inside it (nesting, any depth) — the fractal
  - grow: a pattern written into each of its own notes, scaled to the note (self-similar), to a depth — then flattened to notes you can edit
  - variations by seed: every random step names its seed (seed-registry) — the same seed is the same result, Reroll writes a new one
  - a library of your own patterns, saved for later, versioned (every save a new version; the old one kept), diffable
  - opens in the canvas, in its own borderless panel, OR in its own OS window (alt-tab) — the same editor, still connected
replaces (not removes): the Timeline's piano roll becomes this editor's note view. Every piano-roll feature (timeline.pianoroll.js header:
  P1–P4 precision, draw/paint/split/erase/select, velocity lane, step input, 3.56 bends, 3.57 sketch, 3.109 panel, 3.113 one row + Pattern,
  3.115 clip look + canvas zoom) is kept; the roll's tests (piano 35/35 and its phases) must stay green at every step.
data (pattern-store, the one model):
  pattern { id, name, len (sixteenths), key? { root, scale }, notes: [{ s, l, n | r, v, b?, k? }], places: [{ ref, at, xf }], tags, v (version) }
    notes exactly as the Timeline's clips have them today ({ s, l, n, v } + bends b + per-note knobs k; r = semitones from the root, as the
    Pattern Library stores them) — a clip's notes ARE a pattern, nothing converts
    places: another pattern inside this one — at (sixteenth), xf { transpose (semitones or scale steps), stretch, reverse, invert, every
    (play on the Nth repeat), chance (0…1, by seed), seed }
  flatten(pattern) → notes (recursion to a depth limit, cycles refused) — what the instrument plays and what the note view edits
  grow(base, rule, depth) → pattern: each note of `base` becomes `rule` placed at that note, stretched to its length, transposed to its pitch
signal_dag:
  pattern-store (patterns, places, versions) → pattern-store (flatten) → scale-key (snap to the key) → notes
  seed-registry (seeds by path) → pattern-store (chance, every, grow variations)
  notes → out (note_out to an instrument; the Timeline's clip)
ports:
  in:  theory_in (key) · transport_in (play position) · note_in (record) · data_in (a pattern from the Pattern Library or another tool)
  out: note_out (what it plays) · data_out (the pattern itself — another tool can place it)
params: grid (1/4 … 1/64, triplets) · length (bars) · depth (grow 0…4) · chance amount · seed · key lock · view (notes · tree · library)
face (to show him as a preview first): the note view (today's roll, kept) on top; under it the PATTERN TREE (what is placed inside what,
  each place a block you can drag, transpose, stretch, mute); a GROW strip (pick a rule pattern, depth 0–4, see it unfold); the LIBRARY
  (yours, by type, saved for later); Reroll · Save · Pop out (its own window)
decisions (2026-11-06):
  - one editor (his call, 13:28:34) — the sequencer's steps and the roll's notes are both views of a pattern
  - the piano roll is not thrown away: its code becomes the note view, so nothing he has now is lost (axiom 9) and its tests keep it honest
  - fractal = nesting + grow, both flatten to plain notes: nothing exotic reaches an instrument, and anything grown can be hand-edited
  - randomness only by named seed (no hidden state): a variation can always be found again
  - "the note editor doesn't work" is reproduced and fixed FIRST, on today's roll, before anything moves (what fails: to ask him)
  - its own OS window: Electron BrowserWindow sharing the main window's engine through the canvas's own bus (desktop only; the browser
    build keeps the in-canvas panel)
open gaps (none hidden):
  - what exactly fails in today's note editor — not yet reproduced (asked him)
  - the popout as an OS window needs a desktop bridge for a second window (desktop/main.js); not built
  - grow rules beyond "place a pattern on each note" (L-system rewriting by type, Euclidean, probability trees) — after the first version
  - pattern-store's versions in the project file (his "song like a psd file" idea, 09:23:29) — the layered song file is its own spec
acceptance:
  - pattern-store, seed-registry, scale-key each prove themselves (<id>.test.mjs); scale-key equals MusicTheory on every 12-tone input
  - a clip's notes round-trip through pattern-store unchanged (bit for bit)
  - flatten: nesting to depth 4, cycles refused, transforms exact; grow: depth 0 = the base, depth n = base × rule^n notes
  - every piano-roll test green; the editor's own tests; design check clean; the UI shown to him and approved before it is built

# ---- dag (generated by build/spec-dag.mjs — the map; re-run after changing assembles or a component spec; nothing above is touched)
dag:
  components: 3 it stands on · 3 of 3 built (✓)
  layer 0: pattern-store ✓ · scale-key ✓ · seed-registry ✓
  tool: eravos.pattern-editor ← pattern-store + seed-registry + scale-key
  build order: pattern-store ✓ → scale-key ✓ → seed-registry ✓ → pattern-editor
  shared with: pattern-store 24 · scale-key 13 · seed-registry 13  (other tools on each)
  signal_dag check: every node is one of its components ✓

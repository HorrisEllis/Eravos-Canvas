# specs/eravos.workbench.spec — the canvas as a workbench: components as gated pieces, tools built and mutated from them, the null against twins.
# The ideas and the calls are James's; the reading of them, the cut into phases and the order are the coder's, said where they are.

origin: >-
  James, 2026-11-15 (verbatim):
  "okay but not 2 uis. im saying each tool has each ui element its own file per element, then the relevant elements combine into a new ui and
  tool merged into one. the contraint field. look at the compatability graph this is mappedd somewhat already. like synthesize whats compatable.
  do not synthesize the rest. maybe like you click mutate, and the system uses the null system or a sigma/gap system for friction or tension
  mapping for synthesizing with the least amount of friction." (05:03)
  "i was thinking like the canvas is the workbench. then each tool if for capability, components for building, integrating, inventing, like
  what if we have components a buildable piece like similar to a circuit board, we can design each piece, or combine components, and then use
  components to build tools with the mutation, then we mutate tools into new tools, new tools with components to add capability, and expand
  the ui, like a mod. then we can also explode each tool to remove, change or swap components and then build into combinations using the null
  to prevent overflow of similar but the not same tools." (05:29)
  "yes. maybe using field. each component gated, with a clear boundary, per primitive. emerge would make this easier. maybe eravos v2?" (05:30)

status: "MAPPED 2026-11-15. Nothing built by this map. Preview: the Idea Lab canvas, board 'Field · Wobble Bass exploded'."

stands_on: >-
  Read 2026-11-15 (reuse before build). This map joins pieces that exist; it replaces none.
  - specs/eravos.compat-graph.spec: ports, slots, siblings, bridges; SWAP / INSERT / REWIRE / GRAFT / VARY / ⚄ MUTATE; the checks (types,
    builds, plays, novelty); lineage. CG1 done (33 of 33 components carry a checked contract). CG2–CG5 open.
  - specs/eravos.ui-field.spec ADDENDA 2026-11-13 (1)–(3): each component ships its element; a tool's UI = its DAG's elements placed by the DAG
    and the constraint field; merge by role (no duplicates); ES1 (3.183) separated Piano and synthesises a face from its elements.
  - tools/core/field/: the Field (the Workshop), a domain-free tool; layers, exploded view (3.167), undo.
  - The null render (tests/null-render.mjs): a refactor proves no change in sound. The novelty gate (build/novelty-gate.mjs): TWIN / CLOSE /
    novel, with its role.
  - Mods (go in and come out), suites (a tool with its components wired), "systems all the way down" (suites.spec ADDENDUM 2026-11-05, F1–F5).
  - Wobble Bass's own DAG (wobble-bass.spec `dag:`): 19 components it stands on, 9 built; in it now: filter-formant, note-release; comes out
    of it: clipper, osc-fm-operator, ring-mod, stereo-tools. Automation's: macro (comes out of it); curve-edit exists as a component.

the_model:   # his words above, as one picture (coder's reading, to confirm)
  workbench: "the canvas: the host only (BC1). Everything is made on it in the Field."
  levels: "primitive → component → tool → mod / suite → setup. One mechanism at every level: pieces with typed ports, wired; each level opens as a Field."
  primitive: "the smallest gated part inside a component's kernel (a phase accumulator, a one-pole, a delay tap, a lookup). Read as: what a component is made of."
  component: "a buildable piece, like a part on a circuit board: its pins are its contract (ports, variables, ranges), its face is its element (one file), its boundary is its gate."
  tool: "capability: components wired in a DAG, plus what is its own (own:<name>), and its face synthesised from its components' elements."
  mod: "a tool + components added: new capability, the face expands by the added elements; it comes out again whole."
  explode: "open a tool in the Field as its components (the DAG as layers): remove, change, swap; then build or mutate."
  mutate: "two tools (or a tool + components) → only what is compatible is synthesised, the rest is left out with its reason; least friction first."
  null: "twice: (1) exploding a tool must not change its sound — the null render proves the split; (2) a new combination that nulls against something already in the catalogue is a twin and is not kept; CLOSE is kept only with a different role."

the_gate:   # "each component gated, with a clear boundary, per primitive"
  rule: >-
    A component is reached only through its gate: its contract (ports by type, variables with range and unit, its element). Nothing reaches
    inside; a wire or a mutation that does not pass the gate is refused with the reason. The same gate, configured per level (his gate.eg idea,
    architecture-spec ADDENDUM 2026-11-14): primitive inside a component, component inside a tool, tool inside a suite.
  checks: "type match per port · range and unit per variable · rate (audio / event) · signal order (the DAG) · the element's role"
  v1: "the gate is data (the contract JSON CG1 already checks) plus one checker (domain-free, tools/core/)."
  v2: "the contract becomes an Emerge type and the gate is the type checker: a wrong wire does not compile. That is where Emerge makes it easier."

friction:    # "a sigma/gap system for friction or tension mapping"
  sigma: "deviation — how far a merged control drifts from each parent (range, curve, unit, rate). 0 = the same control."
  gap: "what a parent had that the synthesis loses (a control, a port, a mode)."
  tension: "two elements that want the same parameter (two writers, opposite curves)."
  null: "the synthesis at rest (the new part off) must null against the parent it came from: friction proven 0 where it should be."
  order: "candidates are offered lowest friction first; above the threshold an element stays out and says why. The threshold is a setting."
  tie_in: "Nexus CF1 (sigma measures deviation, delta measures gaps) — the same measures, the domain's numbers."

example_wobble_bass_x_automation:   # the first proof, previewed
  fuses: "Automation's lane (curve-edit + macro) onto each continuous control of Wobble's elements — depth (lfo), cutoff (filter-formant / filter-svf), rate (lfo / step-mod); Automation's grid merges with Wobble's rate grid (same role)."
  stays_out: "Automation's Organism and Parameter pickers (the target is itself: gap 0, tension with Bind), Song Recorder (another tool's role)."
  face: "Wobble's face, each automatable knob carrying its own curve. One UI."

phases:
  WB0_this_map:
    depends_on: []
    files: [specs/eravos.workbench.spec]
    exit_test: "his yes on the model and the preview"

  WB1_explode_wobble_bass:
    what: "Wobble Bass's engine split along its DAG, one component at a time, the null render after each split (no change in sound, worst ≤ −80 dB). The 9 built components first; its own parts named own:<name>. Its controls each name their element (ES1's rule)."
    depends_on: [WB0_this_map]
    files: [tools/music/tools/bass/wobble-bass/wobble-bass.engine.js, tools/music/tools/bass/wobble-bass/wobble-bass.spec]
    exit_test: "null render Wobble Bass 38/38 after every split; tests/elements.test.mjs clean for Wobble Bass"

  WB2_the_gate:
    what: "One domain-free gate checker in tools/core/ (data in → pass / refuse with reason): ports, variables, rate, order, role. Every wire and every mutation passes it."
    depends_on: [WB0_this_map]
    files: [tools/core/gate/gate.js, tests/gate.test.mjs]
    exit_test: "a wrong-type wire, an out-of-range variable and an audio→event mismatch are each refused with their reason; every wire in every shipped setup passes"

  WB3_explode_in_the_field:
    what: "The Field opens a tool as its components (layers, exploded view): remove, swap for a sibling, insert. Preview shown first."
    depends_on: [WB1_explode_wobble_bass, WB2_the_gate]
    files: [tools/core/field/field.js]
    exit_test: "Wobble Bass opened exploded; a swap of its oscillator for a sibling plays; undo puts it back and it nulls against the original"

  WB4_mutate_least_friction:
    what: "⚄ MUTATE: compatible elements only, scored sigma / gap / tension, null at rest, novelty against the catalogue; offered lowest friction first; the rest listed with reasons. The face is synthesised (one UI)."
    depends_on: [WB2_the_gate, WB3_explode_in_the_field]
    files: [tools/core/mutate/friction.js, tools/core/mutate/mutate.js]
    exit_test: "Wobble Bass × Automation gives one face with curves on depth, cutoff and rate; the pickers and Song Recorder are listed as left out; the mutant at rest nulls against Wobble Bass"

  WB5_null_against_twins:
    what: "A kept mutant is fingerprinted; a TWIN of anything in the catalogue is not kept (he can still keep it on purpose); CLOSE needs a different role."
    depends_on: [WB4_mutate_least_friction]
    files: [build/novelty-gate.mjs]
    exit_test: "mutating a tool with a no-op component is refused as TWIN of its parent"

  WB6_mods_and_new_components:
    what: "A tool + components = a mod (comes out whole); and a component designed on the bench from primitives (the Field at primitive level), passing its own gate and tests before it is offered."
    depends_on: [WB4_mutate_least_friction]
    files: [tools/core/field/field.js, tools/music/components/]
    exit_test: "a mod added and removed leaves the tool nulling against itself; a new component passes its contract check and its own tests"

decisions:
  WB_D1_v1_or_v2:
    status: OPEN (his)
    readings: >-
      (a) build in v1 now as data, the way CG1 and ES1 already are, and let Emerge take the same data over in v2 — his D1 of 2026-11-13 ("is
      emerge worth waiting for on this?" → built in v1 now, as data); (b) wait and build it as Eravos v2 on Emerge, where the gate is the type
      checker. Coder's reading: (a) for WB0–WB2 (data and checks carry over unchanged), and the gate as the first piece written in Emerge when
      v2 starts.
  WB_D2_primitive_level:
    status: OPEN (his)
    readings: "Primitives as their own gated parts now (WB6), or only once components are written in Emerge (v2)?"

## ADDENDUM 2026-11-15 (2) — the levels, his (nothing above is changed)
# his words (05:36, verbatim): "primitives are the smallest piece of a component, then component the smallest piece of the tool, then tool of
#   the suite or toolbox maybe? then of the miniworld? this is gigantic." · "no shows wobble bass litterally broken apart like a diagram and
#   wires hooking into each component to the core/engine. like each component has its own ui element seperate from the main ui."
levels: "primitive → component → tool → suite / toolbox (name his) → miniworld. the_model.levels is read this way; 'setup' stays the word for a system of whole tools until he names it."
preview: "board 'Field · Wobble Bass broken apart' — each component's own UI element cut from Wobble's real face, wired into the core (the engine keeps only the voice, the signal order, the AudioParams, the tempo lock)."
open: "WB_D3 (his): 'suite' or 'toolbox' for the level above a tool; what a miniworld holds (a domain? a world of toolboxes?)."

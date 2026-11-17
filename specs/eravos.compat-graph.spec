# spec_id: eravos.compat-graph · version 0.1.0 · status SPEC (mapped 2026-11-13; nothing built) · domain-free (a domain supplies its types)
# his words (2026-11-13T12:34:18Z, verbatim): "what about a compatability graph? i want tools to mutate into new ones. yes the workshop. component
#   integration, ive wanted this for a long time. especially with emerge. like variable driven innovation."
#   · (12:36:57Z) "should we have that in the workshop, the canvas? i feel the workshop should be a tool on its own." · (12:41:38Z) "is emerge
#   worth waiting for on this?" → decided: no — v1 builds it as declarative data Emerge takes over (docs/eravos-v2-emerge-looking-glass.md
#   ADDENDUM 2026-11-13). Session map: specs/eravos.2026-11-13-session.map.spec.
# Stands on: axiom 2 (components are parts any tool uses), axiom 3 (a suite is a tool with its components wired), axiom 8 (spec with a DAG),
#   every tool spec's dag: block (build/spec-dag.mjs), the novelty gate (build/novelty-gate.mjs), the Field (specs/eravos.workshop.spec).

purpose: one graph of what can connect to what — components and tools, by typed ports — so that a tool can be changed into a new one (a
  mutation) that is known to fit, plays, and is measured as new or not. The Field is where it is used (the Field is a tool: specs/eravos.bare-canvas.spec).

## the map (measured 2026-11-13, before anything is built)
tools (the canvas level) — ports ARE typed already:
  - every built tool declares hooks with an event type, and build/specs.mjs writes them into its spec (dependencies › inputs / outputs):
    144 tool specs list outputs. The vocabulary in use (hook count across specs): audio 135 · modulation 121 · dataflow 113 · note:trigger 68 ·
    transport:play 55 · transport:tick 54 · transport:stop 54 · midi:note 36 · theory:key-change 35 · asset:ready 22 · then ui:*, seq:*, pad:*,
    xen:*, harmony:chord 3, edm:drop-fired 3 …
  - wires between tools already check these types (WireSystem); a tool-level graph can be generated today, from data that exists.
components (inside a tool) — ports are PROSE:
  - 110 component specs; their "inputs / outputs / limits" line is written for 31 and still "TO WRITE" for 79.
  - where written, it is a sentence ("audio in 1 (mono or stereo) → audio out 1 … params (AudioParams, every one a modulation destination):
    frequency 16–20000 Hz …"), not data a program can read. 33 components have code; 8 are marked built.
  - a tool's inside is its spec's dag: (232 specs carry one, generated) and, where written, its signal_dag (Retro DCO, Swarm, Tape Memory):
    the components it stands on are known; the wires between them are prose.
so: CG1 (component ports as data) is the work the graph waits on; the tool level can be graphed at once.

## the model
port      { id, dir: in | out, type, channels?, rate?: audio | control | event, unit?, range?: [lo, hi], many?: bool }
type      a name from a domain's type table — music: audio, control, pitch (Hz or MIDI, said by unit), gate, trigger, note (note:trigger),
          chord (harmony:chord), step (groove:step), transport, key (theory:key-change), modulation (a 0…1 or −1…1 control meant for a knob),
          data. The canvas knows no type's meaning; it compares names and asks the domain for bridges.
component { id, version, ports[], variables[] (each: key, type, range, default, AudioParam?), kernel? (its tested code) }
slot      a place in a tool's DAG: the ports it needs. A component FITS a slot when its ports cover the slot's (same types, compatible channels
          and rate). Components that fit the same slot are SIBLINGS (filter-svf · filter-ladder · filter-formant; osc-va · osc-wavetable ·
          oscillator-population — to be confirmed from their port data, not assumed).
bridge    a small adapter the domain declares from one type to another (control → pitch through a scale and range; gate → trigger; note →
          pitch; audio → control by an envelope follower). The graph may insert one; it is shown, never hidden.
edge      out-port → in-port where the types match or a bridge exists. Each edge: { from, to, bridge?, cost } (cost: a bridge costs more,
          so a direct fit is preferred).
tool DAG  { nodes: [component instances with variables], edges, outs } — the same shape a tool's spec signal_dag describes, as data.

## mutation (a tool → a new tool)
ops (each one step, undoable, its own lineage line):
  SWAP     a component for a sibling (Retro DCO's osc-va → oscillator-population)
  INSERT   a component where its ports fit between two nodes (a bbd-line inside the voice, before the filter)
  REWIRE   an edge to another destination (an LFO from pitch to cutoff; one tool's envelope into another tool's level)
  GRAFT    a sub-DAG of one tool into another (Wobble Bass's formant stage into a synth's voice)
  VARY     a component's variables: range, options, default (a filter that lives 30–300 Hz is another instrument than 3–20 kHz)
  REMOVE   a node, when what it fed can be fed from before it
checks (in order; a mutant failing one is never offered):
  1 types: every edge fits (or has a declared bridge) — the checker, a pure function: DAG + type tables → { ok, why[] }
  2 builds: the DAG assembles into one engine (the worklet from the components' kernels, as Retro DCO and Swarm are made today)
  3 plays: an offline render of a reference phrase is finite, not silent, not stuck pinned (the song audit's measures, 3.177)
  4 new: the novelty gate's verdict (TWIN / CLOSE / novel, with its role) — advisory, never blocks; his ear decides
kept:     a mutant he keeps is a tool (a tool.json + its DAG as data + its lineage); it starts in his library (Documents\ERAVOS\tools), never
          in the app folder; it may be named, packed and shared like any tool.
lineage:  { from: [tool@version …], ops: [{ op, args, at }], by: 'him' | 'mutate', measured: { novelty, plays } } — append-only, like the register.

## where it lives
  the checker + the graph builder: domain-free, pure (data in → verdict / graph out), no DOM, no audio — in a tool of its own home
    (tools/core/, specs/eravos.bare-canvas.spec), never in canvas/ (the canvas stays the host)
  the type tables and bridges: each domain's (tools/music/… types.json, proposed)
  the UI: the Field — a stage's right-click › SWAP FOR … (siblings only) · drag a component from the library onto the DAG (where it fits
    lights) · ⚄ MUTATE (a few mutants, each playable at once, keep / throw away) — shown to him as a preview before it is built
  generated report: build/compat-graph.mjs → docs/compat-graph.md (siblings per slot, bridges used, components with no port data yet)

## signal_dag (this system)
  component specs (ports as data, CG1) ─┐
  tool specs (hooks, dag:, signal_dag)  ├→ graph builder → GRAPH (nodes, edges, siblings, bridges) → report (docs/compat-graph.md)
  domain type tables + bridges         ─┘                         │
  the Field (a tool's DAG, his op) → mutation op → checker (types) → assemble (engine) → render (plays) → novelty gate (new) → offer
  → kept: tool.json + DAG + lineage → library → catalog

## phases (each its own PR, proved before the next)
  CG0  this spec + the map                                                            (2026-11-13)
  CG1  component ports and variables as data: a `ports:` / `variables:` block in each component spec, written from its code and tests
       (the 33 with code first; the 79 TO WRITE as they are built); a check that a spec's ports match its code's (the kernel's inputs and
       AudioParams) — so the data can't drift from what plays
  CG2  build/compat-graph.mjs: the graph from tool hooks + component ports; siblings and bridges; docs/compat-graph.md; a test that the
       tool-level graph agrees with WireSystem's own type check on every built tool
  CG3  one mutant end to end, no UI: Retro DCO with its oscillator swapped for a sibling, assembled from the graph, rendered, measured by
       the novelty gate — the proof the model works
  CG4  the Field's SWAP / INSERT / REWIRE / VARY / ⚄ MUTATE — preview shown to him first
  CG5  GRAFT across tools; dynamic UI synthesis (specs/eravos.ui-field.spec ADDENDUM 2026-11-13) uses the same graph
  v2   each piece becomes an Emerge type (the table in docs/eravos-v2-emerge-looking-glass.md); the checker is a candidate for the first
       piece of ERAVOS written in Emerge (it compiles to CommonJS today) — his call

## decisions
  - D1 (2026-11-13, his "is emerge worth waiting for on this?" → answered, added to the v2 spec at his word): built in v1 now, as data.
  - D2 (2026-11-13, his "i feel the workshop should be a tool on its own"): the graph and mutation live in the Field, a tool — not the canvas.
  - D3 (proposed): types are names a domain owns; the canvas compares names only (canvas / content separation, tests/boundary.test.js).
  - D4 (proposed): a mutant is never offered unless it passes types, builds and plays; "new" is advisory (the novelty gate never blocks).
  - D5 (proposed): siblings are computed from port data, never listed by hand.

## open gaps
  - the type table for music: whether pitch is Hz or MIDI at a port (unit says it; a bridge converts) — to settle in CG1 with real ports
  - main-thread components (voice-allocator, progression, pattern-field: logic, not audio) — ports of rate "event"; how they join a worklet DAG
  - a grafted sub-DAG that carries its own modulators: does it bring them (proposed: yes, as its own nodes)
  - how a mutant's UI is made (proposed: dynamic UI synthesis from its components' UI parts — CG5)
  - which of his ears' verdicts feed back (keep / throw away as data the mutate op learns from — later, his call)
acceptance (CG0): this spec, the map's numbers reproducible: grep the specs' dependencies blocks for hook types; count component specs whose
  inputs / outputs line is TO WRITE.

## ADDENDUM 2026-11-13 — a component node carries its UI element; a tool announces its needs (nothing above is changed)
# his words (2026-11-13, verbatim): "Each component of each tool has a element for the ui to synthesis." (13:07:08Z) · "Okay. Each tool needs
#   that. Dag. It has to anounce what it needs to the canvas. The canvas needs to import it from the zip." (13:08:14Z)
#   - component (the model above) gains element: { version, controls [{ key, role, face }], needs.ui } — a mutation that swaps a component
#     swaps its element; the mutant's UI is synthesised, never drawn by hand.
#   - a kept mutant is a tool like any other: its manifest announces needs (components, elements, ui, domain) generated from its DAG, and it
#     is zipped and imported by the canvas like any tool (specs/eravos.store.spec ADDENDUM 2026-11-13).
#   - CG1 now writes ports + variables + element (specs/eravos.components.spec ADDENDUM 2026-11-13 (2)).

## ADDENDUM 2026-11-16 — CG2 built: the graph, the checker and the mutation ops (pure, no UI) (nothing above is changed)
# his words (2026-11-16, verbatim): "I've been trying to decide between Bravos, because I want that mutation done. I want that. Imagine it'll be
#   unlimited possibilities. And we're close."
#   - tools/core/compat/compat.js (domain-free, pure; window.Compat and require): fit · slot · covers · graph · check · swap · insert · rewire ·
#     vary · remove · mutate (seeded). build/compat-graph.mjs → docs/compat-graph.md (--check in CI). tests/compat.test.mjs: 36 checks on the
#     real 34 contracts.
#   - D5 refined from the data: exact-slot siblings are few (11 audio processors share in:audio|out:audio; ratio-set · seed-registry), so a
#     SWAP target is a STAND-IN: it has every port the replaced component is wired by (same direction, type, rate) and asks for no audio input
#     the replaced one did not have — so osc-wavetable and osc-sub stand in for osc-va (their extra inputs idle), and a filter never stands in
#     for a source (with nothing to process it is silent).
#   - mutate() offers only mutants that pass check(), each one step from its parent, all different, with lineage { from, ops, by, seed }.
#   - not yet: CG2's test that the tool-level graph agrees with WireSystem on every built tool (the tool level), and CG3 (a mutant assembled,
#     rendered and measured by the novelty gate).


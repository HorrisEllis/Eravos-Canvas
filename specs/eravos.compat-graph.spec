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

## ADDENDUM 2026-11-16 (2) — CG3 built: a mutant assembled into one engine, rendered, measured (nothing above is changed)
#   - tools/core/compat/assemble.js (domain-free): a DAG → ONE engine; each node is its component's own kernel through the domain's adapter,
#     run block by block in wire order; an unwired pitch / gate in-port is the tool's note in; bridges from the domain. Proven: osc-va →
#     filter-svf assembled = the same two kernels run by hand, sample for sample (difference 0).
#   - tools/music/compat/adapters.js: the six process(ins, outs, n, P) processors (one adapter), osc-va, osc-sub, env-adsr, stereo-tools.
#     A component with no adapter is not assembled (and so never offered); adapters for the rest come as each is needed.
#   - build/mutants.mjs → docs/mutants.md (+ WAVs with --wav): a parent voice, mutate() into parts that can be assembled, each rendered
#     (four bass notes, offline) and measured. OFFERED (D4 refined from the data) = it plays cleanly (finite, not silent, not pinned) AND it
#     is heard to differ from its parent (fingerprint distance ≥ 0.005). Caught on real seeds: removing the saturator lets a resonant filter
#     peak past full scale (pinned 3.6 % → refused); a pulse width on a saw is inaudible (0.000 → not offered).
#   - known limits: the fingerprint is mono (a width change measures 0); the nearest-sound column compares against baseline renders of a
#     different phrase (a lead to listen to); the harness gates the sound itself (no VCA component has a contract yet).
#   - tests/mutants.test.mjs: 20 checks (CI).


## ADDENDUM 2026-11-20 — CG4 preview; a whole tool, not endless mutation; learning, friction, regression; the real tools (nothing above is changed)
# his words (2026-11-20, verbatim):
#   "yes go ahead, show me the preview. i want to be able to start mutating new tools."
#   "okay it isn't letting me select the second slot. i like the ui though, i want to edit, not just create from scratch.
#    but also the preview, like taking a tool that exists, and swapping components. whats the browser for?"
#   "the wobble bass, and the wubs, and retro. okay but it needs to synthesize into a full tool. not just mutate endlessly"
#   "also should learn from each discard right? also. null render used for creating friction, and repitition. so tools dont just replicate
#    over and over, also regression gate"
# the preview (docs/previews/mutate/mutate.html, built by build.mjs from the real engine; shown, waiting for his yes):
#   EDIT   the bench holds one tool (the start voice, a mutant opened to edit, a kept tool); a component's every setting, live; SWAP FOR / remove
#          / reset; ＋ on a wire inserts what fits; undo / redo. Every edit is the engine's own op (check()) and one undo step.
#   MUTATE a pool (18, up to three batches) → the gates → ranked by what he taught it → five + one wildcard (so it keeps exploring).
#   LEARN  every verdict is data: keep +1 · open to edit +0.5 · throw away −1, on what the mutant was (op, part, how far it moved); the sum ranks
#          the next pool; each card says why it was offered; FORGET clears it. (Open: the weights, the wildcard share — his ear decides.)
#   FRICTION — the null as a repetition gate: each mutant's render, level-matched, subtracted from everything already seen (the tool, kept tools,
#          thrown-away ones, mutants already shown, others in the pool); nulls deeper than −30 dB = a REPEAT, never offered. Found at once: a
#          rewire that leaves a filter unfed is the same sound as removing it (−∞ dB).
#   REGRESSION — a kept / synthesized tool stores its render (the bass line, 4 kHz, 16-bit); every time it is shown it is rendered again and
#          nulled against it: deeper than −60 dB ✓, otherwise ⚠ REGRESSION (a component's change reached a tool he kept).
#   SYNTHESIZE — the end, not more mutating: the bench becomes a whole tool — its face from its parts' elements (contract `element`: face
#          controls first, in signal order, the rest behind More depth; the same rule as ES1, tools/core/elements), its keys, its tool file
#          (needs.components + elements, config per node, faceKeys, the DAG, lineage, gates + the null baseline). Saved: kept + the file.
#   the "browser": the preview is a web page only so it can be tried before it is built; nothing in mutation needs one.
# phases (each its own PR, proved before the next):
#   CG4a  the preview above                                                                                      (2026-11-20, shown)
#   CG4b  in the app, on his yes: the Field gets the bench (edit, mutate, learn, the two gates); kept tools and verdicts in Documents\ERAVOS
#   CG6   SYNTHESIZE for real: a kept tool → Documents\ERAVOS\tools\mine.<id>\ (tool.json + the DAG + lineage); its engine = the assembled DAG
#         run inside ONE AudioWorklet (assemble.js is plain JS for that), every setting an AudioParam (axiom 4); its face = ElementSynthesis;
#         it opens on the canvas, wires, takes notes from keys / MIDI / the Timeline like any tool. Gate: the worklet nulls against the offline
#         render (the same engine), and the regression baseline is stored with it.
#   CG7   the real tools on the bench, his order: Wobble Bass, the wubs, Retro DCO. A tool opens only when (1) every part it is made of is a
#         component with an adapter, (2) its DAG is written as data, and (3) the DAG assembled nulls against the tool's own engine (the null
#         render) — so a swap changes THE tool, not a copy that sounds near it. What each needs today:
#           Wobble Bass  0 of 3 announced parts assemble (filter-formant, amp-chain, note-release) and most of its sound is still its own code —
#                        the WD track first: WD2 the sub · WD3 the output stage · WD4 squash · WD5 LFO + wub seq · WD6 FM growl, each moved out
#                        unchanged and proven by the null render (as WD1 amp-chain); then the adapters; then the DAG.
#           the wubs     Wub Osc, Wub Sub (note-release), Wub Filter (filter-formant), Wub Rate (wave-table) — the same parts as Wobble Bass's
#                        decomposition; they follow it.
#           Retro DCO    5 of 11 assemble (osc-va, osc-sub, filter-svf, filter-ladder, env-adsr); adapters for osc-noise, unison-stack, lfo,
#                        random-source, bbd-line, ensemble-core; voice allocation (logic, not a node); then the DAG and the null.

## ADDENDUM 2026-11-20 (2) — a tool opens exploded; the editor for a tool's UI (nothing above is changed)
# his words (2026-11-20, verbatim): "what if we have a editor for the tool ui. like want to be able to understand the tool. like modulator, lfo,
#   like i built the tool but no way to manipulate the wave like the wobblebase, like not just knobs, but i assume that will be built, now show
#   me opening the wobble bass exactly like the preview was originally"
# built in the preview: a tool that cannot be assembled yet opens EXPLODED — Wobble Bass from the board of 2026-11-15 unchanged (its pieces,
#   positions, wires, timing; the pieces cut from its own face): whole, then apart, wired to its core; a piece clicked says what it is, its
#   ports and settings (from its contract), what could stand in for it (the full graph), and what it waits on (BUILT → moves out, null-proven;
#   IN IT → an adapter; COMES OUT → a contract, then out; PLANNED → to build; OWN; PACK). Not editable or mutable until it can be assembled (CG7).
# the editor for a tool's UI (open — a preview first, on his word): to UNDERSTAND a tool, each element shows what it does, not only knobs:
#   - the wave: an oscillator's element draws its waveform (and a wavetable's frames); a shaper its transfer curve; drawn and dragged to edit
#   - the filter: its response curve, cutoff and resonance dragged on it (as Wobble Bass's MOUTH is heard, seen)
#   - the modulators: an LFO / env-msseg / step-mod element draws its shape over time, drawn by hand (Wobble Bass's SHAPE and WUB SEQ are the
#     model), and where it goes: modulation drawn as wires from the modulator to the settings it moves, with depth on the wire
#   - each such view is part of the component's element (contract `element`), so every tool holding the component gets it, and a synthesized
#     tool's face has it (ES1 + CG6); layout of a face editable (move, resize, hide an element) — the UI-field constraint layout
#     (specs/eravos.ui-field.spec) as the rule that keeps it consistent

## ADDENDUM 2026-11-20 (3) — the Field is the board, exactly; engines for every combination; the UI mutates inside the design rules (nothing above is changed)
# his words (2026-11-20, verbatim):
#   "like they all needs a engine right? like could have unlimited combinations. but i want the ui to mutate also. like deterministic aspecs like
#    that relate to the design philosopy, and reactive colors stay consistent across the tools, but should also be able to edit the ui, with
#    different knobs, different styles of ui elements per component, also like blocks."
#   "i don't see the ui i want. im not saying like the original, im saying that exactly. i already critisist the other one immensly. do not deviate"
# RULE: the Field's UI is the board "Field · Wobble Bass broken apart" (docs/previews/workbench/Wobble-Broken.dc.html, 2026-11-15) EXACTLY —
#   header (FIELD · tool · EXPLODED · primitive → component → tool → suite / toolbox → miniworld), each component's own UI element in its dashed
#   gate frame with its label and status, wired into the CORE, the legend. Wobble-Field.html is that markup copied (not redrawn), entered from the
#   whole tool blown apart into it. Nothing is restyled; anything added (a menu, a control, a panel) is shown to him first as an addition on it.
#   The mutate page (docs/previews/mutate/) is NOT the Field's UI: kept only as the engine's test bench (CG2/CG3/gates in a browser).
# ENGINES: every combination needs one, and none is written by hand — a combination's engine is its DAG assembled from its components' own
#   tested kernels (assemble.js; in the app inside one AudioWorklet, CG6). Unlimited combinations, one mechanism; the gates (types, builds,
#   plays, the null as friction, the regression gate) decide which are offered.
# THE UI MUTATES TOO, in two layers:
#   FIXED (deterministic, from the design philosophy — never mutated): docs/DESIGN-GUIDE.md's rules (S/C/K/W/N), black surfaces (only colours
#     are coloured), the reactive colours one system across every tool (the Beat colour, the theme's accents), the kit's tokens and sizes,
#     the gate frames and wires of the Field. tests/design-check.mjs holds a mutated UI to them like any tool (D1–D6 clean).
#   FREE (mutated and edited, per component element): the knob style (the kit's knob, an arc, a fader, a step row, a drawn curve), the element's
#     style variant (compact · full · graph — e.g. an LFO as a rate grid, a drawn shape, or a spectrum), and blocks — elements as blocks that move,
#     group, resize, hide (the UI-field constraint layout keeps them consistent). Each variant belongs to the component's element (its contract),
#     so every tool holding it can use it; a synthesized tool's face picks variants (by him, or mutated, and the same verdicts teach it).
# next: shown on THIS board first — (1) right-click a piece › SWAP FOR / STYLE / MUTATE (the canvas's own menu, nothing on the board until asked);
#   (2) a piece's style variants; (3) blocks. Wobble Bass's pieces become editable as the WD track makes them components (CG7).

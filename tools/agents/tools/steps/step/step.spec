# spec_id: eravos.agents.step · version 0.1.0 · status building · template eravos.tool/1 · domain agents (AI Automation)
# His words (2026-11-08): "okay the ui is for eravos. using the tools." · "nothing is hardcoded" · "no i meant the entire canvas. i want nothing
#   about the canvas changed. i want the tools compatable with eravos independantly. eravos is the build surface for nexus. that way if something
#   needs to be built, we can make a tool for eravos. not rebuild it."
identity:
  id: eravos.agents.step ; label: Box ; icon: ◆ ; category: Steps
  purpose: one step of a pipeline as a tool on the canvas. A pipeline is boxes and wires; it arrives as an ordinary .erv (one box per step, the
    wires between them), written by whoever owns the pipeline (Nexus writes it from its box shape), or is built here by hand.
contract:
  a box is data, never a fixed list: kind, ref and step are words it was given; the colour of a kind is its place in the kinds list the box was
    given (state extra `kinds`), round the colour wheel — with no list, a colour from the kind's own letters. No kind is known in this code.
  the whole step it stands for (hooks, contract, gate, args) rides in state extra `box`, untouched, so a .erv opened and saved again is the same.
  what arrives on in is passed on out as { step, kind, ref, value } (so a person can wire boxes and watch data move); the window shows the last.
  it calls no network and names no system: running a pipeline is its owner's (Nexus's engine); a box shows what it is given.
ports (dataflow):
  in:  step.hook.in (in, any) — what the step receives
  out: step.hook.out (out, json) — { step, kind, ref, value }
params: kind (string) · ref (string) · step (string) · state (string: what the owner said last — waiting, running, done, failed, gap; '' = none)
extra (saved): box (the whole step) · kinds (the kinds list it was given) · last (the last value through it)
needs: units [] · tools [] · permissions [bus_publish, bus_subscribe]
packs: accepts [presets] · ships [factory]
acceptance (each must pass before status → built):
  - a box opened from a .erv with kind, ref, step and extra { box, kinds } shows them; its colour is its kind's place in kinds
  - a value on in goes out once as { step, kind, ref, value }
  - save → load is exact, the extra included (the .erv round trip)
  - no word of any kind, system or network address in its code (the test reads the engine and the window)
  - standard: unmount leaves zero subscribers/ports/wires; every shipped pack preset loads

# ---- ADDENDUM 2026-11-08 — the step on the Workshop (nothing above changed)
# His words (2026-11-08): "like we can use it for nodes, each compartment. like eravos needs to stay agnostic. maybe it edits steps, like it does a
#   note, or pattern." · "always show me the ui preview first so i can give feedback" · shown docs/previews/step-workshop.png, then: "okay the
#   workshop it to edit. the canvas are for the tools."
workshop_kind: agents.step (window.EravosStepKind), added by the Box's window with Workshop.addKind, as the Pattern adds music.pattern; the
  Workshop is unchanged. Layers, each read from the step it is given (no field name fixed): Gate (constraint: one field per gate key) · Step
  (kind from the kinds it was given, ref, step, state) · Settings (every leaf of its args, typed) · Contract (after, gives) · Last value (emergent).
  Every edit reaches the tool at once (ui hook step_set: params and the whole box); undo and redo follow. "Open in Workshop" on the window.
  The canvas holds the tools wired; the Workshop edits one of them.
acceptance (added): the kind passes Workshop.check; its layers come from the step; an edit, an undo and a gate change reach the tool (P153 2/2)

# ---- ADDENDUM 2026-11-08 — into AI Automation; the Workshop reshapes to the step; no kinds shown (nothing above changed)
# His words (2026-11-08): "also no need to show kinds in the ui. stop doing that. adding noise to the ui" · "Also isn’t ai automation a domain
#   already." · "The ui is meant to dynamically change in relation to the kind. Show me the ui for the workshop" · shown the previews, then: "I liked
#   the uploaded screenshot. 3d. Is it like that? So why not use that domain? Yes. Follow the spec."
moved: from its own Orchestration domain into AI Automation (agents), category Steps beside AI and Code; id eravos.agents.step (was
  eravos.orchestration.box, PR #138); the Orchestration domain removed (one automation domain). Its Workshop kind is agents.step.
no kinds shown: the kind is data (the setting hidden) and a colour; the window, the Workshop's title, outline, status and node show the step's own
  label; "last" shows the value that came in, without the wrappers each step adds.
the Workshop reshapes to the step (after specs/eravos.ui-field.spec): IN PLAY = what the step carries, most first; NOT IN PLAY = what it does not,
  with the reason; a setting named by its own last word; a value another layer shows is not repeated (counted). From the data, never a kind table.
3D: the approved studio layout (docs/previews/workshop-studio.png) is the Workshop spec's later phases; the flat surface (W1) is what is built.
acceptance (P153, updated): in play / not in play from the data; settings named plainly; nothing repeated; an edit, an undo, a gate change reach
  the tool — 2/2.

# ---- ADDENDUM 2026-11-08 — named Step (nothing above changed)
# His words (2026-11-08): "step, makes more sense, wait, why not just call them step then it can be agnostic"
renamed: eravos.agents.box → eravos.agents.step (folder steps/step, files step.*, hooks step.hook.in / step.hook.out, label Step). The Workshop kind
  stays agents.step. The domain's label Automation and Cybernetics (id agents unchanged), his suggestion, held for his answer before release.

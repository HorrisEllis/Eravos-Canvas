# spec_id: eravos.ui-field · version 0.1.0 · status PREVIEW (shown 2026-11-07; nothing built) · canvas
# his words (2026-11-07, verbatim): "Need the dag for the ui. Like dynamically changes using the constraint field? Like moves around fluidly?"
#   · "Yes. 1 then Show me a preview." · earlier the same day: "agnostic. the structure defines the shape which defines the emergent properties of
#   the conditions." Stands on: the Workshop's constraint / emergent layers (eravos.workshop.spec ADDENDA 2026-11-07), axiom 7 "Power without
#   overwhelm; static earns its place", the open item "Tool UIs from a DAG of UI elements and settings", Nexus's field (emerge/emerge/spec/field.spec).

the_dag (generated, never written by hand):
  nodes    every control of a tool (its config) and every setting others depend on (mode, shape …), and the stages of its sound (its spec's dag:)
  edges    MATTERS WHEN   a control does something only in some states — declared once on the setting: { key: 'cluster', when: { mode: ['harmonic'] },
                          why: 'only in harmonic mode' } (today these are hand-coded per tool: Swarm's RULES, Retro DCO's dims)
           DRIVES         which stage of the sound it moves (from the tool spec's signal_dag)
  check    every `when` names a real setting and real values; no cycle; a tool whose UI hand-codes a rule the DAG lacks fails (a guard test)

the_field (the layout is what emerges):
  conditions  the state (what each `when` admits) · what you touched last · what is moving it (a wire in, an LFO, an automation lane) · the
              room the window has · "power without overwhelm": at most N on the face (N from the size)
  score       a control that does nothing now: out (NOT IN PLAY, with its why) · else its base weight + the state's boosts (harmonic → Cluster,
              Form glide) + touched + moving
  layout      IN PLAY (the highest scores, in order) · MORE (the rest, smaller) · NOT IN PLAY (resting, dimmed, each with why)
  fluid       every re-form is animated from where each control was (FLIP, ~400 ms); nothing jumps; a control under the hand never moves
  opt-in      a new choice (Settings › Look › Layout: As designed · Fluid), today's layout the default (his rule: show him first, or add)

preview (2026-11-07): docs/previews/ui-field.preview.js on the real Swarm Oscillator, three states → ui-field-free.png · ui-field-coupled.png ·
  ui-field-harmonic.png (node docs/previews/ui-field.shots.mjs); free: Spread, Drift first, Coupling / Pull / Cluster / Form / Restless /
  Lock → tone / Table resting with why; harmonic: Cluster, Form glide first. The DAG beside it (dashed = does nothing in this state).

phases:
  UF0  this spec + the preview — shown to him first
  UF1  `when` / `why` in the tool schema; build/ui-dag.mjs generates every tool's UI DAG; the guard (a hand-coded rule missing from the DAG fails)
  UF2  the field layout in the kit (UIKit.fieldLayout(view, cells)), opt-in; Swarm, Retro DCO, Pattern first; FLIP; the hand-never-moves rule
  UF3  "moving" conditions (wires, LFOs, lanes) and the touched history; every tool
open: the face size N per window size; whether IN PLAY reorders while playing or only on a state change (his call)

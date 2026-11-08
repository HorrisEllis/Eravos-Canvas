# spec_id: eravos.orchestration.box · version 0.1.0 · status building · template eravos.tool/1 · domain orchestration (Orchestration)
# His words (2026-11-08): "okay the ui is for eravos. using the tools." · "nothing is hardcoded" · "no i meant the entire canvas. i want nothing
#   about the canvas changed. i want the tools compatable with eravos independantly. eravos is the build surface for nexus. that way if something
#   needs to be built, we can make a tool for eravos. not rebuild it."
identity:
  id: eravos.orchestration.box ; label: Box ; icon: ◆ ; category: Steps
  purpose: one step of a pipeline as a tool on the canvas. A pipeline is boxes and wires; it arrives as an ordinary .erv (one box per step, the
    wires between them), written by whoever owns the pipeline (Nexus writes it from its box shape), or is built here by hand.
contract:
  a box is data, never a fixed list: kind, ref and step are words it was given; the colour of a kind is its place in the kinds list the box was
    given (state extra `kinds`), round the colour wheel — with no list, a colour from the kind's own letters. No kind is known in this code.
  the whole step it stands for (hooks, contract, gate, args) rides in state extra `box`, untouched, so a .erv opened and saved again is the same.
  what arrives on in is passed on out as { step, kind, ref, value } (so a person can wire boxes and watch data move); the window shows the last.
  it calls no network and names no system: running a pipeline is its owner's (Nexus's engine); a box shows what it is given.
ports (dataflow):
  in:  box.hook.in (in, any) — what the step receives
  out: box.hook.out (out, json) — { step, kind, ref, value }
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

# spec_id: eravos.components · version 1.0.0 · binding on the whole project (every domain, runtime, host, build) · 2026-11-01
# "i would say any code that can be used by another, should be its own code. that way they stay small, and easy to maintain and can
#  be more creative with them." · "im saying overall. components are what i called them in nexus. or just parts"

## The rule
  Any code that another piece of code can use is its own COMPONENT (plain word: a PART): its own file, its own spec, its own tests.
  Overall, not only music tools: a filter, a wavetable, an envelope, a clipper, a pitch tracker, a colour mixer, a wire router, a
  file codec, a fingerprint measure — if a second place could use it, it is a component, written once.
## What a component is
  SMALL      one job; if it does two, it is two components.
  ON ITS OWN it depends on nothing that uses it (a component never imports a tool; tools import components).
  DOCUMENTED a .spec saying its job, inputs, outputs and limits; tests that prove its numbers on their own.
  SHARED     every place that needs the job uses the component, so an improvement lands everywhere at once.
  WIRED OR CALLED  a component is code other code calls; when it is useful on the canvas too, it also gets a window and ports (it is
             then a component tool, sovereign like every tool) — the same code either way.
## On disk
  <domain>/components/<name>/<name>.js · <name>.spec · <name>.test.js   (e.g. tools/music/components/filter/; canvas/components/
  for domain-free ones). A component tool keeps its tool folder and loads its component from there.
## Words (so specs agree)
  component / part = the reusable code above. tool = what you put on the canvas, built from components. suite = the control
  surface tools connect to. Earlier specs said "block" (tool-depth K1) and "cell" (proposed, not taken): both mean component.
## Applies now to
  eravos.tool-depth.spec K1–K5 (the bass tools' depth is built as components first) · every new tool and feature after this date.
  Existing code is moved into components as it is touched, each move proved to change nothing (null renders / same tests).
  The proof tool: tests/null-render.mjs (--record before, check after; gate −60 dB; maths in tests/null-render-core.mjs).

## ADDENDUM 2026-11-06 — the first phase-1 components; every tool spec carries its DAG; timing travels as AudioParams
  James, 2026-11-06: "Map, spec first. Each tool needs a spec with a dag." · "Make the swarm oscillator first." · "Themes and ui,
  components are any parts that other tools can use." · "Just want to make sure the tools don’t become monolith with packs or mods
  hard wired in."
  - Built (new code, each proving its own numbers in <id>.test.mjs): osc-va (polyBLEP; saw aliasing −25 dB vs naive −9.6) ·
    osc-wavetable (mip-mapped, nothing above Nyquist at any pitch; tables built on the main thread, load() in a worklet) ·
    oscillator-population (Kuramoto; free R 0.29, locked 0.99, chaotic 0.08; harmonic n:m locking) · env-adsr · lfo · stereo-tools.
    Extraction out of today's tools (lfo, syn-env, syn-osc, wobble-bass) is a separate step that must null-render — listed in each
    component spec, not hidden.
  - Every tool spec (226: built and planned) ends with a generated "dag:" block — components layer by layer (a component's own
    "stands on:" line), build order, how many other tools share each — and, for built tools, in it now / comes out of it / planned.
    A hand-written "signal_dag:" (what feeds what) is checked against the components. node build/spec-dag.mjs; the data behind the
    tool page's Components tab: node build/components-map.mjs → tools/music/data/components-map.js.
  - Found building Swarm Oscillator: a worklet told about notes and settings by messages plays nothing in an offline render (the
    render runs ahead of the messages). Rule: everything timed reaches a worklet as AudioParams (settings k-rate, notes as slots of
    trigger/gate/note/velocity); only bulk data (tables) and panic travel as messages / processorOptions.
  - Presets are data beside a tool (packs/), never in its engine (Swarm's 8 moved out of the engine before it shipped).

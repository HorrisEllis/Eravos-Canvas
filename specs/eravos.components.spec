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

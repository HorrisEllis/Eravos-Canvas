# spec_id: eravos.component.panner · version 0.1.0 · status built (3.241, 2026-11-27) · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: panner ; group: space ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: stereo/equal-power/binaural (HRTF) positioning, distance (air absorption, level, pre-delay), motion path input
used by: spatial-organism
inputs / outputs / limits: TO WRITE — signal types, control ranges, latency, cpu per instance
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

ADDENDUM 2026-11-27 — BUILT 1.0.0 (3.241), for Spatial Organism (specs/eravos.contrast-space.spec ADDENDUM 2026-11-27 (2)); the original above kept verbatim
his words (2026-11-27): "i want a bunch of spacial tools and ui elements for components" · "yes build them use the null renderer to make sure its novel in relation to the rest of eravos"
stands on: nothing
job (as built): a point at an angle and distance: equal power, level 1/(1+7d), air, pre-delay, and (ears) the far ear later and darker · HRTF and a motion-path input: open (the tool moves angle and distance from its own LFO today)
code: panner.js (MusicParts) · contract panner.contract.json · proof panner.test.mjs

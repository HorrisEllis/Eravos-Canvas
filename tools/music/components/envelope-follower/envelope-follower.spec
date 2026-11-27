# spec_id: eravos.component.envelope-follower · version 0.1.0 · status built (3.240, 2026-11-27) · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: envelope-follower ; group: dynamics ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: peak/RMS follower with attack, release, hold, band focus; outputs modulation
used by: feedback-reactor · low-end-anchor · motion-extractor · pump-shaper · relational-modulation · sound-state-machine · sub-architect
inputs / outputs / limits: TO WRITE — signal types, control ranges, latency, cpu per instance
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

ADDENDUM 2026-11-27 — BUILT 1.0.0 (3.240), for Collision (specs/eravos.contrast-space.spec ADDENDUM 2026-11-27 (2)); the original above kept verbatim
his words (2026-11-27): "the frequencies how the collide" · "yes build them use the null renderer to make sure its novel in relation to the rest of eravos"
stands on: nothing
job (as built): peak / RMS level with attack, release, hold → 0…1 on a dB range
code: envelope-follower.js (MusicParts) · contract envelope-follower.contract.json · proof envelope-follower.test.mjs (node tools/music/components/envelope-follower/envelope-follower.test.mjs)

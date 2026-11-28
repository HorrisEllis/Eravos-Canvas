# spec_id: eravos.component.key-detector · version 0.1.0 · status planned · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: key-detector ; group: analysis ; component tool: no (yes = also on the canvas with a window and typed ports)
  job: chroma key + mode estimate with confidence
used by: audio-deconstructor
inputs / outputs / limits: TO WRITE — signal types, control ranges, latency, cpu per instance
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

# ADDENDUM 2026-11-28 — built (1.0.0, 3.259): chroma → Krumhansl–Kessler key and mode, confidence
#   his words (2026-11-28): "Can we make the canvas import a song and open the relevant tools to make it?" — Song Import SI1 (specs/eravos.song-import.spec)
#   code key-detector.js · contract key-detector.contract.json · its numbers proved in key-detector.test.mjs (node tests/components.mjs)

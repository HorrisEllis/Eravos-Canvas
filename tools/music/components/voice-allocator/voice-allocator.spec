# spec_id: eravos.component.voice-allocator · version 0.1.0 · status built · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: voice-allocator ; group: structure ; component tool: no (yes = also on the canvas with a window and typed ports)
  job: poly/mono/legato, steal policies (oldest, quietest, same-note), voice budget reporting
used by: fm-matrix · layer-architect · retro-dco · sample-universe
inputs / outputs / limits (written 2026-11-06; was "TO WRITE — signal types, control ranges, latency, cpu per instance"): logic only (no audio): VoiceAllocator(voices 1–32); modes poly / mono (retrigger, last-note priority) / legato (glide, no retrigger over a held key); steal: a releasing voice first, then oldest · quietest (level(v, x)) · same-note · lowest · highest; release(seconds) or free(v); budget() → voices, active, releasing, free, stolen; noteOn / noteOff return one reused result { voice, note, retrigger, stolen, stolenNote, glide }
  stands on: —
  status: built 2026-11-06 — NEW code proved on its own (voice-allocator.test.mjs, 25 checks: each policy, release timing, mono last-note priority, legato glide, one result object, 32 voices, a 20,000-event random performance never puts two held notes on one voice)
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

# spec_id: eravos.component.tape-transport · version 0.1.0 · status built 2026-11-06 (for Tape Memory — his "yes") · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: tape-transport ; group: time ; component tool: yes (yes = also on the canvas with a window and typed ports)
  job: varispeed, tape stop/start with curves, rewind spin, scrub
used by: fx-rewind · tape-memory · time-mutation
inputs / outputs / limits (written 2026-11-06; was "TO WRITE — signal types, control ranges, latency, cpu per instance"): kernel Transport(): no audio in; 2 channels out — ch0 the speed the tape actually runs at (1 = normal, 0 = stopped, < 0 = backwards),
  ch1 the lag in seconds (how far the read head has fallen behind real time: ∫ (1 − speed) dt, 0 … maxLag) — a tool feeds the lag to a
  delay-line's time, so the sound bends exactly like a tape's. speed −2…2 (varispeed, glides over 20 ms) · stop 0/1 (k-rate: 1 = brake to
  0 over stopTime, 0 = spin back up over startTime) · stopTime 0.02–8 s · startTime 0.02–8 s · curve −1…1 (−1 = slows late, 0 = straight,
  1 = slows early) · maxLag 0.1–20 s · rewind 0/1 (spins backwards at |speed|·2). Latency 0; cpu ~10 ns a sample.
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

# ---- built 2026-11-06 (everything above kept)
built: NEW code proved on its own — tape-transport.test.mjs, 18 checks: at rest exactly 1× and no lag; a straight stop at half speed at half time, stopped on time, monotone, lag = the area it fell behind; the curve both ways; spin-up; let go mid-stop continuous; varispeed; never reads ahead; rewind 3 s/s to maxLag; a minute finite; the worklet = the kernel. Loaded in the page by the tool that first uses it (Tape Memory).


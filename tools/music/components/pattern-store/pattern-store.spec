# spec_id: eravos.component.pattern-store · version 0.1.0 · status planned · template eravos.component/1
# generated from eravos.music-ecosystem.spec v0.2.0 §3 — rule: eravos.components.spec (small, on its own, documented, shared)
identity:
  id: pattern-store ; group: events ; component tool: no (yes = also on the canvas with a window and typed ports)
  job: patterns as data: notes, steps, lanes; versioned, diffable
used by: acid-line · arpeggio-evolution · arrangement-organism · baile-engine · bassline-writer · break-architect · chop-station · club-bounce · contrast-engine · counterpoint-engine · drop-compiler · dub-skank · elastic-arrangement · fill-generator · garage-skip · gesture-capture · harmony-architect · hat-roller · melody-organism · mpe-surface · polyrhythm-engine · psy-roller · rhythmic-tension-mapper · sonic-gravity
inputs / outputs / limits (written 2026-11-06 for the Pattern Editor; was "TO WRITE — signal types, control ranges, latency, cpu per instance"): pattern { id, name, len (sixteenths), key?, notes [{ s, l, n | r, v, b?, k? }] (the Timeline's clip notes, unchanged), places [{ ref, at, xf { transpose, steps?, stretch, reverse, invert, every, chance, seed } }], tags, v }; Store() { put (a new version each save; old ones kept), get(id, v?), versions(id), list(filter), remove } · flatten(p, store, { depth ≤ 6, key?, rng? }) → notes (cycles refused) · grow(base, rule, depth) → pattern · diff(a, b) → { added, removed, changed } · toJSON/fromJSON (text, diffable)
  stands on: —
  status: building 2026-11-06 — proved on its own (pattern-store.test.mjs); new code
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
  - real-time safe: no allocation, locks or I/O in process(); denormals flushed
acceptance:
  - its numbers proved on its own (frequency response, ranges, timing) in <id>.test.js
  - every tool that assembles it still nulls after any change to it
  - cpu measured and recorded in eravos.performance.spec

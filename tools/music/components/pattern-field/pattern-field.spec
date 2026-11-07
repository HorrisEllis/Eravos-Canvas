# spec_id: eravos.component.pattern-field · version 1.0.0 · status built 2026-11-07 · template eravos.component/1
# his words (2026-11-07): "agnostic. the structure defines the shape which defines the emergent properties of the conditions." · "Yeah, we can
#   just start with this. The small, like just the flat" — the Workshop's music PATTERN kind (specs/eravos.workshop.spec ADDENDA 2026-11-07)
identity:
  id: pattern-field ; group: generators ; component tool: no (the Pattern tool, eravos.pattern-field, holds it)
  job: a pattern as a structure — its conditions (scale, chords per bar, a Euclidean grid, a range) make a shape: every note it admits; inside
       it, by density (over the pattern) and contour (where the line leans), with a seed, the notes emerge; locked notes are yours and kept
used by: eravos.pattern-field (the tool) · the Workshop's music PATTERN kind
inputs / outputs / limits: shape(st) → { steps, admitted [[step, midi]], open(step, midi) } · emerge(st) → { steps, admitted, notes [{ s, n, len,
  vel, locked }] } · euclid(k, n, rot) · clean(st) (bars 1–8, range MIDI lo < hi, grid k ≤ n ≤ 32, density 0…1 rise|fall|arch|hold, contour
  flat|rise|fall|arch|wave ±36 st, length 0.25–16 steps, seed ≥ 1) · deterministic: the same structure + seed → the same notes; two draws a step,
  used or not, so a change in one place never reshuffles the rest
  stands on: scale-key (its scales, when loaded; its own table otherwise)
proof: pattern-field.test.mjs 16 checks — euclid (5/8, tresillo, four on the floor, rot), every admitted note in key / chord / range / grid,
  determinism, every emerged note admitted, seed, density 0 → silence and 1 → every admitted step, rise, contour climbs, a locked note kept when
  the shape changes, a late lock leaves earlier notes as they were, clean
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed

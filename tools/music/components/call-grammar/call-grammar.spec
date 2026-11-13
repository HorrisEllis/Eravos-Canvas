# spec_id: eravos.component.call-grammar · version 0.1.0 · status planned · template eravos.component/1
# From his words (2026-11-13): "make patterns from feelings" · "it was like wail songs" — tools/music/planned/feeling-song.spec
identity:
  id: call-grammar ; group: pattern ; component tool: no
  job: patterns built the way whale song is — units (one call: a pitch curve, a length, a swell) → phrases (a few units, repeated) → themes
    (a phrase repeated with slow drift) → a song (themes in turn); each repeat changes a little (drift 0–1: pitch, timing, length, order);
    an answer voice may reply (transposed by a set step, delayed); seeded: the same seed, the same song
used by: feeling-song · (any tool that wants phrase / theme structure: arps, pattern-field, the Song Engine)
inputs / outputs / limits: in: units (from a drag, notes, or another pattern) + phrase length, repeats, drift, answer, seed; out: a pattern
  (pattern-store) — notes carrying pitch curves (pitch-path); deterministic; no audio
rules:
  - never imports a tool; tools import it
  - deterministic from its seed; drift 0 = exact repeats
acceptance:
  - drift 0: every repeat identical; drift 0.5: similarity 0.6–0.95 between repeats; the same seed twice → the same pattern
  - a unit's pitch curve survives the round trip within 1 c
# ADDENDUM 2026-11-13 (2): his "no song" — Feeling Song no longer stands on it (feeling-song.spec ADDENDUM 2026-11-13 (2)). Kept as a spec for
#   any tool that wants phrase / theme structure; used by none yet.

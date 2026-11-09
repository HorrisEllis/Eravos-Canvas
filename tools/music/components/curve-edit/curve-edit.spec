# spec_id: eravos.component.curve-edit · version 1.0.0 · status built (2026-11-09) — written before its code (axiom 8)
# his words (2026-11-09): "i want to be able to manipulate it on the canvas, like photoshop, needs the toolbar, for drawing, shaping, editing"
identity:
  id: curve-edit ; group: editing ; component tool: no (a kernel any editor uses: the Workshop's toolbar, later the roll's curve lanes)
  job: the editing operations on a curve of points [[t 0…1 ascending, value], …] — each returns a NEW curve, the original untouched
ops:
  pen(curve, stroke)            the stretch the stroke covers is replaced by it (binned to 1/64); outside it, the curve as it was
  line(curve, a, b)             a straight line from point a to point b; the points between them go
  movePoint(curve, i, t, v)     point i to (t, v); its t kept between its neighbours; the first and last stay at 0 and 1
  addPoint(curve, t, v) → {curve, index} · removePoint(curve, i) (never the ends, never below 2 points)
  nearest(curve, t, v, scaleT, scaleV) → { index, dist } (in the caller's units: pixels)
  smooth(curve, ts, radius, amount)   a brush: around each t in ts (± radius), values pulled toward their neighbours' average
  erase(curve, ts, radius, rest)      a brush: around each t, values set to rest (a ramp at the edges, so nothing jumps)
  offset(curve, dv) · scale(curve, k, around)
  resample(curve, n) · simplify(curve, eps, max) — at most max points within eps of the curve
dag: stroke / points ─→ op ─→ new curve ─→ the caller writes it (one history step)
proved (curve-edit.test.mjs): pen keeps what is outside the stroke; line passes through both ends and removes what was between; a moved point
  never passes a neighbour, the ends stay put; add / remove, never below 2; smooth reduces the roughness where it passed and nowhere else;
  erase reaches rest in the middle, ramps at the edges; offset / scale exact; simplify within eps; the input is never changed
rules: never imports a tool; pure functions

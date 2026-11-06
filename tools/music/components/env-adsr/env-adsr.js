/* eravos.component.env-adsr 1.0.0 — the ADSR envelope (phase 1 · 21 tools stand on it). NEW code (2026-11-06, first used by Swarm
 * Oscillator); extracting it out of syn-env (DAHDSR, curves, loop) is a later step that must null-render.
 *   attack   linear from wherever it is now to 1 in `a` seconds (a retrigger starts from the current level: no click)
 *   decay    exponential toward the sustain level, 60 dB of the way there in `d` seconds
 *   release  exponential toward 0, −60 dB in `r` seconds; under −100 dB it is idle (done = true)
 *   MusicParts.ADSR() → { set(a, d, s, r, sr), gate(on), next() → 0…1, level, stage, done, reset() }   (per sample, in a worklet)
 *   MusicParts.adsrSchedule(param, t, { a, d, s, r, peak }) and adsrRelease(param, t, r) — the same shape on an AudioParam
 * Allocation-free; self-contained (stringified into worklets). A component imports no tool. */
(function (root) {
  'use strict';
  function ADSR() {
    const LN1000 = 6.907755278982137;   // ln(1000): −60 dB
    let A = 0.01, D = 0.3, S = 0.7, Rl = 0.5, sr = 48000, aInc = 0, dK = 0, rK = 0, st = 0, lv = 0;   // st 0 idle · 1 attack · 2 decay/sustain · 3 release
    function set(a, d, s, r, rate) {
      if (rate) sr = rate; A = Math.max(0.0005, a); D = Math.max(0.001, d); S = s < 0 ? 0 : s > 1 ? 1 : s; Rl = Math.max(0.001, r);
      aInc = 1 / (A * sr); dK = Math.exp(-LN1000 / (D * sr)); rK = Math.exp(-LN1000 / (Rl * sr));
    }
    function gate(on) { if (on) st = 1; else if (st !== 0) st = 3; }
    function next() {
      if (st === 1) { lv += aInc; if (lv >= 1) { lv = 1; st = 2; } }
      else if (st === 2) lv = S + (lv - S) * dK;
      else if (st === 3) { lv *= rK; if (lv < 1e-5) { lv = 0; st = 0; } }
      return lv;
    }
    set(A, D, S, Rl, sr);
    return { set, gate, next, reset() { lv = 0; st = 0; }, get level() { return lv; }, get stage() { return st; }, get done() { return st === 0; } };
  }
  // the same envelope on an AudioParam (outside a worklet)
  function adsrSchedule(p, t, o) {
    const pk = o.peak === undefined ? 1 : o.peak, s = (o.s === undefined ? 0.7 : o.s) * pk, d = Math.max(0.001, o.d || 0.3);
    p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); p.linearRampToValueAtTime(pk, t + Math.max(0.0005, o.a || 0.01));
    p.setTargetAtTime(s, t + Math.max(0.0005, o.a || 0.01), d / 6.907755278982137);
  }
  function adsrRelease(p, t, r) { if (typeof p.cancelAndHoldAtTime === 'function') p.cancelAndHoldAtTime(t); else p.cancelScheduledValues(t); p.setTargetAtTime(0, t, Math.max(0.001, r) / 6.907755278982137); }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { ADSR, adsrSchedule, adsrRelease });
  if (typeof module !== 'undefined' && module.exports) module.exports = { ADSR, adsrSchedule, adsrRelease };
})(typeof window !== 'undefined' ? window : globalThis);

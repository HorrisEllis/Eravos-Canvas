/* eravos.component.envelope-follower 1.0.0 — how loud a signal is, now, as a modulation (7 planned tools stand on it; first used by Collision).
 * NEW code (2026-11-27). Peak (|x|) or RMS (a mean square over ~ the attack), then a one-pole that rises with Attack and falls with Release
 * (each the time to reach 63 % of a step), and Hold keeps the peak that long before it may fall. Gain trims the input, Range turns the level
 * into 0…1: floor dB → 0, 0 dBFS → 1 (on a dB scale, so a kick at −6 dB and one at −18 dB read differently, as they sound).
 *   attack 0.1…500 ms · release 1…3000 ms · hold 0…500 ms · mode 0 peak · 1 rms · floor −90…−6 dB (default −48)
 *   MusicParts.Follower() → { set({ attack, release, hold, mode, floor }, sr), next(x) → env 0…1, level (linear, before Range), reset() }
 * Allocation-free; self-contained (its text can be stringified into worklets). A component imports no tool. */
(function (root) {
  'use strict';
  function Follower() {
    let sr = 48000, a = 0, r = 0, holdN = 0, mode = 0, floor = -48, env = 0, held = 0, ms = 0, msK = 0, A = 1, R = 300, H = 0;
    function coeffs() { a = Math.exp(-1 / Math.max(1, A * 0.001 * sr)); r = Math.exp(-1 / Math.max(1, R * 0.001 * sr)); holdN = Math.round(H * 0.001 * sr); msK = Math.exp(-1 / Math.max(1, Math.max(A, 5) * 0.001 * sr)); }
    function set(o, rate) { if (rate) sr = rate; if (o) { if (o.attack !== undefined) A = Math.max(0.1, Math.min(500, +o.attack)); if (o.release !== undefined) R = Math.max(1, Math.min(3000, +o.release));
      if (o.hold !== undefined) H = Math.max(0, Math.min(500, +o.hold)); if (o.mode !== undefined) mode = o.mode | 0; if (o.floor !== undefined) floor = Math.max(-90, Math.min(-6, +o.floor)); } coeffs(); }
    function reset() { env = 0; held = 0; ms = 0; }
    const out = { level: 0 };
    function next(x) {
      let v = x < 0 ? -x : x;
      if (mode === 1) { ms = msK * ms + (1 - msK) * x * x; v = Math.sqrt(ms); }
      if (v > env) { env = a * env + (1 - a) * v; held = holdN; } else if (held > 0) held--; else env = r * env + (1 - r) * v;
      if (env < 1e-12) env = 0;   // no denormals
      out.level = env;
      if (env <= 0) return 0; const db = 20 * Math.log10(env); return db <= floor ? 0 : db >= 0 ? 1 : 1 - db / floor;
    }
    set({}, 48000);
    return { set, next, reset, get level() { return out.level; } };
  }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { Follower });
  if (typeof module !== 'undefined' && module.exports) module.exports = { Follower };
})(typeof window !== 'undefined' ? window : globalThis);

/* eravos.component.note-release 1.0.0 — letting go of a note
 * Extracted (phase 0 · P0.3) from eravos.wobble-bass, eravos.wub-osc, eravos.wub-sub (one held note, three identical copies) and
 * eravos.syn-osc, eravos.syn-partials (a pool of voices, two identical copies). Same statements in the same order.
 *   MusicParts.releaseHeld(ac, gain, held, note, t, release)
 *       monophonic: if `held` is that note, hold the gain where it is at t (cancelAndHoldAtTime, else cancelScheduledValues) and
 *       fall to 0 with a time constant of release/4; held.off = t. `release` is the tool's Release in seconds.
 *   MusicParts.releaseVoices(ac, voices, note, t, release)
 *       polyphonic: every voice of that note not yet released goes to the tool's own release(voice, t).
 * A component imports no tool (eravos.components). */
(function (root) {
  'use strict';
  function releaseHeld(ac, gain, held, note, t, release) {
    if (!held || held.note !== note) return;
    t = Math.max(t || ac.currentTime, ac.currentTime);
    if (typeof gain.cancelAndHoldAtTime === 'function') gain.cancelAndHoldAtTime(t); else gain.cancelScheduledValues(t);
    gain.setTargetAtTime(0, t, release / 4); held.off = t;
  }
  function releaseVoices(ac, voices, note, t, release) {
    t = Math.max(t || ac.currentTime, ac.currentTime);
    voices.filter(v => v.note === note && !v.released).forEach(v => release(v, t));
  }
  root.MusicParts = root.MusicParts || {};
  root.MusicParts.releaseHeld = releaseHeld; root.MusicParts.releaseVoices = releaseVoices;
  if (typeof module !== 'undefined' && module.exports) module.exports = { releaseHeld, releaseVoices };
})(typeof window !== 'undefined' ? window : globalThis);

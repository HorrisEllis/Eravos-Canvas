/* eravos.component.voice-allocator 1.0.0 — which voice plays which note (retro-dco, fm-matrix, layer-architect, sample-universe stand
 * on it). NEW code (2026-11-06), proved on its own (voice-allocator.test.mjs). Logic only: it makes no sound and owns no audio node —
 * a tool asks it, then starts / moves / releases its own voice.
 *   modes    poly     each note its own voice (up to `voices`, 1…32)
 *            mono     one voice; every new note retriggers it; letting go returns to the last key still held (last-note priority)
 *            legato   one voice; a note played while another is held glides there WITHOUT retriggering (retrigger: false)
 *   steal    when every voice is busy (poly): a voice in its release goes first (the one released longest ago); then by policy:
 *            oldest (started first) · quietest (lowest level the tool reported with level(v, x)) · same-note (that note's own voice,
 *            else oldest) · lowest (lowest note) · highest (highest note)
 *   release  a voice let go stays "releasing" until free(v) — or, when release(seconds) is set, until that long after its note-off.
 *            A note-off may be booked ahead (a sequenced note's length): until then the voice still counts as sounding.
 *   budget   budget() → { voices, active, releasing, free, stolen } (stolen counts every steal since reset)
 * noteOn / noteOff return ONE result object, reused (no allocation per note): { voice, note, retrigger, stolen, stolenNote, glide }
 *   voice −1 = nothing to do (a note-off for a key not held, or mono with keys still down)
 * A component imports no tool (eravos.components). */
(function (root) {
  'use strict';
  const MODES = ['poly', 'mono', 'legato'], STEAL = ['oldest', 'quietest', 'same-note', 'lowest', 'highest'];
  function VoiceAllocator(maxVoices) {
    const MAX = 32;
    const note = new Int32Array(MAX).fill(-1), state = new Uint8Array(MAX), start = new Float64Array(MAX), offAt = new Float64Array(MAX), lvl = new Float64Array(MAX).fill(1);
    const held = new Int32Array(128), heldVel = new Float64Array(128); let heldN = 0;   // keys down, in order (mono / legato)
    const FREE = 0, ON = 1, REL = 2;
    let voices = Math.max(1, Math.min(MAX, maxVoices || 8)), mode = 0, steal = 0, relSec = 0, stolenCount = 0, seq = 0;
    const R = { voice: -1, note: -1, retrigger: false, stolen: -1, stolenNote: -1, glide: false };
    function out(v, n, re, st, sn, gl) { R.voice = v; R.note = n; R.retrigger = re; R.stolen = st; R.stolenNote = sn; R.glide = gl; return R; }
    function settle(t) { if (relSec > 0) for (let v = 0; v < voices; v++) if (state[v] === REL && t >= offAt[v] + relSec) { state[v] = FREE; note[v] = -1; } }
    function pushHeld(n, vel) { removeHeld(n); held[heldN] = n; heldVel[heldN] = vel; heldN++; }
    function removeHeld(n) { for (let i = 0; i < heldN; i++) if (held[i] === n) { for (let k = i; k < heldN - 1; k++) { held[k] = held[k + 1]; heldVel[k] = heldVel[k + 1]; } heldN--; return true; } return false; }
    function victim(n, t) {
      let best = -1;
      // the longest-released first — a note-off booked AFTER t (a sequenced note's length) is still sounding at t, so it does not count
      for (let v = 0; v < voices; v++) if (state[v] === REL && offAt[v] <= t && (best < 0 || offAt[v] < offAt[best])) best = v;
      if (best >= 0) return best;
      const pol = STEAL[steal];
      if (pol === 'same-note') for (let v = 0; v < voices; v++) if (note[v] === n) return v;
      for (let v = 0; v < voices; v++) {
        if (best < 0) { best = v; continue; }
        if (pol === 'quietest' ? lvl[v] < lvl[best] || (lvl[v] === lvl[best] && start[v] < start[best])
          : pol === 'lowest' ? note[v] < note[best] : pol === 'highest' ? note[v] > note[best] : start[v] < start[best]) best = v;
      }
      return best;
    }
    const api = {
      MODES, STEAL,
      setVoices(n) { voices = Math.max(1, Math.min(MAX, n | 0)); for (let v = voices; v < MAX; v++) { state[v] = FREE; note[v] = -1; } },
      setMode(m) { const i = typeof m === 'number' ? m : MODES.indexOf(m); if (i >= 0) { mode = i; api.reset(); } },
      setSteal(s) { const i = typeof s === 'number' ? s : STEAL.indexOf(s); if (i >= 0) steal = i; },
      release(seconds) { relSec = Math.max(0, +seconds || 0); },
      level(v, x) { if (v >= 0 && v < MAX) lvl[v] = x; },
      free(v) { if (v >= 0 && v < MAX) { state[v] = FREE; note[v] = -1; } },
      reset() { state.fill(FREE); note.fill(-1); lvl.fill(1); heldN = 0; stolenCount = 0; seq = 0; },
      voiceOf(n) { for (let v = 0; v < voices; v++) if (note[v] === n && state[v] === ON) return v; return -1; },
      noteOn(n, vel, t) {
        t = t || 0; settle(t); seq++;
        if (mode !== 0) {   // one voice
          const was = heldN > 0 && state[0] === ON; pushHeld(n, vel || 1);
          const gl = was, re = mode === 1 || !was; note[0] = n; state[0] = ON; if (re) start[0] = t + seq * 1e-9;
          return out(0, n, re, -1, -1, gl);
        }
        for (let v = 0; v < voices; v++) if (state[v] === FREE) { note[v] = n; state[v] = ON; start[v] = t + seq * 1e-9; lvl[v] = 1; return out(v, n, true, -1, -1, false); }
        const v = victim(n, t), sn = note[v]; stolenCount++;
        note[v] = n; state[v] = ON; start[v] = t + seq * 1e-9; lvl[v] = 1;
        return out(v, n, true, v, sn, false);
      },
      noteOff(n, t) {
        t = t || 0; settle(t);
        if (mode !== 0) {
          if (!removeHeld(n)) return out(-1, n, false, -1, -1, false);
          if (note[0] !== n) return out(-1, n, false, -1, -1, false);              // a key under the sounding one let go: nothing changes
          if (heldN > 0) { const back = held[heldN - 1]; note[0] = back; return out(0, back, mode === 1, -1, -1, true); }   // back to the last key held
          state[0] = REL; offAt[0] = t; return out(0, n, false, -1, -1, false);   // the last key up: release
        }
        for (let v = 0; v < voices; v++) if (note[v] === n && state[v] === ON) { state[v] = REL; offAt[v] = t; return out(v, n, false, -1, -1, false); }
        return out(-1, n, false, -1, -1, false);
      },
      budget() { let a = 0, r = 0; for (let v = 0; v < voices; v++) { if (state[v] === ON) a++; else if (state[v] === REL) r++; } return { voices, active: a, releasing: r, free: voices - a - r, stolen: stolenCount }; },
    };
    return api;
  }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { VoiceAllocator, VOICE_MODES: MODES, VOICE_STEAL: STEAL });
  if (typeof module !== 'undefined' && module.exports) module.exports = { VoiceAllocator, VOICE_MODES: MODES, VOICE_STEAL: STEAL };
})(typeof window !== 'undefined' ? window : globalThis);

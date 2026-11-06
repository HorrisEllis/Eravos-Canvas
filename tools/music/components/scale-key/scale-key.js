/* eravos.component.scale-key 1.0.0 — scales, keys, snapping (phase 2 · 13 tools stand on it; the Pattern Editor first).
 * Proved equal to MusicTheory (core/music-theory.js) on every 12-tone input (scale-key.test.mjs); moving MusicTheory onto it is a later
 * step. Adds what the editor needs: move by scale steps, and semitones-from-the-root ↔ MIDI (how the Pattern Library stores pitch).
 *   MusicParts.KEY.SCALES · inScale(midi, root, scale) · quantize(midi, root, scale) (ties go down) · degreeToMidi(degree, octave, root, scale)
 *   · degreeOf(midi, root, scale) · step(midi, steps, root, scale) · toRel(midi, root) · fromRel(rel, root)
 * Pure; no state. A component imports no tool. */
(function (root) {
  'use strict';
  const SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11], mixolydian: [0, 2, 4, 5, 7, 9, 10], harmonic_minor: [0, 2, 3, 5, 7, 8, 11],
    pentatonic_major: [0, 2, 4, 7, 9], pentatonic_minor: [0, 3, 5, 7, 10], blues: [0, 3, 5, 6, 7, 10], chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  };
  const mod = (a, n) => ((a % n) + n) % n;
  const scaleOf = (s) => SCALES[s] || SCALES.minor;
  function inScale(midi, r, s) { return scaleOf(s).includes(mod(midi - r, 12)); }
  function quantize(midi, r, s) {
    const sc = scaleOf(s); let best = midi, bd = Infinity;
    for (let m = midi - 12; m <= midi + 12; m++) { if (!sc.includes(mod(m - r, 12))) continue; const d = Math.abs(m - midi); if (d < bd || (d === bd && m < best)) { best = m; bd = d; } }
    return best;
  }
  function degreeToMidi(degree, octave, r, s) { const sc = scaleOf(s), n = sc.length, d = Math.round(degree) - 1; return (octave + 1 + Math.floor(d / n)) * 12 + mod(r, 12) + sc[mod(d, n)]; }
  function degreeOf(midi, r, s) { const q = quantize(midi, r, s), sc = scaleOf(s), rel = q - mod(r, 12); return { degree: sc.indexOf(mod(rel, 12)) + 1, octave: Math.floor(rel / 12) - 1 }; }
  // move a note by scale steps (a note off the scale is snapped first): step(C4, +2, C, major) = E4
  function step(midi, steps, r, s) {
    const sc = scaleOf(s), n = sc.length, q = quantize(midi, r, s), rel = q - mod(r, 12), oct = Math.floor(rel / 12), i = sc.indexOf(mod(rel, 12)) + Math.round(steps);
    return mod(r, 12) + (oct + Math.floor(i / n)) * 12 + sc[mod(i, n)];
  }
  // semitones from the key's root, exactly as the Pattern Library stores pitch (r = n − root, n = r + root; root 0…11): a pattern plays in any key
  const toRel = (midi, r) => midi - mod(r, 12);
  const fromRel = (rel, r) => rel + mod(r, 12);
  const KEY = { SCALES, inScale, quantize, degreeToMidi, degreeOf, step, toRel, fromRel, scaleOf };
  root.MusicParts = root.MusicParts || {};
  root.MusicParts.KEY = KEY;
  if (typeof module !== 'undefined' && module.exports) module.exports = { KEY };
})(typeof window !== 'undefined' ? window : globalThis);

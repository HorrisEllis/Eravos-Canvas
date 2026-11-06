/* eravos.component.progression 1.0.0 — the chord progressions and "which chord is it at bar N"
 * Extracted (phase 0 · P0.3) from eravos.bass-gen, eravos.chord-gen and eravos.edm-lab, which each carried the table and the lookup.
 *   MusicParts.PROGRESSIONS      name → scale degrees (1-based), the five the Bass Gen and Chord Gen offer, in their order
 *   MusicParts.JAZZ_PROGRESSIONS (3.132) the jazz six · MusicParts.ALL_PROGRESSIONS the five then the six (what Chords and Bassline offer)
 *   MusicParts.pickProgressions([names]) → a table of just those, in that order (EDM Lab offers four of the five)
 *   MusicParts.degreeAt(table, name, bar, chordBars) → the degree playing at that bar (chordBars bars per chord)
 * A component imports no tool (eravos.components). */
(function (root) {
  'use strict';
  const PROGRESSIONS = { 'i-VI-III-VII': [1, 6, 3, 7], 'i-iv-v-i': [1, 4, 5, 1], 'vi-IV-I-V': [6, 4, 1, 5], 'i-i-VI-VII': [1, 1, 6, 7], 'i-v-VI-iv': [1, 5, 6, 4] };
  // 3.132 the jazz six (his words: "i also want to be able to make lofi"): a SECOND table, so the five above stay exactly as they were
  const JAZZ_PROGRESSIONS = { 'ii-V-I-I': [2, 5, 1, 1], 'ii-V-I-vi': [2, 5, 1, 6], 'I-vi-ii-V': [1, 6, 2, 5], 'IV-iii-vi-ii': [4, 3, 6, 2], 'i-iv-VII-III': [1, 4, 7, 3], 'vi-ii-V-I': [6, 2, 5, 1] };
  const ALL_PROGRESSIONS = Object.assign({}, PROGRESSIONS, JAZZ_PROGRESSIONS);
  function pickProgressions(names) { const o = {}; names.forEach(n => { o[n] = PROGRESSIONS[n]; }); return o; }
  function degreeAt(table, name, bar, chordBars) { const pr = table[name]; return pr[Math.floor(bar / +chordBars) % pr.length]; }
  root.MusicParts = root.MusicParts || {};
  root.MusicParts.PROGRESSIONS = PROGRESSIONS; root.MusicParts.JAZZ_PROGRESSIONS = JAZZ_PROGRESSIONS; root.MusicParts.ALL_PROGRESSIONS = ALL_PROGRESSIONS; root.MusicParts.pickProgressions = pickProgressions; root.MusicParts.degreeAt = degreeAt;
  if (typeof module !== 'undefined' && module.exports) module.exports = { PROGRESSIONS, JAZZ_PROGRESSIONS, ALL_PROGRESSIONS, pickProgressions, degreeAt };
})(typeof window !== 'undefined' ? window : globalThis);

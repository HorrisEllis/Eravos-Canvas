/* eravos.component.filter-formant 1.0.0 — the mouth: a vowel table and a formant bank that talks between two vowels.
 * Extracted (phase 0 · P0.5) from eravos.wobble-bass and eravos.wub-filter, which each carried their own vowel table and the same
 * bank (3 bandpass bands, a 0…1 morph moving every band's frequency and gain from vowel A to vowel B). The two tables had drifted
 * (Wobble Bass: UH IH ER; Wub Filter: YOI; AE's third band −14 vs −12 dB): there is now one table, and every tool speaks every vowel.
 * Same arithmetic, same connection order: proved bit for bit against both originals in filter-formant.test.mjs, and by the null
 * render on every Wobble Bass and Wub Filter preset.
 *   MusicParts.VOWELS                                   { name: { f: [F1, F2, F3] Hz, g: [dB, dB, dB] } } — the one table
 *   MusicParts.vowels(over?)                            a copy of the table, with a tool's own overrides laid on top
 *   MusicParts.formantBands(ac, input, output, n = 3)   → [{ b, g }]  input → bandpass b → gain g → output, per band
 *   MusicParts.formantMorph(ac, bands, pos)             pos (0…1, any AudioNode) → fScale → b.frequency and → gScale → g.gain;
 *                                                        sets band.fScale / band.gScale, returns bands
 *   MusicParts.formantSet(bands, A, B, { shift, q, maxHz, dbToGain })   the values for a vowel pair:
 *        b.frequency = min(maxHz, A.f·2^(shift/12)) · b.Q = 4 + 0.9·q · fScale = (B.f − A.f)·2^(shift/12) · g = gain(A.g) · gScale = gain(B.g) − gain(A.g)
 * A component imports no tool (eravos.components). */
(function (root) {
  'use strict';
  // F1/F2/F3 from the Peterson–Barney averages (rounded); band gains shape the vowel. YOI: the talking "yoi" between OH and EE.
  const VOWELS = Object.freeze({
    OO: { f: [300, 870, 2240], g: [0, -10, -24] },
    OH: { f: [450, 800, 2830], g: [0, -6, -20] },
    AH: { f: [730, 1090, 2440], g: [0, -4, -14] },
    EH: { f: [530, 1840, 2480], g: [0, -8, -12] },
    EE: { f: [270, 2290, 3010], g: [0, -12, -10] },
    UH: { f: [640, 1190, 2390], g: [0, -5, -18] },
    AE: { f: [660, 1720, 2410], g: [0, -6, -14] },
    IH: { f: [390, 1990, 2550], g: [0, -10, -12] },
    ER: { f: [490, 1350, 1690], g: [0, -6, -10] },
    YOI: { f: [380, 1400, 2600], g: [0, -5, -12] },
  });
  const vowels = (over) => Object.assign({}, VOWELS, over || {});
  const dbToGain0 = (db) => Math.pow(10, db / 20);
  function formantBands(ac, input, output, n) {
    return Array.from({ length: n || 3 }, () => { const b = ac.createBiquadFilter(); b.type = 'bandpass'; const g = ac.createGain(); input.connect(b); b.connect(g); g.connect(output); return { b, g }; });
  }
  function formantMorph(ac, bands, pos) {
    bands.forEach(bd => { const fScale = ac.createGain(), gScale = ac.createGain(); pos.connect(fScale); fScale.connect(bd.b.frequency); pos.connect(gScale); gScale.connect(bd.g.gain); bd.fScale = fScale; bd.gScale = gScale; });
    return bands;
  }
  function formantSet(bands, A, B, o) {
    o = o || {}; const fs = Math.pow(2, (o.shift || 0) / 12), q = o.q, maxHz = o.maxHz === undefined ? Infinity : o.maxHz, toGain = o.dbToGain || dbToGain0;
    bands.forEach((bd, i) => {
      bd.b.frequency.value = maxHz === Infinity ? A.f[i] * fs : Math.min(maxHz, A.f[i] * fs); bd.b.Q.value = 4 + q * 0.9;
      bd.fScale.gain.value = (B.f[i] - A.f[i]) * fs;
      const ga = toGain(A.g[i]), gb = toGain(B.g[i]); bd.g.gain.value = ga; bd.gScale.gain.value = gb - ga;
    });
  }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { VOWELS, vowels, formantBands, formantMorph, formantSet });
  if (typeof module !== 'undefined' && module.exports) module.exports = { VOWELS, vowels, formantBands, formantMorph, formantSet };
})(typeof window !== 'undefined' ? window : globalThis);

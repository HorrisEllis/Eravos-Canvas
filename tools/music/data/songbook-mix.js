/* ERAVOS songs' mix trims (3.177) — data only, applied to the Song Engine's genres after every songbook has loaded. His words, 2026-11-13:
 * "I cant hear some of them in the preview. Can you also test them. Some sound lterrible".
 * Measured, not guessed: every listed song's preview rendered as the Songs page renders it (301 songs) and measured — level, how spiky (peak
 * over average), the share under 60 Hz, above 5 kHz, silent bars, and PINNED: the share of samples pressed against the peak (the master's
 * limiter squashing a too-hot sum — heard as distortion). Floor Falls Out, which he likes: 0.07 %. 26 songs measured 0.20–0.47 %.
 * Then each problem genre's parts were taken out one at a time to find the part that drives it (the Sub Engine in most, at its 0.8 default;
 * a wobble, a wub, an organ, a Reese or an acid line in others) and trial levels were rendered (0.8 / 0.5 / 0.35 for the sub). The trims
 * below are those measurements' result: the part's level, absolute (a song's configure step overrides its preset's level). Nothing else in
 * a song changes; the genres' own definitions stay as they were written (this file is the one place these trims live).
 *   [genre, part's organism, level, what it fixed (before → after, measured on two of its songs)] */
(function () {
  'use strict';
  const SE = window.SongEngine; if (!SE) return;
  const TRIMS = [
    ['oc-breathing-dnb', 'eravos.sub-engine', 0.5, 'pinned 0.39 → ~0.2 (sub); the Reese trimmed too'], ['oc-breathing-dnb', 'eravos.reese-bass', 0.75, 'the second-hottest part'],
    ['oc-acid-seance', 'eravos.sub-engine', 0.5, 'pinned 0.25 → 0.15'], ['oc-acid-seance', 'eravos.acid-synth', 0.75, 'the acid line drove the rest'],
    ['oc-funeral-dancehall', 'eravos.sub-engine', 0.5, 'pinned 0.24 → 0.15'],
    ['oc-cathedral-riddim', 'eravos.sub-engine', 0.5, 'pinned 0.24 → ~0.18 (spread over wub, sub, drums)'], ['oc-cathedral-riddim', 'eravos.wub-osc', 0.55, 'the wub carried most of it'],
    ['oc-machine-choir', 'eravos.wobble-bass', 0.6, 'pinned 0.30 → 0.03 without the wobble'],
    ['oc-hanging-dub', 'eravos.wub-osc', 0.5, 'pinned 0.23 → 0.05 without the wub'], ['oc-hanging-dub', 'eravos.organ', 0.4, 'the organ: 0.23 → 0.09 without it'],
    ['reese-vs-wub', 'eravos.sub-engine', 0.5, 'pinned 0.41 → 0.17'], ['reese-vs-wub', 'eravos.reese-bass', 0.75, 'the Reese: 0.38 → 0.06 without it'],
    ['halftime-reese', 'eravos.sub-engine', 0.5, 'pinned 0.27 → 0.13'],
    ['drumstep', 'eravos.sub-engine', 0.5, 'pinned 0.23 → 0.12'],
    ['tearout', 'eravos.sub-engine', 0.5, 'pinned 0.16 → 0.08'],
    ['ll-last-light', 'eravos.sub-engine', 0.5, 'Dark to Dawn pinned 0.47 → 0.13'],
  ];
  function apply() {
    const G = new Map(SE.genres().map(g => [g.id, g])); let n = 0;
    TRIMS.forEach(([gid, org, level]) => { const g = G.get(gid); if (!g || !g.parts) return;
      Object.values(g.parts).forEach(p => { if (p.organism === org) { p.configure = Object.assign({}, p.configure || {}, { level }); n++; } }); });
    return n;
  }
  const applied = apply();
  window.SongbookMix = { measured: '2026-11-13', trims: () => TRIMS.map(([genre, organism, level, why]) => ({ genre, organism, level, why })), applied };
})();

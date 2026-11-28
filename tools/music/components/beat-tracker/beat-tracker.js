/* eravos.component.beat-tracker 1.0.0 — a recording's tempo, where its beats fall, and where its bar starts, with how sure: Song Import SI1
 * (specs/eravos.song-import.spec; his words 2026-11-28: "Can we make the canvas import a song and open the relevant tools to make it?").
 * NEW code. From onset-detector's envelope (the all-band flux, one value per frame):
 *   1 the envelope, its slow mean taken away (only what stands out of it), square-rooted (a big kick and a small snare both count)
 *   2 its autocorrelation over the lags of Min … Max BPM; each lag scored with its 2× and 4× (a beat's bar lines up too) and weighted by a
 *     log-normal around Prefer BPM (an octave wide — Ellis 2007), so 70 and 140 are told apart the way a listener does
 *   2b the octave from the drums: if the kicks and snares (low + mid; never the hats) do not repeat at the chosen beat but do at twice
 *     it, the beat is twice as long — an 87 BPM groove with hats on the eighths reads 87, not 174; the other octave is kept as alt
 *   3 the best lag refined to a hundredth of a BPM: the comb of beats (period, phase) that collects the most envelope, period ± 3 %
 *   3b the beat on the kicks: the phase or the phase half a beat on, whichever's strongest low and mid hits (kicks and snares, the top quarter of each) are stronger — hats
 *     on the off-beats pull a comb half a beat late, and a syncopated bass fills both grids
 *   4 the downbeat: of the four beats of a bar, the one whose strongest low hits are strongest (beat 1: where the kick lands)
 *   MusicParts.BeatTracker.analyse(env, frameRate, { min, max, prefer, low, mid, t0 }) → { bpm, alt (the other octave: ×2 or ÷2), conf (0…1), phase (s, the first beat), beats [s],
 *     downbeat (s, the first bar's start), period (s) }   (low / mid: the low- and mid-band envelopes, optional; t0: the time of env[0])
 * Offline (a whole recording at once; allocates) — import analyses a file, it does not play it. Self-contained. A component imports no tool. */
(function (root) {
  'use strict';
  function analyse(env, fr, o) {
    o = o || {}; const min = o.min || 60, max = o.max || 200, prefer = o.prefer || 120, t0 = o.t0 || 0, N = env.length;
    if (N < fr * 2) return { bpm: 0, conf: 0, phase: 0, beats: [], downbeat: 0, period: 0 };
    // 1 the envelope above its slow mean (a second's window)
    const W = Math.max(1, Math.round(fr * 0.5)), e = new Float32Array(N); let s = 0;
    const pre = new Float64Array(N + 1); for (let i = 0; i < N; i++) pre[i + 1] = pre[i] + env[i];
    for (let i = 0; i < N; i++) { const a = Math.max(0, i - W), b = Math.min(N, i + W + 1), m = (pre[b] - pre[a]) / (b - a); e[i] = Math.sqrt(Math.max(0, env[i] - m)); s += e[i]; }   // the square root: a big kick and a small snare both count
    if (s <= 0) return { bpm: 0, conf: 0, phase: 0, beats: [], downbeat: 0, period: 0 };
    // 2 the autocorrelation, lags from max to min BPM (and up to 4× for the bar)
    const lagOf = (bpm) => fr * 60 / bpm, Lmin = Math.floor(lagOf(max)), Lmax = Math.ceil(lagOf(min)), top = Math.min(N - 1, Lmax * 4 + 2);
    const ac = new Float64Array(top + 1); for (let L = 1; L <= top; L++) { let a = 0; for (let i = L; i < N; i++) a += e[i] * e[i - L]; ac[L] = a / (N - L); }
    const at = (x) => { const i = Math.floor(x), f = x - i; return i + 1 <= top ? ac[i] * (1 - f) + ac[i + 1] * f : 0; };
    let best = -1, bestL = 0, sum = 0, cnt = 0;
    for (let L = Lmin; L <= Lmax; L++) { const bpm = fr * 60 / L, w = Math.exp(-0.5 * Math.pow(Math.log2(bpm / prefer) / 1, 2));
      const sc = w * (at(L) + 0.5 * at(2 * L) + 0.25 * at(4 * L)); sum += sc; cnt++; if (sc > best) { best = sc; bestL = L; } }
    // 2b the octave from the drums: when the kicks and snares (low + mid, never the hats) do not repeat at the chosen lag but do at twice
    // it, the beat is twice as long (an 87 BPM groove with hats on the eighths is not 174) — the other octave is kept as alt
    let alt = 0;
    { const LM = [o.low, o.mid].filter(L => L && L.length === N); if (LM.length) { const d = new Float32Array(N); LM.forEach(L => { let m = 0; for (let i = 0; i < N; i++) m = Math.max(m, L[i]); for (let i = 0; i < N; i++) d[i] += L[i] / (m || 1); });
      let mu = 0; for (let i = 0; i < N; i++) mu += d[i]; mu /= N; for (let i = 0; i < N; i++) d[i] = Math.max(0, d[i] - mu);
      const acd = (x) => { const L = Math.round(x); let a = 0; for (let i = L; i < N; i++) a += d[i] * d[i - L]; return a / Math.max(1, N - L); };
      const slow = bestL * 2, fast = bestL / 2, r = acd(bestL);
      if (fr * 60 / slow >= min && r < 0.25 * acd(slow)) { alt = fr * 60 / bestL; bestL = slow; }                 // the drums do not repeat at this beat: it is twice as long
      else if (fr * 60 / fast <= max && acd(fast) > 0.3 * r) { alt = fr * 60 / bestL; bestL = fast; } } }          // they repeat at half of it too: it is twice as fast
    // 3 the comb: period and phase that gather the most envelope (fractional frames, linear between them)
    const ev = (x) => { const i = Math.floor(x), f = x - i; return i + 1 < N ? e[i] * (1 - f) + e[i + 1] * f : 0; };
    const comb = (P, ph) => { let a = 0; for (let x = ph; x < N - 1; x += P) a += ev(x); return a; };
    let bp = bestL, bph = 0, bs = -1;
    for (let P = bestL * 0.97; P <= bestL * 1.03; P += bestL * 0.0005) { const step = Math.max(0.25, P / 64);
      for (let ph = 0; ph < P; ph += step) { const c = comb(P, ph) * P / N; if (c > bs) { bs = c; bp = P; bph = ph; } } }
    // refine the phase finely at the best period
    for (let ph = Math.max(0, bph - 1); ph <= bph + 1; ph += 0.02) { const c = comb(bp, ph) * bp / N; if (c > bs) { bs = c; bph = ph; } }
    // the beat on the kicks, not between them: of the phase and the phase half a beat on, the one with more low-band strength (when given)
    // the beat on the kicks: of the phase and the phase half a beat on, the one whose strongest low hits (the top quarter) are stronger —
    // a busy or syncopated bass fills both grids, but the biggest hit (kick and bass together) is on the beat
    const peakAt = (L, i) => { let m = 0; for (let j = Math.max(0, i - 2); j <= Math.min(N - 1, i + 2); j++) m = Math.max(m, L[j]); return m; };
    const topQ = (vals) => { vals.sort((a, b) => b - a); const q = Math.max(1, Math.ceil(vals.length / 4)); let a = 0; for (let k = 0; k < q; k++) a += vals[k]; return a / q; };
    // low (kicks) and mid (snares) together, each against its own loudest; the hats (high) never vote
    const bands = [o.low, o.mid].filter(L => L && L.length === N).map(L => { let m = 0; for (let i = 0; i < N; i++) m = Math.max(m, L[i]); return { L, m: m || 1 }; });
    const gridAt = (ph) => bands.reduce((acc, B) => { const v = []; for (let x = ph; x < N - 1; x += bp) v.push(peakAt(B.L, Math.round(x)) / B.m); return acc + topQ(v); }, 0);
    if (bands.length) { const half = (bph + bp / 2) % bp; if (gridAt(half) > gridAt(bph) * 1.02) bph = half; }
    const period = bp / fr, bpm = Math.round(60 / period * 100) / 100, phase = t0 + bph / fr, beats = [];
    for (let x = bph; x < N; x += bp) beats.push(t0 + x / fr);
    // 4 the downbeat: the beat of four with the most low-band strength
    let downbeat = beats[0] || 0;
    if (o.low && o.low.length === N && beats.length >= 8) { const by = [[], [], [], []];
      beats.forEach((t, k) => by[k % 4].push(peakAt(o.low, Math.round((t - t0) * fr)))); const tot = by.map(topQ);
      const k = tot.indexOf(Math.max(...tot)); downbeat = beats[k]; }
    const conf = Math.max(0, Math.min(1, 1 - (sum / cnt) / best));   // how far the best stands above the average lag
    if (!alt) { const fast = bpm * 2, slow = bpm / 2; alt = fast <= max ? fast : slow >= min ? slow : 0; } alt = Math.round(alt * 100) / 100;
    return { bpm, alt, conf, phase, beats, downbeat, period };
  }
  const BeatTracker = { analyse };
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { BeatTracker });
  if (typeof module !== 'undefined' && module.exports) module.exports = { BeatTracker };
})(typeof window !== 'undefined' ? window : globalThis);

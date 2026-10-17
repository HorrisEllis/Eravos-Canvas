/* ERAVOS test instrument — audio-measure.js → window.AudioMeasure. What a test can say about a sound without ears.
 * Pure functions over Float32Array (one channel) or an AudioBuffer-like { sampleRate, getChannelData(c), numberOfChannels }.
 * Every measure is itself tested against signals whose answer is known exactly (tests/p42-measure.test.js) before it is
 * trusted on a tool (tests/tool-audio.mjs).
 *
 *   scan(buf)                    → { nan, clip, peak, peakDb, rms, rmsDb, dc } over the whole buffer (all channels)
 *   rms(d, sr, from, to)         → linear RMS of a window (seconds)
 *   pitch(d, sr, from, to)       → { hz, clarity } — YIN (de Cheveigné & Kawahara 2002) with parabolic refinement
 *   cents(hz, ref)               → signed cents ; foldCents(hz, ref) → cents to the NEAREST OCTAVE of ref (-600…600)
 *   onsets(d, sr, o)             → [seconds] — energy-flux onsets, each refined to the first sample over a local threshold
 *                                  (o.diff: on the first difference — hits over a low tail)
 *   gridError(onsets, bpm, t0)   → [{ t, step, errMs }] against the 16th grid
 *   modRate(d, sr, from, to, o)  → { hz, depthDb } — the strongest periodic movement of the loudness envelope (wobble rate)
 *   correlation(buf, from, to)   → L/R Pearson correlation (1 mono, 0 wide, −1 phase-inverted)
 */
(function (global) {
  'use strict';
  const db = (x) => 20 * Math.log10(Math.max(1e-12, x));
  const idx = (sr, t, n) => Math.max(0, Math.min(n, Math.round(t * sr)));

  function scan(buf) {
    let nan = 0, clip = 0, peak = 0, sq = 0, sum = 0, n = 0;
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < d.length; i++) {
        const v = d[i];
        if (!Number.isFinite(v)) { nan++; continue; }
        const a = Math.abs(v); if (a >= 0.9999) clip++; if (a > peak) peak = a; sq += v * v; sum += v; n++;
      }
    }
    const rms = Math.sqrt(sq / Math.max(1, n));
    return { nan, clip, peak, peakDb: db(peak), rms, rmsDb: db(rms), dc: sum / Math.max(1, n) };
  }
  function rms(d, sr, from, to) {
    const s = idx(sr, from || 0, d.length), e = idx(sr, to === undefined ? d.length / sr : to, d.length);
    let q = 0; for (let i = s; i < e; i++) q += d[i] * d[i]; return Math.sqrt(q / Math.max(1, e - s));
  }
  function mean(d, sr, from, to) {
    const s = idx(sr, from || 0, d.length), e = idx(sr, to === undefined ? d.length / sr : to, d.length);
    let q = 0; for (let i = s; i < e; i++) q += d[i]; return q / Math.max(1, e - s);
  }

  // YIN over a window; fmin/fmax bound the search. Returns the best period's frequency and clarity (1 − dip).
  function pitch(d, sr, from, to, o) {
    o = o || {};
    const fmin = o.fmin || 25, fmax = o.fmax || 2000, th = o.threshold || 0.15;
    const s = idx(sr, from || 0, d.length), e = idx(sr, to === undefined ? d.length / sr : to, d.length);
    const tauMax = Math.min(Math.floor(sr / fmin), Math.floor((e - s) / 2)), tauMin = Math.max(2, Math.floor(sr / fmax));
    const W = Math.min(e - s - tauMax, Math.floor(sr * 0.08)); if (W < 64 || tauMax <= tauMin) return { hz: 0, clarity: 0 };
    // average the difference function over several frames in the window — steadier on modulated sounds
    const frames = Math.max(1, Math.min(8, Math.floor((e - s - tauMax) / W)));
    const df = new Float64Array(tauMax + 1);
    for (let f = 0; f < frames; f++) {
      const b = s + f * Math.floor((e - s - tauMax - W) / Math.max(1, frames - 1 || 1));
      for (let tau = 1; tau <= tauMax; tau++) { let acc = 0; for (let i = 0; i < W; i++) { const x = d[b + i] - d[b + i + tau]; acc += x * x; } df[tau] += acc; }
    }
    const cm = new Float64Array(tauMax + 1); cm[0] = 1; let run = 0;
    for (let tau = 1; tau <= tauMax; tau++) { run += df[tau]; cm[tau] = run > 0 ? df[tau] * tau / run : 1; }
    let best = -1;
    for (let tau = tauMin; tau <= tauMax; tau++) {
      if (cm[tau] < th) { while (tau + 1 <= tauMax && cm[tau + 1] < cm[tau]) tau++; best = tau; break; }
    }
    if (best < 0) { let m = Infinity; for (let tau = tauMin; tau <= tauMax; tau++) if (cm[tau] < m) { m = cm[tau]; best = tau; } }
    // parabolic interpolation around the dip
    let t = best; if (best > 1 && best < tauMax) { const a = cm[best - 1], b = cm[best], c = cm[best + 1], den = a - 2 * b + c; if (den) t = best + 0.5 * (a - c) / den; }
    return { hz: sr / t, clarity: Math.max(0, 1 - cm[best]) };
  }
  const cents = (hz, ref) => 1200 * Math.log2(hz / ref);
  const foldCents = (hz, ref) => { const c = cents(hz, ref); return c - 1200 * Math.round(c / 1200); };
  const midiHz = (n) => 440 * Math.pow(2, (n - 69) / 12);

  // onsets: 2 ms RMS frames; an onset is a frame whose energy jumps by `ratio` over the max of the previous `look` frames and
  // clears `floorDb` under the buffer peak; then refined to the first sample (in that region) exceeding 10 % of the local peak.
  function onsets(d, sr, o) {
    o = o || {};
    // o.diff: work on the first difference (x[n] − x[n−1]) — a high-pass that leaves drum transients and removes a low tail
    // (a 55 Hz tail drops below 1 %), so a hat on an 808 is still seen and timed
    if (o.diff) { const e = new Float32Array(d.length); for (let i = 1; i < d.length; i++) e[i] = d[i] - d[i - 1]; d = e; }
    const hop = Math.max(1, Math.round(sr * 0.002)), ratio = o.ratio || 4, look = o.look || 10, gap = o.minGap || 0.05;
    let pk = 0; for (let i = 0; i < d.length; i++) pk = Math.max(pk, Math.abs(d[i]));
    const floor = pk * Math.pow(10, (o.floorDb || -30) / 20), frames = [];
    for (let i = 0; i + hop <= d.length; i += hop) { let q = 0; for (let j = i; j < i + hop; j++) q += d[j] * d[j]; frames.push(Math.sqrt(q / hop)); }
    const out = []; let last = -Infinity;
    for (let f = 1; f < frames.length; f++) {
      let prev = 1e-9; for (let k = Math.max(0, f - look); k < f; k++) prev = Math.max(prev, frames[k]);
      if (frames[f] > floor && frames[f] > prev * ratio) {
        const s0 = Math.max(0, (f - 1) * hop), s1 = Math.min(d.length, (f + 3) * hop);
        let lp = 0; for (let i = s0; i < s1; i++) lp = Math.max(lp, Math.abs(d[i]));
        // the edge is measured from the level JUST BEFORE the hit (a quiet hit over a loud tail would otherwise read a frame early)
        let floor0 = 0; for (let i = Math.max(0, s0 - hop); i < s0; i++) floor0 = Math.max(floor0, Math.abs(d[i]));
        const edge = floor0 + (lp - floor0) * (o.edge || 0.1);   // 10 %: a 2 ms attack ramp reads at 0.2 ms
        let at = s0; for (let i = s0; i < s1; i++) if (Math.abs(d[i]) > edge) { at = i; break; }
        const t = at / sr; if (t - last >= gap) { out.push(t); last = t; }
      }
    }
    return out;
  }
  function gridError(ons, bpm, t0) {
    const step = 60 / bpm / 4;
    return ons.map(t => { const k = Math.round((t - t0) / step); return { t, step: k, errMs: (t - (t0 + k * step)) * 1000 }; });
  }

  // loudness envelope (5 ms RMS), detrended, then a direct DFT scan 0.25–40 Hz at 0.01 Hz → the strongest movement
  function modRate(d, sr, from, to, o) {
    o = o || {};
    const s = idx(sr, from || 0, d.length), e = idx(sr, to === undefined ? d.length / sr : to, d.length);
    const hop = Math.round(sr * 0.005), env = [];
    for (let i = s; i + hop <= e; i += hop) { let q = 0; for (let j = i; j < i + hop; j++) q += d[j] * d[j]; env.push(Math.sqrt(q / hop)); }
    const n = env.length; if (n < 16) return { hz: 0, depthDb: 0 };
    const m = env.reduce((a, b) => a + b, 0) / n; const x = env.map(v => v - m), fs = 1 / 0.005;
    const lo = o.lo || 0.25, hi = o.hi || 40, stepHz = o.step || 0.01;
    let best = 0, bestP = 0;
    for (let f = lo; f <= hi; f += stepHz) {
      let re = 0, im = 0; const w = 2 * Math.PI * f / fs;
      for (let k = 0; k < n; k++) { re += x[k] * Math.cos(w * k); im -= x[k] * Math.sin(w * k); }
      const p = re * re + im * im; if (p > bestP) { bestP = p; best = f; }
    }
    let mn = Infinity, mx = 0; env.forEach(v => { mn = Math.min(mn, v); mx = Math.max(mx, v); });
    return { hz: best, depthDb: db(mx) - db(Math.max(mn, 1e-6)) };
  }
  function correlation(buf, from, to) {
    if (buf.numberOfChannels < 2) return 1;
    const L = buf.getChannelData(0), R = buf.getChannelData(1), sr = buf.sampleRate;
    const s = idx(sr, from || 0, L.length), e = idx(sr, to === undefined ? L.length / sr : to, L.length);
    let sl = 0, sr2 = 0, slr = 0; for (let i = s; i < e; i++) { sl += L[i] * L[i]; sr2 += R[i] * R[i]; slr += L[i] * R[i]; }
    return sl && sr2 ? slr / Math.sqrt(sl * sr2) : 1;
  }

  global.AudioMeasure = { db, scan, rms, mean, pitch, cents, foldCents, midiHz, onsets, gridError, modRate, correlation };
})(typeof window !== 'undefined' ? window : globalThis);

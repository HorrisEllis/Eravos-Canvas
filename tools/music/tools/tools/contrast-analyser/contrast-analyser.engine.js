/* eravos.contrast-analyser 2.0.0 — Contrast (P6) · resolves F-14
 * Tells a non-engineer, in plain words, whether two sounds fight: same frequencies (mud), same loudness
 * (masking), same rhythm (flat) — and what to do. Real radix-2 FFT (Welch, Hann, 50 % overlap), 24 Bark
 * bands, spectral-flux onsets, autocorrelation tempo. Live inputs are TAPS (never reroute). No global
 * file grabbing: a slot only takes an asset when it is explicitly 'waiting'. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const BARK = [20, 100, 200, 300, 400, 510, 630, 770, 920, 1080, 1270, 1480, 1720, 2000, 2320, 2700, 3150, 3700, 4400, 5300, 6400, 7700, 9500, 12000, 15500];
  function welch(data, sr, N) {
    const dsp = OrganismSDK.dsp, win = dsp.hann(N), hop = N / 2, mag = new Float64Array(N / 2);
    let frames = 0; const re = new Float32Array(N), im = new Float32Array(N);
    for (let s = 0; s + N <= data.length; s += hop) {
      for (let i = 0; i < N; i++) { re[i] = data[s + i] * win[i]; im[i] = 0; }
      dsp.fft(re, im);
      for (let k = 0; k < N / 2; k++) mag[k] += re[k] * re[k] + im[k] * im[k];
      frames++; if (frames > 400) break;
    }
    if (!frames) { for (let i = 0; i < Math.min(N, data.length); i++) { re[i] = data[i] * win[i]; im[i] = 0; } for (let i = data.length; i < N; i++) { re[i] = 0; im[i] = 0; } OrganismSDK.dsp.fft(re, im); for (let k = 0; k < N / 2; k++) mag[k] = re[k] * re[k] + im[k] * im[k]; frames = 1; }
    const wsum = win.reduce((a, b) => a + b * b, 0);
    for (let k = 0; k < N / 2; k++) mag[k] = mag[k] / frames / wsum;
    return mag; // power spectral density (arbitrary scale), bin k = k·sr/N
  }
  function bands(power, sr, N) {
    const out = [];
    for (let b = 0; b < 24; b++) { const lo = Math.floor(BARK[b] * N / sr), hi = Math.max(lo + 1, Math.floor(BARK[b + 1] * N / sr)); let s = 0; for (let k = lo; k < hi && k < power.length; k++) s += power[k]; out.push(s); }
    return out;
  }
  function clash(Ea, Eb) {
    const db = (x) => 10 * Math.log10(x + 1e-20);
    const ma = Math.max(...Ea), mb = Math.max(...Eb);
    let num = 0, den = 0;
    for (let b = 0; b < 24; b++) { if (db(Ea[b] / ma) > -60 && db(Eb[b] / mb) > -60) { const a = Ea[b] / ma, c = Eb[b] / mb; num += Math.min(a, c); den += Math.max(a, c); } }
    return den ? num / den * 100 : 0;
  }
  function tempo(buf, sr) {
    const onsetsEnv = [], hop = 512, N = 1024, d = buf, win = OrganismSDK.dsp.hann(N), prev = new Float32Array(N / 2), re = new Float32Array(N), im = new Float32Array(N);
    for (let s = 0; s + N <= d.length; s += hop) { for (let i = 0; i < N; i++) { re[i] = d[s + i] * win[i]; im[i] = 0; } OrganismSDK.dsp.fft(re, im); let f = 0; for (let k = 0; k < N / 2; k++) { const m = Math.hypot(re[k], im[k]); if (m > prev[k]) f += m - prev[k]; prev[k] = m; } onsetsEnv.push(f); }
    const fps = sr / hop; let best = 0, bestBpm = 0;
    for (let bpm = 60; bpm <= 200; bpm += 0.25) {
      const lag = fps * 60 / bpm; let c = 0, n = 0;
      for (let i = 0; i + lag + 1 < onsetsEnv.length; i++) { const j = i + lag, j0 = Math.floor(j), f = j - j0; c += onsetsEnv[i] * (onsetsEnv[j0] * (1 - f) + onsetsEnv[j0 + 1] * f); n++; }
      c = n ? c / n : 0; if (c > best * 1.0001) { best = c; bestBpm = bpm; }
    }
    // octave-error correction: prefer 90–180 BPM range
    while (bestBpm < 90 && bestBpm) bestBpm *= 2; while (bestBpm > 180) bestBpm /= 2;
    return Math.round(bestBpm * 10) / 10;
  }
  OrganismFactory.define({
    id: 'eravos.contrast-analyser', domain: 'music', version: '2.0.0', label: 'Contrast', icon: '⟺', accent: '#00d4ff', phase: 'P6',
    category: 'Tools', blurb: 'Do two sounds fight? Plain-language answer (mud, loudness, rhythm) and what to do about it.',
    size: { w: 640, h: 500 }, minSize: { w: 480, h: 380 },
    permissions: ['audio_in', 'bus_publish', 'bus_subscribe', 'filesystem_read'],
    provides: ['capability.analysis'],
    hooks: [
      S.audio_in('ca.hook.in_a', 'inA', true), S.audio_in('ca.hook.in_b', 'inB', true), S.asset_in('ca.hook.asset_in'),
      S.event('ca.hook.analysis_out', 'out', 'contrast:analysis', { type: 'object', required: ['clash', 'contested', 'dynDiffDb', 'displacement', 'bpm', 'advice'] }, '2.0.0'),
    ],
    config: [
      { key: 'fft', type: 'enum', options: [2048, 4096, 8192], default: 4096, label: 'FFT', group: 'ANALYSIS' },
      { key: 'smoothing', type: 'number', default: 0.8, min: 0, max: 0.95, step: 0.01, label: 'Smoothing', group: 'ANALYSIS' },
      { key: 'sensitivity', type: 'number', default: 0.4, min: 0, max: 1, step: 0.01, label: 'Onsets', group: 'ANALYSIS' },
      { key: 'bpmSource', type: 'enum', options: ['session', 'detected'], default: 'session', label: 'BPM from', group: 'ANALYSIS' },
    ],
    ui_hooks: ['slot_load', 'slot_mode', 'tab', 'reanalyse'],
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp;
      const slots = { A: { mode: 'file', buf: null, name: '' }, B: { mode: 'file', buf: null, name: '' } };
      const inA = ac.createGain(), inB = ac.createGain();
      const anA = ac.createAnalyser(), anB = ac.createAnalyser(); inA.connect(anA); inB.connect(anB);
      ctx.port('inA', { kind: 'audio', direction: 'in', node: inA, tap: true, label: 'A (live)' });
      ctx.port('inB', { kind: 'audio', direction: 'in', node: inB, tap: true, label: 'B (live)' });
      function spectrumOfBuffer(buf) { const N = +P.get('fft'); const d = buf.getChannelData(0); return { power: welch(d, buf.sampleRate, N), sr: buf.sampleRate, N }; }
      function spectrumLive(an) { const N = +P.get('fft'); an.fftSize = N; an.smoothingTimeConstant = P.get('smoothing'); const f = new Float32Array(N / 2); an.getFloatFrequencyData(f); const p = new Float64Array(N / 2); for (let k = 0; k < N / 2; k++) p[k] = Math.pow(10, f[k] / 10); return { power: p, sr: ac.sampleRate, N }; }
      function rmsCurve(buf) { const d = buf.getChannelData(0), n = Math.floor(buf.sampleRate * 0.1), out = []; let pk = 0, sq = 0; for (let s = 0; s + n <= d.length; s += n) { let q = 0; for (let i = s; i < s + n; i++) { q += d[i] * d[i]; pk = Math.max(pk, Math.abs(d[i])); } out.push(10 * Math.log10(q / n + 1e-20)); sq += q; } const rms = Math.sqrt(sq / Math.max(1, d.length)); return { curve: out, crest: 20 * Math.log10((pk + 1e-12) / (rms + 1e-12)), rmsDb: 20 * Math.log10(rms + 1e-12) }; }
      function analyse() {
        const A = slots.A, B = slots.B;
        const spA = A.mode === 'live' ? spectrumLive(anA) : A.buf ? spectrumOfBuffer(A.buf) : null;
        const spB = B.mode === 'live' ? spectrumLive(anB) : B.buf ? spectrumOfBuffer(B.buf) : null;
        if (!spA || !spB) { ctx.emitUI('analysis', { ready: false }); return null; }
        const Ea = bands(spA.power, spA.sr, spA.N), Eb = bands(spB.power, spB.sr, spB.N);
        const c = clash(Ea, Eb);
        const dbA = Ea.map(e => 10 * Math.log10(e + 1e-20)), dbB = Eb.map(e => 10 * Math.log10(e + 1e-20));
        const mA = Math.max(...dbA), mB = Math.max(...dbB);
        const contested = [];
        for (let b = 0; b < 24; b++) { const a = dbA[b] - mA, bb = dbB[b] - mB; if (a > -30 && bb > -30 && Math.abs(dbA[b] - dbB[b]) < 6) contested.push({ lo: BARK[b], hi: BARK[b + 1], winner: dbA[b] >= dbB[b] ? 'A' : 'B', level: Math.min(a, bb) }); }
        contested.sort((x, y) => y.level - x.level);
        const dynA = A.buf ? rmsCurve(A.buf) : null, dynB = B.buf ? rmsCurve(B.buf) : null;
        const dynDiffDb = dynA && dynB ? dynA.rmsDb - dynB.rmsDb : (10 * Math.log10(Ea.reduce((a, b) => a + b, 0) + 1e-20) - 10 * Math.log10(Eb.reduce((a, b) => a + b, 0) + 1e-20));
        let bpm = ctx.bpm, displacement = 0, onA = [], onB = [];
        if (A.buf && B.buf) {
          onA = dsp.onsets(A.buf, P.get('sensitivity')); onB = dsp.onsets(B.buf, P.get('sensitivity'));
          if (P.get('bpmSource') === 'detected') bpm = tempo(A.buf.getChannelData(0), A.buf.sampleRate) || bpm;
          const g16 = 60 / bpm / 4; const off = (on) => on.length ? on.reduce((a, t) => a + Math.abs(t / g16 - Math.round(t / g16)), 0) / on.length : 0;
          displacement = Math.abs(off(onA) - off(onB));
        }
        const top = contested.slice(0, 3);
        const advice = [];
        if (c > 60) advice.push(`These two sounds live in the same frequencies (clash ${c.toFixed(0)}/100). Make room: EQ one of them down where they overlap, or sidechain one to the other.`);
        top.forEach(b => advice.push(`Both are loud at ${b.lo}–${b.hi} Hz. Cut 3 dB at ${Math.round(Math.sqrt(b.lo * b.hi))} Hz on ${b.winner === 'A' ? 'B' : 'A'}, or sidechain ${b.winner === 'A' ? 'B to A' : 'A to B'}.`));
        if (Math.abs(dynDiffDb) > 6) advice.push(`${dynDiffDb > 0 ? 'A' : 'B'} is ${Math.abs(dynDiffDb).toFixed(1)} dB louder — the other may get buried. Raise its channel fader or compress it.`);
        if (A.buf && B.buf && onA.length && onB.length && displacement < 0.05 && c > 40) advice.push('They hit on the same 16ths too — move one by an 1/8 or give it a different rhythm so both can be heard.');
        if (c < 20) advice.push(`Separate — they sit in different ranges (clash ${c.toFixed(0)}/100). Nothing to fix.`);
        const res = { clash: +c.toFixed(1), contested: top.map(b => ({ lo: b.lo, hi: b.hi, winner: b.winner })), dynDiffDb: +dynDiffDb.toFixed(2), displacement: +displacement.toFixed(3), bpm, advice };
        ctx.emit('contrast:analysis', res);
        ctx.emitUI('analysis', Object.assign({ ready: true, bandsA: dbA.map(v => v - mA), bandsB: dbB.map(v => v - mB), barks: BARK, rmsA: dynA && dynA.curve, rmsB: dynB && dynB.curve, crestA: dynA && dynA.crest, crestB: dynB && dynB.crest, onsetsA: onA, onsetsB: onB }, res));
        return res;
      }
      ctx.analyse = analyse; ctx.tempo = tempo; ctx.clash = clash; ctx.bands = bands; ctx.welch = welch;
      async function setBuffer(slot, buf, name) { slots[slot].buf = buf; slots[slot].name = name; slots[slot].mode = 'file'; ctx.emitUI('slot', { slot, name, peaks: dsp.peaks(buf, 200), duration: buf.duration }); analyse(); }
      ctx.setBuffer = setBuffer;
      ctx.onUI('slot_load', { type: 'object', required: ['slot', 'arrayBuffer'] }, async (p) => {
        if (!slots[p.slot]) return ctx.fault('RUNTIME_002', 'slot ' + p.slot);
        const a = ctx.K.assets.register(p.arrayBuffer, { name: p.name || 'clip' }); const b = await ctx.K.assets.decode(a.hash);
        if (b) setBuffer(p.slot, b, p.name || a.source);
      });
      ctx.onUI('slot_mode', { type: 'object', required: ['slot', 'mode'] }, (p) => { if (!slots[p.slot] || !['file', 'live', 'wait'].includes(p.mode)) return ctx.fault('RUNTIME_002', 'slot_mode'); slots[p.slot].mode = p.mode; ctx.syncUI(); analyse(); });
      ctx.on('asset:ready', OrganismSDK.ASSET_SCHEMA, async (p) => {
        const slot = ['A', 'B'].find(s => slots[s].mode === 'wait' && (p.target === ctx.id || !p.target));
        if (!slot) return; // F-14: never grab files meant for others
        const a = ctx.K.assets.get(p.hash); if (!a) return;
        const b = a.decoded || await ctx.K.assets.decode(p.hash); if (b) setBuffer(slot, b, p.name || a.source);
      });
      ctx.onUI('reanalyse', null, () => analyse());
      ctx.onUI('tab', { type: 'object' }, () => {});
      ctx.interval(() => { if (slots.A.mode === 'live' || slots.B.mode === 'live') analyse(); }, 250);
      ctx.stateExtra = () => ({ slots: { A: { mode: slots.A.mode, name: slots.A.name }, B: { mode: slots.B.mode, name: slots.B.name } } });
      ctx.slots = slots;
      return {};
    },
  });
})();

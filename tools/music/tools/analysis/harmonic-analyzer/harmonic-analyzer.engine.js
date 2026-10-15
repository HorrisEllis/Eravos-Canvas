/* eravos.harmonic-analyzer 1.0.0 — Harmonic Analyzer · spec eravos.organism.harmonic-analyzer
 * Reads the harmonic DNA of any sound — live (a TAP: wiring a sound in never reroutes it) or a dropped file:
 *   f0 (works with a missing fundamental), every partial's ratio to f0, its best rational approximation p/q
 *   (continued fractions), error in cents, offset from the piano's 12-TET, irrational constants recognised (φ, π, √2…),
 *   stiff-string inharmonicity B, harmonicity %, and the sound's own dissonance curve whose minima are the intervals
 *   that sound most consonant WITH THIS TIMBRE.
 * Recursive layers: fit a harmonic (or stretched) series, remove the partials it explains, analyse what is left,
 * repeat — a chord, a bell's sub-series or a layered growl splits into its sources.
 * Sends: xen:tuning (consonant intervals) · xen:spectrum (measured partials) · .scl export from the UI. */
(function () {
  'use strict';
  const S = OrganismSDK.STD, XT = window.XenTheory;
  OrganismFactory.define({
    id: 'eravos.harmonic-analyzer', domain: 'music', version: '1.0.0', label: 'Harmonic Analyzer', icon: '⌬', accent: '#ffe066', phase: 'P14',
    category: 'Analysis', blurb: 'Measures any sound’s partials: ratios, p/q approximations, irrational constants, inharmonicity, its own consonant intervals — layer by layer.',
    size: { w: 640, h: 660 }, minSize: { w: 480, h: 480 },
    permissions: ['audio_in', 'bus_publish', 'bus_subscribe', 'filesystem_read'],
    provides: ['capability.analysis', 'capability.xen_out'],
    needs: { notes: ['Live input is a tap: the sound you wire in keeps going where it went.'], works_with: ['eravos.xen-synth', 'eravos.recursive-spectra', 'eravos.sample-player'] },
    hooks: [
      Object.assign(S.audio_in('ha.hook.audio_in', 'in', true), { intent: 'sound to analyse (tap — never reroutes)' }),
      S.asset_in('ha.hook.asset_in'),
      S.event('ha.hook.tuning_out', 'out', 'xen:tuning', { type: 'object', required: ['steps', 'period'] }, '1.0.0'),
      S.event('ha.hook.spectrum_out', 'out', 'xen:spectrum', { type: 'object', required: ['partials'] }, '1.0.0'),
    ],
    config: [
      { key: 'fft', type: 'enum', options: [4096, 8192, 16384, 32768], default: 16384, label: 'FFT', group: 'ANALYSIS' },
      { key: 'floor', type: 'number', default: -80, min: -120, max: -20, step: 1, unit: 'dB', label: 'Floor', group: 'ANALYSIS' },
      { key: 'range', type: 'number', default: 60, min: 20, max: 100, step: 1, unit: 'dB', label: 'Range', group: 'ANALYSIS', hint: 'ignore partials this far below the loudest' },
      { key: 'maxPeaks', type: 'integer', default: 24, min: 4, max: 48, label: 'Partials', group: 'ANALYSIS' },
      { key: 'maxDen', type: 'integer', default: 32, min: 4, max: 128, label: 'Max q', group: 'ANALYSIS', hint: 'largest denominator for p/q approximations' },
      { key: 'smoothing', type: 'number', default: 0.6, min: 0, max: 0.95, step: 0.01, label: 'Smooth', group: 'ANALYSIS' },
      { key: 'layers', type: 'integer', default: 3, min: 1, max: 4, label: 'Layers', group: 'ANALYSIS', hint: 'recursive decomposition depth' },
      { key: 'f0Mode', type: 'enum', options: ['auto', 'manual'], default: 'auto', label: 'f0', group: 'F0' },
      { key: 'f0Manual', type: 'number', default: 110, min: 16, max: 4000, step: 0.01, unit: 'Hz', label: 'f0 Hz', group: 'F0' },
      { key: 'hold', type: 'boolean', default: false, label: 'Hold', group: 'LIVE' },
      { key: 'source', type: 'enum', options: ['live', 'file'], default: 'live', label: 'Source', group: 'LIVE' },
      { key: 'sendTo', type: 'string', default: '', label: 'Send to', group: 'SEND' },
    ],
    ui_hooks: ['load', 'send_tuning', 'send_spectrum', 'reanalyse'],
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, K = ctx.K, MT = window.MusicTheory;
      const inp = ac.createGain(); ctx.track(inp);
      ctx.port('in', { kind: 'audio', direction: 'in', node: inp, tap: true, label: 'analyse' });
      let an = null;
      function makeAnalyser() { if (an) { try { inp.disconnect(an); } catch (e) {} } an = ac.createAnalyser(); an.fftSize = Number(P.get('fft')); an.smoothingTimeConstant = P.get('smoothing'); an.minDecibels = -140; an.maxDecibels = 0; inp.connect(an); ctx.track(an); }
      makeAnalyser();
      P.onChange('fft', makeAnalyser); P.onChange('smoothing', (v) => { an.smoothingTimeConstant = v; });
      let last = null, fileBuf = null, fileName = '';

      // ---- the analysis (same path for live frames and files)
      function analyseDb(db, sr, N, source) {
        const pk = XT.peaks(db, sr, N, { max: P.get('maxPeaks'), floor: P.get('floor'), rel: P.get('range') });
        if (pk.length < 1) return null;
        const manual = P.get('f0Mode') === 'manual' ? P.get('f0Manual') : undefined;
        const a = XT.analyse(pk, { f0: manual, maxDen: P.get('maxDen') }); if (!a) return null;
        // recursive layers: explain → remove → analyse the residue
        const layers = []; let rest = pk.slice();
        for (let d = 0; d < P.get('layers') && rest.length >= 3; d++) {
          const L = d === 0 ? a : XT.analyse(rest, { maxDen: P.get('maxDen') }); if (!L) break;
          const pred = (n) => n * L.f0 * Math.sqrt(1 + Math.max(0, L.B) * n * n);
          const hit = rest.filter(p => { const n = Math.max(1, Math.round(p.f / L.f0)); return n <= 40 && Math.abs(XT.cents(p.f / pred(n))) < 35; });
          if (hit.length < (d === 0 ? 1 : 3)) break;
          layers.push({ f0: L.f0, B: L.B, harmonicity: L.harmonicity, count: hit.length, note: noteOf(L.f0) });
          rest = rest.filter(p => !hit.includes(p));
        }
        const curve = XT.dissonanceCurve(a.spectrum.slice(0, 16), a.f0, 0, 1250, 5);
        const minima = XT.minima(curve, 0.02).filter(m => m.c > 0 && m.c < 1250).map(m => { const d = XT.describeRatio(XT.ratio(m.c), 32); return { c: m.c, approx: d.p + '/' + d.q, name: d.name, irr: d.irrational }; });
        last = { source, time: ac.currentTime, f0: a.f0, note: noteOf(a.f0), B: a.B, harmonicity: a.harmonicity, partials: a.partials, spectrum: a.spectrum, layers, residue: rest.length, curve: curve.map(x => +x.d.toFixed(4)), minima, name: source === 'file' ? fileName : 'live' };
        ctx.emitUI('analysis', last);
        return last;
      }
      function noteOf(f) { const m = 69 + 12 * Math.log2(f / 440), n = Math.round(m); return { name: MT.noteName(Math.max(0, Math.min(127, n))), cents: +((m - n) * 100).toFixed(1), midi: m }; }
      ctx.interval(() => {
        if (P.get('source') !== 'live' || P.get('hold') || !an) return;
        const db = new Float32Array(an.frequencyBinCount); an.getFloatFrequencyData(db);
        let mx = -Infinity; for (let i = 0; i < db.length; i++) if (db[i] > mx) mx = db[i];
        if (mx < P.get('floor') + 6) return;
        analyseDb(db, ac.sampleRate, an.fftSize, 'live');
      }, 250);

      // ---- files: Welch PSD over the sustained part (skip the attack), plus 4 time slices
      function psdDb(data, sr, N, from, to) {
        const dsp = ctx.dsp, win = dsp.hann(N), hop = N / 4, mag = new Float64Array(N / 2), re = new Float32Array(N), im = new Float32Array(N);
        let frames = 0; const s0 = Math.max(0, from), s1 = Math.min(data.length, to);
        for (let s = s0; s + N <= s1; s += hop) { for (let i = 0; i < N; i++) { re[i] = data[s + i] * win[i]; im[i] = 0; } dsp.fft(re, im); for (let k = 0; k < N / 2; k++) mag[k] += re[k] * re[k] + im[k] * im[k]; if (++frames > 64) break; }
        if (!frames) { const n = Math.min(N, s1 - s0); for (let i = 0; i < N; i++) { re[i] = i < n ? data[s0 + i] * win[i] : 0; im[i] = 0; } dsp.fft(re, im); for (let k = 0; k < N / 2; k++) mag[k] = re[k] * re[k] + im[k] * im[k]; frames = 1; }
        const wsum = win.reduce((a, b) => a + b, 0), out = new Float32Array(N / 2);
        for (let k = 0; k < N / 2; k++) out[k] = 10 * Math.log10(mag[k] / frames / (wsum * wsum / 4) + 1e-20);
        return out;
      }
      function analyseBuffer(buf, name) {
        fileBuf = buf; fileName = name || 'file';
        const sr = buf.sampleRate, d = new Float32Array(buf.length);
        for (let c = 0; c < buf.numberOfChannels; c++) { const x = buf.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] += x[i] / buf.numberOfChannels; }
        const N = Math.min(Number(P.get('fft')), 32768);
        // sustained part: from 8 % (min 30 ms) to 85 %
        const from = Math.max(Math.floor(sr * 0.03), Math.floor(d.length * 0.08)), to = Math.max(from + N, Math.floor(d.length * 0.85));
        const r = analyseDb(psdDb(d, sr, N, from, to), sr, N, 'file');
        if (r) {
          const slices = [];
          for (let k = 0; k < 4; k++) { const a0 = Math.floor(d.length * k / 4), a1 = Math.floor(d.length * (k + 1) / 4); const db = psdDb(d, sr, Math.min(N, 8192), a0, a1); const pk = XT.peaks(db, sr, Math.min(N, 8192), { max: 16, floor: P.get('floor'), rel: P.get('range') }); const a = pk.length ? XT.analyse(pk) : null; slices.push(a ? { t: +(a0 / sr).toFixed(2), f0: +a.f0.toFixed(2), B: a.B, harmonicity: +a.harmonicity.toFixed(3) } : { t: +(a0 / sr).toFixed(2) }); }
          r.slices = slices; ctx.emitUI('analysis', r);
        }
        return r;
      }
      ctx.analyseBuffer = analyseBuffer;
      ctx.onUI('load', { type: 'object', required: ['arrayBuffer'] }, async (p) => {
        const a = K.assets.register(p.arrayBuffer, { name: p.name || 'clip' }); const b = await K.assets.decode(a.hash);
        if (!b) return ctx.fault('ASSET_001', 'could not decode ' + (p.name || 'file'));
        P.set('source', 'file'); analyseBuffer(b, p.name);
      });
      ctx.on('asset:ready', OrganismSDK.ASSET_SCHEMA, async (p) => {
        if (p.target !== ctx.id) return; const a = K.assets.get(p.hash); if (!a) return;
        const b = a.decoded || await K.assets.decode(p.hash); if (b) { P.set('source', 'file'); analyseBuffer(b, p.name || a.source); }
      });
      ctx.onUI('reanalyse', null, () => { if (P.get('source') === 'file' && fileBuf) analyseBuffer(fileBuf, fileName); });
      const target = () => P.get('sendTo') || '*';
      function sendTuning() { if (!last) return ctx.fault('RUNTIME_002', 'nothing analysed yet'); const steps = [0].concat(last.minima.filter(m => m.c < 1195).map(m => +m.c.toFixed(3))); ctx.emit('xen:tuning', { steps, period: 1200, name: `consonances of ${last.name} (${last.note.name})`, target: target() }); return steps; }
      function sendSpectrum() { if (!last) return ctx.fault('RUNTIME_002', 'nothing analysed yet'); ctx.emit('xen:spectrum', { partials: last.spectrum.map(x => ({ r: x.r, a: x.a })), name: `${last.name} partials`, target: target() }); }
      ctx.sendTuning = sendTuning;
      ctx.onUI('send_tuning', null, sendTuning); ctx.onUI('send_spectrum', null, sendSpectrum);
      ctx.stateExtra = () => ({ last, fileName });
      ctx.internals = { get last() { return last; }, inp, get an() { return an; } };
      return {};
    },
  });
})();

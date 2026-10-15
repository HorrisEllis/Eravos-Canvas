/* eravos.fx-eq 1.0.0 — EQ (P11 gate F) · spec eravos.organism.fx-eq · inherits STD.fx
 * 7 bands in series: HPF (12/24/48 dB/oct, Butterworth cascade) → low shelf → 3 × peaking → high shelf → LPF (12/24/48).
 * Each band has an on switch. LISTEN solos one band (a band-pass at its frequency/Q) so you can hear what it touches.
 * AUTO GAIN compensates the output by the mean dB change of the curve over 100 Hz – 10 kHz (measured from the filters'
 * own frequency response, not estimated). Deviation from the spec (declared): no 6 dB/oct slope — 12 is the gentlest. */
(function () {
  'use strict';
  const S = OrganismSDK.STD, SDK = OrganismSDK;
  const BANDS = [
    { id: 'hp', label: 'HPF', type: 'highpass', f: 30, g: 0, q: 0.71 },
    { id: 'ls', label: 'Low', type: 'lowshelf', f: 120, g: 0, q: 0.71 },
    { id: 'p1', label: 'Mid 1', type: 'peaking', f: 400, g: 0, q: 1 },
    { id: 'p2', label: 'Mid 2', type: 'peaking', f: 1500, g: 0, q: 1 },
    { id: 'p3', label: 'Mid 3', type: 'peaking', f: 4000, g: 0, q: 1 },
    { id: 'hs', label: 'High', type: 'highshelf', f: 9000, g: 0, q: 0.71 },
    { id: 'lp', label: 'LPF', type: 'lowpass', f: 18000, g: 0, q: 0.71 },
  ];
  const SLOPES = [12, 24, 48];
  // Butterworth Q per 2nd-order section for an N-pole cascade (N = 2, 4, 8)
  const BW_Q = { 12: [0.7071], 24: [0.5412, 1.3066], 48: [0.5098, 0.6013, 0.9000, 2.5629] };
  const cfg = [];
  BANDS.forEach((b, i) => {
    const G = (b.label).toUpperCase();
    cfg.push({ key: b.id + 'On', type: 'boolean', default: b.id === 'hp' || b.id === 'lp' ? false : true, label: 'On', group: G });
    cfg.push({ key: b.id + 'Freq', type: 'number', default: b.f, min: 20, max: 20000, step: 1, unit: 'Hz', label: 'Freq', group: G, curve: 'log' });
    if (b.type !== 'highpass' && b.type !== 'lowpass') cfg.push({ key: b.id + 'Gain', type: 'number', default: b.g, min: -18, max: 18, step: 0.1, unit: 'dB', label: 'Gain', group: G });
    if (b.type === 'peaking') cfg.push({ key: b.id + 'Q', type: 'number', default: b.q, min: 0.1, max: 18, step: 0.01, label: 'Q', group: G, curve: 'log' });
    if (b.type === 'highpass' || b.type === 'lowpass') cfg.push({ key: b.id + 'Slope', type: 'enum', options: SLOPES, default: 24, label: 'dB/oct', group: G });
  });
  OrganismFactory.define({
    id: 'eravos.fx-eq', domain: 'music', version: '1.0.0', label: 'EQ', icon: '⌒', accent: '#ffdd00', phase: 'P11',
    category: 'Effects', blurb: 'Fix mud, add air: seven bands you drag right on the live spectrum. Listen to any band on its own.',
    size: { w: 640, h: 520 }, minSize: { w: 480, h: 400 },
    permissions: ['audio_out', 'audio_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.fx'],
    hooks: SDK.fxHooks([S.mod_in('eq.hook.mod_band1_freq', 'p1Freq'), S.mod_in('eq.hook.mod_band2_freq', 'p2Freq'), S.mod_in('eq.hook.mod_band3_freq', 'p3Freq')]),
    config: cfg.concat([
      { key: 'listen', type: 'enum', options: ['off'].concat(BANDS.map(b => b.id)), default: 'off', label: 'Listen', group: 'OUT', hint: 'hear only what one band touches' },
      { key: 'autoGain', type: 'boolean', default: false, label: 'Auto gain', group: 'OUT' },
    ]).concat(SDK.STD_FX_CONFIG),
    ui_hooks: ['band_drag', 'want_response'],
    defaultPreset: 'Flat',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params;
      const fx = SDK.fxShell(ctx);
      // every band is a list of BiquadFilterNodes (a cascade for the steep HPF / LPF)
      const chain = []; const sections = {};
      BANDS.forEach(b => {
        const n = (b.type === 'highpass' || b.type === 'lowpass') ? 4 : 1;
        sections[b.id] = Array.from({ length: n }, () => { const f = ac.createBiquadFilter(); f.type = b.type; ctx.track(f); return f; });
        sections[b.id].forEach(f => chain.push(f));
      });
      fx.wetIn.connect(chain[0]); for (let i = 0; i < chain.length - 1; i++) chain[i].connect(chain[i + 1]);
      const auto = ac.createGain(); chain[chain.length - 1].connect(auto); ctx.track(auto);
      // listen: band-pass solo of one band, crossfaded against the EQ chain
      const lbp = ac.createBiquadFilter(), lgain = ac.createGain(), egain = ac.createGain(); lbp.type = 'bandpass'; lgain.gain.value = 0;
      fx.wetIn.connect(lbp); lbp.connect(lgain); lgain.connect(fx.wetOut); auto.connect(egain); egain.connect(fx.wetOut);
      [lbp, lgain, egain].forEach(n => ctx.track(n));
      ['p1', 'p2', 'p3'].forEach((id, i) => { const m = ctx.modBus(id + 'Freq', { min: -2400, max: 2400 }); m.connect(sections[id][0].detune); });

      let initial = true;
      const setP = (param, v, tc) => { if (initial) param.value = v; else param.setTargetAtTime(v, ac.currentTime, tc || 0.01); };
      function applyBand(b) {
        const t = ac.currentTime, on = P.get(b.id + 'On'), fs = sections[b.id], f = P.get(b.id + 'Freq');
        if (b.type === 'highpass' || b.type === 'lowpass') {
          const slope = +P.get(b.id + 'Slope'), qs = BW_Q[slope] || BW_Q[24], ny = ac.sampleRate / 2 * 0.98;
          fs.forEach((s, i) => {
            const active = on && i < qs.length;
            // an inactive section is made transparent: HP at 1 Hz / LP at Nyquist, Q gentle
            const fq = active ? f : (b.type === 'highpass' ? 1 : ny);
            // Web Audio's lowpass/highpass Q is a resonance in dB, not a linear Q: Butterworth Q 0.7071 = −3.01 dB
            const qdb = 20 * Math.log10(active ? qs[i] : 0.5);
            setP(s.frequency, Math.min(ny, fq)); s.Q.setValueAtTime(qdb, t); if (initial) s.Q.value = qdb;
          });
        } else {
          const s = fs[0]; setP(s.frequency, f); setP(s.gain, on ? P.get(b.id + 'Gain') : 0);
          if (b.type === 'peaking') setP(s.Q, P.get(b.id + 'Q')); else s.Q.value = b.q;
        }
      }
      // the composite response, from the real filter objects (used by AUTO GAIN and by the UI curve)
      function response(freqs) {
        const n = freqs.length, mag = new Float32Array(n).fill(1), m = new Float32Array(n), ph = new Float32Array(n);
        chain.forEach(f => { f.getFrequencyResponse(freqs, m, ph); for (let i = 0; i < n; i++) mag[i] *= m[i]; });
        return mag;
      }
      ctx.response = response;
      function applyAuto() {
        let g = 1;
        if (P.get('autoGain')) {
          const F = new Float32Array(48); for (let i = 0; i < 48; i++) F[i] = 100 * Math.pow(100, i / 47);
          const mag = response(F); let s = 0; for (let i = 0; i < 48; i++) s += 20 * Math.log10(Math.max(1e-6, mag[i]));
          g = Math.pow(10, -(s / 48) / 20);
        }
        setP(auto.gain, g, 0.02);
      }
      function applyListen() {
        const l = P.get('listen'), t = ac.currentTime;
        if (l !== 'off') {
          const b = BANDS.find(x => x.id === l), f = P.get(l + 'Freq');
          lbp.frequency.setTargetAtTime(f, t, 0.01); lbp.Q.setTargetAtTime(b.type === 'peaking' ? Math.max(0.7, P.get(l + 'Q')) : 0.9, t, 0.01);
        }
        lgain.gain.setTargetAtTime(l !== 'off' ? 1 : 0, t, 0.008); egain.gain.setTargetAtTime(l !== 'off' ? 0 : 1, t, 0.008);
      }
      BANDS.forEach(b => { applyBand(b); ['On', 'Freq', 'Gain', 'Q', 'Slope'].forEach(k => { if (P.has ? P.has(b.id + k) : true) try { P.onChange(b.id + k, () => { applyBand(b); applyAuto(); if (P.get('listen') === b.id) applyListen(); }); } catch (e) {} }); });
      // initial values are written directly (an offline render is right from sample 0); later changes glide
      applyAuto(); applyListen(); egain.gain.value = P.get('listen') === 'off' ? 1 : 0; lgain.gain.value = 1 - egain.gain.value; initial = false;
      P.onChange('autoGain', applyAuto); P.onChange('listen', applyListen);
      // drag a node: x = frequency, y = gain, wheel = Q (one UI hook, validated)
      ctx.onUI('band_drag', { type: 'object', required: ['band'] }, (p) => {
        const b = BANDS.find(x => x.id === p.band); if (!b) return ctx.fault('RUNTIME_002', 'unknown band');
        const set = {}; if (typeof p.freq === 'number') set[b.id + 'Freq'] = p.freq; if (typeof p.gain === 'number' && b.type !== 'highpass' && b.type !== 'lowpass') set[b.id + 'Gain'] = p.gain; if (typeof p.q === 'number' && b.type === 'peaking') set[b.id + 'Q'] = p.q;
        if (!P.get(b.id + 'On')) set[b.id + 'On'] = true;
        P.setMany(set); ctx.syncUI();
      });
      const RF = new Float32Array(300); for (let i = 0; i < 300; i++) RF[i] = 20 * Math.pow(1000, i / 299);
      ctx.onUI('want_response', null, () => { const m = response(RF); const db = Array.from(m, v => +(20 * Math.log10(Math.max(1e-6, v))).toFixed(2)); ctx.emitUI('response', { db }); });
      ctx.stateExtra = () => ({ bands: BANDS });
      ctx.internals = { sections, chain, auto, lgain, egain, lbp };
      return { unmount() {} };
    },
  });
})();

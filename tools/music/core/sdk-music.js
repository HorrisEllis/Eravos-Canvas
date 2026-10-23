/* ERAVOS music domain — sdk-music.js
 * Extends the domain-free OrganismSDK with everything music engines use: note / midi / theory / transport
 * contracts, audio + modulation hook builders, DSP helpers, worklet loading, the STD.fx shell, and a ctx
 * extension (ctx.ac, ctx.bpm, ctx.key, modBus, atAudioTime, onNote/onMidi/onKey/onTick/onPlay/onStop/onBpm, MIDI arm). */
(function (global) {
  'use strict';
  const SDK = global.OrganismSDK;
  const NOTE_SCHEMA = {
    type: 'object', required: ['target', 'note', 'velocity', 'time'],
    properties: {
      target: { type: 'string' }, note: { type: 'integer', minimum: 0, maximum: 127 },
      velocity: { type: 'number', minimum: 0, maximum: 1 }, time: { type: 'number' },
      duration: { type: 'number', minimum: 0 }, accent: { type: 'boolean' }, slide: { type: 'boolean' },
      freq: { type: 'number', minimum: 0 }, // xen: an exact (often irrational) frequency; `note` stays the nearest 12-TET key
      params: { type: 'object' },   // 3.53 per-note settings: { knob: value } for this note only (see ctx.onNote)
      bend: { type: 'object' },     // 3.56 the note's pitch curve: { from, to (semitones), shape, at (0…0.95 of the note) } (see PITCH WHEEL)
    },
  };
  const MIDI_SCHEMA = { type: 'object', required: ['note', 'velocity', 'on'], properties: { note: { type: 'integer', minimum: 0, maximum: 127 }, velocity: { type: 'number', minimum: 0, maximum: 1 }, on: { type: 'boolean' } } };
  const THEORY_SCHEMA = { type: 'object', required: ['root', 'scale'], properties: { root: { type: 'integer', minimum: 0, maximum: 11 }, scale: { type: 'string' } } };
  const TICK_SCHEMA = { type: 'object', required: ['step16', 'time'], properties: { step16: { type: 'integer' }, time: { type: 'number' } } };
  const MUSIC_STD = {
    note_in: (hook_id) => ({ hook_id, hook_type: 'receiver', direction: 'in', wire_type: 'event_bus', event_type: 'note:trigger', contract_version: '2.0.0', schema: NOTE_SCHEMA, failure_mode: 'RUNTIME_002', intent: 'play notes addressed to this instance' }),
    note_out: (hook_id) => ({ hook_id, hook_type: 'emitter', direction: 'out', wire_type: 'event_bus', event_type: 'note:trigger', contract_version: '2.0.0', schema: NOTE_SCHEMA, failure_mode: 'RUNTIME_002', intent: 'emit notes to a target instrument' }),
    midi_in: (hook_id) => ({ hook_id, hook_type: 'receiver', direction: 'in', wire_type: 'event_bus', event_type: 'midi:note', contract_version: '1.0.0', schema: MIDI_SCHEMA, failure_mode: 'RUNTIME_002', intent: 'play from armed MIDI input' }),
    theory_in: (hook_id) => ({ hook_id, hook_type: 'receiver', direction: 'in', wire_type: 'event_bus', event_type: 'theory:key-change', contract_version: '1.0.0', schema: THEORY_SCHEMA, failure_mode: 'RUNTIME_002', intent: 'follow song key/scale' }),
    transport_in: (hook_id) => ({ hook_id, hook_type: 'receiver', direction: 'in', wire_type: 'event_bus', event_type: 'transport:tick|transport:play|transport:stop', contract_version: '1.0.0', schema: TICK_SCHEMA, failure_mode: 'RUNTIME_002', intent: 'follow the master transport' }),
    audio_out: (hook_id, port) => ({ hook_id, hook_type: 'emitter', direction: 'out', wire_type: 'audio', port: port || 'out', event_type: 'audio', contract_version: '2.0.0', schema: {}, failure_mode: 'PORT_001', intent: 'audio signal out (default route master)' }),
    audio_in: (hook_id, port, tap) => ({ hook_id, hook_type: 'receiver', direction: 'in', wire_type: 'audio', port: port || 'in', tap: !!tap, event_type: 'audio', contract_version: '2.0.0', schema: {}, failure_mode: 'PORT_001', intent: 'audio signal in' }),
    mod_in: (hook_id, key) => ({ hook_id, hook_type: 'receiver', direction: 'in', wire_type: 'modulation', port: 'mod.' + key, mod_key: key, event_type: 'modulation', contract_version: '2.0.0', schema: {}, failure_mode: 'PORT_001', intent: 'modulate ' + key }),
    mod_out: (hook_id, port) => ({ hook_id, hook_type: 'emitter', direction: 'out', wire_type: 'modulation', port: port || 'out', event_type: 'modulation', contract_version: '2.0.0', schema: {}, failure_mode: 'PORT_001', intent: 'control signal out' }),
  };
  const STD_FX_CONFIG = [
    { key: 'mix', type: 'number', default: 1, min: 0, max: 1, step: 0.01, label: 'Mix', group: 'IO' },
    { key: 'inGain', type: 'number', default: 0, min: -24, max: 24, step: 0.1, unit: 'dB', label: 'In', group: 'IO' },
    { key: 'outGain', type: 'number', default: 0, min: -24, max: 24, step: 0.1, unit: 'dB', label: 'Out', group: 'IO' },
    { key: 'bypass', type: 'boolean', default: false, label: 'Bypass', group: 'IO' },
  ];

  // ---------------------------------------------------------------- DSP helpers (shared; engines stay novel)
  const noiseCache = new WeakMap();
  const dsp = {
    // 3.39 a WaveShaper's oversampling delays its output by a fixed number of samples (Chromium's resampler, measured:
    // none 0 · 2x 128 · 4x 192 — at every sample rate). Parallel paths and note timing must account for it.
    OS_SAMPLES: { none: 0, '2x': 128, '4x': 192 },
    osLatency(ac, mode) { return (dsp.OS_SAMPLES[mode] || 0) / ac.sampleRate; },
    mulberry32(seed) {
      let a = seed >>> 0;
      return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    },
    noise(ac, seconds, color) {
      let m = noiseCache.get(ac); if (!m) { m = {}; noiseCache.set(ac, m); }
      const k = (color || 'white') + (seconds || 2);
      if (m[k]) return m[k];
      const len = Math.floor(ac.sampleRate * (seconds || 2)), b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
      const r = dsp.mulberry32(1234 + len);
      let b0 = 0, b1 = 0, b2 = 0, last = 0;
      for (let i = 0; i < len; i++) {
        const w = r() * 2 - 1;
        if (color === 'pink') { b0 = 0.99765 * b0 + w * 0.0990460; b1 = 0.96300 * b1 + w * 0.2965164; b2 = 0.57000 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2; }
        else if (color === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
        else d[i] = w;
      }
      m[k] = b; return b;
    },
    noiseSource(ac, color, loop) { const s = ac.createBufferSource(); s.buffer = dsp.noise(ac, 2, color); s.loop = loop !== false; return s; },
    curve(kind, amount, n) {
      n = n || 4096; const c = new Float32Array(n); const k = amount === undefined ? 0.5 : amount;
      for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 2 - 1;
        let y;
        switch (kind) {
          case 'hard': { const g = 1 + k * 20; y = Math.max(-1, Math.min(1, x * g)); break; }
          case 'tube': { const g = 1 + k * 10; const xa = x * g; y = xa >= 0 ? 1 - Math.exp(-xa) : -(1 - Math.exp(xa * 1.4)) / 1.1; break; }
          case 'asym': { const g = 1 + k * 12; y = Math.tanh(x * g + k * 0.3) - Math.tanh(k * 0.3); break; }
          case 'fold': { const g = 1 + k * 8; y = Math.sin(x * g * Math.PI / 2); break; }
          case 'sinfold': { const folds = k; y = Math.sin(x * (1 + folds) * Math.PI / 2); break; }
          // 'tape': unity gain for small signals (slope 1 at 0) that rounds peaks off toward 1/g — the curve for anything
          // INSIDE a feedback loop: loop gain = the feedback knob exactly, so a loop below 1 always dies away (3.28)
          case 'tape': { const g = 1 + k * 4; y = Math.tanh(x * g) / g; break; }
          case 'abs': y = Math.abs(x); break;
          case 'crush': { const lv = Math.pow(2, Math.max(1, Math.round(k))) / 2; y = Math.round(x * lv) / lv; break; }
          default: { const g = 1 + k * 15; y = Math.tanh(x * g) / Math.tanh(g); }
        }
        c[i] = y;
      }
      return c;
    },
    curveRms(curve) { // RMS of a full-scale sine through the curve → auto-level
      let s = 0; const N = 512;
      for (let i = 0; i < N; i++) { const x = Math.sin(2 * Math.PI * i / N); const idx = Math.round((x + 1) / 2 * (curve.length - 1)); s += curve[idx] * curve[idx]; }
      return Math.sqrt(s / N);
    },
    dbToGain: (db) => Math.pow(10, db / 20),
    gainToDb: (g) => 20 * Math.log10(Math.max(1e-12, g)),
    setSmooth(param, v, ac, tau) { const t = ac.currentTime; try { param.cancelScheduledValues(t); param.setTargetAtTime(v, t, tau || 0.012); } catch (e) { param.value = v; } },
    adsr(param, t, o) { // o: {a,d,s,peak,base}
      const base = o.base || 0, peak = o.peak === undefined ? 1 : o.peak;
      param.cancelScheduledValues(t); param.setValueAtTime(base, t);
      param.linearRampToValueAtTime(peak, t + Math.max(0.001, o.a));
      param.setTargetAtTime(base + (peak - base) * o.s, t + Math.max(0.001, o.a), Math.max(0.002, o.d) / 3);
    },
    release(param, t, r, base) {
      if (typeof param.cancelAndHoldAtTime === 'function') param.cancelAndHoldAtTime(t); else param.cancelScheduledValues(t);
      param.setTargetAtTime(base || 0, t, Math.max(0.002, r) / 4);
    },
    equalPower(mix) { return { dry: Math.cos(mix * Math.PI / 2), wet: Math.sin(mix * Math.PI / 2) }; },
    hann(n) { const w = new Float32Array(n); for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1)); return w; },
    fft(re, im) { // in-place radix-2
      const n = re.length;
      for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
      for (let len = 2; len <= n; len <<= 1) {
        const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
        for (let i = 0; i < n; i += len) {
          let cr = 1, ci = 0;
          for (let j = 0; j < len / 2; j++) {
            const a = i + j, b = a + len / 2;
            const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
            re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
            const ncr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = ncr;
          }
        }
      }
    },
    peaks(buffer, n) {
      n = n || 1024; const out = new Float32Array(n * 2); const ch = buffer.numberOfChannels;
      const len = buffer.length, per = Math.max(1, Math.floor(len / n));
      const datas = []; for (let c = 0; c < ch; c++) datas.push(buffer.getChannelData(c));
      for (let i = 0; i < n; i++) {
        let mn = 0, mx = 0; const s = i * per, e = Math.min(len, s + per);
        for (let j = s; j < e; j++) for (let c = 0; c < ch; c++) { const v = datas[c][j]; if (v < mn) mn = v; if (v > mx) mx = v; }
        out[i * 2] = mn; out[i * 2 + 1] = mx;
      }
      return Array.from(out);
    },
    reverseBuffer(ac, buf) {
      const r = ac.createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate);
      for (let c = 0; c < buf.numberOfChannels; c++) { const s = buf.getChannelData(c), d = r.getChannelData(c); for (let i = 0, n = s.length; i < n; i++) d[i] = s[n - 1 - i]; }
      return r;
    },
    onsets(buffer, sensitivity) { // spectral-flux onsets with adaptive threshold → seconds
      const sr = buffer.sampleRate, hop = 512, N = 1024, d = buffer.getChannelData(0);
      const frames = Math.max(0, Math.floor((d.length - N) / hop));
      const win = dsp.hann(N), prev = new Float32Array(N / 2), flux = new Float32Array(frames);
      const re = new Float32Array(N), im = new Float32Array(N);
      for (let f = 0; f < frames; f++) {
        for (let i = 0; i < N; i++) { re[i] = d[f * hop + i] * win[i]; im[i] = 0; }
        dsp.fft(re, im); let s = 0;
        for (let k = 0; k < N / 2; k++) { const m = Math.sqrt(re[k] * re[k] + im[k] * im[k]); const df = m - prev[k]; if (df > 0) s += df; prev[k] = m; }
        flux[f] = s;
      }
      const out = []; const w = 8; const mult = 1.2 + (1 - (sensitivity === undefined ? 0.4 : sensitivity)) * 2.5;
      let mx = 0; for (let i = 0; i < frames; i++) mx = Math.max(mx, flux[i]);
      let lastOn = -99;
      for (let f = 1; f < frames - 1; f++) {
        let mean = 0, c = 0; for (let j = Math.max(0, f - w); j <= Math.min(frames - 1, f + w); j++) { mean += flux[j]; c++; } mean /= c;
        if (flux[f] > mean * mult && flux[f] >= flux[f - 1] && flux[f] >= flux[f + 1] && flux[f] > mx * 0.05 && f - lastOn > 4) { out.push((f * hop) / sr); lastOn = f; }
      }
      return out;
    },
  };

  // Shared pitch-shift worklet (eravos.fx-pitch algorithm; reused internally by master-fx shimmer — amendment A-5)
  // two crossfaded read heads over a circular buffer; Hann windows sum to 1; ratio = 2^(st/12); latency ≈ window/2
  dsp.PITCH_WORKLET = `
class EravosPitch extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [{ name: 'ratio', defaultValue: 1, minValue: 0.125, maxValue: 8 }, { name: 'window', defaultValue: 0.05, minValue: 0.01, maxValue: 0.2 }]; }
  constructor() { super(); this.N = 1 << 17; this.M = this.N - 1; this.buf = [new Float32Array(this.N), new Float32Array(this.N)]; this.w = 0; this.ph = 0; }
  read(b, pos) { const i = Math.floor(pos), f = pos - i; return b[i & this.M] * (1 - f) + b[(i + 1) & this.M] * f; }
  process(inputs, outputs, params) {
    const inp = inputs[0], out = outputs[0], n = out[0].length, R = params.ratio, W = params.window;
    for (let i = 0; i < n; i++) {
      const r = R.length > 1 ? R[i] : R[0], win = (W.length > 1 ? W[i] : W[0]) * sampleRate;
      for (let c = 0; c < 2; c++) { const src = inp[c] || inp[0]; this.buf[c][this.w] = src ? src[i] : 0; }
      this.ph += (1 - r) / win; this.ph -= Math.floor(this.ph);
      const p1 = this.ph, p2 = (this.ph + 0.5) % 1;
      const g1 = Math.sin(Math.PI * p1) ** 2, g2 = Math.sin(Math.PI * p2) ** 2;
      for (let c = 0; c < out.length; c++) {
        const b = this.buf[Math.min(c, 1)];
        out[c][i] = this.read(b, this.w - 2 - p1 * win) * g1 + this.read(b, this.w - 2 - p2 * win) * g2;
      }
      this.w = (this.w + 1) & this.M;
    }
    return true;
  }
}
registerProcessor('eravos-pitch', EravosPitch);`;

  // ---------------------------------------------------------------- AudioWorklet from inline source (F-06: works on file://)
  const workletCache = new WeakMap();
  function loadWorklet(ac, name, source) {
    if (!ac.audioWorklet) return Promise.reject(new Error('AudioWorklet unsupported'));
    let m = workletCache.get(ac); if (!m) { m = {}; workletCache.set(ac, m); }
    // 3.37 (QA RCA: two different processors were both registered as 'eravos-pitch' — whichever loaded first won and the
    // other tool silently got the wrong parameters): one name = one source; a second source under a taken name is refused
    const srcs = m.__src || (m.__src = {});
    if (srcs[name] !== undefined && srcs[name] !== source) return Promise.reject(new Error(`audio processor name "${name}" is already taken by different code`));
    srcs[name] = source;
    if (m[name]) return m[name];
    // Blob URL first; file:// (opaque origin) rejects blob worklets in Chromium → data: URL fallback
    const url = URL.createObjectURL(new Blob([source], { type: 'application/javascript' }));
    const dataUrl = 'data:application/javascript;charset=utf-8,' + encodeURIComponent(source);
    m[name] = ac.audioWorklet.addModule(url)
      .catch(() => ac.audioWorklet.addModule(dataUrl))
      .then(() => { URL.revokeObjectURL(url); return true; })
      .catch((e) => { delete m[name]; delete srcs[name]; throw e; });
    return m[name];
  }

  // ---------------------------------------------------------------- STD.fx contract (all eravos.fx-* inherit)
  // in → inputGain → [DRY] + [WET: algorithm] → equal-power mix → outputGain → out ; bypass ramped 10 ms
  function fxHooks(extra) {
    return [
      Object.assign(MUSIC_STD.audio_in('fx.hook.audio_in', 'in'), { intent: 'signal to process' }),
      MUSIC_STD.audio_out('fx.hook.audio_out', 'out'),
      MUSIC_STD.mod_in('fx.hook.mod_mix', 'mix'),
    ].concat(extra || []);
  }
  function fxShell(ctx, o) {
    o = o || {};
    const ac = ctx.ac, P = ctx.params;
    const inp = ac.createGain(), inGain = ac.createGain(), dry = ac.createGain(), wet = ac.createGain(), sum = ac.createGain(), outGain = ac.createGain();
    const wetIn = ac.createGain(), wetOut = ac.createGain();
    inp.channelCount = 2; inp.channelCountMode = 'explicit'; inp.channelInterpretation = 'speakers';
    inp.connect(inGain); inGain.connect(dry); dry.connect(sum); inGain.connect(wetIn); wetOut.connect(wet); wet.connect(sum); sum.connect(outGain);
    // 3.39 latency alignment: when the wet chain is late (oversampled shaper, pitch window), a blended dry is delayed to match —
    // otherwise dry + wet comb-filter (2.67 ms → notches at 375 Hz, 1.1 kHz …). At mix 0 / bypass the direct dry is used (exact null).
    const dryAl = ac.createDelay(0.25), dryAlG = ac.createGain(); dryAlG.gain.value = 0; inGain.connect(dryAl); dryAl.connect(dryAlG); dryAlG.connect(sum);
    ctx.port('in', { kind: 'audio', direction: 'in', node: inp, label: 'in' });
    ctx.port('out', { kind: 'audio', direction: 'out', node: outGain, label: 'out' });
    const mixMod = ctx.modBus('mix', { min: 0, max: 1 }); const neg = ac.createGain(); neg.gain.value = -1;
    mixMod.connect(wet.gain); mixMod.connect(neg); neg.connect(dry.gain);
    [inp, inGain, dry, wet, sum, outGain, wetIn, wetOut, neg, dryAl, dryAlG].forEach(n => ctx.track(n));
    let latency = 0, aligned = false, own = 0, extra = 0;
    function apply() {
      const sec = own + extra; if (sec === latency) return; latency = sec;
      dryAl.delayTime.setValueAtTime(Math.min(0.25, sec), ac.currentTime); levels(false);
      ctx.K.ledger.write('latency_reported', { instance_id: ctx.id, organism_id: ctx.descriptor.id, latency_sec: sec }); ctx.emitUI('latency', { sec });
      if (ctx.K.audio && ctx.K.audio.setLatency) ctx.K.audio.setLatency(ctx.id, sec);
    }
    function route(on) {   // the mix modulation follows whichever dry path is live
      if (on === aligned) return; aligned = on;
      try { neg.disconnect(); } catch (e) {} neg.connect(on ? dryAlG.gain : dry.gain);
    }
    function levels(ramp) {
      const t = ac.currentTime, m = o.fixedMix !== undefined ? o.fixedMix : P.get('mix');
      const bp = P.get('bypass');
      const d = bp ? 1 : Math.cos(m * Math.PI / 2), w = bp ? 0 : Math.sin(m * Math.PI / 2), al = latency > 0 && !bp && m > 0;
      route(al);
      [[dry.gain, al ? 0 : d], [dryAlG.gain, al ? d : 0], [wet.gain, w]].forEach(([g, v]) => { g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(v, t + (ramp === false ? 0.0005 : 0.01)); });
      inGain.gain.setTargetAtTime(dsp.dbToGain(P.get('inGain')), t, 0.01);
      outGain.gain.setTargetAtTime(dsp.dbToGain(P.get('outGain')), t, 0.01);
    }
    // exact initial values (null test at mix 0 must be exact from sample 0)
    { const m = o.fixedMix !== undefined ? o.fixedMix : P.get('mix'); dry.gain.value = Math.cos(m * Math.PI / 2); wet.gain.value = Math.sin(m * Math.PI / 2); inGain.gain.value = dsp.dbToGain(P.get('inGain')); outGain.gain.value = dsp.dbToGain(P.get('outGain')); }
    ['mix', 'bypass', 'inGain', 'outGain'].forEach(k => P.onChange(k, () => levels()));
    return {
      inp, wetIn, wetOut, dry, wet, outGain, levels,
      // own: this tool's wet chain · extra: the mods inside its wet path (3.43) — the blended dry waits for both
      setLatency(sec) { own = sec; apply(); },
      addLatency(sec) { extra = sec; apply(); },
      get latency() { return latency; },
    };
  }


  // 3.42 mods: a tool with an audio slot sends into its mods and hears them back — it needs both audio permissions
  if (global.OrganismFactory) global.OrganismFactory.onDefine((d) => {
    if (!(d.slots || []).some(s => s.wire_type === 'audio')) return;
    d.permissions = d.permissions || []; ['audio_in', 'audio_out'].forEach(p => { if (!d.permissions.includes(p)) d.permissions.push(p); });
  });

  // 3.49 MOTION CORE (eravos.phase49-map P49.1, D-49.1): every knob can be moved by an LFO, an Envelope, Wub Rate, an XY Pad… —
  // James, 2026-10-22: "Motion core: any knob can be moved by an LFO or envelope". Each settable knob of a music tool that has no
  // mod input of its own gets one: hook knob.<key>, off the dot rail (the knob's right-click menu wires it). Knobs that already
  // have a mod input keep their audio-rate path. Tools without audio permission get none (the kernel allows modulation ports only
  // for audio tools) — tests/p49-motion.test.js lists them.
  const KNOB_TYPES = new Set(['number', 'integer', 'enum', 'boolean']);
  function knobKeys(d) {
    const own = new Set((d.hooks || []).filter(h => h.wire_type === 'modulation' && h.direction === 'in' && h.mod_key).map(h => h.mod_key));
    const ranged = (c) => c.type === 'boolean' || (c.type === 'enum' ? (c.options || []).length > 1 : typeof c.min === 'number' && typeof c.max === 'number' && c.max > c.min);
    return (d.config || []).filter(c => KNOB_TYPES.has(c.type) && !c.hidden && !c.settingsOnly && c.motion !== false && !own.has(c.key) && ranged(c))
      .map(c => c.key);
  }
  if (global.OrganismFactory) global.OrganismFactory.onDefine((d) => {
    if (d.domain !== 'music' || d._knobInputs) return;
    const perms = d.permissions || [];
    if (!perms.includes('audio_out') && !perms.includes('audio_in')) { d._knobInputs = []; return; }
    const keys = knobKeys(d), have = new Set((d.hooks || []).map(h => h.hook_id));
    d._knobInputs = keys.filter(k => !have.has('knob.' + k));
    d._knobInputs.forEach(k => { const c = d.config.find(x => x.key === k); d.hooks.push(Object.assign(MUSIC_STD.mod_in('knob.' + k, 'knob.' + k), { rail: false, knob: k, intent: 'move ' + (c.label || k) })); });
    // 3.57 every instrument (plays notes, makes sound): CURVE OUT — its pitch curve (bends, Pitch lane, oscillation) as a control
    // signal for any knob — and BEND IN — another instrument's curve bends this one. Interconnected only when wired.
    const plays = (d.hooks || []).some(h => h.direction === 'in' && h.event_type === 'note:trigger');
    if (plays && perms.includes('audio_out') && !have.has('curve.out')) {
      d.hooks.push(Object.assign(MUSIC_STD.mod_out('curve.out', 'curve'), { intent: 'this track’s pitch curve — bends, Pitch lane, oscillation — to move any knob' }));
      d.hooks.push(Object.assign(MUSIC_STD.mod_in('bend.in', 'bendin'), { intent: 'bend with another instrument’s curve (wire its curve out here)' }));
    }
  });

  // 3.56 PITCH WHEEL — "curve the notes: the pitch, smoother transitions, bigger and deeper drops". Every music tool gets a
  // wheel (a ConstantSource in cents) that every oscillator and sample it plays follows (→ detune). A note with a bend
  // moves the wheel over its length; the next note without one sets it back to 0 at its start (so a dive rings down
  // through the release). Like a hardware pitch wheel it bends the whole tool — a bass line, a lead, a drop.
  // No tool is rewritten for it: the sources a tool creates while ITS code runs (engine setup, its note / tick / ui /
  // param / timer handlers) are hooked at start() and join the wheel on the tool's first bend. Slow oscillators
  // (0 < f < 20 Hz: LFOs) are left alone.
  let CUR = null;
  const withTool = (c, fn) => { const prev = CUR; CUR = c; try { return fn(); } finally { CUR = prev; } };
  (function hookSources() {
    const B = global.BaseAudioContext || global.AudioContext; if (!B || !B.prototype || B.prototype.__eravosWheel) return;
    Object.defineProperty(B.prototype, '__eravosWheel', { value: true });
    ['createOscillator', 'createBufferSource'].forEach(m => { const orig = B.prototype[m]; if (typeof orig !== 'function') return;
      B.prototype[m] = function () { const n = orig.apply(this, arguments), c = CUR; if (c && c.ac === this && c._wheelHook) c._wheelHook(n); return n; }; });
  })();
  const BEND_SHAPES = { smooth: (x) => x * x * (3 - 2 * x), linear: (x) => x, early: (x) => 1 - Math.pow(1 - x, 3), late: (x) => x * x * x };
  const BEND_MAX = 48;

  SDK.extend({
    id: 'music',
    std: MUSIC_STD,
    uiHooks: ['audition', 'audition_off', 'midi_arm'],
    statics: { STD_FX_CONFIG, fxHooks, fxShell, NOTE_SCHEMA, MIDI_SCHEMA, THEORY_SCHEMA, TICK_SCHEMA, dsp, loadWorklet },
    ctx(ctx, api) {
      const K = ctx.K;
      if (!K.audio) return; // this universe has no music domain installed
      const ac = K.audio.boot();
      let midiArmed = false;
      const RATES = { '¼': 0.25, '½': 0.5, '¾': 0.75, '1': 1, '1½': 1.5, '2': 2, '3': 3, '4': 4 };
      const hasTempo = () => (ctx.descriptor.config || []).some(c => c.key === 'tempoX');
      function tempoRate() {
        if (!ctx.params || !hasTempo()) return 1;
        const x = ctx.params.get('tempoX'); if (x === 'own') { const b = +ctx.params.get('tempoBpm'); return b > 0 && K.music.bpm > 0 ? b / K.music.bpm : 1; }
        return RATES[x] || 1;
      }
      ctx.tempoRate = tempoRate;
      Object.defineProperties(ctx, {
        ac: { value: ac, enumerable: true },
        bpm: { get: () => K.music.bpm * tempoRate(), enumerable: true }, // 3.34: this tool's own tempo (Speed)
        key: { get: () => K.music.key, enumerable: true },
        midiArmed: { get: () => midiArmed, enumerable: true },
      });
      ctx.dsp = dsp;
      ctx.now = () => ac.currentTime;
      // 3.48 (P48.10): who this instance's hook is wired to — a generator sends its notes to exactly the tools wired from its
      // note out (any drum, bass or poly tool: mixed and matched), and listens only to the parts wired into its event ins
      ctx.wiredOut = (hookId) => ctx.K.wires.list().filter(w => w.src.instanceId === ctx.id && w.src.hookId === hookId).map(w => w.dst.instanceId);
      ctx.wiredIn = (hookId) => ctx.K.wires.list().filter(w => w.dst.instanceId === ctx.id && w.dst.hookId === hookId).map(w => w.src.instanceId);
      // 3.49 knob inputs (P49.1): port mod.knob.<key>, range −1…1. Nothing runs until a wire arrives: then its source starts and the
      // knob is sampled ~60× a second → params.live(own value + signal × half the knob's range). Unwired → live(key, null): his value.
      const knobs = new Map();   // key → { cs, an, buf, c }
      // read from the hooks (the registry's copy of a descriptor carries hooks, not define-time extras — found 2026-10-22)
      (ctx.descriptor.hooks || []).filter(hk => hk.knob).map(hk => hk.knob).forEach(k => {
        const c = (ctx.descriptor.config || []).find(x => x.key === k); if (!c) return;
        const cs = ac.createConstantSource(); cs.offset.value = 0;
        try { ctx.port('mod.knob.' + k, { kind: 'param', direction: 'in', param: cs.offset, range: { min: -1, max: 1 }, label: c.label || k }); }
        catch (e) { K.fault('RUNTIME_003', { instance_id: ctx.id, organism_id: ctx.descriptor.id, message: `knob input ${k} could not open: ${e.message}` }); return; }   // §1.2 never silent
        knobs.set(k, { cs, an: null, buf: null, c, started: false });
      });
      function knobValue(c, base, m) {
        if (c.type === 'boolean') return ((base ? 1 : 0) + m) >= 0.5;
        if (c.type === 'enum') { const o = c.options, i = Math.max(0, o.findIndex(x => String(x) === String(base))); return o[Math.max(0, Math.min(o.length - 1, Math.round(i + m * (o.length - 1) / 2)))]; }
        let v = base + m * (c.max - c.min) / 2; v = Math.max(c.min, Math.min(c.max, v));
        if (c.type === 'integer') v = Math.round(v); else if (c.step) v = Math.round(v / c.step) * c.step;
        return +v.toFixed(6);
      }
      let knobTimer = null;
      const wiredKnobs = () => Array.from(knobs.keys()).filter(k => ctx.wiredIn('knob.' + k).length);
      function sampleKnobs() {
        if (!ctx.params) return;
        wiredKnobs().forEach(k => { const n = knobs.get(k); if (!n.an) return; n.an.getFloatTimeDomainData(n.buf); const m = n.buf[n.buf.length - 1] || 0; ctx.params.live(k, knobValue(n.c, ctx.params.base(k), m)); });
      }
      ctx.sampleKnobs = sampleKnobs;
      function knobWires() {
        const on = wiredKnobs();
        knobs.forEach((n, k) => {
          if (on.includes(k)) { if (!n.started) { n.an = ac.createAnalyser(); n.an.fftSize = 32; n.buf = new Float32Array(32); n.cs.connect(n.an); n.cs.start(); n.started = true; ctx.track(n.cs); } }
          else if (ctx.params && ctx.params.isLive(k)) ctx.params.live(k, null);
        });
        if (on.length && !knobTimer) knobTimer = ctx.interval(sampleKnobs, 16);
        else if (!on.length && knobTimer) { clearInterval(knobTimer); knobTimer = null; }
      }
      if (knobs.size) {
        const mine = (w) => w && w.dst && w.dst.instanceId === ctx.id && /^knob\./.test(w.dst.hookId);
        ctx.on('kernel:wire-registered', null, (w) => { if (mine(w)) knobWires(); });
        ctx.on('kernel:wire-removed', null, (w) => { if (mine(w)) knobWires(); });
      }
      ctx.modBus = function (key, range, opts2) {
        // shared ConstantSource summing bus → port 'mod.<key>' (kind param) — connect output to any number of AudioParams
        const cs = ac.createConstantSource(); cs.offset.value = 0; cs.start();
        ctx.track(cs);
        ctx.port('mod.' + key, { kind: 'param', direction: 'in', param: cs.offset, range, label: (opts2 && opts2.label) || key });
        return cs;
      };
      // 3.42 mods: an insert point — from → [the mods hosted in slot <id>, in order] → the returned node. Empty, it is a
      // straight wire (sample-exact, no latency); while mods are wired in (canvas/runtime/mods.js) the straight path closes.
      ctx.slot = function (id, from, o) {
        o = o || {};
        const send = ctx.track(ac.createGain()), ret = ctx.track(ac.createGain()), thru = ctx.track(ac.createGain()), out = ctx.track(ac.createGain());
        send.channelCount = ret.channelCount = 2; send.channelCountMode = ret.channelCountMode = 'explicit';
        from.connect(send); from.connect(thru); thru.connect(out); ret.connect(out);
        ctx.port('slot.' + id + '.send', { kind: 'audio', direction: 'out', node: send, internal: true, label: (o.label || id) + ' send' });
        ctx.port('slot.' + id + '.return', { kind: 'audio', direction: 'in', node: ret, label: (o.label || id) + ' return' });
        const hook = 'slot.' + id + '.return';
        let live = false;
        const sync = () => {
          const on = K.wires.list().some(w => w.dst.instanceId === ctx.id && w.dst.hookId === hook);
          if (on === live) return; live = on;
          const t = ac.currentTime; thru.gain.cancelScheduledValues(t); thru.gain.setValueAtTime(thru.gain.value, t); thru.gain.linearRampToValueAtTime(on ? 0 : 1, t + 0.005);
        };
        ['kernel:wire-registered', 'kernel:wire-removed'].forEach(tp => { const un = K.bus.subscribe(tp, (w) => { if (w && w.dst && w.dst.instanceId === ctx.id) sync(); }, ctx.id); ctx.onDispose(un); });
        // the delay of the mods in this slot (the sum along its chain) → o.onLatency (an fx host: its dry alignment)
        if (o.onLatency) {
          let last = -1;
          const chain = () => K.wires.list().filter(w => w.meta && w.meta.insert && w.meta.host === ctx.id && w.meta.slot === id).map(w => w.dst.instanceId).filter(x => x !== ctx.id);
          const relat = () => { const sec = chain().reduce((a, c) => a + (K.audio.latencyOf ? K.audio.latencyOf(c) : 0), 0); if (sec !== last) { last = sec; o.onLatency(sec); } };
          ['kernel:wire-registered', 'kernel:wire-removed', 'audio:latency'].forEach(tp => { const un = K.bus.subscribe(tp, () => relat(), ctx.id); ctx.onDispose(un); });
        }
        return out;
      };
      // run fn when AUDIO time reaches t (not wall-clock) — correct in offline renders and when ticks run ahead
      // P11.5 (gate P): is anything wired into this modulation input? Per-voice connections to a modulation bus turn
      // every oscillator / filter of that voice into per-sample (a-rate) work — so voices only connect when it is wired.
      ctx.modWired = function (key) {
        const hk = (ctx.descriptor.hooks || []).find(h => h.wire_type === 'modulation' && h.direction === 'in' && h.mod_key === key); if (!hk) return false;
        return K.wires.list().some(w => w.dst.instanceId === ctx.id && w.dst.hookId === hk.hook_id);
      };
      ctx.atAudioTime = function (t, fn) {
        const k = ac.createConstantSource(); k.offset.value = 0; const sink = ac.createGain(); sink.gain.value = 0;
        k.connect(sink); sink.connect(ac.destination);
        k.onended = () => { try { k.disconnect(); sink.disconnect(); } catch (e) {} if (!ctx.disposed) api.safe(() => withTool(ctx, fn)); };
        k.start(Math.max(ac.currentTime, t - 0.001)); k.stop(Math.max(ac.currentTime + 0.001, t));
        return k;
      };
      // P11.5 (gate P): a hard ceiling on simultaneous notes per tool — a runaway pattern can't swamp the audio thread.
      // Each tool still steals its own voices below this; this only stops pathological floods (counted, never silent).
      const NOTE_CEILING = 32; let sounding = []; ctx.notesDropped = 0;
      // ---- 3.56 the pitch wheel (see PITCH WHEEL above). A small bus, in cents, that every voice's detune follows:
      //   wheel (the notes' bends) + lane (a Timeline Pitch lane) + per-note oscillators + bend in (another tool's curve)
      // → bus → every voice · and → curve out (±1 = ± an octave) for anything wired to it.
      let bus = null, wheel = null, lane = null, bent = false, lastBendT = -1, everBent = false, curveIn = null;
      const isMusic = ctx.descriptor.domain === 'music', hasHook = (id) => (ctx.descriptor.hooks || []).some(h => h.hook_id === id);
      const busNode = () => { if (!bus) { bus = ac.createGain(); bus.gain.value = 1; ctx.track(bus); if (curveIn) bus.connect(curveIn); } return bus; };
      const csInto = () => { const c = ac.createConstantSource(); c.offset.value = 0; c.start(); ctx.track(c); c.connect(busNode()); return c; };
      const wheelNode = () => wheel || (wheel = csInto());
      const laneNode = () => lane || (lane = csInto());
      let wake = () => {};
      if (isMusic) {
        // started sources are only REMEMBERED; they join the bus on the tool's first bend (then every rate is set — an LFO
        // made at 440 Hz and slowed later is seen as the LFO it is), and later sources at start. No bends: nothing connected.
        const srcs = new Set();
        const join = (n) => { if (n._wheel) return; const fv = n.frequency ? n.frequency.value : 440;   // 0 = pitch driven by a signal (Wub Osc): a voice
          if (fv > 0 && fv < 20) return; try { busNode().connect(n.detune); n._wheel = true; } catch (e) {} };
        ctx._wheelHook = (n) => {
          if (!n.detune) return; const start = n.start;
          n.start = function () { srcs.add(n); n.addEventListener('ended', () => { srcs.delete(n); if (n._wheel && bus) { try { bus.disconnect(n.detune); } catch (e) {} } }); if (everBent) join(n); return start.apply(n, arguments); };
        };
        wake = () => { if (everBent) return; everBent = true; srcs.forEach(join); };
        CUR = ctx; Promise.resolve().then(() => { if (CUR === ctx) CUR = null; });   // the engine is built right after this, in the same task
        const wrap = (name) => { const f0 = ctx[name]; if (typeof f0 !== 'function') return; ctx[name] = function () { const a = Array.from(arguments).map(x => typeof x === 'function' ? function () { const args = arguments; return withTool(ctx, () => x.apply(this, args)); } : x); return f0.apply(ctx, a); }; };
        ['on', 'onUI', 'interval', 'timeout'].forEach(wrap);
        if (ctx.params && typeof ctx.params.onChange === 'function') { const oc = ctx.params.onChange; ctx.params.onChange = function (k, fn) { return oc.call(ctx.params, k, typeof fn === 'function' ? function () { const args = arguments; return withTool(ctx, () => fn.apply(this, args)); } : fn); }; }
        // 3.57 CURVE OUT — the tool's pitch curve as a control signal (±1 = ± an octave, held at ±1 beyond): wire it to any knob
        if (hasHook('curve.out')) {
          const sc = ac.createGain(), clip = ac.createWaveShaper(), out = ac.createGain(); sc.gain.value = 1 / 1200; clip.curve = new Float32Array([-1, 1]); sc.connect(clip); clip.connect(out);
          [sc, clip, out].forEach(n => ctx.track(n)); curveIn = sc; if (bus) bus.connect(sc);
          try { ctx.port('curve', { kind: 'mod', direction: 'out', node: out, label: 'curve' }); } catch (e) { K.fault('RUNTIME_003', { instance_id: ctx.id, organism_id: ctx.descriptor.id, message: 'curve out could not open: ' + e.message }); }
        }
        // 3.57 BEND IN — another tool's curve out bends this one (±1 → ± an octave): two synths that move as one
        if (hasHook('bend.in')) {
          const cs = ac.createConstantSource(), g = ac.createGain(); cs.offset.value = 0; g.gain.value = 1200; cs.connect(g); [cs, g].forEach(n => ctx.track(n)); let on = false;
          try { ctx.port('mod.bendin', { kind: 'param', direction: 'in', param: cs.offset, range: { min: -1, max: 1 }, label: 'bend in' }); } catch (e) { K.fault('RUNTIME_003', { instance_id: ctx.id, organism_id: ctx.descriptor.id, message: 'bend in could not open: ' + e.message }); }
          const check = () => { if (on || !ctx.wiredIn('bend.in').length) return; on = true; cs.start(); g.connect(busNode()); wake(); };
          const un = K.bus.subscribe('kernel:wire-registered', (w) => { if (w && w.dst && w.dst.instanceId === ctx.id) check(); }, ctx.id); ctx.onDispose(un); check();
        }
      }
      // per-note oscillation: { rate: '1/8' | Hz, rateTo, depth (st), shape, fade (0…1 of the note) } — an LFO on the bus for the note
      const RATE_DIV = { '4/1': 1 / 16, '2/1': 1 / 8, '1/1': 0.25, '1/2': 0.5, '1/2t': 0.75, '1/4': 1, '1/4t': 1.5, '1/8': 2, '1/8t': 3, '1/16': 4, '1/16t': 6, '1/32': 8 };
      const rateHz = (r) => typeof r === 'number' ? Math.max(0.05, Math.min(50, r)) : RATE_DIV[r] ? RATE_DIV[r] * ctx.bpm / 60 : 0;
      const cycles = {};
      function lfoCycle(shape) {   // 1 s = one cycle, so playbackRate is the rate in Hz
        if (cycles[shape]) return cycles[shape]; const n = ac.sampleRate, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
        for (let i = 0; i < n; i++) { const f = i / n; d[i] = shape === 'triangle' ? 1 - 4 * Math.abs(f - 0.5) : shape === 'saw' ? 2 * f - 1 : shape === 'square' ? (f < 0.5 ? 1 : -1) : Math.sin(2 * Math.PI * f); }
        return (cycles[shape] = b);
      }
      function oscNote(t, end, o) {
        const depth = Math.max(0, Math.min(24, +o.depth || 0)), hz = rateHz(o.rate); if (!depth || !hz) return;
        withTool(null, () => {   // its own LFO: never hooked onto the wheel it drives
          const g = ac.createGain(), fade = Math.max(0, Math.min(1, +o.fade || 0)) * (end - t), hz2 = o.rateTo !== undefined && o.rateTo !== null ? rateHz(o.rateTo) : hz;
          g.gain.setValueAtTime(fade > 0.005 ? 0 : depth * 100, t); if (fade > 0.005) g.gain.linearRampToValueAtTime(depth * 100, t + fade);
          let src;
          if (o.shape === 'random') {   // sample & hold: a new random step every cycle
            const steps = Math.max(1, Math.ceil((end - t) * Math.max(hz, hz2)) + 1), b = ac.createBuffer(1, Math.max(2, Math.ceil((end - t) * ac.sampleRate) + 2), ac.sampleRate), d = b.getChannelData(0), r = dsp.mulberry32((t * 1e4) | 0);
            let v = r() * 2 - 1, next = 0, k = 0; for (let i = 0; i < d.length; i++) { const tt = i / ac.sampleRate, hh = hz + (hz2 - hz) * Math.min(1, tt / Math.max(1e-3, end - t)); if (tt >= next) { v = r() * 2 - 1; next = tt + 1 / hh; k++; } d[i] = v; }
            src = ac.createBufferSource(); src.buffer = b; void steps;
          } else {   // one exact cycle (not band-limited: a slow LFO needs none, and a ±12 st square must reach ±12 st), looped at the rate
            src = ac.createBufferSource(); src.buffer = lfoCycle(o.shape); src.loop = true;
            src.playbackRate.setValueAtTime(hz, t); if (hz2 !== hz) src.playbackRate.linearRampToValueAtTime(hz2, end);
          }
          src.connect(g); g.connect(busNode()); src.start(t); src.stop(end + 0.02);
          src.onended = () => { try { src.disconnect(); g.disconnect(); } catch (e) {} };
        });
      }
      /** schedule the bus for a note from t to end: its bend (and oscillation), or back to 0 if an earlier note left it bent */
      function bendNote(t, end, b) {
        const from = b ? Math.max(-BEND_MAX, Math.min(BEND_MAX, +b.from || 0)) : 0, to = b ? Math.max(-BEND_MAX, Math.min(BEND_MAX, +b.to || 0)) : 0, osc = b && b.osc && +b.osc.depth > 0 ? b.osc : null, has = !!(from || to);
        if (osc) { wake(); oscNote(t, end, osc); }
        if (!has && (!bent || Math.abs(t - lastBendT) < 0.002)) return;   // a chord note without a bend never cancels its neighbour's
        const o = wheelNode().offset;
        try { if (o.cancelAndHoldAtTime) o.cancelAndHoldAtTime(t); else o.cancelScheduledValues(t); } catch (e) {}
        if (!has) { o.setValueAtTime(0, t); bent = false; return; }
        wake();
        const f = BEND_SHAPES[b.shape] || BEND_SHAPES.smooth, at = Math.max(0, Math.min(0.95, +b.at || 0)), t1 = t + (end - t) * at, dur = Math.max(0.01, end - t1), N = 24;
        o.setValueAtTime(from * 100, t); if (t1 > t) o.setValueAtTime(from * 100, t1);
        for (let i = 1; i <= N; i++) o.linearRampToValueAtTime((from + (to - from) * f(i / N)) * 100, t1 + dur * i / N);
        bent = true; lastBendT = t;
      }
      /** a Timeline Pitch lane: semitones at an audio time, glided (never stepped), null = back to 0 */
      function lanePitch(v, time) {
        const o = laneNode().offset, t = Math.max(ac.currentTime, typeof time === 'number' ? time : ac.currentTime);
        if (v === null) { o.cancelScheduledValues(ac.currentTime); o.setTargetAtTime(0, ac.currentTime, 0.02); return; }
        wake(); o.linearRampToValueAtTime(Math.max(-BEND_MAX, Math.min(BEND_MAX, +v || 0)) * 100, t);
      }
      ctx.bendNote = bendNote; ctx.lanePitch = lanePitch;
      Object.defineProperty(ctx, 'wheel', { get: () => wheel }); Object.defineProperty(ctx, 'wheelBus', { get: () => bus }); Object.defineProperty(ctx, 'laneWheel', { get: () => lane });
      // 3.53 PER-NOTE SETTINGS — a note may carry params { knob: value } (a Timeline note's own wobble, depth, cutoff …): the
      // knob takes that value for the note as a LIVE value (params.live: never saved, never undoable, the window's knob shows
      // it), then hands back to the knob's own setting when the note ends — unless a later note has taken the knob since.
      // WHEN it switches: if nothing of this tool is sounding, at once (the note is scheduled up to 0.1 s ahead, into silence),
      // so the voice is built with it; while an earlier note still sounds (legato, overlaps), at the note's start on the audio
      // clock, so the earlier note is not changed early. A knob wired to a mover (LFO …) keeps following its mover.
      const noteOwner = new Map(); let noteTok = 0;
      function noteParams(p, t, end, quiet) {
        const P = ctx.params; if (!P || !p.params || typeof p.params !== 'object') return;
        const has = new Set(P.schema().map(c => c.key)), keys = Object.keys(p.params).filter(k => has.has(k)); if (!keys.length) return;
        const tok = ++noteTok, take = () => keys.forEach(k => { P.live(k, p.params[k]); noteOwner.set(k, tok); });
        if (quiet || t <= ac.currentTime + 0.002) take(); else ctx.atAudioTime(t, take);
        ctx.atAudioTime(end, () => keys.forEach(k => { if (noteOwner.get(k) === tok) { noteOwner.delete(k); P.live(k, autoLive.has(k) ? autoLive.get(k) : null); } }));
      }
      // 3.53 AUTOMATION — a Timeline automation lane moves a knob: knob:live { target, key, value, time } holds the knob at that
      // value from that audio time on (value null = hand it back). A note with its own setting for the knob wins while it
      // plays, then the knob returns to where the automation has it.
      const autoLive = new Map();
      ctx.on('knob:live', { type: 'object', required: ['target', 'key'] }, (p) => {
        if (p.target === ctx.id && p.key === '@pitch') { if (isMusic) lanePitch(p.value === undefined ? null : p.value, p.time); return; }   // 3.57 a Pitch lane
        const P = ctx.params; if (p.target !== ctx.id || !P || !P.schema().some(c => c.key === p.key)) return;
        const v = p.value === undefined ? null : p.value;
        const set = () => { if (v === null) autoLive.delete(p.key); else autoLive.set(p.key, v); if (!noteOwner.has(p.key)) P.live(p.key, v); };
        if (v === null || typeof p.time !== 'number' || p.time <= ac.currentTime + 0.003) set(); else ctx.atAudioTime(p.time, set);
      });
      ctx.onSilence(() => { if (ctx.params) { noteOwner.forEach((_, k) => ctx.params.live(k, autoLive.has(k) ? autoLive.get(k) : null)); } noteOwner.clear(); noteTok++;
        if (wheel && bent) { const o = wheel.offset; o.cancelScheduledValues(0); o.setValueAtTime(0, ac.currentTime); bent = false; }
        if (lane) { lane.offset.cancelScheduledValues(0); lane.offset.setValueAtTime(0, ac.currentTime); } });
      ctx.onNote = (fn) => ctx.on('note:trigger', NOTE_SCHEMA, (p) => {
        if (!ctx.isTarget(p)) return;
        const t = typeof p.time === 'number' ? p.time : ac.currentTime, end = t + (typeof p.duration === 'number' ? p.duration : 1);
        sounding = sounding.filter(e => e > t);
        if (sounding.length >= NOTE_CEILING) { if (ctx.notesDropped++ % 64 === 0) K.fault('RUNTIME_005', { instance_id: ctx.id, message: `more than ${NOTE_CEILING} notes at once — extra notes skipped`, quiet: true }); return; }
        if (p.params) noteParams(p, t, end, !sounding.length);
        sounding.push(end);
        // 3.39 delay compensation: a tool whose whole voice runs through an oversampled shaper is late by ctx.latency
        // seconds — its notes start that much earlier so the SOUND lands on the beat (clamped to now for live input)
        if (ctx.latency > 0 && typeof p.time === 'number') { const t2 = Math.max(ac.currentTime, p.time - ctx.latency), d2 = typeof p.duration === 'number' ? p.duration + (p.time - t2) - ctx.latency : p.duration; p = Object.assign({}, p, { time: t2, duration: d2 }); }
        if (ctx._wheelHook) { const t3 = typeof p.time === 'number' ? p.time : ac.currentTime; bendNote(t3, t3 + (typeof p.duration === 'number' ? p.duration : 1), p.bend); }
        if (ctx.wake) ctx.wake();   // 3.62: plugged back in before the note sounds
        withTool(ctx, () => fn(p));
      });
      ctx.onMidi = (fn) => ctx.on('midi:note', MIDI_SCHEMA, (p) => { if (midiArmed) { if (ctx.wake) ctx.wake(); withTool(ctx, () => fn(p)); } });
      ctx.onKey = (fn) => ctx.on('theory:key-change', THEORY_SCHEMA, fn);
      // 3.34 speed per tool: the master's 16ths resampled to this tool's rate — sample-accurate (tick times are audio
      // times), phase-locked to the song position (tool step = master step × rate), resynced on any jump (play, loop, seek)
      ctx.onTick = (fn) => {
        let phase = null, n = 0, last = null;
        return ctx.on('transport:tick', TICK_SCHEMA, (t) => {
          const r = tempoRate();
          if (r === 1) { phase = null; last = t.step16; return fn(t); }
          if (phase === null || last === null || t.step16 !== last + 1) { phase = t.step16 * r; n = Math.ceil(phase - 1e-9); }
          last = t.step16;
          const next = phase + r, sd = t.stepDur / r;
          while (n < next - 1e-9) {
            const s16 = n, time = t.time + ((n - phase) / r) * t.stepDur;
            fn(Object.assign({}, t, { step16: s16, time, stepDur: sd, bpm: t.bpm * r, bar: Math.floor(s16 / 16) + 1, beat: Math.floor((s16 % 16) / 4) + 1, sixteenth: (s16 % 4) + 1, rate: r }));
            n++;
          }
          phase = next;
        });
      };
      ctx.onPlay = (fn) => ctx.on('transport:play', null, fn);
      ctx.onStop = (fn) => ctx.on('transport:stop', null, fn);
      // 3.28 stop contract: the transport's Stop is a soft silence for every music tool (latches end, endless loops
      // fade; natural tails ring). Subscribed on the bus directly so it reaches tools with no transport hook too.
      { const un = K.bus.subscribe('transport:stop', (p) => ctx.silenceNow({ hard: false, reason: 'stop', time: p && typeof p.time === 'number' ? p.time : null }), ctx.id); ctx.onDispose(un); }
      ctx.onSilence((p) => { if (ctx.allNotesOff) ctx.allNotesOff(p); });
      const bpmFns = [];
      ctx.onBpm = (fn) => { bpmFns.push(fn); return ctx.on('transport:bpm', { type: 'object', required: ['bpm'] }, (p) => fn(p.bpm * tempoRate())); };
      if (hasTempo()) ['tempoX', 'tempoBpm'].forEach(k => ctx.params.onChange(k, () => bpmFns.forEach(fn => api.safe(() => fn(ctx.bpm)))));
      ctx.loadWorklet = (name, src) => loadWorklet(ac, name, src);
      // 3.62 SLEEP — "can you optimize performance?" Measured (specs/eravos.performance.spec, addendum 3.62): a SILENT Gothic Organ costs
      // 17.8 % of a core, Pad Forge 13.7 %, Embodiment Lab 10.4 %, Wobble Bass 7.3 % — their reverbs, chorus LFOs and worklets never stop.
      // Unplugged from the output they cost ≈ 0 (Chrome only renders what reaches the speakers). A tool that can say when it is silent
      // (ctx.sleepWhen(() => no voices sounding)) is unplugged once it has been silent for its whole tail (port.tail, its longest
      // reverb) — so nothing audible is cut — and plugged back in by any note, MIDI note or audition before that sound starts
      // (ctx.wake(): the SDK calls it on every note; a tool calls it where it makes a voice, so previews and auditions wake it too).
      // Offline renders (tests, measurements) keep every tool awake unless K.audio.sleepOffline is set.
      let asleep = false, quietSince = null, silentFn = null;
      const outs = () => (K.ports ? K.ports.list(ctx.id) : []).filter(p => p.kind === 'audio' && p.direction === 'out' && p.src && p.head);
      ctx.wake = () => { quietSince = null; if (!asleep) return; asleep = false; outs().forEach(p => { try { p.src.connect(p.head); } catch (e) {} }); };
      ctx.sleepCheck = () => {
        if (!silentFn || asleep || ctx.disposed) return asleep;
        if (!silentFn()) { quietSince = null; return false; }
        const now = ac.currentTime; if (quietSince === null) quietSince = now;
        const ps = outs(), tail = Math.max(1, ...ps.map(p => +p.tail || 0)) + 0.5;
        if (ps.length && now - quietSince >= tail) { asleep = true; ps.forEach(p => { try { p.src.disconnect(p.head); } catch (e) {} }); }
        return asleep;
      };
      Object.defineProperty(ctx, 'asleep', { get: () => asleep, configurable: true });
      ctx.sleepWhen = (silent) => {
        silentFn = silent;
        const offline = typeof OfflineAudioContext !== 'undefined' && ac instanceof OfflineAudioContext;
        if (!offline || (K.audio && K.audio.sleepOffline)) ctx.interval(ctx.sleepCheck, 250);
      };
      ctx.onDispose(() => { silentFn = null; });
      ctx.onUI('midi_arm', { type: 'object', required: ['on'] }, (p) => { midiArmed = !!p.on; ctx.syncUI(); });
      ctx.onUI('audition', null, (p) => { if (ctx.audition) ctx.audition(p || {}); });
      ctx.onUI('audition_off', null, (p) => { if (ctx.auditionOff) ctx.auditionOff(p || {}); });
      api.addState(() => ({ midiArmed }));
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);

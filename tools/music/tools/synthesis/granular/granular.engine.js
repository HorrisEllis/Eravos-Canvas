/* eravos.granular 1.0.0 — Granular (P44 · synthesis) · spec eravos.organism.granular (was planned P8.3 "Emerge")
 * A small tool that turns ANY sound into a cloud of grains. Wire anything into it (a voice, a pad, drums — or put it
 * inside another tool as a mod) and it keeps the last few seconds in memory, LIVE; or load a clip (Clip Maker → it,
 * or drop / pick one) and it plays the clip as a cloud. STD.fx: Mix blends the cloud with what comes in.
 * AudioWorklet engine ('eravos-grains'): stereo ring buffer (12 s) · up to 96 grains, oldest dropped · each grain reads
 * at POSITION ± SPRAY, SIZE long, at PITCH ± PITCH SPRAY (optionally on the song's scale), forwards or (REVERSE odds)
 * backwards, Tukey window (SHAPE: 0 hard … 1 Hann — always starts and ends at 0, no clicks), panned ± WIDTH.
 * DENSITY grains/s with jitter — or SYNC: one grain per 1/8 · 1/16 · 1/32 of the song's tempo. FREEZE stops writing (the
 * cloud keeps what it has); FEEDBACK writes the cloud back into its memory (shimmer). Clip mode: SCAN moves the
 * position through the clip at −2…2 × real time.
 * NOTES (Keys on): the cloud plays only while a note is held, pitched by it (C4 = as recorded). */
(function () {
  'use strict';
  const S = OrganismSDK.STD, SDK = OrganismSDK;
  const W = `
class EravosGrains extends AudioWorkletProcessor {
  static get parameterDescriptors() { const p = (name, def, min, max) => ({ name, defaultValue: def, minValue: min, maxValue: max, automationRate: 'k-rate' });
    return [p('position', 0.7, 0, 1), p('spray', 0.1, 0, 1), p('size', 0.12, 0.005, 1), p('density', 20, 0, 400), p('pitch', 0, -48, 48), p('pitchSpray', 0, 0, 24),
      p('reverse', 0, 0, 1), p('width', 0.6, 0, 1), p('freeze', 0, 0, 1), p('feedback', 0, 0, 0.95), p('shape', 1, 0, 1), p('memory', 2, 0.1, 12), p('scan', 0, -2, 2),
      p('interval', 0, 0, 4), p('gate', 1, 0, 1), p('note', 0, -48, 48), p('quantize', 0, 0, 1)]; }
  constructor() {
    super(); this.N = Math.ceil(sampleRate * 12); this.buf = [new Float32Array(this.N), new Float32Array(this.N)]; this.w = 0; this.filled = 0;
    this.clip = 0; this.clipLen = 0; this.scanPos = 0; this.grains = []; this.toNext = 0; this.seed = 987654321; this.steps = null; this.t = 0; this.report = 0; this.bursts = [];
    this.port.onmessage = (e) => { const m = e.data || {};
      if (m.type === 'load') { const n = Math.min(this.N, m.L.length); this.buf[0].set(m.L.subarray(0, n)); this.buf[1].set((m.R || m.L).subarray(0, n)); this.clip = 1; this.clipLen = n; this.filled = n; this.grains.length = 0; }
      else if (m.type === 'live') { this.clip = 0; this.clipLen = 0; this.buf[0].fill(0); this.buf[1].fill(0); this.filled = 0; this.w = 0; this.grains.length = 0; }
      else if (m.type === 'scale') this.steps = m.steps && m.steps.length ? m.steps : null;
      else if (m.type === 'burst') this.bursts.push(m);
      else if (m.type === 'silence') { this.grains.length = 0; this.bursts.length = 0; }
    };
  }
  rnd() { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 4294967296; }
  snap(st) { const S = this.steps; if (!S) return st; const o = Math.floor(st / 12), r = st - o * 12; let best = S[0], d = 99; for (const s of S.concat([S[0] + 12])) { const dd = Math.abs(s - r); if (dd < d) { d = dd; best = s; } } return o * 12 + best; }
  spawn(p, pos01, pitchSt, burst) {
    const g = this.grains; if (g.length >= 96) g.shift();
    const len = Math.max(32, Math.round(p.size * sampleRate)), rev = this.rnd() < p.reverse;
    let st = (pitchSt !== undefined ? pitchSt : p.pitch + p.note + (this.rnd() * 2 - 1) * p.pitchSpray);
    if (p.quantize > 0.5 && pitchSt === undefined) st = p.pitch + p.note + this.snap((this.rnd() * 2 - 1) * p.pitchSpray);
    const rate = Math.pow(2, st / 12), span = this.clip ? this.clipLen : Math.min(this.filled, Math.round(p.memory * sampleRate));
    if (span < len + 64) return;
    const x = Math.min(1, Math.max(0, pos01 + (burst ? (this.rnd() * 2 - 1) * 0.02 : (this.rnd() * 2 - 1) * p.spray)));
    // where it starts reading: clip → that point of the clip; live → that far back in the memory (1 = newest), leaving room to read
    const need = len * rate + 4;
    let start = this.clip ? x * Math.max(0, span - need) : this.w - span + x * Math.max(0, span - need);
    if (!this.clip && start + need > this.w) start = this.w - need;
    const pan = (this.rnd() * 2 - 1) * p.width, th = (pan + 1) * Math.PI / 4;
    g.push({ pos: rev ? start + len * rate : start, rate: rev ? -rate : rate, len, age: 0, gl: Math.cos(th), gr: Math.sin(th), shape: Math.max(0.04, p.shape), st, x });
  }
  read(c, pos) { const N = this.N, i = Math.floor(pos), f = pos - i, b = this.buf[c]; const a = b[((i % N) + N) % N], z = b[(((i + 1) % N) + N) % N]; return a + (z - a) * f; }
  process(inputs, outputs, params) {
    const inp = inputs[0], out = outputs[0], n = out[0].length, p = {}; for (const k in params) p[k] = params[k][0];
    const L = out[0], R = out[1] || out[0], inL = (inp && inp[0]) || null, inR = (inp && (inp[1] || inp[0])) || null;
    if (this.clip && p.scan !== 0) { this.scanPos = (this.scanPos + p.scan * n / Math.max(1, this.clipLen) + 1) % 1; } else this.scanPos = p.position;
    const posNow = this.clip && p.scan !== 0 ? this.scanPos : p.position;
    const norm = 1 / Math.sqrt(Math.max(1, (p.interval > 0 ? 1 / p.interval : p.density) * p.size));
    for (let i = 0; i < n; i++) {
      // schedule
      if (p.gate > 0.5 && (p.density > 0 || p.interval > 0)) {
        if (this.toNext <= 0) { this.spawn(p, posNow); const iv = p.interval > 0 ? p.interval * sampleRate : sampleRate / p.density * (0.5 + this.rnd()); this.toNext += Math.max(16, iv); }
        this.toNext--;
      } else this.toNext = 0;
      if (this.bursts.length && i === 0) { const b = this.bursts.shift(); for (let k = 0; k < (b.n || 12); k++) this.spawn(p, b.pos, b.pitch, true); }
      let yl = 0, yr = 0;
      for (let k = this.grains.length - 1; k >= 0; k--) {
        const g = this.grains[k], x = g.age / g.len, s = g.shape / 2;
        const w = x < s ? 0.5 - 0.5 * Math.cos(Math.PI * x / s) : x > 1 - s ? 0.5 - 0.5 * Math.cos(Math.PI * (1 - x) / s) : 1;
        const m = (this.read(0, g.pos) + this.read(1, g.pos)) * 0.5 * w;   // each grain: mono, placed by its own pan
        yl += m * g.gl; yr += m * g.gr;
        g.pos += g.rate; g.age++;
        if (g.age >= g.len) this.grains.splice(k, 1);
      }
      yl *= norm * Math.SQRT2; yr *= norm * Math.SQRT2;
      L[i] = yl; if (R !== L) R[i] = yr;
      // write (live): what comes in + the cloud fed back, softly limited; frozen = keep what is there
      if (!this.clip && p.freeze < 0.5) {
        const a = inL ? inL[i] : 0, b = inR ? inR[i] : a, fb = p.feedback;
        this.buf[0][this.w % this.N] = fb > 0 ? Math.tanh(a + yl * fb) : a; this.buf[1][this.w % this.N] = fb > 0 ? Math.tanh(b + yr * fb) : b;
        this.w++; if (this.filled < this.N) this.filled++;
      }   // frozen: the write head stops too — the cloud keeps reading what it already holds
    }
    if (this.clip) this.w = this.clipLen;
    this.report += n; if (this.report >= sampleRate / 20) { this.report = 0; this.port.postMessage({ type: 'grains', g: this.grains.slice(-48).map(q => [q.x, q.st, q.age / q.len]), filled: this.filled / sampleRate, clip: this.clip }); }
    return true;
  }
}
registerProcessor('eravos-grains', EravosGrains);`;
  const SYNC = { off: 0, '1/4': 1, '1/8': 0.5, '1/16': 0.25, '1/32': 0.125, '1/8T': 1 / 3, '1/16T': 1 / 6 };
  OrganismFactory.define({
    id: 'eravos.granular', domain: 'music', version: '1.0.0', label: 'Granular', icon: '∞', accent: '#aaff44', phase: 'P44',
    category: 'Synthesis', blurb: 'Turns any sound into a cloud of grains — live from what is wired in, or from a clip. Works inside other tools as a mod.',
    size: { w: 560, h: 560 }, minSize: { w: 420, h: 380 },
    permissions: ['audio_out', 'audio_in', 'midi_in', 'bus_publish', 'bus_subscribe', 'filesystem_read'],
    provides: ['capability.audio_out', 'capability.fx', 'capability.note_in'],
    hooks: SDK.fxHooks([S.note_in('gra.hook.note_in'), S.asset_in('gra.hook.asset_in'), S.theory_in('gra.hook.theory_in'),
      S.mod_in('gra.hook.mod_position', 'position'), S.mod_in('gra.hook.mod_density', 'density'), S.mod_in('gra.hook.mod_pitch', 'pitch')]),
    face: ['position', 'spray', 'size', 'density', 'pitch', 'freeze'],
    ui_hooks: ['burst', 'live', 'load', 'load_asset'],
    config: [
      { key: 'position', type: 'number', default: 0.7, min: 0, max: 1, step: 0.001, label: 'Position', group: 'WHERE', hint: 'live: how recent (1 = just now) · clip: where in the clip' },
      { key: 'spray', type: 'number', default: 0.1, min: 0, max: 1, step: 0.001, label: 'Spray', group: 'WHERE', hint: 'grains scatter this far around Position' },
      { key: 'memory', type: 'number', default: 3, min: 0.25, max: 12, step: 0.01, unit: 's', label: 'Memory', group: 'WHERE', hint: 'live: how many seconds of what comes in it keeps to draw from' },
      { key: 'scan', type: 'number', default: 0, min: -2, max: 2, step: 0.01, label: 'Scan', group: 'WHERE', hint: 'clip: move through it on its own (1 = real time, − backwards)' },
      { key: 'freeze', type: 'boolean', default: false, label: 'Freeze', group: 'WHERE', hint: 'stop listening — the cloud keeps what it has' },
      { key: 'size', type: 'number', default: 0.12, min: 0.005, max: 1, step: 0.001, unit: 's', label: 'Size', group: 'GRAIN' },
      { key: 'shape', type: 'number', default: 1, min: 0, max: 1, step: 0.01, label: 'Shape', group: 'GRAIN', hint: '0 hard-edged (glitchy) · 1 smooth (Hann)' },
      { key: 'density', type: 'number', default: 20, min: 0, max: 400, step: 0.1, unit: '/s', label: 'Density', group: 'GRAIN' },
      { key: 'sync', type: 'enum', options: Object.keys(SYNC), default: 'off', label: 'Sync', group: 'GRAIN', hint: 'one grain on every 1/8, 1/16 … of the song’s tempo instead of Density' },
      { key: 'reverse', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Reverse', group: 'GRAIN', hint: 'odds of a grain playing backwards' },
      { key: 'pitch', type: 'number', default: 0, min: -36, max: 36, step: 0.01, unit: 'st', label: 'Pitch', group: 'PITCH' },
      { key: 'pitchSpray', type: 'number', default: 0, min: 0, max: 36, step: 0.01, unit: 'st', label: 'Pitch spray', group: 'PITCH' },
      { key: 'quantize', type: 'boolean', default: false, label: 'In key', group: 'PITCH', hint: 'sprayed pitches land on the song’s scale' },
      { key: 'keys', type: 'boolean', default: false, label: 'Keys', group: 'PITCH', hint: 'play it from notes: the cloud sounds while a note is held, pitched by it (C4 = as recorded)' },
      { key: 'width', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: 'Width', group: 'SPACE' },
      { key: 'feedback', type: 'number', default: 0, min: 0, max: 0.95, step: 0.01, label: 'Feedback', group: 'SPACE', hint: 'the cloud goes back into its memory — shimmer, smear' },
      { key: 'level', type: 'number', default: 1, min: 0, max: 2, step: 0.01, label: 'Level', group: 'SPACE' },
    ].concat(SDK.STD_FX_CONFIG.map(c => c.key === 'mix' ? Object.assign({}, c, { default: 0.6 }) : c)),
    defaultPreset: 'Voice Cloud',
    engine(ctx, o) {
      const ac = ctx.ac, P = ctx.params, MT = window.MusicTheory, K = ctx.K;
      const fx = SDK.fxShell(ctx), lvl = ctx.track(ac.createGain()); lvl.gain.value = P.get('level');
      let node = null, clipName = null, held = new Map();
      const posMod = ctx.modBus('position', { min: -1, max: 1 }), denMod = ctx.modBus('density', { min: -200, max: 200 }), pitMod = ctx.modBus('pitch', { min: -24, max: 24 });
      lvl.connect(fx.wetOut);
      const keyOf = { position: 'position', spray: 'spray', size: 'size', density: 'density', pitch: 'pitch', pitchSpray: 'pitchSpray', reverse: 'reverse', width: 'width', feedback: 'feedback', shape: 'shape', memory: 'memory', scan: 'scan' };
      function push(now) {
        if (!node) return; const t = ac.currentTime, set = (k, v) => { const a = node.parameters.get(k); if (now) a.setValueAtTime(v, t); else a.setTargetAtTime(v, t, 0.01); };
        Object.keys(keyOf).forEach(k => set(keyOf[k], P.get(k)));
        set('freeze', P.get('freeze') ? 1 : 0); set('quantize', P.get('quantize') ? 1 : 0);
        set('interval', SYNC[P.get('sync')] ? SYNC[P.get('sync')] * 60 / Math.max(20, ctx.bpm) : 0);
        set('gate', P.get('keys') ? (Array.from(held.values()).some(e => e > ac.currentTime) ? 1 : 0) : 1);
      }
      function scale() { if (!node || !MT) return; const k = ctx.key, iv = (MT.SCALES && MT.SCALES[k.scale]) || (MT.scale && MT.scale(k.scale)) || null; node.port.postMessage({ type: 'scale', steps: Array.isArray(iv) ? iv.slice() : null }); }
      ctx.ready = ctx.loadWorklet('eravos-grains', W).then(() => {
        node = new AudioWorkletNode(ac, 'eravos-grains', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] }); ctx.track(node);
        fx.wetIn.connect(node); node.connect(lvl);
        posMod.connect(node.parameters.get('position')); denMod.connect(node.parameters.get('density')); pitMod.connect(node.parameters.get('pitch'));
        node.port.onmessage = (e) => { if (e.data && e.data.type === 'grains') ctx.emitUI('grains', e.data); };
        push(true); scale();
        if (pendingClip) { const c = pendingClip; pendingClip = null; sendClip(c.buf, c.name); }
      }).catch(() => ctx.fault('RUNTIME_003', 'Granular: AudioWorklet unavailable — no grains on this browser'));
      Object.keys(keyOf).concat(['freeze', 'quantize', 'sync', 'keys']).forEach(k => P.onChange(k, () => push(false)));
      P.onChange('level', (v) => lvl.gain.setTargetAtTime(v, ac.currentTime, 0.01));
      ctx.onBpm && ctx.onBpm(() => push(false)); ctx.onKey(() => scale());
      // clips: wired from a Clip Maker (asset:ready on the wire), addressed to it, or loaded in its window
      let pendingClip = null;
      function sendClip(buf, name) {
        if (!node) { pendingClip = { buf, name }; return; }
        const L = new Float32Array(buf.getChannelData(0)), R = new Float32Array(buf.numberOfChannels > 1 ? buf.getChannelData(1) : buf.getChannelData(0));
        node.port.postMessage({ type: 'load', L, R }); clipName = name || 'clip'; ctx.emitUI('source', { clip: clipName, seconds: Math.min(12, buf.duration) });
      }
      async function loadAsset(hash, name) { const a = K.assets.get(hash); if (!a) return; try { const b = a.decoded || await K.assets.decode(hash); if (b && b.getChannelData) { currentHash = hash; sendClip(b, name || a.source); } } catch (e) { ctx.fault('ASSET_002', 'Granular: could not read ' + (name || hash)); } }
      let currentHash = null;
      ctx.on('asset:ready', SDK.ASSET_SCHEMA, (p) => {
        if (p._from === ctx.id) return;
        const wired = K.wires.list().some(w => w.dst.instanceId === ctx.id && w.dst.hookId === 'gra.hook.asset_in' && w.src.instanceId === p._from);
        if (p.target === ctx.id || wired) loadAsset(p.hash, p.name);
      });
      ctx.onUI('load_asset', { type: 'object', required: ['hash'] }, (p) => loadAsset(p.hash, p.name));
      ctx.onUI('load', { type: 'object', required: ['arrayBuffer'] }, async (p) => { try { const h = K.assets.register(p.arrayBuffer, { name: p.name || 'clip' }); await loadAsset(h.hash, p.name); } catch (e) { ctx.fault('ASSET_002', 'Granular: not a sound file'); } });
      ctx.onUI('live', null, () => { currentHash = null; clipName = null; if (node) node.port.postMessage({ type: 'live' }); ctx.emitUI('source', { clip: null }); });
      ctx.onUI('burst', { type: 'object', required: ['pos'] }, (p) => { if (node) node.port.postMessage({ type: 'burst', pos: Math.max(0, Math.min(1, +p.pos)), pitch: +p.pitch || 0, n: 16 }); });
      // a clip it holds is part of its save
      ctx.saveExtra = () => currentHash ? { clip: currentHash, name: clipName } : undefined;
      ctx.loadExtra = (x) => { if (x && x.clip) loadAsset(x.clip, x.name); };
      // KEYS: notes gate the cloud and pitch it (relative to C4)
      function noteOn(note, t, dur) {
        t = Math.max(t, ac.currentTime); held.set(note, dur !== undefined ? t + dur : Infinity);
        if (!node || !P.get('keys')) return;
        const pn = node.parameters.get('note'), g = node.parameters.get('gate');
        pn.setValueAtTime(note - 60, t); g.setValueAtTime(1, t);
        if (dur !== undefined) ctx.atAudioTime(t + dur, () => { if (![...held.values()].some(e => e > ac.currentTime + 0.001)) g.setValueAtTime(0, ac.currentTime); });
      }
      ctx.onNote((p) => noteOn(p.note, p.time, p.duration === undefined ? 0.5 : p.duration));
      ctx.onMidi((p) => { if (p.on) noteOn(p.note, ac.currentTime); else { held.delete(p.note); if (node && P.get('keys') && !held.size) node.parameters.get('gate').setValueAtTime(0, ac.currentTime); } });
      ctx.audition = (p) => { if (node) node.port.postMessage({ type: 'burst', pos: P.get('position'), pitch: P.get('pitch'), n: 24 }); };
      ctx.onSilence((p) => { if (p && p.hard && node) node.port.postMessage({ type: 'silence' }); });
      ctx.internals = { get node() { return node; } };
      return { unmount() {} };
    },
  });
})();

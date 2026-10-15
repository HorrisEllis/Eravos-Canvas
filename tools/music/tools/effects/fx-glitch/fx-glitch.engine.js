/* eravos.fx-glitch 1.0.0 — Glitch (P11 gate F) · spec eravos.organism.fx-glitch · inherits STD.fx
 * An AudioWorklet keeps a rolling 16 s capture of the input, stamped with the audio clock. Events are scheduled to land
 * ON the grid (the next transport tick of the chosen rate) and replay captured audio:
 *   repeat (stutter a slice N times) · reverse (the last slice backwards) · stop (tape-stop: speed falls to zero)
 *   half (half speed) · scatter (a random slice from the last bar). Every splice is crossfaded 3 ms.
 * AUTO: each grid step, CHAOS is the chance an event fires (weights: reverse / stop / scatter, the rest repeat).
 * HOLD pads: an event that runs while held, quantized in and out. Other tools fire events through fx:glitch. */
(function () {
  'use strict';
  const S = OrganismSDK.STD, SDK = OrganismSDK;
  const GLITCH = `
class EravosGlitch extends AudioWorkletProcessor {
  constructor() {
    super(); this.N = Math.ceil(sampleRate * 16); this.buf = [new Float32Array(this.N), new Float32Array(this.N)]; this.w = 0; this.frame = 0;
    this.q = []; this.ev = null; this.xf = Math.round(0.003 * sampleRate); this.fadeOut = 0; this.last = [0, 0];
    this.port.onmessage = (e) => { const m = e.data; if (m.type === 'release') { if (this.ev && this.ev.id === m.id) this.ev.end = Math.max(this.frame, m.at); this.q.forEach(x => { if (x.id === m.id) x.end = m.at; }); return; } if (m.type === 'clear') { this.q = []; this.ev = null; return; } this.q.push(m); this.q.sort((a, b) => a.at - b.at); };
  }
  rd(c, pos) { const N = this.N; let i = Math.floor(pos); const f = pos - i; const b = this.buf[c]; const a = ((i % N) + N) % N; return b[a] + (b[(a + 1) % N] - b[a]) * f; }
  process(inputs, outputs) {
    const inp = inputs[0], out = outputs[0], n = out[0].length, N = this.N, xf = this.xf;
    for (let i = 0; i < n; i++, this.frame++) {
      const xl = inp[0] ? inp[0][i] : 0, xr = inp[1] ? inp[1][i] : xl;
      this.buf[0][this.w] = xl; this.buf[1][this.w] = xr;
      if (!this.ev && this.q.length && this.q[0].at <= this.frame) { this.ev = this.q.shift(); this.ev.t = 0; this.port.postMessage({ type: 'started', id: this.ev.id, kind: this.ev.kind, at: this.frame }); }
      let L = xl, R = xr;
      const e = this.ev;
      if (e) {
        const t = e.t, start = e.at; // frames since the event began
        const wrote = this.w; // the write head (live) — capture positions are relative to it
        const back = (k) => wrote - (this.frame - start) - k; // buffer index of the frame k samples before the event began
        let pl = 0, pr = 0, g = 1;
        if (e.kind === 'repeat' || e.kind === 'hold') {
          const len = e.len, k = t % len, rate = e.rate || 1; const src = back(len) + k * rate;
          pl = this.rd(0, src); pr = this.rd(1, src);
          g = Math.min(1, k / xf, (len - k) / xf); // fade every repetition in and out
        } else if (e.kind === 'reverse') {
          const len = e.len, k = t % len; const src = back(0) - 1 - k; pl = this.rd(0, src); pr = this.rd(1, src); g = Math.min(1, k / xf, (len - k) / xf);
        } else if (e.kind === 'stop') {
          const L2 = e.len; const r = Math.max(0, 1 - t / L2); e.pos = (e.pos === undefined ? back(0) : e.pos + r); pl = this.rd(0, e.pos); pr = this.rd(1, e.pos); g = t < xf ? t / xf : 1;
        } else if (e.kind === 'half') {
          e.pos = (e.pos === undefined ? back(0) : e.pos + 0.5); pl = this.rd(0, e.pos); pr = this.rd(1, e.pos); g = Math.min(1, t / xf);
        } else if (e.kind === 'scatter') {
          const len = e.len, k = t % len; const src = back(e.from) + k; pl = this.rd(0, src); pr = this.rd(1, src); g = Math.min(1, k / xf, (len - k) / xf);
        }
        const into = Math.min(1, t / xf); // crossfade from live into the event
        L = xl * (1 - into) + pl * g * into; R = xr * (1 - into) + pr * g * into;
        e.t++;
        if (this.frame + 1 >= e.end) { this.ev = null; this.fadeOut = xf; this.last = [pl * g, pr * g]; this.port.postMessage({ type: 'ended', id: e.id }); }
      } else if (this.fadeOut > 0) { const a = this.fadeOut / xf; L = xl * (1 - a) + this.last[0] * a; R = xr * (1 - a) + this.last[1] * a; this.fadeOut--; }
      out[0][i] = L; if (out[1]) out[1][i] = R;
      this.w = (this.w + 1) % N;
    }
    return true;
  }
}
registerProcessor('eravos-glitch', EravosGlitch);`;
  const DIVS = ['1/4', '1/8', '1/16', '1/32'];
  const STEPS = { '1/4': 4, '1/8': 2, '1/16': 1, '1/32': 0.5, '1/2': 8, '1/1': 16 };
  const EVENTS = ['repeat', 'reverse', 'stop', 'half', 'scatter'];
  OrganismFactory.define({
    id: 'eravos.fx-glitch', domain: 'music', version: '1.0.0', label: 'Glitch', icon: '⌗', accent: '#ff0044', phase: 'P11',
    category: 'Effects', blurb: 'Stutters, reverses, tape-stops and scatters that land exactly on the beat. Hold a pad, or let Chaos do it.',
    size: { w: 600, h: 500 }, minSize: { w: 460, h: 400 },
    permissions: ['audio_out', 'audio_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.fx'],
    hooks: SDK.fxHooks([S.transport_in('glitch.hook.transport_in'), S.event('glitch.hook.event_in', 'in', 'fx:glitch', { type: 'object', required: ['event'] }, '1.0.0')]),
    config: [
      { key: 'rate', type: 'enum', options: DIVS, default: '1/16', label: 'Grid', group: 'GLITCH', hint: 'events start on this grid' },
      { key: 'size', type: 'enum', options: ['1/4', '1/8', '1/16', '1/32'], default: '1/16', label: 'Slice', group: 'GLITCH' },
      { key: 'repeats', type: 'integer', default: 4, min: 1, max: 16, label: 'Repeats', group: 'GLITCH' },
      { key: 'chaos', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Chaos', group: 'AUTO' },
      { key: 'reverseProb', type: 'number', default: 0.25, min: 0, max: 1, step: 0.01, label: 'Reverse', group: 'AUTO' },
      { key: 'stopProb', type: 'number', default: 0.1, min: 0, max: 1, step: 0.01, label: 'Stop', group: 'AUTO' },
      { key: 'scatterProb', type: 'number', default: 0.25, min: 0, max: 1, step: 0.01, label: 'Scatter', group: 'AUTO' },
      { key: 'pitchDrift', type: 'number', default: 0, min: -12, max: 12, step: 1, unit: 'st', label: 'Repeat pitch', group: 'GLITCH' },
      { key: 'stopBeats', type: 'number', default: 2, min: 0.25, max: 8, step: 0.25, label: 'Stop beats', group: 'GLITCH' },
    ].concat(SDK.STD_FX_CONFIG),
    ui_hooks: ['fire', 'hold', 'release'],
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, SR = ac.sampleRate;
      const fx = SDK.fxShell(ctx);
      let node = null, seq = 1; const pending = [], holds = new Map();
      const stepSec = () => 60 / ctx.bpm / 4;
      const frames = (div) => Math.max(32, Math.round((STEPS[div] || 1) * stepSec() * SR));
      function post(ev) { if (!node) return null; ev.id = ev.id || seq++; node.port.postMessage(ev); ctx.emitUI('event', { kind: ev.kind, id: ev.id, at: ev.at / SR, len: ev.len / SR, dur: (ev.end - ev.at) / SR }); return ev.id; }
      function build(kind, at, o) {
        o = o || {};
        const len = frames(o.div || P.get('size')), rep = o.count || P.get('repeats');
        const ev = { kind, at: Math.round(at * SR), len };
        if (kind === 'repeat') { ev.end = ev.at + len * rep; ev.rate = Math.pow(2, P.get('pitchDrift') / 12); }
        else if (kind === 'hold') { ev.end = ev.at + len * 4096; ev.rate = Math.pow(2, P.get('pitchDrift') / 12); }
        else if (kind === 'reverse') ev.end = ev.at + len;
        else if (kind === 'stop') { ev.len = Math.round(P.get('stopBeats') * 4 * stepSec() * SR); ev.end = ev.at + ev.len; }
        else if (kind === 'half') ev.end = ev.at + len * 2;
        else if (kind === 'scatter') { const bar = Math.round(16 * stepSec() * SR); ev.from = Math.max(len, Math.round(len + Math.random() * Math.max(0, bar - len))); ev.end = ev.at + len; }
        return ev;
      }
      // quantize: a fire request waits for the next grid tick (or the next 1/32 half-step)
      ctx.onTick((t) => {
        const grid = STEPS[P.get('rate')] || 1, sd = t.stepDur || stepSec();
        const times = grid < 1 ? [t.time, t.time + sd / 2] : ((t.step16 % grid) === 0 ? [t.time] : []);
        times.forEach(tm => {
          while (pending.length) { const p = pending.shift(); if (p.release) { const id = holds.get(p.key); if (id && node) node.port.postMessage({ type: 'release', id, at: Math.round(tm * SR) }); holds.delete(p.key); continue; } const id = post(build(p.kind, tm, p)); if (p.hold) holds.set(p.key, id); }
          const chaos = Math.max(0, Math.min(1, P.get('chaos')));
          if (chaos > 0 && Math.random() < chaos * 0.35) {
            const r = Math.random(), a = P.get('reverseProb'), b = a + P.get('stopProb'), c = b + P.get('scatterProb');
            const kind = r < a ? 'reverse' : r < b ? 'stop' : r < c ? 'scatter' : 'repeat';
            post(build(kind, tm, { count: Math.max(1, Math.round(P.get('repeats') / 2)) }));
          }
        });
      });
      const fire = (kind, o) => { o = o || {}; if (!EVENTS.includes(kind) && kind !== 'hold') return ctx.fault('RUNTIME_002', 'unknown glitch event ' + kind); pending.push(Object.assign({ kind }, o)); if (!ctx.playing) post(build(kind === 'hold' ? 'hold' : kind, ac.currentTime + 0.02, o)), pending.length = 0; };
      ctx.fire = fire;
      ctx.onUI('fire', { type: 'object', required: ['event'] }, (p) => fire(p.event, { div: p.div, count: p.count }));
      ctx.onUI('hold', { type: 'object', required: ['key'] }, (p) => { const kind = p.event || 'hold'; if (kind === 'reverse' || kind === 'stop' || kind === 'scatter') return fire(kind, { div: p.div }); pending.push({ kind: 'hold', div: p.div, hold: true, key: p.key }); if (!ctx.playing) { const id = post(build('hold', ac.currentTime + 0.02, { div: p.div })); holds.set(p.key, id); pending.length = 0; } });
      ctx.onUI('release', { type: 'object', required: ['key'] }, (p) => { if (!holds.has(p.key)) { const i = pending.findIndex(x => x.key === p.key); if (i >= 0) pending.splice(i, 1); return; } if (ctx.playing) pending.push({ release: true, key: p.key }); else { if (node) node.port.postMessage({ type: 'release', id: holds.get(p.key), at: Math.round((ac.currentTime + 0.01) * SR) }); holds.delete(p.key); } });
      ctx.on('fx:glitch', { type: 'object', required: ['event'] }, (p) => { if (p.target && p.target !== ctx.id) return; fire(p.event, { div: p.div, count: p.count }); });
      ctx.playing = false; ctx.onPlay(() => { ctx.playing = true; }); ctx.onStop(() => { ctx.playing = false; pending.length = 0; if (node) node.port.postMessage({ type: 'clear' }); });
      ctx.ready = ctx.loadWorklet('eravos-glitch', GLITCH).then(() => {
        node = new AudioWorkletNode(ac, 'eravos-glitch', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] }); ctx.track(node);
        fx.wetIn.connect(node); node.connect(fx.wetOut);
        node.port.onmessage = (e) => ctx.emitUI('worklet', e.data);
      }).catch(() => { fx.wetIn.connect(fx.wetOut); ctx.fault('RUNTIME_003', 'Glitch: AudioWorklet unavailable — passing the sound through (no glitches in this browser)'); });
      ctx.internals = { get node() { return node; }, build, post, frames };
      return { unmount() {} };
    },
  });
})();

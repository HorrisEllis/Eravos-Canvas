/* eravos.hits 1.0.0 — Hits: one tool's hits play another tool (spec: hits.spec). A connector.
 * His words (2026-11-27): "Also tools to connect to tools."
 *
 * Wire any sound in (it is only listened to: it still plays where it played). Each hit in it — its loudness jumping above where it was —
 * plays a note on every tool wired to Notes out (Note, Length; as loud as the hit when Velocity follows), and comes out as a Pulse (1 at the
 * hit, falling over Length) for any knob. Sensitivity is how big a jump counts; Hears from is the level under which nothing counts; a new hit
 * waits at least Gap after the last one (no double hits on one kick).
 * Built from components (never re-implemented here): envelope-follower (two of them: a fast one and a slow one; a hit is the fast one rising
 * over the slow one) — its kernel text runs in this tool's worklet. The worklet marks each hit to the sample and sends its time; the note
 * is booked at that time (a live hit is heard as soon as the message arrives).
 * Nothing wired in: no hits, Pulse 0. */
(function () {
  'use strict';
  const S = OrganismSDK.STD, MP = window.MusicParts;
  const SET = ['sense', 'floor', 'gap', 'length'];
  const DESC = SET.map(k => ({ name: k, defaultValue: 0, minValue: -1e6, maxValue: 1e6, automationRate: 'k-rate' }));
  const SRC = () => `const Follower = ${MP.Follower};
const SET = ${JSON.stringify(SET)};
class EravosHits extends AudioWorkletProcessor {
  static get parameterDescriptors() { return ${JSON.stringify(DESC)}; }
  constructor() { super(); this.fast = Follower(); this.slow = Follower(); this.s = {}; this.key = ''; this.armed = true; this.last = -1e9; this.pulse = 0; this.n = 0; }
  apply() { const s = this.s; this.fast.set({ attack: 0.5, release: 25, floor: -90 }, sampleRate); this.slow.set({ attack: 40, release: 300, floor: -90 }, sampleRate); this.thr = Math.pow(10, Math.max(0, s.sense) / 20); this.flo = Math.pow(10, s.floor / 20); }
  process(inputs, outputs, p) {
    let key = ''; for (const k of SET) { const v = p[k][0]; this.s[k] = v; key += v + ','; } if (key !== this.key) { this.key = key; this.apply(); }
    const inp = inputs[0] || [], L = inp[0], R = inp[1] || inp[0], o = outputs[0][0], B = o.length, gapN = this.s.gap * 0.001 * sampleRate, fall = Math.exp(-1 / Math.max(1, this.s.length * sampleRate / 4.6));
    for (let j = 0; j < B; j++) {
      const x = L ? Math.max(Math.abs(L[j]), R ? Math.abs(R[j]) : 0) : 0;
      this.fast.next(x); this.slow.next(x); const f = this.fast.level, sl = this.slow.level, idx = this.n + j;
      if (this.armed && f > this.flo && f > sl * this.thr && idx - this.last >= gapN) {
        this.armed = false; this.last = idx; this.pulse = 1; this.port.postMessage({ t: (currentFrame + j) / sampleRate, v: Math.min(1, f) });
      } else if (!this.armed && f < sl * 1.06) this.armed = true;
      o[j] = this.pulse; this.pulse *= fall; if (this.pulse < 1e-5) this.pulse = 0;
    }
    this.n += B; return true;
  }
}
registerProcessor('eravos-hits', EravosHits);`;
  OrganismFactory.define({
    id: 'eravos.hits', domain: 'music', version: '1.0.0', label: 'Hits', icon: 'H', accent: '#ffb44a',
    category: 'Modulation', blurb: 'One tool’s hits play another tool: every kick fires a bass note, every snare a stab. Each hit also comes out as a pulse for any knob.',
    size: { w: 460, h: 440 }, minSize: { w: 360, h: 320 },
    permissions: ['audio_in', 'audio_out', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.mod_out', 'capability.note_out'],
    hooks: [Object.assign(S.audio_in('hit.hook.audio_in', 'in', true), { primary: true, intent: 'The sound whose hits play (it still plays where it played)' }),
      Object.assign(S.note_out('hit.hook.note_out'), { label: 'Notes', intent: 'A note on every hit, into any instrument' }),
      Object.assign(S.mod_out('hit.hook.pulse', 'pulse'), { label: 'Pulse', intent: '1 at each hit, falling over Length — into any knob' })],
    config: [
      { key: 'sense', type: 'number', default: 6, min: 1, max: 24, step: 0.1, unit: 'dB', label: 'Sensitivity', group: 'HEAR', element: 'envelope-follower', hint: 'How big a jump in loudness counts as a hit (smaller = more hits)' },
      { key: 'floor', type: 'number', default: -42, min: -90, max: -6, step: 1, unit: 'dB', label: 'Hears from', group: 'HEAR', element: 'envelope-follower', hint: 'Quieter than this never counts' },
      { key: 'gap', type: 'number', default: 60, min: 5, max: 1000, step: 1, unit: 'ms', label: 'Gap', group: 'HEAR', hint: 'A new hit waits at least this long after the last' },
      { key: 'note', type: 'integer', default: 36, min: 0, max: 127, label: 'Note', group: 'PLAY', hint: 'The note each hit plays' },
      { key: 'length', type: 'number', default: 0.15, min: 0.01, max: 4, step: 0.01, unit: 's', label: 'Length', group: 'PLAY', hint: 'How long each note (and each pulse) lasts' },
      { key: 'velFollow', type: 'boolean', default: true, label: 'Velocity', group: 'PLAY', hint: 'On: each note as loud as its hit · off: all at Level' },
      { key: 'level', type: 'number', default: 0.85, min: 0, max: 1, step: 0.01, label: 'Level', group: 'PLAY' },
    ],
    defaultPreset: 'Kick Plays Bass',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params;
      const inp = ac.createGain(); inp.channelCount = 2; inp.channelCountMode = 'explicit'; ctx.track(inp);
      ctx.port('in', { kind: 'audio', direction: 'in', node: inp, tap: true, label: 'In' });
      const out = ac.createGain(); ctx.track(out); ctx.port('pulse', { kind: 'mod', direction: 'out', node: out, label: 'Pulse' });
      let node = null, count = 0; ctx.hits = [];
      const valueOf = (k) => P.get(k);
      ctx.ready = ctx.loadWorklet('eravos-hits', SRC()).then(() => {
        if (ctx.disposed) return;
        node = new AudioWorkletNode(ac, 'eravos-hits', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1], channelCount: 2, channelCountMode: 'explicit', parameterData: Object.fromEntries(SET.map(k => [k, valueOf(k)])) });
        ctx.track(node); node.onprocessorerror = (er) => ctx.fault('RUNTIME_003', 'hits worklet stopped: ' + ((er && er.message) || 'processor error'));
        inp.connect(node); node.connect(out);
        // a silent sink keeps the worklet running when nothing is wired to its output — Web Audio only runs what reaches the speakers, and the
        // notes it sends do not (found 3.254: with only Notes wired, nothing was heard)
        const sink = ac.createGain(); sink.gain.value = 0; node.connect(sink); sink.connect(ac.destination); ctx.track(sink); SET.forEach(k => node.parameters.get(k).setValueAtTime(valueOf(k), 0));
        // each hit: a note on every wired instrument, booked at the hit's own time (never in the past)
        node.port.onmessage = (m) => { const h = m.data; if (!h || typeof h.t !== 'number') return; count++; ctx.hits.push(h.t); if (ctx.hits.length > 256) ctx.hits.shift();
          const vel = P.get('velFollow') ? Math.max(0.1, Math.min(1, P.get('level') * (0.4 + 0.6 * Math.min(1, h.v * 1.6)))) : P.get('level'), t = Math.max(h.t, ac.currentTime);
          ctx.wiredOut('hit.hook.note_out').forEach(target => ctx.emit('note:trigger', { target, note: P.get('note'), velocity: vel, time: t, duration: P.get('length') }));
          ctx.emitUI('hit', { n: count, v: h.v }); };
      }).catch(er => ctx.fault('RUNTIME_003', 'hits worklet: ' + er.message));
      SET.forEach(k => P.onChange(k, () => { if (node) node.parameters.get(k).setValueAtTime(valueOf(k), ac.currentTime); }));
      ctx.count = () => count;
      return {};
    },
  });
})();

/* eravos.pitch-notes 1.0.0 — Pitch → Notes: one tool's pitch plays another tool (spec: pitch-notes.spec). A connector, and the Voice Lab's
 * first step from a voice to the tools. His words (2026-11-27): "Also tools to connect to tools." · "Voice tools. … Making sound like the tools?"
 *
 * Wire any single line in — a voice, a lead, a bass (it is only listened to: it still plays where it played). The pitch-tracker hears what
 * note it is on; when a note holds for Settle, that note plays on every tool wired to Notes out: snapped into the song's key (In key), moved by
 * Octave, as long as Length (fitted to the beat: 1/16 … 1 bar), as loud as it was sung (Velocity). A new note plays when the pitch moves to
 * another; silence plays nothing. The Pitch out follows the line continuously (0…1 across the keyboard) for any knob.
 * Built from components (never re-implemented here): pitch-tracker — its kernel text runs in this tool's worklet, which marks each settled
 * note to its first reading and sends its time; the note is booked at that time (a live note is heard as soon as the message arrives).
 * Note lengths are set when a note starts (an ERAVOS note carries its length), so a sung note is fitted to the beat — open: a note held
 * for as long as it is sung. */
(function () {
  'use strict';
  const S = OrganismSDK.STD, MP = window.MusicParts;
  const SET = ['settle', 'min', 'max', 'gate'];
  const DESC = SET.map(k => ({ name: k, defaultValue: 0, minValue: -1e6, maxValue: 1e6, automationRate: 'k-rate' }));
  const LENGTHS = ['1/16', '1/8', '1/4', '1/2', '1/1'];
  const SRC = () => `const PitchTracker = ${MP.PitchTracker};
const SET = ${JSON.stringify(SET)};
class EravosPitchNotes extends AudioWorkletProcessor {
  static get parameterDescriptors() { return ${JSON.stringify(DESC)}; }
  constructor() { super(); this.pt = PitchTracker(); this.s = {}; this.key = ''; this.cand = -1; this.candT = 0; this.run = 0; this.cur = -1; this.lev = 0; this.pv = 0; }
  process(inputs, outputs, p) {
    let key = ''; for (const k of SET) { const v = p[k][0]; this.s[k] = v; key += v + ','; } if (key !== this.key) { this.key = key; this.pt.set({ min: this.s.min, max: this.s.max, gate: this.s.gate }, sampleRate); }
    const inp = inputs[0] || [], L = inp[0], R = inp[1] || inp[0], o = outputs[0][0], B = o.length, need = Math.max(1, Math.round(this.s.settle * 0.001 * sampleRate / 256));
    for (let j = 0; j < B; j++) {
      const x = L ? (R && R !== L ? (L[j] + R[j]) * 0.5 : L[j]) : 0; this.lev = Math.max(Math.abs(x), this.lev * 0.9995);
      if (this.pt.push(x)) {
        const t = (currentFrame + j) / sampleRate;
        if (!this.pt.voiced) { this.cand = -1; this.run = 0; if (this.cur >= 0) { this.cur = -1; this.port.postMessage({ off: true, t }); } }
        else { const m = 69 + 12 * Math.log2(this.pt.hz / 440), n = Math.round(m); this.pv = Math.max(0, Math.min(1, m / 127));
          if (n !== this.cand) { this.cand = n; this.candT = t - 2048 / sampleRate; this.run = 1; } else this.run++;
          if (this.run === need && n !== this.cur) { this.cur = n; this.port.postMessage({ t: Math.max(0, this.candT), note: n, cents: Math.round(100 * (m - n)), v: Math.min(1, this.lev) }); } }
      }
      o[j] = this.pv;
    }
    return true;
  }
}
registerProcessor('eravos-pitch-notes', EravosPitchNotes);`;
  OrganismFactory.define({
    id: 'eravos.pitch-notes', domain: 'music', version: '1.0.0', label: 'Pitch → Notes', icon: 'P', accent: '#b48cff',
    category: 'Modulation', blurb: 'One tool’s pitch plays another tool: sing or play a line and the Piano (or anything) plays it, in key.',
    size: { w: 480, h: 460 }, minSize: { w: 360, h: 340 },
    permissions: ['audio_in', 'audio_out', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.mod_out', 'capability.note_out'],
    hooks: [Object.assign(S.audio_in('pn.hook.audio_in', 'in', true), { primary: true, intent: 'A single line — a voice, a lead, a bass (it still plays where it played)' }),
      Object.assign(S.note_out('pn.hook.note_out'), { label: 'Notes', intent: 'The notes it hears, into any instrument' }),
      Object.assign(S.mod_out('pn.hook.pitch', 'pitch'), { label: 'Pitch', intent: 'Where the line is, 0…1 across the keyboard — into any knob' })],
    config: [
      { key: 'settle', type: 'number', default: 40, min: 5, max: 300, step: 1, unit: 'ms', label: 'Settle', group: 'HEAR', element: 'pitch-tracker', hint: 'How long a pitch must hold before it plays (longer = fewer passing notes)' },
      { key: 'min', type: 'number', default: 60, min: 30, max: 500, step: 1, unit: 'Hz', label: 'Lowest', group: 'HEAR', element: 'pitch-tracker' },
      { key: 'max', type: 'number', default: 1200, min: 200, max: 3000, step: 1, unit: 'Hz', label: 'Highest', group: 'HEAR', element: 'pitch-tracker' },
      { key: 'gate', type: 'number', default: -45, min: -90, max: -10, step: 1, unit: 'dB', label: 'Hears from', group: 'HEAR', element: 'pitch-tracker', hint: 'Quieter than this is silence' },
      { key: 'inKey', type: 'boolean', default: true, label: 'In key', group: 'PLAY', hint: 'Snap each note into the song’s key' },
      { key: 'octave', type: 'integer', default: 0, min: -3, max: 3, label: 'Octave', group: 'PLAY' },
      { key: 'length', type: 'enum', options: LENGTHS, default: '1/8', label: 'Length', group: 'PLAY', hint: 'How long each note plays, fitted to the beat' },
      { key: 'velFollow', type: 'boolean', default: true, label: 'Velocity', group: 'PLAY', hint: 'On: as loud as it was sung · off: all at Level' },
      { key: 'level', type: 'number', default: 0.8, min: 0, max: 1, step: 0.01, label: 'Level', group: 'PLAY' },
    ],
    defaultPreset: 'Voice Plays Keys',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, MT = window.MusicTheory;
      const inp = ac.createGain(); inp.channelCount = 2; inp.channelCountMode = 'explicit'; ctx.track(inp);
      ctx.port('in', { kind: 'audio', direction: 'in', node: inp, tap: true, label: 'In' });
      const out = ac.createGain(); ctx.track(out); ctx.port('pitch', { kind: 'mod', direction: 'out', node: out, label: 'Pitch' });
      let node = null; ctx.heard = [];
      ctx.ready = ctx.loadWorklet('eravos-pitch-notes', SRC()).then(() => {
        if (ctx.disposed) return;
        node = new AudioWorkletNode(ac, 'eravos-pitch-notes', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1], channelCount: 2, channelCountMode: 'explicit', parameterData: Object.fromEntries(SET.map(k => [k, P.get(k)])) });
        ctx.track(node); node.onprocessorerror = (er) => ctx.fault('RUNTIME_003', 'pitch-notes worklet stopped: ' + ((er && er.message) || 'processor error'));
        inp.connect(node); node.connect(out);
        // a silent sink keeps the worklet running when nothing is wired to its output — Web Audio only runs what reaches the speakers, and the
        // notes it sends do not (found 3.254: with only Notes wired, nothing was heard)
        const sink = ac.createGain(); sink.gain.value = 0; node.connect(sink); sink.connect(ac.destination); ctx.track(sink); SET.forEach(k => node.parameters.get(k).setValueAtTime(P.get(k), 0));
        node.port.onmessage = (m) => { const h = m.data; if (!h || h.off || typeof h.note !== 'number') { if (h && h.off) ctx.emitUI('heard', { off: true }); return; }
          const k = ctx.key || { root: 9, scale: 'minor' }; let n = P.get('inKey') && MT && MT.quantize ? MT.quantize(h.note, k.root, k.scale) : h.note; n = Math.max(0, Math.min(127, n + 12 * P.get('octave')));
          const dur = MT && MT.divisionSec ? MT.divisionSec(P.get('length'), ctx.bpm || 120) : 0.25, vel = P.get('velFollow') ? Math.max(0.1, Math.min(1, P.get('level') * (0.4 + 0.6 * Math.min(1, h.v * 2)))) : P.get('level'), t = Math.max(h.t, ac.currentTime);
          ctx.heard.push({ t: h.t, sung: h.note, cents: h.cents, note: n }); if (ctx.heard.length > 256) ctx.heard.shift();
          ctx.wiredOut('pn.hook.note_out').forEach(target => ctx.emit('note:trigger', { target, note: n, velocity: vel, time: t, duration: dur }));
          ctx.emitUI('heard', { sung: h.note, cents: h.cents, note: n }); };
      }).catch(er => ctx.fault('RUNTIME_003', 'pitch-notes worklet: ' + er.message));
      SET.forEach(k => P.onChange(k, () => { if (node) node.parameters.get(k).setValueAtTime(P.get(k), ac.currentTime); }));
      return {};
    },
  });
})();

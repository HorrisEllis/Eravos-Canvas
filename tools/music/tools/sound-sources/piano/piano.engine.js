/* eravos.piano 1.0.0 — Piano (spec: tools/music/planned/piano.spec · the face: tools/music/planned/piano.ui.md, approved as a preview)
 * Electric and acoustic pianos, modelled live: a hammer, then a tine or a reed (modes) or 1–3 strings (Karplus–Strong, stretched like a
 * real piano), a body made of modes, a tube, a tremolo. No samples, no recorded body (No toys). His "yes", 2026-11-06.
 *
 * Built from components (tools/music/components — never re-implemented here); the sound runs in ONE AudioWorklet whose code is the
 * components' own kernel text, so what their tests prove is what plays:
 *   karplus-string (KString) the strings and the sympathetic strings · modal-resonator (Modal) the tine / reed and the body ·
 *   env-adsr (ADSR) the damper (release on key up; the pedal holds) · filter-svf (SVF) brightness, opened by velocity ·
 *   saturator-tube (TubeSat) drive, and the mic / lid tone · lfo (LFO) the tremolo · stereo-tools (panL / panR) the keyboard across
 *   the width and the tine's tremolo left ↔ right.
 * Per note (32 at once; a free voice, else the oldest): the hammer (velocity → loudness and hardness, a short felt pulse) strikes what
 * sounds. Every control changes while it plays (his rule, 2026-11-06: "Tools, keys and values can be adjusted while playing them"):
 * decay, stretch, brightness, release, width and the rest reach notes already sounding; hammer and string detune are how a note is
 * struck, so they shape the next strike. The sustain pedal is a control (MIDI Map learns it to CC64). */
(function () {
  'use strict';
  const S = OrganismSDK.STD, MP = window.MusicParts;
  const MODELS = ['tine', 'reed', 'felt', 'upright', 'honky', 'grand'], SYNC = { free: 0, '1/4': 1, '1/8': 2, '1/8 t': 3, '1/16': 4 };
  const SET = ['model', 'hardness', 'brightness', 'bell', 'decay', 'release', 'resonance', 'trem', 'tremHz', 'drive', 'width', 'level',
    'detune', 'inharm', 'sympathetic', 'velCurve', 'keyOff', 'pedalNoise', 'micX', 'micY', 'lid', 'pedal'];
  const SLOTS = 32;
  const DESC = SET.map(k => ({ name: k, defaultValue: 0, minValue: -1e6, maxValue: 1e6, automationRate: 'k-rate' }))
    .concat([{ name: 'brightMod', defaultValue: 0, minValue: -1, maxValue: 1, automationRate: 'a-rate' }, { name: 'tremMod', defaultValue: 0, minValue: -1, maxValue: 1, automationRate: 'a-rate' }])
    .concat([].concat(...Array.from({ length: SLOTS }, (_, i) => [{ name: 'trig' + i, defaultValue: 0, minValue: 0, maxValue: 1e9, automationRate: 'a-rate' },
      { name: 'gate' + i, defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'a-rate' }, { name: 'note' + i, defaultValue: 60, minValue: 0, maxValue: 127, automationRate: 'a-rate' },
      { name: 'vel' + i, defaultValue: 0.8, minValue: 0, maxValue: 1, automationRate: 'a-rate' }])));
  // the strings each model has (n), how far apart they are tuned (cents, × String detune), how open and how long they ring
  const STRINGS = { felt: { n: 2, det: 1.2, bright: 0.45, decay: 0.7, soft: 0.45 }, upright: { n: 2, det: 2, bright: 0.85, decay: 0.85, soft: 1 },
    honky: { n: 3, det: 14, bright: 1, decay: 0.8, soft: 1 }, grand: { n: 3, det: 1.5, bright: 1, decay: 1.3, soft: 1 } };
  const PROC = `
const SET = ${JSON.stringify(SET)}, SLOTS = ${SLOTS}, STRINGS = ${JSON.stringify(STRINGS)}, BODY = ${JSON.stringify(MP.MODAL_SHAPES.body)};
const TINE = [1, 2, 3, ${MP.MODAL_SHAPES.beam[1]}, ${MP.MODAL_SHAPES.beam[2]}], REED = [1, 2, 3, 4, 5, ${MP.MODAL_SHAPES.beam[1]}];
const clamp = (x, a, b) => x < a ? a : x > b ? b : x, SQ2 = Math.SQRT2;
class EravosPiano extends AudioWorkletProcessor {
  static get parameterDescriptors() { return ${JSON.stringify(DESC)}; }
  constructor(o) {
    super();
    const sr = sampleRate, B = 128, opt = (o && o.processorOptions) || {}; this.sr = sr;
    this.s = Object.assign({}, opt.values || {}); this.key = ''; this.count = 0; this.post = 0; this.pedalWas = 0; this.pn = 0; this.pnY = 0; this.seed = 1;
    const kstr = () => { const k = KString(); k.set(220, sr, {}); return k; };
    this.slots = [];
    for (let i = 0; i < SLOTS; i++) { const svf = SVF(); svf.setRate(sr);
      this.slots.push({ trig: 0, key: 0, note: 60, f0: 220, vel: 0.8, v: 0.8, born: 0, kind: 0, str: [kstr(), kstr(), kstr()], ns: 0, modal: Modal(), amp: ADSR(), svf,
        mf: new Float64Array(6), mt: new Float64Array(6), mg: new Float64Array(6), W: 1, j: 1e9, peak: 0, noise: 0, seed: 1, thump: 0, gL: 1, gR: 1,
        V: new Float32Array(B), A: new Float32Array(B), F: [1000] }); }
    this.body = Modal(); this.bodyKey = '';
    this.symp = []; for (let i = 0; i < 24; i++) this.symp.push(kstr()); this.sympKey = ''; this.symFeed = new Float64Array(24);
    this.lfo = LFO(); this.tube = TubeSat(); this.tube.setRate(sr);
    this.P = { frequency: null, detune: [0], resonance: [0.05], gain: [0], mode: [0], stages: [1] };
    this.TP = { drive: [0], bias: [0.15], tone: [0], out: [0], mix: [1] };
    this.L = new Float32Array(B); this.R = new Float32Array(B);
    this.port.onmessage = (e) => { if (e.data && e.data.type === 'panic') for (const sl of this.slots) { sl.amp.reset(); sl.key = 0; for (const k of sl.str) k.reset(); sl.modal.reset(); } };
    this.apply();
  }
  rnd(sl) { sl.seed = (sl.seed * 1664525 + 1013904223) >>> 0; return sl.seed / 2147483648 - 1; }
  vcurve(v) { return Math.pow(clamp(v, 0, 1), 0.5 + 1.5 * clamp(this.s.velCurve, 0, 1)); }
  // what a note's strings or modes are, from the settings now (called at the strike, and again live when a setting moves)
  voice(sl) {
    const s = this.s, sr = this.sr, f = sl.f0, v = sl.v;
    if (sl.kind < 2) {   // tine or reed: modes
      const T = s.decay * clamp(Math.pow(330 / f, 0.4), 0.4, 2), bell = clamp(s.bell, 0, 1), R = sl.kind === 0 ? TINE : REED, n = R.length;
      const G = sl.kind === 0 ? [1, 0.22 * (0.5 + v), (0.1 + 0.5 * bell) * v, (0.04 + 0.6 * bell) * v, 0.08 * bell * v]
                              : [0.8, 0.4 * (0.4 + v), (0.2 + 0.25 * bell) * v, 0.16 * v, 0.1 * v, 0.25 * bell * v];
      const Tt = sl.kind === 0 ? [T, T * 0.5, T * 0.3, 0.15 + 0.5 * bell, 0.06] : [T, T * 0.7, T * 0.5, T * 0.4, T * 0.3, 0.1 + 0.3 * bell];
      for (let i = 0; i < n; i++) { sl.mf[i] = f * R[i]; sl.mt[i] = Tt[i]; sl.mg[i] = G[i]; }
      sl.modal.set(sl.mf.subarray(0, n), sl.mt.subarray(0, n), sl.mg.subarray(0, n), sr);
    } else {             // strings
      const m = STRINGS[['', '', 'felt', 'upright', 'honky', 'grand'][sl.kind]], c = m.det * (0.3 + 2 * clamp(s.detune, 0, 1));
      const T = s.decay * m.decay * clamp(Math.pow(220 / f, 0.5), 0.25, 2.5), br = clamp((0.25 + 0.5 * s.brightness + 0.25 * v) * m.bright, 0, 1);
      const offs = m.n === 2 ? [-c / 2, c / 2] : [-c, 0, c * 0.9];
      sl.ns = m.n; for (let i = 0; i < m.n; i++) sl.str[i].set(f, sr, { t60: T, bright: br, stretch: clamp(s.inharm * 1.15, 0, 1), detune: offs[i] });
    }
  }
  pan(sl) { const s = this.s, x = clamp(s.width * (sl.note - 60) / 36 + (s.micX - 0.5) * 0.8, -1, 1); sl.gL = panL(x) * SQ2; sl.gR = panR(x) * SQ2; }
  // every control, live: sounding notes follow at once
  apply() {
    const s = this.s, sr = this.sr, kind = s.model | 0;
    this.lfo.set({ shape: 0, rate: clamp(s.tremHz, 0.05, 20) }, sr);
    for (const sl of this.slots) { sl.amp.set(0.0008, 5, 1, Math.max(0.02, s.release), sr); if (!sl.amp.done) { this.voice(sl); this.pan(sl); } }
    // the body: a soundboard (strings) or the tine's / reed's case, from modes — never a recording
    const bk = kind + '|' + s.micY.toFixed(3); if (bk !== this.bodyKey) { this.bodyKey = bk;
      const base = kind < 2 ? 160 : kind === 5 ? 85 : kind === 3 ? 115 : 100, fr = [], tt = [], gg = [];
      BODY.forEach((r, i) => { const t = (kind < 2 ? 0.12 : 0.35) * (1 - i * 0.07), rr = Math.pow(0.001, 1 / (t * sr)); fr.push(base * r); tt.push(t); gg.push(2 * (1 - rr) / (1 + 0.4 * i)); });
      this.body.set(fr, tt, gg, sr); }
    this.symps(); this.TP.drive[0] = clamp(s.drive, 0, 1) * 18; this.TP.bias[0] = kind < 2 ? 0.55 : 0.15;
    this.TP.tone[0] = clamp((kind === 5 ? (s.lid - 0.7) * 0.8 : 0) + (0.5 - s.micY) * 0.6, -1, 1);
  }
  // sympathetic strings (MIDI 48–71): undamped while the pedal is down, they ring with what is played; damped when it is up
  symps() { const s = this.s, k = (s.pedal ? 1 : 0) + '|' + s.decay.toFixed(3) + '|' + s.inharm.toFixed(3); if (k === this.sympKey) return; this.sympKey = k;
    // each is fed by (1 − its loss a pass): at its own pitch it then answers at a fixed fraction, however long it rings; the pedal up, the dampers block them
    for (let i = 0; i < 24; i++) { const f = 440 * Math.pow(2, (48 + i - 69) / 12), k = this.symp[i]; k.set(f, this.sr, { t60: s.pedal ? s.decay * 1.2 * clamp(Math.pow(220 / f, 0.5), 0.25, 2.5) : 0.12, bright: 0.5, stretch: clamp(s.inharm, 0, 1) });
      this.symFeed[i] = s.pedal ? 0.25 * (1 - k.loop().loss) : 0; } }
  start(sl, note, vel) {
    const s = this.s, sr = this.sr, kind = s.model | 0, f0 = 440 * Math.pow(2, (note - 69) / 12);
    const fresh = sl.amp.done || sl.kind !== kind || sl.note !== note;
    sl.note = note; sl.f0 = f0; sl.vel = vel; sl.v = this.vcurve(vel); sl.kind = kind; sl.born = ++this.count; sl.seed = (note * 7919 + sl.born * 104729) >>> 0 || 1;
    if (fresh) { for (const k of sl.str) k.reset(); sl.modal.reset(); sl.svf.reset(); }
    this.voice(sl); this.pan(sl);
    // the hammer: a half-sine felt pulse; harder and shorter with Hammer and velocity; a little noise when it is hard
    const h = clamp(0.65 * s.hardness + 0.35 * sl.v, 0, 1) * (kind >= 2 ? STRINGS[['', '', 'felt', 'upright', 'honky', 'grand'][kind]].soft : 1);
    const N = sr / f0;   // the pulse stays under a fraction of the period, so a high note is not filtered away by its own hammer
    if (kind < 2) { sl.W = clamp(sr * (0.0016 - 0.0012 * h), 2, N / 4); sl.peak = 0.5 * sl.v * Math.PI / (2 * sl.W); sl.noise = 0; }   // a mode rings at the pulse's area
    else { sl.W = clamp(sr * (0.0045 - 0.0038 * h), 2, N / 2); sl.peak = 0.45 * sl.v; sl.noise = 0.5 * h; }   // a string carries the pulse itself round its loop
    sl.j = 0; sl.key = 1; sl.amp.gate(true);
  }
  process(inputs, outputs, params) {
    const out = outputs[0], L = out[0], R = out[1] || out[0], B = L.length, sr = this.sr, s = this.s;
    let key = ''; for (const k of SET) { const v = params[k][0]; s[k] = v; key += v + ','; } if (key !== this.key) { this.key = key; this.apply(); }
    const pedal = s.pedal >= 0.5, bm = params.brightMod, tm = params.tremMod;
    if (pedal !== !!this.pedalWas) { this.pedalWas = pedal ? 1 : 0; this.pn = Math.round(0.08 * sr); for (const sl of this.slots) if (!pedal && !sl.key && sl.amp.stage > 0 && sl.amp.stage < 3) sl.amp.gate(false); }
    const ML = this.L, MR = this.R; ML.fill(0); MR.fill(0);
    const bright = clamp(s.brightness + bm[0], 0, 1);
    let loud = 0, sounding = 0;
    for (let q = 0; q < SLOTS; q++) {
      const sl = this.slots[q], tg = params['trig' + q], gt = params['gate' + q];
      const quiet = sl.amp.done && sl.thump <= 0 && tg.length === 1 && tg[0] === sl.trig && gt.length === 1 && gt[0] < 0.5 && !sl.key;
      if (quiet) continue;
      const V = sl.V, A = sl.A, str = sl.str, modal = sl.modal;   // the string count and hammer width are read per sample: a note can start inside this block
      for (let j = 0; j < B; j++) {
        const t = tg.length > 1 ? tg[j] : tg[0], g = gt.length > 1 ? gt[j] : gt[0];
        if (t !== sl.trig) { sl.trig = t; const np = params['note' + q], vp = params['vel' + q]; /* a-rate: a note that starts mid-block reads its own pitch */ this.start(sl, np.length > 1 ? np[j] : np[0], vp.length > 1 ? vp[j] : vp[0]); }
        else if (g < 0.5 && sl.key) { sl.key = 0; if (!pedal) { sl.amp.gate(false); sl.thump = Math.round(0.008 * sr); } }
        let x = 0; if (sl.j < sl.W) { const w = Math.sin(Math.PI * sl.j / sl.W); x = sl.peak * w * (1 + (sl.noise ? sl.noise * this.rnd(sl) : 0)); sl.j++; }
        let y;
        if (sl.kind < 2) y = modal.tick(x);
        else { const ns = sl.ns; y = 0; for (let i = 0; i < ns; i++) y += str[i].tick(x); y /= ns; }
        V[j] = y; A[j] = sl.amp.next();
      }
      // brightness: a gentle low-pass per note, opened by velocity, a little key-tracked (felt darker)
      const kt = Math.max(0.5, Math.pow(sl.f0 / 261.6, 0.3)), fc = 200 * Math.pow(2, bright * 6.5 + sl.v * 2) * kt * (sl.kind === 2 ? 0.45 : 1);
      sl.F[0] = clamp(fc, 40, 20000); this.P.frequency = sl.F; sl.svf.process([V], [V], B, this.P);
      const gL = sl.gL, gR = sl.gR;
      for (let j = 0; j < B; j++) {
        let v = V[j] * A[j];
        if (sl.thump > 0) { sl.thump--; v += this.rnd(sl) * s.keyOff * sl.vel * 0.04 * (sl.thump / (0.008 * sr)); }   // the damper landing (key-off thump)
        ML[j] += v * gL; MR[j] += v * gR;
      }
      if (!sl.amp.done) { sounding++; if (sl.amp.level > loud) loud = sl.amp.level; }
    }
    // sympathetic strings, the body, the pedal's own noise
    const symAmt = clamp(s.sympathetic, 0, 1), strings = (s.model | 0) >= 2, res = clamp(s.resonance, 0, 1) * (0.5 + s.micY) * 0.8, body = this.body, sy = this.symp;
    for (let j = 0; j < B; j++) {
      const m = (ML[j] + MR[j]) * 0.5; let add = res ? res * body.tick(m) : 0;
      if (strings && symAmt > 0.001) { let z = 0; const fd = this.symFeed; for (let i = 0; i < 24; i++) z += sy[i].tick(m * fd[i]); add += z * symAmt; }
      if (this.pn > 0) { this.pn--; this.seed = (this.seed * 1664525 + 1013904223) >>> 0; this.pnY += 0.03 * ((this.seed / 2147483648 - 1) - this.pnY); add += this.pnY * s.pedalNoise * 0.25 * (this.pn / (0.08 * sr)); }
      ML[j] += add; MR[j] += add;
    }
    // tremolo (the electric pianos): the tine's moves left ↔ right, the reed's moves the level
    const kind = s.model | 0, tr = kind < 2 ? clamp(s.trem + tm[0], 0, 1) : 0, lfo = this.lfo;
    for (let j = 0; j < B; j++) { const l = lfo.next(); if (!tr) continue;
      if (kind === 0) { const x = tr * l; ML[j] *= panL(x) * SQ2; MR[j] *= panR(x) * SQ2; } else { const g = 1 - tr * 0.5 * (1 + l); ML[j] *= g; MR[j] *= g; } }
    this.tube.process([ML, MR], [ML, MR], B, this.TP);
    // a full chord struck at once, every preset at full level and velocity, stays under full scale (the test)
    const g = clamp(s.level, 0, 1) * 0.3; for (let j = 0; j < B; j++) { L[j] = ML[j] * g; if (R !== L) R[j] = MR[j] * g; }
    if ((this.post += B) >= 1600) { this.post = 0; this.port.postMessage({ type: 'state', level: loud, sounding, pedal }); }
    return true;
  }
}
registerProcessor('eravos-piano', EravosPiano);`;
  const SRC = () => [MP.KSTRING_SRC(), `const Modal = ${MP.Modal}`, `const ADSR = ${MP.ADSR}`, `const SVF = ${MP.SVF}`, `const TubeSat = ${MP.TubeSat}`,
    `const LFO = ${MP.LFO}`, `const panL = ${MP.panL}`, `const panR = ${MP.panR}`, PROC].join(';\n');
  const n = (key, label, group, def, min, max, step, unit, hint) => ({ key, type: 'number', default: def, min, max, step: step || 0.01, label, group, unit, hint });

  OrganismFactory.define({
    id: 'eravos.piano', domain: 'music', version: '1.0.0', label: 'Piano', icon: '🎹', accent: '#e7b49b', phase: 'P136',
    category: 'Sound sources', blurb: 'Electric and acoustic pianos, modelled live: a hammer, a tine or reed or string, a body. No samples.',
    size: { w: 600, h: 640 }, minSize: { w: 460, h: 480 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.note_in', 'capability.keys'],
    needs: { works_with: ['eravos.timeline', 'eravos.chord-gen', 'eravos.tape-memory', 'eravos.fx-echo', 'eravos.midi-mapper'] },
    hooks: [S.audio_out('pia.hook.audio_out'), S.note_in('pia.hook.note_in'), S.midi_in('pia.hook.midi_in'), S.transport_in('pia.hook.transport_in'),
      S.mod_in('pia.hook.mod_bright', 'brightness'), S.mod_in('pia.hook.mod_trem', 'tremolo')],
    config: [
      { key: 'model', type: 'enum', default: 'tine', options: MODELS, label: 'Model', group: 'BODY', hint: 'tine: the electric piano of soul and lofi · reed: the barkier one · felt: a soft muted upright · upright · honky: a saloon’s, out of tune · grand' },
      n('hardness', 'Hammer', 'STRIKE', 0.45, 0, 1, 0.01, '', 'how hard the hammer is: soft felt … hard (brighter, a little noise); the next strike'),
      n('brightness', 'Bright', 'STRIKE', 0.5, 0, 1, 0.01, '', 'how open the tone is; velocity opens it more'),
      n('bell', 'Bell', 'STRIKE', 0.35, 0, 1, 0.01, '', 'the tine’s or reed’s ring (its 3rd and its bell partial)'),
      n('decay', 'Decay', 'BODY', 3.5, 0.3, 20, 0.01, 's', 'how long a held note rings (60 dB); low notes ring longer, as on a real one'),
      n('release', 'Release', 'BODY', 0.4, 0.02, 4, 0.01, 's', 'how fast the damper stops a note when the key comes up'),
      n('resonance', 'Resonance', 'BODY', 0.3, 0, 1, 0.01, '', 'the body: a soundboard, or the electric piano’s case'),
      n('trem', 'Tremolo', 'MOVE', 0.25, 0, 1, 0.01, '', 'tine: moves left ↔ right · reed: moves the level'),
      n('tremRate', 'Trem rate', 'MOVE', 4.5, 0.5, 12, 0.01, 'Hz'),
      n('drive', 'Drive', 'OUT', 0.15, 0, 1, 0.01, '', 'a tube after it: warmth, then bark'),
      n('width', 'Width', 'OUT', 0.6, 0, 1, 0.01, '', 'the keyboard across the stereo: low notes left, high right'),
      n('level', 'Level', 'OUT', 0.7, 0, 1),
      n('detune', 'String detune', 'STRING+', 0.15, 0, 1, 0.01, '', 'how far apart a note’s 2–3 strings are tuned (honky goes far)'),
      n('inharm', 'Stretch', 'STRING+', 0.5, 0, 1, 0.01, '', 'string stiffness: the upper partials run sharp, as on a real piano'),
      n('sympathetic', 'Sympathetic', 'STRING+', 0.3, 0, 1, 0.01, '', 'with the pedal down, the other strings ring along'),
      n('velCurve', 'Velocity curve', 'PLAY+', 0.5, 0, 1, 0.01, '', 'light … heavy touch'),
      n('keyOff', 'Key-off thump', 'PLAY+', 0.2, 0, 1, 0.01, '', 'the damper landing when a key comes up'),
      n('pedalNoise', 'Pedal noise', 'PLAY+', 0.1, 0, 1, 0.01, '', 'the pedal’s own sound going down and up'),
      n('micX', 'Mic X', 'MIC', 0.5, 0, 1, 0.01, '', 'the mic along the keyboard: bass side … treble side'),
      n('micY', 'Mic Y', 'MIC', 0.5, 0, 1, 0.01, '', 'close (brighter, less body) … far (darker, more body)'),
      n('lid', 'Lid', 'MIC', 0.7, 0, 1, 0.01, '', 'the grand’s lid: closed … open'),
      { key: 'tremSync', type: 'enum', default: 'free', options: Object.keys(SYNC), label: 'Tremolo on the beat', group: 'MOVE+', hint: 'free: Trem rate · or a beat division (needs the transport)' },
      { key: 'pedal', type: 'boolean', default: false, label: 'Sustain pedal', group: 'PLAY', hint: 'down: notes ring on after the keys come up (MIDI Map learns it to CC64)' },
    ],
    // presets are data beside the tool (packs/factory/pack.json) — never in the engine (his rule, 2026-11-06: no packs hard-wired in)
    defaultPreset: 'Tine Classic',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params;
      const out = ac.createGain(); ctx.track(out);
      ctx.port('out', { kind: 'audio', direction: 'out', node: out, label: 'piano' });
      const bMod = ctx.modBus('brightness', { min: -1, max: 1 }), tMod = ctx.modBus('tremolo', { min: -1, max: 1 });
      let node = null, last = { level: 0, sounding: 0, pedal: false }, trig = 0; const ids = new Map(), queue = [];
      const slots = Array.from({ length: SLOTS }, () => ({ id: 0, from: 0, until: 0, up: false }));
      const tremHz = () => { const d = SYNC[P.get('tremSync')]; return d ? (ctx.bpm || 120) / 60 * d : P.get('tremRate'); };
      const value = (k) => k === 'model' ? MODELS.indexOf(P.get('model')) : k === 'tremHz' ? tremHz() : k === 'pedal' ? (P.get('pedal') ? 1 : 0) : P.get(k);
      const values = () => { const v = {}; SET.forEach(k => { v[k] = value(k); }); return v; };
      const prm = (k) => node.parameters.get(k);
      const setAll = (t) => SET.forEach(k => prm(k).setValueAtTime(value(k), t === undefined ? ac.currentTime : t));
      const ready = ctx.loadWorklet('eravos-piano', SRC()).then(() => {
        if (ctx.disposed) return null;
        node = new AudioWorkletNode(ac, 'eravos-piano', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: { values: values() } }); ctx.track(node);
        node.onprocessorerror = (e) => ctx.fault('RUNTIME_003', 'piano worklet stopped: ' + ((e && e.message) || 'processor error'));
        node.connect(out); bMod.connect(prm('brightMod')); tMod.connect(prm('tremMod'));
        node.port.onmessage = (e) => { if (e.data && e.data.type === 'state') { last = e.data; ctx.emitUI('piano', e.data); } };
        setAll(0); queue.splice(0).forEach(f => f()); return node;
      }).catch(e => { ctx.fault('RUNTIME_003', 'piano worklet: ' + e.message); return null; });
      const when = (f) => { if (node) f(); else queue.push(f); };
      const push = (k) => when(() => prm(k).setValueAtTime(value(k), ac.currentTime));
      SET.forEach(k => { if (k === 'tremHz') return; P.onChange(k, () => push(k)); });
      ['tremRate', 'tremSync'].forEach(k => P.onChange(k, () => push('tremHz'))); if (ctx.onBpm) ctx.onBpm(() => push('tremHz'));
      const rel = () => P.get('release') * 1.2 + 0.08;
      // the pedal holds what was let go; let up, those notes are damped
      P.onChange('pedal', () => { if (!P.get('pedal')) { const t = ac.currentTime; slots.forEach(x => { if (x.up && x.until === Infinity) x.until = t + rel(); }); } });
      // a note takes a voice: a free one, else the one that started longest ago
      function on(note, vel, t, dur) {
        const at = Math.max(t || ac.currentTime, ac.currentTime), id = ++trig;
        const sl = slots.find(x => x.until <= at) || slots.reduce((a, b) => (a.from < b.from ? a : b)), i = slots.indexOf(sl);
        sl.id = id; sl.from = at; sl.up = dur !== undefined; sl.until = dur === undefined || P.get('pedal') ? Infinity : at + dur + rel();
        when(() => { prm('note' + i).setValueAtTime(note, at); prm('vel' + i).setValueAtTime(vel === undefined ? 0.8 : vel, at); prm('trig' + i).setValueAtTime(id, at); prm('gate' + i).setValueAtTime(1, at);
          if (dur !== undefined) prm('gate' + i).setValueAtTime(0, at + Math.max(0.005, dur)); });
        return id;
      }
      function off(id, t) { const i = slots.findIndex(x => x.id === id); if (i < 0) return; const at = Math.max(t || ac.currentTime, ac.currentTime); slots[i].up = true; slots[i].until = P.get('pedal') ? Infinity : at + rel();
        when(() => prm('gate' + i).setValueAtTime(0, at)); }
      ctx.onNote((p) => on(p.note, p.velocity, p.time, p.duration));
      ctx.onMidi((p) => { if (p.on) { if (ids.has(p.note)) off(ids.get(p.note)); ids.set(p.note, on(p.note, p.velocity)); } else if (ids.has(p.note)) { off(ids.get(p.note)); ids.delete(p.note); } });
      ctx.audition = (p) => { const k = p.note || 60; if (ids.has(k)) off(ids.get(k)); ids.set(k, on(k, p.velocity || 0.8, ac.currentTime, p.duration > 10 ? undefined : p.duration)); };
      ctx.auditionOff = (p) => { const k = p.note || 60; if (ids.has(k)) { off(ids.get(k)); ids.delete(k); } };
      ctx.allNotesOff = () => { ids.clear(); slots.forEach(x => { x.until = 0; x.up = false; }); if (node) { node.port.postMessage({ type: 'panic' }); for (let i = 0; i < SLOTS; i++) { const g = prm('gate' + i); g.cancelScheduledValues(ac.currentTime); g.setValueAtTime(0, ac.currentTime); } } };
      ctx.onDispose(() => { if (node) { node.port.postMessage({ type: 'panic' }); node.port.onmessage = null; } });
      ctx.internals = { ready, node: () => node, state: () => last, on, off, values };
      return {};
    },
  });
})();

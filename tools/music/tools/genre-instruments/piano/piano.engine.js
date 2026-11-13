/* eravos.piano 1.0.0 — Piano: electric (tine, reed) and acoustic (felt, upright, honky, grand) pianos, modelled live — no sample library
 * (No toys). Spec: tools/music/planned/piano.spec · face: tools/music/planned/piano.ui.md — his "yes" (2026-11-06, to the lofi previews:
 * Tape Memory, Piano, the Lofi setup, Bind on the lane). Built 2026-11-13 (3.182), his words: "then i want the next set of high leverage tools".
 *
 * Built from components (tools/music/components — never re-implemented here). The sound runs in ONE AudioWorklet whose code is the
 * components' own kernel text, so what their tests prove is what plays:
 *   modal-resonator (Modal) the tine and its tonebar, the reed — and the body (a soundboard's or a pickup's modes, not a recording)
 *   karplus-string (KString) 1–3 strings per note, stretched like a piano's, and twelve sympathetic strings the pedal lets ring
 *   filter-svf (SVF) the brightness, opened by how hard the key is struck · env-adsr (ADSR) holding while the key (or pedal) is down,
 *   the release when it lets go · lfo (LFO) the tremolo · stereo-tools (panL / panR) where each note sits and the tremolo's swing
 *   saturator-tube (TubeSat) the drive · voice-allocator (VoiceAllocator) decides, on the main thread, which voice plays which note.
 * Every control is live (his rule: "Tools, keys and values can be adjusted while playing them"): settings are k-rate AudioParams and a
 * sounding note follows them; notes play through 24 voice slots (a trigger count, a gate, a note, a velocity each). */
(function () {
  'use strict';
  const S = OrganismSDK.STD, MP = window.MusicParts;
  const MODELS = ['tine', 'reed', 'felt', 'upright', 'honky', 'grand'], SYNC = ['free', '1/4', '1/8', '1/8 t', '1/16'];
  const SET = ['model', 'hardness', 'brightness', 'bell', 'decay', 'release', 'resonance', 'trem', 'tremHz', 'drive', 'width', 'level', 'detune', 'inharm',
    'sympathetic', 'velCurve', 'keyOff', 'pedalNoise', 'micX', 'micY', 'lid', 'pedal'];
  const SLOTS = 24;
  const DESC = SET.map(k => ({ name: k, defaultValue: 0, minValue: -1e6, maxValue: 1e6, automationRate: 'k-rate' }))
    .concat(['brightMod', 'tremMod', 'bend'].map(k => ({ name: k, defaultValue: 0, minValue: -1e5, maxValue: 1e5, automationRate: 'a-rate' })))
    .concat([].concat(...Array.from({ length: SLOTS }, (_, i) => [{ name: 'trig' + i, defaultValue: 0, minValue: 0, maxValue: 1e9, automationRate: 'a-rate' },
      { name: 'gate' + i, defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'a-rate' }, { name: 'note' + i, defaultValue: 60, minValue: 0, maxValue: 127, automationRate: 'a-rate' },
      { name: 'vel' + i, defaultValue: 0.8, minValue: 0, maxValue: 1, automationRate: 'k-rate' }])));
  const PROC = `
const SET = ${JSON.stringify(SET)}, SLOTS = ${SLOTS};
// the tine (0) and reed (1): their modes, as ratios to the note, relative level and decay share (beam = a clamped tine's own overtones)
const TINE = { r: [1, 2, 3, 4, 5], g: [1, 0.4, 0.18, 0.08, 0.04], d: [1, 0.7, 0.5, 0.4, 0.3] }, BEAM = { r: [6.267, 17.547], g: [0.5, 0.15], d: [0.9, 0.35] };
const REED = { r: [1, 2, 3, 4, 5, 6, 7, 8], g: [1, 0.55, 0.7, 0.3, 0.4, 0.15, 0.22, 0.1], d: [1, 0.8, 0.7, 0.6, 0.5, 0.45, 0.4, 0.35] };
const STRINGS = [0, 0, 1, 2, 3, 3];   // felt 1 · upright 2 · honky 3 · grand 3
const GAIN = [0.0126 * 0.8 * 0.7, 0.0125 * 0.8 * 0.7, 63 * 0.55 * 0.7, 22 * 0.6 * 0.7, 21 * 0.6 * 0.7, 17.8 * 0.65 * 0.7];   // × 0.7: the default Level, now applied after (Level / 0.7)
const BODY = [0.04, 0.04, 0.09, 0.12, 0.12, 0.13];   // how much of the sound rings the body, per model — measured: at Resonance 0.5 the body adds about half the dry level   // per model, measured (a three-note chord at the default level: RMS ≈ 0.1, peaks < 0.6) — the test holds every model within 6 dB
class EravosPiano extends AudioWorkletProcessor {
  static get parameterDescriptors() { return ${JSON.stringify(DESC)}; }
  constructor(o) {
    super();
    const sr = sampleRate, B = 128; this.sr = sr; this.s = Object.assign({}, (o && o.processorOptions && o.processorOptions.values) || {}); this.key = '';
    this.slots = [];
    for (let i = 0; i < SLOTS; i++) { const svf = SVF(); svf.setRate(sr);
      this.slots.push({ i, trig: 0, gate: 0, note: 60, vel: 0.8, v: 0.8, f0: 261.6, amp: ADSR(), modal: Modal(), str: [KString(), KString(), KString()], ns: 0, svf, sleep: true,
        hPos: 1e9, hLen: 64, hAmp: 0, thump: 0, peak: 0, age: 0, gl: 0.7, gr: 0.7, mf: new Float64Array(8), mt: new Float64Array(8), mg: new Float64Array(8), M: new Float32Array(B), F: new Float32Array(B) }); }
    this.lfo = LFO(); this.body = Modal(); this.sym = []; for (let k = 0; k < 12; k++) this.sym.push(KString());
    this.tube = TubeSat(); this.tube.setRate(sr); this.seed = 22222;
    this.mono = new Float32Array(B); this.symOut = new Float32Array(B); this.lastPedal = -1; this.pedalBurst = 0; this.post = 0; this.lvl = new Float32Array(SLOTS);
    this.PS = { frequency: null, detune: [0], resonance: [0.05], gain: [0], mode: [0], stages: [1] };
    this.PT = { drive: [0], bias: [0.3], tone: [0], out: [0], mix: [1] };
    this.port.onmessage = (e) => { if (e.data && e.data.type === 'panic') for (const sl of this.slots) { sl.amp.reset(); sl.gate = 0; sl.sleep = true; } };
    this.apply();
  }
  rnd() { let h = this.seed; h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; this.seed = h; return h / 4294967296 * 2 - 1; }
  acoustic() { return (this.s.model | 0) >= 2; }
  // the settings a sounding note follows (his: "adjusted while playing them")
  apply() {
    const s = this.s, sr = this.sr;
    this.lfo.set({ shape: 0, rate: Math.max(0.05, s.tremHz) }, sr);
    for (const sl of this.slots) { sl.amp.set(0.0005, 30, 1, Math.max(0.02, s.release), sr); if (sl.gate || !sl.sleep) this.voice(sl); }
    // the body: a soundboard's low modes (acoustic) or the pickup's ring (electric) — resonance = how much of it; Mic Y moves into the room
    const ac = this.acoustic(), base = ac ? 110 : 220, R = ac ? [1, 1.47, 2.09, 2.81, 3.62, 4.73, 6.11, 7.6] : [1, 2.756, 5.404, 8.933];
    this.body.set(R.map(x => base * x), R.map((_, k) => (ac ? 0.6 : 0.3) / (1 + k * 0.25)), R.map((_, k) => 0.5 / (1 + k)), sr);
    // the sympathetic strings: one octave (C3–B3), undamped only while the pedal is down
    const ring = s.pedal >= 0.5 ? Math.max(0.5, s.decay * 1.5) : 0.06;
    this.sym.forEach((k, i) => k.set(130.81 * Math.pow(2, i / 12), sr, { t60: ring, bright: 0.5, stretch: 0.3 }));
    this.PT.drive[0] = s.drive * 18;
  }
  bright(sl) { const s = this.s; return Math.max(0, Math.min(1, s.brightness * (0.55 + 0.45 * sl.v) + (0.5 - s.micX) * 0.2 + ((s.model | 0) === 5 ? (s.lid - 0.5) * 0.2 : 0))); }
  // a note's sound, from the settings (called when it starts and when a setting moves while it sounds)
  voice(sl) {
    const s = this.s, sr = this.sr, m = s.model | 0, reg = Math.max(0.3, Math.min(2.5, Math.pow(2, -(sl.note - 60) / 24))), br = this.bright(sl);
    if (m < 2) {
      const T = m === 0 ? TINE : REED, n = T.r.length; let k = 0;
      for (let i = 0; i < n; i++, k++) { const bell = (i === 2 || i === 6) ? 1 + 2 * s.bell * (m === 1 ? 1 : 0) : 1;
        sl.mf[k] = sl.f0 * T.r[i]; sl.mt[k] = Math.max(0.05, s.decay * reg * T.d[i]); sl.mg[k] = T.g[i] * Math.pow(0.675, i) * bell; }   // brightness acts through the filter (a sounding note follows it — axiom 4), not the strike
      if (m === 0) for (let i = 0; i < BEAM.r.length && k < 8; i++, k++) { sl.mf[k] = sl.f0 * BEAM.r[i]; sl.mt[k] = BEAM.d[i] * (0.5 + s.decay / 7); sl.mg[k] = s.bell * BEAM.g[i] * (0.4 + sl.v); }
      const sc = sl.modal.modes ? 1 : 1; sl.modal.set(sl.mf.subarray(0, k), sl.mt.subarray(0, k), sl.mg.subarray(0, k), sr);
      sl.ns = 0;
    } else {
      const n = STRINGS[m], d = s.detune * (m === 4 ? 18 : 4), cents = n === 1 ? [0] : n === 2 ? [-d / 2, d / 2] : [0, d, -d];
      const t60 = Math.max(0.1, s.decay * reg * (m === 2 ? 0.5 : 1)), sb = m === 2 ? br * 0.45 : br;
      for (let j = 0; j < n; j++) sl.str[j].set(sl.f0, sr, { t60, bright: sb, stretch: s.inharm, detune: cents[j] });
      sl.ns = n;
    }
    const pos = Math.max(-1, Math.min(1, (sl.note - 60) / 30)) * s.width; sl.gl = panL(pos) * Math.SQRT2; sl.gr = panR(pos) * Math.SQRT2;
  }
  start(sl, note, vel) {
    const s = this.s; sl.note = note; sl.vel = vel; sl.v = Math.pow(Math.max(0.01, vel), 0.5 + s.velCurve); sl.f0 = 440 * Math.pow(2, (note - 69) / 12);
    const hard = Math.max(0, Math.min(1, s.hardness * 0.7 + sl.v * 0.3)) * ((s.model | 0) === 2 ? 0.5 : 1);
    sl.hLen = Math.max(8, Math.round(this.sr * (0.0045 - 0.0035 * hard))); sl.hPos = 0; sl.hAmp = sl.v; sl.age = 0; sl.peak = 1;
    if (sl.sleep) { sl.modal.reset(); for (const k of sl.str) k.reset(); sl.svf.reset(); }
    sl.sleep = false; this.voice(sl); sl.amp.gate(true); sl.gate = 1;
  }
  process(inputs, outputs, params) {
    const out = outputs[0], L = out[0], R = out[1] || out[0], B = L.length, sr = this.sr, s = this.s;
    let key = ''; for (const k of SET) { const v = params[k][0]; s[k] = v; key += v + ','; } if (key !== this.key) { this.key = key; this.apply(); }
    if (this.lastPedal >= 0 && (s.pedal >= 0.5) !== (this.lastPedal >= 0.5)) this.pedalBurst = Math.round(sr * 0.04); this.lastPedal = s.pedal;
    L.fill(0); if (R !== L) R.fill(0); this.mono.fill(0);
    const ac = this.acoustic(), bm = params.brightMod, bd = params.bend;
    for (let q = 0; q < SLOTS; q++) {
      const sl = this.slots[q], tg = params['trig' + q], gt = params['gate' + q], nt = params['note' + q];
      if (sl.sleep && tg.length === 1 && tg[0] === sl.trig) { this.lvl[q] = 0; continue; }
      const bmod = bm.length > 1 ? bm[0] : bm[0], cut = 400 + 15000 * Math.pow(Math.max(0, Math.min(1, this.bright(sl) + bmod * 0.5)), 2);
      let pk = 0;
      for (let j = 0; j < B; j++) {
        const t = tg.length > 1 ? tg[j] : tg[0], g = gt.length > 1 ? gt[j] : gt[0];
        if (t !== sl.trig) { sl.trig = t; this.start(sl, nt.length > 1 ? nt[j] : nt[0], params['vel' + q][0]); }
        if (g < 0.5 && sl.gate >= 0.5) { sl.gate = 0; sl.amp.gate(false); sl.thump = s.keyOff * 0.15 * sl.v; }
        // the hammer: a short raised-cosine pulse (shorter = harder), its area the velocity
        let x = 0; if (sl.hPos < sl.hLen) { x = sl.hAmp * (1 - Math.cos(2 * Math.PI * sl.hPos / sl.hLen)) / sl.hLen; sl.hPos++; }
        let y = 0;
        if (sl.ns) { for (let k = 0; k < sl.ns; k++) y += sl.str[k].tick(x * 0.5); y /= Math.sqrt(sl.ns); } else y = sl.modal.tick(x * 30);
        if (sl.thump > 1e-5) { y += this.rnd() * sl.thump; sl.thump *= 0.996; }
        sl.M[j] = y; sl.F[j] = cut; sl.age++;
      }
      this.PS.frequency = sl.F; sl.svf.process([sl.M], [sl.M], B, this.PS);
      for (let j = 0; j < B; j++) { const a = sl.amp.next(), y = sl.M[j] * a; L[j] += y * sl.gl; if (R !== L) R[j] += y * sl.gr; this.mono[j] += y; const ay = y < 0 ? -y : y; if (ay > pk) pk = ay; }
      this.lvl[q] = pk;
      if ((sl.amp.done || (sl.age > sr * 0.25 && pk < 1e-6)) && sl.hPos >= sl.hLen) { sl.sleep = true; if (sl.amp.done) sl.gate = 0; }
    }
    // sympathetic strings (acoustic only): what is playing excites them; the pedal lets them ring
    if (ac && s.sympathetic > 0) { for (let j = 0; j < B; j++) { const ex = this.mono[j] * s.sympathetic * 0.02; let y = 0; for (let k = 0; k < 12; k++) y += this.sym[k].tick(ex); this.symOut[j] = y * 0.6; L[j] += this.symOut[j]; if (R !== L) R[j] += this.symOut[j]; } }
    // the body: soundboard or pickup modes, rung by everything; Mic Y moves from the hammers into the room; pedal noise rings it
    const bodyMix = s.resonance * (0.4 + 0.6 * s.micY) * 0.35;
    if (bodyMix > 0 || this.pedalBurst > 0) for (let j = 0; j < B; j++) {
      let ex = this.mono[j] * BODY[s.model | 0]; if (this.pedalBurst > 0) { ex += this.rnd() * s.pedalNoise * 0.04; this.pedalBurst--; }
      const y = this.body.tick(ex) * bodyMix; L[j] += y; if (R !== L) R[j] += y; }
    // the tremolo (electric pianos): the sound swings left and right
    if (!ac) { const tm = params.tremMod; for (let j = 0; j < B; j++) { const d = Math.max(0, Math.min(1, s.trem + (tm.length > 1 ? tm[j] : tm[0]) * 0.5)), l = this.lfo.next() * d;
      L[j] *= panL(l) * Math.SQRT2; if (R !== L) R[j] *= panR(l) * Math.SQRT2; } }
    // each model to one loudness first (its measured gain), so the tube sees the level it was made for; then the drive; then Level
    const mg = GAIN[s.model | 0]; for (let j = 0; j < B; j++) { L[j] *= mg; if (R !== L) R[j] *= mg; }
    if (s.drive > 0.001) this.tube.process([L, R], [L, R], B, this.PT);
    const lv = s.level / 0.7; for (let j = 0; j < B; j++) { L[j] *= lv; if (R !== L) R[j] *= lv; }
    if ((this.post += B) >= 2048) { this.post = 0; this.port.postMessage({ type: 'keys', levels: Array.from(this.lvl), notes: this.slots.map(x => x.sleep ? -1 : x.note) }); }
    return true;
  }
}
registerProcessor('eravos-piano', EravosPiano);`;
  const SRC = () => [`const Modal = ${MP.Modal}`, MP.KSTRING_SRC, `const SVF = ${MP.SVF}`, `const ADSR = ${MP.ADSR}`, `const LFO = ${MP.LFO}`, `const panL = ${MP.panL}`, `const panR = ${MP.panR}`,
    `const TubeSat = ${MP.TubeSat}`, PROC].join(';\n');
  const n = (key, label, group, def, min, max, step, unit, hint) => ({ key, type: 'number', default: def, min, max, step: step || 0.01, label, group, unit, hint });

  OrganismFactory.define({
    id: 'eravos.piano', domain: 'music', version: '1.0.0', label: 'Piano', icon: '🎹', accent: '#e7b49b', phase: 'P182',
    category: 'Genre instruments', blurb: 'Electric and acoustic pianos, modelled live: a hammer, a tine or reed or string, a body. No samples.',
    size: { w: 600, h: 640 }, minSize: { w: 460, h: 480 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.note_in'],
    needs: { works_with: ['eravos.timeline', 'eravos.chord-gen', 'eravos.tape-memory', 'eravos.fx-echo', 'eravos.sequencer', 'eravos.midi-mapper'] },
    hooks: [S.audio_out('pia.hook.audio_out'), S.note_in('pia.hook.note_in'), S.midi_in('pia.hook.midi_in'), S.transport_in('pia.hook.transport_in'), S.theory_in('pia.hook.theory_in'),
      S.mod_in('pia.hook.mod_bright', 'brightness'), S.mod_in('pia.hook.mod_trem', 'tremolo')],
    config: [
      { key: 'model', type: 'enum', default: 'tine', options: MODELS, label: 'Model', group: 'BODY', hint: 'tine: the electric piano of soul and lofi · reed: barkier · felt: the soft muted upright · upright · honky: three strings far apart · grand', element: 'own:piano' },
      Object.assign(n('hardness', 'Hammer', 'STRIKE', 0.45, 0, 1, 0.01, '', 'how hard the hammer is: harder = a shorter strike, brighter — each note as it is struck'), { onset: true, element: 'own:hammer' }), Object.assign(n('brightness', 'Bright', 'STRIKE', 0.5, 0, 1, 0.01, '', 'opened further the harder you play'), { element: 'filter-svf' }),
      Object.assign(n('bell', 'Bell', 'STRIKE', 0.35, 0, 1, 0.01, '', 'the tine’s or reed’s ring'), { element: 'modal-resonator' }),
      Object.assign(n('decay', 'Decay', 'BODY', 3.5, 0.3, 20, 0.01, 's', 'how long a held note rings (low notes longer)'), { element: ['karplus-string', 'modal-resonator'] }), Object.assign(n('release', 'Release', 'BODY', 0.4, 0.02, 4, 0.01, 's'), { element: 'env-adsr' }), Object.assign(n('resonance', 'Resonance', 'BODY', 0.3, 0, 1, 0.01, '', 'the body: a soundboard, or the pickup’s ring'), { element: 'modal-resonator' }),
      Object.assign(n('trem', 'Tremolo', 'MOVE', 0.25, 0, 1, 0.01, '', 'the electric pianos swing left and right'), { element: 'lfo' }), Object.assign(n('tremRate', 'Trem rate', 'MOVE', 4.5, 0.5, 12, 0.01, 'Hz'), { element: 'lfo' }),
      Object.assign(n('drive', 'Drive', 'OUT', 0.15, 0, 1, 0.01, '', 'a tube pushed: warmth, then grit'), { element: 'saturator-tube' }), Object.assign(n('width', 'Width', 'OUT', 0.6, 0, 1, 0.01, '', 'low notes left, high notes right'), { element: 'stereo-tools' }), Object.assign(n('level', 'Level', 'OUT', 0.7, 0, 1.5), { element: 'own:out' }),
      Object.assign(n('detune', 'String detune', 'STRING+', 0.15, 0, 1, 0.01, '', 'the strings of one note apart (honky: far)'), { element: 'karplus-string' }), Object.assign(n('inharm', 'Stretch', 'STRING+', 0.5, 0, 1, 0.01, '', 'a stiff string’s overtones run sharp'), { element: 'karplus-string' }),
      Object.assign(n('sympathetic', 'Sympathetic', 'STRING+', 0.3, 0, 1, 0.01, '', 'other strings ring with what you play — more with the pedal down'), { element: 'karplus-string' }),
      Object.assign(n('velCurve', 'Velocity curve', 'PLAY+', 0.5, 0, 1, 0.01, '', 'soft: a light touch is loud · hard: you have to dig in — each note as it is struck'), { onset: true, element: 'own:hammer' }), Object.assign(n('keyOff', 'Key-off thump', 'PLAY+', 0.2, 0, 1, 0.01, '', 'the key coming back up'), { element: 'own:hammer' }),
      Object.assign(n('pedalNoise', 'Pedal noise', 'PLAY+', 0.1, 0, 1, 0.01, '', 'the dampers lifting and falling'), { element: 'own:pedal' }),
      Object.assign(n('micX', 'Mic X', 'MIC', 0.5, 0, 1, 0.01, '', 'over the hammers (bright) … far end (dark)'), { element: 'own:mic' }), Object.assign(n('micY', 'Mic Y', 'MIC', 0.5, 0, 1, 0.01, '', 'close … into the room (more body)'), { element: 'own:mic' }), Object.assign(n('lid', 'Lid', 'MIC', 0.7, 0, 1, 0.01, '', 'the grand’s lid: open is brighter'), { element: 'own:mic' }),
      { key: 'tremSync', type: 'enum', default: 'free', options: SYNC, label: 'Tremolo on the beat', group: 'MOVE+', hint: 'free: Trem rate · or locked to the song’s tempo', element: 'lfo' },
      { key: 'pedal', type: 'boolean', default: false, label: 'Sustain pedal', group: 'PLAY', hint: 'notes ring after you let go; sympathetic strings open (bind a MIDI pedal with the MIDI Mapper)', element: 'own:pedal' },
    ],
    // presets are data beside the tool (packs/factory/pack.json) — never in the engine
    defaultPreset: 'Tine Classic',
    // separating the elements for synthesis (specs/eravos.ui-field.spec ADDENDUM 2026-11-13 (3), his words: "make sure you are seperating the
    // elements for synthesis"): each control → the component it drives (as announced) or the tool's own part (own:<name>)
    faceKeys: ['hardness', 'brightness', 'bell', 'decay', 'release', 'resonance', 'trem', 'tremRate', 'drive', 'width', 'level'],   // today's face (the rest: More depth)
    elementOrder: ['own:piano', 'own:hammer', 'modal-resonator', 'karplus-string', 'filter-svf', 'env-adsr', 'own:pedal', 'lfo', 'saturator-tube', 'stereo-tools', 'own:mic', 'own:tempo', 'own:out'],   // the sound's flow, own parts placed
    elementWords: { 'own:piano': 'PIANO', 'own:hammer': 'HAMMER', 'modal-resonator': 'TINE · REED · BODY', 'karplus-string': 'STRINGS', 'filter-svf': 'BRIGHTNESS',
      'env-adsr': 'HOLD · RELEASE', 'lfo': 'TREMOLO', 'saturator-tube': 'TUBE', 'stereo-tools': 'STEREO', 'own:pedal': 'PEDAL', 'own:mic': 'MIC', 'own:tempo': 'TEMPO', 'own:out': 'OUT' },
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params;
      const out = ac.createGain(); ctx.track(out); ctx.port('out', { kind: 'audio', direction: 'out', node: out, label: 'piano' });
      const mods = { bright: ctx.modBus('brightness', { min: -1, max: 1 }), trem: ctx.modBus('tremolo', { min: -1, max: 1 }) };
      let node = null; const queue = [];
      const BEATS = { '1/4': 1, '1/8': 0.5, '1/8 t': 1 / 3, '1/16': 0.25 };
      const tremHz = () => { const sy = P.get('tremSync'); return sy === 'free' ? P.get('tremRate') : (ctx.bpm || 120) / 60 / BEATS[sy]; };
      const valueOf = (k) => k === 'model' ? Math.max(0, MODELS.indexOf(P.get('model'))) : k === 'tremHz' ? tremHz() : typeof P.get(k) === 'boolean' ? (P.get(k) ? 1 : 0) : P.get(k);
      const values = () => { const v = {}; SET.forEach(k => { v[k] = valueOf(k); }); return v; };
      const prm = (k) => node.parameters.get(k);
      let keys = { levels: [], notes: [] };
      const ready = ctx.loadWorklet('eravos-piano', SRC()).then(() => {
        if (ctx.disposed) return null;
        node = new AudioWorkletNode(ac, 'eravos-piano', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: { values: values() } }); ctx.track(node);
        node.onprocessorerror = (er) => ctx.fault('RUNTIME_003', 'piano worklet stopped: ' + ((er && er.message) || 'processor error'));
        node.connect(out); mods.bright.connect(prm('brightMod')); mods.trem.connect(prm('tremMod')); if (ctx.bendInto) ctx.bendInto(prm('bend'));
        node.port.onmessage = (m) => { if (m.data && m.data.type === 'keys') { keys = m.data; ctx.emitUI('keys', keys); } };
        SET.forEach(k => prm(k).setValueAtTime(valueOf(k), 0)); queue.splice(0).forEach(f => f()); return node;
      }).catch(er => { ctx.fault('RUNTIME_003', 'piano worklet: ' + er.message); return null; });
      const when = (f) => { if (node) f(); else queue.push(f); };
      const setK = (k) => when(() => prm(k).setValueAtTime(valueOf(k), ac.currentTime));
      SET.filter(k => k !== 'tremHz').forEach(k => P.onChange(k, () => setK(k)));
      ['tremRate', 'tremSync'].forEach(k => P.onChange(k, () => setK('tremHz'))); if (ctx.onBpm) ctx.onBpm(() => setK('tremHz'));
      // ---- which voice plays which note (voice-allocator); the pedal holds what is let go
      const VA = MP.VoiceAllocator(SLOTS); VA.setMode('poly'); VA.setSteal('oldest'); let trig = 0;
      const sync = () => VA.release(P.get('release') * 1.5 + 0.05); sync(); P.onChange('release', sync);
      const sustained = new Set();
      function noteOn(note, vel, t, dur) {
        const at = Math.max(t || ac.currentTime, ac.currentTime), r = VA.noteOn(note, vel, at), i = r.voice; if (i < 0) return { i };
        when(() => { prm('note' + i).setValueAtTime(note, at); prm('vel' + i).setValueAtTime(vel === undefined ? 0.8 : vel, at); prm('trig' + i).setValueAtTime(++trig, at); prm('gate' + i).setValueAtTime(1, at); });
        if (dur !== undefined) { const end = at + Math.max(0.005, dur); if (P.get('pedal')) sustained.add(note); else { const o = VA.noteOff(note, end); if (o.voice >= 0) when(() => prm('gate' + o.voice).setValueAtTime(0, end)); } }
        return { i };
      }
      function noteOff(note, t) { const at = Math.max(t || ac.currentTime, ac.currentTime); if (P.get('pedal')) { sustained.add(note); return; }
        const o = VA.noteOff(note, at); if (o.voice >= 0) when(() => prm('gate' + o.voice).setValueAtTime(0, at)); }
      P.onChange('pedal', (on) => { if (on) return; const at = ac.currentTime; sustained.forEach(nt => { const o = VA.noteOff(nt, at); if (o.voice >= 0) when(() => prm('gate' + o.voice).setValueAtTime(0, at)); }); sustained.clear(); });
      function allOff() { VA.reset(); sustained.clear(); if (node) { node.port.postMessage({ type: 'panic' }); for (let i = 0; i < SLOTS; i++) { const g = prm('gate' + i); g.cancelScheduledValues(ac.currentTime); g.setValueAtTime(0, ac.currentTime); } } }
      ctx.onNote((p) => noteOn(p.note, p.velocity, p.time, p.duration));
      ctx.onMidi((p) => p.on ? noteOn(p.note, p.velocity) : noteOff(p.note));
      ctx.audition = (p) => { const k = p.note || 60; if (p.duration !== undefined && p.duration < 30) return noteOn(k, p.velocity || 0.8, ac.currentTime, p.duration); noteOn(k, p.velocity || 0.8); };
      ctx.auditionOff = (p) => noteOff(p.note || 60);
      ctx.allNotesOff = allOff;
      ctx.onDispose(() => { if (node) { node.port.postMessage({ type: 'panic' }); node.port.onmessage = null; } });
      ctx.internals = { ready, node: () => node, keys: () => keys, noteOn, noteOff, values, allocator: VA };
      return {};
    },
  });
})();

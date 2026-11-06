/* eravos.retro-dco 1.0.0 — Retro DCO (spec: tools/music/planned/retro-dco.spec · UI: tools/music/planned/retro-dco.ui.md, approved 2026-11-06:
 * "Build it."). Retro Poly's face and sound family, rebuilt from the shared parts, with the depth of the 80s DCO polys.
 *
 * Built from components (tools/music/components — never re-implemented here). The sound runs in ONE AudioWorklet whose code is the
 * components' own kernel text, so what their tests prove is what plays:
 *   osc-va (VA) saw + pulse per voice, polyBLEP · osc-sub (Sub) · osc-noise (Noise) · unison-stack (UnisonStack) the unison layout ·
 *   filter-svf (SVF) 24 dB, or filter-ladder (Ladder) with drive in the loop · env-adsr (ADSR) amp + filter · lfo (LFO) the LFO and the
 *   PWM LFO · random-source (Random) each voice's own drift · bbd-line (BBD) + ensemble-core (Ensemble) the chorus · filter-svf HPF.
 *   voice-allocator (VoiceAllocator) decides, on the main thread, which voice card plays which note.
 * Every control is live (his rule: "Tools, keys and values can be adjusted while playing them"): settings are k-rate AudioParams;
 * notes play through 16 voice cards (a trigger count, a gate, a note, a velocity each), sample-true live and offline. */
(function () {
  'use strict';
  const S = OrganismSDK.STD, MP = window.MusicParts;
  const E = {
    voice: ['poly', 'mono', 'legato', 'unison'], filter: ['svf 24', 'ladder'], chorus: ['off', 'I', 'II', 'I+II'],
    lfoShape: ['sine', 'triangle', 'square', 'saw', 'random'], detuneCurve: ['linear', 'exp', 'supersaw'], subShape: ['sine', 'triangle', 'square', 'rounded square'],
    subOct: ['-1', '-2'], noiseColour: ['white', 'pink', 'brown'], steal: ['oldest', 'quietest', 'same-note', 'lowest', 'highest'],
  };
  const LFO_SHAPE = { sine: 0, triangle: 1, square: 4, saw: 2, random: 6 };
  const SET = ['saw', 'pulse', 'width', 'pwm', 'pwmRate', 'sub', 'noise', 'drift', 'octave', 'filter', 'cutoff', 'res', 'drive', 'envAmt', 'keytrack', 'hpf',
    'fA', 'fD', 'fS', 'attack', 'decay', 'sustain', 'release', 'voice', 'glide', 'level', 'cards', 'cardSeed', 'pmEnvPitch', 'pmEnvPw', 'pmSubPitch', 'sync', 'syncRatio',
    'lfoShape', 'lfoRate', 'lfoDelay', 'lfoPitch', 'lfoCutoff', 'lfoPw', 'velCutoff', 'velAmp', 'chorus', 'chorusMix', 'bbdHiss', 'bbdStages', 'unison', 'detune',
    'detuneCurve', 'spread', 'subShape', 'subOct', 'noiseColour'];
  const SLOTS = 16;
  const DESC = SET.map(k => ({ name: k, defaultValue: 0, minValue: -1e6, maxValue: 1e6, automationRate: 'k-rate' }))
    .concat(['cutoffMod', 'pwmMod', 'resMod', 'driftMod'].map(k => ({ name: k, defaultValue: 0, minValue: -1e5, maxValue: 1e5, automationRate: 'a-rate' })))
    .concat([].concat(...Array.from({ length: SLOTS }, (_, i) => [{ name: 'trig' + i, defaultValue: 0, minValue: 0, maxValue: 1e9, automationRate: 'a-rate' },
      { name: 'gate' + i, defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'a-rate' }, { name: 'note' + i, defaultValue: 60, minValue: -24, maxValue: 160, automationRate: 'a-rate' },
      { name: 'vel' + i, defaultValue: 0.8, minValue: 0, maxValue: 1, automationRate: 'k-rate' }])));
  const PROC = `
const SET = ${JSON.stringify(SET)}, SLOTS = ${SLOTS}, HPF = [0, 120, 260, 520], GAIN = 1.5;   // measured: the default preset at Retro Poly's loudness; six notes of everything at full peak ~0.7
class EravosRetroDCO extends AudioWorkletProcessor {
  static get parameterDescriptors() { return ${JSON.stringify(DESC)}; }
  constructor(o) {
    super();
    const sr = sampleRate, B = 128, opt = (o && o.processorOptions) || {}; this.sr = sr; this.modes = opt.modes || {};
    this.va = VA(); this.lfo = LFO(); this.pwmLfo = LFO(); this.noise = Noise(); this.noise.setRate(sr); this.noise.reset(7);
    this.uni = UnisonStack(); this.hp = SVF(); this.hp.setRate(sr); this.bbd = BBD(); this.bbd.setRate(sr, 0.05); this.ens = Ensemble(); this.ens.setRate(sr);
    this.s = Object.assign({}, opt.values || {}); this.key = '';
    this.slots = [];
    for (let i = 0; i < SLOTS; i++) { const svf = SVF(), lad = Ladder(), rnd = Random(); svf.setRate(sr); lad.setRate(sr); rnd.setRate(sr);
      this.slots.push({ i, trig: 0, gate: 0, note: 60, vel: 0.8, lf: 0, lt: 0, on: 0, ph: new Float64Array(16), mph: new Float64Array(16), sub: Sub(), subY: 0,
        amp: ADSR(), fenv: ADSR(), svf, lad, rnd, cardC: 0, cardF: 0, cardE: 1,
        L: new Float32Array(B), R: new Float32Array(B), A: new Float32Array(B), F: new Float32Array(B), D: new Float32Array(B) }); }
    this.lfoB = new Float32Array(B); this.pwB = new Float32Array(B); this.nz = new Float32Array(B); this.mono = new Float32Array(B); this.bo = new Float32Array(B); this.wl = new Float32Array(B); this.wr = new Float32Array(B);
    // the components' per-call parameter objects, made once (no allocation in process)
    this.PS = { frequency: null, detune: [0], resonance: [0], gain: [0], mode: [0], stages: [2] };
    this.PL = { frequency: null, detune: [0], resonance: [0], drive: [0], bass: [1], mode: [0] };   // full bass compensation: the lows stay as the resonance rises
    this.PH = { frequency: [10], detune: [0], resonance: [0], gain: [0], mode: [1], stages: [1] };
    this.PR = { rate: [0.35], smooth: [1], dist: [0], a: [2], b: [2], seed: [1], depth: [1], offset: [0], unipolar: [0], density: [0], eventLen: [0.01] };
    this.PN = { colour: [0], density: [1], rate: [1], tilt: [0], width: [0], level: [1] };
    this.PB = { time: [0.003], stages: [256], hiss: [-84], bleed: [-120], compand: [1] };
    this.PE = { taps: [2], base: [0.5], depth: [1.85], rate: [0.513], depth2: [0], rate2: [6], shape: [1], spread: [1], mix: [1] };
    this.count = 0; this.post = 0; this.lvl = new Float32Array(SLOTS);
    this.port.onmessage = (e) => { if (e.data && e.data.type === 'panic') for (const sl of this.slots) { sl.amp.reset(); sl.fenv.reset(); sl.gate = 0; } };
    this.apply();
  }
  // each card's own small offsets, seeded (Card spread × Card seed): pitch ±8 cents, cutoff ±300 cents, envelope times ±20 %
  cards() { const s = this.s; for (const sl of this.slots) { let h = ((s.cardSeed | 0) * 2654435761 + sl.i * 40503 + 1) >>> 0;
    const r = () => { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h / 4294967296 * 2 - 1; };
    sl.cardC = r() * 8 * s.cards; sl.cardF = r() * 300 * s.cards; sl.cardE = 1 + r() * 0.2 * s.cards; sl.rndSeed = ((s.cardSeed | 0) * 31 + sl.i + 1) >>> 0; } }
  apply() {
    const s = this.s, sr = this.sr;
    this.lfo.set({ shape: s.lfoShape | 0, rate: s.lfoRate }, sr); this.pwmLfo.set({ shape: 1, rate: s.pwmRate }, sr);
    this.cards();
    for (const sl of this.slots) { sl.amp.set(s.attack * sl.cardE, s.decay * sl.cardE, s.sustain, s.release * sl.cardE, sr); sl.fenv.set(s.fA * sl.cardE, s.fD * sl.cardE, s.fS, s.release * sl.cardE, sr); }
    const n = (s.voice | 0) === 3 ? Math.max(2, s.unison | 0) : 1; this.uni.layout(n, s.detune, s.detuneCurve | 0, s.spread, 0.5, 2, 9);
    const m = this.modes[['off', 'juno I', 'juno II', 'juno I+II'][s.chorus | 0]];
    if (m) { this.PE.taps[0] = m.taps; this.PE.depth[0] = m.depth; this.PE.rate[0] = m.rate; this.PE.depth2[0] = m.depth2 || 0; this.PE.shape[0] = m.shape; this.PE.spread[0] = m.spread;
      this.PB.time[0] = Math.max(0.0005, (m.base - 0.5) / 1000); }
    this.PB.stages[0] = s.bbdStages; this.PB.hiss[0] = s.bbdHiss; this.PN.colour[0] = [0, 1, 2][s.noiseColour | 0];
    this.PH.frequency[0] = HPF[s.hpf | 0] || 10;
  }
  start(sl, note, vel, retrig) {
    const s = this.s, glide = s.glide > 0 && (s.voice | 0) !== 0;
    sl.note = note; sl.vel = vel; sl.lt = Math.log2(440) + (note - 69) / 12 + (s.octave | 0);
    if (!glide || sl.amp.done) sl.lf = sl.lt;
    if (!retrig) return;
    sl.on = 0; if (sl.amp.done) { sl.svf.reset(); sl.lad.reset(); sl.sub.reset(); sl.rnd.reset(sl.rndSeed); }
    if ((s.voice | 0) === 3) for (let i = 0; i < this.uni.count; i++) sl.ph[i] = this.uni.phase[i];
    sl.amp.gate(true); sl.fenv.gate(true); sl.gate = 1; this.count++;
  }
  process(inputs, outputs, params) {
    const out = outputs[0], L = out[0], R = out[1] || out[0], B = L.length, sr = this.sr, s = this.s;
    let key = ''; for (const k of SET) { const v = params[k][0]; s[k] = v; key += v + ','; } if (key !== this.key) { this.key = key; this.apply(); }
    L.fill(0); if (R !== L) R.fill(0);
    const va = this.va, uni = this.uni, cm = params.cutoffMod, pm = params.pwmMod, rm = params.resMod, dm = params.driftMod;
    for (let j = 0; j < B; j++) { this.lfoB[j] = this.lfo.next(); this.pwB[j] = this.pwmLfo.next(); }
    if (s.noise > 0) this.noise.process([this.nz], B, this.PN);
    const ladder = (s.filter | 0) === 1, n = uni.count, sync = s.sync >= 0.5, ratio = Math.max(1, s.syncRatio), dly = Math.max(0.001, s.lfoDelay) * sr;
    const subOct = (s.subOct | 0) === 1 ? -2 : -1, subShape = s.subShape | 0, gk = s.glide > 0 ? 1 - Math.exp(-1 / (s.glide * sr / 4)) : 1;
    for (let q = 0; q < SLOTS; q++) {
      const sl = this.slots[q], tg = params['trig' + q], gt = params['gate' + q], nt = params['note' + q];
      const quiet = sl.amp.done && tg.length === 1 && tg[0] === sl.trig && gt.length === 1 && gt[0] < 0.5 && sl.gate < 0.5;
      if (quiet) { this.lvl[q] = 0; continue; }
      this.PR.seed[0] = sl.rndSeed || 1; sl.rnd.process([], [sl.D], B, this.PR);
      for (let j = 0; j < B; j++) {
        const t = tg.length > 1 ? tg[j] : tg[0], g = gt.length > 1 ? gt[j] : gt[0], nn = nt.length > 1 ? nt[j] : nt[0];
        if (t !== sl.trig) { sl.trig = t; this.start(sl, nn, params['vel' + q][0], true); }
        else if (nn !== sl.note) this.start(sl, nn, sl.vel, false);   // legato: the note moves, no retrigger
        if (g < 0.5 && sl.gate >= 0.5) { sl.gate = 0; sl.amp.gate(false); sl.fenv.gate(false); }
        sl.lf += (sl.lt - sl.lf) * gk; sl.on++;
        const fade = sl.on >= dly ? 1 : sl.on / dly, l = this.lfoB[j] * fade, fe = sl.fenv.next(), a = sl.amp.next();
        const cents = sl.cardC + (sl.D[j] * 12 * s.drift) + (dm.length > 1 ? dm[j] : dm[0]) * 12 + l * s.lfoPitch + fe * s.pmEnvPitch * 100 + sl.subY * s.pmSubPitch * 1200;
        const f = Math.pow(2, sl.lf + cents / 1200);
        let w = s.width + s.pwm * 0.45 * this.pwB[j] + l * s.lfoPw * 0.45 + fe * s.pmEnvPw * 0.45 + (pm.length > 1 ? pm[j] : pm[0]) * 0.45; w = w < 0.02 ? 0.02 : w > 0.98 ? 0.98 : w;
        let yl = 0, yr = 0;
        for (let i = 0; i < n; i++) {
          const dt = Math.min(0.49, f * (n > 1 ? Math.pow(2, uni.cents[i] / 1200) : 1) / sr), d2 = sync ? Math.min(0.49, dt * ratio) : dt;
          let ph = sl.ph[i];
          if (sync) { let m = sl.mph[i] + dt; if (m >= 1) { m -= 1; ph = 0; } sl.mph[i] = m; }
          const x = s.saw * va.saw(ph, d2) + s.pulse * va.pulse(ph, d2, w);
          ph += d2; if (ph >= 1) ph -= 1; sl.ph[i] = ph;
          if (n > 1) { yl += x * uni.gainL[i]; yr += x * uni.gainR[i]; } else { yl += x * 0.5; yr += x * 0.5; }
        }
        const sb = sl.sub.next(f, sr, subOct, subShape); sl.subY = sb;
        const extra = sb * s.sub * 0.5 + (s.noise > 0 ? this.nz[j] * s.noise * 0.5 : 0);
        sl.L[j] = yl + extra; sl.R[j] = yr + extra;
        sl.A[j] = a * (1 - s.velAmp + s.velAmp * sl.vel);
        const c = s.cutoff * Math.pow(2, s.keytrack * (sl.lf - 8.1) + s.envAmt * fe * 5 + s.velCutoff * (sl.vel - 0.8) * 2 + (l * s.lfoCutoff + sl.cardF + (cm.length > 1 ? cm[j] : cm[0])) / 1200);
        sl.F[j] = c < 20 ? 20 : c > 20000 ? 20000 : c;
      }
      const rs = Math.max(0, Math.min(1, s.res + (rm.length > 1 ? rm[0] : rm[0])));
      if (ladder) { this.PL.frequency = sl.F; this.PL.resonance[0] = rs; this.PL.drive[0] = s.drive; sl.lad.process([sl.L, sl.R], [sl.L, sl.R], B, this.PL); }
      else { this.PS.frequency = sl.F; this.PS.resonance[0] = Math.min(0.97, rs); sl.svf.process([sl.L, sl.R], [sl.L, sl.R], B, this.PS); }
      for (let j = 0; j < B; j++) { L[j] += sl.L[j] * sl.A[j]; if (R !== L) R[j] += sl.R[j] * sl.A[j]; }
      this.lvl[q] = sl.amp.level;
    }
    if ((s.hpf | 0) > 0) this.hp.process([L, R], [L, R], B, this.PH);
    if ((s.chorus | 0) > 0) {
      for (let j = 0; j < B; j++) this.mono[j] = 0.5 * (L[j] + R[j]);
      this.bbd.process([this.mono], [this.bo], B, this.PB); this.ens.process([this.bo], [this.wl, this.wr], B, this.PE);
      const mx = s.chorusMix; for (let j = 0; j < B; j++) { L[j] = L[j] * (1 - mx) + this.wl[j] * mx; if (R !== L) R[j] = R[j] * (1 - mx) + this.wr[j] * mx; }
    }
    const gg = s.level * GAIN;   // set by measuring against Retro Poly (see the test) — the level is the only scaling
    for (let j = 0; j < B; j++) { L[j] *= gg; if (R !== L) R[j] *= gg; }
    if ((this.post += B) >= 2048) { this.post = 0; this.port.postMessage({ type: 'cards', levels: Array.from(this.lvl) }); }
    return true;
  }
}
registerProcessor('eravos-retro-dco', EravosRetroDCO);`;
  const SRC = () => [`const VA = ${MP.VA}`, `const Sub = ${MP.Sub}`, `const Noise = ${MP.Noise}`, `const UnisonStack = ${MP.UnisonStack}`, `const SVF = ${MP.SVF}`,
    `const Ladder = ${MP.Ladder}`, `const ADSR = ${MP.ADSR}`, `const LFO = ${MP.LFO}`, `const Random = ${MP.Random}`, `const rng = ${MP.rng}`, `const BBD = ${MP.BBD}`,
    `const Ensemble = ${MP.Ensemble}`, PROC].join(';\n');
  const n = (key, label, group, def, min, max, step, unit, hint) => ({ key, type: 'number', default: def, min, max, step: step || 0.01, label, group, unit, hint });
  const e = (key, label, group, def, hint) => ({ key, type: 'enum', options: E[key], default: def, label, group, hint });
  const it = (key, label, group, def, min, max, hint) => ({ key, type: 'integer', default: def, min, max, label, group, hint });

  OrganismFactory.define({
    id: 'eravos.retro-dco', domain: 'music', version: '1.0.0', label: 'Retro DCO', icon: '🌃', accent: '#ff2bd6', phase: 'P139',
    category: 'Genre instruments', blurb: '80s DCO poly, rebuilt from parts: voice cards, ladder or SVF, poly-mod, the Juno chorus with its bucket brigade.',
    size: { w: 600, h: 780 }, minSize: { w: 460, h: 560 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.note_in', 'capability.lead_voice'],
    needs: { works_with: ['eravos.timeline', 'eravos.retro-poly', 'eravos.chord-gen', 'eravos.fx-echo', 'eravos.tape-memory', 'eravos.lfo'] },
    hooks: [S.audio_out('rd.hook.audio_out'), S.note_in('rd.hook.note_in'), S.midi_in('rd.hook.midi_in'), S.theory_in('rd.hook.theory_in'), S.transport_in('rd.hook.transport_in'),
      S.mod_in('rd.hook.mod_cutoff', 'cutoff'), S.mod_in('rd.hook.mod_pwm', 'pwm'), S.mod_in('rd.hook.mod_res', 'res'), S.mod_in('rd.hook.mod_drift', 'drift')],
    config: [
      e('voice', 'Voice', 'VOICE', 'poly', 'poly: a voice card per note · mono: one, every note retriggers · legato: one, glides over held keys · unison: one note, many voices'),
      e('filter', 'Filter', 'VCF', 'svf 24', 'svf 24: the clean 24 dB low-pass · ladder: the transistor ladder, with Drive inside its loop'),
      e('chorus', 'Chorus', 'FX', 'I', 'the Juno chorus: bucket brigade + two taps, I slow, II faster, I+II the fast shimmer'),
      { key: 'hold', type: 'boolean', default: false, label: 'Hold', group: 'VOICE', hint: 'keys you let go keep sounding until you play the next one' },
      n('saw', 'Saw', 'DCO', 0.7, 0, 1), n('pulse', 'Pulse', 'DCO', 0.5, 0, 1), n('width', 'Width', 'DCO', 0.35, 0.05, 0.5, 0.001), n('pwm', 'PWM', 'DCO', 0.3, 0, 1),
      n('pwmRate', 'PWM rate', 'DCO', 0.6, 0.05, 8, 0.01, 'Hz'), n('sub', 'Sub', 'DCO', 0.3, 0, 1), n('noise', 'Noise', 'DCO', 0, 0, 1), n('drift', 'Drift', 'DCO', 0.3, 0, 1, 0.01, '', 'each voice wanders on its own (up to ±12 cents)'),
      it('octave', 'Octave', 'DCO', 0, -4, 4),
      n('cutoff', 'Cutoff', 'VCF', 2400, 60, 16000, 1, 'Hz'), n('res', 'Reso', 'VCF', 0.35, 0, 1), n('drive', 'Drive', 'VCF', 0, 0, 24, 0.1, 'dB', 'the ladder pushed: louder inside, warmer out (the level stays)'),
      n('envAmt', 'Env amt', 'VCF', 0.5, -1, 1), n('keytrack', 'Keytrack', 'VCF', 0.5, 0, 1), it('hpf', 'HPF', 'VCF', 0, 0, 3),
      n('fA', 'F att', 'ENV', 0.005, 0.001, 4, 0.001, 's'), n('fD', 'F dec', 'ENV', 0.35, 0.01, 6, 0.01, 's'), n('fS', 'F sus', 'ENV', 0.3, 0, 1),
      n('attack', 'Attack', 'ENV', 0.005, 0.001, 5, 0.001, 's'), n('decay', 'Decay', 'ENV', 0.5, 0.01, 6, 0.01, 's'), n('sustain', 'Sustain', 'ENV', 0.7, 0, 1), n('release', 'Release', 'ENV', 0.4, 0.01, 8, 0.01, 's'),
      n('glide', 'Glide', 'VOICE', 0, 0, 3, 0.001, 's'), n('level', 'Level', 'OUT', 0.6, 0, 1.5),
      { key: 'arp', type: 'enum', options: ['off', 'up', 'down', 'up-down', 'random', 'played'], default: 'off', label: 'Arp', group: 'ARP' },
      { key: 'arpDiv', type: 'enum', options: ['1/4', '1/8', '1/16', '1/8t', '1/16t'], default: '1/16', label: 'Rate', group: 'ARP' },
      it('arpOct', 'Octaves', 'ARP', 1, 1, 3), n('arpGate', 'Gate', 'ARP', 0.55, 0.05, 1), { key: 'arpHold', type: 'boolean', default: false, label: 'Latch', group: 'ARP' },
      it('voices', 'Voices', 'CARDS', 6, 1, 16, 'how many voice cards (notes at once)'), n('cards', 'Card spread', 'CARDS', 0.25, 0, 1, 0.01, '', 'each card its own pitch, filter and envelope offset — like old voice boards'),
      it('cardSeed', 'Card seed', 'CARDS', 1, 1, 9999, 'another seed, another set of cards'), e('steal', 'Steal', 'CARDS', 'oldest', 'when every card is busy, which note gives way'),
      n('pmEnvPitch', 'Env → pitch', 'POLY-MOD', 0, -24, 24, 0.1, 'st'), n('pmEnvPw', 'Env → width', 'POLY-MOD', 0, -1, 1), n('pmSubPitch', 'Sub → pitch', 'POLY-MOD', 0, 0, 1, 0.01, '', 'the sub frequency-modulates the oscillators: growl'),
      { key: 'sync', type: 'boolean', default: false, label: 'Hard sync', group: 'POLY-MOD' }, n('syncRatio', 'Sync ratio', 'POLY-MOD', 1.5, 1, 8, 0.01, '×'),
      e('lfoShape', 'Shape', 'LFO', 'triangle'), n('lfoRate', 'Rate', 'LFO', 5, 0.05, 30, 0.01, 'Hz'), n('lfoDelay', 'Delay', 'LFO', 0.3, 0, 4, 0.01, 's', 'the LFO fades in this long after each note'),
      n('lfoPitch', '→ pitch', 'LFO', 0, 0, 100, 0.1, 'c'), n('lfoCutoff', '→ cutoff', 'LFO', 0, 0, 2400, 1, 'c'), n('lfoPw', '→ width', 'LFO', 0, 0, 1),
      n('velCutoff', 'Vel → cutoff', 'VELOCITY', 0.3, 0, 1), n('velAmp', 'Vel → level', 'VELOCITY', 0.5, 0, 1),
      n('chorusMix', 'Chorus mix', 'CHORUS+', 0.5, 0, 1), n('bbdHiss', 'BBD hiss', 'CHORUS+', -84, -120, -50, 1, 'dB', 'the chip\'s own hiss — it breathes with the playing'),
      it('bbdStages', 'BBD stages', 'CHORUS+', 256, 256, 4096, 'the chip: 256 is the Juno\'s (darker), more = brighter'),
      it('unison', 'Unison voices', 'UNISON', 4, 2, 16), n('detune', 'Detune', 'UNISON', 0.25, 0, 1), e('detuneCurve', 'Curve', 'UNISON', 'supersaw'), n('spread', 'Spread', 'UNISON', 0.7, 0, 1),
      e('subShape', 'Sub shape', 'SUB', 'square'), e('subOct', 'Sub octave', 'SUB', '-1'), e('noiseColour', 'Noise', 'SUB', 'white'),
    ],
    // presets are data beside the tool (packs/factory/pack.json) — never in the engine
    defaultPreset: 'Outrun Lead',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params;
      const out = ac.createGain(); ctx.track(out); ctx.port('out', { kind: 'audio', direction: 'out', node: out, label: 'retro dco' });
      const mods = { cutoff: ctx.modBus('cutoff', { min: -4800, max: 4800 }), pwm: ctx.modBus('pwm', { min: -1, max: 1 }), res: ctx.modBus('res', { min: -1, max: 1 }), drift: ctx.modBus('drift', { min: -1, max: 1 }) };
      let node = null, cards = new Array(SLOTS).fill(0), trig = 0; const queue = [];
      const value = (k) => E[k] ? Math.max(0, E[k].indexOf(P.get(k))) : k === 'lfoShape' ? LFO_SHAPE[P.get(k)] : typeof P.get(k) === 'boolean' ? (P.get(k) ? 1 : 0) : P.get(k);
      const valueOf = (k) => k === 'lfoShape' ? LFO_SHAPE[P.get(k)] : value(k);
      const values = () => { const v = {}; SET.forEach(k => { v[k] = valueOf(k); }); return v; };
      const prm = (k) => node.parameters.get(k);
      const ready = ctx.loadWorklet('eravos-retro-dco', SRC()).then(() => {
        if (ctx.disposed) return null;
        node = new AudioWorkletNode(ac, 'eravos-retro-dco', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: { values: values(), modes: MP.ENSEMBLE_MODES } }); ctx.track(node);
        node.onprocessorerror = (er) => ctx.fault('RUNTIME_003', 'retro dco worklet stopped: ' + ((er && er.message) || 'processor error'));
        node.connect(out); Object.keys(mods).forEach(k => mods[k].connect(prm(k + 'Mod')));
        node.port.onmessage = (m) => { if (m.data && m.data.type === 'cards') { cards = m.data.levels; ctx.emitUI('cards', { levels: cards }); } };
        SET.forEach(k => prm(k).setValueAtTime(valueOf(k), 0)); queue.splice(0).forEach(f => f()); return node;
      }).catch(er => { ctx.fault('RUNTIME_003', 'retro dco worklet: ' + er.message); return null; });
      const when = (f) => { if (node) f(); else queue.push(f); };
      SET.forEach(k => P.onChange(k, () => when(() => prm(k).setValueAtTime(valueOf(k), ac.currentTime))));
      // ---- which card plays which note (voice-allocator). Hands (keys, MIDI) and sequenced notes go through the same allocator.
      const VA = MP.VoiceAllocator(P.get('voices'));
      const mode = () => { const v = P.get('voice'); return v === 'poly' ? 'poly' : v === 'legato' ? 'legato' : 'mono'; };
      const sync = () => { VA.setMode(mode()); VA.setVoices(P.get('voice') === 'poly' ? P.get('voices') : 1); VA.setSteal(P.get('steal')); VA.release(P.get('release') * 1.7 + 0.05); };
      sync(); ['voice', 'voices', 'steal', 'release'].forEach(k => P.onChange(k, () => { if (k !== 'release') allOff(); sync(); }));
      function send(r, vel, at) {
        const i = r.voice; if (i < 0) return;
        when(() => { prm('note' + i).setValueAtTime(r.note, at); if (r.retrigger) { prm('vel' + i).setValueAtTime(vel === undefined ? 0.8 : vel, at); prm('trig' + i).setValueAtTime(++trig, at); } prm('gate' + i).setValueAtTime(1, at); });
      }
      function gateOff(i, at) { when(() => prm('gate' + i).setValueAtTime(0, at)); }
      function noteOn(note, vel, t, dur) {
        const at = Math.max(t || ac.currentTime, ac.currentTime), r = VA.noteOn(note, vel, at); const i = r.voice, re = r.retrigger;
        send(r, vel, at);
        if (dur !== undefined) { const end = at + Math.max(0.005, dur), o = VA.noteOff(note, end);
          if (o.voice >= 0 && (mode() === 'poly' || o.note === note) && !o.glide) gateOff(o.voice, end);
          else if (o.voice >= 0 && o.glide) send(o, vel, end); }
        return { i, re };
      }
      function noteOff(note, t) { const at = Math.max(t || ac.currentTime, ac.currentTime), o = VA.noteOff(note, at); if (o.voice < 0) return;
        if (o.glide) send(o, undefined, at); else gateOff(o.voice, at); }
      function allOff() { VA.reset(); if (node) { node.port.postMessage({ type: 'panic' }); for (let i = 0; i < SLOTS; i++) { const g = prm('gate' + i); g.cancelScheduledValues(ac.currentTime); g.setValueAtTime(0, ac.currentTime); } } }
      // ---- the arpeggiator over held keys (as Retro Poly's; it moves to the shared arp component later — spec depth_audit)
      const held = []; let arpI = 0; const rnd = ctx.dsp.mulberry32(84);
      function arpSeq() { const base = P.get('arp') === 'played' ? held.slice() : held.slice().sort((a, b) => a - b), seq = [];
        for (let o = 0; o < P.get('arpOct'); o++) base.forEach(k => seq.push(k + 12 * o));
        const m = P.get('arp'); if (m === 'down') seq.reverse(); if (m === 'up-down' && seq.length > 2) return seq.concat(seq.slice(1, -1).reverse()); return seq; }
      const STEP = { '1/4': 4, '1/8': 2, '1/16': 1, '1/8t': 4 / 3, '1/16t': 2 / 3 };
      ctx.onTick((tk) => {
        if (P.get('arp') === 'off' || !held.length) return;
        const st = STEP[P.get('arpDiv')], sd = 60 / ctx.bpm / 4;
        const hits = st >= 1 ? (tk.step16 % Math.round(st) === 0 ? [0] : []) : st === 2 / 3 ? [0, 2 / 3] : [];
        const triplet = st === 4 / 3 ? (tk.step16 % 4 === 0 ? [0, 4 / 3, 8 / 3] : []) : null;
        (triplet || hits).forEach(off => { const seq = arpSeq(); if (!seq.length) return; const k = P.get('arp') === 'random' ? seq[Math.floor(rnd() * seq.length)] : seq[arpI++ % seq.length]; noteOn(k, 0.85, tk.time + off * sd, Math.max(0.02, st * sd * P.get('arpGate'))); });
      });
      const press = (note, vel) => { if (P.get('arp') === 'off') return noteOn(note, vel); if (held._released) { held.length = 0; held._released = false; } if (!held.includes(note)) held.push(note); };
      const lift = (note) => { if (P.get('arp') === 'off') return noteOff(note); if (P.get('arpHold')) { held._released = true; return; } const i = held.indexOf(note); if (i >= 0) held.splice(i, 1); };
      P.onChange('arp', (v) => { if (v === 'off') held.length = 0; arpI = 0; });
      // ---- Hold (as Retro Poly's, 3.130): keys let go keep sounding; the next key pressed with none down lets them go
      const down = new Set(), latched = new Set();
      const handOn = (note, vel) => { if (P.get('hold')) { if (!down.size && latched.size) { const same = latched.size === 1 && latched.has(note); latched.forEach(k => lift(k)); latched.clear(); if (same) return; } down.add(note); } press(note, vel); };
      const handOff = (note) => { if (P.get('hold')) { if (!down.delete(note)) return; latched.add(note); return; } lift(note); };
      P.onChange('hold', (v) => { if (!v) { latched.forEach(k => { if (!down.has(k)) lift(k); }); latched.clear(); } });
      ctx.onNote((p) => noteOn(p.note, p.velocity, p.time, p.duration));
      ctx.onMidi((p) => p.on ? handOn(p.note, p.velocity) : handOff(p.note));
      ctx.audition = (p) => { const k = p.note || 60; if (p.duration !== undefined && p.duration < 30) return noteOn(k, p.velocity || 0.8, ac.currentTime, p.duration); handOn(k, p.velocity || 0.8); };
      ctx.auditionOff = (p) => handOff(p.note || 60);
      ctx.allNotesOff = allOff;
      ctx.onDispose(() => { if (node) { node.port.postMessage({ type: 'panic' }); node.port.onmessage = null; } });
      ctx.internals = { ready, node: () => node, cards: () => cards, noteOn, noteOff, values, allocator: VA };
      return {};
    },
  });
})();

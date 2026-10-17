/* eravos.bass-drop-builder 2.0.0 — Drop Builder (P6) · resolves F-18(drop)
 * A conductor: TENSION → BUILD → PAUSE → DROP on the bar grid. Emits pattern cues (exact step), automates
 * the master DJ filter through the kernel API (restored after), plays its own build FX (riser, snare roll,
 * impact with reverse-cymbal pre-roll, downlifter, tension pad), and places Raven's voice exactly where
 * it hits hardest (end-on-DROP, stutter, reverb throw). No private clock — transport:tick only. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const SECTIONS = ['TENSION', 'BUILD', 'PAUSE', 'DROP'];
  const COLORS = { TENSION: '#8844ff', BUILD: '#ffaa00', PAUSE: '#ffffff', DROP: '#ff2266' };
  // tension sounds: each is a complete setting of the TENSION group (nothing hidden — every value is a knob)
  const TSOUNDS = {
    'Mist (default)': { tensionTone: 'pad', padLevel: 0.3, tChords: 'i → VI', tVoicing: 'sus2', tOct: 3, tWave: 'triangle', tVoices: 2, tDetune: 7, tWidth: 0.6, tAttack: 1.5, tRelease: 0.4, tCutoff: 1100, tCutoffEnd: 1100, tRes: 0.7, tMotion: 0.25, tMotionRate: 0.2, tSwell: 0, tPump: 0, tSub: 0.25, tAir: 0, tSpace: 0.35 },
    'Low hum': { tensionTone: 'pad', padLevel: 0.35, tChords: 'hold i', tVoicing: 'power', tOct: 2, tWave: 'sine', tVoices: 1, tDetune: 0, tWidth: 0.2, tAttack: 2, tRelease: 0.6, tCutoff: 600, tCutoffEnd: 600, tRes: 0.5, tMotion: 0.1, tMotionRate: 0.1, tSwell: 0, tPump: 0, tSub: 0.5, tAir: 0, tSpace: 0.2 },
    'Glass': { tensionTone: 'pad', padLevel: 0.25, tChords: 'i → iv', tVoicing: 'add9', tOct: 5, tWave: 'sine', tVoices: 3, tDetune: 4, tWidth: 1, tAttack: 0.8, tRelease: 1.2, tCutoff: 6000, tCutoffEnd: 6000, tRes: 0.5, tMotion: 0.4, tMotionRate: 0.35, tSwell: 0, tPump: 0, tSub: 0, tAir: 0.2, tSpace: 0.7 },
    'Supersaw lift': { tensionTone: 'pad', padLevel: 0.4, tChords: 'VI → VII', tVoicing: 'add9', tOct: 4, tWave: 'sawtooth', tVoices: 3, tDetune: 11, tWidth: 0.75, tAttack: 0.04, tRelease: 0.04, tCutoff: 600, tCutoffEnd: 6000, tRes: 0.8, tMotion: 0, tMotionRate: 0.2, tSwell: 0.35, tPump: 0.7, tSub: 0.35, tAir: 0.3, tSpace: 0.2 },
    'Rising plucks': { tensionTone: 'pluck', padLevel: 0.45, tChords: 'VI → VII', tVoicing: 'triad', tOct: 4, tWave: 'sawtooth', tVoices: 2, tDetune: 7, tWidth: 0.5, tAttack: 0.003, tRelease: 0.28, tCutoff: 1200, tCutoffEnd: 7000, tRes: 1.2, tMotion: 0, tMotionRate: 0.2, tSwell: 0.3, tPump: 0, tRate: '1/8 → 1/16', tSub: 0, tAir: 0, tSpace: 0.25 },
    'Dread': { tensionTone: 'pad', padLevel: 0.3, tChords: 'tritone', tVoicing: 'triad', tOct: 3, tWave: 'sawtooth', tVoices: 2, tDetune: 6, tWidth: 0.4, tAttack: 2, tRelease: 0.05, tCutoff: 300, tCutoffEnd: 2500, tRes: 9, tMotion: 0, tMotionRate: 0.2, tSwell: 0, tPump: 0, tSub: 0, tAir: 0, tSpace: 0.3 },
    'Silent (canvas tool)': { tensionTone: 'off' },
  };
  OrganismFactory.define({
    id: 'eravos.bass-drop-builder', tempo: false, domain: 'music', version: '3.1.0', label: 'Drop Builder', icon: '🔻', accent: '#ff2266', phase: 'P6',
    category: 'Arrange', blurb: 'Build the moment: tension → build → silence → DROP, with her voice landing right before the bass hits.',
    size: { w: 780, h: 680 }, minSize: { w: 600, h: 420 },
    permissions: ['audio_out', 'bus_publish', 'bus_subscribe', 'filesystem_read', 'registry_read'],
    provides: ['capability.audio_out', 'capability.conductor'],
    hooks: [
      S.audio_out('drop.hook.fx_out', 'fx'), S.audio_out('drop.hook.vocal_out', 'vocal'),
      S.transport_in('drop.hook.transport_in'), S.theory_in('drop.hook.theory_in'), S.asset_in('drop.hook.asset_in'),
      S.event('drop.hook.cue_out', 'out', 'seq:pattern_cue', { type: 'object', required: ['target', 'slot'] }, '1.0.0'),
      Object.assign(S.event('drop.hook.drive_out', 'out', 'ui:config_change', { type: 'object', required: ['key', 'value'] }, '1.0.0'), { rail: false }),
      S.event('drop.hook.fired_out', 'out', 'edm:drop-fired', { type: 'object', required: ['time'] }, '1.0.0'),
      Object.assign(S.event('drop.hook.plan_out', 'out', 'edm:drop-plan', { type: 'object', required: ['bars'] }, '1.0.0'), { rail: false }),
      Object.assign(S.event('drop.hook.fire_in', 'in', 'ui:drop_fire|timeline:marker', { type: 'object' }, '1.0.0'), { rail: false }),
    ],
    config: [
      { key: 'tensionBars', type: 'number', default: 4, min: 0, max: 32, step: 0.25, label: 'Tension', group: 'SECTIONS' },
      { key: 'buildBars', type: 'number', default: 4, min: 0, max: 32, step: 0.25, label: 'Build', group: 'SECTIONS' },
      { key: 'pauseBars', type: 'number', default: 0.25, min: 0, max: 4, step: 0.25, label: 'Pause', group: 'SECTIONS' },
      { key: 'dropBars', type: 'number', default: 8, min: 1, max: 64, step: 0.25, label: 'Drop', group: 'SECTIONS' },
      { key: 'outroBars', type: 'number', default: 8, min: 0, max: 64, step: 1, label: 'After', group: 'SECTIONS', hint: 'bars the after-pattern plays (for the bounce length)' },
      { key: 'startMode', type: 'enum', options: ['nextBar', 'nextBeat'], default: 'nextBar', label: 'Start', group: 'SECTIONS' },
      { key: 'autoFire', type: 'boolean', default: false, label: 'Fire on play', group: 'SECTIONS', hint: 'arm automatically whenever the song plays from the top (bar 1)' },
      // BUILD (3.0: every part editable)
      { key: 'riserLevel', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: 'Riser', group: 'BUILD' },
      { key: 'riserWave', type: 'enum', options: ['noise+saw', 'noise', 'saw', 'supersaw'], default: 'noise+saw', label: 'Riser sound', group: 'BUILD' },
      { key: 'riserOct', type: 'number', default: 2, min: 0, max: 4, step: 0.1, label: 'Rise (oct)', group: 'BUILD' },
      { key: 'riserNoise', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Noise', group: 'BUILD', hint: 'how much white-noise whoosh in the riser' },
      { key: 'riserCurve', type: 'number', default: 1, min: 0.3, max: 4, step: 0.01, label: 'Riser curve', group: 'BUILD', hint: '<1 rises early · 1 even · >1 holds back and surges at the end' },
      { key: 'riserFrom', type: 'number', default: 0, min: 0, max: 0.9, step: 0.01, label: 'Riser starts', group: 'BUILD', hint: 'fraction of the build before the riser begins' },
      { key: 'rollLevel', type: 'number', default: 0.7, min: 0, max: 1, step: 0.01, label: 'Roll', group: 'BUILD' },
      { key: 'rollVoice', type: 'enum', options: ['snare', 'clap', 'hat', 'kick', 'tom'], default: 'snare', label: 'Roll sound', group: 'BUILD' },
      { key: 'rollStart', type: 'enum', options: ['1/4', '1/8', '1/16'], default: '1/4', label: 'Roll from', group: 'BUILD' },
      { key: 'rollEnd', type: 'enum', options: ['1/8', '1/16', '1/32'], default: '1/32', label: 'Roll to', group: 'BUILD' },
      { key: 'rollCurve', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: 'Roll curve', group: 'BUILD' },
      { key: 'rollPitch', type: 'number', default: 12, min: 0, max: 24, step: 0.5, unit: 'st', label: 'Roll pitch rise', group: 'BUILD' },
      { key: 'rollFrom', type: 'number', default: 0, min: 0, max: 0.9, step: 0.01, label: 'Roll starts', group: 'BUILD', hint: 'fraction of the build before the roll begins' },
      // PAUSE
      { key: 'gapSound', type: 'enum', options: ['silence', 'reverse cymbal', 'vocal tail', 'sub swell'], default: 'reverse cymbal', label: 'In the gap', group: 'PAUSE', hint: 'what you hear in the moment before the drop' },
      { key: 'gapLevel', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Gap level', group: 'PAUSE' },
      { key: 'gapLen', type: 'number', default: 0.5, min: 0.1, max: 2, step: 0.05, unit: 'beats', label: 'Gap swell', group: 'PAUSE', hint: 'how long the gap sound swells into the drop (beats, plus the pause)' },
      // DROP
      { key: 'impactLevel', type: 'number', default: 0.8, min: 0, max: 1, step: 0.01, label: 'Impact', group: 'DROP' },
      { key: 'impactPitch', type: 'number', default: 50, min: 28, max: 90, step: 1, unit: 'Hz', label: 'Boom pitch', group: 'DROP' },
      { key: 'impactLen', type: 'number', default: 1.5, min: 0.3, max: 4, step: 0.05, unit: 's', label: 'Boom length', group: 'DROP' },
      { key: 'crashLevel', type: 'number', default: 0.45, min: 0, max: 1, step: 0.01, label: 'Crash', group: 'DROP' },
      { key: 'padLevel', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, label: 'Level', group: 'TENSION' },
      { key: 'tensionTone', type: 'enum', options: ['off', 'pad', 'pluck'], default: 'pad', label: 'Tension sound', group: 'TENSION', hint: 'off = silent (cue a tool from the canvas instead) · pad = held chords · pluck = arpeggiated chords' },
      { key: 'tChords', type: 'enum', options: ['hold i', 'i → VI', 'VI → VII', 'iv → V', 'i → iv', 'tritone'], default: 'i → VI', label: 'Chords', group: 'TENSION', hint: 'in the song key; tritone = the unresolved stack' },
      { key: 'tVoicing', type: 'enum', options: ['triad', 'sus2', 'sus4', 'add9', 'seventh', 'power'], default: 'sus2', label: 'Voicing', group: 'TENSION' },
      { key: 'tOct', type: 'integer', default: 3, min: 1, max: 6, label: 'Octave', group: 'TENSION' },
      { key: 'tWave', type: 'enum', options: ['sine', 'triangle', 'sawtooth', 'square'], default: 'triangle', label: 'Wave', group: 'TENSION' },
      { key: 'tVoices', type: 'integer', default: 2, min: 1, max: 5, label: 'Unison', group: 'TENSION' },
      { key: 'tDetune', type: 'number', default: 7, min: 0, max: 50, step: 0.5, unit: 'ct', label: 'Detune', group: 'TENSION' },
      { key: 'tWidth', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: 'Width', group: 'TENSION' },
      { key: 'tAttack', type: 'number', default: 1.5, min: 0.003, max: 8, step: 0.001, unit: 's', label: 'Attack', group: 'TENSION', hint: 'pad: fade-in per chord · pluck: per note' },
      { key: 'tRelease', type: 'number', default: 0.4, min: 0.01, max: 4, step: 0.01, unit: 's', label: 'Release', group: 'TENSION', hint: 'pad: crossfade/tail · pluck: note decay' },
      { key: 'tCutoff', type: 'number', default: 1100, min: 60, max: 16000, step: 1, unit: 'Hz', label: 'Cutoff start', group: 'TENSION' },
      { key: 'tCutoffEnd', type: 'number', default: 1100, min: 60, max: 16000, step: 1, unit: 'Hz', label: 'Cutoff end', group: 'TENSION', hint: 'same as start = no filter build' },
      { key: 'tRes', type: 'number', default: 0.7, min: 0.1, max: 20, step: 0.1, label: 'Resonance', group: 'TENSION' },
      { key: 'tMotion', type: 'number', default: 0.25, min: 0, max: 1, step: 0.01, label: 'Motion', group: 'TENSION', hint: 'slow filter breathing' },
      { key: 'tMotionRate', type: 'number', default: 0.2, min: 0.02, max: 8, step: 0.01, unit: 'Hz', label: 'Motion rate', group: 'TENSION' },
      { key: 'tSwell', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Swell', group: 'TENSION', hint: '0 = flat level the whole section · 1 = starts silent and rises to the end' },
      { key: 'tPump', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Pump', group: 'TENSION', hint: 'sidechain duck on every beat' },
      { key: 'tRate', type: 'enum', options: ['1/4', '1/8', '1/16', '1/8 → 1/16'], default: '1/8', label: 'Pluck rate', group: 'TENSION' },
      { key: 'tSub', type: 'number', default: 0.25, min: 0, max: 1, step: 0.01, label: 'Sub', group: 'TENSION' },
      { key: 'tAir', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Air', group: 'TENSION', hint: 'filtered noise riding over the section' },
      { key: 'tSpace', type: 'number', default: 0.35, min: 0, max: 1, step: 0.01, label: 'Space', group: 'TENSION', hint: 'send to the canvas reverb' },
      { key: 'downLevel', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Downlifter', group: 'DROP' },
      { key: 'downLen', type: 'number', default: 1, min: 0.25, max: 4, step: 0.25, unit: 'bars', label: 'Downlifter length', group: 'DROP' },
      { key: 'vocalTrimStart', type: 'number', default: 0, min: 0, max: 0.95, step: 0.005, label: 'Trim start', group: 'VOCAL', hint: 'skip this much of the start of her clip' },
      { key: 'vocalTrimEnd', type: 'number', default: 1, min: 0.05, max: 1, step: 0.005, label: 'Trim end', group: 'VOCAL', hint: 'stop the clip here' },
      { key: 'vocalSection', type: 'enum', options: SECTIONS, default: 'BUILD', label: 'Vocal in', group: 'VOCAL' },
      { key: 'vocalBeat', type: 'number', default: 0, min: 0, max: 128, step: 0.25, label: 'At beat', group: 'VOCAL' },
      { key: 'vocalEndOnDrop', type: 'boolean', default: true, label: 'End on DROP', group: 'VOCAL', hint: 'the clip ends exactly on the first beat of the drop' },
      { key: 'stutter', type: 'integer', default: 0, min: 0, max: 8, label: 'Stutter ×', group: 'VOCAL', hint: 'repeat the first 1/8 of the word before it plays: “gi-gi-give…”' },
      { key: 'vocalGain', type: 'number', default: 1, min: 0, max: 2, step: 0.01, label: 'Vocal gain', group: 'VOCAL' },
      { key: 'vocalHpf', type: 'number', default: 120, min: 20, max: 1000, step: 1, unit: 'Hz', label: 'Vocal low cut', group: 'VOCAL' },
      { key: 'vocalPriority', type: 'number', default: 9, min: 0, max: 18, step: 0.5, unit: 'dB', label: 'Her voice on top', group: 'VOCAL', hint: 'everything else dips this much under each word she says (0 = off); her voice is never ducked' },
      { key: 'throw', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Reverb throw', group: 'VOCAL' },
    ],
    ui_hooks: ['section_edit', 'cue_edit', 'vocal_load', 'vocal_place', 'fire', 'abort', 'vocal_audition', 'tension_audition', 'tension_sound', 'section_audition'],
    restoreTwice: true,
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, K = ctx.K, dsp = ctx.dsp, MT = window.MusicTheory;
      const fx = ac.createGain(), fxOut = fx; fx.gain.value = 0.8; ctx.port('fx', { kind: 'audio', direction: 'out', node: fx, label: 'build FX' });
      const vocal = ac.createGain(); ctx.port('vocal', { kind: 'audio', direction: 'out', node: vocal, label: 'vocal', bus: 'priority' });   // 3.39: joins the master after the ducks
      const vHp = ac.createBiquadFilter(); vHp.type = 'highpass'; vHp.connect(vocal);
      const throwG = ac.createGain(); throwG.gain.value = 0; vHp.connect(throwG); throwG.connect(K.audio.reverbSend);
      [fx, vocal, vHp, throwG].forEach(n => ctx.track(n));
      // cues per section + after
      let cues = { TENSION: {}, BUILD: {}, PAUSE: {}, DROP: {}, AFTER: {} }; // {target, slot, djStart, djEnd, energy, energyTarget, mutes:[]}
      let vox = null; // {hash, name, buffer, rev}
      let armed = null, run = null; // run: {t0, step0, bounds:{sec:{s,e,ts,te}}, sources:[], restoredDJ}
      const logged = new Set();
      const beatSteps = 4, barSteps = 16;
      const bars = () => ({ TENSION: P.get('tensionBars'), BUILD: P.get('buildBars'), PAUSE: P.get('pauseBars'), DROP: Math.max(1, P.get('dropBars')) });
      const totalBars = () => SECTIONS.reduce((a, s) => a + bars()[s], 0);
      function plan() { ctx.emit('edm:drop-plan', { bars: Math.ceil((run ? run.step0 / 16 : 0) + totalBars() + P.get('outroBars')), sections: bars() }); }
      ['tensionBars', 'buildBars', 'pauseBars', 'dropBars', 'outroBars'].forEach(k => P.onChange(k, () => { plan(); ctx.syncUI(); }));
      P.onChange('vocalHpf', (v) => vHp.frequency.setTargetAtTime(v, ac.currentTime, 0.01)); vHp.frequency.value = P.get('vocalHpf');

      // ---------------- FX voices (scheduled at audio times)
      function riser(t, dur, dest) {
        const lv = P.get('riserLevel'); if (!lv) return; const from = P.get('riserFrom'); t += dur * from; dur *= 1 - from; if (dur <= 0.05) return;
        const out = dest || fx, wave = P.get('riserWave'), noiseMix = wave === 'noise' ? 1 : wave === 'saw' || wave === 'supersaw' ? 0 : P.get('riserNoise');
        const k = ctx.key, base = MT.hz(MT.degreeToMidi(1, 3, k.root, k.scale)), top = base * Math.pow(2, P.get('riserOct')), srcs = [];
        const g = ac.createGain(), cv = P.get('riserCurve'), N = 64; g.gain.setValueAtTime(0, t);
        g.gain.setValueCurveAtTime(Float32Array.from({ length: N }, (_, i) => lv * 0.5 * Math.pow(i / (N - 1), cv * 2)), t, dur); g.gain.setValueAtTime(0, t + dur + 0.005);
        g.connect(out);
        if (noiseMix > 0) { const n = dsp.noiseSource(ac, 'white'), bp = ac.createBiquadFilter(), ng = ac.createGain(); bp.type = 'bandpass'; bp.Q.value = 2.5; bp.frequency.setValueAtTime(200, t); bp.frequency.exponentialRampToValueAtTime(8000, t + dur); ng.gain.value = noiseMix; n.connect(bp); bp.connect(ng); ng.connect(g); n.start(t); n.stop(t + dur + 0.05); srcs.push(n); }
        if (noiseMix < 1) {
          const slp = ac.createBiquadFilter(), sg = ac.createGain(); slp.type = 'lowpass'; slp.frequency.setValueAtTime(400, t); slp.frequency.exponentialRampToValueAtTime(9000, t + dur); sg.gain.value = (1 - noiseMix) * (wave === 'supersaw' ? 0.16 : 0.3); slp.connect(sg); sg.connect(g);
          (wave === 'supersaw' ? [-14, -7, 0, 7, 14] : [0]).forEach(dt => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.detune.value = dt; o.frequency.setValueAtTime(base, t); if (top !== base) o.frequency.exponentialRampToValueAtTime(top, t + dur); o.connect(slp); o.start(t); o.stop(t + dur + 0.05); srcs.push(o); });
        }
        if (srcs.length) track(srcs, g);
      }
      function rollHits(t, dur, stepDur) {
        const hits = []; const end = t + dur - 0.5 * stepDur / 2; // last hit ≤ DROP − 1/32
        const curve = 0.4 + P.get('rollCurve') * 2.6, ALL = { '1/4': 4, '1/8': 2, '1/16': 1, '1/32': 0.5 };
        const a0 = ALL[P.get('rollStart')] || 4, a1 = Math.min(a0, ALL[P.get('rollEnd')] || 0.5), divs = [4, 2, 1, 0.5].filter(d => d <= a0 && d >= a1); // in 16ths
        const from = P.get('rollFrom'); t += dur * from; dur *= 1 - from; if (dur <= 0) return [];
        let x = t, prevIv = Infinity;
        while (x < end - 1e-6) {
          const prog = (x - t) / dur; const seg = Math.min(divs.length - 1, Math.floor(Math.pow(prog, 1 / curve) * divs.length));
          const iv = Math.min(prevIv, divs[seg] * stepDur); hits.push({ t: x, prog }); prevIv = iv; x += iv;
        }
        return hits.filter(h => h.t <= t + dur - 0.5 * stepDur + 1e-9);
      }
      ctx.rollHits = rollHits;
      function snareHit(t, vel, st, dest) {
        const lv = P.get('rollLevel'); if (!lv) return; const out = dest || fx, voice = P.get('rollVoice');
        const r = Math.pow(2, st / 12), g = ac.createGain(), srcs = [];
        const V = { snare: [2200, 0.8, 190, 0.14, 'triangle'], clap: [1400, 1.2, 0, 0.18, null], hat: [8000, 0.7, 0, 0.05, null], kick: [0, 0, 55, 0.25, 'sine'], tom: [0, 0, 110, 0.22, 'sine'] }[voice] || [2200, 0.8, 190, 0.14, 'triangle'];
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel * lv, t + 0.001); g.gain.exponentialRampToValueAtTime(0.001, t + V[3]); g.connect(out);
        if (V[0]) { const n = dsp.noiseSource(ac, 'white'), bp = ac.createBiquadFilter(); bp.type = voice === 'hat' ? 'highpass' : 'bandpass'; bp.frequency.value = V[0] * r; bp.Q.value = V[1]; n.connect(bp); bp.connect(g); n.start(t, Math.random()); n.stop(t + V[3] + 0.02); srcs.push(n); }
        if (V[2]) { const o = ac.createOscillator(), og = ac.createGain(); o.type = V[4]; o.frequency.setValueAtTime(V[2] * r * (voice === 'kick' ? 3 : 1), t); o.frequency.exponentialRampToValueAtTime(V[2] * r, t + 0.04); og.gain.value = V[0] ? 0.5 : 1; o.connect(og); og.connect(g); o.start(t); o.stop(t + V[3] + 0.02); srcs.push(o); }
        if (voice === 'clap') [0.008, 0.017].forEach(d => { const n = dsp.noiseSource(ac, 'white'), bp = ac.createBiquadFilter(), eg = ac.createGain(); bp.type = 'bandpass'; bp.frequency.value = 1400 * r; eg.gain.setValueAtTime(0, t + d); eg.gain.linearRampToValueAtTime(vel * lv * 0.7, t + d + 0.001); eg.gain.exponentialRampToValueAtTime(0.001, t + d + 0.03); n.connect(bp); bp.connect(eg); eg.connect(out); n.start(t + d, Math.random()); n.stop(t + d + 0.05); srcs.push(n); });
        track(srcs, g);
      }
      function impact(t, dest) {
        const out = dest || fx;
        const lv = P.get('impactLevel'), cl = P.get('crashLevel'); if (!lv && !cl) return; const f0 = P.get('impactPitch'), L = P.get('impactLen');
        const o = ac.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.6, t + L);
        const og = ac.createGain(); og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(Math.max(0.0001, lv), t + 0.005); og.gain.exponentialRampToValueAtTime(0.001, t + L);
        const sh = ac.createWaveShaper(); sh.curve = dsp.curve('tanh', 0.4);
        o.connect(sh); sh.connect(og); og.connect(out);
        const n = dsp.noiseSource(ac, 'white'); const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000;
        const ng = ac.createGain(); ng.gain.setValueAtTime(0, t); ng.gain.linearRampToValueAtTime(Math.max(0.0001, cl), t + 0.002); ng.gain.exponentialRampToValueAtTime(0.001, t + 2);
        n.connect(hp); hp.connect(ng); ng.connect(out);
        o.start(t); n.start(t); o.stop(t + L + 0.1); n.stop(t + 2.1);
        track([o, n], og, ng);
      }
      function gapSound(tEnd, len, dest) { // swells and ends EXACTLY on the drop
        const kind = P.get('gapSound'), lv = P.get('gapLevel'), out = dest || fx; if (kind === 'silence' || !lv || len <= 0.02) return;
        const t = Math.max(ac.currentTime, tEnd - len), g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(lv * 0.45, tEnd - 0.001); g.gain.linearRampToValueAtTime(0, tEnd); g.connect(out);
        if (kind === 'sub swell') { const k = ctx.key, o = ac.createOscillator(); o.frequency.setValueAtTime(MT.hz(MT.degreeToMidi(1, 1, k.root, k.scale)), t); o.frequency.exponentialRampToValueAtTime(MT.hz(MT.degreeToMidi(1, 2, k.root, k.scale)), tEnd); o.connect(g); o.start(t); o.stop(tEnd + 0.01); return track([o], g); }
        if (kind === 'vocal tail' && vox && vox.buffer) { const s = ac.createBufferSource(); s.buffer = dsp.reverseBuffer(ac, vox.buffer); const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 300; s.connect(hp); hp.connect(g); hp.connect(throwG); s.start(t, Math.max(0, s.buffer.duration - len)); s.stop(tEnd + 0.01); return track([s], g, hp); }
        const n = dsp.noiseSource(ac, 'white'), hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5000; n.connect(hp); hp.connect(g); n.start(t); n.stop(tEnd + 0.01); track([n], g, hp);
      }
      function downlifter(t, dur, dest) {
        const lv = P.get('downLevel'); if (!lv) return; const fx = dest || fxOut;
        const n = dsp.noiseSource(ac, 'white'); const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.5;
        bp.frequency.setValueAtTime(6000, t); bp.frequency.exponentialRampToValueAtTime(150, t + dur);
        const g = ac.createGain(); g.gain.setValueAtTime(lv * 0.4, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        n.connect(bp); bp.connect(g); g.connect(fx); n.start(t); n.stop(t + dur + 0.05); track([n], g);
      }
      // TENSION (2.2): one parametric voice — every value is a TENSION knob; TSOUNDS are just settings of it
      function tensionChords() {
        const k = ctx.key, v = P.get('tVoicing'), o = P.get('tOct');
        const prog = { 'hold i': [1], 'i → VI': [1, 6], 'VI → VII': [6, 7], 'iv → V': [4, 5], 'i → iv': [1, 4] }[P.get('tChords')];
        if (!prog) { const r = MT.degreeToMidi(1, o, k.root, k.scale); return [[r, r + 6, r + 12, r + 18]]; } // tritone stack
        return prog.map(d => MT.chord(d, k.root, k.scale, v, o));
      }
      ctx.tensionChords = tensionChords;
      ctx.tensionPad = (t, dur, dest) => tensionPad(t, dur, dest);
      function tensionPad(t, dur, dest) {
        const lv = P.get('padLevel'), tone = P.get('tensionTone'); if (!lv || tone === 'off' || dur <= 0.1) return null;
        const out = dest || fx, srcs = [], nodes = [];
        const N = (n) => { nodes.push(n); return n; };
        // shared chain: filter (sweep + motion) → pump → level/swell → out (+ reverb send)
        const lp = N(ac.createBiquadFilter()); lp.type = 'lowpass'; lp.Q.value = P.get('tRes');
        const c0 = P.get('tCutoff'), c1 = P.get('tCutoffEnd');
        lp.frequency.setValueAtTime(c0, t); if (Math.abs(c1 - c0) > 1) lp.frequency.exponentialRampToValueAtTime(c1, t + dur);
        const mo = P.get('tMotion');
        if (mo > 0) { const l = ac.createOscillator(), lg = N(ac.createGain()); l.frequency.value = P.get('tMotionRate'); lg.gain.value = Math.min(c0, c1) * 0.6 * mo; l.connect(lg); lg.connect(lp.frequency); l.start(t); l.stop(t + dur + 0.1); srcs.push(l); }
        const pump = N(ac.createGain()), pd = P.get('tPump'), beat = 60 / ctx.bpm; pump.gain.setValueAtTime(1, t);
        if (pd > 0) for (let b = 0; t + b * beat < t + dur - 0.02; b++) { const tb = t + b * beat; pump.gain.setValueAtTime(1, tb); pump.gain.linearRampToValueAtTime(1 - 0.75 * pd, tb + 0.012); pump.gain.setTargetAtTime(1, tb + 0.03, beat * 0.22); }
        const g = N(ac.createGain()), peak = lv * 0.35, sw = P.get('tSwell');
        g.gain.setValueAtTime(peak * (1 - sw), t); g.gain.linearRampToValueAtTime(peak, t + dur - 0.06); g.gain.linearRampToValueAtTime(0, t + dur);
        const send = N(ac.createGain()); send.gain.value = P.get('tSpace') * 0.8;
        lp.connect(pump); pump.connect(g); g.connect(out); g.connect(send); if (!dest && K.audio.reverbSend) send.connect(K.audio.reverbSend);
        const ch = tensionChords(), seg = dur / ch.length, wave = P.get('tWave'), nv = P.get('tVoices'), det = P.get('tDetune'), wid = P.get('tWidth'), atk = P.get('tAttack'), rel = P.get('tRelease'), sub = P.get('tSub');
        const spreads = nv === 1 ? [0] : Array.from({ length: nv }, (_, i) => i / (nv - 1) * 2 - 1);
        const voice = (midi, ts, te, gain, into) => spreads.forEach(sp => {
          const o = ac.createOscillator(); o.type = wave; o.frequency.value = MT.hz(midi); o.detune.value = sp * det;
          const pn = N(ac.createStereoPanner()); pn.pan.value = sp * wid; const vg = N(ac.createGain()); vg.gain.value = gain / Math.sqrt(nv);
          o.connect(vg); vg.connect(pn); pn.connect(into); o.start(ts); o.stop(te + 0.05); srcs.push(o);
        });
        // keeper holds the graph alive for the whole section (+ tail), so teardown happens once at the end
        const keep = ac.createConstantSource(); keep.offset.value = 0; keep.connect(g); keep.start(t); keep.stop(t + dur + rel + 0.3); srcs.unshift(keep);
        if (tone === 'pad') {
          ch.forEach((notes, ci) => {
            const ts = t + ci * seg, te = Math.min(t + dur, ts + seg + (ci < ch.length - 1 ? rel : 0)), a = Math.min(atk, (te - ts) * 0.9);
            const env = N(ac.createGain()), lvN = 1 / Math.sqrt(notes.length * 2);
            env.gain.setValueAtTime(0, ts); env.gain.linearRampToValueAtTime(lvN, ts + a); env.gain.setValueAtTime(lvN, Math.max(ts + a, te - Math.min(rel, 0.5))); env.gain.linearRampToValueAtTime(0, te); env.connect(lp);
            notes.forEach(n => voice(n, ts, te, 1, env));
            if (sub > 0) { const so = ac.createOscillator(); so.type = 'sine'; so.frequency.value = MT.hz(notes[0] - 12); const sg = N(ac.createGain()); sg.gain.value = sub * 0.6; so.connect(sg); sg.connect(env); so.start(ts); so.stop(te + 0.05); srcs.push(so); }
          });
        } else { // pluck
          const e = 60 / ctx.bpm, r = P.get('tRate'), stepAt = (prog) => ({ '1/4': e, '1/8': e / 2, '1/16': e / 4 }[r] || (prog < 0.5 ? e / 2 : e / 4));
          let i = 0;
          for (let x = t; x < t + dur - 0.01; i++) {
            const prog = (x - t) / dur, notes = ch[Math.min(ch.length - 1, Math.floor(prog * ch.length))], n = notes[i % notes.length] + (i % (notes.length * 2) >= notes.length ? 12 : 0);
            const st = stepAt(prog), vg = N(ac.createGain()), a = Math.min(atk, st * 0.5), d = Math.max(0.02, rel);
            vg.gain.setValueAtTime(0, x); vg.gain.linearRampToValueAtTime(0.35, x + a); vg.gain.exponentialRampToValueAtTime(0.001, x + a + d); vg.connect(lp);
            voice(n, x, x + a + d, 1, vg);
            if (sub > 0 && i % notes.length === 0) { const so = ac.createOscillator(); so.type = 'sine'; so.frequency.value = MT.hz(notes[0] - 12); const sg = N(ac.createGain()); sg.gain.setValueAtTime(sub * 0.5, x); sg.gain.exponentialRampToValueAtTime(0.001, x + a + d * 2); so.connect(sg); sg.connect(lp); so.start(x); so.stop(x + a + d * 2 + 0.05); srcs.push(so); }
            x += st;
          }
        }
        const air = P.get('tAir');
        if (air > 0) { const ns = dsp.noiseSource(ac, 'pink'), hp = N(ac.createBiquadFilter()), ag = N(ac.createGain()); hp.type = 'highpass'; hp.frequency.setValueAtTime(3000, t); hp.frequency.exponentialRampToValueAtTime(9000, t + dur); ag.gain.setValueAtTime(lv * 0.06 * air * (1 - sw), t); ag.gain.linearRampToValueAtTime(lv * 0.06 * air, t + dur - 0.05); ag.gain.linearRampToValueAtTime(0, t + dur); ns.connect(hp); hp.connect(ag); ag.connect(g); ns.start(t); ns.stop(t + dur + 0.05); srcs.push(ns); }
        track(srcs, ...nodes);
        return srcs;
      }
      // audition: hear the tension sound alone (up to 4 bars) — stoppable, does not touch the run
      let aud = null;
      function audStop() { if (!aud) return; const now = ac.currentTime; aud.g.gain.setTargetAtTime(0, now, 0.03); const a = aud; aud = null; setTimeout(() => { a.srcs.forEach(s => { try { s.stop(); } catch (e) {} }); try { a.g.disconnect(); } catch (e) {} }, 200); ctx.emitUI('audition', { on: false }); }
      ctx.onUI('tension_audition', null, () => {
        if (aud) return audStop();
        const g = ac.createGain(); g.connect(fx); const send = ac.createGain(); send.gain.value = P.get('tSpace') * 0.8; g.connect(send); if (K.audio.reverbSend) send.connect(K.audio.reverbSend);
        const dur = Math.min(4, Math.max(1, P.get('tensionBars') || 2)) * 240 / ctx.bpm, t = ac.currentTime + 0.05;
        const srcs = tensionPad(t, dur, g); if (!srcs) { g.disconnect(); return; }
        aud = { g, srcs }; const mine = aud; ctx.emitUI('audition', { on: true }); srcs[0].addEventListener('ended', () => { if (aud === mine) { aud = null; ctx.emitUI('audition', { on: false }); try { g.disconnect(); send.disconnect(); } catch (e) {} } });
      });
      let secAud = null;
      ctx.onUI('section_audition', { type: 'object', required: ['section'] }, (p) => {
        if (secAud) { const a = secAud; secAud = null; a.g.gain.setTargetAtTime(0, ac.currentTime, 0.03); setTimeout(() => { try { a.g.disconnect(); } catch (e) {} }, 300); ctx.emitUI('section_audition', { on: false }); if (a.section === p.section) return; }
        const sec = p.section, bar = 240 / ctx.bpm, sd = bar / 16, t = ac.currentTime + 0.06, g = ac.createGain(); g.connect(fx); secAud = { g, section: sec };
        if (sec === 'TENSION') { tensionPad(t, Math.min(4, Math.max(1, P.get('tensionBars') || 2)) * bar, g); }
        else if (sec === 'BUILD') { const d = Math.min(4, Math.max(1, P.get('buildBars') || 2)) * bar; riser(t, d, g); rollHits(t, d, sd).forEach(h => snareHit(h.t, 0.25 + 0.75 * h.prog, P.get('rollPitch') * h.prog, g)); }
        else if (sec === 'PAUSE') { const d = bar / 2 + Math.max(P.get('pauseBars'), 0.25) * bar; gapSound(t + d, Math.max(P.get('pauseBars'), 0.25) * bar + P.get('gapLen') * 60 / ctx.bpm, g); impact(t + d, g); }
        else if (sec === 'DROP') { impact(t, g); downlifter(t + 60 / ctx.bpm * 0.5, P.get('downLen') * bar, g); }
        ctx.emitUI('section_audition', { on: true, section: sec });
      });
      ctx.onUI('tension_sound', { type: 'object', required: ['name'] }, (p) => { const s = TSOUNDS[p.name]; if (!s) return ctx.fault('RUNTIME_002', 'tension sound ' + p.name); Object.keys(s).forEach(k => P.set(k, s[k])); });
      function track(srcs, ...nodes) {
        if (run) srcs.forEach(s => run.sources.push(s));
        srcs[0].onended = () => { nodes.forEach(n => { try { n.disconnect(); } catch (e) {} }); };
      }
      // ---------------- vocal
      function scheduleVocal(b) {
        if (!vox || !vox.buffer) return null;
        const buf = vox.buffer, off0 = buf.duration * P.get('vocalTrimStart'), off1 = Math.max(off0 + 0.02, buf.duration * P.get('vocalTrimEnd')), dur = off1 - off0, eighth = 60 / ctx.bpm / 2;
        let start;
        if (P.get('vocalEndOnDrop')) start = b.DROP.ts - dur;
        else { const sec = b[P.get('vocalSection')]; start = sec.ts + P.get('vocalBeat') * 60 / ctx.bpm; }
        const now = ac.currentTime + 0.005;
        const skip = Math.max(0, now - start);
        const src = ac.createBufferSource(); src.buffer = buf;
        const g = ac.createGain(); g.gain.value = P.get('vocalGain');
        src.connect(g); g.connect(vHp);
        src.start(start + skip, off0 + skip, dur - skip);
        run.sources.push(src); src.onended = () => { try { g.disconnect(); } catch (e) {} };
        // stutter: repeat the first 1/8 of the word N times right before it plays
        const N = P.get('stutter'), segs = [{ t: start + skip, offset: off0 + skip, duration: dur - skip }];
        for (let i = N; i >= 1; i--) {
          const ts = start - i * eighth; if (ts < now) continue;
          const s = ac.createBufferSource(); s.buffer = buf; const sg = ac.createGain(); sg.gain.setValueAtTime(0, ts); sg.gain.linearRampToValueAtTime(P.get('vocalGain') * (0.6 + 0.4 * (N - i + 1) / N), ts + 0.003); sg.gain.setValueAtTime(P.get('vocalGain') * (0.6 + 0.4 * (N - i + 1) / N), ts + eighth * 0.85); sg.gain.linearRampToValueAtTime(0, ts + eighth * 0.95);
          s.connect(sg); sg.connect(vHp); s.start(ts, off0, eighth); run.sources.push(s); s.onended = () => { try { sg.disconnect(); } catch (e) {} };
          segs.push({ t: ts, offset: off0, duration: eighth * 0.95 });
        }
        // 3.39 her voice on top: the rest of the mix dips under each word (her clip's own envelope), never her
        const duck = P.get('vocalPriority') > 0 && K.audio.duckUnder ? K.audio.duckUnder(buf, segs, { depthDb: -P.get('vocalPriority') }) : null;
        // reverb throw at the tail
        const th = P.get('throw');
        if (th > 0) { const te = start + dur; throwG.gain.cancelScheduledValues(now); throwG.gain.setValueAtTime(0, Math.max(now, te - dur * 0.35)); throwG.gain.linearRampToValueAtTime(th * 1.2, te); throwG.gain.setTargetAtTime(0, te + 0.05, 0.4); }
        return { start, end: start + dur, duck };
      }
      ctx.scheduleVocal = scheduleVocal;
      async function loadVocalHash(hash, name) {
        const a = K.assets.get(hash); if (!a) return ctx.fault('ASSET_001', 'vocal asset ' + hash + ' missing');
        const b = a.decoded || await K.assets.decode(hash); if (!b) return; // ASSET_002 by kernel
        vox = { hash, name: name || a.source, buffer: b, peaks: dsp.peaks(b, 300) };
        ctx.syncUI();
      }
      ctx.loadVocalHash = loadVocalHash;
      ctx.on('asset:ready', OrganismSDK.ASSET_SCHEMA, (p) => {
        const wired = K.wires.list().some(w => w.dst.instanceId === ctx.id && w.dst.hookId === 'drop.hook.asset_in' && w.src.instanceId === p._from);
        if (p.target !== ctx.id && !wired) return;
        loadVocalHash(p.hash, p.name);
      });
      ctx.onUI('vocal_load', { type: 'object', required: ['arrayBuffer'] }, async (p) => { const a = K.assets.register(p.arrayBuffer, { name: p.name || 'vocal', mime: 'audio/*' }); await loadVocalHash(a.hash, p.name); });
      ctx.onUI('vocal_place', { type: 'object' }, (p) => { if (p.section) P.set('vocalSection', p.section); if (typeof p.beat === 'number') P.set('vocalBeat', Math.max(0, p.beat)); if (p.endOnDrop !== undefined) P.set('vocalEndOnDrop', !!p.endOnDrop); });
      ctx.onUI('vocal_audition', null, () => { if (!vox) return; const s = ac.createBufferSource(); s.buffer = vox.buffer; const g = ac.createGain(); g.gain.value = P.get('vocalGain'); s.connect(g); g.connect(vHp); const a0 = vox.buffer.duration * P.get('vocalTrimStart'), a1 = Math.max(a0 + 0.02, vox.buffer.duration * P.get('vocalTrimEnd')); s.start(ac.currentTime, a0, a1 - a0); s.onended = () => g.disconnect(); });

      // ---------------- run
      function bounds(step0, t0, stepDur) {
        const b = {}; let s = step0; const B = bars();
        SECTIONS.forEach(sec => { const n = Math.round(B[sec] * 16); b[sec] = { s, e: s + n, ts: t0 + (s - step0) * stepDur, te: t0 + (s + n - step0) * stepDur }; s += n; });
        b.AFTER = { s, e: s, ts: t0 + (s - step0) * stepDur, te: 0 };
        return b;
      }
      ctx.bounds = bounds;
      function startRun(step0, t0, stepDur) {
        const b = bounds(step0, t0, stepDur);
        run = { step0, t0, b, stepDur, sources: [], restoredDJ: K.audio.getDJFilter(), cued: new Set(), bar0: Math.floor(step0 / 16) + 1 };
        const first = SECTIONS.find(sec => b[sec].e > b[sec].s); if (first && armed && armed.atStep === step0) run.cued.add(first);
        armed = null;
        // FX
        tensionPad(b.TENSION.ts, b.TENSION.te - b.TENSION.ts);
        riser(b.BUILD.ts, b.BUILD.te - b.BUILD.ts);
        const bd = b.BUILD.te - b.BUILD.ts;
        if (bd > 0) rollHits(b.BUILD.ts, bd, stepDur).forEach(h => snareHit(h.t, 0.25 + 0.75 * h.prog, P.get('rollPitch') * h.prog));
        gapSound(b.DROP.ts, (b.PAUSE.te - b.PAUSE.ts) + P.get('gapLen') * 60 / ctx.bpm);
        impact(b.DROP.ts);
        downlifter(b.DROP.ts + 60 / ctx.bpm * 0.5, P.get('downLen') * 240 / ctx.bpm);
        run.vocal = scheduleVocal(b);
        // DJ filter automation (kernel API only)
        SECTIONS.forEach(sec => { const c = cues[sec]; if (c && typeof c.djStart === 'number') { const end = typeof c.djEnd === 'number' ? c.djEnd : c.djStart; K.audio.setDJFilter(c.djStart, b[sec].ts); K.audio.setDJFilter(end, Math.max(b[sec].ts + 0.01, b[sec].te - 0.005), true); } });
        K.audio.setDJFilter(run.restoredDJ, b.DROP.ts); // drop always opens the filter
        ctx.emitUI('run', { state: 'running', t0, sections: Object.fromEntries(SECTIONS.map(s => [s, [b[s].ts, b[s].te]])), vocal: run.vocal });
        plan();
      }
      ctx.startRun = startRun;
      function emitCue(sec, step) {
        const c = cues[sec]; if (!c || !c.target || !c.slot) return;
        if (!K.registry.has(c.target)) { const k = 'cue:' + c.target; if (!logged.has(k)) { logged.add(k); ctx.fault('RUNTIME_003', `${sec} cue target ${c.target} gone — cue skipped`); } return; }
        ctx.emit('seq:pattern_cue', { target: c.target, slot: c.slot, step });
      }
      function sectionEdges(sec, stepNow) { // side effects due at the start of a section
        const c = cues[sec] || {};
        if (c.energyTarget && typeof c.energy === 'number') { if (K.registry.has(c.energyTarget)) ctx.emit('ui:config_change:' + c.energyTarget, { key: 'energy', value: c.energy }); else if (!logged.has('en' + c.energyTarget)) { logged.add('en' + c.energyTarget); ctx.fault('RUNTIME_003', 'energy target gone — skipped'); } }
        const allMuted = new Set(SECTIONS.flatMap(s => (cues[s] && cues[s].mutes) || []));
        allMuted.forEach(ch => { if (K.registry.has(ch)) ctx.emit('ui:config_change:' + ch, { key: 'mute', value: (c.mutes || []).includes(ch) }); });
      }
      function finishRun(reason) {
        if (!run) return;
        const t = ac.currentTime;
        if (reason === 'abort') { run.sources.forEach(s => { try { s.stop(t + 0.01); } catch (e) {} }); K.audio.setDJFilter({ value: run.restoredDJ }); if (run.vocal && run.vocal.duck && K.audio.duckUnderReset) K.audio.duckUnderReset(t); }
        else K.audio.setDJFilter(run.restoredDJ, Math.max(t, run.b.AFTER.ts)); // scheduled restore (exact even when ticks run ahead)
        // unmute everything this run muted
        new Set(SECTIONS.flatMap(s => (cues[s] && cues[s].mutes) || [])).forEach(ch => { if (K.registry.has(ch)) ctx.emit('ui:config_change:' + ch, { key: 'mute', value: false }); });
        if (reason === 'abort') { throwG.gain.cancelScheduledValues(t); throwG.gain.setTargetAtTime(0, t, 0.05); }
        run = null; ctx.emitUI('run', { state: reason === 'abort' ? 'aborted' : 'idle' }); ctx.syncUI();
      }
      ctx.finishRun = finishRun;
      let lastStep = -1, stoppedPos = 0, playingNow = false;
      ctx.on('transport:state', { type: 'object' }, (p) => { if (!p.playing) stoppedPos = p.position16 || 0; playingNow = !!p.playing; });
      ctx.onPlay((p) => {
        playingNow = true;
        const st = typeof p.step16 === 'number' ? p.step16 : 0;
        if (armed && armed.whileStopped) { armed = null; arm({ atStep: Math.ceil(st / 16) * 16 }); }
        else if (!armed && !run && P.get('autoFire') && st === 0) arm({ atStep: 0 });
      });
      ctx.onTick((tk) => {
        lastStep = tk.step16; playingNow = true;
        if (armed && tk.step16 >= armed.atStep) startRun(tk.step16, tk.time, tk.stepDur);
        if (!run) return;
        const b = run.b;
        for (const sec of SECTIONS.concat(['AFTER'])) {
          if (run.cued.has(sec)) continue;
          if (tk.step16 >= b[sec].s - 1) { run.cued.add(sec); if (b[sec].e > b[sec].s || sec === 'AFTER') emitCue(sec, b[sec].s); }
        }
        SECTIONS.forEach(sec => { if (tk.step16 === b[sec].s && b[sec].e > b[sec].s) { sectionEdges(sec, tk.step16); ctx.emitUI('section', { section: sec, time: tk.time }); if (sec === 'DROP') ctx.emit('edm:drop-fired', { time: b.DROP.ts, bar: Math.floor(b.DROP.s / 16) + 1 + (b.DROP.s % 16) / 16 }); } });
        if (tk.step16 >= b.AFTER.s) finishRun('done');
      });
      ctx.onStop(() => { playingNow = false; if (run) finishRun('abort'); });
      function arm(o) {
        if (run) return;
        o = o || {};
        let at = o.atStep;
        if (at === undefined) {
          const from = playingNow ? lastStep + 1 : stoppedPos;
          const q = P.get('startMode') === 'nextBeat' ? beatSteps : barSteps;
          at = Math.ceil(from / q) * q;
        }
        armed = { atStep: at, whileStopped: !playingNow && o.atStep === undefined };
        // the first section's pattern cue goes out now so the sequencer switches on the very first step
        const first = SECTIONS.find(sec => bars()[sec] > 0);
        if (first) emitCue(first, at);
        ctx.emitUI('run', { state: 'armed', atStep: at }); ctx.syncUI();
      }
      ctx.arm = arm;
      ctx.onUI('fire', null, () => arm({}));
      ctx.onUI('abort', null, () => { armed = null; finishRun('abort'); });
      ctx.on('ui:drop_fire', { type: 'object' }, (p) => { if (!p.target || p.target === ctx.id) arm({}); });
      // timeline marker 'DROP' at bar N → start early enough that DROP lands on bar N
      ctx.on('timeline:marker', { type: 'object', required: ['name', 'bar', 'time'] }, (p) => {
        if (String(p.name).toUpperCase() !== 'DROP' || run) return;
        const pre = (bars().TENSION + bars().BUILD + bars().PAUSE) * 16;
        const dropStep = Math.round((p.bar - 1) * 16);
        arm({ atStep: Math.max(0, dropStep - pre) });
      });
      // edits
      ctx.onUI('section_edit', { type: 'object', required: ['section', 'bars'] }, (p) => { const key = { TENSION: 'tensionBars', BUILD: 'buildBars', PAUSE: 'pauseBars', DROP: 'dropBars' }[p.section]; if (!key) return ctx.fault('RUNTIME_002', 'section ' + p.section); P.set(key, Math.round(p.bars * 4) / 4); });
      ctx.onUI('cue_edit', { type: 'object', required: ['section', 'patch'] }, (p) => { if (!cues[p.section]) return ctx.fault('RUNTIME_002', 'section ' + p.section); Object.assign(cues[p.section], p.patch); Object.keys(cues[p.section]).forEach(k => { if (cues[p.section][k] === null) delete cues[p.section][k]; }); ctx.syncUI(); });
      ctx.setCues = (c) => { cues = Object.assign({ TENSION: {}, BUILD: {}, PAUSE: {}, DROP: {}, AFTER: {} }, JSON.parse(JSON.stringify(c))); ctx.syncUI(); };
      ctx.stateExtra = () => ({
        tensionSounds: Object.keys(TSOUNDS),
        cues, sections: SECTIONS, colors: COLORS, bars: bars(), armed: !!armed, running: !!run,
        vocal: vox ? { name: vox.name, duration: vox.buffer.duration, peaks: vox.peaks } : null,
        sequencers: K.registry.byOrganism('eravos.sequencer').map(r => ({ value: r.instance_id, label: '⬛ Sequencer ' + r.instance_id.split('-').slice(-2).join('') })),
        labs: K.registry.byOrganism('eravos.edm-lab').map(r => ({ value: r.instance_id, label: '⚗ EDM Lab ' + r.instance_id.split('-').slice(-2).join('') })),
        channels: K.registry.byOrganism('eravos.channel').map(r => ({ value: r.instance_id, label: '🎚 ' + (K.registry.readParam(ctx.id, r.instance_id, 'name') || r.instance_id) })),
      });
      ctx.on('kernel:organism-mounted', null, () => ctx.syncUI());
      ctx.saveExtra = () => ({ cues, vocal: vox ? { hash: vox.hash, name: vox.name } : null });
      ctx.loadExtra = async (x) => { if (!x) return; if (x.cues) cues = Object.assign({ TENSION: {}, BUILD: {}, PAUSE: {}, DROP: {}, AFTER: {} }, x.cues); if (x.vocal && x.vocal.hash) await loadVocalHash(x.vocal.hash, x.vocal.name); ctx.syncUI(); };
      ctx.internals = { get run() { return run; }, get armed() { return armed; }, get cues() { return cues; }, get vox() { return vox; } };
      setTimeout(plan, 0);
      return { unmount() { if (run) finishRun('abort'); } };
    },
  });
})();

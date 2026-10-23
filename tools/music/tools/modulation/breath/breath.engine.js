/* eravos.breath 2.0.0 — Breath · spec eravos.organism.breath (P8.4 from v10 VAGAL_INSTRUMENT · rebuilt P44: "same with breath")
 * A paced-breathing guide that is also an instrument. Its clock is a breath cycle in seconds, not bars: a list of segments
 * (inhale · top-up sip · hold · exhale · rest), so patterns like the physiological sigh (two inhales, one long exhale) are real.
 *   OUT      'breath' 0..1 (floor + depth × the breath, eased by the chosen curve) · 'inverse' (1 − breath) · 'gate' (1 while
 *            breathing in) — wire them to an organ's breath, a cutoff, a reverb mix … ; 'out' its own sound ; breath:phase and
 *            breath:session events
 *   SESSION  open, or 1–20 minutes with a gentle end (fade, three bells, a log of sessions kept with the window);
 *            programs: steady · slow down (the cycle lengthens over the session) · longer exhale (the exhale grows)
 *   SOUND    pad · choir · drone · air only ; chord ; octave ; rise ±12 st on the inhale ; brightness ; an AIR layer (filtered
 *            noise that whooshes with you) ; bells (bell · bowl · chime · click) on the turns ; level
 *   GUIDE    optional spoken cues (the UI speaks them on time) ; snap to bars at the song tempo
 * Stop / Stop all pause it (signal rests at 0); ▶ resumes. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  // a pattern = segments [phase, seconds, level it travels to]. phases: in · sip (top-up inhale) · hold · out · rest
  const PATTERNS = {
    COHERENCE: { seg: [['in', 5, 1], ['out', 5, 0]], about: '5 in · 5 out — six breaths a minute, the classic calm' },
    RESONANCE: { seg: [['in', 5.5, 1], ['out', 5.5, 0]], about: '5.5 in · 5.5 out — about 5.5 breaths a minute' },
    '4-7-8': { seg: [['in', 4, 1], ['hold', 7, 1], ['out', 8, 0]], about: '4 in · hold 7 · 8 out — for winding down; stop if dizzy' },
    BOX: { seg: [['in', 4, 1], ['hold', 4, 1], ['out', 4, 0], ['rest', 4, 0]], about: '4 · 4 · 4 · 4 — steady and square' },
    TRIANGLE: { seg: [['in', 4, 1], ['hold', 4, 1], ['out', 4, 0]], about: '4 in · hold 4 · 4 out' },
    EXTENDED: { seg: [['in', 4, 1], ['out', 8, 0]], about: '4 in · 8 out — a long exhale' },
    '2-TO-1': { seg: [['in', 3, 1], ['out', 6, 0]], about: 'the exhale twice the inhale' },
    'PHYSIOLOGICAL SIGH': { seg: [['in', 2.2, 0.8], ['sip', 0.8, 1], ['out', 6, 0], ['rest', 1, 0]], about: 'in through the nose, a second short sip on top, a long slow out' },
    UJJAYI: { seg: [['in', 6, 1], ['out', 6, 0]], about: '6 · 6 — slow, even ocean breath' },
    SLEEP: { seg: [['in', 4, 1], ['out', 8, 0], ['rest', 3, 0]], about: '4 in · 8 out · rest 3 — slower and slower' },
    ENERGIZE: { seg: [['in', 2, 1], ['out', 2, 0]], about: '2 · 2 — brisk; stop if dizzy' },
    'HANGING TREE': { seg: [['in', 6, 1], ['hold', 2, 1], ['out', 6, 0], ['rest', 2, 0]], about: '6 · 2 · 6 · 2 — the song’s slow sway' },
    CUSTOM: null,
  };
  const PHASE_NAME = { in: 'inhale', sip: 'inhale', hold: 'hold', out: 'exhale', rest: 'rest' };
  const CHORDS = { fifth: [0, 7, 12], minor: [0, 3, 7], major: [0, 4, 7], sus2: [0, 2, 7], octaves: [0, 12, 24], 'minor 9': [0, 3, 14] };
  const BELLS = { bell: { k: [1, 2.76], d: 2 }, bowl: { k: [1, 2.32, 4.25], d: 6 }, chime: { k: [1, 3, 5.4], d: 1.2 }, click: { k: [], d: 0.05 } };
  // curve shapes x 0..1 → 0..1 (rising); the falling side is mirrored
  const SHAPES = { sine: (x) => 0.5 - 0.5 * Math.cos(Math.PI * x), linear: (x) => x, natural: (x) => 1 - Math.pow(1 - x, 2.2), late: (x) => Math.pow(x, 2) };
  OrganismFactory.define({
    id: 'eravos.breath', domain: 'music', version: '2.0.0', label: 'Breath', icon: '◎', accent: '#8844ff', phase: 'P14',
    category: 'Modulation', blurb: 'Breathe with the music: a breath-cycle clock with 12 patterns and timed sessions — its sound swells with you, and three outputs drive anything wired to it.',
    size: { w: 560, h: 720 }, minSize: { w: 400, h: 480 },
    permissions: ['audio_out', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.mod_source'],
    needs: { mode: 'music.lab', notes: ['Stop if you feel dizzy.'], works_with: ['eravos.organ', 'eravos.pad-forge', 'eravos.fx-filter'] },
    hooks: [Object.assign(S.mod_out('breath.hook.breath_out', 'breath'), { intent: 'breath 0..1 — wire to organ breath, cutoffs, mixes' }),
      Object.assign(S.mod_out('breath.hook.inverse_out', 'inverse'), { intent: '1 − breath: opens as you breathe out' }),
      Object.assign(S.mod_out('breath.hook.gate_out', 'gate'), { intent: '1 while breathing in, 0 otherwise' }),
      S.event('breath.hook.phase_out', 'out', 'breath:phase', { type: 'object', required: ['phase', 'cycle', 'time'] }, '1.0.0'),
      S.event('breath.hook.session_out', 'out', 'breath:session', { type: 'object', required: ['state'] }, '1.0.0'),
      S.audio_out('breath.hook.audio_out'), S.theory_in('breath.hook.theory_in')],
    face: ['pattern', 'session', 'voice', 'rise', 'air', 'level'],
    config: [
      { key: 'pattern', type: 'enum', options: Object.keys(PATTERNS), default: 'COHERENCE', label: 'Pattern', group: 'BREATH' },
      { key: 'cIn', type: 'number', default: 5, min: 0.5, max: 20, step: 0.1, unit: 's', label: 'In', group: 'CUSTOM' },
      { key: 'cHold', type: 'number', default: 0, min: 0, max: 20, step: 0.1, unit: 's', label: 'Hold', group: 'CUSTOM' },
      { key: 'cOut', type: 'number', default: 5, min: 0.5, max: 30, step: 0.1, unit: 's', label: 'Out', group: 'CUSTOM' },
      { key: 'cRest', type: 'number', default: 0, min: 0, max: 20, step: 0.1, unit: 's', label: 'Rest', group: 'CUSTOM' },
      { key: 'pace', type: 'number', default: 1, min: 0.5, max: 2, step: 0.01, label: 'Pace', group: 'BREATH', hint: '× every length: 0.5 twice as fast … 2 twice as slow' },
      { key: 'curve', type: 'enum', options: Object.keys(SHAPES), default: 'sine', label: 'Curve', group: 'BREATH', hint: 'how the breath moves: sine eases both ends · natural starts quickly and settles · late builds slowly' },
      { key: 'tempoLink', type: 'boolean', default: false, label: 'Snap to bars', group: 'BREATH' },
      { key: 'session', type: 'enum', options: ['open', '1 min', '3 min', '5 min', '10 min', '15 min', '20 min'], default: 'open', label: 'Session', group: 'SESSION' },
      { key: 'program', type: 'enum', options: ['steady', 'slow down', 'longer exhale'], default: 'steady', label: 'Program', group: 'SESSION', hint: 'slow down: the cycle grows to 1.4× over the session · longer exhale: only the exhale grows (to 1.6×)' },
      { key: 'guide', type: 'boolean', default: false, label: 'Voice guide', group: 'SESSION', hint: 'a quiet voice says in · hold · out' },
      { key: 'depth', type: 'number', default: 1, min: 0, max: 1, step: 0.01, label: 'Depth', group: 'OUTPUT', hint: 'how far the breath output travels' },
      { key: 'floor', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Floor', group: 'OUTPUT', hint: 'where the breath output rests at the bottom' },
      { key: 'voiceOn', type: 'boolean', default: true, label: 'Sound', group: 'SOUND' },
      { key: 'voice', type: 'enum', options: ['pad', 'choir', 'drone', 'air only'], default: 'pad', label: 'Voice', group: 'SOUND' },
      { key: 'chord', type: 'enum', options: Object.keys(CHORDS), default: 'fifth', label: 'Chord', group: 'SOUND' },
      { key: 'octave', type: 'integer', default: 3, min: 1, max: 6, label: 'Octave', group: 'SOUND' },
      { key: 'rise', type: 'number', default: 2, min: -12, max: 12, step: 0.1, unit: 'st', label: 'Rise', group: 'SOUND', hint: 'the sound rises this much on the inhale (− falls)' },
      { key: 'bright', type: 'number', default: 0.4, min: 0, max: 1, step: 0.01, label: 'Bright', group: 'SOUND' },
      { key: 'air', type: 'number', default: 0.25, min: 0, max: 1, step: 0.01, label: 'Air', group: 'SOUND', hint: 'a breath of filtered noise that whooshes with you' },
      { key: 'bell', type: 'boolean', default: true, label: 'Bell', group: 'SOUND' },
      { key: 'bellTone', type: 'enum', options: Object.keys(BELLS), default: 'bell', label: 'Bell tone', group: 'SOUND' },
      { key: 'bellLevel', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Bell level', group: 'SOUND' },
      { key: 'level', type: 'number', default: 0.5, min: 0, max: 1.5, step: 0.01, label: 'Level', group: 'SOUND' },
    ],
    ui_hooks: ['run', 'session_end', 'log_clear'],
    defaultPreset: 'COHERENCE',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp, MT = window.MusicTheory, node = (n) => { ctx.track(n); return n; };
      // ---- the breath signal (raw 0..1) and its three outputs
      const sig = node(ac.createConstantSource()); sig.offset.value = 0; sig.start();
      const one = node(ac.createConstantSource()); one.offset.value = 1; one.start();
      const outB = node(ac.createGain()), sigDepth = node(ac.createGain()), floorG = node(ac.createGain()); sig.connect(sigDepth); sigDepth.connect(outB); one.connect(floorG); floorG.connect(outB);
      const outInv = node(ac.createGain()), neg = node(ac.createGain()); neg.gain.value = -1; one.connect(outInv); sig.connect(neg); neg.connect(outInv);
      const gate = node(ac.createConstantSource()); gate.offset.value = 0; gate.start();
      const shapeOut = () => { const d = P.get('depth'), f = P.get('floor'); sigDepth.gain.setTargetAtTime(d * (1 - f), ac.currentTime, 0.02); floorG.gain.setTargetAtTime(f, ac.currentTime, 0.02); };
      { const d = P.get('depth'), f = P.get('floor'); sigDepth.gain.value = d * (1 - f); floorG.gain.value = f; }
      ['depth', 'floor'].forEach(k => P.onChange(k, shapeOut));
      ctx.port('breath', { kind: 'mod', direction: 'out', node: outB, range: { min: 0, max: 1 }, label: 'breath' });
      ctx.port('inverse', { kind: 'mod', direction: 'out', node: outInv, range: { min: 0, max: 1 }, label: 'inverse' });
      ctx.port('gate', { kind: 'mod', direction: 'out', node: gate, range: { min: 0, max: 1 }, label: 'inhale gate' });

      // ---- the sound: pad (triangles) · choir (saws through two vowel formants) · drone (saw + square) → LP → swell → out
      const pad = node(ac.createGain()), lp = node(ac.createBiquadFilter()), out = node(ac.createGain()); lp.type = 'lowpass'; lp.Q.value = 0.6; pad.connect(lp); lp.connect(out);
      const sigToLev = node(ac.createGain()), sigToCut = node(ac.createGain()), sigToPitch = node(ac.createGain()); pad.gain.value = 0.15; sig.connect(sigToLev); sigToLev.connect(pad.gain); sig.connect(sigToCut); sigToCut.connect(lp.frequency); sig.connect(sigToPitch);
      const bank = (type, n, into) => Array.from({ length: n }, (_, i) => { const o = node(ac.createOscillator()); o.type = type; o.detune.value = [-7, 0, 6][i % 3]; sigToPitch.connect(o.detune); o.connect(into); o.start(); return o; });
      const vPad = node(ac.createGain()), vChoir = node(ac.createGain()), vDrone = node(ac.createGain()); [vPad, vDrone].forEach(g => g.connect(pad));
      const fA = node(ac.createBiquadFilter()), fB = node(ac.createBiquadFilter()), choirIn = node(ac.createGain()); fA.type = fB.type = 'bandpass'; fA.frequency.value = 730; fB.frequency.value = 1090; fA.Q.value = 6; fB.Q.value = 8; choirIn.gain.value = 3;
      vChoir.connect(fA); vChoir.connect(fB); fA.connect(choirIn); fB.connect(choirIn); choirIn.connect(pad);
      const tris = bank('triangle', 3, vPad), saws = bank('sawtooth', 3, vChoir), drones = [bank('sawtooth', 1, vDrone)[0], bank('square', 1, vDrone)[0]];
      // air: looping noise → band-pass that opens with the breath, loud as you breathe
      const nb = dsp.noise(ac, 2), air = node(ac.createBufferSource()), airBp = node(ac.createBiquadFilter()), airG = node(ac.createGain()), sigToAir = node(ac.createGain()), sigToAirF = node(ac.createGain());
      air.buffer = nb; air.loop = true; airBp.type = 'bandpass'; airBp.Q.value = 0.8; airBp.frequency.value = 500; airG.gain.value = 0; air.connect(airBp); airBp.connect(airG); airG.connect(out); air.start();
      sig.connect(sigToAir); sigToAir.connect(airG.gain); sig.connect(sigToAirF); sigToAirF.connect(airBp.frequency); sigToAirF.gain.value = 2600;
      const bellG = node(ac.createGain()); bellG.connect(out);
      ctx.port('out', { kind: 'audio', direction: 'out', node: out, label: 'breath sound' });
      function tune() {
        const k = ctx.key || { root: 9 }, base = 12 * (P.get('octave') + 1) + k.root, iv = CHORDS[P.get('chord')] || CHORDS.fifth, t = ac.currentTime;
        tris.forEach((o, i) => o.frequency.setTargetAtTime(MT.hz(base + iv[i]), t, 0.2));
        saws.forEach((o, i) => o.frequency.setTargetAtTime(MT.hz(base + iv[i]), t, 0.2));
        drones[0].frequency.setTargetAtTime(MT.hz(base - 12), t, 0.2); drones[1].frequency.setTargetAtTime(MT.hz(base + 7 - 12), t, 0.2);
      }
      function apply() {
        const t = ac.currentTime, on = P.get('voiceOn'), v = P.get('voice'), br = P.get('bright');
        sigToPitch.gain.setTargetAtTime(P.get('rise') * 100, t, 0.05);
        sigToLev.gain.setTargetAtTime(on && v !== 'air only' ? 0.55 : 0, t, 0.1); pad.gain.setTargetAtTime(on && v !== 'air only' ? 0.12 : 0, t, 0.1);
        vPad.gain.setTargetAtTime(v === 'pad' ? 1 : 0, t, 0.1); vChoir.gain.setTargetAtTime(v === 'choir' ? 0.5 : 0, t, 0.1); vDrone.gain.setTargetAtTime(v === 'drone' ? 0.35 : 0, t, 0.1);
        lp.frequency.setTargetAtTime(200 + 1400 * br, t, 0.1); sigToCut.gain.setTargetAtTime(600 + 3200 * br, t, 0.1);
        sigToAir.gain.setTargetAtTime(on ? P.get('air') * 0.35 : 0, t, 0.1); airBp.frequency.setTargetAtTime(300 + 900 * br, t, 0.1);
        bellG.gain.setTargetAtTime(P.get('bellLevel') * 2, t, 0.05);
        dsp.setSmooth(out.gain, P.get('level'), ac);
      }
      ['rise', 'voiceOn', 'voice', 'bright', 'air', 'bellLevel', 'level'].forEach(k => P.onChange(k, apply)); ['chord', 'octave'].forEach(k => P.onChange(k, tune));
      ctx.onKey(tune); tune(); apply();
      function ring(t, kind, pitch) {
        const B = BELLS[P.get('bellTone')] || BELLS.bell, f0 = MT.hz(12 * (P.get('octave') + 3) + ((ctx.key || { root: 9 }).root)) * pitch;
        if (!B.k.length) { const n = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); n.buffer = nb; f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 3; g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05); n.connect(f); f.connect(g); g.connect(bellG); n.start(t, 0); n.stop(t + 0.06); n.onended = () => { try { n.disconnect(); f.disconnect(); g.disconnect(); } catch (e) {} }; return; }
        B.k.forEach((k, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f0 * k; g.gain.setValueAtTime(0.05 / (i + 1), t); g.gain.exponentialRampToValueAtTime(0.0001, t + B.d / (1 + i * 0.4)); o.connect(g); g.connect(bellG); o.start(t); o.stop(t + B.d + 0.1); o.onended = () => { try { o.disconnect(); g.disconnect(); } catch (e) {} }; });
      }

      // ---- the cycle: segments, scaled by pace, program and tempo link
      let sessionT0 = ac.currentTime, nextAt = ac.currentTime + 0.05, segI = 0, cycle = 0, segsNow = null;
      const minutes = () => { const m = /^(\d+)/.exec(P.get('session')); return m ? +m[1] : 0; };
      const progress = () => { const m = minutes(); return m ? Math.min(1, (nextAt - sessionT0) / (m * 60)) : Math.min(1, cycle / 20); };
      function segments() {
        const pat = PATTERNS[P.get('pattern')];
        let seg = pat ? pat.seg.map(s => s.slice()) : [['in', P.get('cIn'), 1], ['hold', P.get('cHold'), 1], ['out', P.get('cOut'), 0], ['rest', P.get('cRest'), 0]];
        const pace = P.get('pace'), pr = P.get('program'), k = progress();
        seg = seg.map(([ph, sec, to]) => [ph, sec * pace * (pr === 'slow down' ? 1 + 0.4 * k : 1) * (pr === 'longer exhale' && ph === 'out' ? 1 + 0.6 * k : 1), to]);
        if (P.get('tempoLink')) { const bar = 4 * 60 / ctx.bpm, tot = seg.reduce((a, s) => a + s[1], 0), bars = Math.max(1, Math.round(tot / bar)), f = bars * bar / tot; seg = seg.map(s => [s[0], s[1] * f, s[2]]); }
        return seg;
      }
      // the 4-phase view older callers read: [in (incl. sips), hold, out, rest] seconds
      function durations() { const d = [0, 0, 0, 0]; segments().forEach(([ph, sec]) => { d[{ in: 0, sip: 0, hold: 1, out: 2, rest: 3 }[ph]] += sec; }); return d; }
      ctx.durations = durations; ctx.segments = segments;
      const curveOf = (n, from, to) => { const f = SHAPES[P.get('curve')] || SHAPES.sine, up = to >= from; return Float32Array.from({ length: n }, (_, i) => { const x = i / (n - 1), y = up ? f(x) : 1 - f(1 - x); return from + (to - from) * y; }); };
      let level = 0, ended = false;   // where the breath is at the end of what is scheduled
      // stop whatever is scheduled from t on and hold the value there (a curve in progress included)
      const hold = (prm, t) => { if (prm.cancelAndHoldAtTime) prm.cancelAndHoldAtTime(t); else { prm.cancelScheduledValues(t); prm.setValueAtTime(prm.value, t); } };
      function scheduleSeg() {
        if (segI === 0) segsNow = segments();
        const s = segsNow[segI], [ph, len, to] = s, t = nextAt;
        if (len > 0) {
          if (ph === 'in' || ph === 'sip' || ph === 'out') sig.offset.setValueCurveAtTime(curveOf(64, level, to), t, len);
          else sig.offset.setValueAtTime(level, t);
          gate.offset.setValueAtTime(ph === 'in' || ph === 'sip' ? 1 : 0, t);
          const name = PHASE_NAME[ph];
          if (ph !== 'sip') ctx.emit('breath:phase', { phase: name, cycle, time: t, duration: len });
          ctx.emitUI('phase', { phase: name, sip: ph === 'sip', time: t, duration: len, cycle, seg: segI, segs: segsNow.map(x => [PHASE_NAME[x[0]], x[1]]) });
          if (P.get('bell') && (ph === 'in' || ph === 'out')) ring(t, ph, ph === 'out' ? 0.75 : 1);
          level = to;
        }
        nextAt = t + len; segI = (segI + 1) % segsNow.length;
        if (segI === 0) { cycle++; const m = minutes(); if (m && nextAt - sessionT0 >= m * 60) endSession(nextAt); }
      }
      // ---- session: begins on ▶ (or open), ends on time with a fade and three bells; a short log travels with the window
      let log = [];
      function endSession(t) {
        if (ended) return; ended = true;
        const secs = Math.round(t - sessionT0), rec = { date: new Date().toISOString().slice(0, 10), minutes: Math.round(secs / 6) / 10, cycles: cycle, pattern: P.get('pattern') };
        log.push(rec); if (log.length > 60) log = log.slice(-60);
        [0, 1.2, 2.4].forEach((d, i) => ring(t + d, 'end', [1, 0.75, 0.5][i]));
        ctx.emit('breath:session', { state: 'done', seconds: secs, cycles: cycle, pattern: P.get('pattern'), time: t });
        ctx.atAudioTime(t, () => { pause(t); ctx.emitUI('session', { state: 'done', rec }); ctx.syncUI(); });
      }
      // 3.28 stop contract: Stop / Stop all pause the breath (sound quiet, signal rests at 0); ▶ resumes as a new session
      let paused = false;
      function pause(t) { paused = true; t = Math.max(ac.currentTime, t || 0); hold(sig.offset, t); sig.offset.linearRampToValueAtTime(0, t + 0.3); gate.offset.cancelScheduledValues(t); gate.offset.setValueAtTime(0, t); pad.gain.cancelScheduledValues(t); pad.gain.setTargetAtTime(0, t, 0.1); level = 0; ctx.syncUI(); }
      function resume() { paused = false; ended = false; apply(); sessionT0 = ac.currentTime; cycle = 0; restart(); ctx.emit('breath:session', { state: 'begin', time: ac.currentTime, pattern: P.get('pattern') }); ctx.syncUI(); }
      ctx.onSilence((p) => pause(p.time));
      ctx.onUI('run', { type: 'object', required: ['on'] }, (p) => p.on ? resume() : pause());
      ctx.onUI('session_end', null, () => { if (!paused) endSession(ac.currentTime + 0.05); });
      ctx.onUI('log_clear', null, () => { log = []; ctx.syncUI(); });
      ctx.stateExtra = () => ({ paused, log, about: (PATTERNS[P.get('pattern')] || { about: 'your own lengths: In · Hold · Out · Rest' }).about, minutes: minutes(), sessionT0, now: ac.currentTime });
      ctx.saveExtra = () => ({ log });
      ctx.loadExtra = (x) => { if (x && Array.isArray(x.log)) log = x.log.slice(-60); };
      ctx.isPaused = () => paused;
      ctx.scheduleAhead = (sec) => { if (paused) { nextAt = ac.currentTime + sec; return; } let guard = 0; while (nextAt < ac.currentTime + sec && guard++ < 128 && !ended) scheduleSeg(); };
      ctx.scheduleAhead(0.4);
      ctx.interval(() => {
        ctx.scheduleAhead(0.6);
        const tot = segsNow ? segsNow.reduce((a, s) => a + s[1], 0) : 10;
        ctx.emitUI('tick', { value: sig.offset.value, until: nextAt - ac.currentTime, cycle, elapsed: paused ? 0 : ac.currentTime - sessionT0, remaining: minutes() && !paused ? Math.max(0, minutes() * 60 - (ac.currentTime - sessionT0)) : null, bpm: 60 / tot, paused });
      }, 100);
      const restart = () => { const t = ac.currentTime + 0.05; hold(sig.offset, t); gate.offset.cancelScheduledValues(t); level = sig.offset.value; nextAt = t; segI = 0; ctx.scheduleAhead(0.4); };
      ['pattern', 'cIn', 'cHold', 'cOut', 'cRest', 'tempoLink', 'pace', 'curve', 'program'].forEach(k => P.onChange(k, () => { if (!paused) restart(); ctx.syncUI(); }));
      P.onChange('session', () => { sessionT0 = ac.currentTime; ended = false; ctx.syncUI(); });
      ctx.internals = { sig, out: outB, inverse: outInv, gate, PATTERNS };
      return {};
    },
  });
})();

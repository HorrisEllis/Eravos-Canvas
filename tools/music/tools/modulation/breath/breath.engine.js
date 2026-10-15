/* eravos.breath 1.0.0 — Breath · spec eravos.organism.breath (P8.4, from v10 VAGAL_INSTRUMENT)
 * A paced-breathing guide that is also an instrument: its clock is a breath cycle [inhale, hold, exhale, hold] in
 * seconds, not bars. It emits a continuous 0..1 breath signal (ease-in rise on the inhale, flat holds, ease-out fall
 * on the exhale) on its 'breath' port — wire it to the Gothic Organ's breath input, a filter, a reverb — and a
 * breath:phase event. Its own soft pad swells with you (in the song key). Optional bar-snapped tempo link and bell. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const PATTERNS = { COHERENCE: [5, 0, 5, 0], '4-7-8': [4, 7, 8, 0], BOX: [4, 4, 4, 4], EXTENDED: [4, 0, 8, 0], ENERGIZE: [2, 0, 2, 0], 'HANGING TREE': [6, 2, 6, 2], CUSTOM: null };
  const PHASES = ['inhale', 'hold', 'exhale', 'rest'];
  OrganismFactory.define({
    id: 'eravos.breath', domain: 'music', version: '1.0.0', label: 'Breath', icon: '◎', accent: '#8844ff', phase: 'P14',
    category: 'Modulation', blurb: 'Breathe with the music: a breath-cycle clock that swells the sound on the inhale — and drives anything wired to it.',
    size: { w: 440, h: 520 }, minSize: { w: 360, h: 420 },
    permissions: ['audio_out', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.mod_source'],
    needs: { mode: 'music.lab', notes: ['Stop if you feel dizzy.'], works_with: ['eravos.organ', 'eravos.pad-forge', 'eravos.fx-filter'] },
    hooks: [Object.assign(S.mod_out('breath.hook.breath_out', 'breath'), { intent: 'breath 0..1 — wire to organ breath, cutoffs, mixes' }),
      S.event('breath.hook.phase_out', 'out', 'breath:phase', { type: 'object', required: ['phase', 'cycle', 'time'] }, '1.0.0'),
      S.audio_out('breath.hook.audio_out'), S.theory_in('breath.hook.theory_in')],
    config: [
      { key: 'pattern', type: 'enum', options: Object.keys(PATTERNS), default: 'COHERENCE', label: 'Pattern', group: 'BREATH' },
      { key: 'cIn', type: 'number', default: 5, min: 0.5, max: 12, step: 0.1, unit: 's', label: 'In', group: 'CUSTOM' },
      { key: 'cHold', type: 'number', default: 0, min: 0, max: 12, step: 0.1, unit: 's', label: 'Hold', group: 'CUSTOM' },
      { key: 'cOut', type: 'number', default: 5, min: 0.5, max: 12, step: 0.1, unit: 's', label: 'Out', group: 'CUSTOM' },
      { key: 'cRest', type: 'number', default: 0, min: 0, max: 12, step: 0.1, unit: 's', label: 'Rest', group: 'CUSTOM' },
      { key: 'tempoLink', type: 'boolean', default: false, label: 'Snap to bars', group: 'BREATH' },
      { key: 'voiceOn', type: 'boolean', default: true, label: 'Pad', group: 'SOUND' },
      { key: 'rise', type: 'number', default: 2, min: 0, max: 7, step: 0.1, unit: 'st', label: 'Rise', group: 'SOUND', hint: 'the pad rises this much on the inhale' },
      { key: 'bell', type: 'boolean', default: true, label: 'Bell', group: 'SOUND' },
      { key: 'level', type: 'number', default: 0.5, min: 0, max: 1.5, step: 0.01, label: 'Level', group: 'SOUND' },
    ],
    ui_hooks: ['run'],
    defaultPreset: 'COHERENCE',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp, MT = window.MusicTheory, node = (n) => { ctx.track(n); return n; };
      const sig = node(ac.createConstantSource()); sig.offset.value = 0; sig.start();
      ctx.port('breath', { kind: 'mod', direction: 'out', node: sig, range: { min: 0, max: 1 }, label: 'breath' });
      // pad: 3 detuned triangles + LP; pitch + brightness + level follow the breath
      const pad = node(ac.createGain()), lp = node(ac.createBiquadFilter()), out = node(ac.createGain()); lp.type = 'lowpass'; lp.frequency.value = 500; lp.Q.value = 0.6; pad.connect(lp); lp.connect(out);
      const sigToLev = node(ac.createGain()), sigToCut = node(ac.createGain()), sigToPitch = node(ac.createGain()); pad.gain.value = 0.15; sig.connect(sigToLev); sigToLev.connect(pad.gain); sig.connect(sigToCut); sigToCut.connect(lp.frequency); sigToCut.gain.value = 1800; sig.connect(sigToPitch);
      const tris = [-7, 0, 6].map(d => { const o = node(ac.createOscillator()); o.type = 'triangle'; o.detune.value = d; sigToPitch.connect(o.detune); o.connect(pad); o.start(); return o; });
      const bellG = node(ac.createGain()); bellG.connect(out);
      ctx.port('out', { kind: 'audio', direction: 'out', node: out, label: 'breath pad' });
      function tune() { const k = ctx.key || { root: 9 }; const f = MT.hz(48 + k.root); tris.forEach((o, i) => o.frequency.setTargetAtTime(f * [1, 1.5, 2][i], ac.currentTime, 0.2)); }
      function apply() { sigToPitch.gain.setTargetAtTime(P.get('rise') * 100, ac.currentTime, 0.05); sigToLev.gain.setTargetAtTime(P.get('voiceOn') ? 0.55 : 0, ac.currentTime, 0.1); pad.gain.setTargetAtTime(P.get('voiceOn') ? 0.12 : 0, ac.currentTime, 0.1); dsp.setSmooth(out.gain, P.get('level'), ac); }
      ['rise', 'voiceOn', 'level'].forEach(k => P.onChange(k, apply)); ctx.onKey(tune); tune(); apply();
      function durations() {
        let d = P.get('pattern') === 'CUSTOM' ? [P.get('cIn'), P.get('cHold'), P.get('cOut'), P.get('cRest')] : PATTERNS[P.get('pattern')].slice();
        if (P.get('tempoLink')) { const bar = 4 * 60 / ctx.bpm, tot = d.reduce((a, b) => a + b, 0), bars = Math.max(1, Math.round(tot / bar)), k = bars * bar / tot; d = d.map(x => x * k); }
        return d;
      }
      ctx.durations = durations;
      const ease = (n, up) => Float32Array.from({ length: n }, (_, i) => { const x = i / (n - 1), y = 0.5 - 0.5 * Math.cos(Math.PI * x); return up ? y : 1 - y; });
      let nextAt = ac.currentTime + 0.05, phase = 0, cycle = 0;
      function schedulePhase() {
        const d = durations(), len = d[phase], t = nextAt;
        if (len > 0) {
          if (phase === 0) sig.offset.setValueCurveAtTime(ease(64, true), t, len);
          else if (phase === 2) sig.offset.setValueCurveAtTime(ease(64, false), t, len);
          else sig.offset.setValueAtTime(phase === 1 ? 1 : 0, t);
          const ph = PHASES[phase], c = cycle;
          ctx.emit('breath:phase', { phase: ph, cycle: c, time: t, duration: len });
          if (P.get('bell') && (phase === 0 || phase === 2)) { [1, 2.76].forEach((k, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = MT.hz(72 + ((ctx.key || { root: 9 }).root)) * k * (phase === 2 ? 0.75 : 1); g.gain.setValueAtTime(0.05 / (i + 1), t); g.gain.exponentialRampToValueAtTime(0.0001, t + 2); o.connect(g); g.connect(bellG); o.start(t); o.stop(t + 2.1); o.onended = () => { try { o.disconnect(); g.disconnect(); } catch (e) {} }; }); }
        }
        nextAt = t + len; phase = (phase + 1) % 4; if (phase === 0) cycle++;
      }
      // 3.28 stop contract: Stop / Stop all pause the breath (pad and bell quiet, signal rests at 0); ▶ resumes
      let paused = false;
      function pause(t) { paused = true; t = Math.max(ac.currentTime, t || 0); sig.offset.cancelScheduledValues(t); sig.offset.setValueAtTime(sig.offset.value, t); sig.offset.linearRampToValueAtTime(0, t + 0.3); pad.gain.cancelScheduledValues(t); pad.gain.setTargetAtTime(0, t, 0.1); ctx.syncUI(); }
      function resume() { paused = false; apply(); restart(); ctx.syncUI(); }
      ctx.onSilence((p) => pause(p.time));
      ctx.onUI('run', { type: 'object', required: ['on'] }, (p) => p.on ? resume() : pause());
      ctx.stateExtra = () => ({ paused });
      ctx.isPaused = () => paused;
      ctx.scheduleAhead = (sec) => { if (paused) { nextAt = ac.currentTime + sec; return; } let guard = 0; while (nextAt < ac.currentTime + sec && guard++ < 64) schedulePhase(); };
      ctx.scheduleAhead(0.4);
      ctx.interval(() => { ctx.scheduleAhead(0.6); ctx.emitUI('tick', { value: sig.offset.value, phase: PHASES[(phase + 3) % 4], until: nextAt - ac.currentTime, cycle }); }, 100);
      const restart = () => { const t = ac.currentTime + 0.05; sig.offset.cancelScheduledValues(t); sig.offset.setValueAtTime(sig.offset.value, t); nextAt = t; phase = 0; ctx.scheduleAhead(0.4); };
      ['pattern', 'cIn', 'cHold', 'cOut', 'cRest', 'tempoLink'].forEach(k => P.onChange(k, restart));
      ctx.internals = { sig };
      return {};
    },
  });
})();

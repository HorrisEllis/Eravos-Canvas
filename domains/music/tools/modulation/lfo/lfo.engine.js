/* eravos.lfo 2.0.0 — LFO (P5) · resolves F-10(lfo)
 * Audio-rate, tempo-locked modulation; the signal IS the modulation (kernel modulation wires, no bus polling).
 * Shapes are phase-rotated PeriodicWaves so a retrigger can start exactly on the bar at any phase;
 * S&H / smooth random use a ConstantSource scheduled on each division from transport:tick. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const DIVS = ['4/1', '2/1', '1/1', '1/2', '1/4', '1/4t', '1/8', '1/8t', '1/16', '1/32'];
  function shapeFn(shape, custom) {
    switch (shape) {
      case 'sine': return (p) => Math.sin(2 * Math.PI * p);
      case 'triangle': return (p) => p < 0.25 ? 4 * p : p < 0.75 ? 2 - 4 * p : 4 * p - 4;
      case 'square': return (p) => p < 0.5 ? 1 : -1;
      case 'saw': return (p) => 1 - 2 * p;          // falling
      case 'ramp': return (p) => -1 + 2 * p;        // rising
      case 'custom': return (p) => { const c = custom || []; const n = c.length || 1; const x = p * n, i = Math.floor(x) % n, f = x - Math.floor(x); return (c[i] || 0) * (1 - f) + (c[(i + 1) % n] || 0) * f; };
      default: return () => 0;
    }
  }
  function makeWave(ac, fn, phaseDeg) {
    const M = 1024, N = 33, re = new Float32Array(N), im = new Float32Array(N), ph = (phaseDeg || 0) / 360;
    const y = new Float32Array(M); for (let i = 0; i < M; i++) y[i] = fn(((i / M) + ph) % 1);
    for (let n = 0; n < N; n++) { let a = 0, b = 0; for (let i = 0; i < M; i++) { const w = 2 * Math.PI * n * i / M; a += y[i] * Math.cos(w); b += y[i] * Math.sin(w); } re[n] = (n ? 2 : 1) * a / M; im[n] = 2 * b / M; }
    // PeriodicWave uses −? convention: value(t) = Σ re·cos + im·sin ; DC (n=0) is ignored by WebAudio → added via offset source
    return { wave: ac.createPeriodicWave(re, im, { disableNormalization: true }), dc: re[0] };
  }
  OrganismFactory.define({
    id: 'eravos.lfo', domain: 'music', version: '2.0.0', label: 'LFO', icon: '〰', accent: '#aa44ff', phase: 'P5',
    category: 'Modulation', blurb: 'Makes any knob move in time with the beat — drag its violet dot onto a violet input.',
    size: { w: 480, h: 520 }, minSize: { w: 340, h: 300 },
    permissions: ['audio_out', 'bus_publish', 'bus_subscribe', 'registry_read'],
    provides: ['capability.lfo'],
    hooks: [S.mod_out('lfo.hook.mod_out', 'out'), S.transport_in('lfo.hook.transport_in'), S.mod_in('lfo.hook.mod_depth', 'depth')],
    config: [
      { key: 'shape', type: 'enum', options: ['sine', 'triangle', 'square', 'saw', 'ramp', 'sh', 'smooth', 'custom'], default: 'sine', label: 'Shape', group: 'SHAPE' },
      { key: 'sync', type: 'boolean', default: true, label: 'Sync', group: 'RATE' },
      { key: 'div', type: 'enum', options: DIVS, default: '1/4', label: 'Division', group: 'RATE' },
      { key: 'rate', type: 'number', default: 2, min: 0.01, max: 40, step: 0.01, unit: 'Hz', label: 'Rate', group: 'RATE' },
      { key: 'depth', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Depth', group: 'AMOUNT' },
      { key: 'offset', type: 'number', default: 0, min: -1, max: 1, step: 0.01, label: 'Offset', group: 'AMOUNT' },
      { key: 'phase', type: 'number', default: 0, min: 0, max: 360, step: 1, label: 'Phase', group: 'AMOUNT' },
      { key: 'polarity', type: 'enum', options: ['bipolar', 'unipolar+', 'unipolar−'], default: 'bipolar', label: 'Polarity', group: 'AMOUNT' },
      { key: 'retrigger', type: 'enum', options: ['off', 1, 2, 4, 8], default: 1, label: 'Retrig bars', group: 'SYNC' },
      { key: 'fade', type: 'number', default: 0, min: 0, max: 8, step: 0.25, label: 'Fade bars', group: 'SYNC' },
      { key: 'custom', type: 'array', default: [0, 0.4, 0.8, 1, 0.8, 0.4, 0, -0.4, -0.8, -1, -0.8, -0.4, 0, 0.2, 0, -0.2], label: 'Custom', group: 'SHAPE', hidden: true },
    ],
    ui_hooks: ['custom_shape'],
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, MT = window.MusicTheory;
      const depthG = ac.createGain(), sum = ac.createGain(), out = ac.createGain();
      const off = ac.createConstantSource(); off.start(); ctx.track(off);
      const rnd = ac.createConstantSource(); rnd.offset.value = 0; rnd.start(); ctx.track(rnd); // S&H / smooth source
      depthG.connect(sum); off.connect(sum); sum.connect(out);
      ctx.port('out', { kind: 'mod', direction: 'out', node: out, label: 'LFO' });
      const depthMod = ctx.modBus('depth', { min: 0, max: 1 }); depthMod.connect(depthG.gain);
      let osc = null, dc = 0, waveCache = {};
      const rand = ctx.dsp.mulberry32(9001);
      const freq = () => P.get('sync') ? 1 / MT.divisionSec(P.get('div'), ctx.bpm) : P.get('rate');
      const isRandom = () => ['sh', 'smooth'].includes(P.get('shape'));
      function polarity() { const p = P.get('polarity'); return p === 'bipolar' ? { k: 1, c: 0 } : p === 'unipolar+' ? { k: 0.5, c: 0.5 } : { k: -0.5, c: -0.5 }; }
      function applyLevels(t, fadeFrom) {
        const { k, c } = polarity(), d = P.get('depth');
        t = t === undefined ? ac.currentTime : t;
        depthG.gain.cancelScheduledValues(t);
        if (fadeFrom) { depthG.gain.setValueAtTime(0, t); depthG.gain.linearRampToValueAtTime(d * k, t + fadeFrom); }
        else depthG.gain.setTargetAtTime(d * k, t, 0.005);
        off.offset.setTargetAtTime(P.get('offset') + c * d + dc * d * k, t, 0.005);
      }
      function wave() {
        const key = P.get('shape') + ':' + P.get('phase') + ':' + (P.get('shape') === 'custom' ? P.get('custom').join(',') : '');
        if (!waveCache[key]) waveCache[key] = makeWave(ac, shapeFn(P.get('shape'), P.get('custom')), P.get('phase'));
        return waveCache[key];
      }
      function restart(t) {
        t = Math.max(t, ac.currentTime);
        if (osc) { try { osc.stop(t); } catch (e) {} const o = osc; o.onended = () => { try { o.disconnect(); } catch (e) {} ctx.untrack(o); }; osc = null; }
        if (isRandom()) { dc = 0; try { rnd.disconnect(depthG); } catch (e) {} rnd.connect(depthG); return; }
        try { rnd.disconnect(depthG); } catch (e) {}
        const w = wave(); dc = w.dc;
        osc = ac.createOscillator(); osc.setPeriodicWave(w.wave); osc.frequency.value = freq(); osc.frequency.setValueAtTime(freq(), t);
        osc.connect(depthG); osc.start(t); ctx.track(osc);
      }
      ctx.restart = restart;
      restart(ac.currentTime); applyLevels();
      ['shape', 'phase', 'custom'].forEach(k => P.onChange(k, () => { restart(ac.currentTime); applyLevels(); ctx.syncUI(); }));
      ['depth', 'offset', 'polarity'].forEach(k => P.onChange(k, () => applyLevels()));
      ['sync', 'div', 'rate'].forEach(k => P.onChange(k, () => { if (osc) { osc.frequency.cancelScheduledValues(ac.currentTime); osc.frequency.value = freq(); } }));
      let bpmPending = false; ctx.onBpm(() => { bpmPending = true; });
      let barCount = 0, rndLast = 0;
      ctx.onPlay((p) => { barCount = 0; if (P.get('sync') && P.get('retrigger') !== 'off') { restart(p.time); applyLevels(p.time, P.get('fade') * 240 / ctx.bpm); } });
      ctx.onTick((tk) => {
        if (bpmPending && osc && P.get('sync')) { osc.frequency.setValueAtTime(freq(), tk.time); bpmPending = false; }
        if (tk.step16 % 16 === 0 && tk.step16 > 0) {
          barCount++;
          const rt = P.get('retrigger');
          if (P.get('sync') && rt !== 'off' && barCount % (+rt) === 0 && !isRandom()) { restart(tk.time); applyLevels(tk.time, P.get('fade') ? P.get('fade') * 240 / ctx.bpm : 0); }
        }
        if (isRandom() && P.get('sync')) {
          const dsteps = Math.max(1, Math.round(MT.divisionBeats(P.get('div')) * 4));
          if (tk.step16 % dsteps === 0) {
            const v = rand() * 2 - 1;
            if (P.get('shape') === 'sh') rnd.offset.setValueAtTime(v, tk.time);
            else { rnd.offset.setValueAtTime(rndLast, tk.time); rnd.offset.linearRampToValueAtTime(v, tk.time + dsteps * tk.stepDur); }
            rndLast = v;
          }
        }
      });
      // free-running random (no transport): scheduled ahead in the UI-rate timer (not musical timing)
      let freeNext = 0;
      ctx.interval(() => {
        if (!isRandom() || P.get('sync')) { freeNext = 0; return; }
        const now = ac.currentTime; if (freeNext < now) freeNext = now + 0.02;
        while (freeNext < now + 0.12) {
          const v = rand() * 2 - 1, per = 1 / P.get('rate');
          if (P.get('shape') === 'sh') rnd.offset.setValueAtTime(v, freeNext); else { rnd.offset.setValueAtTime(rndLast, freeNext); rnd.offset.linearRampToValueAtTime(v, freeNext + per); }
          rndLast = v; freeNext += per;
        }
      }, 25);
      ctx.onUI('custom_shape', { type: 'object', required: ['points'] }, (p) => { if (!Array.isArray(p.points) || p.points.length !== 16) return ctx.fault('RUNTIME_002', 'custom_shape needs 16 points'); P.set('custom', p.points.map(v => Math.max(-1, Math.min(1, +v || 0)))); P.set('shape', 'custom'); });
      ctx.shapeAt = (p) => shapeFn(P.get('shape'), P.get('custom'))(((p + P.get('phase') / 360) % 1 + 1) % 1);
      ctx.freq = freq;
      ctx.stateExtra = () => ({ freq: freq() });
      return {};
    },
  });
})();

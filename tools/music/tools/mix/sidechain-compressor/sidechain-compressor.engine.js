/* eravos.sidechain-compressor 2.0.0 (+A-2) — the EDM pump (P3) · resolves F-05
 * Audio insert (in → duckGain → out) AND scheduled-curve generator: ducks at the trigger's
 * scheduled audio time (never listens after the fact). Target 'master' → kernel audio.duckAt
 * (ducks the whole master incl. FX tails). Drawable shape (1 beat | 1 bar), 'step' gate mode (A-2).
 * Overlap: new duck starts from the current computed value (no clicks). */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const DIV_STEPS = { '1/2': 8, '1/4': 4, '1/8': 2 };
  OrganismFactory.define({
    id: 'eravos.sidechain-compressor', domain: 'music', version: '2.1.0', label: 'Sidechain', icon: '〽', accent: '#ffaa00', phase: 'P3',
    category: 'Mix', blurb: 'The EDM pump — everything ducks on the kick. Or a 16-step trance gate.',
    size: { w: 440, h: 400 }, minSize: { w: 360, h: 320 },
    permissions: ['audio_out', 'audio_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.sidechain_duck', 'capability.audio_out'],
    hooks: [
      S.audio_in('sc.hook.audio_in', 'in'), S.audio_out('sc.hook.audio_out'),
      S.event('sc.hook.trig_in', 'in', 'pad:trigger|seq:fire|note:trigger', { type: 'object' }, '2.0.0'),
      S.transport_in('sc.hook.transport_in'),
      S.mod_out('sc.hook.duck_out', 'env'),
    ],
    config: [
      { key: 'target', type: 'enum', options: ['insert', 'master'], default: 'insert', label: 'Target', group: 'ROUTE', hint: 'insert = only what is wired through · master = the whole mix' },
      { key: 'mode', type: 'enum', options: ['duck', 'step'], default: 'duck', label: 'Mode', group: 'ROUTE', hint: 'step = 16-step volume gate (trance gate)' },
      { key: 'triggerMode', type: 'enum', options: ['event', 'tempo'], default: 'tempo', label: 'Trigger', group: 'TRIGGER' },
      { key: 'source', type: 'string', default: 'kick', label: 'Source', group: 'TRIGGER', hint: 'sound name (kick) or instance id' },
      { key: 'division', type: 'enum', options: ['1/2', '1/4', '1/8'], default: '1/4', label: 'Every', group: 'TRIGGER' },
      { key: 'depth', type: 'number', default: 0.8, min: 0, max: 1, step: 0.01, label: 'Depth', group: 'SHAPE' },
      { key: 'attack', type: 'number', default: 3, min: 0, max: 50, step: 0.1, unit: 'ms', label: 'Attack', group: 'SHAPE' },
      { key: 'hold', type: 'number', default: 10, min: 0, max: 200, step: 1, unit: 'ms', label: 'Hold', group: 'SHAPE' },
      { key: 'release', type: 'number', default: 220, min: 20, max: 1000, step: 1, unit: 'ms', label: 'Release', group: 'SHAPE' },
      { key: 'curve', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: 'Tension', group: 'SHAPE' },
      { key: 'shapeLength', type: 'enum', options: ['1 beat', '1 bar'], default: '1 beat', label: 'Drawn shape length', group: 'SHAPE' },
      { key: 'steps', type: 'array', default: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], label: 'Gate steps', group: 'STEP', hidden: true },
      { key: 'smoothing', type: 'number', default: 5, min: 0.5, max: 60, step: 0.5, unit: 'ms', label: 'Smooth', group: 'STEP' },
      { key: 'enabled', type: 'boolean', default: true, label: 'On', group: 'ROUTE' },
    ],
    ui_hooks: ['shape_edit', 'test_duck'],
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params;
      const inp = ac.createGain(), duck = ac.createGain(), out = ac.createGain();
      inp.connect(duck); duck.connect(out);
      const envSrc = ac.createConstantSource(); envSrc.offset.value = 1; envSrc.start(); ctx.track(envSrc);
      const env = ac.createGain(); envSrc.connect(env); // env port mirrors the duck gain (0..1) as a control signal
      ctx.port('in', { kind: 'audio', direction: 'in', node: inp, label: 'input' });
      ctx.port('out', { kind: 'audio', direction: 'out', node: out, label: 'ducked' });
      ctx.port('env', { kind: 'mod', direction: 'out', node: env, label: 'duck envelope' });
      let points = null; // drawn shape [{x 0..1, y 0..1 gain}] or null = parametric
      let last = null;   // {t, dur, curve Float32Array}
      const N = 128;

      function period() {
        if (points) return P.get('shapeLength') === '1 bar' ? 240 / ctx.bpm : 60 / ctx.bpm;
        return (P.get('attack') + P.get('hold') + P.get('release')) / 1000;
      }
      function shapeAt(x) { // gain at normalized x of one period (starting from 1)
        if (points) {
          const p = points; if (x <= p[0].x) return p[0].y;
          for (let i = 1; i < p.length; i++) if (x <= p[i].x) { const a = p[i - 1], b = p[i]; return a.y + (b.y - a.y) * (x - a.x) / Math.max(1e-9, b.x - a.x); }
          return p[p.length - 1].y;
        }
        const a = P.get('attack') / 1000, hd = P.get('hold') / 1000, r = P.get('release') / 1000, T = a + hd + r, low = 1 - P.get('depth');
        const t = x * T;
        if (t <= a) return a > 0 ? 1 + (low - 1) * (t / a) : low;
        if (t <= a + hd) return low;
        const u = Math.min(1, (t - a - hd) / r), k = 1 + P.get('curve') * 8; // exponential-ish release, tension k
        return low + (1 - low) * (1 - Math.exp(-k * u)) / (1 - Math.exp(-k));
      }
      ctx.shapeAt = shapeAt;
      function currentValue(t) {
        if (!last || t >= last.t + last.dur) return 1;
        const x = (t - last.t) / last.dur, i = x * (N - 1), i0 = Math.floor(i);
        return last.curve[i0] + (last.curve[Math.min(N - 1, i0 + 1)] - last.curve[i0]) * (i - i0);
      }
      function buildCurve(t) {
        const c = new Float32Array(N);
        const v0 = currentValue(t);
        const a = points ? 0 : P.get('attack') / 1000 / period();
        for (let i = 0; i < N; i++) {
          const x = i / (N - 1); let v = shapeAt(x);
          if (v0 < 1 && !points) { const low = 1 - P.get('depth'); if (x <= a) v = v0 + (low - v0) * (a > 0 ? x / a : 1); }
          else if (v0 < 1 && i === 0) v = v0;
          c[i] = Math.max(0, Math.min(1.5, v));
        }
        return c;
      }
      function duckAt(t) {
        if (!P.get('enabled') || P.get('mode') !== 'duck') return;
        t = Math.max(t, ac.currentTime);
        const dur = period(), curve = buildCurve(t);
        const master = P.get('target') === 'master';
        if (points) {
          const busy = last && t < last.t + last.dur;
          [duck.gain, env.gain].forEach(g => { if (busy && g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(t); else { g.cancelScheduledValues(t); g.setValueAtTime(curve[0], t); } try { g.setValueCurveAtTime(curve, t + 1e-6, dur); } catch (e) { ctx.fault('RUNTIME_003', 'duck: ' + e.message); } });
          if (master) ctx.K.audio.duckAt(t, { curve, duration: dur, depth: P.get('depth') });
        } else {
          // attack + hold as exact ramps; the 128-point curve is scaled to the release length (spec)
          const a = P.get('attack') / 1000, hd = P.get('hold') / 1000, r = P.get('release') / 1000, low = 1 - P.get('depth');
          const v0 = currentValue(t);
          const rel = new Float32Array(N), k = 1 + P.get('curve') * 8;
          for (let i = 0; i < N; i++) { const u = i / (N - 1); rel[i] = low + (1 - low) * (1 - Math.exp(-k * u)) / (1 - Math.exp(-k)); }
          if (master) ctx.K.audio.duckAt(t, { from: v0, depth: P.get('depth'), attack: a, hold: hd, release: r, releaseCurve: rel });
          [duck.gain, env.gain].forEach(g => {
            const busy = last && t < last.t + last.dur;
            if (busy && typeof g.cancelAndHoldAtTime === 'function') g.cancelAndHoldAtTime(t); else { g.cancelScheduledValues(t); g.setValueAtTime(v0, t); }
            if (a > 0) g.linearRampToValueAtTime(low, t + a); else g.setValueAtTime(low, t + 1e-6);
            g.setValueAtTime(low, t + a + hd);
            try { g.setValueCurveAtTime(rel, t + a + hd + 1e-6, r); } catch (e) { ctx.fault('RUNTIME_003', 'duck: ' + e.message); }
          });
        }
        last = { t, dur, curve };
        ctx.emitUI('ducked', { time: t, dur });
      }
      ctx.duckAt = duckAt;
      // step gate (A-2): per 1/16 tick, level from pattern with smoothing
      function gateTick(tk) {
        const st = P.get('steps'); const v = Math.max(0, Math.min(1, +st[tk.step16 % 16] || 0));
        const tau = P.get('smoothing') / 1000 / 3;
        [duck.gain, env.gain].forEach(g => g.setTargetAtTime(v, tk.time, tau));
        if (P.get('target') === 'master') ctx.K.audio.duckTarget(v, tk.time, tau);
        ctx.emitUI('gate', { step: tk.step16 % 16, time: tk.time });
      }
      ctx.onTick((tk) => {
        if (!P.get('enabled')) return;
        if (P.get('mode') === 'step') return gateTick(tk);
        if (P.get('triggerMode') !== 'tempo') return;
        if (tk.step16 % DIV_STEPS[P.get('division')] === 0) duckAt(tk.time);
      });
      ctx.onStop(() => { if (P.get('mode') === 'step') { [duck.gain, env.gain].forEach(g => { g.cancelScheduledValues(ac.currentTime); g.setTargetAtTime(1, ac.currentTime, 0.01); }); if (P.get('target') === 'master') ctx.K.audio.duckReset(); } });
      function matches(p) { const s = P.get('source'); return p.sound === s || p.target === s || p._from === s || p.source === s || (p.sound && String(p.sound).includes(s)); }
      ['pad:trigger', 'seq:fire', 'note:trigger'].forEach(topic => ctx.on(topic, { type: 'object' }, (p) => {
        if (P.get('triggerMode') !== 'event' || !matches(p)) return;
        const t = typeof p.time === 'number' ? p.time : (typeof p.timestamp === 'number' ? p.timestamp : ac.currentTime);
        duckAt(t);
      }));
      ctx.onUI('shape_edit', { type: 'object' }, (p) => {
        if (!p.points) { points = null; }
        else if (!Array.isArray(p.points) || p.points.length < 2) return ctx.fault('RUNTIME_002', 'shape_edit: ≥ 2 points');
        else points = p.points.map(q => ({ x: Math.max(0, Math.min(1, +q.x)), y: Math.max(0, Math.min(1, +q.y)) })).sort((a, b) => a.x - b.x);
        ctx.syncUI();
      });
      ctx.onUI('test_duck', null, () => duckAt(ac.currentTime + 0.02));
      P.onChange('target', (v) => { if (v !== 'master') ctx.K.audio.duckReset(); });
      ctx.stateExtra = () => ({ points, shape: Array.from({ length: 64 }, (_, i) => shapeAt(i / 63)), period: period() });
      ctx.saveExtra = () => ({ points });
      ctx.loadExtra = (x) => { points = x && x.points ? x.points : null; ctx.syncUI(); };
      ['attack', 'hold', 'release', 'depth', 'curve', 'shapeLength'].forEach(k => P.onChange(k, () => ctx.syncUI()));
      return { unmount() { if (P.get('target') === 'master') ctx.K.audio.duckReset(); } };
    },
  });
})();

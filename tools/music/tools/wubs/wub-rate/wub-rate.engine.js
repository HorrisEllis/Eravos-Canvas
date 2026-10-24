/* eravos.wub-rate 1.1.0 — Wub Rate · spec wub-rate.spec
 * The rhythm of a wobble, and nothing else: a step pattern of wobble rates (1/4, 1/8, 1/8t, 1/16 … or off / hold),
 * one shape, one polarity. Its violet output opens and closes whatever it is wired to (Wub Filter's "wub" input, or
 * any violet input). Steps land on the transport's 16ths, sample-accurate; each new rate restarts the wobble from
 * its closed point, so every step speaks on the beat. No sound of its own.
 * 1.1 (what only the Wobble Bass could do, now a part anyone can use): RATE BEND ×¼…×4 — the wobble speeds up or slows down
 *   smoothly between the grid rates (as the oscillator's detune, so it never jumps or restarts); RATE GLIDE — a step's new rate
 *   swoops in over the glide time and the wobble glides on instead of restarting (the Wobble Bass's speed-up into a drop); and a
 *   RATE input, so an Envelope, an LFO or a Timeline curve can push the speed (±2 octaves of rate). All default to off. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const RATES = ['1/1', '1/2', '1/4', '1/4t', '1/8', '1/8t', '1/16', '1/16t', '1/32'];
  const STEP_OPTS = ['off', 'hold'].concat(RATES);
  const STEP_LENS = ['1/16', '1/8', '1/4', '1/2', '1/1'];
  const SHAPES = ['sine', 'talk', 'sawdown', 'sawup', 'square', 'triangle'];
  const POLARITY = ['unipolar+', 'unipolar−', 'bipolar', 'bipolar inverted'];
  const MAX_STEPS = 16;
  // every shape: −1 = closed, +1 = open; value at phase 0 is where a retriggered wobble starts
  function shapeFn(shape) {
    switch (shape) {
      case 'sine': return (p) => -Math.cos(2 * Math.PI * p);
      case 'sawdown': return (p) => 1 - 2 * p;                       // snaps open, closes over the cycle
      case 'sawup': return (p) => -1 + 2 * p;                        // opens over the cycle, snaps shut
      case 'square': return (p) => p < 0.5 ? 1 : -1;                 // open first half, shut second
      case 'triangle': return (p) => p < 0.5 ? -1 + 4 * p : 3 - 4 * p;
      case 'talk': return (p) => {                                    // "yoi": fast open, talking dip, slow close
        if (p < 0.22) return -1 + 2 * Math.sin((p / 0.22) * Math.PI / 2);
        if (p < 0.45) return 1 - 0.9 * Math.sin(((p - 0.22) / 0.23) * Math.PI / 2);
        if (p < 0.6) return 0.1 + 0.5 * Math.sin(((p - 0.45) / 0.15) * Math.PI);
        return 0.1 - 1.1 * ((p - 0.6) / 0.4);
      };
      default: return () => -1;
    }
  }
  // the drawn shape as a PeriodicWave (+ its DC, which WebAudio drops and we add back as an offset)
  function makeWave(ac, fn, phase) {
    const M = 1024, N = 40, re = new Float32Array(N), im = new Float32Array(N), y = new Float32Array(M);
    for (let i = 0; i < M; i++) y[i] = fn(((i / M) + phase) % 1);
    for (let n = 0; n < N; n++) { let a = 0, b = 0; for (let i = 0; i < M; i++) { const w = 2 * Math.PI * n * i / M; a += y[i] * Math.cos(w); b += y[i] * Math.sin(w); } re[n] = (n ? 2 : 1) * a / M; im[n] = 2 * b / M; }
    return { wave: ac.createPeriodicWave(re, im, { disableNormalization: true }), dc: re[0] };
  }
  const POL = { 'unipolar+': { c: 0.5, k: 0.5 }, 'unipolar−': { c: -0.5, k: -0.5 }, 'bipolar': { c: 0, k: 1 }, 'bipolar inverted': { c: 0, k: -1 } };
  const DEFAULT_STEPS = ['1/8', '1/8', '1/8', '1/8', '1/16', '1/16', '1/8t', '1/4', '1/8', '1/8', '1/8', '1/8', '1/16', '1/32', '1/16', 'off'];
  const cleanSteps = (a) => Array.from({ length: MAX_STEPS }, (_, i) => STEP_OPTS.includes(a && a[i]) ? a[i] : '1/8');

  OrganismFactory.define({
    id: 'eravos.wub-rate', domain: 'music', version: '1.1.0', label: 'Wub Rate', icon: '〽', accent: '#b066ff',
    category: 'Wubs', blurb: 'The wobble’s rhythm: a step pattern of rates (1/8, 1/16, triplets, off) — wire its violet dot to Wub Filter.',
    size: { w: 520, h: 470 }, minSize: { w: 400, h: 340 },
    permissions: ['audio_out', 'bus_publish', 'bus_subscribe', 'registry_read'],
    provides: ['capability.lfo', 'capability.wub_rhythm'],
    face: ['stepLen', 'shape', 'smooth', 'depth', 'polarity'],
    links: [{ with: 'eravos.wub-filter', dir: 'out', face: ['mode', 'cutoff', 'range', 'res', 'drive'], hint: 'the mouth this rhythm opens' }],
    hooks: [
      S.mod_out('wubrate.hook.mod_out', 'out'),
      S.transport_in('wubrate.hook.transport_in'),
      S.mod_in('wubrate.hook.mod_depth', 'depth'),
      S.mod_in('wubrate.hook.mod_rate', 'rate'),
    ],
    config: [
      { key: 'steps', type: 'array', default: DEFAULT_STEPS.slice(), label: 'Steps', group: 'PATTERN', hidden: true },
      { key: 'length', type: 'integer', default: 8, min: 1, max: MAX_STEPS, label: 'Steps', group: 'PATTERN', hint: 'how many steps play before the pattern repeats' },
      { key: 'stepLen', type: 'enum', options: STEP_LENS, default: '1/4', label: 'Step = ', group: 'PATTERN', hint: '1/4 = one beat per step' },
      { key: 'shape', type: 'enum', options: SHAPES, default: 'sine', label: 'Shape', group: 'SHAPE' },
      { key: 'phase', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Start', group: 'SHAPE', hint: 'where in the shape each step starts: 0 = closed' },
      { key: 'smooth', type: 'number', default: 0.15, min: 0, max: 1, step: 0.01, label: 'Smooth', group: 'SHAPE', hint: 'rounds hard edges (square, saw, off) so they don’t click' },
      { key: 'polarity', type: 'enum', options: POLARITY, default: 'unipolar+', label: 'Polarity', group: 'OUTPUT', hint: 'unipolar+ = 0 → 1 (opens). unipolar− = 0 → −1. bipolar swings both ways; inverted flips it' },
      { key: 'depth', type: 'number', default: 1, min: 0, max: 1, step: 0.01, label: 'Depth', group: 'OUTPUT' },
      { key: 'rateBend', type: 'number', default: 1, min: 0.25, max: 4, step: 0.001, unit: '×', label: 'Rate bend', group: 'SPEED', hint: 'speeds the wobble up or slows it down smoothly, between the grid rates (×2 = one rate faster)' },
      { key: 'rateGlide', type: 'number', default: 0, min: 0, max: 2, step: 0.001, unit: 's', label: 'Rate glide', group: 'SPEED', hint: 'a step’s new rate swoops in over this time and the wobble glides on instead of restarting — the speed-up into a drop (0 = jump)' },
      { key: 'retrig', type: 'enum', options: ['on change', 'every step', 'never'], default: 'on change', label: 'Restart', group: 'SYNC', hint: 'when the wobble starts again from closed' },
      { key: 'noteRetrig', type: 'boolean', default: true, label: 'Notes restart', group: 'SYNC', hint: 'each new note on a Wub Osc restarts the wobble (slides don’t)' },
    ],
    ui_hooks: ['step_set', 'steps_set', 'steps_shift'],
    defaultPreset: 'Half-time Talk',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, MT = window.MusicTheory, K = ctx.K;
      const sum = ac.createGain(), smooth = ac.createBiquadFilter(), out = ac.createGain();
      smooth.type = 'lowpass'; smooth.Q.value = 0.5;
      const oscG = ac.createGain(), off = ac.createConstantSource(); off.offset.value = 0; off.start();
      oscG.connect(sum); off.connect(sum); sum.connect(smooth); smooth.connect(out);
      [sum, smooth, out, oscG, off].forEach(n => ctx.track(n));
      ctx.port('out', { kind: 'mod', direction: 'out', node: out, label: 'wub' });
      const depthMod = ctx.modBus('depth', { min: -1, max: 1 }); depthMod.connect(out.gain);
      // 1.1 rate: Rate bend (and the rate input) as the oscillator's detune in cents — ×2 = +1200 — so it moves smoothly, never restarts
      const bendC = ac.createConstantSource(); bendC.offset.value = 0; bendC.start(); ctx.track(bendC);
      const rateMod = ctx.modBus('rate', { min: -2400, max: 2400 });
      const bendCents = () => 1200 * Math.log2(Math.max(0.25, Math.min(4, +P.get('rateBend') || 1)));
      const applyBend = () => bendC.offset.setTargetAtTime(bendCents(), ac.currentTime, 0.03); bendC.offset.value = bendCents();

      const waves = {};
      const curWave = () => { const k = P.get('shape') + '@' + P.get('phase').toFixed(3); return waves[k] || (waves[k] = makeWave(ac, shapeFn(P.get('shape')), P.get('phase'))); };
      let osc = null, cur = null, gate = true, stepIdx = -1;
      const steps = () => cleanSteps(P.get('steps'));
      const rateHz = (div) => 1 / MT.divisionSec(div, ctx.bpm);
      // output level for "open" (osc) and "closed/off"; DC of the drawn shape goes in the offset
      function levels(t, on) {
        const { c, k } = POL[P.get('polarity')] || POL['unipolar+'], d = P.get('depth'), dc = curWave().dc;
        oscG.gain.cancelScheduledValues(t); off.offset.cancelScheduledValues(t);
        oscG.gain.setValueAtTime(on ? k * d : 0, t);
        off.offset.setValueAtTime(on ? (c + k * dc) * d : (c - k) * d, t);
      }
      // every oscillator still scheduled to sound. Steps are scheduled ahead, so a restart can land before an older
      // oscillator's stop — and a later stop() call REPLACES an earlier one, so a stop only ever moves earlier.
      const live = new Set();
      function restart(t, div) {
        t = Math.max(t, ac.currentTime);
        live.forEach(o => { if (o.stopAt > t) { try { o.stop(t); o.stopAt = t; } catch (e) {} } });
        osc = ac.createOscillator(); const o = osc; o.stopAt = Infinity; live.add(o);
        o.onended = () => { live.delete(o); try { o.disconnect(); } catch (e) {} try { bendC.disconnect(o.detune); rateMod.disconnect(o.detune); } catch (e) {} ctx.untrack(o); }; osc.setPeriodicWave(curWave().wave);   // 1.1: an ended oscillator lets go of its rate inputs too
        osc.frequency.setValueAtTime(rateHz(div), t); bendC.connect(osc.detune); rateMod.connect(osc.detune); osc.connect(oscG); osc.start(t); ctx.track(osc);
        cur = div;
      }
      // apply one step's value at audio time t
      function apply(v, t) {
        if (v === 'hold') return;
        if (v === 'off') { if (gate) { levels(t, false); gate = false; } cur = 'off'; return; }
        const mode = P.get('retrig'), changed = v !== cur, glide = +P.get('rateGlide') || 0;
        // 1.1 glide: a sounding wobble swoops to the new rate (no restart); off → on still restarts from closed, as before
        if (glide > 0.001 && gate && osc && changed && mode !== 'every step') { osc.frequency.cancelScheduledValues(t); osc.frequency.setValueAtTime(rateHz(cur), t); osc.frequency.setTargetAtTime(rateHz(v), t, glide / 3); cur = v; }
        else if (!gate || !osc || mode === 'every step' || (mode === 'on change' && changed)) restart(t, v);
        else if (changed) { osc.frequency.setValueAtTime(rateHz(v), t); cur = v; }
        if (!gate) { levels(t, true); gate = true; }
      }
      // stopped: run free on the first playable step's rate, so the wobble is heard while you shape it
      const freeRate = () => steps().slice(0, P.get('length')).find(v => RATES.includes(v)) || '1/8';
      function freeRun() { gate = true; restart(ac.currentTime, freeRate()); levels(ac.currentTime, true); stepIdx = -1; }
      const applySmooth = () => { const s = P.get('smooth'); smooth.frequency.setTargetAtTime(Math.min(20000, ac.sampleRate * 0.45) * Math.pow(6 / 20000, s), ac.currentTime, 0.01); };
      applySmooth(); freeRun();
      let playing = false;
      ctx.onPlay(() => { playing = true; });
      ctx.onStop(() => { playing = false; freeRun(); ctx.emitUI('step', { index: -1 }); });
      ctx.onTick((tk) => {
        playing = true;
        const s16 = Math.max(1, Math.round(MT.divisionBeats(P.get('stepLen')) * 4));
        if (tk.step16 % s16 !== 0) return;
        const n = P.get('length'), idx = Math.floor(tk.step16 / s16) % n;
        stepIdx = idx; apply(steps()[idx], tk.time);
        ctx.emitUI('step', { index: idx, time: tk.time });
      });
      // retrigger on a new (non-slide) note sent to any Wub Osc
      ctx.on('note:trigger', null, (p) => {
        if (!P.get('noteRetrig') || !p || p.slide || !gate || !RATES.includes(cur)) return;
        const r = K.registry.get(p.target); if (!r || r.organism_id !== 'eravos.wub-osc') return;
        restart(typeof p.time === 'number' ? p.time : ac.currentTime, cur);
      });
      let bpmPending = false; ctx.onBpm(() => { bpmPending = true; if (!playing && osc && RATES.includes(cur)) osc.frequency.setValueAtTime(rateHz(cur), ac.currentTime); });
      ctx.onTick((tk) => { if (bpmPending && osc && RATES.includes(cur)) { osc.frequency.setValueAtTime(rateHz(cur), tk.time); bpmPending = false; } });
      ['shape', 'phase'].forEach(k => P.onChange(k, () => { if (osc) osc.setPeriodicWave(curWave().wave); levels(ac.currentTime, gate); ctx.syncUI(); }));
      ['polarity', 'depth'].forEach(k => P.onChange(k, () => levels(ac.currentTime, gate)));
      P.onChange('smooth', applySmooth); P.onChange('rateBend', applyBend);
      ['steps', 'length'].forEach(k => P.onChange(k, () => { if (!playing) freeRun(); }));

      ctx.onUI('step_set', { type: 'object', required: ['index', 'value'] }, (p) => {
        const i = p.index | 0; if (i < 0 || i >= MAX_STEPS || !STEP_OPTS.includes(p.value)) return ctx.fault('RUNTIME_002', 'step_set: index 0–15 and a value from ' + STEP_OPTS.join(' '));
        const a = steps(); a[i] = p.value; P.set('steps', a);
      });
      ctx.onUI('steps_set', { type: 'object', required: ['steps'] }, (p) => {
        if (!Array.isArray(p.steps) || p.steps.some(v => !STEP_OPTS.includes(v))) return ctx.fault('RUNTIME_002', 'steps_set: values from ' + STEP_OPTS.join(' '));
        P.set('steps', cleanSteps(p.steps.concat(steps().slice(p.steps.length))));
        if (p.steps.length <= MAX_STEPS) P.set('length', Math.max(1, p.steps.length));
      });
      ctx.onUI('steps_shift', { type: 'object', required: ['by'] }, (p) => {
        const n = P.get('length'), a = steps(), part = a.slice(0, n), by = ((p.by | 0) % n + n) % n;
        P.set('steps', part.slice(n - by).concat(part.slice(0, n - by), a.slice(n)));
      });
      ctx.shapeAt = (ph) => shapeFn(P.get('shape'))((((ph + P.get('phase')) % 1) + 1) % 1);
      ctx.stateExtra = () => ({ stepOptions: STEP_OPTS, current: stepIdx, rate: cur });
      ctx.internals = { out, oscG, off, smooth, bendC, get osc() { return osc; }, get cur() { return cur; }, get gate() { return gate; } };
      return {};
    },
  });
})();

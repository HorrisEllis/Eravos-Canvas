/* ERAVOS music — motion.js · 3.71 MOTION + PERFORM, built into a tool (no extra windows, no wires)
 * James, 2026-10-24: "all need more dynamic control and a better ui" — movement over time, variation, performance controls,
 * deeper controls, "all the above while not cluttering or making it overwhelming".
 * A tool opts in with `perform: true` on its definition. It then carries:
 *   - MOTION: any of its knobs can move on its own — a shape (sine, triangle, saw up/down, square, random, smooth, steps, follow
 *     the mix) at a rate in beats (synced to the song position while it plays), with a depth (± half the knob's range) and a phase.
 *   - PERFORM: four macro knobs (m1…m4, real knobs: MIDI learn, automation lanes, presets and knob inputs all work on them), each
 *     turning any of the tool's knobs by its own amount; an XY pad drives two of them.
 * Saved with the tool in two hidden settings: _motion [{ key, shape, beats, depth, phase, steps? }], _perform { names, map, xy }.
 * Nothing runs while nothing moves. The knob keeps its own value: a movement is drawn around it (params.live), never written in. */
(function (global) {
  'use strict';
  const SHAPES = ['sine', 'triangle', 'saw', 'ramp', 'square', 'random', 'smooth', 'steps', 'follow'];
  const SHAPE_LABEL = { sine: 'Sine', triangle: 'Triangle', saw: 'Saw down', ramp: 'Saw up', square: 'Square', random: 'Random', smooth: 'Smooth random', steps: 'Steps', follow: 'Follow the mix' };
  const RATES = [[32, '8 bars'], [16, '4 bars'], [8, '2 bars'], [4, '1 bar'], [2, '1/2'], [1, '1/4'], [2 / 3, '1/4t'], [0.5, '1/8'], [1 / 3, '1/8t'], [0.25, '1/16']];
  const MACROS = ['m1', 'm2', 'm3', 'm4'];
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const frac = (x) => x - Math.floor(x);
  const hash = (a, b) => { let h = (Math.imul(a | 0, 0x9e3779b1) ^ Math.imul(b | 0, 0x85ebca77)) >>> 0; h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d) >>> 0; h ^= h >>> 12; return (h >>> 0) / 4294967296 * 2 - 1; };
  /** the shape's value −1…1 at a position in cycles (c may be any real); seed for the random ones; steps: 2…16 values −1…1 */
  function shapeAt(shape, c, seed, steps) {
    const p = frac(c), n = Math.floor(c);
    switch (shape) {
      case 'sine': return Math.sin(2 * Math.PI * p);
      case 'triangle': return p < 0.25 ? p * 4 : p < 0.75 ? 2 - p * 4 : p * 4 - 4;
      case 'saw': return 1 - 2 * p;
      case 'ramp': return 2 * p - 1;
      case 'square': return p < 0.5 ? 1 : -1;
      case 'random': return hash(seed, n);
      case 'smooth': { const a = hash(seed, n), b = hash(seed, n + 1), k = (1 - Math.cos(Math.PI * p)) / 2; return a + (b - a) * k; }
      case 'steps': { const s = Array.isArray(steps) && steps.length ? steps : [1, -1]; return clamp(+s[Math.min(s.length - 1, Math.floor(p * s.length))] || 0, -1, 1); }
      default: return 0;
    }
  }
  function cleanMotion(list) {
    return (Array.isArray(list) ? list : []).filter(m => m && typeof m.key === 'string' && SHAPES.includes(m.shape)).map(m => {
      const o = { key: m.key, shape: m.shape, beats: clamp(+m.beats || 4, 1 / 16, 64), depth: clamp(+m.depth || 0, -1, 1), phase: clamp(+m.phase || 0, 0, 1) };
      if (m.shape === 'steps') o.steps = (Array.isArray(m.steps) && m.steps.length ? m.steps : [1, 0.5, 0, -0.5, -1, -0.5, 0, 0.5]).slice(0, 16).map(v => clamp(+v || 0, -1, 1));
      if (m.off) o.off = true;
      return o;
    });
  }
  const PERFORM0 = () => ({ names: ['Macro 1', 'Macro 2', 'Macro 3', 'Macro 4'], map: [{}, {}, {}, {}], xy: { x: 0, y: 1 } });
  function cleanPerform(p) {
    const d = PERFORM0(); if (!p || typeof p !== 'object') return d;
    (p.names || []).slice(0, 4).forEach((n, i) => { if (typeof n === 'string' && n.trim()) d.names[i] = n.trim().slice(0, 24); });
    (p.map || []).slice(0, 4).forEach((m, i) => { if (m && typeof m === 'object') Object.keys(m).forEach(k => { if (!MACROS.includes(k) && isFinite(+m[k]) && +m[k]) d.map[i][k] = clamp(+m[k], -1, 1); }); });
    if (p.xy) { d.xy.x = clamp(p.xy.x | 0, 0, 3); d.xy.y = clamp(p.xy.y | 0, 0, 3); }
    return d;
  }
  /** at define time (called by sdk-music before the knob inputs are made): the macro knobs and the two hidden settings */
  function augment(d) {
    if (!d.perform || d._performed) return; d._performed = true;
    const have = new Set((d.config || []).map(c => c.key)); d.config = d.config || [];
    MACROS.forEach((k, i) => { if (!have.has(k)) d.config.push({ key: k, type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Macro ' + (i + 1), group: 'PERFORM', perform: true, hint: 'turns the knobs you give it (Perform)' }); });
    if (!have.has('_motion')) d.config.push({ key: '_motion', type: 'array', default: [], hidden: true, label: 'Motion' });
    if (!have.has('_perform')) d.config.push({ key: '_perform', type: 'object', default: PERFORM0(), hidden: true, label: 'Perform' });
  }
  /** per instance: what the tool's own movements and macros add to each knob right now (in half-ranges, like a knob input) */
  function runner(ctx) {
    const K = ctx.K, ac = ctx.ac; let anchor = null, playing = false, an = null, abuf = null, follow = 0;
    const seed = (() => { let h = 7; for (const ch of String(ctx.id)) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0; return h; })();
    ctx.on('transport:tick', null, (t) => { if (t && typeof t.step16 === 'number') { anchor = { s: t.step16, t: t.time, d: t.stepDur || 0.125 }; playing = true; } });
    ctx.on('transport:stop', null, () => { playing = false; });
    const bpm = () => (K.music && K.music.bpm) || 120;
    function beatsAt(t) { if (playing && anchor) return (anchor.s + (t - anchor.t) / anchor.d) / 4; return t * bpm() / 60; }
    function mixLevel() {
      if (!an) { if (!K.audio || !K.audio.output) return 0; an = ac.createAnalyser(); an.fftSize = 512; abuf = new Float32Array(512); try { K.audio.output.connect(an); } catch (e) { an = null; return 0; } }
      an.getFloatTimeDomainData(abuf); let s = 0; for (let i = 0; i < abuf.length; i++) s += abuf[i] * abuf[i];
      const v = clamp((10 * Math.log10(s / abuf.length + 1e-12) + 48) / 42, 0, 1); follow += (v - follow) * (v > follow ? 0.5 : 0.08); return follow;
    }
    const P = () => ctx.params;
    function motions() { const p = P(); return p ? cleanMotion(p.get('_motion')).filter(m => !m.off && m.depth) : []; }
    function perform() { const p = P(); return p ? cleanPerform(p.get('_perform')) : PERFORM0(); }
    function active() {
      const p = P(); if (!p) return false; if (motions().length) return true;
      const pf = perform(); return MACROS.some((k, i) => Object.keys(pf.map[i]).length && (+p.base(k) || p.isLive(k)));
    }
    /** wired: Map key → the knob input's signal now; returns Map key → what motion + macros add (half-ranges) */
    function contributions(t, wired) {
      const p = P(), out = new Map(); if (!p) return out; const add = (k, v) => out.set(k, (out.get(k) || 0) + v);
      const beats = beatsAt(t);
      motions().forEach(m => {
        const v = m.shape === 'follow' ? mixLevel() * 2 - 1 : shapeAt(m.shape, beats / m.beats + m.phase, seed + m.key.length * 131 + m.key.charCodeAt(0), m.steps);
        add(m.key, v * m.depth);
      });
      const pf = perform();
      MACROS.forEach((mk, i) => {
        const tg = pf.map[i]; if (!Object.keys(tg).length) return;
        const v = clamp((+p.base(mk) || 0) + ((out.get(mk) || 0) + ((wired && wired.get(mk)) || 0)) * 0.5, 0, 1); if (!v) return;
        Object.keys(tg).forEach(k => add(k, v * tg[k] * 2));
      });
      return out;
    }
    return { contributions, active, beatsAt };
  }
  // the registry's copy of a definition keeps its settings, not define-time flags: a tool performs if it carries _perform
  const performs = (d) => !!(d && (d.perform || (d.config || []).some(c => c.key === '_perform')));
  global.MusicMotion = { performs, SHAPES, SHAPE_LABEL, RATES, MACROS, shapeAt, cleanMotion, cleanPerform, PERFORM0, augment, runner };
})(typeof window !== 'undefined' ? window : globalThis);

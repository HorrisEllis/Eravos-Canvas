/* eravos.curve-synth 1.0.0 — Curve · spec eravos.organism.curve-synth (P8.3, ripped from v10 CURVE_INSTRUMENT /
 * synths.curvePerc / ricochet)
 * Draw a pitch gesture; the sound follows it exactly (Catmull-Rom smoothed → setValueCurveAtTime, log-mapped between
 * lowNote and highNote, transposed by the played note). If the gesture ENDS on the top or bottom edge it BOUNCES:
 * the path comes back reflected, each bounce shorter (decay) and quieter (restitution), alternating left / right —
 * the dive-and-ricochet. Voice: oscillator + pitch-tracking band-passed noise → envelope → drive. 8 curve slots. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const P8 = (pts) => pts.map(([x, y]) => ({ x, y }));
  const DEFAULT_CURVES = [
    P8([[0, 0.18], [0.12, 0.22], [0.25, 0.28], [0.4, 0.38], [0.55, 0.52], [0.68, 0.68], [0.8, 0.82], [0.9, 0.92], [0.97, 0.98], [1, 1]]), // dive UP into the edge (v10 'SONG FOR THE DEAD', y flipped)
    P8([[0, 0.3], [0.15, 0.95], [0.3, 1]]).concat(P8([[1, 1]])),
    P8([[0, 0.4], [0.25, 0.7], [0.5, 0.4], [0.75, 0.7], [1, 0.4]]),
    P8([[0, 0.9], [0.4, 0.6], [0.8, 0.15], [1, 0]]),
    P8([[0, 0.5], [1, 0.5]]), P8([[0, 0], [1, 1]]), P8([[0, 1], [1, 0]]), P8([[0, 0.2], [0.5, 0.8], [1, 0.2]]),
  ];
  function smooth(pts, n) { // Catmull-Rom through points sorted by x → n samples of y
    const p = pts.slice().sort((a, b) => a.x - b.x); if (!p.length) return new Float32Array(n).fill(0.5);
    if (p[0].x > 0) p.unshift({ x: 0, y: p[0].y }); if (p[p.length - 1].x < 1) p.push({ x: 1, y: p[p.length - 1].y });
    const out = new Float32Array(n); let j = 0;
    for (let i = 0; i < n; i++) {
      const x = i / (n - 1); while (j < p.length - 2 && p[j + 1].x < x) j++;
      const p0 = p[Math.max(0, j - 1)], p1 = p[j], p2 = p[Math.min(p.length - 1, j + 1)], p3 = p[Math.min(p.length - 1, j + 2)];
      const t = p2.x > p1.x ? (x - p1.x) / (p2.x - p1.x) : 0, t2 = t * t, t3 = t2 * t;
      out[i] = Math.max(0, Math.min(1, 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)));
    }
    return out;
  }
  OrganismFactory.define({
    id: 'eravos.curve-synth', preview: 'lead', domain: 'music', version: '1.0.0', label: 'Curve', icon: '⤵', accent: '#c4541b', phase: 'P14',
    category: 'Sound sources', blurb: 'Draw a pitch gesture; the sound follows it, slams the edge and ricochets back — dives, whoops, sirens, lasers.',
    size: { w: 560, h: 560 }, minSize: { w: 440, h: 440 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.note_in'],
    needs: { works_with: ['eravos.drum-forge', 'eravos.sequencer', 'eravos.fx-echo'] },
    hooks: [S.audio_out('curve.hook.audio_out'), S.note_in('curve.hook.note_in'), S.midi_in('curve.hook.midi_in')],
    config: [
      { key: 'slot', type: 'integer', default: 0, min: 0, max: 7, label: 'Curve', group: 'CURVE' },
      { key: 'duration', type: 'number', default: 0.45, min: 0.05, max: 4, step: 0.001, unit: 's', label: 'Duration', group: 'CURVE' },
      { key: 'lowNote', type: 'integer', default: 24, min: 0, max: 120, label: 'Low note', group: 'CURVE' },
      { key: 'highNote', type: 'integer', default: 106, min: 1, max: 127, label: 'High note', group: 'CURVE' },
      { key: 'edge', type: 'boolean', default: true, label: 'Edge bounce', group: 'BOUNCE' },
      { key: 'bounces', type: 'integer', default: 3, min: 0, max: 8, label: 'Bounces', group: 'BOUNCE' },
      { key: 'restitution', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: 'Restitution', group: 'BOUNCE' },
      { key: 'decay', type: 'number', default: 0.6, min: 0.1, max: 1, step: 0.01, label: 'Shorten', group: 'BOUNCE', hint: 'each bounce lasts this fraction of the previous' },
      { key: 'wave', type: 'enum', options: ['sine', 'triangle', 'sawtooth', 'square'], default: 'sine', label: 'Wave', group: 'VOICE' },
      { key: 'noise', type: 'number', default: 0.15, min: 0, max: 1, step: 0.01, label: 'Noise', group: 'VOICE' },
      { key: 'drive', type: 'number', default: 0.2, min: 0, max: 1, step: 0.01, label: 'Drive', group: 'VOICE' },
      { key: 'sustain', type: 'number', default: 0.2, min: 0, max: 1, step: 0.01, label: 'Sustain', group: 'VOICE', hint: '0 = percussive decay over the gesture, 1 = held' },
      { key: 'level', type: 'number', default: 0.7, min: 0, max: 1.5, step: 0.01, label: 'Level', group: 'VOICE' },
    ],
    ui_hooks: ['curve_set', 'play'],
    ui_hook_labels: { curve_set: 'draw curve' },
    defaultPreset: 'Songs-for-the-Dead Dive',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp, MT = window.MusicTheory;
      let curves = DEFAULT_CURVES.map(c => c.map(p => Object.assign({}, p)));
      const pre = ac.createGain(), sh = ac.createWaveShaper(), out = ac.createGain(); sh.oversample = '2x'; pre.connect(sh); sh.connect(out); [pre, sh, out].forEach(n => ctx.track(n));
      ctx.port('out', { kind: 'audio', direction: 'out', node: out, label: 'curve' });
      function apply() { sh.curve = dsp.curve('tube', P.get('drive') * 0.9); pre.gain.value = 1 + P.get('drive') * 2; dsp.setSmooth(out.gain, P.get('level') * 0.55 / (1 + P.get('drive')), ac); }
      ['drive', 'level'].forEach(k => P.onChange(k, apply)); apply();
      const noiseBuf = dsp.noise(ac, 2, 'white');
      function path(slot, note) {
        const ys = smooth(curves[slot] || curves[0], 256), lo = P.get('lowNote'), hi = Math.max(lo + 1, P.get('highNote')), tr = (note === undefined ? 60 : note) - 60;
        return { ys, freqs: Float32Array.from(ys, y => Math.min(ac.sampleRate * 0.45, Math.max(16, MT.hz(lo + tr + y * (hi - lo))))) };
      }
      function segment(freqs, t, dur, amp, pan) {
        const o = ac.createOscillator(); o.type = P.get('wave'); o.frequency.setValueCurveAtTime(freqs, t, dur);
        const g = ac.createGain(), p = ac.createStereoPanner(); p.pan.value = pan; o.connect(g); g.connect(p); p.connect(pre);
        const sus = P.get('sustain'); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp, t + 0.002); g.gain.setTargetAtTime(amp * sus, t + 0.002, Math.max(0.01, dur * 0.35)); g.gain.setTargetAtTime(0, t + dur * 0.97, 0.008);
        const nodes = [o, g, p];
        const nz = P.get('noise'); if (nz > 0) { const n = ac.createBufferSource(); n.buffer = noiseBuf; n.loop = true; const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 6; bp.frequency.setValueCurveAtTime(freqs, t, dur); const ng = ac.createGain(); ng.gain.value = nz * 1.4; n.connect(bp); bp.connect(ng); ng.connect(g); n.start(t, Math.random()); n.stop(t + dur + 0.05); nodes.push(n, bp, ng); }
        o.start(t); o.stop(t + dur + 0.05); o.onended = () => nodes.forEach(x => { try { x.disconnect(); } catch (e) {} });
      }
      function play(slot, note, vel, t) {
        t = Math.max(t || ac.currentTime, ac.currentTime) + 0.002; const { ys, freqs } = path(slot, note), dur = P.get('duration');
        segment(freqs, t, dur, 0.25 + 0.75 * vel, 0);
        const plan = [{ t, dur, amp: 0.25 + 0.75 * vel, dir: 1 }];
        const endY = ys[ys.length - 1], atEdge = endY >= 0.97 || endY <= 0.03;
        if (P.get('edge') && atEdge) {
          let tt = t + dur, d = dur, a = 0.25 + 0.75 * vel, fr = freqs;
          for (let b = 1; b <= P.get('bounces'); b++) {
            d *= P.get('decay'); a *= P.get('restitution'); if (a < 0.01 || d < 0.01) break;
            fr = Float32Array.from(fr).reverse();                       // the path comes back the way it went
            segment(fr, tt, d, a, b % 2 ? 0.7 : -0.7); plan.push({ t: tt, dur: d, amp: a, dir: b % 2 ? -1 : 1 }); tt += d;
          }
        }
        ctx.emitUI('played', { slot, plan: plan.map(p => ({ t: p.t - ac.currentTime, dur: p.dur, amp: p.amp, dir: p.dir })) });
        return plan;
      }
      ctx.playCurve = play;
      ctx.onNote((p) => play(P.get('slot'), p.note, p.velocity, p.time));
      ctx.onMidi((p) => { if (p.on) play(P.get('slot'), p.note, p.velocity); });
      ctx.audition = (p) => play(P.get('slot'), p.note || 60, p.velocity || 0.9);
      ctx.onUI('play', { type: 'object' }, (p) => play(typeof p.slot === 'number' ? p.slot : P.get('slot'), 60, 0.9));
      ctx.onUI('curve_set', { type: 'object', required: ['slot', 'pts'] }, (p) => { if (p.slot < 0 || p.slot > 7 || !Array.isArray(p.pts)) return; curves[p.slot] = p.pts.slice(0, 256).filter(q => q && Number.isFinite(q.x) && Number.isFinite(q.y)).map(q => ({ x: Math.max(0, Math.min(1, q.x)), y: Math.max(0, Math.min(1, q.y)) })); ctx.syncUI(); });
      ctx.saveExtra = () => ({ curves: curves.map(c => c.map(p => [+p.x.toFixed(4), +p.y.toFixed(4)])) });
      ctx.loadExtra = (x) => { if (x && Array.isArray(x.curves)) { curves = x.curves.map(c => c.map(([px, py]) => ({ x: px, y: py }))); while (curves.length < 8) curves.push(P8([[0, 0.5], [1, 0.5]])); ctx.syncUI(); } };
      ctx.stateExtra = () => ({ curves });
      ctx.internals = { get curves() { return curves; }, smooth, path };
      return {};
    },
  });
})();

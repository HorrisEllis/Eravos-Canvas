/* eravos.timeline — the Workshop's NOTES kind (music.notes), W2 slice a (specs/eravos.workshop.spec ADDENDUM 2026-11-08).
 * His words, 2026-11-08: "The edit pattern or note doesn’t open workshop." · 2026-11-06 (13:28:34): the note editor and the pattern editor are one —
 * "the note editor IS the workshop at note scale; patterns are the workshop at pattern scale". canvas/runtime/workshop.js stays domain-free:
 * every word and picture of a note is here. The document is the clip's notes exactly as the piano roll keeps them, so Apply is not needed:
 * every edit goes back through the roll's own commit (live), and a note round-trips unchanged when nothing was touched.
 *   EravosTimelineWorkshop.KIND · EravosTimelineWorkshop.ensure() → true when the kind is on the Workshop */
(function (global) {
  'use strict';
  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const nameOf = (n) => NAMES[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const BEND0 = { from: 0, to: 0, at: 0, shape: 'smooth' }, OSC0 = { rate: '1/16', depth: 0, shape: 'sine', fade: 0 };
  const RATES = ['1/2', '1/4', '1/4t', '1/8', '1/8t', '1/16', '1/16t', '1/32'];
  const FIELDS = {   // key → [read from a note, write into a note]
    s: [(a) => a.s, (a, v) => { a.s = Math.max(0, v); }], l: [(a) => a.l, (a, v) => { a.l = Math.max(0.25, v); }],
    mt: [(a) => Math.round((a.mt || 0) * 100), (a, v) => { a.mt = clamp(v, -50, 50) / 100; if (!a.mt) delete a.mt; }],
    n: [(a) => a.n, (a, v) => { a.n = Math.round(clamp(v, 0, 127)); }],
    v: [(a) => Math.round(a.v * 127), (a, v) => { a.v = clamp(Math.round(v) / 127, 0.05, 1); }],
    pr: [(a) => Math.round((a.pr || 1) * 100), (a, v) => { a.pr = clamp(v, 5, 100) / 100; if (!(a.pr < 1)) delete a.pr; }],
    rt: [(a) => a.rt || 1, (a, v) => { a.rt = Math.round(clamp(v, 1, 8)); if (!(a.rt > 1)) delete a.rt; }],
  };
  ['from', 'to', 'at', 'shape'].forEach(k => { FIELDS['b.' + k] = [(a) => Object.assign({}, BEND0, a.b)[k], (a, v) => { a.b = Object.assign({}, BEND0, a.b, { [k]: v }); }]; });
  ['rate', 'depth', 'shape', 'fade'].forEach(k => { FIELDS['osc.' + k] = [(a) => Object.assign({}, OSC0, a.b && a.b.osc)[k], (a, v) => { const b = Object.assign({}, BEND0, a.b); b.osc = Object.assign({}, OSC0, b.osc, { [k]: v }); a.b = b; }]; });
  // the roll's own rule (3.117): defaults are not stored
  function tidy(a) { if (a.b) { if (a.b.osc && !(a.b.osc.depth > 0)) delete a.b.osc; if (!a.b.from && !a.b.to && !a.b.osc) delete a.b; } return a; }
  const noteOf = (d) => (d.notes || [])[clamp(d.sel | 0, 0, Math.max(0, (d.notes || []).length - 1))];

  // the pitch over the note, in semitones from its own pitch: the bend curve, plus the oscillation around it (what the roll's engine plays)
  function curve(a, t) {
    const b = Object.assign({}, BEND0, a.b), u = t <= b.at ? 0 : (t - b.at) / Math.max(1e-6, 1 - b.at);
    const e = b.shape === 'linear' ? u : b.shape === 'early' ? 1 - Math.pow(1 - u, 3) : b.shape === 'late' ? u * u * u : u * u * (3 - 2 * u);
    let st = b.from + (b.to - b.from) * e; const o = b.osc;
    if (o && o.depth > 0) { const cyc = typeof o.rate === 'number' ? o.rate * 2 : 8, ph = t * cyc, f = o.fade ? Math.min(1, t / o.fade) : 1;
      const w = o.shape === 'square' ? Math.sign(Math.sin(ph * 2 * Math.PI)) : o.shape === 'triangle' ? 1 - 4 * Math.abs((ph % 1) - 0.5) : o.shape === 'saw' ? 2 * (ph % 1) - 1 : Math.sin(ph * 2 * Math.PI);
      st += w * o.depth * f; }
    return st;
  }

  const KIND = {
    id: 'music.notes', label: 'Notes',
    title: (d) => d.name || 'Pattern',
    stations: (d) => { const a = noteOf(d); return ['SONG', 'PATTERN · ' + (d.name || 'clip'), a ? 'NOTE · ' + (d.drums ? 'pad ' + a.n : nameOf(a.n)) : 'NOTE']; },
    layers(d) {
      const a = noteOf(d), N = (d.notes || []).length; if (!a) return [{ id: 'pattern', group: 'PATTERN', type: 'events', label: 'No notes', sub: 'draw some in the piano roll', fields: [] }];
      const L = [
        { id: 'pattern', group: 'PATTERN', type: 'events', label: 'Note ' + ((d.sel | 0) + 1) + ' of ' + N, sub: 'click a note in the view to open it', fields: [{ key: 'sel', label: 'Note', type: 'number', min: 1, max: N, step: 1 }] },
        { id: 'timing', group: 'THIS NOTE', type: 'value', label: 'Timing', sub: 'start ' + a.s + ' · length ' + a.l + ' (16ths)', fields: [{ key: 's', label: 'Start', type: 'number', min: 0, step: 0.25, unit: '16ths' }, { key: 'l', label: 'Length', type: 'number', min: 0.25, step: 0.25, unit: '16ths' }, { key: 'mt', label: 'Nudge', type: 'number', min: -50, max: 50, step: 1, unit: '%' }] },
        { id: 'pitch', group: 'THIS NOTE', type: 'value', label: d.drums ? 'Pad' : 'Pitch', sub: d.drums ? 'pad ' + a.n : nameOf(a.n), fields: [{ key: 'n', label: d.drums ? 'Pad' : 'Pitch', type: 'number', min: 0, max: 127, step: 1 }] },
        { id: 'velocity', group: 'THIS NOTE', type: 'value', label: 'Velocity', sub: String(Math.round(a.v * 127)), fields: [{ key: 'v', label: 'Velocity', type: 'number', min: 1, max: 127, step: 1 }] },
        { id: 'depth', group: 'THIS NOTE', type: 'value', label: 'Chance and ratchet', sub: Math.round((a.pr || 1) * 100) + ' % · ' + ((a.rt || 1) > 1 ? '×' + a.rt : 'no ratchet'), fields: [{ key: 'pr', label: 'Chance', type: 'number', min: 5, max: 100, step: 1, unit: '%' }, { key: 'rt', label: 'Ratchet', type: 'number', min: 1, max: 8, step: 1 }] },
      ];
      if (!d.drums) {
        const b = Object.assign({}, BEND0, a.b), o = Object.assign({}, OSC0, a.b && a.b.osc);
        L.push({ id: 'bend', group: 'ITS CURVES', type: 'curve', label: 'Bend', sub: b.from || b.to ? (b.from > 0 ? '+' : '') + b.from + ' → ' + (b.to > 0 ? '+' : '') + b.to + ' st, ' + b.shape : 'flat', fields: [{ key: 'b.from', label: 'From', type: 'number', min: -48, max: 48, step: 0.1, unit: 'st' }, { key: 'b.to', label: 'Bend to', type: 'number', min: -48, max: 48, step: 0.1, unit: 'st' }, { key: 'b.at', label: 'Starts', type: 'number', min: 0, max: 0.95, step: 0.01 }, { key: 'b.shape', label: 'Curve', type: 'enum', options: ['smooth', 'linear', 'early', 'late'] }] });
        L.push({ id: 'osc', group: 'ITS CURVES', type: 'curve', label: 'Oscillate', sub: o.depth > 0 ? '±' + o.depth + ' st, ' + o.shape + ', ' + o.rate : 'off', fields: [{ key: 'osc.depth', label: 'Depth', type: 'number', min: 0, max: 12, step: 0.05, unit: 'st' }, { key: 'osc.rate', label: 'Rate', type: 'enum', options: RATES }, { key: 'osc.shape', label: 'Shape', type: 'enum', options: ['sine', 'triangle', 'saw', 'square', 'random'] }, { key: 'osc.fade', label: 'Fade in', type: 'number', min: 0, max: 1, step: 0.01 }] });
      }
      return L;
    },
    get(d, key) { if (key === 'sel') return (d.sel | 0) + 1; const a = noteOf(d), f = FIELDS[key]; return a && f ? f[0](a) : undefined; },
    set(d, key, v) {
      const out = Object.assign({}, d, { notes: (d.notes || []).map(x => JSON.parse(JSON.stringify(x))) });
      if (key === 'sel') { out.sel = clamp(Math.round(v) - 1, 0, Math.max(0, out.notes.length - 1)); return out; }
      const i = clamp(out.sel | 0, 0, out.notes.length - 1), a = out.notes[i], f = FIELDS[key]; if (!a || !f) return d;
      f[1](a, v); out.notes[i] = tidy(a); return out;
    },
    outline(d) { return [[0, 'SONG'], [1, 'PATTERN · ' + (d.name || 'clip'), 'pattern']].concat((d.notes || []).map((a, i) => [2, (i === (d.sel | 0) ? '▸ ' : '') + (d.drums ? 'pad ' + a.n : nameOf(a.n)) + ' @ ' + a.s, i === (d.sel | 0) ? 'timing' : null])); },
    status(d) { const a = noteOf(d); return [['NOTES', (d.notes || []).length]].concat(a ? [['OPEN', d.drums ? 'pad ' + a.n : nameOf(a.n)], ['VEL', Math.round(a.v * 127)]] : []); },
    // the view: the pattern along the top (pattern scale: click a note to open it), the open note large below (note scale: its pitch curve)
    draw(g, W, H, d) {
      const ns = d.notes || [], a = noteOf(d), top = Math.round(H * 0.32);
      g.fillStyle = '#0a0b0d'; g.fillRect(0, 0, W, H);
      if (!ns.length) { g.fillStyle = '#7f93a8'; g.font = '13px sans-serif'; g.fillText('No notes in this clip', 16, 24); return; }
      const end = Math.max(16, ...ns.map(x => x.s + x.l)), lo = Math.min(...ns.map(x => x.n)) - 1, hi = Math.max(...ns.map(x => x.n)) + 1;
      const X = (s) => 10 + (s / end) * (W - 20), Y = (n) => 8 + (1 - (n - lo) / Math.max(1, hi - lo)) * (top - 20);
      g.strokeStyle = '#1c2026'; g.beginPath(); g.moveTo(0, top); g.lineTo(W, top); g.stroke();
      ns.forEach((x, i) => { g.fillStyle = i === (d.sel | 0) ? '#00d4ff' : 'rgba(0,212,255,0.35)'; g.fillRect(X(x.s), Y(x.n) - 3, Math.max(3, X(x.s + x.l) - X(x.s) - 1), 6); });
      if (!a) return;
      // the open note: its length across the width, its pitch curve in semitones around it (bend + oscillation), velocity as its weight
      const y0 = top + (H - top) / 2, span = Math.max(4, ...[0, 0.25, 0.5, 0.75, 1].map(t => Math.abs(curve(a, t)))) * 1.2, k = (H - top - 30) / 2 / span;
      g.strokeStyle = '#1c2026'; g.beginPath(); g.moveTo(16, y0); g.lineTo(W - 16, y0); g.stroke();
      g.fillStyle = '#7f93a8'; g.font = '12px sans-serif'; g.fillText((d.drums ? 'pad ' + a.n : nameOf(a.n)) + ' · ' + a.l + ' sixteenths · velocity ' + Math.round(a.v * 127), 16, top + 18);
      g.strokeStyle = '#00d4ff'; g.lineWidth = 1 + 4 * a.v; g.beginPath();
      for (let p = 0; p <= 200; p++) { const t = p / 200, x = 16 + t * (W - 32), y = y0 - curve(a, t) * k; if (p) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke(); g.lineWidth = 1;
    },
    // a click on the pattern strip opens that note (the zoom from pattern scale to note scale)
    pick(d, x, y, W, H) {
      const ns = d.notes || [], top = Math.round(H * 0.32); if (!ns.length || y > top) return null;
      const end = Math.max(16, ...ns.map(q => q.s + q.l)), s = ((x - 10) / (W - 20)) * end;
      let best = -1, bd = 1e9; ns.forEach((q, i) => { const dd = s < q.s ? q.s - s : s > q.s + q.l ? s - q.s - q.l : 0; if (dd < bd) { bd = dd; best = i; } });
      return best >= 0 && best !== (d.sel | 0) ? { key: 'sel', value: best + 1, label: 'Open note' } : null;
    },
  };
  function ensure() { const W = global.Workshop; if (!W) return false; if (W.kinds().includes(KIND.id)) return true; const r = W.addKind(KIND); if (!r.ok) console.error('Timeline: the Workshop refused the notes kind —', r.problems.join('; ')); return r.ok; }
  global.EravosTimelineWorkshop = { KIND, ensure, curve };
})(typeof window !== 'undefined' ? window : globalThis);

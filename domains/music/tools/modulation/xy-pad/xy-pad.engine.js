/* eravos.xy-pad 2.0.0 — XY gesture performer (P5) · resolves F-10(xy)
 * Two mod outputs from one surface; records hand motion against SONG POSITION and replays it bar-locked. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  OrganismFactory.define({
    id: 'eravos.xy-pad', domain: 'music', version: '2.0.0', label: 'XY Pad', icon: '✛', accent: '#00d4ff', phase: 'P5',
    category: 'Modulation', blurb: 'Perform two knobs at once with your mouse — then loop the gesture in time.',
    size: { w: 420, h: 520 }, minSize: { w: 320, h: 420 },
    permissions: ['audio_out', 'bus_publish', 'bus_subscribe', 'registry_read'],
    provides: ['capability.external_automation'],
    hooks: [S.mod_out('xy.hook.mod_x', 'x'), S.mod_out('xy.hook.mod_y', 'y'), S.transport_in('xy.hook.transport_in')],
    config: [
      { key: 'smoothing', type: 'number', default: 0.02, min: 0.001, max: 0.3, step: 0.001, unit: 's', label: 'Smooth', group: 'FEEL' },
      { key: 'curveX', type: 'enum', options: ['lin', 'exp', 'log'], default: 'lin', label: 'Curve X', group: 'X' },
      { key: 'curveY', type: 'enum', options: ['lin', 'exp', 'log'], default: 'lin', label: 'Curve Y', group: 'Y' },
      { key: 'minX', type: 'number', default: 0, min: -1, max: 1, step: 0.01, label: 'Min X', group: 'X' },
      { key: 'maxX', type: 'number', default: 1, min: -1, max: 1, step: 0.01, label: 'Max X', group: 'X' },
      { key: 'minY', type: 'number', default: 0, min: -1, max: 1, step: 0.01, label: 'Min Y', group: 'Y' },
      { key: 'maxY', type: 'number', default: 1, min: -1, max: 1, step: 0.01, label: 'Max Y', group: 'Y' },
      { key: 'invertX', type: 'boolean', default: false, label: 'Invert X', group: 'X' },
      { key: 'invertY', type: 'boolean', default: false, label: 'Invert Y', group: 'Y' },
      { key: 'loopBars', type: 'enum', options: [1, 2, 4, 8], default: 2, label: 'Loop bars', group: 'LOOP' },
      { key: 'snapBack', type: 'boolean', default: false, label: 'Snap back', group: 'FEEL' },
      { key: 'homeX', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Home X', group: 'FEEL' },
      { key: 'homeY', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Home Y', group: 'FEEL' },
      { key: 'returnTime', type: 'number', default: 0.3, min: 0, max: 2, step: 0.01, unit: 's', label: 'Return', group: 'FEEL' },
      { key: 'inertia', type: 'boolean', default: false, label: 'Inertia', group: 'FEEL' },
      { key: 'friction', type: 'number', default: 0.85, min: 0, max: 1, step: 0.01, label: 'Friction', group: 'FEEL' },
    ],
    ui_hooks: ['xy_move', 'xy_release', 'loop_arm', 'loop_play', 'loop_clear'],
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params;
      const cx = ac.createConstantSource(), cy = ac.createConstantSource(); cx.offset.value = 0; cy.offset.value = 0; cx.start(); cy.start(); ctx.track(cx); ctx.track(cy);
      ctx.port('x', { kind: 'mod', direction: 'out', node: cx, label: 'X' });
      ctx.port('y', { kind: 'mod', direction: 'out', node: cy, label: 'Y' });
      let pos = { x: P.get('homeX'), y: P.get('homeY') }, touching = false, vel = { x: 0, y: 0 }, lastMove = null;
      let loop = null, armed = false, recording = null, looping = false;
      const tick = { step16: 0, time: 0, stepDur: 0.125 }; let playing = false;
      function curve(v, c) { return c === 'exp' ? v * v : c === 'log' ? Math.sqrt(v) : v; }
      function mapX(x) { x = P.get('invertX') ? 1 - x : x; x = curve(Math.max(0, Math.min(1, x)), P.get('curveX')); return P.get('minX') + (P.get('maxX') - P.get('minX')) * x; }
      function mapY(y) { y = P.get('invertY') ? 1 - y : y; y = curve(Math.max(0, Math.min(1, y)), P.get('curveY')); return P.get('minY') + (P.get('maxY') - P.get('minY')) * y; }
      ctx.mapX = mapX; ctx.mapY = mapY;
      function out(x, y, t, exact) {
        t = t === undefined ? ac.currentTime : t;
        if (exact) { cx.offset.setValueAtTime(mapX(x), t); cy.offset.setValueAtTime(mapY(y), t); }
        else { cx.offset.setTargetAtTime(mapX(x), t, P.get('smoothing')); cy.offset.setTargetAtTime(mapY(y), t, P.get('smoothing')); }
      }
      function songPos(t) { return tick.step16 + ((t === undefined ? ac.currentTime : t) - tick.time) / tick.stepDur; }
      function move(x, y, t) {
        const now = t === undefined ? ac.currentTime : t;
        if (lastMove) { const dt = Math.max(1e-3, now - lastMove.t); vel = { x: (x - lastMove.x) / dt, y: (y - lastMove.y) / dt }; }
        lastMove = { x, y, t: now };
        pos = { x, y }; touching = true; out(x, y, now);
        if (recording && playing) {
          const p16 = songPos(now);
          if (p16 >= recording.start) {
            const last = recording.pts[recording.pts.length - 1];
            if (!last || p16 - last.p >= (1 / 60) / tick.stepDur) recording.pts.push({ p: p16 - recording.start, x, y });
          }
        }
        ctx.emitUI('pos', { x, y, live: true });
      }
      ctx.move = move;
      ctx.onUI('xy_move', { type: 'object', required: ['x', 'y'], properties: { x: { type: 'number', minimum: 0, maximum: 1 }, y: { type: 'number', minimum: 0, maximum: 1 } } }, (p) => move(p.x, p.y));
      ctx.onUI('xy_release', null, () => {
        touching = false;
        if (P.get('inertia') && (Math.abs(vel.x) + Math.abs(vel.y)) > 0.05) { coast(); return; }
        if (P.get('snapBack') && !looping) { const rt = P.get('returnTime'); cx.offset.setTargetAtTime(mapX(P.get('homeX')), ac.currentTime, rt / 4 + 1e-3); cy.offset.setTargetAtTime(mapY(P.get('homeY')), ac.currentTime, rt / 4 + 1e-3); pos = { x: P.get('homeX'), y: P.get('homeY') }; ctx.emitUI('pos', Object.assign({ live: false }, pos)); }
      });
      // inertia: puck keeps moving, friction per 1/60 s, bounces off walls (UI-rate physics, not musical timing)
      let coastT = null;
      function coast() {
        if (coastT) clearInterval(coastT);
        const f = P.get('friction');
        coastT = ctx.interval(() => {
          if (touching) { clearInterval(coastT); coastT = null; return; }
          vel.x *= f; vel.y *= f;
          let x = pos.x + vel.x / 60, y = pos.y + vel.y / 60;
          if (x < 0 || x > 1) { vel.x = -vel.x; x = Math.max(0, Math.min(1, x)); }
          if (y < 0 || y > 1) { vel.y = -vel.y; y = Math.max(0, Math.min(1, y)); }
          pos = { x, y }; out(x, y); ctx.emitUI('pos', { x, y, live: false });
          if (Math.abs(vel.x) + Math.abs(vel.y) < 0.01) { clearInterval(coastT); coastT = null; }
        }, 1000 / 60);
      }
      ctx.coastStep = (n) => { const f = P.get('friction'); let d = 0; for (let i = 0; i < n; i++) { vel.x *= f; vel.y *= f; d += Math.hypot(vel.x, vel.y) / 60; } return d; };
      // loop
      ctx.onUI('loop_arm', null, () => { armed = true; ctx.syncUI(); });
      ctx.onUI('loop_play', { type: 'object' }, (p) => { looping = p && p.on !== undefined ? !!p.on : !looping; ctx.syncUI(); });
      ctx.onUI('loop_clear', null, () => { loop = null; looping = false; armed = false; recording = null; ctx.syncUI(); });
      function valueAt(lp) { // lp in 1/16 steps within loop
        const pts = loop.pts; if (!pts.length) return null;
        let i = pts.findIndex(q => q.p > lp);
        if (i <= 0) return i === 0 ? pts[0] : pts[pts.length - 1];
        const a = pts[i - 1], b = pts[i], f = (lp - a.p) / (b.p - a.p);
        return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
      }
      ctx.valueAt = valueAt;
      ctx.onTick((tk) => {
        Object.assign(tick, tk); playing = true;
        const L = P.get('loopBars') * 16;
        if (armed && tk.step16 % 16 === 0) { recording = { start: tk.step16, pts: [{ p: 0, x: pos.x, y: pos.y }] }; armed = false; ctx.syncUI(); }
        if (recording && tk.step16 >= recording.start + L) { loop = { pts: recording.pts, len: L, recordedAt: recording.start }; recording = null; looping = true; ctx.syncUI(); }
        if (looping && loop && !touching) {
          // schedule the samples falling in [t, t + stepDur)
          const lp0 = ((tk.step16 - (loop.recordedAt || 0)) % loop.len + loop.len) % loop.len;
          loop.pts.forEach(q => { if (q.p >= lp0 && q.p < lp0 + 1) out(q.x, q.y, tk.time + (q.p - lp0) * tk.stepDur, true); });
          const v = valueAt(lp0); if (v) ctx.emitUI('pos', { x: v.x, y: v.y, live: false, loop: true, time: tk.time });
        }
      });
      ctx.onStop(() => { playing = false; if (recording) { recording = null; ctx.syncUI(); } });
      ctx.injectLoop = (pts, len, at) => { loop = { pts, len, recordedAt: at || 0 }; looping = true; };
      ctx.stateExtra = () => ({ armed, recording: !!recording, looping, loop: loop ? loop.pts.map(q => [q.p / loop.len, q.x, q.y]) : null, x: pos.x, y: pos.y });
      ctx.saveExtra = () => ({ loop, pos });
      ctx.loadExtra = (x) => { if (!x) return; if (x.loop) loop = x.loop; if (x.pos) { pos = x.pos; out(pos.x, pos.y); } };
      out(pos.x, pos.y);
      return {};
    },
  });
})();

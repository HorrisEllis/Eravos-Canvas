/* eravos.macro-automation 2.0.0 — Automation lanes (P5)
 * Breakpoint curves over song position (bars) for any parameter of any mounted organism.
 * Output: audio-rate (kernel modulation wire, when the target exposes a mod port with the same range)
 *         or event-rate (ui:config_change:<target> ≤ 60 Hz, only on change > 1e-3).
 * Record: captures ui:config_change:<target> against song position, thinned by Ramer–Douglas–Peucker (ε 0.005). */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const NL = 8;
  function rdp(pts, eps) {
    if (pts.length < 3) return pts.slice();
    const a = pts[0], b = pts[pts.length - 1]; let idx = -1, dmax = 0;
    const dx = b.bar - a.bar, dy = b.value - a.value, len = Math.hypot(dx, dy) || 1e-9;
    for (let i = 1; i < pts.length - 1; i++) {
      // vertical (value) distance to the chord — values and bars live on different scales
      const u = dx ? (pts[i].bar - a.bar) / dx : 0; const d = Math.abs(pts[i].value - (a.value + dy * u));
      if (d > dmax) { dmax = d; idx = i; }
    }
    if (dmax <= eps) return [a, b];
    return rdp(pts.slice(0, idx + 1), eps).slice(0, -1).concat(rdp(pts.slice(idx), eps));
  }
  OrganismFactory.define({
    id: 'eravos.macro-automation', domain: 'music', version: '2.0.0', label: 'Automation', icon: '⤴', accent: '#ffaa00', phase: 'P5',
    category: 'Modulation', blurb: 'Draw how any knob changes across the song — filter opens over the build, reverb swells into the drop.',
    size: { w: 760, h: 420 }, minSize: { w: 520, h: 300 },
    permissions: ['audio_out', 'bus_publish', 'bus_subscribe', 'registry_read'],
    provides: ['capability.automation_record', 'capability.automation_playback'],
    hooks: [
      Object.assign(S.event('auto.hook.drive_out', 'out', 'ui:config_change', { type: 'object', required: ['key', 'value'] }, '1.0.0'), { rail: false }),
      ...Array.from({ length: NL }, (_, i) => Object.assign(S.mod_out('auto.hook.mod_lane' + i, 'lane' + i), { rail: false })),
      S.transport_in('auto.hook.transport_in'),
      Object.assign(S.event('auto.hook.target_in', 'in', 'ui:config_change', { type: 'object', required: ['key'] }, '1.0.0'), { rail: false }),
    ],
    config: [
      { key: 'lengthBars', type: 'integer', default: 16, min: 1, max: 512, label: 'Length', group: 'LANES' },
      { key: 'quantize', type: 'enum', options: ['off', '1/16', '1/8', '1/4', '1 bar'], default: '1/16', label: 'Grid', group: 'LANES' },
      { key: 'mode', type: 'enum', options: ['read', 'write', 'latch', 'off'], default: 'read', label: 'Mode', group: 'LANES' },
    ],
    ui_hooks: ['lane_add', 'lane_remove', 'point_edit', 'lane_mode'],
    restoreTwice: true,
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, K = ctx.K;
      let lanes = [];
      const srcs = Array.from({ length: NL }, (_, i) => { const c = ac.createConstantSource(); c.offset.value = 0; c.start(); ctx.track(c); ctx.port('lane' + i, { kind: 'mod', direction: 'out', node: c, label: 'lane ' + (i + 1) }); return c; });
      let playing = false; const tick = { step16: 0, time: 0, stepDur: 0.125 };
      let songLen = null;
      const lengthBars = () => songLen || P.get('lengthBars');
      ctx.on('timeline:song_length', { type: 'object', required: ['bars'] }, (p) => { songLen = p.bars; ctx.syncUI(); });

      function cfgOf(target, key) { const r = K.registry.get(target); return r ? (r.descriptor.config || []).find(c => c.key === key) || null : null; }
      function norm(c, v) { if (!c) return 0; if (c.type === 'boolean') return v ? 1 : 0; if (c.type === 'enum') return c.options.length > 1 ? c.options.findIndex(o => String(o) === String(v)) / (c.options.length - 1) : 0; return (v - c.min) / ((c.max - c.min) || 1); }
      function denorm(c, n) { n = Math.max(0, Math.min(1, n)); if (c.type === 'boolean') return n >= 0.5; if (c.type === 'enum') return c.options[Math.round(n * (c.options.length - 1))]; let v = c.min + n * (c.max - c.min); if (c.step) v = Math.round(v / c.step) * c.step; if (c.type === 'integer') v = Math.round(v); return +v.toFixed(6); }
      ctx.norm = norm; ctx.denorm = denorm;
      function stepHold(c) { return c && (c.type === 'enum' || c.type === 'boolean'); }
      function valueAt(lane, bar) {
        const pts = lane.points; if (!pts.length) return null;
        if (bar <= pts[0].bar) return pts[0].value;
        for (let i = 1; i < pts.length; i++) if (bar < pts[i].bar) {
          const a = pts[i - 1], b = pts[i]; if (lane.hold) return a.value;
          let u = (bar - a.bar) / ((b.bar - a.bar) || 1e-9); const c = a.curve || 0;
          if (c > 0) u = Math.pow(u, 1 + c * 3); else if (c < 0) u = 1 - Math.pow(1 - u, 1 - c * 3);
          return a.value + (b.value - a.value) * u;
        }
        return pts[pts.length - 1].value;
      }
      ctx.valueAt = valueAt;
      const logged = new Set();
      function laneOk(l) {
        if (!l.enabled) return false;
        if (!K.registry.has(l.target)) { if (!logged.has(l.id)) { logged.add(l.id); l.missing = true; l.enabled = false; ctx.fault('MUTATION_001', `lane ${l.label || l.key}: target ${l.target} unmounted — lane disabled`); ctx.syncUI(); } return false; }
        return true;
      }
      function audioHookFor(target, key) {
        const r = K.registry.get(target); if (!r) return null;
        const h = Array.from(r.hooks.values()).find(h => h.wire_type === 'modulation' && h.direction === 'in' && h.mod_key === key); if (!h) return null;
        const port = K.audio.port(target, h.port); const c = cfgOf(target, key);
        if (!port || !c || c.type !== 'number' || Math.abs(port.range.min - c.min) > 1e-9 || Math.abs(port.range.max - c.max) > 1e-9) return null;
        return h;
      }
      function laneIndexFree() { for (let i = 0; i < NL; i++) if (!lanes.some(l => l.slot === i)) return i; return -1; }
      function addLane(target, key) {
        const c = cfgOf(target, key);
        if (!c) { ctx.fault('RUNTIME_002', `lane_add: ${target} has no config key ${key}`); return null; }
        const slot = laneIndexFree(); if (slot < 0) { ctx.fault('RUNTIME_005', 'max 8 lanes'); return null; }
        const r = K.registry.get(target);
        const rv = K.registry.readParam(ctx.id, target, key); const cur = rv === undefined ? c.default : rv;
        const lane = { id: 'a' + Date.now().toString(36) + slot, slot, target, key, label: (r.descriptor.icon || '') + ' ' + r.descriptor.label + ' · ' + (c.label || key), points: [{ bar: 1, value: norm(c, cur), curve: 0 }], enabled: true, hold: stepHold(c), output: 'event', wire: null, mode: 'read', lastSent: null };
        const hk = audioHookFor(target, key);
        if (hk) { const w = K.wires.register({ src: { instanceId: ctx.id, hookId: 'auto.hook.mod_lane' + slot }, dst: { instanceId: target, hookId: hk.hook_id } }); if (w.ok) { lane.output = 'audio'; lane.wire = w.wire_id; lane.base = cur; } }
        lanes.push(lane); ctx.syncUI(); return lane;
      }
      ctx.addLane = addLane; ctx.lanes = () => lanes;
      function sendEvent(l, n) {
        if (l.lastSent !== null && Math.abs(l.lastSent - n) <= 1e-3) return false;
        l.lastSent = n; const c = cfgOf(l.target, l.key); if (!c) return false;
        ctx.emit('ui:config_change:' + l.target, { key: l.key, value: denorm(c, n), _auto: true });
        return true;
      }
      ctx.sendEvent = sendEvent;
      function audioSignal(l, n) { const c = cfgOf(l.target, l.key); return (denorm(c, n) - l.base) / ((c.max - c.min) / 2); }
      const songBar = (t) => (tick.step16 + ((t === undefined ? ac.currentTime : t) - tick.time) / tick.stepDur) / 16 + 1;
      ctx.onTick((tk) => {
        Object.assign(tick, tk); playing = true;
        if (P.get('mode') === 'off') return;
        lanes.forEach(l => {
          if (!laneOk(l) || l.output !== 'audio' || l.recording) return;
          const s = srcs[l.slot].offset; const b0 = tk.step16 / 16 + 1, db = 1 / 16;
          for (let k = 0; k <= 4; k++) { const v = valueAt(l, (b0 + db * k / 4 - 1) % lengthBars() + 1); if (v === null) continue; const t = tk.time + tk.stepDur * k / 4; if (k === 0) s.setValueAtTime(audioSignal(l, v), t); else s.linearRampToValueAtTime(audioSignal(l, v), t); }
        });
        if (!rtTimer) lanes.forEach(l => { if (l.output === 'event' && laneOk(l) && !l.recording) { const v = valueAt(l, (songBar(tk.time) - 1) % lengthBars() + 1); if (v !== null) sendEvent(l, v); } });
      });
      // event-rate ≤ 60 Hz while playing (realtime contexts)
      let rtTimer = null;
      if (!(ac instanceof (window.OfflineAudioContext || function () {}))) rtTimer = ctx.interval(() => {
        if (!playing || P.get('mode') === 'off') return;
        const bar = (songBar() - 1) % lengthBars() + 1;
        lanes.forEach(l => { if (l.output !== 'event' || l.recording || !laneOk(l)) return; const v = valueAt(l, bar); if (v !== null) sendEvent(l, v); });
        ctx.emitUI('play_bar', { bar });
      }, 1000 / 60);
      // record
      const rec = new Map(); // laneId → [{bar,value}]
      ctx.on('ui:config_change:*', { type: 'object', required: ['key'] }, (p, topic) => {
        if (p._auto || p._from === ctx.id) return;
        const target = topic.slice('ui:config_change:'.length);
        const mode = P.get('mode'); if (!playing || (mode !== 'write' && mode !== 'latch')) return;
        lanes.forEach(l => {
          if (l.target !== target || l.key !== p.key) return;
          const c = cfgOf(target, p.key); if (!c) return;
          if (!rec.has(l.id)) { rec.set(l.id, []); l.recording = true; }
          rec.get(l.id).push({ bar: (songBar() - 1) % lengthBars() + 1, value: norm(c, p.value), curve: 0 });
        });
      });
      function commit() {
        rec.forEach((pts, id) => {
          const l = lanes.find(x => x.id === id); if (!l) return; l.recording = false; if (pts.length < 1) return;
          const thin = rdp(pts, 0.005);
          const b0 = thin[0].bar, b1 = thin[thin.length - 1].bar;
          l.points = l.points.filter(q => q.bar < b0 || q.bar > b1).concat(thin).sort((a, b) => a.bar - b.bar);
        });
        rec.clear(); ctx.syncUI();
      }
      ctx.commitRecording = commit; ctx.rdp = rdp;
      ctx.onStop(() => { playing = false; commit(); lanes.forEach(l => { l.lastSent = null; if (l.output === 'audio') { srcs[l.slot].offset.cancelScheduledValues(ac.currentTime); } }); });
      ctx.on('kernel:organism-unmounted', null, (p) => { lanes.forEach(l => { if (l.target === p.instanceId) laneOk(l); }); });
      // UI
      function snapBar(b) { const q = { off: 0, '1/16': 1 / 16, '1/8': 1 / 8, '1/4': 1 / 4, '1 bar': 1 }[P.get('quantize')]; return q ? 1 + Math.round((b - 1) / q) * q : b; }
      ctx.onUI('lane_add', { type: 'object', required: ['target', 'key'] }, (p) => addLane(p.target, p.key));
      ctx.onUI('lane_remove', { type: 'object', required: ['id'] }, (p) => { const l = lanes.find(x => x.id === p.id); if (!l) return; if (l.wire) K.wires.remove(l.wire, 'lane_removed'); srcs[l.slot].offset.cancelScheduledValues(ac.currentTime); srcs[l.slot].offset.setValueAtTime(0, ac.currentTime); lanes = lanes.filter(x => x !== l); ctx.syncUI(); });
      ctx.onUI('lane_mode', { type: 'object', required: ['id'] }, (p) => { const l = lanes.find(x => x.id === p.id); if (!l) return; if (p.enabled !== undefined) { l.enabled = !!p.enabled; if (l.enabled) { l.missing = !K.registry.has(l.target); logged.delete(l.id); } } ctx.syncUI(); });
      ctx.onUI('point_edit', { type: 'object', required: ['lane', 'op'] }, (p) => {
        const l = lanes.find(x => x.id === p.lane); if (!l) return ctx.fault('RUNTIME_002', 'point_edit: lane');
        const q = p.point || {};
        if (p.op === 'add') l.points.push({ bar: Math.max(1, snapBar(q.bar)), value: Math.max(0, Math.min(1, q.value)), curve: 0 });
        else if (p.op === 'move') { const pt = l.points[p.index]; if (pt) { pt.bar = Math.max(1, snapBar(q.bar)); pt.value = Math.max(0, Math.min(1, q.value)); } }
        else if (p.op === 'curve') { const pt = l.points[p.index]; if (pt) pt.curve = Math.max(-1, Math.min(1, q.curve)); }
        else if (p.op === 'delete') { if (l.points.length > 1) l.points.splice(p.index, 1); }
        else if (p.op === 'clear') l.points = l.points.slice(0, 1);
        else if (p.op === 'set') l.points = (p.points || []).map(x => ({ bar: +x.bar, value: +x.value, curve: +x.curve || 0 }));
        l.points.sort((a, b) => a.bar - b.bar); l.lastSent = null; ctx.syncUI();
      });
      ctx.stateExtra = () => ({
        lanes: lanes.map(l => ({ id: l.id, label: l.label, points: l.points, enabled: l.enabled, missing: !!l.missing, output: l.output, hold: l.hold, recording: !!l.recording })),
        length: lengthBars(),
        params: K.registry.list().filter(r => !r.descriptor.system && r.instance_id !== ctx.id).map(r => ({ id: r.instance_id, label: (r.descriptor.icon || '') + ' ' + r.descriptor.label, keys: (r.descriptor.config || []).filter(c => ['number', 'integer', 'enum', 'boolean'].includes(c.type) && !c.hidden).map(c => ({ key: c.key, label: c.label || c.key, group: c.group || '' })) })),
      });
      ctx.on('kernel:organism-mounted', null, () => ctx.syncUI());
      ctx.saveExtra = () => ({ lanes: lanes.map(l => Object.assign({}, l, { wire: null, lastSent: null, recording: false })) });
      ctx.loadExtra = (x) => {
        if (!x || !x.lanes) return;
        lanes = [];
        x.lanes.forEach(sl => { if (!K.registry.has(sl.target)) { lanes.push(Object.assign({}, sl, { enabled: false, missing: true })); return; } const l = addLane(sl.target, sl.key); if (l) { l.points = sl.points; l.enabled = sl.enabled; } });
        ctx.syncUI();
      };
      return {};
    },
  });
})();

/* ERAVOS runtime — glass-link.js → window.GlassLink (spec eravos.host). Domain-free. Inert unless ERAVOS Glass serves
 * the page (host/glass.js sets window.ERAVOS_GLASS before any script runs).
 * The page joins Glass's event stream; canvas.* commands that arrive are carried out exactly as a person would do them
 * (spawn, ui:* events, kernel wires — so all of it is undoable and saved) and answered; what happens on the canvas
 * (windows opened and closed, wires) goes back to Glass as page:* events, so whoever drives it sees the canvas move. */
(function (global) {
  'use strict';
  const G = global.ERAVOS_GLASS; if (!G || !global.EventSource || !global.fetch) { global.GlassLink = { active: false }; return; }
  const F = () => global.OrganismFactory, K = () => global.Kernel;
  const post = (p, b) => global.fetch(p, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Eravos-Glass': '1' }, body: JSON.stringify(b) }).catch(() => {});
  const live = (id) => { const r = id && F().handle(id); return r && !r.unmounted && !r.ephemeral && !r.service ? r : null; };
  const jsonable = (v) => { try { return JSON.parse(JSON.stringify(v === undefined ? null : v)); } catch (e) { return null; } };
  function paramsOf(r) { const o = {}; (r.def.config || []).filter(c => !c.hidden).forEach(c => { o[c.key] = jsonable(r.ctx.params.get(c.key)); }); return o; }
  function need(r, id) { if (!r) throw new Error(`no window ${id} on the canvas`); return r; }
  function settle() { return new Promise(res => global.setTimeout(res, 0)); }

  const cmds = {
    'canvas.tools': () => F().defined().filter(d => !d.system).map(d => ({ id: d.id, label: d.label, category: d.category || '', blurb: d.blurb || '',
      settings: (d.config || []).filter(c => !c.hidden).map(c => ({ key: c.key, type: c.type, min: c.min, max: c.max, options: c.options, default: jsonable(c.default), label: c.label })),
      presets: Object.keys(d.presets || {}), suite: !!(d.suite && (d.suite.members || []).length) })),
    'canvas.state': () => ({
      windows: K().registry.list().map(x => live(x.instance_id)).filter(Boolean).filter(r => !r.hostId).map(r => ({ instanceId: r.instanceId, tool: r.id, label: r.def.label, params: paramsOf(r) })),
      wires: K().wires.list().filter(w => !(w.meta && w.meta.insert)).map(w => ({ wireId: w.wire_id, from: [w.src.instanceId, w.src.hookId], to: [w.dst.instanceId, w.dst.hookId], type: w.wire_type })),
    }),
    'canvas.spawn': async (d) => {
      if (!F().def(d.tool)) throw new Error(`no tool ${d.tool} — canvas.tools lists them`);
      const id = F().spawn(d.tool, Object.assign({ K: K() }, typeof d.x === 'number' ? { x: d.x, y: d.y } : {})); if (!id) throw new Error(`${d.tool} could not open`);
      if (d.preset) K().bus.publish('ui:preset_load:' + id, { name: d.preset });
      await settle(); return { instanceId: id };
    },
    'canvas.set': async (d) => {
      const r = need(live(d.instanceId), d.instanceId), p = d.params || { [d.key]: d.value }, keys = Object.keys(p);
      const known = new Set((r.def.config || []).map(c => c.key)), bad = keys.filter(k => !known.has(k)); if (bad.length) throw new Error(`${r.def.label} has no setting ${bad.join(', ')}`);
      keys.forEach(k => K().bus.publish('ui:config_change:' + r.instanceId, { key: k, value: p[k] }));
      await settle(); const o = {}; keys.forEach(k => { o[k] = jsonable(r.ctx.params.get(k)); }); return o;
    },
    'canvas.preset': async (d) => { const r = need(live(d.instanceId), d.instanceId); if (!(r.def.presets || {})[d.name]) throw new Error(`${r.def.label} has no preset “${d.name}”`); K().bus.publish('ui:preset_load:' + r.instanceId, { name: d.name }); await settle(); return paramsOf(r); },
    'canvas.wire': (d) => { const w = K().wires.register({ src: { instanceId: d.from[0], hookId: d.from[1] }, dst: { instanceId: d.to[0], hookId: d.to[1] } }); if (!w.ok) throw new Error((w.fault && (w.fault.message || w.fault.code)) || 'the wire was refused'); return { wireId: w.wire_id }; },
    'canvas.unwire': (d) => { if (!K().wires.remove(d.wireId, 'glass')) throw new Error('no wire ' + d.wireId); return { removed: d.wireId }; },
    'canvas.close': (d) => { need(live(d.instanceId), d.instanceId); F().close(d.instanceId, 'glass'); return { closed: d.instanceId }; },
    'canvas.suite': async (d) => {
      const def = F().def(d.tool); if (!def) throw new Error('no tool ' + d.tool); if (!global.ToolPage) throw new Error('tool pages are not loaded');
      const st = { d: def, K: K(), target: live(d.instanceId) ? d.instanceId : null, made: new Map() };
      const out = global.ToolPage.loadSuite(st); await settle(); return { instanceId: st.target, loaded: out.filter(Boolean).length, of: ((def.suite && def.suite.members) || []).length };
    },
  };

  let es = null, handled = 0;
  function connect() {
    es = new global.EventSource(G.events + '?role=page');
    es.onmessage = async (m) => {
      let ev; try { ev = JSON.parse(m.data); } catch (e) { return; }
      if (ev.type !== 'canvas:cmd' || !ev.data || !ev.data.id) return;
      const { id, cmd, data } = ev.data, fn = cmds[cmd];
      try { if (!fn) throw new Error('the canvas does not know ' + cmd); const result = await fn(data || {}); handled++; post('/glass/reply', { id, ok: true, result: jsonable(result) }); }
      catch (e) { post('/glass/reply', { id, ok: false, error: e.message }); }
    };
  }
  // what happens on the canvas goes back to Glass
  function watch() {
    const k = K(), say = (type, data) => post('/glass/emit', { type: 'page:' + type, data });
    k.bus.subscribe('kernel:organism-mounted', (p) => global.setTimeout(() => { const r = live(p.instanceId); if (r && !r.hostId) say('opened', { instanceId: p.instanceId, tool: p.organismId }); }, 0), 'glass');   // the factory files the window a moment after the kernel mounts it
    k.bus.subscribe('kernel:organism-unmounted', (p) => say('closed', { instanceId: p.instanceId, tool: p.organismId }), 'glass');
    k.bus.subscribe('kernel:wire-registered', (w) => { if (w && w.src && !(w.meta && w.meta.insert)) say('wired', { wireId: w.wire_id, from: [w.src.instanceId, w.src.hookId], to: [w.dst.instanceId, w.dst.hookId] }); }, 'glass');
  }
  function init() { if (init.done) return; init.done = true; connect(); try { watch(); } catch (e) {} }
  global.GlassLink = { active: true, init, commands: () => Object.keys(cmds), get handled() { return handled; }, close: () => es && es.close() };
  // the kernel and factory exist once every script has loaded
  if (global.document && global.document.readyState === 'loading') global.document.addEventListener('DOMContentLoaded', init); else global.setTimeout(init, 0);
})(typeof window !== 'undefined' ? window : globalThis);

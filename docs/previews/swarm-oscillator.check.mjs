import { chromium } from '../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
import fs from 'fs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
p.on('pageerror', e => console.log('ERR', e.message));
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X && OrganismFactory.defined().length > 50);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); document.querySelectorAll('.overlay').forEach(o => o.remove()); });
await p.evaluate(fs.readFileSync(ROOT + '/docs/previews/swarm-oscillator.preview.js', 'utf8'));
const r = await p.evaluate(async () => {
  const out = {}, d = OrganismFactory.def('eravos.swarm-oscillator');
  const id = OrganismFactory.spawn('eravos.swarm-oscillator', { x: 40, y: 40 }); await new Promise(r => setTimeout(r, 300));
  const rec = Kernel.registry.get(id); out.reg_hooks = Array.from(rec.hooks.keys()).slice(0, 40); const rp0 = OrganismFactory.spawn('eravos.retro-poly', { x: 1, y: 1 }); out.rp_reg = Array.from(Kernel.registry.get(rp0).hooks.keys()).filter(k => /knob/.test(k)).slice(0, 5);
  out.instrument_for_timeline = Array.from(rec.hooks.values()).some(hk => hk.direction === 'in' && hk.event_type === 'note:trigger');
  out.knob_inputs = d.hooks.filter(h => /^knob\./.test(h.hook_id)).length;
  out.number_params = d.config.filter(c => c.type === 'number').length;
  out.mod_out = d.hooks.filter(h => h.wire_type === 'modulation' && h.direction === 'out').map(h => h.hook_id);
  const tl = OrganismFactory.spawn('eravos.timeline', { x: 700, y: 40 }); await new Promise(r => setTimeout(r, 400));
  const tctx = OrganismFactory.handle(tl).ctx; out.timeline_lists_it = JSON.stringify(tctx.internals.instruments()).includes(id);
  // wire an LFO into Coupling, and Swarm's coherence into another tool's knob
  const lfo = OrganismFactory.spawn('eravos.lfo', { x: 40, y: 700 });
  const lo = OrganismFactory.handle(lfo).def.hooks.find(h => h.wire_type === 'modulation' && h.direction === 'out');
  const w1 = Kernel.wires.register({ src: { instanceId: lfo, hookId: lo.hook_id }, dst: { instanceId: id, hookId: 'so.hook.mod_coupling' } }); out.lfo_moves_coupling = w1.ok || w1; out.lfo_hooks = OrganismFactory.handle(lfo).def.hooks.map(h => h.hook_id + ':' + h.wire_type + ':' + h.direction);
  const rp = OrganismFactory.spawn('eravos.retro-poly', { x: 1100, y: 40 });
  const w2 = Kernel.wires.register({ src: { instanceId: id, hookId: 'so.hook.coherence' }, dst: { instanceId: rp, hookId: 'rp.hook.mod_cutoff' } }); out.coherence_moves_retro_cutoff = w2.ok || w2;
  // design rules D1–D6 on its window (same tests as tests/design-check.mjs)
  const w = CanvasWM.windowOf(id), rgb = (c) => { const m = /rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?/.exec(c || ''); return m ? { v: [+m[1], +m[2], +m[3]], a: m[4] === undefined ? 1 : +m[4] } : null; };
  const tinted = (c) => { const x = rgb(c); if (!x || x.a < 0.05) return false; const mx = Math.max(...x.v), mn = Math.min(...x.v); return mx <= BlackSurfaces.MAX && mx - mn >= 4 && mx - mn <= BlackSurfaces.CHROMA; };
  const KIT = /\b(uk-|tb-btn|wm-|tp-|rcp-|sbk-|ap-|fl-btn|org-|preview|pv-)/, v = { D1: [], D2: [], D3: [], D4: [], D5: 0 };
  w.querySelectorAll('*').forEach(el => { const cs = getComputedStyle(el);
    if (tinted(cs.backgroundColor)) v.D1.push(el.className);
    if (el.matches('.uk-knob-label') && el.getBoundingClientRect().width > el.parentElement.getBoundingClientRect().width + 1) v.D3.push(el.textContent);
    if (el.tagName === 'BUTTON' && !KIT.test(el.className || '') && !(el.parentElement && KIT.test(el.parentElement.className || '')) && el.offsetParent) v.D4.push(el.textContent); });
  v.D5 = w.querySelectorAll('.uk-btn.primary').length; out.design = v; const rw = CanvasWM.windowOf(rp); out.retro_same_D1 = Array.from(rw.querySelectorAll('*')).filter(el => tinted(getComputedStyle(el).backgroundColor)).map(el => el.className);
  // reactive colours: put Reactive on and see the window's drawn display change colour while it sounds
  out.reactive_modes = window.SoundCSS ? 'SoundCSS on, canvas patched: ' + !!CanvasRenderingContext2D.prototype._eravosRC : 'no SoundCSS';
  return out;
});
console.log(JSON.stringify(r, null, 1)); await b.close();

#!/usr/bin/env node
/* UI lag probe (3.76): measure, don't guess. Opens the canvas, writes a Song Engine song, plays it in real time and records
 * every animation frame for SEC seconds, once per mode. Reports: frames/s, slow frames (> 33 ms), and the main thread's
 * style-recalc / layout / script time from the DevTools Performance domain. node build/perf-ui.mjs [mode[:glass|page],…]
 * WEBGPU=1 starts the browser with a (software) WebGPU adapter. */
import { chromium } from '../host/driver/glass.js';
import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), SEC = +(process.env.SEC || 6);
const modes = (process.argv[2] || 'static,changing,off').split(',');
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'].concat(process.env.WEBGPU ? ['--enable-unsafe-webgpu', '--enable-features=Vulkan', '--use-angle=swiftshader', '--use-webgpu-adapter=swiftshader'] : []) });
const out = [];
for (const mode of modes) {
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  await p.addInitScript((m) => { window.ERAVOS_CATALOG_ALL = true; const [md, dr, x] = m.split(':'); try { localStorage.setItem('eravos.reactive.mode', md); if (dr) localStorage.setItem('eravos.reactive.draw', dr); } catch (e) {} }, mode);
  await p.goto('file://' + path.join(ROOT, 'canvas', 'index.html'));
  await p.waitForFunction(() => window.SongEngine && window.Kernel && window.OrganismFactory, null, { timeout: 30000 });
  await p.waitForTimeout(1500);
  await p._send('Performance.enable').catch(() => {});
  const r = await p.evaluate(async (SEC) => {
    const K = Kernel; const ac = K.audio.boot(); try { await ac.resume(); } catch (e) {}
    try { await SongEngine.write('dubstep', 77); } catch (e) { return { err: 'write: ' + e.message }; }
    await new Promise(r => setTimeout(r, 1500));
    K.bus.publish('transport:play', {});
    const tl = K.registry.byOrganism('eravos.timeline')[0]; if (tl) K.bus.publish('ui:transport_play:' + tl.instance_id, {});
    await new Promise(r => setTimeout(r, 800));
    const fr = []; let last = performance.now(); const t0 = last;
    await new Promise(res => { const f = (t) => { fr.push(t - last); last = t; if (t - t0 < SEC * 1000) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
    return { frames: fr.length, fps: +(fr.length / SEC).toFixed(1), slow: fr.filter(x => x > 33).length, worst: +Math.max(...fr).toFixed(1), windows: document.querySelectorAll('.wm-win').length, els: document.getElementsByTagName('*').length, react: document.documentElement.dataset.react, renderer: window.GlassLayer && GlassLayer.renderer, glass: window.GlassLayer && GlassLayer.stats() };
  }, SEC);
  const m = await p._send('Performance.getMetrics').catch(() => null);
  const g = (k) => m && m.metrics ? +((m.metrics.find(x => x.name === k) || {}).value || 0).toFixed(2) : null;
  out.push(Object.assign({ mode }, r, m ? { recalcStyleS: g('RecalcStyleDuration'), layoutS: g('LayoutDuration'), scriptS: g('ScriptDuration'), recalcCount: g('RecalcStyleCount'), layoutCount: g('LayoutCount') } : {}));
  await p.close();
}
console.log(JSON.stringify(out, null, 1));
await b.close();

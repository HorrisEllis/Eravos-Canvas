#!/usr/bin/env node
/* P37.3 shell test (real page, real pointer clicks): every on-screen key of every tool makes sound, lights ITSELF, and is
 * not covered by anything (the bug: tall windows put their keyboard under the docked Song Recorder).
 *   node tests/p26-keys.mjs   → exit 1 on any failure */
import { chromium } from 'playwright'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = process.argv[2] || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); let failed = 0;
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } }); p.on('dialog', d => d.accept());
await p.goto('file://' + ROOT + '/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X);
await p.evaluate(async () => { Shell.activate(); const m = Shell.X.modes()[0]; if (m) Shell.X.enterMode(m.id); document.querySelectorAll('.overlay').forEach(o => o.remove()); const ac = Kernel.audio.ctx; if (ac.state !== 'running') await ac.resume(); window.__an = ac.createAnalyser(); window.__an.fftSize = 2048; (Kernel.audio.output || Kernel.audio.chain.out).connect(window.__an); });
const ids = await p.evaluate(() => OrganismFactory.defined().map(d => d.id));
for (const id of ids) {
  const r = await p.evaluate(async (id) => {
    OrganismFactory.clearAll && OrganismFactory.clearAll(Kernel); document.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); });
    CanvasWM.view = { x: 0, y: 0, z: 1 }; CanvasWM.applyView && CanvasWM.applyView();
    const inst = OrganismFactory.spawn(id, { x: 20, y: 20 }); if (!inst) return null;
    await new Promise(r => setTimeout(r, 900));
    const win = document.querySelector(`.wm-win[data-instance="${inst}"]`); if (!win) return null;
    const keys = [...win.querySelectorAll('.uk-key')].filter(k => k.offsetWidth > 4);
    return { n: keys.length, rects: keys.map(k => { const r = k.getBoundingClientRect(), blk = k.classList.contains('b'); return { x: r.x + r.width / 2, y: r.y + r.height * (blk ? 0.4 : 0.85), n: k.dataset.n, b: blk }; }) };
  }, id);
  if (!r || !r.n) continue;
  let silent = [], lit = [], other = [], covered = [];
  for (const k of r.rects) {
    const top = await p.evaluate(({ x, y, n }) => { const t = document.elementFromPoint(x, y); const key = t && t.closest('.uk-key'); return key ? key.dataset.n : 'cover:' + (t ? t.className : 'none'); }, k);
    if (String(top) !== String(k.n)) { covered.push(k.n + '→' + top); continue; }
    await p.mouse.move(k.x, k.y); await p.mouse.down(); await p.waitForTimeout(140);
    const st = await p.evaluate((n) => { const d = new Float32Array(2048); window.__an.getFloatTimeDomainData(d); let pk = 0; for (const v of d) pk = Math.max(pk, Math.abs(v)); const downs = [...document.querySelectorAll('.uk-key.down')].map(x => x.dataset.n); return { pk, downs }; }, k.n);
    await p.mouse.up(); await p.waitForTimeout(260);
    if (st.pk < 1e-4) silent.push(k.n + (k.b ? 'b' : ''));
    if (!st.downs.includes(String(k.n))) other.push(k.n + (k.b ? 'b' : '') + '→' + (st.downs.join('/') || 'none'));
  }
  failed += silent.length + other.length + covered.length;
  console.log(`${id}: ${r.n} keys · silent ${silent.length}${silent.length ? ' [' + silent.slice(0, 6) + ']' : ''} · lights-another ${other.length}${other.length ? ' [' + other.slice(0, 5) + ']' : ''} · covered ${covered.length}${covered.length ? ' [' + covered.slice(0, 4) + ']' : ''}`);
}
await b.close();
console.log(failed ? `✗ ${failed} key problem(s)` : '✓ every key clickable, audible and lit'); process.exit(failed ? 1 : 0);

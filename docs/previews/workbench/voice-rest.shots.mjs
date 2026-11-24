// node docs/previews/workbench/voice-rest.shots.mjs — 3.217: Wobble Bass and Retro DCO blown up; Retro DCO's DCO (the voice) Ctrl+clicked;
// right-click › "◆ … the rest from Wobble Bass" → ERAVOS makes the tool → voice-rest-menu.png, voice-rest-made.png, voice-rest.wav (what it made)
import { chromium } from '../../../host/driver/glass.js'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../../..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; window.ERAVOS_NO_MOTION = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X && window.FieldBoard && window.AssembledTool);
await p.evaluate(async () => {
  Shell.activate(); Shell.X.enterMode('music'); CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); const d = document.getElementById('dock'); if (d) d.style.display = 'none';
  window.__a = OrganismFactory.spawn('eravos.wobble-bass', { x: 20, y: 20 }); window.__b = OrganismFactory.spawn('eravos.retro-dco', { x: 2600, y: 20 }); await new Promise(r => setTimeout(r, 800));
  FieldBoard.explode(window.__a, 'eravos.wobble-bass'); FieldBoard.explode(window.__b, 'eravos.retro-dco'); await new Promise(r => setTimeout(r, 500));
  const dco = FieldBoard.gates(window.__b).find(x => /^dco/i.test(x.lab.textContent.trim())); const r = dco.g.getBoundingClientRect();
  CanvasWM.view = { x: CanvasWM.view.x + (520 - r.left), y: CanvasWM.view.y + (300 - r.top), z: CanvasWM.view.z }; CanvasWM.applyView(); await new Promise(r2 => setTimeout(r2, 150));
  const q = dco.g.getBoundingClientRect(); dco.g.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, ctrlKey: true, clientX: q.left + 10, clientY: q.top + 10 }));
  dco.g.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: q.left + 40, clientY: q.top + 30 }));
});
await p.waitForTimeout(300); await p.screenshot({ path: HERE + '/voice-rest-menu.png', clip: { x: 300, y: 120, width: 1100, height: 620 } });
const out = await p.evaluate(async () => {
  const it = [...document.querySelectorAll('.cm .cm-item')].find(e => /the rest from Wobble Bass/.test(e.textContent)); if (!it) return { why: 'no item' };
  it.click(); for (let i = 0; i < 60 && !document.querySelector('.fb-board .fb-core') ; i++) await new Promise(r => setTimeout(r, 100));
  await new Promise(r => setTimeout(r, 2500));
  const m = MadeTools.list(AssembledTool.MADE_KEY)[0]; if (!m) return { why: 'not made' };
  const bd = [...document.querySelectorAll('.fb-board')].pop(); if (bd) { const z = Math.min(1600 / (bd.offsetWidth + 80), 1000 / (bd.offsetHeight + 80)); CanvasWM.view = { x: 40 - bd.offsetLeft * z, y: 40 - bd.offsetTop * z, z }; CanvasWM.applyView(); }
  const s = AssembledTool.render(m.settings, m.bpm || 120);
  return { name: m.name, chain: m.chain, verdict: m.verdict, near: m.near, sr: s.sr, L: Array.from(s.L), R: Array.from(s.R), id: m.id };
});
await p.waitForTimeout(600); await p.screenshot({ path: HERE + '/voice-rest-made.png' });
if (out.L) {
  const n = out.L.length, buf = Buffer.alloc(44 + n * 4), w = (o, s) => buf.write(s, o);
  w(0, 'RIFF'); buf.writeUInt32LE(36 + n * 4, 4); w(8, 'WAVE'); w(12, 'fmt '); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(out.sr, 24); buf.writeUInt32LE(out.sr * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); w(36, 'data'); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) { buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, out.L[i])) * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, out.R[i])) * 32767), 46 + i * 4); }
  fs.writeFileSync(HERE + '/voice-rest.wav', buf);
  await p.evaluate((id) => { MadeTools.save(AssembledTool.MADE_KEY, MadeTools.list(AssembledTool.MADE_KEY).filter(x => x.id !== id)); }, out.id);
}
console.log(out.why || (out.name + ' · ' + out.chain + ' · ' + out.verdict + (out.near ? ' (nearest ' + out.near + ')' : '')), errs.length ? 'errors: ' + errs.join(' | ') : 'no page errors');
await b.close();

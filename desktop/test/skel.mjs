import { _electron as electron } from 'playwright';
import fs from 'fs';
const LIB = process.env.LIB, R = {};
const app = await electron.launch({ executablePath: process.env.ELECTRON, args: ['--no-sandbox', process.env.APP], env: Object.assign({}, process.env, { ERAVOS_LIBRARY: LIB }) });
const p = await app.firstWindow(); const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.waitForFunction(() => document.querySelector('.overlay .boot'), null, { timeout: 30000 });
R.loaded = await p.evaluate(() => window.ERAVOS_PACKS_LOADED);
R.state = await p.evaluate(() => ({ domains: Kernel.domains.list().map(d => d.id), organisms: OrganismFactory.defined().length, packs: [...ShellIntake.installed.keys()].length,
  faults: Kernel.faults.list().map(f => f.code + ' ' + (f.message || '')).slice(0, 5), bootCards: Array.from(document.querySelectorAll('.overlay .hero-card h2, .overlay .card b')).map(e => e.textContent),
  toolbar: Array.from(document.querySelectorAll('#slot-bar > *, #slot-bar button')).length, bpm: !!document.querySelector('input[title*="BPM" i], .bpm, #bpm') }));
if (process.env.PLAY) {
  await p.getByText('Future Bass song').click(); await p.waitForTimeout(2500);
  R.recipe = await p.evaluate(async () => {
    const ac = Kernel.audio.ctx, an = ac.createAnalyser(); an.fftSize = 2048; Kernel.audio.chain.out.connect(an);
    Kernel.bus.publish('ui:transport_play', {}); document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true }));
    await new Promise(r => setTimeout(r, 6000)); const b = new Float32Array(2048); let pk = 0;
    for (let k = 0; k < 20; k++) { an.getFloatTimeDomainData(b); for (const v of b) pk = Math.max(pk, Math.abs(v)); await new Promise(r => setTimeout(r, 50)); }
    return { windows: document.querySelectorAll('.wm-win').length, wires: Kernel.wires.list().length, peak: pk, ctx: ac.state, faults: Kernel.faults.list().map(f => f.code + ' ' + (f.message || '')).slice(0, 6) };
  });
  await p.screenshot({ path: 'skel.png' });
}
R.errs = errs; await app.close(); console.log(JSON.stringify(R, null, 1));

#!/usr/bin/env node
/* 3.62 — measure what SLEEP saves (node build/perf-idle.mjs [song seconds]). Two numbers, both offline (cost = render time ÷ audio
 * time on one core, the empty universe subtracted), the same method as build/perf.mjs:
 *   1. every instrument while it plays NOTHING: awake, and with its audio out unplugged (what sleep does)
 *   2. a whole Song Engine song (Heavy Drops "For Her, Heavy", seed 5908): every tool awake, and with sleep checked every ¼ s
 * Prints the table; the numbers that ship are written by hand into specs/eravos.performance.spec as a dated addendum. */
import { chromium } from '../host/driver/glass.js';   // Clear Glass's driver, not Playwright (his call, 2026-10-21)
import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), SONG_SEC = +(process.argv[2] || 40);
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const p = await b.newPage();
await p.goto('file://' + path.join(ROOT, 'tests', 'run.html') + '?auto=0'); await p.waitForFunction(() => window.TH);
const R = await p.evaluate(async (SONG_SEC) => {
  const SEC = 8, plays = (d) => (d.hooks || []).some(h => h.event_type === 'note:trigger' && h.direction === 'in');
  const skip = /song-recorder|coach|midi-mapper|session|timeline|sequencer|macro-automation|clip-maker|analy|recorder|voice|mic|arp|chords|groove|bassline/;
  async function idle(id, unplug) {
    const U = TH.universe(SEC); if (id) { const inst = TH.spawn(U, id), c = OrganismFactory.handle(inst).ctx; if (c.ready) await c.ready;
      if (unplug) U.K.ports.list(inst).forEach(q => { if (q.kind === 'audio' && q.direction === 'out' && q.src && q.head) try { q.src.disconnect(q.head); } catch (e) {} }); }
    const t0 = performance.now(); await TH.render(U); return (performance.now() - t0) / (SEC * 1000);
  }
  const base = await idle(null), rows = [];
  for (const d of OrganismFactory.defined()) { if (!plays(d) || skip.test(d.id)) continue; try { rows.push({ id: d.id, awake: (await idle(d.id)) - base, unplugged: (await idle(d.id, true)) - base }); } catch (e) {} }
  async function song(sleep) {
    const U = TH.universe(SONG_SEC, { bpm: 128 }), rec = Recipes.get('eravos.recipe.engine.hd-heavy-drops'); rec._pinned = 5908; await Recipes.run(rec.id, { K: U.K, headless: true });
    const ctxs = U.K.registry.list().map(x => OrganismFactory.handle(x.instance_id)).filter(Boolean).map(h => h.ctx);
    if (sleep) for (let t = 0.25; t < SONG_SEC; t += 0.25) U.ctx.suspend(t).then(() => { ctxs.forEach(c => c.sleepCheck && c.sleepCheck()); U.ctx.resume(); });
    U.T.seek(1); U.T.play(); const t0 = performance.now(); await TH.render(U);
    return { cost: (performance.now() - t0) / (SONG_SEC * 1000), asleep: ctxs.filter(c => c.asleep).map(c => c.id) };
  }
  return { base, rows: rows.sort((a, c) => c.awake - a.awake), songOff: await song(false), songOn: await song(true) };
}, SONG_SEC);
await b.close();
const pct = (x) => (x * 100).toFixed(1).padStart(5) + ' %';
console.log('empty universe ' + pct(R.base) + '\n\nsilent instrument        awake    unplugged');
let a = 0, u = 0; R.rows.forEach(r => { a += Math.max(0, r.awake); u += Math.max(0, r.unplugged); if (r.awake > 0.005) console.log(r.id.replace('eravos.', '').padEnd(22), pct(r.awake), '  ', pct(r.unplugged)); });
console.log('all ' + R.rows.length + ' instruments'.padEnd(10), pct(a), '  ', pct(u));
console.log(`\nHeavy Drops “For Her, Heavy”, first ${SONG_SEC} s: awake ${pct(R.songOff.cost)} · with sleep ${pct(R.songOn.cost)} (asleep at the end: ${R.songOn.asleep.join(', ') || 'none'})`);

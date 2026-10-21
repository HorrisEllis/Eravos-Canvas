#!/usr/bin/env node
/* Gate P — measure, don't guess (node tools/perf.mjs). Writes specs/eravos.performance.spec.
 * For every tool: render 4 s offline while it plays (instruments: 8 chords of 4 notes; effects: a 220 Hz saw through
 * them), time the render, report cost = render-time / audio-time (1.00 = one full CPU core in real time).
 * Then the 20-tool scene from tests/p17 and a Song Engine song. Offline rendering is a proxy for the audio thread:
 * it runs the same graph on one core, without the real-time deadline — the numbers rank tools and catch regressions. */
import { chromium } from '../host/driver/glass.js';   // Clear Glass's driver, not Playwright (his call, 2026-10-21)
import fs from 'fs'; import path from 'path'; import os from 'os'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage();
await p.goto('file://' + path.join(ROOT, 'tests', 'run.html') + '?auto=0'); await p.waitForFunction(() => window.TH);
const R = await p.evaluate(async () => {
  const SEC = 4, rows = [];
  const isFx = (d) => (d.hooks || []).some(h => h.wire_type === 'audio' && h.direction === 'in') && !(d.hooks || []).some(h => h.event_type === 'note:trigger' && h.direction === 'in');
  const plays = (d) => (d.hooks || []).some(h => h.event_type === 'note:trigger' && h.direction === 'in');
  const skip = new Set(['eravos.song-recorder', 'eravos.coach', 'eravos.midi-mapper', 'eravos.session', 'eravos.timeline', 'eravos.sequencer', 'eravos.macro-automation', 'eravos.clip-maker', 'eravos.contrast-analyser', 'eravos.harmonic-analyzer', 'eravos.xy-pad', 'eravos.breath']);
  async function cost(build) {
    const U = TH.universe(SEC, { bpm: 128 }); await build(U); const t0 = performance.now(); await TH.render(U); return (performance.now() - t0) / (SEC * 1000);
  }
  // baseline: an empty universe (kernel master chain only)
  const base = await cost(async () => {});
  for (const d of OrganismFactory.defined()) {
    if (skip.has(d.id)) continue;
    let kind = isFx(d) ? 'effect' : plays(d) ? 'instrument' : 'other';
    if (kind === 'other') continue;
    const c = await cost(async (U) => {
      const inst = TH.spawn(U, d.id); const ctx = OrganismFactory.handle(inst).ctx; if (ctx.ready) await ctx.ready;
      if (kind === 'effect') { const o = U.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 220; const g = U.ctx.createGain(); g.gain.value = 0.3; o.connect(g); const port = U.K.audio.port(inst, 'in'); if (port) g.connect(port.node); o.start(0); }
      else for (let k = 0; k < 8; k++) [0, 4, 7, 11].forEach(i => TH.note(U, inst, 48 + i + (k % 3) * 2, 0.1 + k * 0.45, { duration: 0.4 }));
    });
    rows.push({ id: d.id, label: d.label, kind, cost: c - base });
  }
  // the 20-tool scene (same as tests/p17)
  const ids = ['eravos.supersaw', 'eravos.reese-bass', 'eravos.wobble-bass', 'eravos.retro-poly', 'eravos.pad-forge', 'eravos.organ', 'eravos.sub-engine', 'eravos.acid-synth', 'eravos.pads', 'eravos.coven',
    'eravos.fx-echo', 'eravos.fx-filter', 'eravos.fx-moddelay', 'eravos.fx-phaser', 'eravos.fx-destroyer', 'eravos.fx-eq', 'eravos.fx-dynamics', 'eravos.master-fx', 'eravos.channel', 'eravos.sidechain-compressor'];
  const scene = await cost(async (U) => { const insts = ids.map(id => TH.spawn(U, id)); for (const i of insts) { const c = OrganismFactory.handle(i).ctx; if (c.ready) await c.ready; } insts.slice(0, 10).forEach((a, k) => { for (let s = 0; s < 8; s++) TH.note(U, a, 48 + ((k * 3 + s * 5) % 24), 0.1 + s * 0.45, { duration: 0.4 }); }); });
  // a Song Engine song, mid-drop
  const song = await cost(async (U) => { Recipes.get('eravos.recipe.engine.dubstep')._pinned = 77; await Recipes.run('eravos.recipe.engine.dubstep', { K: U.K, headless: true }); U.T.seek(33); U.T.play(); });
  return { base, rows: rows.sort((a, b) => b.cost - a.cost), scene, song, ua: navigator.userAgent, cores: navigator.hardwareConcurrency };
});
await b.close();
const pct = (x) => (x * 100).toFixed(1).padStart(5) + ' %';
const lines = [
  '# ============================================================',
  '# ERAVOS PERFORMANCE — measured (gate P · P11.5)',
  '# spec_id:      eravos.performance',
  `# measured_at:  ${new Date().toISOString()}  ·  regenerate: node tools/perf.mjs`,
  `# machine:      ${os.cpus()[0] ? os.cpus()[0].model : 'unknown CPU'} · ${R.cores} logical cores · Chromium headless`,
  '# method:       4 s offline render per case; cost = render time ÷ audio time on ONE core (100 % = a full core in real',
  '#               time). Offline is a proxy for the audio thread: same graph, no deadline. Empty-universe baseline subtracted.',
  '# ============================================================',
  '',
  'ceilings (enforced in code):',
  '  notes per tool:      32 sounding at once (sdk-music onNote) — extra notes skipped and counted, never silent (RUNTIME_005, logged)',
  '  polyphonic voices:   each synth steals its own oldest voice (supersaw 8, retro-poly 6, organ 6, pad-forge 8, coven 8, xen 8, sampler 8)',
  '  redraws:             windows off-screen, folded or hidden draw nothing; reduced-motion caps displays at 8 fps',
  '',
  `scene_20_tools:   ${pct(R.scene)}   (10 instruments playing chords + 10 effects/mixers)  ${R.scene < 1 ? 'faster than real time' : 'SLOWER than real time on this machine'}`,
  `song_engine_drop: ${pct(R.song)}   (Dubstep #77 from bar 33 — the full song graph)`,
  `baseline_empty:   ${pct(R.base)}`,
  '',
  'per_tool (heaviest first):',
  ...R.rows.map(r => `  ${r.label.padEnd(20)} ${r.kind.padEnd(10)} ${pct(r.cost)}`),
  '',
  'budget:',
  '  per tool:  ≤ 10 % of a core while playing (tests/p17 guards the 20-tool scene; this file records the rest)',
  `  over budget here: ${R.rows.filter(r => r.cost > 0.10).map(r => r.label + ' ' + pct(r.cost).trim()).join(', ') || 'none'}`,
  '',
];
fs.writeFileSync(path.join(ROOT, 'specs', 'eravos.performance.spec'), lines.join('\n'));
console.log(lines.join('\n'));

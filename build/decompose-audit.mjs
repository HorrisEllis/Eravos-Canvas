#!/usr/bin/env node
/* P48.9 decomposition audit — node build/decompose-audit.mjs → specs/eravos.decomposition.spec (generated; deterministic, no model).
 * James, 2026-10-21: "anything form a tool that other tools can use need to be decomposed, and grouped by the tool suite".
 * Reads every music tool's real definition from the running canvas (Clear Glass's driver). For each tool it lists:
 *   its control groups — each a candidate part;
 *   the standalone tools that already do that job (by the JOBS table below — a stated rule, not a guess);
 *   the suites that already hold the tool;
 *   GAP: a group no standalone tool does yet, i.e. a part to build (reuse before build: only gaps become new tools).
 * The coder reads it to phase the next suites. Rerun after adding tools or suites. */
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { chromium } from '../host/driver/glass.js';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// a group's job, read from its name → the standalone tools that do that job. Order matters: first match wins.
const JOBS = [
  [/LFO|WOBBLE|MOTION|RATE|PATTERN/i, 'motion', ['eravos.lfo', 'eravos.wub-rate', 'eravos.xy-pad', 'eravos.macro-automation']],
  [/ENV|SHAPE|AMP\b|ADSR/i, 'envelope', ['eravos.syn-env']],
  [/FILTER|MOUTH|VOWEL|FORMANT|TONE|EQ/i, 'filter / tone', ['eravos.fx-filter', 'eravos.wub-filter', 'eravos.fx-eq']],
  [/GRIT|DRIVE|DIST|SATUR|FOLD|CRUSH|DESTROY/i, 'distortion', ['eravos.fx-destroyer']],
  [/DELAY|ECHO/i, 'delay', ['eravos.fx-echo', 'eravos.fx-moddelay']],
  [/REVERB|SPACE|ROOM|HAUNT/i, 'space', ['eravos.fx-haunt']],
  [/PHASER|CHORUS|FLANGE|ROTARY|MOD FX/i, 'modulation fx', ['eravos.fx-phaser', 'eravos.fx-moddelay']],
  [/COMP|DYNAM|DUCK|SIDECHAIN|PUMP|GATE/i, 'dynamics', ['eravos.fx-dynamics', 'eravos.sidechain-compressor']],
  [/PITCH|GLIDE|BEND|DIVE/i, 'pitch', ['eravos.fx-pitch']],
  [/SUB\b|LOW END/i, 'sub', ['eravos.wub-sub', 'eravos.sub-engine']],
  [/FM\b|OSC|WAVE|VOICE|UNISON|TIMBRE|MORPH|PARTIAL|DRAWBAR/i, 'oscillator', ['eravos.wub-osc', 'eravos.syn-osc', 'eravos.syn-partials', 'eravos.supersaw']],
  [/GRAIN|GRANUL/i, 'granular', ['eravos.granular']],
  [/DRUM|KIT|KICK|SNARE|HAT|PAD\b/i, 'drum voices', ['eravos.pads', 'eravos.drum-forge']],
  [/RHYTHM|GROOVE|SEQ|STEP|EUCLID/i, 'rhythm generator', ['eravos.sequencer', 'eravos.groove-gen']],
  [/HARMONY|CHORD|PROGRESS/i, 'chord generator', ['eravos.chord-gen']],
  [/BASSLINE|BASS\b/i, 'bassline', ['eravos.bass-gen']],
  [/ARP/i, 'arpeggiator', []],
  [/MACRO|PERFORM/i, 'macros', ['eravos.macro-automation']],
  [/OUT\b|LEVEL|MIX\b|LEVELS|PAN|STEREO|WIDTH/i, 'output (stays in the tool)', null],
];
const job = (g) => { for (const [re, name, tools] of JOBS) if (re.test(g)) return { name, tools }; return { name: 'its own (no shared job)', tools: null }; };

const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot');
await p.waitForFunction(() => window.OrganismFactory && window.Suites && OrganismFactory.defined().length > 40, null, { timeout: 30000 });
const data = await p.evaluate(() => ({
  tools: OrganismFactory.defined().filter(d => d.domain === 'music').map(d => {
    const groups = {}; (d.config || []).filter(c => !c.hidden && !c.settingsOnly).forEach(c => { const g = (c.group || 'MAIN').toUpperCase(); (groups[g] = groups[g] || []).push(c.key); });
    return { id: d.id, label: d.label, category: d.category || '', groups, outs: (d.hooks || []).filter(h => h.direction === 'out' && h.wire_type === 'audio').length, slots: (d.slots || []).map(s => s.id) };
  }),
  suites: Suites.list().map(s => ({ id: s.id, label: s.label, parts: s.parts.map(x => x.tool) })),
}));
await b.close();
if (errs.length) console.warn('page errors while reading:', errs.slice(0, 3));

const installed = new Set(data.tools.map(t => t.id)), inSuite = (id) => data.suites.filter(s => s.parts.includes(id)).map(s => s.label);
const lines = [], gaps = [];
for (const t of data.tools.sort((a, b) => (a.category + a.label).localeCompare(b.category + b.label))) {
  const gs = Object.entries(t.groups); if (!gs.length) continue;
  const rows = gs.map(([g, keys]) => {
    const j = job(g); if (j.tools === null) return `      ${g.padEnd(12)} ${keys.length} knob(s) · ${j.name}`;
    if (j.tools.includes(t.id)) return `      ${g.padEnd(12)} ${keys.length} knob(s) · ${j.name} — this tool is that part`;
    const have = j.tools.filter(x => installed.has(x));
    if (!have.length) gaps.push(`${t.label}: ${g} (${j.name})`);
    return `      ${g.padEnd(12)} ${keys.length} knob(s) · ${j.name} → ${have.length ? have.join(', ') : 'GAP — no standalone tool yet'}`;
  });
  const su = inSuite(t.id);
  lines.push(`  ${t.label} (${t.id}) · ${t.category}${su.length ? ' · in suite: ' + su.join(', ') : ''}`, ...rows);
}
const out = `# spec_id: eravos.decomposition · GENERATED by build/decompose-audit.mjs on ${new Date().toISOString().slice(0, 10)} — do not edit; rerun it
# map: eravos.phase48-map P48.9 · James, 2026-10-21: "anything form a tool that other tools can use need to be decomposed, and grouped
#  by the tool suite"
# Each tool's control groups are candidate parts. "→" names the standalone tools that already do that job (reuse them). GAP = no
# standalone tool does it yet (a part to build). The job of a group is read from its name by the JOBS table in the script — a rule,
# so a group named oddly can be misread: the table is the place to fix it.

## Suites now
${data.suites.map(s => `  ${s.label} (${s.id}): ${s.parts.join(' · ')}`).join('\n')}

## Gaps (${gaps.length})
${gaps.map(g => '  ' + g).join('\n') || '  none'}

## Every music tool (${data.tools.length})
${lines.join('\n')}
`;
fs.writeFileSync(path.join(ROOT, 'specs', 'eravos.decomposition.spec'), out);
console.log(`${data.tools.length} tools · ${data.suites.length} suites · ${gaps.length} gaps → specs/eravos.decomposition.spec`);

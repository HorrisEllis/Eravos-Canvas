#!/usr/bin/env node
/* Gain staging (3.41) — every preset whose OWN output passes full scale is turned down to peak at −1.5 dBFS.
 *   node tests/tool-audio.mjs --json survey.json      (measure: one note / a triad for chord tools, at velocity 0.9)
 *   node build/gain-stage.mjs survey.json [--dry]     (fix: lowers the preset's output knob in the pack.json that holds it)
 * Only ever DOWN, never up; only presets measured over 0 dBFS; −1.5 leaves 0.5 dB for velocity 1.0 over the measured 0.9.
 * Why: a tool that peaks over full scale drives the master's limiter and soft-clipper — 114 of 189 song previews touched
 * 0 dBFS. Each change is printed (tool · preset · knob old → new · peak before) and logged to specs/eravos.p42-tool-audio.spec. */
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const [SURVEY] = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1] === '--defaults')), DRY = args.includes('--dry'), TARGET = -1.5;
// each tool's real default for a knob a preset does not set: from the survey (tests/tool-audio.mjs writes t.defaults) or --defaults <dump.json>
const DUMP = opt('--defaults') ? Object.fromEntries(JSON.parse(fs.readFileSync(opt('--defaults'), 'utf8')).map(t => [t.id, Object.fromEntries(t.config.map(c => [c.key, c.default]))])) : {};
if (!SURVEY) { console.log('usage: node build/gain-stage.mjs survey.json [--dry]'); process.exit(1); }
// the knob that sets each tool's output: [key, 'lin' (multiply) | 'db' (add), min, max]   — several keys = all scaled together
const KNOB = {
  'eravos.organ': [['level', 'lin', 0, 1.5]], 'eravos.retro-poly': [['level', 'lin', 0, 1.5]], 'eravos.coven': [['level', 'lin', 0, 1.5]], 'eravos.dub-station': [['level', 'lin', 0, 1.5]],
  'eravos.acid-synth': [['level', 'lin', 0, 1.5]], 'eravos.curve-synth': [['level', 'lin', 0, 1.5]], 'eravos.pad-forge': [['level', 'lin', 0, 1.5]], 'eravos.reese-bass': [['level', 'lin', 0, 1.5]],
  'eravos.sub-engine': [['level', 'lin', 0, 1.5]], 'eravos.supersaw': [['level', 'lin', 0, 1]], 'eravos.wobble-bass': [['level', 'lin', 0, 1.5]], 'eravos.bass-forge': [['level', 'lin', 0, 1.5]],
  'eravos.xen-synth': [['level', 'lin', 0, 1.5]], 'eravos.ratio-lattice': [['level', 'lin', 0, 1.5]], 'eravos.recursive-spectra': [['level', 'lin', 0, 1.5]], 'eravos.embodiment-lab': [['level', 'lin', 0, 1]],
  'eravos.wub-osc': [['level', 'lin', 0, 1.5]], 'eravos.wub-sub': [['level', 'lin', 0, 1.5]], 'eravos.breath': [['level', 'lin', 0, 1.5]], 'eravos.sample-player': [['gain', 'lin', 0, 2]],
  'eravos.pads': [['volume', 'lin', 0, 1.5]], 'eravos.drum-forge': [['volume', 'lin', 0, 1.5]], 'eravos.fx-box': [['volume', 'lin', 0, 1.5]],
  'eravos.edm-lab': [['rhythmLevel', 'lin', 0, 1], ['bassLevel', 'lin', 0, 1], ['harmonyLevel', 'lin', 0, 1]],
  'eravos.bass-drop-builder': [['impactLevel', 'lin', 0, 1.5], ['crashLevel', 'lin', 0, 1.5]],
  'eravos.channel': [['trim', 'db', -24, 24]],
};
const FX_DB = [['outGain', 'db', -24, 24]];   // every STD.fx effect (fx-*, wub-filter) has outGain in dB
const knobOf = (id) => KNOB[id] || (/^eravos\.(fx-|wub-filter)/.test(id) ? FX_DB : null);

// every pack.json under tools/music → { file, json, prefix } for lookups by (tool, displayed preset name)
const packs = [];
(function walk(d) { for (const n of fs.readdirSync(d)) { const p = path.join(d, n); if (fs.statSync(p).isDirectory()) walk(p); else if (n === 'pack.json') packs.push({ file: p, json: JSON.parse(fs.readFileSync(p, 'utf8')) }); } })(path.join(ROOT, 'tools/music'));
function locate(tool, shown) {
  for (const pk of packs) { const it = pk.json.items && pk.json.items[tool]; if (!it || !it.presets) continue; const pre = pk.json.prefix !== undefined ? pk.json.prefix : pk.json.label;
    for (const k of Object.keys(it.presets)) if ((pre ? pre + ' · ' + k : k) === shown || k === shown) return { pk, key: k, preset: it.presets[k] }; }
  return null;
}
const survey = JSON.parse(fs.readFileSync(SURVEY, 'utf8')), changes = [], skipped = [];
// the tool's default when a preset does not set the knob: read from the survey's own tools-dump if present, else 1 / 0 dB
const DEFAULTS = { level: 1,   // last resort only
  volume: 1, gain: 1, rhythmLevel: 0.9, bassLevel: 0.8, harmonyLevel: 0.5, impactLevel: 1, crashLevel: 1, outGain: 0, trim: 0 };
for (const t of survey) for (const r of t.presets || []) {
  if (!(r.clip > 0) || r.peakDb === undefined || !r.preset) continue;
  const knobs = knobOf(t.id); if (!knobs) { skipped.push(`${t.id} · ${r.preset}: no output knob mapped`); continue; }
  const at = locate(t.id, r.preset); if (!at) { skipped.push(`${t.id} · ${r.preset}: not found in any pack.json`); continue; }
  const dB = TARGET - r.peakDb; if (dB >= 0) continue;
  const params = at.preset.params = at.preset.params || {}, done = [];
  for (const [key, kind, min, max] of knobs) {
    const def = (t.defaults && t.defaults[key] !== undefined) ? t.defaults[key] : (DUMP[t.id] && DUMP[t.id][key] !== undefined) ? DUMP[t.id][key] : DEFAULTS[key];
    const old = params[key] !== undefined ? params[key] : def;
    const nv = kind === 'lin' ? Math.max(min, Math.min(max, +(old * Math.pow(10, dB / 20)).toFixed(3))) : Math.max(min, Math.min(max, +(old + dB).toFixed(1)));
    params[key] = nv; done.push(`${key} ${old} → ${nv}`);
  }
  changes.push({ tool: t.id, preset: r.preset, peakDb: r.peakDb, dB: +dB.toFixed(1), done, file: path.relative(ROOT, at.pk.file) });
}
for (const c of changes) console.log(`${c.tool.replace('eravos.', '').padEnd(20)} ${c.preset.padEnd(40)} peak ${String(c.peakDb).padStart(5)} dBFS → ${c.dB} dB · ${c.done.join(', ')}`);
skipped.forEach(s => console.log('  skipped: ' + s));
if (!DRY) { const touched = new Set(changes.map(c => c.file)); for (const pk of packs) if (touched.has(path.relative(ROOT, pk.file))) fs.writeFileSync(pk.file, JSON.stringify(pk.json, null, 1) + '\n'); }
console.log(`${changes.length} presets turned down in ${new Set(changes.map(c => c.file)).size} pack files${DRY ? ' (dry run — nothing written)' : ''}`);

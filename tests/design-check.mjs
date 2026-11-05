#!/usr/bin/env node
/* node tests/design-check.mjs [--update] [--out docs/design-check.md] — every tool opened, measured against docs/DESIGN-GUIDE.md.
 * His words, 2026-11-05: "i want consistency across all of them. and a template or schema for a design guide or philospophy to maintain
 * consistency." The guide says the rules; this measures them, tool by tool, through Clear Glass's driver on the served build (the
 * stylesheets must be readable, as in the app). A rule with existing breaks has a baseline (tests/design-baseline.json): a tool may get
 * better, never worse, and a NEW tool must break nothing. --update writes the baseline after a deliberate change.
 *   D1 surfaces are neutral black (no dark background with a tint in it)
 *   D2 kit controls keep the kit's size (no inline height / width / padding / font on a kit button, toggle or segment)
 *   D3 labels never run into each other (a knob's label wider than its knob)
 *   D4 buttons come from the kit (a <button> with none of the kit's classes is a one-off)
 *   D5 one primary action per window at most
 *   D6 a tool's colours stay in its own family (a gradient's stops within 40° of hue of each other) */
import { chromium } from '../host/driver/glass.js';
import fs from 'fs'; import path from 'path'; import http from 'http'; import { fileURLToPath } from 'url'; import { spawn } from 'child_process';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d; };
const OUT = arg('--out', 'docs/design-check.md'), BASE = path.join(ROOT, 'tests', 'design-baseline.json'), UPDATE = process.argv.includes('--update');
const PORT = +arg('--port', 4791);
// the served build (stylesheets readable, as in the app): serve.js on its own port
const up = () => new Promise(r => http.get(`http://localhost:${PORT}/canvas/index.html`, (res) => { res.resume(); r(res.statusCode === 200); }).on('error', () => r(false)));
let server = null;
if (!(await up())) { server = spawn(process.execPath, [path.join(ROOT, 'serve.js'), '--port', String(PORT), '--no-open'], { stdio: 'ignore', env: Object.assign({}, process.env, { ERAVOS_NO_OPEN: '1', BROWSER: 'none' }) });
  for (let i = 0; i < 50 && !(await up()); i++) await new Promise(r => setTimeout(r, 200)); }
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
await p.goto(`http://localhost:${PORT}/canvas/index.html?noboot`);
await p.waitForFunction(() => window.OrganismFactory && window.Shell && OrganismFactory.defined().length > 50, null, { timeout: 90000 });
await p.waitForTimeout(1200);
const result = await p.evaluate(async () => {
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  const rgb = (c) => { const m = /rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?/.exec(c || ''); return m ? { v: [+m[1], +m[2], +m[3]], a: m[4] === undefined ? 1 : +m[4] } : null; };
  // D1 uses the guide's own definition of a surface (BlackSurfaces): dark and barely coloured — and a tint is any colour left in it
  const tinted = (c) => { const x = rgb(c); if (!x || x.a < 0.05) return false; const mx = Math.max(...x.v), mn = Math.min(...x.v); return mx <= BlackSurfaces.MAX && mx - mn >= 4 && mx - mn <= BlackSurfaces.CHROMA; };
  const hue = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return null; let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (h * 60 + 360) % 360; };
  const KIT = /\b(uk-|tb-btn|wm-|tp-|rcp-|sbk-|ap-|fl-btn|org-|preview|pv-)/;
  const out = {};
  for (const d of OrganismFactory.defined()) {
    let id; try { id = OrganismFactory.spawn(d.id, { x: 40, y: 40 }); } catch (e) { continue; }
    await new Promise(r => setTimeout(r, 40));
    const w = CanvasWM.windowOf(id); if (!w) { try { OrganismFactory.close(id); } catch (e) {} continue; }
    const v = { D1: [], D2: [], D3: [], D4: [], D5: [], D6: [] };
    const name = (el) => (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : el.tagName.toLowerCase()) + (el.textContent ? ' "' + el.textContent.trim().slice(0, 18) + '"' : '');
    w.querySelectorAll('*').forEach(el => {
      const cs = getComputedStyle(el);
      if (tinted(cs.backgroundColor) || (/gradient/.test(cs.backgroundImage) && (cs.backgroundImage.match(/rgba?\([^)]*\)/g) || []).some(tinted))) v.D1.push(name(el));
      if (el.matches('.uk-btn, .uk-toggle, .uk-seg, .uk-seg button') && ['height', 'minWidth', 'width', 'padding', 'fontSize', 'minHeight'].some(k => el.style[k])) v.D2.push(name(el));
      if (el.matches('.uk-knob-label') && el.getBoundingClientRect().width > el.parentElement.getBoundingClientRect().width + 1) v.D3.push(name(el));
      if (el.tagName === 'BUTTON' && !KIT.test(el.className || '') && !(el.parentElement && KIT.test(el.parentElement.className || '')) && el.offsetParent) v.D4.push(name(el));
      if (/gradient/.test(cs.backgroundImage) && !el.closest('[class*="meter"]')) { /* a meter's green/yellow/red is a signal, not a colour (DESIGN-GUIDE C4) */ const hs = (cs.backgroundImage.match(/rgba?\([^)]*\)/g) || []).map(c => rgb(c)).filter(x => x && x.a > 0.3 && Math.max(...x.v) > 90).map(x => hue(x.v)).filter(h => h !== null);
        if (hs.length > 1) { let far = 0; for (const a of hs) for (const b2 of hs) { const dd = Math.abs(a - b2) % 360; far = Math.max(far, dd > 180 ? 360 - dd : dd); } if (far > 40) v.D6.push(name(el) + ' ' + Math.round(far) + '°'); } }
    });
    const prim = w.querySelectorAll('.uk-btn.primary').length; if (prim > 1) v.D5.push(prim + ' primary buttons');
    out[d.id] = { label: d.label, v };
    try { OrganismFactory.close(id); } catch (e) {}
  }
  return out;
});
await b.close(); if (server) server.kill();
fs.mkdirSync(path.join(ROOT, 'tests', 'out'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'tests', 'out', 'design-check.json'), JSON.stringify(result, null, 1));   // every finding, for fixing (tests/out is not committed)
const RULES = { D1: 'surfaces neutral black', D2: 'kit controls keep the kit size', D3: 'labels never collide', D4: 'buttons from the kit', D5: 'one primary per window', D6: 'colours in the tool\'s family' };
const counts = {}; Object.entries(result).forEach(([id, r]) => { counts[id] = Object.fromEntries(Object.keys(RULES).map(k => [k, r.v[k].length])); });
const base = fs.existsSync(BASE) ? JSON.parse(fs.readFileSync(BASE, 'utf8')) : null;
const worse = [];
if (base && !UPDATE) Object.entries(counts).forEach(([id, c]) => Object.keys(RULES).forEach(k => { const was = base[id] ? (base[id][k] || 0) : 0; if (c[k] > was) worse.push(`${id} ${k} (${RULES[k]}): ${was} → ${c[k]} — ${result[id].v[k].slice(0, 4).join(', ')}`); }));
if (UPDATE || !base) fs.writeFileSync(BASE, JSON.stringify(counts, null, 1));
const tot = (k) => Object.values(counts).reduce((n, c) => n + c[k], 0), clean = Object.values(counts).filter(c => Object.values(c).every(x => !x)).length;
const md = ['# Design check', '', `Generated by \`node tests/design-check.mjs\` — every tool opened and measured against docs/DESIGN-GUIDE.md.`, '',
  `**${clean} of ${Object.keys(counts).length} tools pass every rule.**`, '', '| rule | breaks (all tools) |', '|---|---|', ...Object.entries(RULES).map(([k, t]) => `| ${k} ${t} | ${tot(k)} |`), '',
  '## Per tool (only tools with a break)', '', '| tool | ' + Object.keys(RULES).join(' | ') + ' | examples |', '|---|' + Object.keys(RULES).map(() => '---|').join('') + '---|',
  ...Object.entries(counts).filter(([, c]) => Object.values(c).some(x => x)).sort((a, b) => Object.values(b[1]).reduce((x, y) => x + y) - Object.values(a[1]).reduce((x, y) => x + y)).map(([id, c]) =>
    `| ${result[id].label} | ${Object.keys(RULES).map(k => c[k] || '').join(' | ')} | ${Object.keys(RULES).flatMap(k => result[id].v[k].slice(0, 1).map(x => k + ' ' + x)).slice(0, 3).join('; ').replace(/\|/g, '/')} |`), ''].join('\n');
fs.writeFileSync(path.join(ROOT, OUT), md);
console.log(`${clean}/${Object.keys(counts).length} tools pass every rule · ` + Object.keys(RULES).map(k => `${k} ${tot(k)}`).join(' · ') + ` → ${OUT}`);
if (worse.length) { console.log('✗ worse than the baseline:\n  ' + worse.join('\n  ')); process.exit(1); }
console.log(base && !UPDATE ? '✓ no tool got worse than tests/design-baseline.json' : 'baseline written: tests/design-baseline.json');

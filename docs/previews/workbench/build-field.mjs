#!/usr/bin/env node
// node docs/previews/workbench/build-field.mjs → docs/previews/workbench/Wobble-Field.html (+ --inline <file>: one self-contained file)
// The Field board "Wobble Bass broken apart" (Wobble-Broken.dc.html, 2026-11-15) EXACTLY: its markup, styles and positions are copied, not
// redrawn; only each /_blob/<id> is pointed at its PNG here (matched by its exact size — every piece's size is unique). Added, invisible on
// the board: the way in — Wobble Bass whole (the pieces at their places in its own face, from Wobble-Exploded.dc.html), then blown apart
// into the board. Click the background to put it back together / apart again. The final frame is the board, unchanged.
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(HERE, 'Wobble-Broken.dc.html'), 'utf8');
const ex = JSON.parse(fs.readFileSync(path.join(HERE, 'Wobble-Exploded.dc.html'), 'utf8').match(/const PIECES = (\[.*?\]);\n/s)[1]);
const cli = import.meta.url === `file://${process.argv[1]}`;
export function boardBody(asInline) {
const inline = !!asInline;

// the PNGs by size
const size = (f) => { const b = fs.readFileSync(path.join(HERE, f)); return b.readUInt32BE(16) + 'x' + b.readUInt32BE(20); };
const bySize = {}; fs.readdirSync(HERE).filter(f => f.endsWith('.png') && !f.startsWith('blank')).forEach(f => { bySize[size(f)] = f; });
const url = (f) => inline ? 'data:image/png;base64,' + fs.readFileSync(path.join(HERE, f)).toString('base64') : f;
// where each piece sits in Wobble Bass's own face (the Exploded board's home x/y, its surface at 300,120) → this board's frame, the face centred
const SX = 350, SY = 30 + Math.round((1320 - 30 - 824) / 2);
const home = {}; ex.forEach(p => { const f = p.id === 'filter-formant' ? 'filter-vowels.png' : p.id + '.png'; home[f] = { x: p.hx - 300 + SX, y: p.hy - 120 + SY, delay: p.delay }; });

let body = src.slice(src.indexOf('<div style="width: 1800px'), src.lastIndexOf('</x-dc>'));
let n = 0;
body = body.replace(/<img([^>]*?)src="\/_blob\/[0-9a-f]+"([^>]*?)style="([^"]*)"([^>]*)>/g, (m, a, b, style, c) => {
  const w = +style.match(/width: (\d+)px/)[1], h = +style.match(/height: (\d+)px/)[1], f = bySize[w + 'x' + h];
  if (!f) throw new Error('no PNG of ' + w + 'x' + h);
  const H = home[f]; if (!H) throw new Error('no home for ' + f); n++;
  const x = +style.match(/left: (\d+)px/)[1], y = +style.match(/top: (\d+)px/)[1];
  return `<img${a}src="${url(f)}"${b}style="${style}" class="pc" data-png="${f}" data-x="${x}" data-y="${y}" data-hx="${H.x}" data-hy="${H.y}" data-delay="${H.delay}"${c}>`;
});
if (n !== 22) throw new Error('expected 22 pieces, found ' + n);
// everything that only belongs to the board apart (wires, gate frames, labels, the core, the legend) fades in after the pieces land
body = body.replace(/<svg width="1800"/, '<svg class="apart" width="1800"')
  .replace(/<span style="position: absolute;/g, '<span class="apart" style="position: absolute;')
  .replace(/<div style="position: absolute; left: 740px; top: 560px;/, '<div class="apart" style="position: absolute; left: 740px; top: 560px;')
  .replace(/<div style="position: absolute; right: 30px; top: 1130px;/, '<div class="apart" style="position: absolute; right: 30px; top: 1130px;');
// the whole tool's blank surface, under the pieces, at the face's place
body = body.replace(/(<svg class="apart")/, `<img id="surface" src="${url('blank-surface2.png')}" alt="Wobble Bass, every element lifted off: the blank surface" style="position: absolute; left: ${SX}px; top: ${SY}px; width: 1100px; height: 824px; display: block">$1`);

return body;
}
const wantInline = cli && process.argv.includes('--inline'), out = wantInline ? process.argv[process.argv.indexOf('--inline') + 1] : path.join(HERE, 'Wobble-Field.html');
const body = boardBody(wantInline);
const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Field · Wobble Bass broken apart</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&amp;family=DM+Mono:wght@400;500&amp;display=swap">
<style>
body{margin:0;background:#04070C}
#fit{overflow:hidden}
#fit > div{transform-origin:0 0}
.pc{transition:left 2.8s cubic-bezier(.22,.8,.25,1),top 2.8s cubic-bezier(.22,.8,.25,1),border-color 1.2s ease}
.apart{transition:opacity 1.4s ease}
#surface{transition:opacity 1.4s ease}
.whole .pc{border-color:transparent!important}
.whole .apart{opacity:0;transition-delay:0s!important}
.still,.still *{transition:none!important}
</style>
</head>
<body>
<div id="fit">
${body}
</div>
<script>
(function () {
  var B = document.querySelector('#fit > div'), P = [].slice.call(B.querySelectorAll('.pc')), S = document.getElementById('surface'), apart = false;
  function set(on, still) {
    apart = on; if (still) B.classList.add('still'); B.classList.toggle('whole', !on);
    P.forEach(function (p) { p.style.left = (on ? p.dataset.x : p.dataset.hx) + 'px'; p.style.top = (on ? p.dataset.y : p.dataset.hy) + 'px'; p.style.transitionDelay = on ? p.dataset.delay + 's' : '0s'; });
    [].forEach.call(B.querySelectorAll('.apart'), function (e) { e.style.opacity = on ? 1 : 0; e.style.transitionDelay = on ? '2.2s' : '0s'; });
    S.style.opacity = on ? 0 : 1; S.style.transitionDelay = on ? '0.4s' : '0s';
    if (still) { void B.offsetWidth; requestAnimationFrame(function () { B.classList.remove('still'); }); }
  }
  function fit() { var k = Math.min(1, innerWidth / 1800); B.style.transform = 'scale(' + k + ')'; document.getElementById('fit').style.height = (1320 * k) + 'px'; }
  addEventListener('resize', fit); fit();
  var now = /apart/.test(location.hash);
  set(now, true);                                    // #apart: the board as it is, at once
  if (!now) setTimeout(function () { set(true); }, 1000);   // otherwise: the whole tool, then blown apart
  B.addEventListener('click', function (e) { if (e.target === B || e.target.tagName === 'svg' || e.target.id === 'surface') set(!apart); });
})();
</script>
</body>
</html>
`;
if (cli) fs.writeFileSync(out, page);
if (cli) console.log('wrote', path.relative(process.cwd(), out), (page.length / 1024).toFixed(0) + ' KB, 22 pieces');

// ---- the board as DATA for the live canvas (tools/core/field/board.js): each piece's place, label, gate frame and wire, read from the board
// file (not retyped); `take` says which part of the live tool's face goes into it (a card by its title, controls by their keys, or a selector).
// node docs/previews/workbench/build-field.mjs --data → tools/music/tools/bass/wobble-bass/wobble-bass.board.js
export function boardData() {
  const svg = src.match(/<svg[\s\S]*?<\/svg>/)[0];
  const paths = [...svg.matchAll(/<path d="M(\d+) (\d+) C [^"]*?(\d+) (\d+)" fill="none" stroke="([^"]+)"[^>]*?(stroke-dasharray="[^"]+")?\/>/g)];
  const rects = [...svg.matchAll(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)" fill="none" stroke="([^"]+)"/g)];
  const imgs = [...src.matchAll(/<img[^>]*?style="position: absolute; left: (\d+)px; top: (\d+)px; width: (\d+)px; height: (\d+)px;[^"]*"[^>]*>/g)];
  const labels = [...src.matchAll(/<span style="position: absolute; left: (\d+)px; top: (\d+)px; font: 500 10px[^"]*color: (#[0-9A-Fa-f]+)[^"]*">([^<]*?)&#160;<span style="opacity: 0.7">([^<]*)<\/span><\/span>/g)];
  if (paths.length !== 22 || rects.length !== 22 || imgs.length !== 22 || labels.length !== 22) throw new Error(`board: ${paths.length} wires ${rects.length} frames ${imgs.length} pieces ${labels.length} labels`);
  const size = (f) => { const b = fs.readFileSync(path.join(HERE, f)); return b.readUInt32BE(16) + 'x' + b.readUInt32BE(20); };
  const bySize = {}; fs.readdirSync(HERE).filter(f => f.endsWith('.png') && !f.startsWith('blank')).forEach(f => { bySize[size(f)] = f.replace('.png', ''); });
  const TAKE = { 'lfo-rate': { title: 'WOBBLE RATE' }, 'rate-beyond': { title: 'RATE — beyond the grid' }, 'shape-tabs': { keys: ['lfoShape'] }, 'step-mod': { title: 'WUB SEQ' },
    'env-shape': { title: 'SHAPE' }, 'osc-va': { keys: ['osc2', 'sqOct'] }, 'osc-sub': { keys: ['sub', 'subAlign'] }, unison: { keys: ['spread'] }, fm: { keys: ['fmIndex', 'fmRatio', 'fmWub'] },
    noise: { keys: ['noise'] }, 'filter-vowels': { title: 'FILTER + VOWELS' }, mouth: { title: 'MOUTH — the filter' }, grit: { keys: ['gritMode', 'shaper', 'drive'] }, squash: { keys: ['squash'] },
    release: { keys: ['attack', 'release'] }, width: { keys: ['width'] }, volwub: { keys: ['ampMod'] }, level: { keys: ['level'] }, pitch: { title: 'PITCH — bends and dives' },
    perform: { title: 'PERFORM' }, preset: { sel: '.uk-presetbar' }, keys: { sel: '.uk-keys' } };
  const pieces = imgs.map((m, i) => { const id = bySize[m[3] + 'x' + m[4]], p = paths[i], r = rects[i], l = labels[i];
    if (!TAKE[id]) throw new Error('no take for ' + id);
    return { id, take: TAKE[id], x: +m[1], y: +m[2], w: +m[3], h: +m[4], frame: [+r[1], +r[2], +r[3], +r[4]], col: p[5], dash: !!p[6], from: [+p[1], +p[2]], to: [+p[3], +p[4]],
      label: { x: +l[1], y: +l[2], text: l[4].trim(), status: l[5] } }; });
  const core = src.match(/<div style="position: absolute; left: 740px; top: 560px;[\s\S]*?<\/div>/)[0], legend = src.match(/<div style="position: absolute; right: 30px; top: 1130px;[\s\S]*?<\/div>/)[0];
  const header = src.match(/<div style="position: absolute; left: 0; top: 0; right: 0; height: 30px;[\s\S]*?<\/div>/)[0];
  return { size: [1800, 1320], pieces, core, legend, header };
}
if (cli && process.argv.includes('--data')) {
  const D = boardData(), ROOT = path.resolve(HERE, '../../..'), out = path.join(ROOT, 'tools/music/tools/bass/wobble-bass/wobble-bass.board.js');
  // since the board (4.1.0): what Wobble Bass has grown, below it on the canvas — more depth, the AMP stage (amp-chain, WD1)
  const more = [['FILTER+ — slope, tracking, envelope', 'filter+ · slope · tracking · env', 'own'], ['GROWL+ — FM fine, ring, voices, sub', 'growl+ · fm fine · ring · voices', 'own'],
    ['ENVELOPE+ — decay and sustain', 'envelope+ · decay · sustain', 'own'], ['LFO 2 — a second motion', 'lfo · a second motion', '✓ built'],
    ['WAVETABLE — a third voice', 'osc-wavetable · a third voice', '✓ built'], ['AMP — the growl through an amp, sub kept clean', 'amp-chain · the amp', '● in it'], ['OUTPUT — mono low end, clipper', 'output · mono low end · clipper', 'own'],
    ['PARTS — swap in a shared component', 'parts · swap a component in, live', '⇄ swap']];   // 4.3 (2026-11-20): the sockets
  const colOf = { '✓ built': '#3DDC97', '● in it': '#FF2266', own: '#B8CFE0', '⇄ swap': '#00D4FF' };
  D.more = more.map(([title, text, status], i) => ({ id: 'more-' + i, take: { title }, x: 40 + (i % 4) * 440, y: 1400 + Math.floor(i / 4) * 300, w: 400, col: colOf[status], dash: false, label: { text, status } }));
  fs.writeFileSync(out, `/* GENERATED by docs/previews/workbench/build-field.mjs --data from docs/previews/workbench/Wobble-Broken.dc.html (the Field board of 2026-11-15)
 * — do not edit by hand. Wobble Bass exploded on the canvas: each piece's place, label, gate and wire are the board's; \`take\` is the part of the
 * live face that goes into it (a card by its title, controls by their keys, a selector). \`more\`: what Wobble Bass has grown since that board,
 * below it. Read by tools/core/field/board.js (window.FieldBoard). */
(function () { if (window.FieldBoard) window.FieldBoard.define('eravos.wobble-bass', ${JSON.stringify(Object.assign({ title: 'WOBBLE BASS' }, D))}); })();
`);
  console.log('wrote', path.relative(process.cwd(), out), D.pieces.length, 'pieces +', D.more.length, 'since the board');
}

// node docs/previews/wobble-builder/wobble-builder.shots.mjs — the preview opened, clicked through, measured → wobble-builder-{bench,mutated,made}.png
import { chromium } from '../../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1250 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('file://' + HERE + '/wobble-builder.html'); await p.waitForFunction(() => window.__wb); await p.waitForTimeout(500);
const out = {};
out.classic = await p.evaluate(() => { const r = __wb.render([{ t: 0.02, dur: 1.7, hz: 55 }], 1.8); return { ok: r.ok, why: r.why, peak: +r.peak.toFixed(3), meas: document.getElementById('meas').textContent }; });
await p.screenshot({ path: HERE + '/wobble-builder-bench.png' });
// every part in every slot plays cleanly
out.slots = await p.evaluate(() => { const res = {}; const S0 = JSON.parse(JSON.stringify(__wb.S()));
  for (const [k, opts] of [['drive', ['none', 'saturator-tube', 'saturator-tape', 'bitcrusher']], ['mouth', ['filter-svf', 'filter-ladder']], ['fx', ['none', 'delay-line', 'saturator-tape', 'bitcrusher']]])
    for (const o of opts) { __wb.set({ [k]: o }, true); const r = __wb.render([{ t: 0.02, dur: 1.2, hz: 55 }], 1.4); res[k + ':' + o] = r.ok ? +(20 * Math.log10(r.peak)).toFixed(1) + ' dB' : 'NO ' + r.why.join(';'); }
  __wb.set(S0, true); return res; });
// mutate ×8, throw / keep; every mutation plays?
out.muts = await p.evaluate(() => { const rows = []; for (let i = 0; i < 8; i++) { __wb.dock.mutateNow(); const r = __wb.render([{ t: 0.02, dur: 1.2, hz: 55 }], 1.4);
  rows.push((r.ok ? 'ok ' + (20 * Math.log10(r.peak)).toFixed(1) + ' dB' : 'NO ' + r.why.join(';')) + ' · ' + document.querySelector('.fm-line').textContent.slice(0, 140)); if (i < 7) __wb.dock.throwNow(); } __wb.dock.keepNow(); return rows; });
await p.evaluate(() => document.querySelector('.node .sw') && null); await p.screenshot({ path: HERE + '/wobble-builder-mutated.png' });
await p.evaluate(() => { document.getElementById('toolName').value = 'Gutter Mouth'; document.getElementById('toolName').dispatchEvent(new Event('input')); __wb.synthesize(); });
await p.waitForTimeout(300); out.made1 = await p.evaluate(() => ({ n: __wb.made().length, toast: document.getElementById('toast').textContent }));
await p.evaluate(() => __wb.synthesize()); await p.waitForTimeout(300); out.twin = await p.evaluate(() => ({ n: __wb.made().length, toast: document.getElementById('toast').textContent }));
await p.screenshot({ path: HERE + '/wobble-builder-made.png' });
console.log(JSON.stringify(out, null, 1)); console.log('errors', errs.slice(0, 5)); await b.close();

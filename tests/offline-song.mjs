// Offline render of a recipe song (fast): node offline-song.mjs out.wav [stems]
import { chromium } from 'playwright';
import fs from 'fs';
const OUT = '/tmp/claude-0/e2e';
const vocal = fs.readFileSync(OUT + '/give_your_head_a_shake.wav').toString('base64');
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage();
const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('file:///home/claude/eravos/tests/run.html?auto=0');
await p.waitForFunction(() => window.Recipes && window.OrganismFactory);
const solo = process.argv[3] || '';
const res = await p.evaluate(async ({ b64, solo, node }) => { window.__probeNode = node;
  const bars = 40, bpm = 140, sr = 44100, sec = bars * 240 / bpm + 1;
  const ctx = new OfflineAudioContext(2, Math.ceil(sec * sr), sr);
  const K = Kernel.create({ ctx, quiet: true, syncIR: true }); const T = MasterTransport.create(K, { offline: true, bpm }); T.boot();
  const r = await Recipes.run('eravos.recipe.raven-drop', { K, headless: true });
  const A = r.alias;
  const bin = atob(b64); const ab = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) ab[i] = bin.charCodeAt(i);
  await OrganismFactory.handle(A.vocal).ctx.load(ab.buffer, 'give_your_head_a_shake.wav');
  K.bus.publish('ui:send:' + A.vocal, { target: A.drop });
  await new Promise(r => setTimeout(r, 300));
  K.bus.publish('ui:config_change:' + A.drop, { key: 'stutter', value: 3 });
  if (solo) { // mute every organism port except the solo one(s)
    const keep = solo.split(',');
    K.registry.list().forEach(rec => K.audio.ports(rec.instance_id).forEach(pt => { if (pt.kind === 'audio' && pt.direction === 'out' && !keep.some(k => rec.organism_id.includes(k.split(':')[0]) && (k.includes(':') ? pt.port_id === k.split(':')[1] : true))) { try { pt.node.disconnect(); } catch (e) {} } }));
  }
  if (solo) { const mg = ctx.createChannelMerger(2); K.audio.chain.out.disconnect(ctx.destination); K.audio.chain.out.connect(mg, 0, 0); const pre = ctx.createGain(); const pn = window.__probeNode || 'masterIn'; (pn.startsWith('port:') ? K.audio.port(r.alias[pn.split(':')[1]], pn.split(':')[2]).node : K.audio.chain[pn]).connect(pre); pre.connect(mg, 0, 1); mg.connect(ctx.destination); }
  const trig = {}; let curStep = 0; K.bus.subscribe('transport:tick', t => { curStep = t.step16; }); K.bus.subscribe('pad:trigger', p => { const b = Math.floor(curStep / 16) + 1; trig[b] = (trig[b] || 0) + 1; });
  T.renderTicks(0, bars * 16, 0.05);
  const buf = await ctx.startRendering();
  let nanAt = -1; const d0 = buf.getChannelData(0); for (let i = 0; i < d0.length; i++) if (d0[i] !== d0[i]) { nanAt = i / sr; break; }
  const wav = AudioRecorder.encodeWAV(buf, 16);
  const u = new Uint8Array(wav); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return { trig, nanAt, b64: btoa(s), faults: K.faults.list().map(f => f.fault_class + ' ' + f.message).slice(0, 10) };
}, { b64: vocal, solo, node: process.env.NODE || 'masterIn' });
fs.writeFileSync(process.argv[2] || OUT + '/offline.wav', Buffer.from(res.b64, 'base64'));
console.log('faults', JSON.stringify(res.faults), 'nanAt', res.nanAt, 'trig', JSON.stringify(res.trig)); if (errs.length) console.log(errs.slice(0, 10).join('\n'));
await b.close();

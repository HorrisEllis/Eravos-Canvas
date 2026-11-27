// node docs/previews/contrast-examples.render.mjs — listenable examples of the four Contrast tools, rendered offline by ERAVOS itself
// (his ask, 2026-11-27: "Give me some examples of the new tools.") → docs/previews/examples/*.wav (git-ignored: no recordings are shipped — tests/no-toys.mjs)
//   1 ripple-<preset>.wav        Ripple's presets, each the same bass line (140 BPM)
//   2 collision-before-after.wav a bass and a kick: 4 bars as they are, then 4 bars through Collision keyed by the kick
//   3 spatial-<preset>.wav       a Piano phrase through Spatial Organism (headphones)
//   4 tension-build-drop.wav     Tension Field builds a held grind (its tension opens Ripple's filter and speeds its swell), lets go, the drop
// Every file is levelled to a −1 dB peak (so the quiet ones can be heard as well as the loud). The kick here is a few lines of oscillators in this script (a test signal, never shipped) — in ERAVOS it is the Drum Machine.
import { chromium } from '../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url'; import fs from 'fs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), OUT = ROOT + '/docs/previews/examples';
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 900, height: 700 } });
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); });
await p.evaluate(() => {
  const SR = 44100, BPM = 140, BEAT = 60 / BPM, BAR = 4 * BEAT;
  window.__X = {
    SR, BPM, BEAT, BAR,
    uni(sec) { const ctx = new OfflineAudioContext(2, Math.ceil(sec * SR), SR), K = Kernel.create({ ctx, quiet: true, syncIR: true }), T = MasterTransport.create(K, { offline: true, bpm: BPM }); T.boot(); K.audio.chain.out.gain.value = 0; return { ctx, K, T }; },
    spawn(U, id, params) { const a = OrganismFactory.spawn(id, { K: U.K, headless: true }), c = OrganismFactory.handle(a).ctx; Object.entries(params || {}).forEach(([k, v]) => c.params.set(k, v)); return { a, c }; },
    preset(c, id, name) { const pr = (OrganismFactory.def(id).presets || {})[name]; Object.entries((pr && pr.params) || pr || {}).forEach(([k, v]) => c.params.set(k, v)); },
    port(U, a, kind, dir, label) { return U.K.audio.ports(a).find(x => x.kind === kind && x.direction === dir && (!label || String(x.label).toLowerCase() === label)); },
    wire(U, a, ah, d, dh) { const r = U.K.wires.register({ src: { instanceId: a, hookId: ah }, dst: { instanceId: d, hookId: dh } }); if (!r.ok) throw new Error('wire ' + ah + ' → ' + dh + ': ' + JSON.stringify(r.fault || r)); },
    kick(ctx, node, t, gain) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      g.gain.setValueAtTime(gain || 0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35); o.connect(g); g.connect(node); o.start(t); o.stop(t + 0.4); },
    // half-time bass line in A minor: A1 · F1 · C2 · G1, a note per two beats with a pickup
    line(t0, bars) { const roots = [33, 29, 36, 31], out = []; for (let b = 0; b < bars; b++) { const r = roots[b % 4], t = t0 + b * BAR; out.push([r, t, BEAT * 1.6], [r, t + 2 * BEAT, BEAT * 1.2], [r + 12, t + 3.5 * BEAT, BEAT * 0.4]); } return out; },
    wav(buf) { const L = buf.getChannelData(0), R = buf.getChannelData(1), n = L.length; let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
      const g = pk > 0 ? 0.89 / pk : 1, ab = new ArrayBuffer(44 + n * 4), v = new DataView(ab), w = (o, s) => [...s].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
      w(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
      v.setUint32(24, SR, true); v.setUint32(28, SR * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 4, true);
      for (let i = 0; i < n; i++) { v.setInt16(44 + i * 4, L[i] * g * 32767, true); v.setInt16(46 + i * 4, R[i] * g * 32767, true); }
      let s = ''; const u = new Uint8Array(ab); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return { b64: btoa(s), peak: pk }; },
  };
});
const save = (name, r) => { fs.writeFileSync(`${OUT}/${name}.wav`, Buffer.from(r.b64, 'base64')); console.log(`${name}.wav  (levelled to −1 dB peak from ${(20 * Math.log10(r.peak || 1e-9)).toFixed(1)} dBFS)`); };

// 1 · Ripple's presets, the same line
for (const name of ['Floor Swell', 'Low Growl', 'Dive Bomb', 'Grime Square', 'Tremor Hit']) {
  save('ripple-' + name.toLowerCase().replace(/\s+/g, '-'), await p.evaluate(async (name) => { const X = __X, U = X.uni(4 * X.BAR + 1), r = X.spawn(U, 'eravos.ripple'); X.preset(r.c, 'eravos.ripple', name); await r.c.ready;
    X.port(U, r.a, 'audio', 'out').node.connect(U.ctx.destination); X.line(0.05, 4).forEach(([n, t, d]) => r.c.noteOn(n, 0.9, t, d)); return X.wav(await U.ctx.startRendering()); }, name));
}
// 2 · Collision: bass + kick as they are (4 bars), then the bass through Collision keyed by the kick (4 bars)
save('collision-before-after', await p.evaluate(async () => { const X = __X, U = X.uni(8 * X.BAR + 1), r = X.spawn(U, 'eravos.ripple'); X.preset(r.c, 'eravos.ripple', 'Floor Swell'); r.c.params.set('sub', 1);
  const col = X.spawn(U, 'eravos.band-collision'); X.preset(col.c, 'eravos.band-collision', 'Kick Takes the Floor'); await r.c.ready; await col.c.ready;
  const out = X.port(U, r.a, 'audio', 'out').node, dry = U.ctx.createGain(), wet = U.ctx.createGain(); out.connect(dry); dry.connect(U.ctx.destination);
  out.connect(X.port(U, col.a, 'audio', 'in', 'in').node); X.port(U, col.a, 'audio', 'out').node.connect(wet); wet.connect(U.ctx.destination);
  const half = 4 * X.BAR; dry.gain.setValueAtTime(1, 0); dry.gain.setValueAtTime(0, half); wet.gain.setValueAtTime(0, 0); wet.gain.setValueAtTime(1, half);
  const keyN = X.port(U, col.a, 'audio', 'in', 'key').node; X.line(0.05, 8).forEach(([n, t, d]) => r.c.noteOn(n, 0.9, t, d));
  for (let k = 0; k < 16; k++) { const t = 0.05 + k * 2 * X.BEAT; X.kick(U.ctx, U.ctx.destination, t); X.kick(U.ctx, keyN, t); }
  return X.wav(await U.ctx.startRendering()); }));
// 3 · Spatial Organism: a Piano phrase placed around you
for (const name of ['Lingering Right', 'Rotating Machine', 'Deep Space']) {
  save('spatial-' + name.toLowerCase().replace(/\s+/g, '-'), await p.evaluate(async (name) => { const X = __X, U = X.uni(9), pi = X.spawn(U, 'eravos.piano'), sp = X.spawn(U, 'eravos.spatial-organism');
    X.preset(sp.c, 'eravos.spatial-organism', name); await pi.c.ready; if (pi.c.internals && pi.c.internals.ready) await pi.c.internals.ready; await sp.c.ready;
    X.port(U, pi.a, 'audio', 'out').node.connect(X.port(U, sp.a, 'audio', 'in').node); X.port(U, sp.a, 'audio', 'out').node.connect(U.ctx.destination);
    const ph = [[57, 0], [60, 0.5], [64, 1], [69, 1.5], [67, 2.25], [64, 2.75], [60, 3.5], [62, 4], [65, 4.5], [69, 5], [72, 5.5], [69, 6.25]];
    const play = pi.c.internals && pi.c.internals.noteOn ? pi.c.internals.noteOn : pi.c.noteOn; ph.forEach(([n, t]) => play(n, 0.75, 0.1 + t, 0.9));
    return X.wav(await U.ctx.startRendering()); }, name));
}
// 4 · Tension Field builds a held grind for 4 bars (tension → Ripple's cutoff and its swell), lets go, then 4 bars of drop: bass + kick through Collision
save('tension-build-drop', await p.evaluate(async () => { const X = __X, U = X.uni(8 * X.BAR + 1.5), r = X.spawn(U, 'eravos.ripple'), tf = X.spawn(U, 'eravos.tension-field'), col = X.spawn(U, 'eravos.band-collision');
  X.preset(r.c, 'eravos.ripple', 'Low Growl'); r.c.params.set('cutoff', 300); r.c.params.set('beat', 0.6);
  tf.c.params.set('mode', 'target'); tf.c.params.set('hold', 4); tf.c.params.set('shape', 0.55); tf.c.params.set('release', 0.15); tf.c.params.set('loop', false);
  X.preset(col.c, 'eravos.band-collision', 'Kick Takes the Floor'); await r.c.ready; await tf.c.ready; await col.c.ready;
  X.wire(U, tf.a, 'tf.hook.tension', r.a, 'ripple.hook.mod_cutoff'); X.wire(U, tf.a, 'tf.hook.tension', r.a, 'ripple.hook.mod_beat');
  X.port(U, r.a, 'audio', 'out').node.connect(X.port(U, col.a, 'audio', 'in', 'in').node); X.port(U, col.a, 'audio', 'out').node.connect(U.ctx.destination);
  const keyN = X.port(U, col.a, 'audio', 'in', 'key').node, drop = 0.05 + 4 * X.BAR;
  tf.c.startBuild(0.05); r.c.noteOn(33, 0.9, 0.05, 4 * X.BAR - 0.05);              // the build: one held A, opening and swelling faster
  for (let k = 0; k < 8; k++) { const t = 0.05 + 3 * X.BAR + k * X.BEAT / 2; X.kick(U.ctx, U.ctx.destination, t, 0.25 + 0.08 * k); }   // a roll in the last bar
  X.line(drop, 4).forEach(([n, t, d]) => r.c.noteOn(n, 0.95, t, d));                 // the drop
  for (let k = 0; k < 8; k++) { const t = drop + k * 2 * X.BEAT; X.kick(U.ctx, U.ctx.destination, t); X.kick(U.ctx, keyN, t); }
  return X.wav(await U.ctx.startRendering()); }));
console.log('faults', JSON.stringify(await p.evaluate(() => Kernel.faults.list().slice(-3).map(f => (f.fault_class || f.code) + ' ' + (f.message || '').slice(0, 90)))));
await b.close(); console.log('ok');

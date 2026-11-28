// node docs/previews/rumble-study.render.mjs — a Rumble study from existing tools only (3.256): Ripple ×3, Wub Osc → Wub Filter ← Wub Rate, Pads → Glitch.
// WAVs go to docs/previews/examples/rumble-study (git-ignored: no recordings are shipped — tests/no-toys.mjs). The parts' notes and the changes over time are what a Sequencer / Automation lane would do.
// node docs/previews/contrast-examples.render.mjs — listenable examples of the four Contrast tools, rendered offline by ERAVOS itself
// (his ask, 2026-11-27: "Give me some examples of the new tools.") → docs/previews/examples/*.wav (git-ignored: no recordings are shipped — tests/no-toys.mjs)
//   1 ripple-<preset>.wav        Ripple's presets, each the same bass line (140 BPM)
//   2 collision-before-after.wav a bass and a kick: 4 bars as they are, then 4 bars through Collision keyed by the kick
//   3 spatial-<preset>.wav       a Piano phrase through Spatial Organism (headphones)
//   4 tension-build-drop.wav     Tension Field builds a held grind (its tension opens Ripple's filter and speeds its swell), lets go, the drop
// Every file is levelled to a −1 dB peak (so the quiet ones can be heard as well as the loud). The kick here is a few lines of oscillators in this script (a test signal, never shipped) — in ERAVOS it is the Drum Machine.
import { chromium } from '/home/user/Eravos-Canvas/host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url'; import fs from 'fs';
const ROOT = '/home/user/Eravos-Canvas', OUT = ROOT + '/docs/previews/examples/rumble-study';
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
    port(U, a, kind, dir, label) { return U.K.audio.ports(a).find(x => x.kind === kind && x.direction === dir && !x.internal && (!label || String(x.label).toLowerCase() === label)); },
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
const save = (name, r) => { fs.writeFileSync(`${OUT}/${name}.wav`, Buffer.from(r.b64, 'base64')); console.log(name, r.peak.toFixed(3), r.info || ''); };
// A Rumble study made only from tools ERAVOS has (nothing new): 8 bars at 140, F#.
//  layers: SUB (Ripple, sub only) · GROWL (Wub Osc → Wub Filter, moved by Wub Rate) · MID ~370 Hz stabs (Ripple, square, short) · SQUEAK (Ripple MOD) · DRUMS (Pads → Glitch)
//  bars 1–4 the build: the growl louder bar by bar while Wub Rate's steps tighten 1/4 → 1/8 → 1/8t → 1/16 → 1/32 (depth the same), the squeak rising; the last beat a gap
//  bars 5–8 the drop: Wub Rate 1/8 steps of stabs, gaps and holds (Restart every step, Shape saw-down = an attack per cycle), the mid stabs off the beat,
//  two-step drums, a breakbeat in bars 7–8, Glitch repeats on the drums at the end of bars 6 and 8
async function study(only) { return p.evaluate(async (only) => { const X = __X, BEAT = 60 / 140, SX = BEAT / 4, T0 = 0.1, SEC = T0 + 32 * BEAT + 1.6, U = X.uni(SEC); U.T.setBpm && U.T.setBpm(140);
  const dst = U.ctx.destination, on = (k) => !only || only === k, info = [];
  const sub = X.spawn(U, 'eravos.ripple', { voices: 2, beat: 0, grind: 0, sub: 1, octave: 0, aA: 0.01, aS: 1, aR: 0.08, level: 0.9 }); await sub.c.ready;
  const mid = X.spawn(U, 'eravos.ripple', { wave: 'square', voices: 2, beat: 3, sub: 0, grind: 1, octave: 0, midOct: '0', drive: 8, cutoff: 1800, res: 3, fEnv: 1, fDec: 0.08, aA: 0.002, aD: 0.09, aS: 0, aR: 0.05, level: 0.55 }); await mid.c.ready;
  const sq = X.spawn(U, 'eravos.ripple', { wave: 'saw', voices: 2, beat: 0.4, width: 0.7, sub: 0, grind: 1, octave: 1, midOct: '+1', drive: 6, bias: 0.2, cutoff: 2400, res: 4, fEnv: 0, aA: 0.3, aS: 1, aR: 0.3, dive: -12, diveTime: 2.2, modAmt: 0.7, modRatio: 4, modWave: 'square', level: 0.35 }); await sq.c.ready;
  const osc = X.spawn(U, 'eravos.wub-osc', { octave: -1, keepRange: false, level: 0.2 }), wf = X.spawn(U, 'eravos.wub-filter', {}); if (wf.c.ready) await wf.c.ready; if (osc.c.ready) await osc.c.ready;
  const rate = X.spawn(U, 'eravos.wub-rate', { stepLen: '1/4', length: 16, shape: 'sine', smooth: 0.15, depth: 1,
    steps: ['1/4', '1/4', '1/4', '1/4', '1/8', '1/8', '1/8', '1/8', '1/8t', '1/8t', '1/16', '1/16', '1/16', '1/32', '1/32', 'off'] });
  X.wire(U, rate.a, 'wubrate.hook.mod_out', wf.a, 'wubf.hook.mod_wub');
  const pads = X.spawn(U, 'eravos.pads', {}), gl = X.spawn(U, 'eravos.fx-glitch', { size: '1/32', repeats: 4, chaos: 0 }); if (gl.c.ready) await gl.c.ready;
  const out = (a) => X.port(U, a, 'audio', 'out').node, inn = (a) => X.port(U, a, 'audio', 'in').node;
  out(osc.a).connect(inn(wf.a)); out(pads.a).connect(inn(gl.a));
  if (on('sub')) out(sub.a).connect(dst); if (on('mid')) out(mid.a).connect(dst); if (on('squeak')) out(sq.a).connect(dst); if (on('growl')) out(wf.a).connect(dst); if (only === 'osc') out(osc.a).connect(dst); if (on('drums')) out(gl.a).connect(dst);
  const bt = (bar, s16) => T0 + ((bar - 1) * 16 + s16) * SX, note = (a, n, t, d, v) => U.K.bus.publish('note:trigger', { target: a, note: n, velocity: v || 0.9, time: t, duration: d });
  // notes (the parts a Sequencer / Timeline would play)
  note(sub.a, 30, bt(1, 0), 4 * 4 * BEAT - BEAT); note(osc.a, 54, bt(1, 0), 4 * 4 * BEAT - BEAT);          // the build: held F#, gap on bar 4's last beat
  note(sq.a, 66, bt(3, 0), 2 * 4 * BEAT - BEAT * 1.2);
  for (let bar = 5; bar <= 8; bar++) { const r = bar % 2 ? 30 : (bar === 6 ? 33 : 28);                        // F# · A · F# · E under the drop
    note(sub.a, r, bt(bar, 0), 4 * BEAT * 0.98); note(osc.a, r + 24, bt(bar, 0), 4 * BEAT * 0.98);
    [3, 6, 11, 14].forEach(s => note(mid.a, r + 36, bt(bar, s), SX * 0.8, 0.8));
    if (bar === 6 || bar === 8) note(sq.a, 66 + (bar === 8 ? 3 : 0), bt(bar, 8), 4 * SX, 0.8); }
  const D = { k: 36, s: 37, c: 38, h: 39, p: 45 }, hit = (n, t, v) => note(pads.a, n, t, 0.2, v);
  for (let bar = 1; bar <= 8; bar++) { const brk = bar >= 7, drop = bar >= 5;
    if (bar <= 2) { hit(D.k, bt(bar, 0), 0.8); [4, 12].forEach(s => hit(D.h, bt(bar, s), 0.3)); continue; }
    if (bar <= 4) { hit(D.k, bt(bar, 0), 0.9); hit(D.s, bt(bar, 8), 0.8); for (let s = 0; s < (bar === 4 ? 12 : 16); s += 2) hit(D.h, bt(bar, s), 0.35); if (bar === 4) [9, 10, 11].forEach((s, i) => hit(D.s, bt(bar, s), 0.4 + 0.15 * i)); continue; }
    const K = brk ? [0, 6, 10] : [0, 10], SN = brk ? [4, 12] : [8], GH = brk ? [7, 15] : [];
    K.forEach(s => hit(D.k, bt(bar, s), 1)); SN.forEach(s => hit(D.s, bt(bar, s), 0.95)); GH.forEach(s => hit(D.s, bt(bar, s), 0.35));
    for (let s = 0; s < 16; s += 2) hit(D.h, bt(bar, s), s % 4 ? 0.3 : 0.45); if (brk) [3, 13].forEach(s => hit(D.p, bt(bar, s), 0.5)); }
  // the timeline of changes (what a hand or an Automation lane does): growl louder each beat of the build; at bar 5 Wub Rate's drop pattern; glitch fires
  const at = new Map(), when = (t, fn) => { const q = Math.round(t * U.ctx.sampleRate / 128) * 128 / U.ctx.sampleRate; if (!at.has(q)) at.set(q, []); at.get(q).push(fn); };
  for (let b = 0; b < 16; b++) when(bt(1, b * 4) - 0.02, () => osc.c.params.set('level', 0.2 + 0.6 * b / 15));
  when(bt(5, 0) - 0.15, () => { osc.c.params.set('level', 0.8); const r = rate.c.params; r.set('stepLen', '1/8'); r.set('shape', 'sawdown'); r.set('smooth', 0.05); r.set('retrig', 'every step');
    r.set('steps', ['1/16', '1/16', 'off', '1/32', '1/8t', '1/8t', '1/8t', 'off', '1/16', 'hold', '1/32', '1/32', 'off', '1/16', '1/8', 'off']); });
  // ticks are published a beat at a time, just ahead (so a change lands on the next beat, as when it plays live)
  U.T.renderTicks(0, 4, T0); for (let b = 1; b < 32; b++) { const t = T0 + b * BEAT; when(t - 0.12, () => U.T.renderTicks(b * 4, b * 4 + 4, t)); }
  [[6, 12], [8, 12]].forEach(([bar, s]) => when(bt(bar, s) - 0.14, () => { gl.c.fire('repeat', { div: '1/32', count: 8 }); info.push('glitch@' + bar); }));
  [...at.keys()].sort((a, b) => a - b).forEach(q => U.ctx.suspend(q).then(() => { at.get(q).forEach(fn => { try { fn(); } catch (e) { info.push('ERR ' + e.message); } }); U.ctx.resume(); }).catch(e => info.push('suspend ' + e.message)));
  const r = X.wav(await U.ctx.startRendering()); r.info = info.join(' '); return r; }, only); }
save('R0-study-mix', await study(null));
save('R1-growl-alone', await study('growl'));
save('R2-drums-alone', await study('drums'));
console.log('faults', JSON.stringify(await p.evaluate(() => Kernel.faults.list().slice(-5).map(f => (f.fault_class || f.code) + ' ' + JSON.stringify(f).slice(0, 160)))));
await b.close();

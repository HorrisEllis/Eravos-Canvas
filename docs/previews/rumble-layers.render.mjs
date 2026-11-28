// node docs/previews/rumble-layers.render.mjs — every layer of the breakdown he pasted, from existing tools (3.258); WAVs git-ignored (no-toys).
// node docs/previews/contrast-examples.render.mjs — listenable examples of the four Contrast tools, rendered offline by ERAVOS itself
// (his ask, 2026-11-27: "Give me some examples of the new tools.") → docs/previews/examples/*.wav (git-ignored: no recordings are shipped — tests/no-toys.mjs)
//   1 ripple-<preset>.wav        Ripple's presets, each the same bass line (140 BPM)
//   2 collision-before-after.wav a bass and a kick: 4 bars as they are, then 4 bars through Collision keyed by the kick
//   3 spatial-<preset>.wav       a Piano phrase through Spatial Organism (headphones)
//   4 tension-build-drop.wav     Tension Field builds a held grind (its tension opens Ripple's filter and speeds its swell), lets go, the drop
// Every file is levelled to a −1 dB peak (so the quiet ones can be heard as well as the loud). The kick here is a few lines of oscillators in this script (a test signal, never shipped) — in ERAVOS it is the Drum Machine.
import { chromium } from '/home/user/Eravos-Canvas/host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url'; import fs from 'fs';
const ROOT = '/home/user/Eravos-Canvas', OUT = ROOT + '/docs/previews/examples/rumble-layers';
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
// Every layer of the breakdown he pasted, from tools ERAVOS has; 12 bars at 140, A.
//   bars 1–2  hats fade in (Pads → Filter opening)          bars 3–4  + 1 the pulsing bass (Ripple: sine, FM, short, fighting itself)
//   bars 5–8  the drop: + 2 mid-bass (a copy of the pulse → EQ at 375 Hz) + 3 growl (Ripple triangle, triangle Mod ×3, FM amount rising each bar) + drums two-step
//   bars 9–10 4 the screech comes in: tightening on the beat (U3), the growl out, kick only     bars 11–12 the screech chopped, everything, a breakbeat
//   6 a voice: his own (Sample Player / Voice Lab) — nothing recorded is shipped, so a place is left for it on bar 8
async function song(only) { return p.evaluate(async (only) => { const X = __X, BEAT = 60 / 140, SX = BEAT / 4, T0 = 0.1, NB = 48, SEC = T0 + NB * BEAT + 1.5, U = X.uni(SEC);
  const dst = U.ctx.destination, on = (k) => !only || only === k, info = [];
  const out = (a) => X.port(U, a, 'audio', 'out').node, inn = (a) => X.port(U, a, 'audio', 'in').node, rdy = async (x) => { if (x.c.ready) await x.c.ready; return x; };
  const PULSE = { wave: 'sine', voices: 2, beat: 7, width: 0.3, sub: 0.9, grind: 0.8, midOct: '+1', octave: 0, drive: 12, bias: 0.3, cutoff: 700, res: 3, fEnv: 2.5, fDec: 0.09,
    aA: 0.002, aD: 0.16, aS: 0, aR: 0.06, dive: 5, diveTime: 0.04, modAmt: 1.2, modRatio: 1.5, modWave: 'sine', collideFrom: 25, collideTime: 0.12, level: 0.75 };
  const pulse = await rdy(X.spawn(U, 'eravos.ripple', PULSE)), mid = await rdy(X.spawn(U, 'eravos.ripple', Object.assign({}, PULSE, { sub: 0, octave: 1, drive: 16, level: 0.6 })));
  const eq = await rdy(X.spawn(U, 'eravos.fx-eq', { hpOn: true, hpFreq: 220, p2Freq: 375, p2Gain: 9, p2Q: 1.2, lpOn: true, lpFreq: 2600 }));
  const growl = await rdy(X.spawn(U, 'eravos.ripple', { wave: 'triangle', voices: 2, beat: 1, sub: 0, grind: 1, octave: 0, midOct: '+1', drive: 14, bias: 0.3, cutoff: 1800, res: 5, fEnv: 0, aA: 0.005, aD: 0.3, aS: 0.7, aR: 0.1, modWave: 'triangle', modRatio: 3, modAmt: 0.3, level: 0.45 }));
  const sq = await rdy(X.spawn(U, 'eravos.ripple', { wave: 'saw', voices: 2, beat: 0.4, width: 0.7, sub: 0, grind: 1, octave: 1, midOct: '+1', drive: 6, bias: 0.2, cutoff: 2400, res: 4, fEnv: 0, aA: 0.4, aD: 0.2, aS: 1, aR: 0.4, dive: -12, diveTime: 3.5, modAmt: 0.7, modRatio: 4, modWave: 'square', level: 0.3 }));
  const room = await rdy(X.spawn(U, 'eravos.spatial-organism', { room: 0.55, distance: 0.3 }));
  const rate = X.spawn(U, 'eravos.wub-rate', { stepLen: '1/4', length: 8, shape: 'sine', smooth: 0.15, depth: 0.55, polarity: 'bipolar', steps: ['1/4', '1/4', '1/8', '1/8', '1/8t', '1/16', '1/16', '1/32'] });
  X.wire(U, rate.a, 'wubrate.hook.mod_out', sq.a, 'ripple.hook.mod_cutoff');
  const pads = X.spawn(U, 'eravos.pads', { volume: 0.5 }), hatF = await rdy(X.spawn(U, 'eravos.fx-filter', { type: 'LP', cutoff: 1500, res: 1 }));
  const hats = X.spawn(U, 'eravos.pads', { volume: 0.9 });
  out(mid.a).connect(inn(eq.a)); out(sq.a).connect(inn(room.a)); out(hats.a).connect(inn(hatF.a));
  if (on('pulse')) out(pulse.a).connect(dst); if (on('mid')) out(eq.a).connect(dst); if (on('growl')) out(growl.a).connect(dst); const fader = U.ctx.createGain(); fader.gain.value = 3.2; out(room.a).connect(fader); if (on('screech')) fader.connect(dst);   // the screech's fader up (a Mixer would do this)
  if (on('drums')) { out(pads.a).connect(dst); out(hatF.a).connect(dst); }
  const bt = (bar, s16) => T0 + ((bar - 1) * 16 + s16) * SX, note = (a, n, t, d, v) => U.K.bus.publish('note:trigger', { target: a, note: n, velocity: v || 0.9, time: t, duration: d });
  const at = new Map(), when = (t, fn) => { const q = Math.round(t * U.ctx.sampleRate / 128) * 128 / U.ctx.sampleRate; if (!at.has(q)) at.set(q, []); at.get(q).push(fn); };
  const ROOT = [33, 33, 33, 33, 33, 33, 36, 31, 33, 33, 33, 31];
  // 5 percussion: hats from bar 1, the filter opening over two bars (the fade-in), accents on the off-beats
  for (let bar = 1; bar <= 12; bar++) for (let s = 0; s < 16; s += 2) note(hats.a, 39, bt(bar, s), 0.1, s % 4 ? 0.9 : 0.5);
  for (let k = 0; k <= 32; k++) when(bt(1, k), () => hatF.c.params.set('cutoff', 1500 * Math.pow(10, Math.min(1, k / 24))));
  // 1 the pulse, bars 3–12;  2 its copy at 375 Hz, bars 5–8 and 11–12
  for (let bar = 3; bar <= 12; bar++) [[0, 0], [3, 0], [6, 0], [8, 0], [10, 0], [11, 0], [14, 12]].forEach(([s, o]) => { const n = ROOT[bar - 1] + o; note(pulse.a, n, bt(bar, s), SX * 1.4, s % 8 ? 0.8 : 1); if ((bar >= 5 && bar <= 8) || bar >= 11) note(mid.a, n, bt(bar, s), SX * 1.4, 0.8); });
  // 3 the growl, bars 5–8: its FM amount rising through each bar (an Automation lane would draw this)
  for (let bar = 5; bar <= 8; bar++) { [[0, 6], [8, 3], [12, 3]].forEach(([s, d]) => note(growl.a, ROOT[bar - 1] + 12, bt(bar, s), d * SX)); for (let s = 0; s < 16; s++) when(bt(bar, s), () => growl.c.params.set('modAmt', 0.3 + 2.2 * s / 15)); }
  // drums: two-step from bar 5, kick only in 9–10, a breakbeat in 11–12; a gap on bar 8's last beat (where his voice can go)
  for (let bar = 5; bar <= 12; bar++) { const brk = bar >= 11, only9 = bar === 9 || bar === 10;
    (brk ? [0, 6, 10] : [0, 10]).forEach(s => note(pads.a, 36, bt(bar, s), 0.2, 1)); if (!only9) (brk ? [4, 12] : [8]).forEach(s => (bar === 8 && s > 11) || note(pads.a, 37, bt(bar, s), 0.2, 0.95));
    if (brk) [7, 15].forEach(s => note(pads.a, 37, bt(bar, s), 0.2, 0.35)); }
  // 4 the screech: comes in on bar 9, tightening for 8 beats (louder as it tightens), then chopped (bars 11–12)
  note(sq.a, 69, bt(9, 0), 16 * BEAT - 0.05);
  for (let b = 0; b < 8; b++) when(bt(9, b * 4) - 0.02, () => sq.c.params.set('level', 0.3 + 0.5 * b / 7));
  when(bt(11, 0) - 0.15, () => { const r = rate.c.params; r.set('stepLen', '1/8'); r.set('length', 16); r.set('shape', 'square'); r.set('smooth', 0.04); r.set('retrig', 'every step'); r.set('polarity', 'unipolar+'); r.set('depth', 0.8);
    r.set('steps', ['1/16', '1/16', 'off', '1/32', '1/8t', '1/8t', 'hold', 'off', '1/16', '1/32', '1/32', 'off', '1/16', '1/8', '1/32', 'off']); sq.c.params.set('cutoff', 1400); });
  U.T.renderTicks(0, 4, T0); for (let b = 1; b < NB; b++) { const t = T0 + b * BEAT; when(t - 0.12, () => U.T.renderTicks(b * 4, b * 4 + 4, t)); }
  [...at.keys()].sort((a, b) => a - b).forEach(q => U.ctx.suspend(q).then(() => { at.get(q).forEach(fn => { try { fn(); } catch (e) { info.push('ERR ' + e.message); } }); U.ctx.resume(); }).catch(e => info.push('suspend ' + e.message)));
  const r = X.wav(await U.ctx.startRendering()); r.info = info.slice(0, 3).join(' '); return r; }, only); }
save('0-every-layer', await song(null));
for (const [k, n] of [['pulse', '1-pulsing-bass'], ['mid', '2-mid-bass-375'], ['growl', '3-growl'], ['screech', '4-screech'], ['drums', '5-percussion']]) save(n + '-alone', await song(k));
console.log('faults', JSON.stringify(await p.evaluate(() => Kernel.faults.list().slice(-5).map(f => (f.fault_class || f.code) + ' ' + JSON.stringify(f).slice(0, 160)))));
await b.close();

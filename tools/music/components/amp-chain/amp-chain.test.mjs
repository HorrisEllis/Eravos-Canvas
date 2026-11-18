// node tools/music/components/amp-chain/amp-chain.test.mjs — the amp chain builds the graph Wobble Bass 4.2 built (nodes and wires, in order),
// is off at exactly 1 / 0, and sets the values it set. (The sound itself is proved by the null render on every Wobble Bass preset.)
import { createRequire } from 'module'; const { ampChain } = createRequire(import.meta.url)('./amp-chain.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
function fakeAc() {
  const log = [], ids = new Map(); let k = 0; const id = (o) => { if (!ids.has(o)) ids.set(o, o._name || ('n' + (k++))); return ids.get(o); };
  const param = (o, nm) => ({ _name: id(o) + '.' + nm, value: 0, set: [], setTargetAtTime(v, t, tc) { this.set.push(v); this.value = v; } });
  const node = (kind, ps) => { const o = { kind, connect(d) { log.push(['connect', o._name, d._name]); } }; o._name = 'n' + (k++); log.push(['make', kind, o._name]); (ps || []).forEach(p => { o[p] = param(o, p); }); return o; };
  return { log, ac: { currentTime: 0, createGain: () => node('gain', ['gain']), createBiquadFilter: () => Object.assign(node('biquad', ['frequency', 'Q', 'gain', 'detune']), { type: 'lowpass' }),
    createWaveShaper: () => node('shaper'), createDynamicsCompressor: () => node('comp', ['threshold', 'knee', 'ratio', 'attack', 'release']) } };
}
const { log, ac } = fakeAc(), input = { _name: 'IN', connect(d) { log.push(['connect', 'IN', d._name]); } }, tracked = [];
const A = ampChain(ac, input, (x) => tracked.push(x)), N = A.nodes;
// off by default: the straight path at exactly 1, the amp at exactly 0
ok(N.amDry.gain.value === 1 && N.amWet.gain.value === 0 && N.ampOut.gain.value === 1, 'off: straight 1, amp 0');
ok(log.filter(e => e[0] === 'connect' && e[1] === 'IN').map(e => e[2]).length === 3, 'the input feeds the straight path, the low band and the high band');
ok(N.amMono.channelCount === 1 && N.amMono.channelCountMode === 'explicit', 'the low band is folded to mono');
ok(['amLo1', 'amLo2'].every(k => N[k].type === 'lowpass') && ['amHi1', 'amHi2', 'amHc1', 'amHc2'].every(k => N[k].type === 'highpass'), 'LR4 split + the post high-pass');
ok(N.amSh.oversample === '4x' && N.amSafe.oversample === 'none', 'the drive oversampled, the safety knee not');
ok(N.amLim.ratio.value === 20 && N.amLim.threshold.value === -1.5, 'the limiter');
let peak = 0; for (const v of N.amSafe.curve) peak = Math.max(peak, Math.abs(v)); ok(peak < 0.99 && peak > 0.98, 'the safety knee never passes 0.99 (' + peak + ')');
ok(N.amWowDepth.gain.value === 0 && log.some(e => e[0] === 'connect' && e[1] === N.amWowDepth._name && e[2] === N.amWow._name + '.detune'), 'mod rides the Wow filter, at 0 until Wow moves');
const chain = ['amHi2', 'amPre', 'amSh', 'amPost', 'amWow', 'amMud', 'amPres', 'amAir', 'amHc1', 'amHc2', 'amSum', 'amComp', 'amMk', 'amLim', 'amSafe', 'amWet', 'ampOut'];
ok(chain.slice(1).every((k, i) => log.some(e => e[0] === 'connect' && e[1] === N[chain[i]]._name && e[2] === N[k]._name)), 'the high band in order: drive → wow → mud → presence → de-fizz → high-pass → glue → limiter → knee → out');
// on, every value as Wobble Bass 4.2 set it (character 0.7, drive 15, split 130, wow 0.4, mud 5, presence 4, glue 0.6)
A.set({ on: true, character: 0.7, drive: 15, split: 130, wow: 0.4, mudCut: 5, presence: 4, glue: 0.6 }, 0);
const dr = Math.pow(10, 15 / 20) * (0.6 + 0.8 * 0.7);
ok(N.amDry.gain.value === 0 && N.amWet.gain.value === 1, 'on: straight 0, amp 1');
ok(['amLo1', 'amLo2', 'amHi1', 'amHi2', 'amHc1', 'amHc2'].every(k => N[k].frequency.value === 130), 'every split filter at 130 Hz');
ok(N.amPre.gain.value === dr && N.amPost.gain.value === 0.5 / Math.min(1, Math.tanh(dr * 0.5) + 0.25), 'drive and its make-up');
ok(N.amWow.gain.value === 0.4 * 12 && N.amWowDepth.gain.value === 0.4 * 4800 && N.amMud.gain.value === -5, 'wow and mud cut');
ok(N.amPres.gain.value === 4 * 1.2 && N.amPres.frequency.value === 2200 + 1800 * 0.7 && N.amAir.frequency.value === 9000 + 5000 * (1 - 0.35), 'presence and de-fizz follow Character');
ok(N.amComp.threshold.value === -6 - 22 * 0.6 && N.amComp.ratio.value === 1.5 + 4.5 * 0.6 && N.amMk.gain.value === Math.pow(10, 3.6 / 20), 'glue');
ok(tracked.length >= 20, 'every node handed to the tool to track (' + tracked.length + ')');
console.log(`amp-chain ${n} checks pass`);

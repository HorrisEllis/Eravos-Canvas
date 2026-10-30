/* Wobble Bass (eravos.wobble-bass) — tests that travel with the tool. The contract is shared (tests/harness.js
 * TH.toolContract): spawns clean, every shipped preset loads in range, save → load is exact, closing leaves nothing behind,
 * Stop all is obeyed. Add this tool's own tests below it. */
TH.toolContract('eravos.wobble-bass');

window.__phase = 'P38';
describe('Wobble Bass 3.0 · Wub Lab stage 1: drawn shapes + wub sequence', () => {
  const pub = (U, hook, id, p) => U.K.bus.publish('ui:' + hook + ':' + id, p || {});
  const rig = (secs, params) => {
    const U = TH.universe(secs || 1), w = TH.spawn(U, 'eravos.wobble-bass'), c = OrganismFactory.handle(w).ctx;
    Object.keys(params || {}).forEach(k => c.params.set(k, params[k]));
    return { U, w, c };
  };
  it('a drawn shape is exact: starts on its first point, passes through every point, bends curve the segment', () => {
    const { U, w, c } = rig(0.2);
    pub(U, 'shape_pts', w, { points: [[0, -1, 0], [0.5, 1, 0.8], [0.75, 0, 0]] });
    assert.equal(c.params.get('lfoShape'), 'draw', 'drawing switches the Shape to Draw');
    assert.near(c.shapeAt(0), -1, 1e-9); assert.near(c.shapeAt(0.5), 1, 1e-9); assert.near(c.shapeAt(0.75), 0, 1e-9);
    assert.near(c.shapeAt(0.25), 0, 1e-9, 'unbent segment is a straight line');
    assert.gt(c.shapeAt(0.625), 0.9, 'bend > 0 moves late: the falling segment holds near its start, then drops');
    assert.near(c.shapeAt(0.875), -0.5, 1e-9, 'the last segment wraps back to the first point');
  });
  it('a broken drawing is refused with a plain fault and changes nothing', () => {
    const { U, w, c } = rig(0.2), before = JSON.stringify(c.params.get('shapePts'));
    assert.fault(U.K, 'RUNTIME_002', () => pub(U, 'shape_pts', w, { points: [[0, 0]] }));
    assert.equal(JSON.stringify(c.params.get('shapePts')), before);
  });
  it('the drawn wobble is what you hear: a drawn gate holds open for half the cycle, then shut (DC kept)', async () => {
    const { U, w, c } = rig(1.05, { level: 0, lfoSync: true, div: '1/2' });   // 1/2 at 120 BPM = 1 s cycle
    pub(U, 'shape_pts', w, { points: [[0, 1, 0], [0.49, 1, 0], [0.5, -1, 0], [0.99, -1, 0]] });
    const probe = U.ctx.createGain(); c.internals.lfoBus.connect(probe); probe.connect(U.ctx.destination);
    const buf = await TH.render(U), d = buf.getChannelData(0), at = (s) => d[Math.floor(s * TH.SR)];
    assert.near(at(0.2), 0.5, 0.06, 'open half (lfoBus is ±0.5)'); assert.near(at(0.7), -0.5, 0.06, 'shut half');
  });
  it('wub seq: every step restarts the wobble at its own rate, sample-exact on the bar grid; empty steps hold', async () => {
    const { U, c } = rig(1.2, { wubOn: true, wubStep: '1/4', wubLen: 4, wubSeq: ['1/4', '1/16:yoy', '', 'x'] });
    c.internals.lfoLog.length = 0;
    U.T.renderTicks(0, 32, 0.05); await TH.render(U);
    const L = c.internals.lfoLog.map(e => [+e.t.toFixed(6), e.div, e.shape, e.stop]);
    assert.deepEqual(L, [[0.05, '1/4', 'sine', false], [0.55, '1/16', 'yoy', false], [1.55, '1/16', 'sine', true],
      [2.05, '1/4', 'sine', false], [2.55, '1/16', 'yoy', false], [3.55, '1/16', 'sine', true]], 'steps 1, 2, (3 holds), 4 stops — twice');
  });
  it('wub seq on: notes play pitch only — they never reset the wobble; off: notes retrigger as before', () => {
    const a = rig(0.5, { wubOn: true }); a.c.internals.lfoLog.length = 0;
    TH.note(a.U, a.w, 45, 0.1); TH.note(a.U, a.w, 47, 0.3);
    assert.equal(a.c.internals.lfoLog.length, 0, 'no restarts from notes');
    const b = rig(0.5, { wubOn: false }); b.c.internals.lfoLog.length = 0;
    TH.note(b.U, b.w, 45, 0.1); assert.equal(b.c.internals.lfoLog.length, 1, 'retrig per note');
  });
  it('wub_seq from the window: unknown cells become holds, 16 cells are kept, and On can be set in the same message', () => {
    const { U, w, c } = rig(0.2);
    pub(U, 'wub_seq', w, { cells: ['1/8', 'nonsense', 'x', '1/32:draw'], on: true });
    const s = c.params.get('wubSeq'); assert.equal(s.length, 16); assert.deepEqual(s.slice(0, 4), ['1/8', '', 'x', '1/32:draw']); assert.equal(c.params.get('wubOn'), true);
  });
  it('turning the sequence off after a stop un-freezes the wobble', async () => {
    const { U, c } = rig(0.6, { wubOn: true, wubStep: '1/16', wubLen: 1, wubSeq: ['x'] });
    U.T.renderTicks(0, 2, 0.05); assert.equal(c.internals.frozen, true);
    c.params.set('wubOn', false); assert.equal(c.internals.frozen, false);
  });
});

// 3.1 — the sub sits at the wub's own pitch; growl grit; the mouth reaches the mids
describe('Wobble Bass 3.1 · sub at the wub’s pitch, fold grit, mid-range growl', () => {
  // share of energy per band, from one Hann-windowed FFT (8192 samples) starting at t
  function bands(buf, t, edges) {
    const x = buf.getChannelData(0), N = 8192, s = Math.floor(t * buf.sampleRate), re = new Float64Array(N), im = new Float64Array(N);
    for (let i = 0; i < N; i++) re[i] = x[s + i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / N));
    for (let i = 1, j = 0; i < N; i++) { let b = N >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
    for (let len = 2; len <= N; len <<= 1) { const a = -2 * Math.PI / len; for (let i = 0; i < N; i += len) for (let k = 0; k < len / 2; k++) { const c = Math.cos(a * k), sn = Math.sin(a * k), p = i + k, q = p + len / 2, vr = re[q] * c - im[q] * sn, vi = re[q] * sn + im[q] * c; re[q] = re[p] - vr; im[q] = im[p] - vi; re[p] += vr; im[p] += vi; } }
    const hz = buf.sampleRate / N, e = edges.slice(1).map(() => 0); let tot = 0;
    for (let i = 1; i < N / 2; i++) { const f = i * hz, m = re[i] * re[i] + im[i] * im[i]; tot += m; for (let b = 0; b < e.length; b++) if (f >= edges[b] && f < edges[b + 1]) e[b] += m; }
    return e.map(v => v / tot);
  }
  const rig = (secs, preset, params) => {
    const U = TH.universe(secs || 1, { bpm: 140 }), w = TH.spawn(U, 'eravos.wobble-bass'), c = OrganismFactory.handle(w).ctx;
    if (preset) c.presets.load(preset); Object.keys(params || {}).forEach(k => c.params.set(k, params[k])); return { U, w, c };
  };
  it('by default the sub plays at the wub’s pitch (A2 at octave −1 → 55 Hz, not 27.5 Hz)', async () => {
    const { U, w, c } = rig(0.6); assert.equal(c.params.get('subOct'), '0');
    TH.note(U, w, 45, 0.05, { duration: 0.4 }); await TH.render(U);
    assert.near(c.internals.sub.frequency.value, 55, 0.01);
    c.params.set('subOct', '-1'); assert.near(c.internals.sub.frequency.value, 55, 0.01, 'the ramp target is set, not the value yet');
  });
  it('fold grit makes far more upper harmonics than soft grit at the same amount', async () => {
    const hiShare = async (gritMode) => { const { U, w } = rig(0.8, null, { gritMode, shaper: 0.7, lfoSync: false, lfoHz: 0.1, depth: 0, cutoff: 900, sub: 0 });
      TH.note(U, w, 45, 0.05, { duration: 0.7 }); const b = await TH.render(U); const [, hi] = bands(b, 0.3, [20, 800, 20000]); return hi; };
    assert.gt(await hiShare('fold'), (await hiShare('soft')) * 1.5);
  });
  it('the dancehall presets reach past the low end: far more energy above 800 Hz than Classic Wub, open', async () => {
    const mids = async (name) => { const { U, w } = rig(2.3, name, { wubOn: false, lfoSync: false, lfoHz: 0.25, retrig: true, lfoShape: 'sine' });   // opens over 2 s
      TH.note(U, w, 45, 0.05, { duration: 2.2 }); const b = await TH.render(U); return bands(b, 1.85, [20, 800, 20000])[1]; };
    const classic = await mids('Classic Wub 1/8');
    for (const n of ['Sound-System Screech', 'Fold Growl Wub 1/8']) assert.gt(await mids(n), classic * 2, n);
  }, { timeout: 60000 });
});

// 3.3 — Sub in phase (off by default): the clean sub lined up with the wub layer (which reaches the output 384 samples later
// through the two 4x shapers). Measured over a bass octave: the low end (20–140 Hz) is more even from note to note.
describe('Wobble Bass 3.3 · Sub in phase', () => {
  const low = async (preset, align, note) => {
    const U = TH.universe(1.6, { bpm: 140 }), w = TH.spawn(U, 'eravos.wobble-bass'), c = OrganismFactory.handle(w).ctx; c.presets.load(preset); c.params.set('subAlign', align);
    const port = U.K.audio.port(w, 'out'); U.K.audio.chain.out.disconnect(U.ctx.destination);
    let n = port.node; for (const [type, f] of [['highpass', 20], ['highpass', 20], ['lowpass', 140], ['lowpass', 140]]) { const b = U.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; n.connect(b); n = b; } n.connect(U.ctx.destination);
    TH.note(U, w, note, 0.05, { duration: 1.5 }); return TH.db(TH.rms(await TH.render(U), 0.4, 1.5));
  };
  const spread = async (preset, align) => { const v = []; for (const n of [28, 31, 33, 36, 38, 40, 43, 45, 47]) v.push(await low(preset, align, n)); return Math.max(...v) - Math.min(...v); };
  it('is off by default (every preset sounds as it did)', () => {
    const U = TH.universe(0.1), w = TH.spawn(U, 'eravos.wobble-bass'); assert.equal(OrganismFactory.handle(w).ctx.params.get('subAlign'), false);
  });
  it('on: the low end is more even across a bass octave (Classic Wub, Half-time Growl)', async () => {
    for (const p of ['Classic Wub 1/8', 'Half-time Growl 1/4t']) { const off = await spread(p, false), on = await spread(p, true); assert.lt(on, off - 1, `${p}: spread ${off.toFixed(1)} dB off → ${on.toFixed(1)} dB on`); }
  }, { timeout: 120000 });
});
describe('tool · Wobble Bass 3.4 — toward the dancehall growl', () => {
  const SR = 48000, GROWL = {"div": "1/8", "lfoShape": "yoy", "shapePts": [[0, -1, 0.5], [0.2, 1, 0], [0.42, 0.15, -0.4], [0.55, 0.55, 0.3], [0.62, 0.1, 0]], "depth": 4.5, "lfoSync": true, "lfoHz": 4, "retrig": true, "lfoPhase": 0, "ampMod": 0, "vibrato": 0, "wubOn": true, "wubLen": 8, "wubStep": "1/4", "wubSeq": ["1/8", "1/8", "1/16", "1/8t", "1/8:yoy", "1/16:yoy", "1/32", "x", "", "", "", "", "", "", "", ""], "filterMode": "formant", "vowelA": "OO", "vowelB": "AH", "formantShift": 2, "cutoff": 500, "res": 12, "fmIndex": 3.2, "fmRatio": "1", "fmWub": 0.7, "squash": 0, "osc2": 0.8, "sub": 0.55, "drive": 0.9, "shaper": 0.75, "gritMode": "fold", "octave": -1, "spread": 10, "width": 0.3, "noise": 0, "sqOct": "0", "subOct": "0", "subAlign": false, "level": 1, "glide": 0.05, "attack": 0.005, "release": 0.12, "pitchDive": 0, "diveTime": 0.08, "rateBend": 1, "rateGlide": 0};   // a dancehall growl patch (its presets were removed in 3.69; the engine features stay)
  async function play(params, sec) {
    const U = TH.universe(sec || 2.4, { bpm: 140 }), w = TH.spawn(U, 'eravos.wobble-bass'), c = OrganismFactory.handle(w).ctx; c.params.setMany(Object.assign({}, GROWL, params || {}));
    U.K.audio.chain.out.disconnect(U.ctx.destination); U.K.audio.port(w, 'out').node.connect(U.ctx.destination);
    U.T.bpm = 140; U.T.renderTicks(0, 36, 0.05); U.K.bus.publish('note:trigger', { target: w, note: 41, velocity: 1, time: 0.05, duration: (sec || 2.4) - 0.2 });
    return { d: (await TH.render(U)).getChannelData(0), c };
  }
  // the share of energy in the growl band (800 Hz – 5 kHz) and how far the brightness moves (10th → 90th percentile, octaves)
  function growl(d) {
    const N = 2048, re = new Float32Array(N), im = new Float32Array(N), win = OrganismSDK.dsp.hann(N), cents = []; let mid = 0, tot = 0;
    for (let o = Math.round(0.3 * SR); o + N < d.length - SR * 0.25; o += 960) { for (let i = 0; i < N; i++) { re[i] = d[o + i] * win[i]; im[i] = 0; } OrganismSDK.dsp.fft(re, im); let num = 0, den = 0;
      for (let k = 1; k < N / 2; k++) { const m = Math.hypot(re[k], im[k]), f = k * SR / N; num += m * f; den += m; if (f > 800 && f < 5000) mid += m * m; tot += m * m; } cents.push(num / Math.max(1e-9, den)); }
    cents.sort((a, b) => a - b); return { band: mid / tot, range: Math.log2(cents[Math.floor(cents.length * 0.9)] / cents[Math.floor(cents.length * 0.1)]) };
  }
  it('FM that moves with the wobble puts more of the sound in the growl band and makes it talk wider than the old preset', async () => {
    const old = growl((await play({ fmIndex: 0, fmWub: 0, squash: 0 })).d), now = growl((await play({ fmIndex: 3.2, fmWub: 0.7, squash: 0 })).d);
    assert.gt(now.band, old.band * 1.15, `growl band ${(100 * old.band).toFixed(1)} % → ${(100 * now.band).toFixed(1)} %`);
    assert.gt(now.range, old.range * 1.2, `talking range ${old.range.toFixed(2)} → ${now.range.toFixed(2)} oct`);
  });
  it('FM stays in tune: the growl’s pitch is the note’s', async () => {
    const { d } = await play({ fmIndex: 3.2, fmWub: 0.7, fmRatio: '1', squash: 0, wubOn: false, filterMode: 'lowpass', cutoff: 2000, depth: 0 });
    const hz = TH.acFreq({ getChannelData: () => d, sampleRate: SR }, 0.4, 1.2, 30, 400); assert.lt(Math.abs(1200 * Math.log2(hz / MusicTheory.hz(41 - 12))), 30, hz.toFixed(1) + ' Hz');
  });
  it('Squash adds no delay and leaves the sub as it was', async () => {
    const a = await play({ squash: 0 }), b = await play({ squash: 0.8 });
    assert.equal(b.c.latency || 0, 0, 'no latency reported');
    const sub = (d) => { let re = 0, im = 0; const f = MusicTheory.hz(41 - 12), s0 = Math.round(0.4 * SR), n = Math.round(1.2 * SR); for (let i = s0; i < s0 + n; i++) { re += d[i] * Math.cos(2 * Math.PI * f * i / SR); im += d[i] * Math.sin(2 * Math.PI * f * i / SR); } return Math.hypot(re, im) / n; };
    assert.lt(Math.abs(20 * Math.log10(sub(b.d) / sub(a.d))), 2, 'sub level within 2 dB');
    const first = (d) => { for (let i = Math.round(0.05 * SR); i < d.length; i++) if (Math.abs(d[i]) > 1e-3) return i; return -1; };
    assert.lt(Math.abs(first(b.d) - first(a.d)), 8, 'the note starts at the same sample');
  });
});
describe('tool · Wobble Bass 3.5 — power, control, fluidity', () => {
  const SR = 48000;
  function rig(params, sec) {
    const U = TH.universe(sec || 1.6, { bpm: 140 }), w = TH.spawn(U, 'eravos.wobble-bass'), c = OrganismFactory.handle(w).ctx; c.presets.load('Classic Wub 1/8'); c.params.setMany(params || {});
    U.K.audio.chain.out.disconnect(U.ctx.destination); U.K.audio.port(w, 'out').node.connect(U.ctx.destination); U.T.bpm = 140; return { U, w, c };
  }
  it('every control the engine has is on the window (FM, Squash, Grit type … were missing), and waiting controls are dimmed', () => {
    const U = TH.universe(0.2), w = TH.spawn(U, 'eravos.wobble-bass'), rec = OrganismFactory.handle(w), host = document.createElement('div'); document.body.appendChild(host);
    try {
      const v = OrganismFactory.mountUI(rec, host); assert.deepEqual(v.orphans, [], 'not on the window');
      ['fmIndex', 'fmRatio', 'fmWub', 'squash', 'gritMode', 'sqOct', 'subAlign', 'rateBend', 'rateGlide'].forEach(k => assert.ok(host.querySelector(`[data-key="${k}"]`), k));
      assert.equal(host.querySelector('[data-key="lfoHz"]').style.opacity, '0.35', 'Free rate dimmed while Sync is on');
    } finally { host.remove(); }
  });
  it('Rate bend ×2 doubles how fast it wobbles', async () => {
    // the wobble read straight off the volume: Vol wub 1 on a sine wobble, 10 ms RMS frames, period by autocorrelation
    const speed = async (b) => { const { U, w } = rig({ div: '1/4', lfoShape: 'sine', rateBend: b, wubOn: false, retrig: true, ampMod: 1, depth: 0, cutoff: 8000 }, 2.4); U.K.bus.publish('note:trigger', { target: w, note: 45, velocity: 0.9, time: 0.05, duration: 2.3 });
      const d = (await TH.render(U)).getChannelData(0), F = 480, env = []; for (let o = Math.round(0.3 * SR); o + F < 2.3 * SR; o += F) { let q = 0; for (let i = 0; i < F; i++) q += d[o + i] * d[o + i]; env.push(Math.sqrt(q / F)); }
      const m = env.reduce((a, x) => a + x, 0) / env.length, e = env.map(x => x - m); let best = 0, lag = 0;
      for (let L = 8; L < 120; L++) { let c = 0; for (let i = 0; i + L < e.length; i++) c += e[i] * e[i + L]; if (c > best) { best = c; lag = L; } }
      return 100 / lag; };
    const a = await speed(1), b = await speed(2); assert.lt(Math.abs(b / a - 2), 0.15, `${a.toFixed(2)} Hz → ${b.toFixed(2)} Hz`);
  });
  it('Rate glide on: wub-seq steps glide the running wobble to their rate instead of restarting it', async () => {
    const { U, w, c } = rig({ wubOn: true, wubStep: '1/4', wubLen: 4, wubSeq: ['1/4', '1/8', '1/16', '1/8', '', '', '', '', '', '', '', '', '', '', '', ''], rateGlide: 0.2 }, 2);
    U.T.renderTicks(0, 28, 0.05); U.K.bus.publish('note:trigger', { target: w, note: 45, velocity: 0.9, time: 0.05, duration: 1.9 });
    await TH.render(U); const log = c.internals.lfoLog.filter(e => e.t > 0.1);
    assert.gt(log.length, 3, 'steps happened'); assert.ok(log.every(e => e.glide), 'every step glided, none restarted');
  });
  it('Pitch wub 1200 c bends a full octave each way (it stopped at 100 c)', async () => {
    const { U, w } = rig({ lfoShape: 'square', div: '1/2', vibrato: 1200, depth: 0, cutoff: 8000, filterMode: 'lowpass', fmIndex: 0, osc2: 0, sub: 0, shaper: 0, drive: 0, spread: 0, noise: 0, wubOn: false, retrig: true, glide: 0 }, 1.0);
    U.K.bus.publish('note:trigger', { target: w, note: 57, velocity: 0.9, time: 0.02, duration: 0.95 });
    const b = await TH.render(U), lo = TH.zcFreq(b, 0.1, 0.35), hi = TH.zcFreq(b, 0.55, 0.8);   // one plain saw: one zero crossing a period
    const oct = Math.abs(Math.log2(hi / lo)); assert.gt(oct, 1.7, `${lo.toFixed(0)} Hz ↔ ${hi.toFixed(0)} Hz = ${oct.toFixed(2)} octaves`);
  });
  it('the new pitch input: an Envelope wired into it bends the growl up on every note', async () => {
    const { U, w } = rig({ depth: 0, cutoff: 8000, fmIndex: 0, osc2: 0, sub: 0, shaper: 0, drive: 0, wubOn: false, glide: 0 }, 0.8);
    const e = TH.spawn(U, 'eravos.syn-env'); OrganismFactory.handle(e).ctx.params.setMany({ attack: 0.001, decay: 5, sustain: 1, depth: 0.5, velocity: 0 });
    assert.ok(U.K.wires.register({ src: { instanceId: e, hookId: 'env.hook.mod_out' }, dst: { instanceId: w, hookId: 'wobble.hook.mod_pitch' } }).ok, 'wired');
    U.K.bus.publish('note:trigger', { target: w, note: 57, velocity: 0.9, time: 0.02, duration: 0.75 });
    const b = await TH.render(U), hz = TH.acFreq(b, 0.3, 0.6, 30, 2000); assert.gt(1200 * Math.log2(hz / MusicTheory.hz(57 - 12)), 1000, hz.toFixed(1) + ' Hz: an octave up (depth 0.5 = +12 st)');
  });
});

describe('Wobble Bass 3.50 · Pitch', () => {
  it('Pitch −12 st lowers the note an octave (the sub rides with it); 0 is unchanged', async () => {
    const freqAt = async (tr) => {
      const U = TH.universe(0.6, { bpm: 140 }), w = TH.spawn(U, 'eravos.wobble-bass'), c = OrganismFactory.handle(w).ctx;
      c.params.setMany({ transpose: tr, keepRange: false });   // the transpose itself (3.77 Keep in range would lift a 27.5 Hz sub — tested below)
      TH.note(U, w, 45, 0.05, { duration: 0.4 }); await TH.render(U);
      return c.internals.sub.frequency.value;
    };
    assert.near(await freqAt(0), 55, 0.01, 'default');
    assert.near(await freqAt(-12), 27.5, 0.05, '−12 st');
    assert.near(await freqAt(7), 55 * Math.pow(2, 7 / 12), 0.05, '+7 st');
  });
});

describe('Wobble Bass · Keep in range (3.77 sound audit)', () => {
  it('a sub that would sit under 30 Hz is lifted an octave; the note itself stays where it is; off = as before', async () => {
    const subAt = async (p) => { const U = TH.universe(0.6, { bpm: 140 }), w = TH.spawn(U, 'eravos.wobble-bass'), c = OrganismFactory.handle(w).ctx; c.params.setMany(p);
      TH.note(U, w, 45, 0.05, { duration: 0.4 }); await TH.render(U); return c.internals.sub.frequency.value; };
    assert.near(await subAt({ subOct: '-1' }), 55, 0.05, 'A2 at Octave −1 = 55 Hz, Sub oct −1 = 27.5 → lifted to 55');
    assert.near(await subAt({ subOct: '-1', keepRange: false }), 27.5, 0.05, 'off: 27.5 Hz as before');
    assert.near(await subAt({ subOct: '0' }), 55, 0.05, 'in range: unchanged');
  });
});

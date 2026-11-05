/* P101 · filter-svf (phase 1, the most-used component: 35 planned tools) — the AudioWorklet plays exactly the kernel that
 * tools/music/components/filter-svf/filter-svf.test.mjs measured, inside the real audio engine (an OfflineAudioContext). */
window.__phase = 'P101';
describe('P101 · filter-svf — the worklet is the tested kernel', () => {
  it('worklet output = the kernel on the same input, sample for sample (lowpass 24 dB, resonance, a moving cutoff)', async () => {
    const SR = 48000, N = SR / 2, ac = new OfflineAudioContext(1, N, SR);
    const buf = ac.createBuffer(1, N, SR), x = buf.getChannelData(0); let s = 12345;
    for (let i = 0; i < N; i++) { s = (s * 1103515245 + 12345) >>> 0; x[i] = (s / 4294967296) * 2 - 1; }
    const src = ac.createBufferSource(); src.buffer = buf;
    const f = await MusicParts.svf(ac, { channels: 1, params: { frequency: 800, resonance: 0.6, stages: 2 } });
    f.parameters.get('frequency').setValueAtTime(800, 0); f.parameters.get('frequency').linearRampToValueAtTime(4000, N / SR);
    src.connect(f); f.connect(ac.destination); src.start(0);
    const out = (await ac.startRendering()).getChannelData(0);
    // the same thing through the kernel, block by block, with the same ramp
    const k = MusicParts.SVF(); k.setRate(SR); const ref = new Float32Array(N), fr = new Float32Array(128);
    for (let j = 0; j < N; j += 128) { for (let i = 0; i < 128; i++) fr[i] = 800 + (4000 - 800) * ((j + i) / SR) / (N / SR);
      k.process([x.subarray(j, j + 128)], [ref.subarray(j, j + 128)], 128, { frequency: fr, detune: [0], resonance: [0.6], gain: [0], mode: [0], stages: [2] }); }
    let maxd = 0, e = 0, r = 0; for (let i = 0; i < N; i++) { const d = out[i] - ref[i]; maxd = Math.max(maxd, Math.abs(d)); e += d * d; r += ref[i] * ref[i]; }
    const db = 10 * Math.log10((e || 1e-30) / r);
    assert.ok(db < -60, `worklet vs kernel residual ${db.toFixed(1)} dB (max sample diff ${maxd.toExponential(2)})`);
  });
  it('a lowpass at 500 Hz in the engine: under 1 kHz passes, 8 kHz is ~48 dB down with 2 stages', async () => {
    const SR = 48000, N = SR / 4;
    const lvl = async (hz) => { const ac = new OfflineAudioContext(1, N, SR), o = ac.createOscillator(); o.frequency.value = hz;
      const f = await MusicParts.svf(ac, { channels: 1, params: { frequency: 500, stages: 2 } }); o.connect(f); f.connect(ac.destination); o.start();
      const y = (await ac.startRendering()).getChannelData(0); let a = 0; for (let i = N / 2; i < N; i++) a += y[i] * y[i]; return 10 * Math.log10(a / (N / 2) / 0.5); };
    const lo = await lvl(100), hi = await lvl(8000);
    assert.ok(Math.abs(lo) < 0.3, `100 Hz passes (${lo.toFixed(2)} dB)`); assert.ok(hi < -40, `8 kHz is down ${hi.toFixed(1)} dB`);
  });
});

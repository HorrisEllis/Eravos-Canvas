/* Wub Filter (eravos.wub-filter) — tests that travel with the tool: the shared contract, then its own.
 * Brightness = RMS of the sample-to-sample difference ÷ RMS of the signal (more highs → bigger). */
TH.toolContract('eravos.wub-filter');
describe('tool · Wub Filter — the mouth', () => {
  function chain(sec, fparams) {
    const U = TH.universe(sec || 1, { bpm: 120 }), osc = TH.spawn(U, 'eravos.wub-osc'), f = TH.spawn(U, 'eravos.wub-filter'), fc = OrganismFactory.handle(f).ctx;
    OrganismFactory.handle(osc).ctx.params.set('voices', 1);
    Object.entries(fparams || {}).forEach(([k, v]) => fc.params.set(k, v));
    const w = U.K.wires.register({ src: { instanceId: osc, hookId: 'wubo.hook.audio_out' }, dst: { instanceId: f, hookId: 'fx.hook.audio_in' } });
    if (!w.ok) throw new Error('wire failed ' + JSON.stringify(w.fault));
    TH.note(U, osc, 45, 0.02, { duration: (sec || 1) - 0.1 }); return { U, osc, f, fc };
  }
  const bright = (b, from, to) => { const d = b.getChannelData(0); let x = 0, dd = 0; for (let i = Math.floor(from * b.sampleRate) + 1; i < to * b.sampleRate; i++) { x += d[i] * d[i]; dd += (d[i] - d[i - 1]) ** 2; } return Math.sqrt(dd / Math.max(1e-12, x)); };
  it('position 1 lets far more highs through than position 0; invert flips it', async () => {
    const at = async (p) => bright(await TH.render(chain(0.6, Object.assign({ mode: 'lowpass', cutoff: 150, range: 5 }, p)).U), 0.2, 0.5);
    const shut = await at({ position: 0 }), open = await at({ position: 1 }), inv = await at({ position: 0, invert: true });
    assert.gt(open, shut * 2, 'open vs shut'); assert.gt(inv, shut * 2, 'inverted: position 0 is open');
  });
  it('Wub Rate wired into "wub" opens and closes it on the beat', async () => {
    const { U, f } = chain(2.1, { mode: 'lowpass', cutoff: 120, range: 5 });
    const r = TH.spawn(U, 'eravos.wub-rate'), rc = OrganismFactory.handle(r).ctx; rc.params.set('steps', Array(16).fill('1/4')); rc.params.set('smooth', 0);
    const w = U.K.wires.register({ src: { instanceId: r, hookId: 'wubrate.hook.mod_out' }, dst: { instanceId: f, hookId: 'wubf.hook.mod_wub' } }); assert.ok(w.ok, 'wired');
    const b = await TH.render(U), win = []; for (let t = 0.1; t < 2; t += 0.05) win.push(bright(b, t, t + 0.05));
    const hi = Math.max(...win), lo = Math.min(...win); assert.gt(hi, lo * 2, 'brightness swings');
    // 1/4 at 120 = 2 Hz: brightest near the middle of each half second, darkest at its edges
    assert.gt(bright(b, 0.75, 0.8), bright(b, 0.98, 1.03) * 1.5, 'open mid-cycle, shut at the restart');
  });
  it('every mouth passes sound', async () => {
    for (const mode of ['lowpass', 'bandpass', 'notch', 'vowel', 'comb']) {
      const b = await TH.render(chain(0.5, { mode, position: 0.5 }).U);
      assert.gt(TH.rms(b, 0.15, 0.4), 0.005, mode);
    }
  });
});

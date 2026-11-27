/* Follow (eravos.level-follow) — the shared contract, then its own (level-follow.spec acceptance), measured offline. */
TH.toolContract('eravos.level-follow');
window.__followWas = window.__phase; window.__phase = 'P244';
describe('Follow — one tool\u2019s loudness moves another tool\u2019s knob', () => {
  async function run(params, sec, src) {
    const U = TH.universe(sec), f = TH.spawn(U, 'eravos.level-follow'), c = OrganismFactory.handle(f).ctx; Object.entries(params).forEach(([k, v]) => c.params.set(k, v)); await c.ready;
    const ports = U.K.audio.ports(f), inN = ports.find(x => x.kind === 'audio' && x.direction === 'in').node, out = ports.find(x => x.kind === 'mod' && x.direction === 'out').node;
    U.K.audio.chain.out.gain.value = 0; out.connect(U.ctx.destination); src(U.ctx, inN);
    const b = await TH.render(U); return { d: b.getChannelData(0), sr: b.sampleRate };
  }
  const burst = (from, to, amp) => (ctx, node) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 200; g.gain.value = amp || 0.5; o.connect(g); g.connect(node); o.start(from); o.stop(to); };
  const at = (r, t) => r.d[Math.floor(t * r.sr)];
  it('a sound raises Level while it plays, and Level falls after it stops (Release)', async () => {
    const r = await run({ attack: 2, release: 100, floor: -48, amount: 1, invert: false, offset: 0 }, 1.6, burst(0.2, 0.6));   // the level falls on a dB scale: −48 dB (0) about 0.6 s after it stops
    assert.lt(at(r, 0.1), 0.01, 'silent before: ' + at(r, 0.1).toFixed(3)); assert.gt(at(r, 0.5), 0.8, 'up while it plays: ' + at(r, 0.5).toFixed(3)); assert.lt(at(r, 1.0), 0.2, 'falling after: ' + at(r, 1.0).toFixed(3)); assert.lt(at(r, 1.5), 0.01, 'down after: ' + at(r, 1.5).toFixed(3));
  });
  it('Invert turns it over (a duck); Amount scales it; Offset lifts it', async () => {
    const i = await run({ attack: 2, release: 100, amount: 1, invert: true, offset: 0 }, 1, burst(0.2, 0.6)); assert.gt(at(i, 0.1), 0.99, 'inverted: up when silent'); assert.lt(at(i, 0.5), 0.2, 'down while it plays');
    const h = await run({ attack: 2, release: 100, amount: 0.5, invert: false, offset: 0.2 }, 1, burst(0.2, 0.6)); assert.near(at(h, 0.1), 0.2, 0.01, 'rests at Offset'); assert.lt(at(h, 0.5), 0.71, 'Amount ½ + Offset: at most 0.7');
  });
  it('a sound wired into it still plays where it played (it only listens)', () => {
    const U = TH.universe(0.2), src = TH.spawn(U, 'eravos.ripple'), me = TH.spawn(U, 'eravos.level-follow');
    const w = U.K.wires.register({ src: { instanceId: src, hookId: 'ripple.hook.audio_out' }, dst: { instanceId: me, hookId: 'fol.hook.audio_in' } }); assert.ok(w.ok && U.K.audio.isOnMaster(src, 'out'));
  });
  it('wired into another tool\u2019s knob it moves it: a loud input brightens Ripple through its cutoff', async () => {
    const hi = async (loud) => { const U = TH.universe(1.6), f = TH.spawn(U, 'eravos.level-follow'), r = TH.spawn(U, 'eravos.ripple'), c = OrganismFactory.handle(f).ctx, rc = OrganismFactory.handle(r).ctx;
      rc.params.set('cutoff', 200); rc.params.set('fEnv', 0); rc.params.set('sub', 0); await c.ready; await rc.ready;
      assert.ok(U.K.wires.register({ src: { instanceId: f, hookId: 'fol.hook.level' }, dst: { instanceId: r, hookId: 'ripple.hook.mod_cutoff' } }).ok, 'Level → Ripple cutoff');
      const inN = U.K.audio.ports(f).find(x => x.kind === 'audio' && x.direction === 'in').node; if (loud) burst(0, 1.6, 0.8)(U.ctx, inN);
      U.K.audio.chain.out.gain.value = 0; U.K.audio.ports(r).find(x => x.kind === 'audio' && x.direction === 'out').node.connect(U.ctx.destination);
      rc.noteOn(45, 0.9, 0.3, 1.2); const b = await TH.render(U), d = b.getChannelData(0); let h = 0, all = 0, y = 0; for (let i = Math.floor(0.6 * b.sampleRate); i < Math.floor(1.4 * b.sampleRate); i++) { const x = d[i], q = x - y; y = x; h += q * q; all += x * x; } return h / all; };
    const quiet = await hi(false), loud = await hi(true); assert.gt(loud, quiet * 3, `highs: nothing in ${quiet.toExponential(2)} → a loud input ${loud.toExponential(2)}`);
  });
});
window.__phase = window.__followWas;

/* P49.1 · MOTION CORE — any knob can be moved by an LFO or an Envelope (map eravos.phase49-map P49.1, decisions D-49.1…3).
 * James, 2026-10-22: "Motion core: any knob can be moved by an LFO or envelope."
 * The control-rate path samples a real (running) audio clock, so these tests use a live universe, not an offline render. */
window.__phase = 'P49';
describe('P49.1 · motion core — any knob takes an LFO or an Envelope', () => {
  const F = () => OrganismFactory, ctxOf = (id) => F().handle(id).ctx;
  async function liveU() { const K = Kernel.create({ quiet: true }); K.audio.boot(); await K.audio.ctx.resume(); const T = MasterTransport.create(K, { bpm: 120 }); T.boot(); return { K, T }; }
  const spawn = (U, id) => F().spawn(id, { K: U.K, headless: true });
  const wire = (U, a, ah, b, bh) => { const r = U.K.wires.register({ src: { instanceId: a, hookId: ah }, dst: { instanceId: b, hookId: bh } }); assert.ok(r.ok, `${ah} → ${bh}: ${JSON.stringify(r.fault || '')}`); return r.wire_id; };
  async function watch(id, key, ms) { const seen = []; const t0 = performance.now(); while (performance.now() - t0 < ms) { seen.push(ctxOf(id).params.get(key)); await TH.sleep(15); } return seen; }

  it('every knob of every sound tool has an input; knobs with their own input keep it; no hook id collides', () => {
    const music = F().defined().filter(d => d.domain === 'music'), without = [];
    music.forEach(d => {
      const ids = (d.hooks || []).map(h => h.hook_id); assert.equal(new Set(ids).size, ids.length, d.id + ': hook ids unique');
      const audio = (d.permissions || []).some(p => p === 'audio_out' || p === 'audio_in');
      if (!audio) { without.push(d.id); assert.equal((d._knobInputs || []).length, 0, d.id + ' has no audio, so no knob inputs'); return; }
      (d.config || []).filter(c => !c.hidden && !c.settingsOnly && c.motion !== false && (c.type === 'boolean' || (c.type === 'enum' && c.options.length > 1) || ((c.type === 'number' || c.type === 'integer') && c.max > c.min)))
        .forEach(c => assert.ok(UIKit.motion.knobHook(d, c.key), `${d.id}: “${c.key}” can be moved`));
    });
    assert.ok(without.length < 12, 'tools with no sound (no knob inputs): ' + without.join(', '));
    const wb = F().def('eravos.wobble-bass'); assert.equal(UIKit.motion.knobHook(wb, 'cutoff'), 'wobble.hook.mod_cutoff', 'a knob with its own audio-rate input keeps it');
    assert.ok(!wb.hooks.some(h => h.hook_id === 'knob.cutoff'), 'and gets no second one');
  });
  it('an LFO moves a knob that had no input before: the engine hears it, the saved value and the undo history do not change; unwired it is his again', async () => {
    const U = await liveU(), sub = spawn(U, 'eravos.wub-sub'), lfo = spawn(U, 'eravos.lfo');
    try {
      ctxOf(lfo).params.setMany({ sync: false, rate: 6, depth: 1, polarity: 'bipolar' });
      const P = ctxOf(sub).params, heard = []; P.onChange('cut', (v) => heard.push(v));
      let echoed = 0; U.K.bus.subscribe('ui:config_change:' + sub, (p) => { if (p.key === 'cut') echoed++; }, 'test');
      const w = wire(U, lfo, 'lfo.hook.mod_out', sub, 'knob.cut');
      const seen = await watch(sub, 'cut', 500);
      const lo = Math.min(...seen), hi = Math.max(...seen);
      assert.gt(hi - lo, 80, `it moves: ${lo.toFixed(0)}…${hi.toFixed(0)} Hz around its own 150`);
      assert.gt(heard.length, 5, 'the engine heard it move (' + heard.length + ' changes)');
      assert.equal(P.base('cut'), 150, 'its own value is unchanged'); assert.equal(ctxOf(sub).serialize().params.cut, 150, 'what is saved is unchanged');
      assert.equal(echoed, 0, 'no setting was sent: nothing for undo to take back');
      U.K.wires.remove(w, 'user'); await TH.sleep(40);
      assert.ok(!P.isLive('cut') && P.get('cut') === 150, 'unwired: the knob is its own value again');
    } finally { F().close(lfo); F().close(sub); await U.K.audio.ctx.close(); }
  });
  it('a choice moves too: an LFO on Wub Sub’s wave steps through its options', async () => {
    const U = await liveU(), sub = spawn(U, 'eravos.wub-sub'), lfo = spawn(U, 'eravos.lfo');
    try {
      ctxOf(lfo).params.setMany({ sync: false, rate: 5, depth: 1 });
      wire(U, lfo, 'lfo.hook.mod_out', sub, 'knob.wave');
      const seen = new Set(await watch(sub, 'wave', 500));
      assert.ok(seen.size >= 2 && [...seen].every(v => ['sine', 'triangle', 'warm'].includes(v)), 'it steps between real options: ' + [...seen].join(', '));
      assert.equal(ctxOf(sub).params.base('wave'), 'sine');
    } finally { F().close(lfo); F().close(sub); await U.K.audio.ctx.close(); }
  });
  it('an Envelope moves a knob on each note the tool plays', async () => {
    const U = await liveU(), sub = spawn(U, 'eravos.wub-sub'), env = spawn(U, 'eravos.syn-env');
    try {
      wire(U, env, 'env.hook.mod_out', sub, 'knob.cut');
      await TH.sleep(60); const before = ctxOf(sub).params.get('cut');
      U.K.bus.publish('note:trigger', { target: sub, note: 45, velocity: 1, time: U.K.audio.ctx.currentTime + 0.01, duration: 0.4 });
      const seen = await watch(sub, 'cut', 400);
      assert.gt(Math.max(...seen.map(v => Math.abs(v - before))), 20, `the note moved it from ${before.toFixed(0)} (peak ${Math.max(...seen).toFixed(0)})`);
    } finally { F().close(env); F().close(sub); await U.K.audio.ctx.close(); }
  });
  it('right-click a knob → Move with LFO opens one beside the window, wired; the menu then offers to stop it', async () => {
    if (!CanvasWM.world) { CanvasWM.init(document.getElementById('wmhost'), Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); }
    const K = Kernel, sub = F().spawn('eravos.wub-sub', { K, x: 30, y: 30 }); await TH.sleep(40); let lfo = null;
    try {
      const knob = Array.from(CanvasWM.windowOf(sub).querySelectorAll('.uk-knob')).find(k => k.querySelector('.uk-knob-label').textContent === 'Low-pass');
      assert.ok(knob, 'Wub Sub’s Low-pass knob');
      knob.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 200, clientY: 200 }));
      const menu = document.querySelector('.km'); assert.ok(menu, 'the menu opened');
      Array.from(menu.querySelectorAll('.km-item')).find(b => /LFO/.test(b.textContent)).click();
      lfo = K.registry.byOrganism('eravos.lfo').map(r => r.instance_id).find(i => K.wires.list().some(w => w.src.instanceId === i && w.dst.instanceId === sub && w.dst.hookId === 'knob.cut'));
      assert.ok(lfo, 'an LFO is on the canvas, wired to the knob');
      knob.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 200, clientY: 200 }));
      const stop = Array.from(document.querySelectorAll('.km .km-item.stop')); assert.equal(stop.length, 1, 'one mover to stop'); stop[0].click();
      assert.ok(!K.wires.list().some(w => w.dst.instanceId === sub && w.dst.hookId === 'knob.cut'), 'stopped: unwired');
    } finally { UIKit.motion.close(); if (lfo) F().close(lfo); F().close(sub); }
  });
});

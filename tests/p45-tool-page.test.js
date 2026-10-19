/* P45 · a whole page for every tool: its suite (all at once or one by one), mods per slot, sound packs, controls — spec eravos.tool-pages */
window.__phase = 'P45';
describe('P45 · tool pages — suites, mods one by one, sound packs', () => {
  const F = () => OrganismFactory, ctxOf = (id) => F().handle(id).ctx;
  const SUITES = ['eravos.wobble-bass', 'eravos.wub-osc', 'eravos.syn-osc', 'eravos.fx-destroyer'];
  const page = (U, defId, target) => ({ d: F().def(defId), K: U.K, target: target || null, made: new Map() });
  const hookOf = (defId, hookId) => (F().def(defId).hooks || []).find(h => h.hook_id === hookId);

  it('every suite names installed tools, presets they have, slots that fit and ports that exist', () => {
    for (const id of SUITES) {
      const d = F().def(id); assert.ok(d.suite && d.suite.members.length, id + ' has a suite');
      d.suite.members.forEach(m => {
        const md = F().def(m.tool); assert.ok(md, `${id}: ${m.tool} installed`);
        if (m.preset) assert.ok(md.presets && md.presets[m.preset], `${id}: ${m.tool} has preset “${m.preset}”`);
        if (m.as === 'mod') {
          const U = TH.universe(0.1), h = TH.spawn(U, id);
          assert.ok((d.slots || []).some(s => s.id === m.slot), `${id} has slot ${m.slot}`);
          assert.ok(Mods.compatible(h, m.slot).some(t => t.id === m.tool), `${m.tool} fits ${id}.${m.slot}`);
        }
        if (m.wire) [m.wire.from, m.wire.to].forEach(([ref, hook]) => {
          const owner = ref === 'host' ? id : ref === 'self' ? m.tool : ref;
          assert.ok(hookOf(owner, hook), `${id}: ${owner} has ${hook}`);
        });
      });
    }
  });
  it('“Load the whole suite” on Wobble Bass: two mods inside the growl with their presets, three tools wired into it', async () => {
    const U = TH.universe(1.2, { bpm: 140 }), w = TH.spawn(U, 'eravos.wobble-bass'), st = page(U, 'eravos.wobble-bass', w);
    const out = ToolPage.loadSuite(st);
    assert.equal(out.filter(Boolean).length, 5, 'every member loaded');
    const mods = Mods.entries(w); assert.deepEqual(mods.map(e => e.tool), ['eravos.fx-destroyer', 'eravos.fx-phaser']);
    const dz = ctxOf(mods[0].child), want = F().def('eravos.fx-destroyer').presets['Wub Grit · sub stays clean'].params;
    Object.keys(want).forEach(k => assert.equal(JSON.stringify(dz.params.get(k)), JSON.stringify(want[k]), 'Destroyer preset · ' + k));
    const into = U.K.wires.list().filter(x => x.dst.instanceId === w && /\.mod_/.test(x.dst.hookId)).map(x => x.dst.hookId).sort();
    assert.deepEqual(into, ['wobble.hook.mod_depth', 'wobble.hook.mod_fm', 'wobble.hook.mod_rate']);
    if (dz.ready) await dz.ready;
    TH.note(U, w, 33, 0.05, { duration: 1 }); const b = await TH.render(U);
    assert.gt(TH.db(TH.rms(b, 0.2, 1)), -40, 'the rig sounds');
  });
  it('one by one: a mod, then a linked tool, each on its own; with no window yet the first one opens the host', () => {
    const U = TH.universe(0.2), st = page(U, 'eravos.wub-osc');
    const m = st.d.suite.members, filt = m.find(x => x.tool === 'eravos.wub-filter'), rate = m.find(x => x.tool === 'eravos.wub-rate');
    assert.ok(ToolPage.load(st, filt), 'filter'); const host = st.target; assert.ok(host && ctxOf(host), 'a Wub Osc opened for it');
    const fid = st.made.get('eravos.wub-filter');
    assert.ok(U.K.wires.list().some(x => x.src.instanceId === host && x.dst.instanceId === fid), 'osc → filter');
    assert.ok(ToolPage.load(st, rate));
    assert.ok(U.K.wires.list().some(x => x.src.instanceId === st.made.get('eravos.wub-rate') && x.dst.instanceId === fid && x.dst.hookId === 'wubf.hook.mod_wub'), 'rate → the filter it came with');
    const u = ToolPage.addMod(st, 'tone', 'eravos.fx-echo'); assert.ok(u && Mods.childOf(host, u), 'any mod that fits, by itself');
  });
  it('a linked partner with no wire given is joined by the first ports that fit', () => {
    const U = TH.universe(0.2), w = TH.spawn(U, 'eravos.wub-rate'), st = page(U, 'eravos.wub-rate', w);
    const f = ToolPage.addLinked(st, 'eravos.wub-filter', { dir: 'out' });
    assert.ok(U.K.wires.list().some(x => x.src.instanceId === w && x.dst.instanceId === f && x.wire_type === 'modulation'), 'rate → filter');
    assert.ok(ToolPage.partners(F().def('eravos.wub-rate')).some(p => p.tool === 'eravos.wub-filter'));
  });
  it('sound packs: every preset is listed once under its pack, by the name its menu loads', () => {
    for (const id of SUITES) {
      const d = F().def(id), g = ToolPage.presetGroups(d), keys = g.flatMap(x => x.items.map(i => i.key));
      assert.equal(new Set(keys).size, keys.length, id + ' no duplicates');
      Object.keys(d.presets).forEach(k => assert.ok(keys.includes(k), `${id}: “${k}” listed`));
      keys.forEach(k => assert.ok(d.presets[k], `${id}: “${k}” loads`));
    }
  });
  it('Wobble Bass growl slot: a mod works on the wub only — the sub underneath stays as it was', async () => {
    // one-pole split at 70 Hz: low = the sub, high = what is left (the growl)
    const split = (b) => { const d = b.getChannelData(0), a = 1 - Math.exp(-2 * Math.PI * 70 / TH.SR); let y = 0, sl = 0, sh = 0, n = 0; for (let i = 0; i < d.length; i++) { y += a * (d[i] - y); if (i > 0.3 * TH.SR) { sl += y * y; sh += (d[i] - y) ** 2; n++; } } return { low: Math.sqrt(sl / n), high: Math.sqrt(sh / n) }; };
    const run = async (mod) => {
      const U = TH.universe(1), w = TH.spawn(U, 'eravos.wobble-bass'), c = ctxOf(w); c.params.setMany({ sub: 1, squash: 0 });
      if (mod) { const k = Mods.childOf(w, Mods.add(w, 'growl', 'eravos.wub-filter')); ctxOf(k).params.setMany({ mode: 'lowpass', cutoff: 40, range: 0, position: 0, mix: 1 }); }
      TH.note(U, w, 33, 0.05, { duration: 0.9 }); const b = await TH.render(U);
      return split(b);
    };
    const plain = await run(false), modded = await run(true);
    assert.lt(modded.high, plain.high * 0.75, `the mod darkens the growl: ${modded.high.toFixed(3)} vs ${plain.high.toFixed(3)}`);
    assert.lt(Math.abs(TH.db(modded.low) - TH.db(plain.low)), 2, `the sub is untouched: ${TH.db(modded.low).toFixed(1)} vs ${TH.db(plain.low).toFixed(1)} dB`);
  });
  it('the page: 📘 opens it with suite, mods, packs, controls and in/out; Load puts a preset on its window; Esc closes', () => {
    const K = Kernel, id = F().spawn('eravos.wobble-bass', { K });
    try {
      const el = ToolPage.open('eravos.wobble-bass', { instanceId: id, K });
      ['suite', 'mods', 'packs', 'controls', 'io'].forEach(s => assert.ok(el.querySelector(`[data-sec="${s}"]`), 'section ' + s));
      assert.equal(ToolPage.current().target, id);
      const pre = Array.from(el.querySelectorAll('.tp-pre')).find(r => r.querySelector('.tp-pn').title === 'Tearout Screech');
      assert.ok(pre, 'Tearout Screech listed'); Array.from(pre.querySelectorAll('button')).find(b => b.textContent === 'Load').click();
      const want = F().def('eravos.wobble-bass').presets['Tearout Screech'].params;
      Object.keys(want).forEach(k => assert.equal(JSON.stringify(ctxOf(id).params.get(k)), JSON.stringify(want[k]), 'loaded on its window · ' + k));
      el.querySelector('.tp-page').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      assert.ok(!ToolPage.isOpen() && !document.querySelector('.tp-overlay'), 'closed');
    } finally { ToolPage.close(); F().close(id); }
  });
  it('clicking a window\'s name opens its page; dragging the title bar does not', async () => {
    if (!CanvasWM.world) { CanvasWM.init(document.getElementById('wmhost'), Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); }
    const K = Kernel, id = F().spawn('eravos.wub-osc', { K, x: 40, y: 40 }); await TH.sleep(20);
    try {
      const t = CanvasWM.windowOf(id).querySelector('.wm-title'), r = t.getBoundingClientRect(), x = r.left + 5, y = r.top + r.height / 2;
      const ev = (type, dx) => t.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7, button: 0, clientX: x + (dx || 0), clientY: y }));
      ev('pointerdown'); ev('pointermove', 30); ev('pointerup', 30); assert.ok(!ToolPage.isOpen(), 'a drag moves the window, no page');
      ev('pointerdown'); ev('pointerup'); assert.ok(ToolPage.isOpen() && ToolPage.current().target === id, 'a click opens its page on that window');
      assert.ok(CanvasWM.windowOf(id).querySelector('.tp-open svg'), 'the page button is a drawn icon, not an emoji');
    } finally { ToolPage.close(); F().close(id); }
  });
});

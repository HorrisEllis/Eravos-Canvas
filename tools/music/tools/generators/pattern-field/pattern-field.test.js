/* Pattern (eravos.pattern-field) — tests that travel with the tool. The shared contract, then its own: it plays what emerges into a wired
 * instrument at the right steps; a change reaches the next step; the Workshop accepts its kind, an edit there changes the tool, a click locks. */
TH.toolContract('eravos.pattern-field');
window.__phase = 'P150';
describe('Pattern — the structure plays what emerges', () => {
  // a universe with the Pattern wired to a listening instrument; ticks published by hand (offline), notes collected
  function rig(params) {
    const U = TH.universe(0.2), a = TH.spawn(U, 'eravos.pattern-field'), c = OrganismFactory.handle(a).ctx, inst = TH.spawn(U, 'eravos.retro-poly');
    Object.entries(params || {}).forEach(([k, v]) => c.params.set(k, v));
    U.K.wires.register({ src: { instanceId: a, hookId: 'pf.hook.note_out' }, dst: { instanceId: inst, hookId: 'rp.hook.note_in' } });
    const got = []; U.K.bus.subscribe('note:trigger', (m) => { if (m && m.target === inst) got.push(m); }, 'test');
    const tick = (s) => U.K.bus.publish('transport:tick', { step16: s, time: s * 0.125, bar: Math.floor(s / 16) + 1, beat: 1, sixteenth: 1, stepDur: 0.125, bpm: 120 });
    return { U, a, c, inst, got, tick };
  }
  it('every step it plays is a note that emerged at that step, sent to the wired instrument', () => {
    const R = rig({ bars: 1, densStart: 1, densEnd: 1, densShape: 'hold' }), r = R.c.internals.result();
    for (let s = 0; s < 16; s++) R.tick(s);
    const want = r.notes.map(x => x.s + ':' + x.n).sort(), have = R.got.map(m => Math.round(m.time / 0.125) + ':' + m.note).sort();
    assert.ok(r.notes.length > 0, 'something emerged (' + r.notes.length + ')'); assert.deepEqual(have, want, 'the notes played are exactly the ones that emerged');
    assert.ok(R.got.every(m => m.duration > 0 && m.velocity > 0), 'each with a length and a velocity');
  });
  it('a change reaches the next step (live): density 0 → silence from then on', () => {
    const R = rig({ bars: 1, densStart: 1, densEnd: 1, densShape: 'hold' }); R.tick(0); const before = R.got.length;
    R.c.params.set('densStart', 0); R.c.params.set('densEnd', 0); for (let s = 1; s < 16; s++) R.tick(s);
    assert.ok(before >= 0 && R.got.length === before, 'nothing after density went to 0 (' + (R.got.length - before) + ' extra)');
  });
  it('a locked note always plays, whatever the shape', () => {
    const R = rig({ bars: 1, densStart: 0, densEnd: 0, densShape: 'hold', locked: [{ s: 3, n: 50 }] }); for (let s = 0; s < 16; s++) R.tick(s);
    assert.equal(R.got.length, 1, 'only the locked note'); assert.equal(R.got[0].note, 50, 'the locked pitch'); assert.equal(Math.round(R.got[0].time / 0.125), 3, 'at its step');
  });
});
describe('Pattern — in the Workshop', () => {
  it('its kind is accepted; Open in Workshop edits the tool live; a click on the surface locks a note; Apply and close', async () => {
    const hh = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(hh, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot();
    const id = OrganismFactory.spawn('eravos.pattern-field', { K: Kernel, x: 30, y: 30 }); await TH.sleep(80);
    try {
      assert.ok(Workshop.kinds().includes('music.pattern'), 'the Workshop knows the pattern kind'); assert.deepEqual(Workshop.check(MusicParts.PF_KIND), [], 'and it passes the check');
      const w = CanvasWM.windowOf(id), b = [...w.querySelectorAll('button')].find(x => /Open in Workshop/.test(x.textContent)); assert.ok(b, 'the window offers Open in Workshop'); b.click(); await TH.sleep(60);
      const ws = Workshop.current; assert.ok(ws && ws.kind === 'music.pattern' && document.querySelector('.ws-app'), 'the Workshop opened on the pattern');
      ws.set('densEnd', 0.2); await TH.sleep(40); assert.equal(OrganismFactory.handle(id).ctx.params.get('densEnd'), 0.2, 'an edit in the Workshop reached the tool (live)');
      assert.ok(ws.undo(), 'undo'); await TH.sleep(40); assert.equal(OrganismFactory.handle(id).ctx.params.get('densEnd'), 0.9, '… and the tool followed the undo');
      const cv = document.querySelector('.ws-canvas'), r = cv.getBoundingClientRect(), res = OrganismFactory.handle(id).ctx.internals.result(), n0 = res.notes.find(x => !x.locked);
      // click the first emerged note where the surface draws it (the kind's own geometry: steps across, notes up)
      const d = ws.doc(), steps = res.steps, lo = res.st.range[0], hi = res.st.range[1], x = 46 + (n0.s + 0.5) * ((r.width - 12 - 46) / steps), yb = r.height - (58 + 34), y = yb - (n0.n - lo + 0.5) * ((yb - 22) / (hi - lo + 1));
      cv.dispatchEvent(new PointerEvent('pointerdown', { clientX: r.left + x, clientY: r.top + y, bubbles: true })); await TH.sleep(40); void d;
      const L = OrganismFactory.handle(id).ctx.params.get('locked'); assert.ok(L.some(q => q.s === n0.s && q.n === n0.n), 'a click on a note locked it (' + JSON.stringify(L) + ')');
      assert.ok(ws.history().some(h => /LOCK/.test(h)), 'and it is in the history');
      ws.close(); assert.ok(!document.querySelector('.ws-app') && !Workshop.current, 'closed');
    } finally { if (Workshop.current) Workshop.current.close(); OrganismFactory.close(id); }
  });
});

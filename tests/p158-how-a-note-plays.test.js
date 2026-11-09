/* P158 — how a note plays (W3d, specs/eravos.workshop.spec ADDENDUM 2026-11-09 (2)). His words, 2026-11-09: "Yes the rest of the note shaping.
 * Enterprise grade. Studio quality." When it plays (pass k of every N, plays or skips), one note as a chord (voices, strum, direction, each voice
 * softer), the ratchet's shape (speeds up / slows down; velocity fades / flat / grows), humanize per play (seeded by the pass) — every one played
 * by the Timeline, measured from the triggers it sends; A / B on the Workshop. A note with none of it plays exactly as before. */
window.__phase = 'P158';
describe('P158 how a note plays', () => {
  const play = (notes, steps, extra) => { const ctx = new OfflineAudioContext(1, 8000, 8000), K = Kernel.create({ ctx, quiet: true, syncIR: true }), T = MasterTransport.create(K, { offline: true, bpm: 120 }); T.boot();
    const tl = OrganismFactory.spawn('eravos.timeline', { K, headless: true }), wb = OrganismFactory.spawn('eravos.wobble-bass', { K, headless: true });
    K.bus.publish('ui:lane_add:' + tl, { kind: 'inst', target: wb, name: 'Bass' }); K.bus.publish('ui:clip_add:' + tl, Object.assign({ kind: 'notes', target: wb, startBar: 1, bars: 1, notes }, extra || {}));
    const sent = []; K.bus.subscribe('note:trigger', (p) => { if (p.target === wb) sent.push(p); }); T.renderTicks(0, steps, 0.1);
    if (extra && extra.again) { const n1 = sent.length; T.renderTicks(0, steps, 0.1); sent.again = sent.slice(n1); sent.first = sent.slice(0, n1); } return sent; };
  const rep = { bars: 16, loop: 16 };
  it('when: pass 2 of every 4 plays 4 times in 16 passes; skips plays the other 12', () => {
    const r = play([{ s: 0, l: 1, n: 40, v: 0.9, x: { cond: { every: 4, at: 1 } } }], 16 * 16, rep); assert.equal(r.length, 4, 'plays on 4 of 16 passes');
    const step = 60 / 120 / 4, passOf = (p) => Math.round((p.time - r[0].time) / (16 * step)); assert.deepEqual(r.map(passOf), [0, 4, 8, 12], 'every 4th pass');
    assert.equal(play([{ s: 0, l: 1, n: 40, v: 0.9, x: { cond: { every: 4, at: 1, skip: true } } }], 16 * 16, rep).length, 12, 'skips: the other 12');
  });
  it('a chord from one note: its voices, strummed in order, each softer', () => {
    const r = play([{ s: 0, l: 4, n: 48, v: 0.9, x: { iv: [4, 7, 12], strum: 30, fall: 0.1 } }], 16);
    assert.deepEqual(r.map(p => p.note), [48, 52, 55, 60], 'root, third, fifth, octave');
    for (let i = 1; i < 4; i++) assert.near(r[i].time - r[i - 1].time, 0.03, 1e-6, 'strummed 30 ms apart');
    assert.ok(r[0].velocity > r[1].velocity && r[2].velocity > r[3].velocity, 'each voice softer');
    const d = play([{ s: 0, l: 4, n: 48, v: 0.9, x: { iv: [4, 7], strum: 20, dir: 'down' } }], 16); assert.deepEqual(d.map(p => p.note), [55, 52, 48], 'strummed down');
  });
  it('the ratchet\'s shape: hits speed up or slow down; velocity grows or stays flat', () => {
    const gaps = (r) => r.slice(1).map((p, i) => p.time - r[i].time);
    const acc = gaps(play([{ s: 0, l: 8, n: 40, v: 0.8, rt: 6, x: { rs: 'accel' } }], 16)), dec = gaps(play([{ s: 0, l: 8, n: 40, v: 0.8, rt: 6, x: { rs: 'decel' } }], 16));
    assert.ok(acc.every((g, i) => i === 0 || g < acc[i - 1] + 1e-9), 'speeds up: each gap shorter ' + acc.map(g => g.toFixed(3)));
    assert.ok(dec.every((g, i) => i === 0 || g > dec[i - 1] - 1e-9), 'slows down: each gap longer');
    const gr = play([{ s: 0, l: 8, n: 40, v: 0.8, rt: 4, x: { rv: 'grow' } }], 16).map(p => p.velocity), fl = play([{ s: 0, l: 8, n: 40, v: 0.8, rt: 4, x: { rv: 'flat' } }], 16).map(p => p.velocity);
    assert.ok(gr.every((v, i) => i === 0 || v > gr[i - 1]), 'grows'); assert.ok(fl.every(v => Math.abs(v - 0.8) < 1e-9), 'flat');
  });
  it('humanize: a little different each pass, the same pass the same every time, inside its range', () => {
    const r = play([{ s: 0, l: 1, n: 40, v: 0.7, x: { ht: 20, hv: 0.2 } }], 16 * 16, Object.assign({ again: true }, rep)), step = 60 / 120 / 4;
    const offs = r.first.map((p, i) => p.time - i * 16 * step - r.first[0].time + (r.first[0].time - Math.round(r.first[0].time / step) * step));
    assert.ok(new Set(r.first.map(p => p.velocity.toFixed(4))).size > 4, 'velocity varies across passes');
    assert.ok(r.first.every(p => p.velocity >= 0.5 - 1e-9 && p.velocity <= 0.9 + 1e-9), 'within ± 0.2');
    assert.deepEqual(r.again.map(p => p.velocity), r.first.map(p => p.velocity), 'the same passes play the same, every time');
    const t0 = play([{ s: 0, l: 1, n: 40, v: 0.7 }], 16 * 16, rep).map(p => p.time);
    assert.ok(r.first.every((p, i) => Math.abs(p.time - t0[i]) <= 0.020 + 1e-9) && r.first.some((p, i) => Math.abs(p.time - t0[i]) > 0.002), 'timing moves, within ± 20 ms'); void offs;
  });
  it('a note with none of it plays exactly as before (times, velocities, lengths)', () => {
    const notes = [{ s: 0, l: 4, n: 40, v: 0.9, rt: 4, mt: -0.3 }, { s: 4, l: 6, n: 43, v: 0.6 }, { s: 12, l: 2, n: 45, v: 0.8, rt: 3 }], r = play(notes, 16);
    const sd = 60 / 120 / 4, base = r[0].time + 0.3 * sd;   // the first note's nudge (−30 %) is clamped at the tick
    assert.equal(r.length, 4 + 1 + 3); assert.near(r[1].time - r[0].time, 4 * sd / 4, 1e-9, 'even ratchet as before');
    assert.ok(Math.abs(r[0].velocity - 0.9) < 1e-9 && Math.abs(r[1].velocity - 0.9 * (1 - 0.1 / 4)) < 1e-9, 'ratchet velocities as before');
    assert.near(r[4].duration, 6 * sd * 0.98, 1e-9, 'a plain note\'s length as before'); void base;
  });
  it('the Workshop: HOW IT PLAYS reaches the clip; A / B keeps a version and swaps', async () => {
    const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot();
    const view0 = Object.assign({}, CanvasWM.view), id = OrganismFactory.spawn('eravos.timeline', { x: 20, y: 20, w: 1300, h: 600 }), pub = (t, pl) => Kernel.bus.publish('ui:' + t + ':' + id, pl);
    try {
      await TH.sleep(150); pub('lane_add', { kind: 'inst', name: 'Lead' }); await TH.sleep(60); pub('clip_add', { kind: 'notes', startBar: 1, bars: 2, notes: [{ s: 0, l: 8, n: 60, v: 0.8, rt: 4 }, { s: 8, l: 8, n: 64, v: 0.7 }] }); await TH.sleep(80);
      const H = OrganismFactory.handle(id), clipOf = () => H.ctx.internals.clips.find(c => c.kind === 'notes'); H.view.openClip(clipOf().id); await TH.sleep(250);
      H.view.roll.openWorkshop(0); await TH.sleep(40); const ws = Workshop.current;
      ['When', 'Chord', 'Ratchet shape', 'Humanize'].forEach(w => assert.ok(Array.from(document.querySelectorAll('.ws-lay')).some(e => e.textContent.includes(w)), w + ' is a layer'));
      ws.action('SET A'); await TH.sleep(10);
      ws.set('x.chord', 'minor 9'); ws.set('x.strum', 40); ws.set('x.every', 4); ws.set('x.at', 3); ws.set('x.rs', 'speeds up'); ws.set('x.ht', 12); await TH.sleep(30);
      const x = clipOf().notes[0].x; assert.deepEqual(x.iv, [3, 7, 10, 14], 'the chord'); assert.equal(x.strum, 40); assert.deepEqual(x.cond, { every: 4, at: 2 }, 'pass 3 of every 4'); assert.equal(x.rs, 'accel'); assert.equal(x.ht, 12);
      const errs = []; const oe = console.error; console.error = (...a) => { errs.push(a.join(' ')); oe.apply(console, a); }; try { ws.view({ mode: '3d' }); ws.view({ mode: '2d' }); } finally { console.error = oe; } assert.equal(errs.length, 0, 'drawn in 2D and 3D: ' + errs.join(' | '));
      assert.ok(ws.action('⇄ A/B')); await TH.sleep(20); assert.ok(!clipOf().notes[0].x, 'A/B: back to A (no x)');
      ws.action('⇄ A/B'); await TH.sleep(20); assert.deepEqual(clipOf().notes[0].x.iv, [3, 7, 10, 14], 'and to B again');
      ws.set('x.chord', 'none'); ws.set('x.every', 1); ws.set('x.rs', 'even'); ws.set('x.ht', 0); ws.set('x.strum', 0); await TH.sleep(20); assert.ok(!clipOf().notes[0].x, 'every default: nothing stored');
    } finally { if (window.Workshop && Workshop.current) Workshop.current.close(); OrganismFactory.close(id); CanvasWM.view = view0; CanvasWM.applyView(); }
  });
});

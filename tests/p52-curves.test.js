/* P52.6a · timeline CURVES — notes that bend, drawn in the piano roll (map eravos.phase52-map). James, 2026-10-22: "What about
 * curvature? like bending notes, drawing." · "needs to have the timeline curves" */
window.__phase = 'P52';
describe('P52.6a · curves — draw a note’s bend; the instrument follows it, sample-accurate', () => {
  const HI = 107, F = () => OrganismFactory;
  function roll(notes) {
    const log = [], view = { ui: UIKit, emit: (k, p) => log.push([k, p]) };
    const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;width:900px;height:420px;z-index:99999;background:#000';
    document.body.appendChild(host);
    const pr = EravosTimelinePianoRoll.create(view, {}); host.appendChild(pr.el);
    pr.show({ id: 'c1', bars: 2, startBar: 1, notes }, { id: 'l1', name: 'Lead', color: '#66aaff' }, { key: { root: 0, scale: 'minor' } });
    const cv = pr.canvas, pt = (s, n) => { const r = cv.getBoundingClientRect(), st = pr.state, k = r.width / cv.offsetWidth; return { clientX: r.left + s * st.pps * k, clientY: r.top + ((HI - n) * st.row + st.row / 2) * k }; };
    const fire = (type, p, extra) => cv.dispatchEvent(new (type === 'dblclick' ? MouseEvent : PointerEvent)(type, Object.assign({ bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', button: 0, buttons: type === 'pointerup' ? 0 : 1 }, p, extra || {})));
    return { pr, log, pt, fire, done: () => host.remove(), notes: () => pr.state.notes, edits: () => log.filter(x => x[0] === 'clip_edit').length };
  }
  // zero crossings per second in [a, b) seconds of channel 0 — a pitch reading for a plain wave
  const zcr = (buf, a, b) => { const d = buf.getChannelData(0), i0 = Math.floor(a * TH.SR), i1 = Math.floor(b * TH.SR); let n = 0; for (let i = i0 + 1; i < i1; i++) if ((d[i - 1] < 0) !== (d[i] < 0)) n++; return n / (b - a); };

  it('the Bend tool (6) draws a curve on a note: up 12 rows = +12 st at its end, one undo step; double-click clears it', () => {
    const r = roll([{ s: 0, l: 8, n: 60, v: 0.8 }]);
    try {
      r.pr.setTool('bend');
      r.fire('pointerdown', r.pt(0.2, 60));
      for (let k = 1; k <= 12; k++) r.fire('pointermove', r.pt(0.2 + 7.6 * k / 12, 60 + k));
      r.fire('pointerup', r.pt(7.8, 72));
      const b = r.notes()[0].b; assert.ok(Array.isArray(b) && b.length >= 6, 'a curve of points: ' + JSON.stringify(b));
      assert.ok(Math.abs(b[b.length - 1][1] - 12) < 0.6 && b[b.length - 1][0] > 0.9, 'ends near +12 st at the end of the note: ' + JSON.stringify(b[b.length - 1]));
      for (let k = 1; k < b.length; k++) assert.ok(b[k][0] > b[k - 1][0], 'points move forward in time');
      assert.equal(r.edits(), 1, 'one commit (one undo step)'); assert.equal(r.notes()[0].n, 60, 'the note itself did not move');
      r.fire('dblclick', r.pt(4, 60)); assert.ok(!r.notes()[0].b, 'double-click cleared it'); assert.equal(r.edits(), 2);
    } finally { r.done(); }
  });
  it('the timeline keeps a curve through save/load, and sends it with the note', () => {
    const U = TH.universe(0.3, { bpm: 120 }), tl = TH.spawn(U, 'eravos.timeline'), sub = TH.spawn(U, 'eravos.wub-sub'), c = F().handle(tl).ctx;
    const bend = [[0, 0], [0.5, 7], [1, 12]], st = c.serialize();
    st.extra = { lanes: [{ id: 'L1', kind: 'inst', name: 'Bass', color: '#66ffcc', gain: 1, pan: 0, mute: false, solo: false, armed: false, target: sub }],
      clips: [{ id: 'C1', kind: 'notes', lane: 'L1', name: 'bend', startBar: 1, bars: 1, notes: [{ s: 0, l: 4, n: 45, v: 0.9, b: bend }, { s: 8, l: 4, n: 45, v: 0.9 }] }], markers: [] };
    c.deserialize(JSON.parse(JSON.stringify(st)));
    const kept = c.serialize().extra.clips[0].notes; assert.deepEqual(kept[0].b, bend, 'kept through load'); assert.ok(!kept[1].b, 'a straight note stays straight');
    const sent = []; U.K.bus.subscribe('note:trigger', (p) => { if (p.target === sub) sent.push(p); }, 'test');
    U.T.renderTicks(0, 16, 0.05);
    assert.equal(sent.length, 2); assert.deepEqual(sent[0].bend, bend, 'the curve goes out with the note'); assert.ok(!sent[1].bend);
  });
  it('a mono tool follows it (Wub Sub: +12 st over the note = twice the pitch at the end), and the next straight note is straight', async () => {
    const U = TH.universe(2.2), id = TH.spawn(U, 'eravos.wub-sub'), c = F().handle(id).ctx; c.params.setMany({ wave: 'sine', octave: 0, cut: 400, glide: 0 });
    U.K.bus.publish('note:trigger', { target: id, note: 57, velocity: 0.9, time: 0.05, duration: 1, bend: [[0, 0], [0.3, 0], [0.7, 12], [1, 12]] });
    U.K.bus.publish('note:trigger', { target: id, note: 57, velocity: 0.9, time: 1.2, duration: 0.9 });
    const b = await TH.render(U), start = zcr(b, 0.1, 0.3), end = zcr(b, 0.8, 1.0), next = zcr(b, 1.35, 1.95);
    assert.ok(end / start > 1.8 && end / start < 2.2, `an octave up at the end: ${start.toFixed(0)} → ${end.toFixed(0)} crossings/s`);
    assert.ok(Math.abs(next / start - 1) < 0.1, `the next note, straight: ${next.toFixed(0)} vs ${start.toFixed(0)}`);
  });
  it('a poly tool follows it per note (Retro Poly: the bent note rises, the note played with it does not)', async () => {
    const run = async (bend) => {
      const U = TH.universe(1.3), id = TH.spawn(U, 'eravos.retro-poly'), c = F().handle(id).ctx;
      c.params.setMany({ saw: 0, pulse: 0, sub: 0.0001, noise: 0, drift: 0, unison: 1, chorus: 'off', cutoff: 18000, res: 0, envAmt: 0, mono: false, attack: 0.002, sustain: 1, release: 0.05, octave: 0 });
      U.K.bus.publish('note:trigger', Object.assign({ target: id, note: 57, velocity: 0.9, time: 0.05, duration: 1.1 }, bend ? { bend } : {}));
      return TH.render(U);
    };
    const flat = await run(null), bent = await run([[0, 0], [0.5, 12], [1, 12]]);
    const f0 = zcr(flat, 0.8, 1.1), f1 = zcr(bent, 0.8, 1.1);
    assert.gt(f0, 0, 'Retro Poly made sound');
    assert.ok(f1 / f0 > 1.7 && f1 / f0 < 2.3, `the bent note is an octave up at its end: ${f0.toFixed(0)} → ${f1.toFixed(0)} crossings/s`);
  });
});

/* Timeline (eravos.timeline) — tests that travel with the tool. The contract is shared (tests/harness.js
 * TH.toolContract): spawns clean, every shipped preset loads in range, save → load is exact, closing leaves nothing behind,
 * Stop all is obeyed. Add this tool's own tests below it. */
TH.toolContract('eravos.timeline');

// 3.48 piano roll precision (timeline.spec § 3.48 P1–P2): real pointer events on a real roll, at canvas zoom 1 and 0.6
describe('tool · Timeline — piano roll precision (3.48)', () => {
  const HI = 107;
  function roll(o) {
    o = o || {};
    const log = [], view = { ui: UIKit, emit: (k, p) => log.push([k, p]) };
    const host = document.createElement('div'); host.style.cssText = `position:fixed;left:0;top:0;width:900px;height:420px;transform-origin:0 0;transform:scale(${o.z || 1});z-index:99999;background:#000`;
    document.body.appendChild(host);
    const pr = EravosTimelinePianoRoll.create(view, {}); host.appendChild(pr.el);
    const clip = { id: 'c1', bars: 2, startBar: 3, notes: o.notes || [] };
    pr.show(clip, { id: 'l1', name: 'Lead', color: '#ff66cc' }, { key: { root: 0, scale: 'minor' } });
    const cv = pr.canvas;
    // client point of (step, midi) — through the window's zoom, like a hand
    const pt = (s, n, dx) => { const r = cv.getBoundingClientRect(), st = pr.state, k = r.width / cv.offsetWidth; return { clientX: r.left + (s * st.pps + (dx || 0)) * k, clientY: r.top + ((HI - n) * st.row + st.row / 2) * k }; };
    const fire = (type, p, extra) => cv.dispatchEvent(new PointerEvent(type, Object.assign({ bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', button: 0, buttons: type === 'pointerup' ? 0 : 1 }, p, extra || {})));
    const click = (s, n, extra, wobble) => { fire('pointerdown', pt(s, n), extra); if (wobble) fire('pointermove', pt(s, n, wobble), extra); fire('pointerup', pt(s, n, wobble || 0), extra); };
    const dragTo = (a, b, extra) => { fire('pointerdown', pt(a[0], a[1], a[2]), extra); for (let i = 1; i <= 6; i++) fire('pointermove', pt(a[0] + (b[0] - a[0]) * i / 6, a[1], (a[2] || 0) + ((b[2] || 0) - (a[2] || 0)) * i / 6), extra); fire('pointerup', pt(b[0], b[1], b[2]), extra); };
    const done = () => host.remove();
    const key = (k, o2) => cv.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, o2 || {})));
    return { pr, log, pt, fire, click, dragTo, key, done, notes: () => pr.state.notes, edits: () => log.filter(x => x[0] === 'clip_edit').length };
  }

  it('expression lane: pick a knob, draw a value onto a note, right-click hands it back to the knob', () => {
    const r = roll({ notes: [{ s: 0, l: 4, n: 60, v: 0.8 }, { s: 8, l: 4, n: 63, v: 0.8 }] });
    try {
      const knobs = { t1: [{ key: 'depth', label: 'Depth', type: 'number', min: 0, max: 8, step: 0.01, def: 3 }, { key: 'div', label: 'Wobble rate', type: 'enum', options: ['1/4', '1/8', '1/16'], def: '1/8' }] };
      r.pr.show({ id: 'c1', bars: 2, startBar: 3, notes: r.notes() }, { id: 'l1', name: 'Bass', color: '#66ffcc', target: 't1' }, { key: { root: 0, scale: 'minor' }, knobs });
      r.pr.setLane('depth'); assert.equal(r.pr.lane, 'depth');
      const vel = r.pr.vel, rc = vel.getBoundingClientRect(), k = rc.width / vel.offsetWidth, st = r.pr.state;
      const at = (s, frac, btn) => ({ clientX: rc.left + (s * st.pps + 3) * k, clientY: rc.top + (4 + (1 - frac) * (vel.offsetHeight - 6)) * (rc.height / vel.offsetHeight), button: btn || 0, buttons: btn === 2 ? 2 : 1 });
      const fire = (type, p) => vel.dispatchEvent(new PointerEvent(type, Object.assign({ bubbles: true, cancelable: true, pointerId: 2, pointerType: 'mouse' }, p, type === 'pointerup' ? { buttons: 0 } : {})));
      fire('pointerdown', at(0, 1)); fire('pointerup', at(0, 1));
      const edit = () => r.log.filter(x => x[0] === 'clip_edit').pop()[1].patch.notes;
      assert.near(edit()[0].p.depth, 8, 0.05, 'top of the lane = the knob’s max'); assert.equal(edit()[1].p, undefined, 'the other note still uses the knob');
      r.pr.setLane('div'); fire('pointerdown', at(8, 0)); fire('pointerup', at(8, 0)); assert.equal(edit()[1].p.div, '1/4', 'enum: bottom = first option');
      r.pr.setLane('depth'); fire('pointerdown', at(0, 0.5, 2)); fire('pointerup', at(0, 0.5, 2)); assert.equal(edit()[0].p, undefined, 'right-click: back to the knob');
    } finally { r.done(); }
  });
  // 3.53 "a way to full screen the notes screen, its cramped"
  it('⛶ full screen: the roll fills the window, clicks still land on their cell, Esc puts it back where it was', () => {
    const r = roll({ z: 0.6 }), home = r.pr.el.parentNode;
    try {
      const btn = [...r.pr.el.querySelectorAll('button')].find(b => /Full screen/.test(b.textContent)); assert.ok(btn, 'a ⛶ button in the roll'); btn.click();
      assert.ok(r.pr.full, 'full'); assert.equal(r.pr.el.parentNode, document.body, 'moved out of the zoomed canvas');
      const rc = r.pr.el.getBoundingClientRect(); assert.near(rc.width, innerWidth, 2); assert.near(rc.height, innerHeight, 2);
      r.click(6, 65); assert.equal(r.notes().length, 1); assert.equal(r.notes()[0].s, 6); assert.equal(r.notes()[0].n, 65);
      r.key('Escape'); assert.ok(r.pr.full, 'the first Esc only clears the selection (the new note)');
      r.key('Escape'); assert.ok(!r.pr.full, 'the next Esc leaves full screen'); assert.equal(r.pr.el.parentNode, home, 'back in its window');
      btn.click(); r.pr.hide(); assert.ok(!r.pr.full && r.pr.el.parentNode === home, 'closing the clip leaves full screen too');
    } finally { if (r.pr.full) r.pr.setFull(false); r.done(); }
  });
  [1, 0.6].forEach(z => it(`a click with a 3 px wobble lands exactly on the ghost's cell (canvas zoom ${z})`, () => {
    const r = roll({ z });
    try {
      r.fire('pointermove', r.pt(4.6, 60), { buttons: 0 });           // hover: the ghost shows cell 4
      r.click(4.6, 60, {}, 3);
      assert.equal(r.notes().length, 1); assert.equal(r.notes()[0].s, 4, 'cell 4, not 5'); assert.equal(r.notes()[0].n, 60);
      assert.equal(r.notes()[0].l, 4, 'the default length (a beat)');
    } finally { r.done(); }
  }));
  it('the old drift is gone: sliding inside the clicked cell and row (past the dead zone) never moves the note', () => {
    const r = roll();
    try {
      r.pr.zoomTo(8);                                                    // S zoom: a 1/16 cell is 8 px, a row 11 px
      const st = r.pr.state, p0 = r.pt(4.1, 60); p0.clientY -= st.row * 0.4;   // near the top-left of cell 4 / row C4
      const p1 = { clientX: p0.clientX + 0.8 * st.pps, clientY: p0.clientY + st.row * 0.75 };   // 6.4 px right, 8 px down: same cell, same row
      r.fire('pointerdown', p0); r.fire('pointermove', p1); r.fire('pointerup', p1);
      assert.deepEqual([r.notes()[0].s, r.notes()[0].n], [4, 60], 'was moved to step 5 and B3 by round(distance)');
      // a real drag still moves it, cell by cell
      r.dragTo([4.5, 60], [7.5, 60]); assert.equal(r.notes()[0].s, 7, 'dragged three cells');
    } finally { r.done(); }
  });
  it('paint across 8 cells at 1/16 adds 8 notes, one per cell, in one undo step', () => {
    const r = roll();
    try { r.pr.setTool('paint'); r.dragTo([0.5, 60], [7.5, 60]); const ns = r.notes();
      assert.deepEqual(ns.map(n => n.s), [0, 1, 2, 3, 4, 5, 6, 7]); assert.ok(ns.every(n => n.l === 1 && n.n === 60)); assert.equal(r.edits(), 1, 'one commit'); }
    finally { r.done(); }
  });
  it('erase drag removes exactly the notes it crosses', () => {
    const r = roll({ notes: [0, 2, 4, 6].map(s => ({ s, l: 1, n: 60, v: 0.8 })).concat([{ s: 2, l: 1, n: 63, v: 0.8 }]) });
    try { r.pr.setTool('erase'); r.dragTo([1.5, 60], [4.5, 60]);
      assert.deepEqual(r.notes().map(n => n.s + ':' + n.n).sort(), ['0:60', '2:63', '6:60']); }
    finally { r.done(); }
  });
  it('triplet grid places on thirds exactly; Alt places freely', () => {
    const r = roll();
    try {
      r.pr.setGrid('16t'); r.click(1.0, 60); const s = r.notes()[0].s; assert.lt(Math.abs(s - 2 / 3), 1e-9, 'cell 2/3'); assert.equal(Math.round(s * 192), s * 192, 'exact at the engine resolution');
      r.pr.setGrid('1'); r.click(4.6, 63, { altKey: true }); assert.equal(r.notes()[1].s, 4.5, 'free: 1/128-note cells');
    } finally { r.done(); }
  });
  it('stretch from the left edge keeps the end; the next note takes that length', () => {
    const r = roll({ notes: [{ s: 4, l: 4, n: 60, v: 0.8 }] });
    try {
      r.dragTo([4, 60, 1], [2, 60, 1]);
      assert.deepEqual([r.notes()[0].s, r.notes()[0].l], [2, 6], 'start 2, end still 8');
      r.click(12.2, 63); assert.equal(r.notes()[1].l, 6 > 32 - 12 ? 20 : 6, 'last length');
      r.dragTo([12, 63, 6 * r.pr.state.pps - 2], [15, 63, 0]); assert.equal(r.notes()[1].l, 3, 'right edge: end at 15');
    } finally { r.done(); }
  });
  it('split cuts a note at the grid line; the ruler moves the playhead to song time', () => {
    const r = roll({ notes: [{ s: 0, l: 8, n: 60, v: 0.8 }] });
    try {
      r.pr.setTool('split'); r.click(3.2, 60);
      assert.deepEqual(r.notes().map(n => [n.s, n.l]), [[0, 3], [3, 5]]);
      const rr = r.pr.ruler.getBoundingClientRect(), k = rr.width / r.pr.ruler.offsetWidth;
      r.pr.ruler.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 2, clientX: rr.left + 16 * r.pr.state.pps * k + 1, clientY: rr.top + 5, buttons: 1 }));
      const seek = r.log.filter(x => x[0] === 'seek').pop(); assert.ok(seek, 'seek sent'); assert.equal(seek[1].bar, 4, 'step 16 of a clip at bar 3 = bar 4');
    } finally { r.done(); }
  });

  // P3 + P4
  const four = () => [0, 2, 4, 6].map((s, i) => ({ s, l: 1, n: [60, 63, 67, 70][i], v: 0.8 }));
  it('box select, then ← nudges every selected note one grid step — one undo step', () => {
    const r = roll({ notes: four() });
    try {
      r.pr.setTool('select'); r.fire('pointerdown', r.pt(1.5, 72)); r.fire('pointermove', r.pt(5.5, 62)); r.fire('pointerup', r.pt(5.5, 62));
      assert.deepEqual(r.pr.selected, [1, 2], 'the box touched D#4 at 2 and G4 at 4');
      const before = r.edits(); r.key('ArrowLeft'); assert.equal(r.edits(), before + 1, 'one commit');
      assert.deepEqual(r.notes().map(n => n.s), [0, 1, 3, 6]);
    } finally { r.done(); }
  });
  it('Shift-click builds a selection; dragging one moves them all; Ctrl+drag copies; an edge stretches them all', () => {
    const r = roll({ notes: four() });
    try {
      r.click(0.5, 60); r.click(4.5, 67, { shiftKey: true }); assert.deepEqual(r.pr.selected, [0, 2]);
      r.dragTo([0.5, 60], [2.5, 60]); assert.deepEqual(r.notes().map(n => n.s), [2, 2, 6, 6], 'both moved two steps');
      r.dragTo([2.5, 60], [8.5, 60], { ctrlKey: true }); assert.equal(r.notes().length, 6, 'copies made'); assert.deepEqual(r.notes().slice(4).map(n => n.s), [8, 12]);
      const pps = r.pr.state.pps; r.dragTo([8, 60, pps - 2], [10, 60, 0]); assert.deepEqual(r.notes().slice(4).map(n => n.l), [2, 2], 'both stretched to 2');
    } finally { r.done(); }
  });
  it('copy → paste at the pointer; Ctrl+D duplicates right after itself', () => {
    const r = roll({ notes: four().slice(0, 2) });
    try {
      r.key('a', { ctrlKey: true }); r.key('c', { ctrlKey: true });
      r.fire('pointermove', r.pt(16.2, 60), { buttons: 0 }); r.key('v', { ctrlKey: true });
      assert.deepEqual(r.notes().map(n => n.s), [0, 2, 16, 18], 'pasted at step 16, spacing kept');
      r.key('d', { ctrlKey: true }); assert.deepEqual(r.notes().slice(4).map(n => n.s), [19, 21], 'duplicate starts where the selection ends (3 steps long)');
    } finally { r.done(); }
  });
  it('quantize pulls starts by the chosen strength; legato fills the gaps', () => {
    const r = roll({ notes: [{ s: 1.25, l: 0.5, n: 60, v: 0.8 }, { s: 4.75, l: 0.5, n: 63, v: 0.8 }] });
    try {
      r.pr.el.querySelector('select[aria-label="Quantize"]').value = '0.5'; r.pr.el.querySelector('select[aria-label="Quantize"]').dispatchEvent(new Event('change'));
      r.key('q'); assert.deepEqual(r.notes().map(n => n.s), [1.125, 4.875], 'half way to 1 and 5');
      r.key('l'); assert.equal(r.notes()[0].l, 3.75, 'the first lasts until the second');
    } finally { r.done(); }
  });
  it('velocity lane: drag sets the velocity of the note under the pointer; Ctrl-drag ramps across notes', () => {
    const r = roll({ notes: four() });
    try {
      const v = r.pr.vel, b = v.getBoundingClientRect(), k = b.width / v.offsetWidth, pps = r.pr.state.pps, P = (s, frac) => ({ clientX: b.left + s * pps * k + 2, clientY: b.top + (4 + (1 - frac) * 40) * k });
      const ev = (t, p, o2) => v.dispatchEvent(new PointerEvent(t, Object.assign({ bubbles: true, pointerId: 3, buttons: t === 'pointerup' ? 0 : 1 }, p, o2 || {})));
      ev('pointerdown', P(0.1, 0.25)); ev('pointerup', P(0.1, 0.25)); assert.lt(Math.abs(r.notes()[0].v - 0.25), 0.03, 'note 1 at a quarter');
      ev('pointerdown', P(1.8, 0.2), { ctrlKey: true }); ev('pointermove', P(6, 1)); ev('pointerup', P(6, 1));
      const vs = r.notes().slice(1).map(n => n.v); assert.ok(vs[0] < vs[1] && vs[1] < vs[2] && vs[2] > 0.95, 'a rising ramp: ' + vs.join(','));
    } finally { r.done(); }
  });
  it('the note\'s knobs: start on the grid, length, pitch, velocity — live, then one undo step', () => {
    const r = roll({ notes: [{ s: 0, l: 1, n: 60, v: 0.8 }] });
    try {
      const k = r.pr.openEditor(0); assert.ok(r.pr.el.querySelectorAll('.tlpr-edit .uk-knob, .tlpr-edit svg').length >= 4, 'four knobs, no text boxes');
      assert.equal(r.pr.el.querySelectorAll('.tlpr-edit input').length, 0, 'nothing to type');
      const before = r.edits(); k.start(21.4); k.length(2.2); k.pitch(63); k.velocity(100); k.finish();
      const n = r.notes()[0]; assert.deepEqual([n.s, n.l, n.n], [21, 2, 63], 'start snapped to the 1/16 grid');
      assert.equal(n.v, Math.round(100 / 127 * 100) / 100); assert.equal(r.edits(), before + 1, 'one commit');
    } finally { r.done(); }
  });
  it('step input: keys land at the cursor and advance it; Space rests; Backspace steps back and removes', () => {
    const r = roll();
    try {
      r.pr.setStep(true); ['z', 'x', ' ', 'c', 'q'].forEach(k => r.key(k));
      assert.deepEqual(r.notes().map(n => [n.s, n.n]), [[0, 60], [1, 62], [3, 63], [4, 72]], 'C D (rest) Eb (scale) C5');
      r.key('Backspace'); assert.equal(r.notes().length, 3); assert.equal(r.pr.state.cursor, 4);
    } finally { r.done(); }
  });
});

// 3.53 — "what if we can do different configurations per note, wobble, depth, oscillation, giving full range and depth to the timeline"
window.__phase = 'P53';
describe('tool · Timeline — per-note settings (expression lanes)', () => {
  const uni = (sec) => { const ctx = new OfflineAudioContext(1, Math.ceil(sec * 8000), 8000), K = Kernel.create({ ctx, quiet: true, syncIR: true }), T = MasterTransport.create(K, { offline: true, bpm: 120 }); T.boot(); return { ctx, K, T }; };
  it('a note keeps its own settings through every edit, and the timeline sends them with the note', () => {
    const U = uni(0.5), tl = OrganismFactory.spawn('eravos.timeline', { K: U.K, headless: true }), wb = OrganismFactory.spawn('eravos.wobble-bass', { K: U.K, headless: true }), c = OrganismFactory.handle(tl).ctx;
    U.K.bus.publish('ui:lane_add:' + tl, { kind: 'inst', target: wb, name: 'Bass' });
    U.K.bus.publish('ui:clip_add:' + tl, { kind: 'notes', target: wb, startBar: 1, bars: 1, notes: [{ s: 0, l: 4, n: 40, v: 0.9, p: { depth: 7.5, div: '1/16', junk: { x: 1 }, 'bad key!': 2 } }, { s: 8, l: 4, n: 40, v: 0.9 }] });
    const clip = c.serialize().extra.clips.find(x => x.kind === 'notes');
    assert.deepEqual(clip.notes[0].p, { depth: 7.5, div: '1/16' }, 'kept, cleaned'); assert.equal(clip.notes[1].p, undefined, 'a plain note stays plain');
    const sent = []; U.K.bus.subscribe('note:trigger', (p) => sent.push(p)); U.T.renderTicks(0, 16, 0.1);
    assert.deepEqual(sent[0].params, { depth: 7.5, div: '1/16' }); assert.equal(sent[1].params, undefined);
  });
  it('the tool takes the note’s value for that note only — never saved, never undone — then its own knob again', async () => {
    const U = uni(2), a = OrganismFactory.spawn('eravos.wobble-bass', { K: U.K, headless: true }), w = OrganismFactory.handle(a).ctx, base = w.params.get('depth'), seen = {};
    U.K.bus.publish('note:trigger', { target: a, note: 40, velocity: 0.9, time: 0.2, duration: 0.6, params: { depth: 7.5, nonsense: 3 } });
    seen.during0 = w.params.get('depth');                       // nothing sounding before it: taken at once (the voice is built with it)
    U.ctx.suspend(0.5).then(() => { seen.mid = w.params.get('depth'); seen.saved = w.serialize().params.depth; U.ctx.resume(); });
    U.ctx.suspend(1.2).then(() => { seen.after = w.params.get('depth'); U.ctx.resume(); });
    await U.ctx.startRendering();
    assert.equal(seen.during0, 7.5); assert.equal(seen.mid, 7.5); assert.equal(seen.saved, base, 'the saved knob is untouched'); assert.equal(seen.after, base, 'handed back after the note');
  });
  it('legato: the next note’s value lands at ITS start, not while the earlier note still sounds', async () => {
    const U = uni(2), a = OrganismFactory.spawn('eravos.wobble-bass', { K: U.K, headless: true }), w = OrganismFactory.handle(a).ctx, seen = {};
    U.K.bus.publish('note:trigger', { target: a, note: 40, velocity: 0.9, time: 0.2, duration: 0.8, params: { depth: 1 } });
    U.K.bus.publish('note:trigger', { target: a, note: 43, velocity: 0.9, time: 0.6, duration: 0.6, params: { depth: 6 } });   // overlaps the first
    U.ctx.suspend(0.45).then(() => { seen.first = w.params.get('depth'); U.ctx.resume(); });
    U.ctx.suspend(0.8).then(() => { seen.second = w.params.get('depth'); U.ctx.resume(); });
    U.ctx.suspend(1.0625).then(() => { seen.afterFirstEnds = w.params.get('depth'); U.ctx.resume(); });
    await U.ctx.startRendering();
    assert.equal(seen.first, 1, 'the first note keeps its own value'); assert.equal(seen.second, 6); assert.equal(seen.afterFirstEnds, 6, 'the first note ending does not hand back a knob the second note holds');
  });
  it('Stop all hands every knob back', () => {
    const U = uni(0.3), a = OrganismFactory.spawn('eravos.wobble-bass', { K: U.K, headless: true }), w = OrganismFactory.handle(a).ctx, base = w.params.get('depth');
    U.K.bus.publish('note:trigger', { target: a, note: 40, velocity: 0.9, time: 0, duration: 5, params: { depth: 7 } });
    assert.equal(w.params.get('depth'), 7); U.K.silence({ hard: true, reason: 'test' }); assert.equal(w.params.get('depth'), base);
  });
});

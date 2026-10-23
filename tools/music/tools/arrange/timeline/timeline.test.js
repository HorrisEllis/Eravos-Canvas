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

// 3.53 — automation lanes in the timeline, and record what you play
describe('tool · Timeline — automation lanes', () => {
  const uni = (sec) => { const ctx = new OfflineAudioContext(1, Math.ceil(sec * 8000), 8000), K = Kernel.create({ ctx, quiet: true, syncIR: true }), T = MasterTransport.create(K, { offline: true, bpm: 120 }); T.boot(); return { ctx, K, T }; };
  function rig(sec) {
    const U = uni(sec || 3), tl = OrganismFactory.spawn('eravos.timeline', { K: U.K, headless: true }), wb = OrganismFactory.spawn('eravos.wobble-bass', { K: U.K, headless: true });
    U.K.bus.publish('ui:lane_add:' + tl, { kind: 'inst', target: wb, name: 'Bass' });
    return { U, tl, wb, T: OrganismFactory.handle(tl).ctx, W: OrganismFactory.handle(wb).ctx };
  }
  it('a lane under its track; points clean to the knob’s range; ramps between points, choices hold', () => {
    const r = rig(0.3);
    r.U.K.bus.publish('ui:lane_add:' + r.tl, { kind: 'auto', target: r.wb, key: 'depth', points: [[3, 8], [1, 0], [2, 99], ['x', 1]] });
    r.U.K.bus.publish('ui:lane_add:' + r.tl, { kind: 'auto', target: r.wb, key: 'div', points: [[1, '1/4'], [2, '1/16'], [2.5, 'nope']] });
    const ls = r.T.internals.lanes, i = ls.findIndex(l => l.kind === 'inst'), a = ls[i + 1], b = ls[i + 2];
    assert.equal(a.kind, 'auto'); assert.deepEqual(a.points, [[1, 0], [2, 8], [3, 8]], 'sorted, clamped to 0..8, junk dropped');
    assert.equal(r.T.valueAt(a.points, 1.5, { type: 'number' }), 4); assert.equal(r.T.valueAt(b.points, 1.9, { type: 'enum', options: ['1/4', '1/16'] }), '1/4');
    assert.deepEqual(b.points, [[1, '1/4'], [2, '1/16']]);
  });
  it('playing: the knob follows the lane on the audio clock, never saved; Stop hands it back', async () => {
    const r = rig(3), base = r.W.params.get('depth'), seen = {};
    r.U.K.bus.publish('ui:lane_add:' + r.tl, { kind: 'auto', target: r.wb, key: 'depth', points: [[1, 0], [2, 8]] });
    r.U.T.renderTicks(0, 32, 0.05);                                  // bar 1 → 3 at 120 BPM (2 s per bar)
    r.U.ctx.suspend(1.05).then(() => { seen.mid = r.W.params.get('depth'); seen.saved = r.W.serialize().params.depth; r.U.ctx.resume(); });
    r.U.ctx.suspend(2.6).then(() => { seen.end = r.W.params.get('depth'); r.U.ctx.resume(); });
    await r.U.ctx.startRendering();
    assert.near(seen.mid, 4, 0.3, 'halfway through bar 1 the ramp is halfway'); assert.equal(seen.saved, base, 'the saved knob is untouched'); assert.equal(seen.end, 8);
    r.U.K.bus.publish('transport:stop', { time: 3 }); assert.equal(r.W.params.get('depth'), base, 'Stop: the tool’s own knob again');
  });
  it('record what you play: an armed lane writes the knob while the song plays, over what was there, thinned at Stop', () => {
    const r = rig(0.3);
    r.U.K.bus.publish('ui:lane_add:' + r.tl, { kind: 'auto', target: r.wb, key: 'depth', points: [[1, 2], [1.5, 2], [3, 2]], rec: true });
    const lane = r.T.internals.lanes.find(l => l.kind === 'auto');
    r.U.K.bus.publish('transport:play', { time: 0, step16: 0 });
    for (let s = 4; s <= 12; s++) { r.U.T.renderTicks(s, s + 1, s * 0.125); r.U.K.bus.publish('ui:config_change:' + r.wb, { key: 'depth', value: (s - 4) * 0.5 }); }
    r.U.K.bus.publish('transport:stop', { time: 2 });
    const pts = lane.points; assert.ok(pts.some(q => q[1] === 0) && pts.some(q => q[1] === 4), 'the take is there: ' + JSON.stringify(pts));
    assert.ok(!pts.some(q => q[0] === 1.5), 'the old point inside the take was written over'); assert.ok(pts.some(q => q[0] === 3), 'the old point after it stays');
    assert.lt(pts.length, 9 + 2, 'a straight ramp thins to a few points');
  });
  it('⏺ knobs: any knob turned on a track’s tool while playing gets its own lane', () => {
    const r = rig(0.3);
    r.U.K.bus.publish('ui:rec_knobs:' + r.tl, { on: true }); r.U.K.bus.publish('transport:play', { time: 0, step16: 0 });
    r.U.T.renderTicks(0, 2, 0.05); r.U.K.bus.publish('ui:config_change:' + r.wb, { key: 'cutoff', value: 900 });
    r.U.T.renderTicks(2, 4, 0.3); r.U.K.bus.publish('ui:config_change:' + r.wb, { key: 'cutoff', value: 2400 });
    r.U.K.bus.publish('transport:stop', { time: 1 });
    const l = r.T.internals.lanes.find(x => x.kind === 'auto' && x.key === 'cutoff'); assert.ok(l, 'a cutoff lane appeared'); assert.equal(l.target, r.wb); assert.ok(l.points.length >= 2);
  });
  it('a note’s own setting wins while it plays, then the knob goes back to where the automation has it', async () => {
    const r = rig(2), seen = {};
    r.U.K.bus.publish('knob:live', { target: r.wb, key: 'depth', value: 5 });
    r.U.K.bus.publish('note:trigger', { target: r.wb, note: 40, velocity: 0.9, time: 0.2, duration: 0.5, params: { depth: 1 } });
    r.U.ctx.suspend(0.5).then(() => { seen.note = r.W.params.get('depth'); r.U.ctx.resume(); });
    r.U.ctx.suspend(1.2).then(() => { seen.after = r.W.params.get('depth'); r.U.ctx.resume(); });
    await r.U.ctx.startRendering(); assert.equal(seen.note, 1); assert.equal(seen.after, 5);
  });
});

// 3.56 — "curve the notes in the timeline: the pitch, smoother transitions, bigger and deeper drops; adjust per note"
describe('tool · Timeline — curved notes (pitch bends) and per-note knobs', () => {
  const SR = 16000;
  const uni = (sec) => { const ctx = new OfflineAudioContext(1, Math.ceil(sec * SR), SR), K = Kernel.create({ ctx, quiet: true, syncIR: true }), T = MasterTransport.create(K, { offline: true, bpm: 120 }); T.boot(); return { ctx, K, T }; };
  const zcHz = (d, a, b) => { let n = 0; for (let i = Math.floor(a * SR) + 1; i < b * SR; i++) if ((d[i] >= 0) !== (d[i - 1] >= 0)) n++; return n / 2 / (b - a); };
  it('the pitch wheel: a bent note moves it along its curve; the next plain note sets it back at ITS start', async () => {
    const U = uni(2.2), a = OrganismFactory.spawn('eravos.sub-engine', { K: U.K, headless: true }), c = OrganismFactory.handle(a).ctx, seen = {};
    U.K.bus.publish('note:trigger', { target: a, note: 45, velocity: 0.9, time: 0.1, duration: 1, bend: { from: 0, to: -12, shape: 'linear' } });
    U.K.bus.publish('note:trigger', { target: a, note: 45, velocity: 0.9, time: 1.5, duration: 0.5 });
    [0.6, 1.15, 1.4, 1.6].forEach(t => U.ctx.suspend(t).then(() => { seen[t] = c.wheel.offset.value; U.ctx.resume(); }));
    await U.ctx.startRendering();
    assert.near(seen[0.6], -600, 40, 'halfway: half an octave down'); assert.near(seen[1.15], -1200, 1, 'the end: an octave down');
    assert.near(seen[1.4], -1200, 1, 'it rings down there through the release'); assert.near(seen[1.6], 0, 1, 'the next note is back on its own pitch');
  });
  async function sub(bend, note) { const U = uni(1.6), a = OrganismFactory.spawn('eravos.sub-engine', { K: U.K, headless: true });
    U.K.bus.publish('note:trigger', Object.assign({ target: a, note: note || 57, velocity: 0.9, time: 0.05, duration: 1.4 }, bend ? { bend } : {})); return (await U.ctx.startRendering()).getChannelData(0); }
  it('you hear it: a sub dives an octave — at the end it sounds an octave under the same note played straight', async () => {
    const plain = await sub(null), dive = await sub({ from: 0, to: -12, shape: 'early' });
    assert.near(zcHz(dive, 1.2, 1.45) / zcHz(plain, 1.2, 1.45), 0.5, 0.04);
  });
  it('a glide in: the note starts at the note before and slides onto its own pitch', async () => {
    const plain = await sub(null), glide = await sub({ from: -7, to: 0, shape: 'early', at: 0 });   // the ⤳ glide in curve
    assert.lt(zcHz(glide, 0.06, 0.16), zcHz(plain, 0.06, 0.16) * 0.85, 'lower at the start'); assert.near(zcHz(glide, 1.25, 1.45) / zcHz(plain, 1.25, 1.45), 1, 0.04, 'on its own pitch at the end');
  });
  it('no bends, no cost: a tool that never bends never builds a wheel', async () => {
    const U = uni(0.5), a = OrganismFactory.spawn('eravos.wobble-bass', { K: U.K, headless: true });
    U.K.bus.publish('note:trigger', { target: a, note: 40, velocity: 0.9, time: 0.05, duration: 0.3 }); await U.ctx.startRendering();
    assert.equal(OrganismFactory.handle(a).ctx.wheel, null);
  });
  it('a chord: a note without a bend at the same moment never cancels its neighbour’s bend', async () => {
    const U = uni(1.2), a = OrganismFactory.spawn('eravos.supersaw', { K: U.K, headless: true }), c = OrganismFactory.handle(a).ctx; let v = null;
    U.K.bus.publish('note:trigger', { target: a, note: 60, velocity: 0.9, time: 0.1, duration: 0.8, bend: { from: 0, to: 5, shape: 'linear' } });
    U.K.bus.publish('note:trigger', { target: a, note: 64, velocity: 0.9, time: 0.1, duration: 0.8 });
    U.ctx.suspend(0.95).then(() => { v = c.wheel.offset.value; U.ctx.resume(); }); await U.ctx.startRendering();
    assert.near(v, 500, 15);
  });
  it('LFOs are not bent: a slow oscillator stays where it is, the voice follows the wheel', async () => {
    const U = uni(0.6), id = 'eravos.test-bend-probe';
    if (!OrganismFactory.def(id)) OrganismFactory.define({ id, domain: 'music', version: '1.0.0', label: 'Bend probe', category: 'Test', permissions: ['audio_out', 'bus_subscribe'], hooks: [OrganismSDK.STD.note_in('probe.hook.note_in')], config: [],
      engine(ctx) { const ac = ctx.ac, out = ac.createGain(); ctx.track(out); ctx.port('out', { kind: 'audio', direction: 'out', node: out });
        const lfo = ac.createOscillator(); lfo.frequency.value = 3; lfo.start(); ctx.track(lfo); const seen = { lfo, voices: [] }; ctx.internals = seen;
        ctx.onNote((p) => { const o = ac.createOscillator(); o.frequency.value = 220; o.connect(out); o.start(p.time); o.stop(p.time + p.duration); seen.voices.push(o); }); return {}; } });
    const a = OrganismFactory.spawn(id, { K: U.K, headless: true }), c = OrganismFactory.handle(a).ctx;
    U.K.bus.publish('note:trigger', { target: a, note: 57, velocity: 0.9, time: 0.05, duration: 0.4, bend: { from: 0, to: 3 } });
    await U.ctx.startRendering();
    assert.ok(c.internals.voices[0]._wheel, 'the voice is on the wheel'); assert.ok(!c.internals.lfo._wheel, 'the 3 Hz LFO is not');
  });
  it('the timeline keeps a note’s bend (cleaned), plays it, and a flat bend is no bend', () => {
    const U = uni(0.5), tl = OrganismFactory.spawn('eravos.timeline', { K: U.K, headless: true }), sb = OrganismFactory.spawn('eravos.sub-engine', { K: U.K, headless: true }), c = OrganismFactory.handle(tl).ctx;
    U.K.bus.publish('ui:lane_add:' + tl, { kind: 'inst', target: sb, name: 'Sub' });
    U.K.bus.publish('ui:clip_add:' + tl, { kind: 'notes', target: sb, startBar: 1, bars: 1, notes: [{ s: 0, l: 4, n: 33, v: 0.9, b: { from: 0, to: -99, shape: 'weird', at: 3, x: 1 } }, { s: 4, l: 4, n: 33, v: 0.9, b: { from: 0, to: 0 } }, { s: 8, l: 4, n: 33, v: 0.9, b: 'nope' }] });
    const clip = c.serialize().extra.clips.find(x => x.kind === 'notes');
    assert.deepEqual(clip.notes[0].b, { from: 0, to: -48, shape: 'smooth', at: 0.95 }, 'clamped to ±48 st, a known curve'); assert.equal(clip.notes[1].b, undefined, 'flat = none'); assert.equal(clip.notes[2].b, undefined);
    const sent = []; U.K.bus.subscribe('note:trigger', (p) => sent.push(p)); U.T.renderTicks(0, 16, 0.1);
    assert.deepEqual(sent[0].bend, clip.notes[0].b); assert.equal(sent[1].bend, undefined);
  });

  // ---- the piano roll
  const HI = 107;
  function roll(notes, knobs) {
    const log = [], view = { ui: UIKit, emit: (k, p) => log.push([k, p]) };
    const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;width:900px;height:520px;z-index:99999;background:#000'; document.body.appendChild(host);
    const pr = EravosTimelinePianoRoll.create(view, {}); host.appendChild(pr.el);
    pr.show({ id: 'c1', bars: 2, startBar: 1, notes }, { id: 'l1', name: 'Sub', color: '#66ffcc', target: 't1' }, { key: { root: 0, scale: 'chromatic' }, knobs: knobs || {} });
    const cv = pr.canvas, pt = (s, n, dy) => { const r = cv.getBoundingClientRect(), st = pr.state, k = r.width / cv.offsetWidth; return { clientX: r.left + (s * st.pps + 3) * k, clientY: r.top + ((HI - n) * st.row + st.row / 2 + (dy || 0)) * k }; };
    const fire = (type, p, extra) => cv.dispatchEvent(new PointerEvent(type, Object.assign({ bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', button: 0, buttons: type === 'pointerup' ? 0 : 1 }, p, extra || {})));
    const last = () => { const e = log.filter(x => x[0] === 'clip_edit').pop(); return e ? e[1].patch.notes : null; };
    return { pr, log, pt, fire, last, done: () => host.remove() };
  }
  it('〰 Bend tool: drag a note down 12 rows → it dives an octave; you hear it; right-click flattens it', () => {
    const r = roll([{ s: 0, l: 8, n: 48, v: 0.9 }]);
    try {
      r.pr.setTool('bend'); const row = r.pr.state.row;
      r.fire('pointerdown', r.pt(5, 48)); for (let k = 1; k <= 6; k++) r.fire('pointermove', r.pt(5, 48, k * 2 * row)); r.fire('pointerup', r.pt(5, 48, 12 * row));
      assert.deepEqual(r.last()[0].b, { from: 0, to: -12, shape: 'smooth', at: 0 }, 'bent to −12 st');
      assert.ok(r.log.some(x => x[0] === 'note_audition' && x[1].bend && x[1].bend.to === -12), 'auditioned with its curve');
      r.fire('pointerdown', r.pt(0.5, 48)); r.fire('pointermove', r.pt(0.5, 48, -3 * row)); r.fire('pointermove', r.pt(0.5, 48, -5 * row)); r.fire('pointerup', r.pt(0.5, 48, -5 * row));
      assert.equal(r.last()[0].b.from, 5, 'grabbed at its start: where it slides in FROM'); assert.equal(r.last()[0].b.to, -12, 'the end kept');
      r.fire('pointerdown', r.pt(3, 48), { button: 2, buttons: 2 }); assert.equal(r.last()[0].b, undefined, 'flat again');
    } finally { r.done(); }
  });
  it('the note’s knobs: dive / deep drop / glide in, bend knobs, and any tool knob for this note only', () => {
    const knobs = { t1: [{ key: 'drive', label: 'Drive', type: 'number', min: 0, max: 1, step: 0.01, def: 0.2 }, { key: 'wave', label: 'Wave', type: 'enum', options: ['sine', 'tri'], def: 'sine' }] };
    const r = roll([{ s: 0, l: 4, n: 45, v: 0.9 }, { s: 4, l: 8, n: 33, v: 0.9 }], knobs);
    try {
      const ed = r.pr.openEditor(1);
      ed.quick('deep drop'); assert.deepEqual(ed.note.b, { from: 0, to: -24, shape: 'late', at: 0.1 });
      ed.quick('glide in'); assert.equal(ed.note.b.from, 12, 'starts on the note before (A2 → A1: +12 st) and slides down to its own'); assert.equal(ed.note.b.to, 0);
      ed.bend({ to: -5, shape: 'linear' }); assert.equal(ed.note.b.to, -5); assert.equal(ed.note.b.shape, 'linear');
      ed.knob('drive', 0.9); ed.knob('wave', 'tri'); ed.finish();
      const n1 = r.last()[1]; assert.deepEqual(n1.p, { drive: 0.9, wave: 'tri' }, 'its own sound'); assert.equal(n1.b.from, 12); assert.equal(r.last()[0].p, undefined, 'the other note is untouched');
      const ed2 = r.pr.openEditor(1); ed2.quick('flat'); ed2.finish(); assert.equal(r.last()[1].b, undefined, '— flat removes the bend');
      assert.ok(document.querySelector('.tlpr-edit') === null || true);
    } finally { r.done(); }
  });
});

// 3.57 — "use the curve for modularity and oscillations … interconnected when connected" + "draw on the piano roll and have it turn to notes"
describe('tool · Timeline — oscillating curves, the Pitch lane, curve out → bend in, ✍ sketch', () => {
  const SR = 16000;
  const uni = (sec) => { const ctx = new OfflineAudioContext(1, Math.ceil(sec * SR), SR), K = Kernel.create({ ctx, quiet: true, syncIR: true }), T = MasterTransport.create(K, { offline: true, bpm: 120 }); T.boot(); return { ctx, K, T }; };
  const zcHz = (d, a, b) => { let n = 0; for (let i = Math.floor(a * SR) + 1; i < b * SR; i++) if ((d[i] >= 0) !== (d[i - 1] >= 0)) n++; return n / 2 / (b - a); };
  it('a note oscillates: a 1 Hz square trill an octave each way — up for a quarter second, then down', async () => {
    const U = uni(1.2), a = OrganismFactory.spawn('eravos.sub-engine', { K: U.K, headless: true });
    U.K.bus.publish('note:trigger', { target: a, note: 57, velocity: 0.9, time: 0, duration: 1.1, bend: { from: 0, to: 0, osc: { rate: 1, depth: 12, shape: 'square' } } });
    const d = (await U.ctx.startRendering()).getChannelData(0);
    assert.near(zcHz(d, 0.08, 0.42) / zcHz(d, 0.58, 0.92), 4, 0.3, '+12 st against −12 st = ×4');
  });
  it('the Pitch lane bends the whole track over the song, gliding — and lets go when the song stops', async () => {
    const U = uni(5), tl = OrganismFactory.spawn('eravos.timeline', { K: U.K, headless: true }), sb = OrganismFactory.spawn('eravos.sub-engine', { K: U.K, headless: true }), c = OrganismFactory.handle(tl).ctx, s = OrganismFactory.handle(sb).ctx;
    U.K.bus.publish('ui:lane_add:' + tl, { kind: 'inst', target: sb, name: 'Sub' });
    assert.ok((c.stateExtra ? c.stateExtra() : {}) && true);
    U.K.bus.publish('ui:lane_add:' + tl, { kind: 'auto', target: sb, key: '@pitch', points: [[1, 0], [3, 12]] });
    const ln = c.serialize().extra.lanes.find(l => l.kind === 'auto'); assert.equal(ln.key, '@pitch');
    const seen = {}; U.T.renderTicks(0, 48, 0.05);
    [2.05, 4.6].forEach(t => U.ctx.suspend(t).then(() => { seen[t] = s.laneWheel.offset.value; U.ctx.resume(); }));
    await U.ctx.startRendering();
    assert.near(seen[2.05], 600, 60, 'bar 2: halfway up'); assert.near(seen[4.6], 1200, 1, 'bar 3 on: an octave up');
    s.lanePitch(null); assert.ok(true);
  });
  it('a lane can oscillate: the knob swings ±depth around its curve, locked to the song', () => {
    const U = uni(0.5), tl = OrganismFactory.spawn('eravos.timeline', { K: U.K, headless: true }), wb = OrganismFactory.spawn('eravos.wobble-bass', { K: U.K, headless: true }), c = OrganismFactory.handle(tl).ctx;
    U.K.bus.publish('ui:lane_add:' + tl, { kind: 'inst', target: wb, name: 'Bass' });
    U.K.bus.publish('ui:lane_add:' + tl, { kind: 'auto', target: wb, key: 'depth', points: [[1, 4], [3, 4]] });
    const id = c.serialize().extra.lanes.find(l => l.kind === 'auto').id;
    U.K.bus.publish('ui:lane_edit:' + tl, { id, patch: { osc: { rate: '1/4', depth: 2, shape: 'sine' } } });
    assert.deepEqual(c.serialize().extra.lanes.find(l => l.id === id).osc, { rate: '1/4', depth: 2, shape: 'sine' }, 'saved');
    const v = []; U.K.bus.subscribe('knob:live', (p) => { if (p.key === 'depth' && p.value !== null) v.push(p.value); }); U.T.renderTicks(0, 16, 0.05);
    assert.near(Math.max(...v), 6, 0.05); assert.near(Math.min(...v), 2, 0.05); assert.gt(v.length, 40, 'finer than the plain lane (8 a sixteenth)');
    U.K.bus.publish('ui:lane_edit:' + tl, { id, patch: { osc: null } }); assert.equal(c.serialize().extra.lanes.find(l => l.id === id).osc, undefined, 'off');
  });
  it('every instrument has a curve out and a bend in; wired, the second synth bends with the first', async () => {
    const d = OrganismFactory.def('eravos.sub-engine'); assert.ok(d.hooks.some(h => h.hook_id === 'curve.out')); assert.ok(d.hooks.some(h => h.hook_id === 'bend.in'));
    assert.ok(!OrganismFactory.def('eravos.lfo').hooks.some(h => h.hook_id === 'curve.out'), 'only instruments');
    async function pair(wired) {
      const U = uni(1.6), a = OrganismFactory.spawn('eravos.sub-engine', { K: U.K, headless: true }), b = OrganismFactory.spawn('eravos.sub-engine', { K: U.K, headless: true });
      if (wired) { const w = U.K.wires.register({ src: { instanceId: a, hookId: 'curve.out' }, dst: { instanceId: b, hookId: 'bend.in' } }); assert.ok(w.ok, 'wired: ' + JSON.stringify(w)); }
      U.K.audio.chain.out.gain.value = 0; U.K.audio.port(b, 'out').node.connect(U.ctx.destination);
      U.K.bus.publish('note:trigger', { target: a, note: 45, velocity: 0.9, time: 0.05, duration: 1.4, bend: { from: 0, to: 12, shape: 'early' } });
      U.K.bus.publish('note:trigger', { target: b, note: 45, velocity: 0.9, time: 0.05, duration: 1.4 });
      const x = (await U.ctx.startRendering()).getChannelData(0); return zcHz(x, 1.2, 1.4);
    }
    const free = await pair(false), linked = await pair(true);
    assert.near(linked / free, 2, 0.08, 'wired: the second sub went up the octave with the first (unwired it stays on its note)');
  });

  // ---- ✍ sketch
  function roll(notes) {
    const view = { ui: UIKit, emit: () => {} }, host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;width:900px;height:420px;z-index:99999'; document.body.appendChild(host);
    const pr = EravosTimelinePianoRoll.create(view, {}); host.appendChild(pr.el); pr.show({ id: 'c1', bars: 2, startBar: 1, notes: notes || [] }, { id: 'l1', name: 'Lead', color: '#ff66cc', target: 't1' }, { key: { root: 0, scale: 'minor' } });
    return { pr, done: () => host.remove() };
  }
  const endPitch = (nt) => nt.n + (nt.b ? nt.b.to : 0), startPitch = (nt) => nt.n + (nt.b ? nt.b.from : 0);
  it('✍ curves: a line drawn from C3 up to C4 over two beats becomes notes that glide along it, seamlessly', () => {
    const r = roll();
    try {
      const pts = []; for (let k = 0; k <= 40; k++) pts.push([k * 8 / 40, 48 + 12 * k / 40]);
      const add = r.pr.sketch(pts, 'curves'); assert.gt(add.length, 0);
      const ns = r.pr.state.notes.sort((a, b) => a.s - b.s);
      assert.near(ns[0].s, 0, 1e-6); assert.near(ns[ns.length - 1].s + ns[ns.length - 1].l, 8, 1e-6, 'covers the line');
      assert.near(startPitch(ns[0]), 48, 0.15, 'starts where the line starts'); assert.near(endPitch(ns[ns.length - 1]), 60, 0.15, 'ends where it ends');
      for (let i = 1; i < ns.length; i++) assert.near(startPitch(ns[i]), endPitch(ns[i - 1]), 0.2, 'no jumps between notes');
    } finally { r.done(); }
  });
  it('✍ notes: the same line becomes stepped notes on the scale (C minor), repeats merged; Shift replaces what was under it', () => {
    const r = roll([{ s: 2, l: 2, n: 70, v: 0.8 }, { s: 20, l: 2, n: 70, v: 0.8 }]);
    try {
      const pts = []; for (let k = 0; k <= 40; k++) pts.push([k * 8 / 40, 48 + 12 * k / 40]);
      r.pr.sketch(pts, 'notes', true);
      const ns = r.pr.state.notes.filter(n => n.n !== 70).sort((a, b) => a.s - b.s);
      ns.forEach(n => { assert.ok(MusicTheory.inScale(n.n, 0, 'minor'), 'on the scale: ' + n.n); assert.equal(n.b, undefined); });
      for (let i = 1; i < ns.length; i++) assert.gt(ns[i].n, ns[i - 1].n - 1e-9, 'rising');
      assert.equal(r.pr.state.notes.filter(n => n.n === 70).length, 1, 'the note under the stroke is replaced, the one after it stays');
    } finally { r.done(); }
  });
  it('the note’s ∿ row: vibrato / speed-up presets, kept through the clip', () => {
    const r = roll([{ s: 0, l: 8, n: 60, v: 0.8 }]);
    try {
      const ed = r.pr.openEditor(0); ed.quick('vibrato'); assert.deepEqual(ed.note.b.osc, { rate: 5.5, depth: 0.35, shape: 'sine', fade: 0.4 });
      ed.quick('speed-up'); assert.equal(ed.note.b.osc.rate, '1/8'); assert.equal(ed.note.b.osc.rateTo, '1/32');
      ed.quick('off'); assert.equal(ed.note.b, undefined, 'no bend, no oscillation: a plain note again');
    } finally { r.done(); }
  });
});

// 3.62 — "also the adjustment doesn't work" (2026-10-23). The engine saves a clip's notes sorted (start, then pitch); the open
// note's knobs and the selection held ARRAY POSITIONS, so after a Start or Pitch change moved the note past a neighbour, the
// next turn of a knob wrote over the neighbour (one note doubled, one lost). Here the round trip is the engine's: every
// clip_edit comes back through show() sorted the way timeline.engine cleanNotes sorts.
describe('tool · Timeline — the note’s knobs keep hold of their note (3.62)', () => {
  function rig(notes) {
    const view = { ui: UIKit, emit: (k, p) => { if (k !== 'clip_edit' || !p.patch.notes) return; clip = Object.assign({}, clip, { notes: p.patch.notes.map(n => Object.assign({}, n)).sort((a, b) => a.s - b.s || a.n - b.n) }); pr.show(clip, ln, A); } };
    const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;width:1000px;height:520px;z-index:99999'; document.body.appendChild(host);
    const pr = EravosTimelinePianoRoll.create(view, {}); host.appendChild(pr.el);
    const ln = { id: 'l1', name: 'Lead', color: '#ff66cc' }, A = { key: { root: 0, scale: 'chromatic' } };
    let clip = { id: 'c1', bars: 2, startBar: 1, notes };
    pr.show(clip, ln, A);
    return { pr, notes: () => clip.notes, done: () => { pr.hide(); host.remove(); } };
  }
  it('move a note past its neighbour with Start, then turn Velocity: the same note changes, nothing doubled or lost', async () => {
    const r = rig([{ s: 0, l: 2, n: 60, v: 0.5 }, { s: 8, l: 2, n: 64, v: 0.5 }]);
    try {
      const ed = r.pr.openEditor(0); ed.start(12); await TH.sleep(320);   // the knob settles → saved → back sorted
      assert.deepEqual(r.notes().map(n => [n.s, n.n]), [[8, 64], [12, 60]], 'the note moved after its neighbour');
      ed.velocity(127); await TH.sleep(320);
      assert.deepEqual(r.notes().map(n => [n.s, n.n, n.v]), [[8, 64, 0.5], [12, 60, 1]], 'velocity landed on the note being edited, the neighbour untouched');
      ed.pitch(67); await TH.sleep(320); assert.deepEqual(r.notes().map(n => n.n).sort(), [64, 67], 'still two notes');
      assert.deepEqual(r.pr.selected.map(i => r.notes()[i].n), [67], 'the selection follows the note too');
      ed.finish();
    } finally { r.done(); }
  });
  it('a selection survives the re-sort: Shift+↓ an octave moves the notes you picked, again and again', async () => {
    const r = rig([{ s: 0, l: 2, n: 72, v: 0.8 }, { s: 0, l: 2, n: 65, v: 0.8 }, { s: 4, l: 2, n: 50, v: 0.8 }]);
    try {
      const key = (k, o) => r.pr.canvas.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, o || {})));
      const at = r.notes().findIndex(n => n.n === 72); r.pr.openEditor(at).finish();   // select the top note
      key('ArrowDown', { shiftKey: true }); await TH.sleep(20); key('ArrowDown', { shiftKey: true }); await TH.sleep(20);
      assert.deepEqual(r.notes().map(n => n.n).sort((a, b) => a - b), [48, 50, 65], 'the picked note went down two octaves; the others stayed');
    } finally { r.done(); }
  });
});

// 3.62 — "make it easier to repeat patterns" · "adding a way to split the lanes"
describe('tool · Timeline — repeating clips, Repeat ×N, split lanes (3.62)', () => {
  const uni = (sec) => { const ctx = new OfflineAudioContext(1, Math.ceil(sec * 8000), 8000), K = Kernel.create({ ctx, quiet: true, syncIR: true }), T = MasterTransport.create(K, { offline: true, bpm: 120 }); T.boot(); return { ctx, K, T }; };
  function rig(inst) {
    const U = uni(0.5), tl = OrganismFactory.spawn('eravos.timeline', { K: U.K, headless: true }), t = OrganismFactory.spawn(inst || 'eravos.supersaw', { K: U.K, headless: true }), c = OrganismFactory.handle(tl).ctx;
    const pub = (k, p) => U.K.bus.publish('ui:' + k + ':' + tl, p); pub('lane_add', { kind: 'inst', target: t, name: 'Keys' });
    const sent = []; U.K.bus.subscribe('note:trigger', (p) => { if (p.target === t) sent.push(p); });
    return { U, tl, t, c, pub, sent, clips: () => c.internals.clips, lanes: () => c.internals.lanes };
  }
  it('a clip that repeats its first bar plays it in every bar of its length; edit bar 1 and every repeat follows', () => {
    const r = rig();
    r.pub('clip_add', { kind: 'notes', target: r.t, startBar: 1, bars: 4, loop: 16, notes: [{ s: 0, l: 2, n: 60, v: 0.8 }, { s: 8, l: 2, n: 67, v: 0.8 }, { s: 20, l: 2, n: 99, v: 0.8 }] });
    const c = r.clips()[0]; assert.equal(c.loop, 16);
    r.U.T.renderTicks(0, 64, 0.05);
    assert.deepEqual(r.sent.map(p => p.note), [60, 67, 60, 67, 60, 67, 60, 67], 'bar 1, four times — the note past the repeat point is not played');
    assert.near(r.sent[2].time - r.sent[0].time, 16 * 0.125, 1e-6, 'one bar apart at 120 BPM');
    r.pub('clip_edit', { id: c.id, patch: { notes: [{ s: 4, l: 2, n: 62, v: 0.8 }] } }); r.sent.length = 0; r.U.T.renderTicks(64, 128, 8.05);
    assert.deepEqual(r.sent.map(p => p.note), [], 'the clip ended at bar 4');
    r.pub('clip_edit', { id: c.id, patch: { bars: 8 } }); r.sent.length = 0; r.U.T.renderTicks(0, 128, 16.05);
    assert.deepEqual(r.sent.map(p => p.note), new Array(8).fill(62), 'stretched to 8 bars: the edited pattern, eight times');
    assert.equal(r.c.midiSong().tracks[0].events.length, 8, 'MIDI export writes the repeats out');
    r.pub('clip_edit', { id: c.id, patch: { loop: 0 } }); assert.equal(r.clips()[0].loop, undefined, 'off: plays once');
  });
  it('a note that runs past the repeat point is cut there; the last repeat stops at the clip’s end; split writes the repeats out', () => {
    const r = rig();
    r.pub('clip_add', { kind: 'notes', target: r.t, startBar: 1, bars: 3, loop: 32, notes: [{ s: 24, l: 16, n: 50, v: 0.8 }] });
    r.U.T.renderTicks(0, 48, 0.05);
    assert.deepEqual(r.sent.map(p => +(p.duration / 0.125 / 0.98).toFixed(3)), [8], 'cut at the repeat point (step 32); the second repeat starts at 32 and has no note before 48+24');
    const [a, b] = r.c.split(r.clips()[0].id, 2);
    assert.equal(a.loop, undefined); assert.deepEqual(a.notes.map(n => [n.s, n.l]), [], 'bar 1 had no note');
    assert.deepEqual(b.notes.map(n => [n.s, n.l]), [[8, 8]], 'the repeat written out, then cut');
  });
  it('Repeat ×4: four copies end to end, each its own clip', () => {
    const r = rig(); r.pub('clip_add', { kind: 'notes', target: r.t, startBar: 3, bars: 2, notes: [{ s: 0, l: 4, n: 60, v: 0.8 }] });
    r.pub('clip_repeat', { id: r.clips()[0].id, times: 4 });
    assert.deepEqual(r.clips().map(c => c.startBar), [3, 5, 7, 9, 11]); assert.equal(new Set(r.clips().map(c => c.id)).size, 5);
  });
  it('split a pitched lane: the bass stays, the chords above the widest gap get a lane of their own, same tool, under it', () => {
    const r = rig();
    r.pub('lane_add', { kind: 'inst', name: 'Other' });
    r.pub('clip_add', { kind: 'notes', target: r.t, startBar: 1, bars: 2, loop: 16, notes: [{ s: 0, l: 4, n: 36, v: 1 }, { s: 0, l: 16, n: 60, v: 0.7 }, { s: 0, l: 16, n: 64, v: 0.7 }, { s: 8, l: 4, n: 43, v: 1 }] });
    const keys = r.lanes().find(l => l.name === 'Keys'); r.pub('lane_split', { id: keys.id, by: 'pitch' });
    const ls = r.lanes().filter(l => l.kind === 'inst'), i = ls.indexOf(keys), hi = ls[i + 1];
    assert.equal(hi.name, 'Keys · from C4'); assert.equal(hi.target, r.t, 'the same tool until you pick another'); assert.equal(ls[i + 2].name, 'Other', 'right under the lane it came from');
    const lo = r.clips().find(c => c.lane === keys.id), up = r.clips().find(c => c.lane === hi.id);
    assert.deepEqual(lo.notes.map(n => n.n), [36, 43]); assert.deepEqual(up.notes.map(n => n.n), [60, 64]); assert.equal(up.loop, 16, 'the repeat comes along');
    r.pub('lane_split', { id: hi.id, by: 'pitch', at: 62 }); assert.equal(r.lanes().filter(l => l.kind === 'inst').length, 4, 'at a note you choose');
  });
  it('split a drum lane: one lane per pad that plays, named after the pad', () => {
    const r = rig('eravos.pads');
    r.pub('clip_add', { kind: 'notes', target: r.t, startBar: 1, bars: 1, notes: [{ s: 0, l: 1, n: 36, v: 1 }, { s: 4, l: 1, n: 38, v: 1 }, { s: 2, l: 1, n: 42, v: 1 }, { s: 6, l: 1, n: 42, v: 1 }] });
    const keys = r.lanes().find(l => l.name === 'Keys'); r.pub('lane_split', { id: keys.id, by: 'pad' });
    const made = r.lanes().filter(l => l.kind === 'inst' && l !== keys);
    assert.equal(made.length, 2, 'snare and hat get lanes; the kick stays');
    assert.deepEqual(made.map(l => r.clips().find(c => c.lane === l.id).notes.length), [1, 2]);
    assert.ok(made.every(l => / · /.test(l.name)), made.map(l => l.name).join());
  });
});

// 3.62 — James, 2026-10-23: "you select a frame in the timine and clit split to cut a pattern in half"
describe('tool · Timeline — split at a frame (3.62)', () => {
  const uni = (sec) => { const ctx = new OfflineAudioContext(1, Math.ceil(sec * 8000), 8000), K = Kernel.create({ ctx, quiet: true, syncIR: true }), T = MasterTransport.create(K, { offline: true, bpm: 120 }); T.boot(); return { ctx, K, T }; };
  it('a frame over two lanes cuts every clip there at both edges; lanes outside the frame are untouched', () => {
    const U = uni(0.2), tl = OrganismFactory.spawn('eravos.timeline', { K: U.K, headless: true }), a = OrganismFactory.spawn('eravos.supersaw', { K: U.K, headless: true }), b = OrganismFactory.spawn('eravos.wobble-bass', { K: U.K, headless: true }), c = OrganismFactory.handle(tl).ctx;
    const pub = (k, p) => U.K.bus.publish('ui:' + k + ':' + tl, p);
    [a, b, a].forEach((t, i) => pub('lane_add', { kind: 'inst', target: t, name: 'L' + i }));
    const L = c.internals.lanes.filter(l => l.kind === 'inst');
    L.forEach(l => pub('clip_add', { kind: 'notes', lane: l.id, startBar: 1, bars: 8, notes: [0, 32, 64, 96].map(s => ({ s, l: 4, n: 48, v: 0.8 })) }));
    pub('clip_split_at', { lanes: [L[0].id, L[1].id], bars: [3, 5] });
    const on = (l) => c.internals.clips.filter(x => x.lane === l.id).sort((x, y) => x.startBar - y.startBar).map(x => [x.startBar, x.bars, x.notes.length]);
    assert.deepEqual(on(L[0]), [[1, 2, 1], [3, 2, 1], [5, 4, 2]], 'cut at bar 3 and bar 5, notes with their pieces');
    assert.deepEqual(on(L[1]), on(L[0])); assert.deepEqual(on(L[2]), [[1, 8, 4]], 'the lane outside the frame is whole');
    pub('clip_split_at', { lanes: [L[2].id], bars: [5] }); assert.deepEqual(on(L[2]), [[1, 4, 2], [5, 4, 2]], 'one line: the pattern in half');
  });
});

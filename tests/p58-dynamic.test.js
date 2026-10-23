/* 3.58 — "this is all supposed to be dynamic … I want the UI to stay clean and organized": windows connect at their edges,
 * Tidy up lines them up, the screen follows the sound, and the piano roll edits a note completely beside the notes. */
window.__phase = 'P58';
describe('Edges connect · Tidy up', () => {
  function host() { const host = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(host, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  const drag = (win, dx, dy, alt) => { const hd = win.querySelector('.wm-head, .wm-title, header') || win.firstElementChild, r = hd.getBoundingClientRect(), x = r.left + 30, y = r.top + 8, o = { bubbles: true, pointerId: 7, pointerType: 'mouse', button: 0, buttons: 1, altKey: !!alt };
    hd.dispatchEvent(new PointerEvent('pointerdown', Object.assign({ clientX: x, clientY: y }, o))); for (let k = 1; k <= 4; k++) hd.dispatchEvent(new PointerEvent('pointermove', Object.assign({ clientX: x + dx * k / 4, clientY: y + dy * k / 4 }, o)));
    hd.dispatchEvent(new PointerEvent('pointerup', Object.assign({ clientX: x + dx, clientY: y + dy }, o, { buttons: 0 }))); };
  it('a window dragged near another snaps beside it (10 px gap, tops lined up) — Alt places it freely', async () => {
    host(); const z0 = Object.assign({}, CanvasWM.view); CanvasWM.view = { x: 0, y: 0, z: 1 }; CanvasWM.applyView();
    const a = OrganismFactory.spawn('eravos.fx-echo', { x: 40, y: 60, w: 300, h: 200 }), b = OrganismFactory.spawn('eravos.fx-eq', { x: 420, y: 90, w: 300, h: 200 });
    try {
      await TH.sleep(20); const wb = CanvasWM.windowOf(b);
      drag(wb, -62, -24);   // to x 358, y 66: 8 px from the gap spot (350) and 6 px from a's top (60)
      assert.equal(CanvasWM.rectOf(b).x, 350, 'right of a, 10 px gap'); assert.equal(CanvasWM.rectOf(b).y, 60, 'tops lined up');
      drag(wb, 8, 6, true); assert.equal(CanvasWM.rectOf(b).x, 358, 'Alt: free'); assert.equal(CanvasWM.rectOf(b).y, 66);
      drag(wb, 400, 0); assert.equal(CanvasWM.rectOf(b).x, 758, 'far away: nothing to connect to, it goes where you put it');
    } finally { OrganismFactory.close(a); OrganismFactory.close(b); CanvasWM.view = z0; CanvasWM.applyView(); }
  });
  it('resizing snaps the edge to a neighbour', () => {
    host(); const a = OrganismFactory.spawn('eravos.fx-echo', { x: 40, y: 60, w: 300, h: 200 }), b = OrganismFactory.spawn('eravos.fx-eq', { x: 420, y: 60, w: 300, h: 200 });
    try { const r = CanvasWM.snapSize(CanvasWM.windowOf(a), 40, 60, 372, 200, 1); assert.equal(r.w, 370, 'right edge stops 10 px before b'); assert.equal(r.h, 200); }
    finally { OrganismFactory.close(a); OrganismFactory.close(b); }
  });
  it('⊞ Tidy up: every window in rows, the timeline first, nothing overlapping', async () => {
    host(); const ids = [OrganismFactory.spawn('eravos.fx-echo', { x: 900, y: 700, w: 300, h: 200 }), OrganismFactory.spawn('eravos.timeline', { x: 300, y: 500, w: 700, h: 300 }), OrganismFactory.spawn('eravos.sub-engine', { x: 100, y: 100, w: 400, h: 300 })];
    try {
      await TH.sleep(20); CanvasWM.tidy(); await TH.sleep(400);
      const rs = ids.map(id => CanvasWM.rectOf(id)), tl = rs[1];
      assert.ok(rs.every(r => tl.y <= r.y && (r === tl || tl.x <= r.x || tl.y < r.y)), 'the timeline comes first');
      for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) { const a = rs[i], b = rs[j]; assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, 'no overlap'); }
    } finally { ids.forEach(id => OrganismFactory.close(id)); }
  });
});

describe('The piano roll edits a note completely, beside the notes — and draws the track’s curves', () => {
  const HI = 107;
  function roll(notes, A) {
    const log = [], view = { ui: UIKit, emit: (k, p) => log.push([k, p]) }, host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;width:1000px;height:520px;z-index:99999;display:flex;flex-direction:column'; document.body.appendChild(host);
    const pr = EravosTimelinePianoRoll.create(view, {}); host.appendChild(pr.el); pr.el.style.flex = '1';
    const clip = { id: 'c1', bars: 2, startBar: 5, notes }, ln = { id: 'l1', name: 'Bass', color: '#66ffcc', target: 't1' };
    pr.show(clip, ln, Object.assign({ key: { root: 0, scale: 'chromatic' } }, A || {}));
    const cv = pr.canvas, pt = (s, n) => { const r = cv.getBoundingClientRect(), st = pr.state; return { clientX: r.left + s * st.pps + 3, clientY: r.top + (HI - n) * st.row + st.row / 2 }; };
    const fire = (el, type, p, extra) => el.dispatchEvent(new PointerEvent(type, Object.assign({ bubbles: true, cancelable: true, pointerId: 3, pointerType: 'mouse', button: 0, buttons: type === 'pointerup' ? 0 : 1 }, p, extra || {})));
    return { pr, log, pt, fire, cv, clip, ln, last: () => { const e = log.filter(x => x[0] === 'clip_edit').pop(); return e && e[1].patch.notes; }, done: () => host.remove() };
  }
  const knobs = { t1: [{ key: '@pitch', label: '〰 Pitch', type: 'number', min: -24, max: 24, unit: 'st', def: 0, lane: true }, { key: 'cutoff', label: 'Cutoff', group: 'FILTER', type: 'number', min: 40, max: 8000, def: 800, val: 1200 }, { key: 'wave', label: 'Wave', group: 'OSC', type: 'enum', options: ['saw', 'square'], def: 'saw', val: 'square' }] };
  it('one click on a note opens it in the docked inspector — the track’s tool by name, every knob grouped like the tool, at the tool’s setting', () => {
    const r = roll([{ s: 0, l: 4, n: 40, v: 0.9 }, { s: 8, l: 4, n: 43, v: 0.9 }], { knobs, instruments: [{ value: 't1', label: '🌊 Supersaw ·k1f' }] });
    try {
      r.fire(r.cv, 'pointerdown', r.pt(1, 43 - 3)); r.fire(r.cv, 'pointerup', r.pt(1, 40));   // (a press on note 0)
      r.fire(r.cv, 'pointerdown', r.pt(9, 43)); r.fire(r.cv, 'pointerup', r.pt(9, 43));
      const ed = r.pr.el.querySelector('.tlpr-edit'); assert.ok(ed.classList.contains('open'), 'open after one click');
      assert.ok(ed.parentElement.classList.contains('tlpr-main'), 'docked beside the notes, not floating');
      assert.ok(/Supersaw/.test(ed.textContent) && /G2/.test(ed.textContent), 'names the tool and the note');
      const groups = [...ed.querySelectorAll('.tlpr-group > summary')].map(x => x.textContent); assert.ok(groups.some(g => /filter/.test(g)) && groups.some(g => /osc/.test(g)), 'grouped like the tool: ' + groups);
      assert.ok(!/Pitch/.test(groups.join()), 'the track-wide Pitch curve is not a per-note knob');
      assert.ok(/1200|1.20k/.test(ed.querySelector('.tlpr-group').parentElement.textContent), 'shown where the tool has it now');
      r.fire(r.cv, 'pointerdown', r.pt(20, 70)); r.fire(r.cv, 'pointerup', r.pt(20, 70)); assert.ok(!ed.classList.contains('open'), 'a click on empty grid closes it');
    } finally { r.done(); }
  });
  it('a note longer than a bar: the length knob reaches the end of the clip', () => {
    const r = roll([{ s: 0, l: 4, n: 40, v: 0.9 }]);
    try { const ed = r.pr.openEditor(0); ed.length(28); ed.finish(); assert.equal(r.last()[0].l, 28, '1¾ bars'); } finally { r.done(); }
  });
  it('the lane under the notes draws the track’s curve for this clip’s bars; a click adds a point, the timeline gets it', () => {
    const lanes = [{ id: 'a1', kind: 'auto', target: 't1', key: '@pitch', name: 'Pitch', points: [[5, 0], [7, 12]] }];
    const r = roll([{ s: 0, l: 4, n: 40, v: 0.9 }], { knobs, lanes });
    try {
      r.pr.setLane('curve:a1'); const vel = r.pr.vel, rc = vel.getBoundingClientRect();
      assert.ok(rc.height >= 90, 'a taller lane for the curve');
      r.fire(vel, 'pointerdown', { clientX: rc.left + 16 * r.pr.state.pps + 3, clientY: rc.top + 10 }); r.fire(vel, 'pointerup', { clientX: rc.left + 16 * r.pr.state.pps + 3, clientY: rc.top + 10 });
      const e = r.log.filter(x => x[0] === 'auto_points').pop(); assert.ok(e, 'sent to the timeline'); assert.equal(e[1].id, 'a1');
      assert.equal(e[1].points.length, 3); assert.near(e[1].points[1][0], 6, 0.02, 'at bar 6 (one bar into a clip at bar 5)'); assert.gt(e[1].points[1][1], 18, 'near the top = up');
    } finally { r.done(); }
  });
  it('no Pitch curve yet: the lane menu offers one, and asks the timeline to make it', () => {
    const r = roll([{ s: 0, l: 4, n: 40, v: 0.9 }], { knobs, lanes: [] });
    try { r.pr.setLane('newpitch'); const e = r.log.find(x => x[0] === 'lane_add'); assert.deepEqual(e[1], { kind: 'auto', target: 't1', key: '@pitch' }); } finally { r.done(); }
  });
});

describe('The screen follows the sound (event-driven CSS)', () => {
  it('a loud low tone → --snd-low / --snd-level rise and the hue goes deep; silence settles back to 0; off means off', async () => {
    assert.ok(window.SoundCSS, 'loaded'); const K = Kernel; K.audio.boot(); const ac = K.audio.ctx; await ac.resume();
    SoundCSS.init(K); SoundCSS.set(true);
    const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 55; g.gain.value = 0.8; o.connect(g); g.connect(K.audio.chain.out); o.start();
    for (let i = 0; i < 12; i++) { await TH.sleep(40); SoundCSS.step(); }
    const v = (k) => +getComputedStyle(document.documentElement).getPropertyValue(k);
    try { assert.gt(v('--snd-low'), 0.3, 'low end'); assert.gt(v('--snd-level'), 0.2); assert.gt(v('--snd-hue'), 240, 'bass-weighted: violet'); }
    finally { o.stop(); o.disconnect(); }
    for (let i = 0; i < 20; i++) { await TH.sleep(40); SoundCSS.step(); }
    assert.lt(v('--snd-low'), 0.05, 'settles in silence');
    SoundCSS.set(false); assert.ok(document.documentElement.classList.contains('snd-off')); SoundCSS.set(true);
  });
});

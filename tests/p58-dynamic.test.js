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
  it('3.69 the accent colours themselves follow the sound — each keeps its own hue (no rainbow) and comes back exactly in silence', async () => {
    const K = Kernel; K.audio.boot(); const ac = K.audio.ctx; await ac.resume(); SoundCSS.init(K); SoundCSS.set(true);
    const L = SoundCSS.lit, hueOf = (c) => { const n = parseInt(c.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
      const h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return h * 60; };
    ['#00d4ff', '#ff2266', '#00ff88', '#b066ff', '#ffaa00'].forEach(c => { assert.equal(L(c, 0), c, 'silent = itself'); assert.lt(Math.abs(hueOf(L(c, 0.8)) - hueOf(c)), 4, c + ' keeps its hue'); assert.ok(L(c, 0.8) !== c, 'and lights up'); });
    const host = document.createElement('div'); host.innerHTML = '<div class="tp-overlay" style="--acc:#ff2266"><div class="uk-knob" style="--acc:#ff2266"></div></div>'; document.body.appendChild(host);
    const root = document.documentElement, pink0 = getComputedStyle(root).getPropertyValue('--pink').trim(), knob = host.querySelector('.uk-knob');
    const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 80; g.gain.value = 0.8; o.connect(g); g.connect(K.audio.chain.out); o.start();
    try {
      for (let i = 0; i < 12; i++) { await TH.sleep(40); SoundCSS.step(); }
      const pinkNow = root.style.getPropertyValue('--pink'); assert.ok(pinkNow && pinkNow !== pink0, 'the app’s pink is lit: ' + pinkNow);
      assert.ok(knob.style.getPropertyValue('--acc') !== '#ff2266', 'a control on a page lights too: ' + knob.style.getPropertyValue('--acc'));
    } finally { o.stop(); o.disconnect(); }
    for (let i = 0; i < 25; i++) { await TH.sleep(40); SoundCSS.step(); }
    assert.equal(root.style.getPropertyValue('--pink'), '', 'silence: the palette is the stylesheet’s again'); assert.equal(knob.style.getPropertyValue('--acc'), '#ff2266', 'and the control its own colour');
    host.remove();
  });
});

// 3.59 — "the piano roll completely in relation to the tool … a drop down in the corner to change the lane's tool"
describe('The piano roll is its tool’s editor', () => {
  function roll(A) {
    const log = [], view = { ui: UIKit, emit: (k, p) => log.push([k, p]) }, host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;width:1000px;height:520px;z-index:99999;display:flex;flex-direction:column'; document.body.appendChild(host);
    const pr = EravosTimelinePianoRoll.create(view, {}); host.appendChild(pr.el); pr.el.style.flex = '1';
    pr.show({ id: 'c1', bars: 2, startBar: 1, notes: [{ s: 0, l: 4, n: 40, v: 0.9 }] }, { id: 'l1', name: 'Bass', color: '#66ffcc', target: 't1' }, Object.assign({ key: { root: 0, scale: 'chromatic' } }, A));
    return { pr, log, done: () => host.remove() };
  }
  const A = { instruments: [{ value: 't1', label: '🌊 Supersaw ·k1f' }, { value: 't2', label: '🔊 Wobble Bass ·i3g' }],
    tools: { t1: { id: 'eravos.supersaw', label: 'Supersaw', icon: '🌊', category: 'Sound sources', presets: ['Anthem Lead', 'Hoover'] } },
    knobs: { t1: [{ key: 'cutoff', label: 'Cutoff', group: 'FILTER', type: 'number', min: 40, max: 8000, def: 800, val: 1200 }, { key: 'wave', label: 'Wave', group: 'OSC', type: 'enum', options: ['saw', 'square'], def: 'saw', val: 'square' }] } };
  it('the corner dropdown shows the track’s tool and changes it', () => {
    const r = roll(A);
    try {
      const box = r.pr.el.querySelector('.tlpr-toolsel'), sel = box.matches('select') ? box : box.querySelector('select'); assert.equal(sel.value, 't1'); assert.ok(sel.parentElement.parentElement === r.pr.el.querySelector('.tlpr-bar') || r.pr.el.querySelector('.tlpr-bar').contains(sel), 'in the roll’s bar');
      assert.equal(r.pr.el.querySelector('.tlpr-bar').firstElementChild.contains(sel), true, 'first thing in the corner');
      sel.value = 't2'; sel.dispatchEvent(new Event('change')); assert.deepEqual(r.log.find(x => x[0] === 'lane_edit')[1], { id: 'l1', patch: { target: 't2' } });
    } finally { r.done(); }
  });
  it('with no note picked the side panel IS the tool: its presets and every knob, at its settings — turning one turns the tool', () => {
    const r = roll(A);
    try {
      const ed = r.pr.el.querySelector('.tlpr-edit'); assert.ok(ed.classList.contains('open'), 'shown'); assert.ok(/Supersaw/.test(ed.textContent));
      const pre = [...ed.querySelectorAll('select')].find(s => [...s.options].some(o => o.value === 'Hoover')); assert.ok(pre, 'its presets');
      pre.value = 'Hoover'; pre.dispatchEvent(new Event('change')); assert.deepEqual(r.log.find(x => x[0] === 'tool_preset')[1], { target: 't1', name: 'Hoover' });
      const wave = [...ed.querySelectorAll('select')].find(s => [...s.options].some(o => o.value === 'square')); assert.equal(wave.value, 'square', 'at the tool’s setting');
      wave.value = 'saw'; wave.dispatchEvent(new Event('change')); assert.deepEqual(r.log.find(x => x[0] === 'tool_set')[1], { target: 't1', key: 'wave', value: 'saw' });
      const ed2 = r.pr.openEditor(0); assert.ok(/note E2/.test(ed.textContent), 'a note: its own settings'); ed2.finish(); assert.ok(/Supersaw/.test(ed.textContent) && /the whole track/.test(ed.textContent), 'and back to the tool');
    } finally { r.done(); }
  });
  it('the timeline turns the real tool: tool_set and tool_preset reach it like its own window would', () => {
    const ctx = new OfflineAudioContext(1, 8000, 8000), K = Kernel.create({ ctx, quiet: true }); MasterTransport.create(K, { offline: true, bpm: 120 }).boot();
    const tl = OrganismFactory.spawn('eravos.timeline', { K, headless: true }), sb = OrganismFactory.spawn('eravos.sub-engine', { K, headless: true }), s = OrganismFactory.handle(sb).ctx;
    K.bus.publish('ui:lane_add:' + tl, { kind: 'inst', target: sb, name: 'Sub' });
    const key = s.params.schema().find(c => c.type === 'number' && !c.hidden).key, c = s.params.schema().find(x => x.key === key), v = +(c.min + (c.max - c.min) * 0.37).toFixed(3);
    K.bus.publish('ui:tool_set:' + tl, { target: sb, key, value: v }); assert.near(s.params.get(key), v, (c.step || 0.01) + 1e-6, 'knob turned');
    const pre = Object.keys(OrganismFactory.def('eravos.sub-engine').presets || {})[0]; if (pre) { K.bus.publish('ui:tool_preset:' + tl, { target: sb, name: pre }); assert.equal(s.currentPreset, pre, 'preset loaded'); }
    assert.fault(K, 'RUNTIME_002', () => K.bus.publish('ui:tool_set:' + tl, { target: 'nope', key, value: 1 }), 'only the tools on its tracks');
  });
});

// 3.59 — "Can you make songs with a heavy bass drop"
describe('💥 Heavy Drops: songs built around the drop', () => {
  const G = () => SongEngine.genres().find(g => g.id === 'hd-heavy-drops');
  it('eight songs on their own shelf, every preset real', () => {
    assert.ok(G(), 'genre'); assert.equal(window.HeavyDropsSongbook.songs.length, 8);
    const bad = []; [].concat(Object.values(G().parts), G().fx || [], G().mods || []).forEach(p => { const d = OrganismFactory.def(p.organism); [].concat(p.preset || []).forEach(n => { if (!d || !(d.presets || {})[n]) bad.push(p.organism + ' "' + n + '"'); }); });
    assert.equal(bad.join(' · '), '');
    window.HeavyDropsSongbook.songs.forEach(id => { const s = Songbook.all().find(x => x.id === id); assert.ok(s, id); assert.equal(Songbook.categoryOf(s), 'heavy', id + ' on the 💥 Heavy Drops shelf'); });
    assert.equal(Songbook.categories().find(c => c.id === 'heavy').label, '💥 Heavy Drops');
  });
  it('the drop is written with everything: the floor falls out, dives at every turn, per-note wobble, a speed-up, a Pitch riser, the Drop Builder’s room', () => {
    const st = SongEngine.generate('hd-heavy-drops', 5901), steps = st.steps || st, clips = steps.filter(s => s.op === 'event' && s.topic === 'clip_add');
    const notesOf = (re) => clips.filter(c => re.test(c.payload.name)).flatMap(c => c.payload.notes);
    assert.ok(notesOf(/^Sub · pause$/).some(n => n.b && n.b.to === -24), 'pause: the sub dives two octaves');
    assert.gt(notesOf(/^Sub · drop$/).filter(n => n.b && n.b.to <= -12).length, 2, 'the sub dives at the turns');
    const wob = notesOf(/^Wobble · drop$/); assert.gt(new Set(wob.filter(n => n.p).map(n => n.p.div)).size, 2, 'a wobble rate per note');
    assert.ok(wob.some(n => n.b && n.b.osc && n.b.osc.rateTo === '1/32'), 'a wobble that speeds up'); assert.ok(wob.some(n => n.b && n.b.from > 0), 'glides in from above');
    const lanes = steps.filter(s => s.op === 'event' && s.topic === 'lane_add');
    const pitch = lanes.find(l => l.payload.key === '@pitch'); assert.ok(pitch, 'a Pitch riser lane'); assert.equal(pitch.payload.target, '@pad'); assert.equal(Math.max(...pitch.payload.points.map(p => p[1])), 7);
    const depth = lanes.find(l => l.payload.key === 'depth'); assert.ok(depth && depth.payload.osc, 'the wobble depth lane swings');
    const db = steps.find(s => s.op === 'mount' && s.organism === 'eravos.bass-drop-builder'); assert.ok(db, 'Drop Builder');
    const cf = steps.find(s => s.op === 'configure' && s.target === db.as); assert.gt(cf.params.subDive, 0); assert.gt(cf.params.spaceTail, 0); assert.gt(cf.params.orbit, 0); assert.equal(cf.params.tensionBars, 0);
  });
  it('it writes into a session with no fault: the lanes land on the right tracks, the Drop Builder fires on drop and drop 2', async () => {
    const U = TH.universe(0.2, { bpm: 145 }), n0 = U.K.faults.list().length, rec = Recipes.get('eravos.recipe.engine.hd-heavy-drops'); rec._pinned = 5901;
    await Recipes.run(rec.id, { K: U.K, headless: true, clear: true });
    assert.equal(U.K.faults.list().slice(n0).map(f => f.fault_class + ' ' + f.message).join(' | '), '');
    const tl = U.K.registry.byOrganism('eravos.timeline')[0].instance_id, ex = OrganismFactory.handle(tl).ctx.serialize().extra;
    const auto = ex.lanes.filter(l => l.kind === 'auto'); assert.equal(auto.length, 2, 'Pitch riser + wobble depth');
    const pad = U.K.registry.byOrganism('eravos.pad-forge')[0].instance_id; assert.equal(auto.find(l => l.key === '@pitch').target, pad, 'on the pad');
    assert.ok(auto.find(l => l.key === 'depth').osc, 'the depth lane oscillates');
    assert.ok(ex.markers.some(m => m.name === 'drop') && ex.markers.some(m => m.name === 'drop 2'));
    const d = OrganismFactory.handle(U.K.registry.byOrganism('eravos.bass-drop-builder')[0].instance_id).ctx; let armed = 0;
    ['drop', 'drop 2'].forEach((name, i) => { d.internals.armed; U.K.bus.publish('timeline:marker', { name, bar: i ? 59 : 26, time: 0 }); if (d.internals.armed) armed++; U.K.bus.publish('ui:abort:' + d.id, {}); });
    assert.equal(armed, 2, 'both drops arm it');
  });
});

// 3.60 — "the songs are supposed to have previews"
describe('Song previews', () => {
  const song = (id) => Songbook.all().find(x => x.id === id);
  it('every genre song has a map of its shape: sections with the drop, its parts, its tempo', () => {
    const m = SongPreview.map(song('hx1')); assert.ok(m, 'mapped'); assert.ok(m.secs.some(s => s.kind === 'drop') && m.secs.some(s => s.kind === 'pause'));
    assert.ok(m.parts.some(p => p.key === 'sub') && m.parts.some(p => p.key === 'growl')); assert.gt(m.bpm, 100); assert.equal(m.bars, m.secs.reduce((a, s) => a + s.bars, 0));
    const w = SongPreview.window(song('hx1')), drop = m.secs.find(s => s.kind === 'drop'); assert.equal(w.from, drop.bar - 3, 'two bars of build and the pause before the drop'); assert.ok(w.bars <= 9 && w.from + w.bars > drop.bar + 3, 'and the first bars of the drop');
    const missing = Songbook.all().filter(s => !s.recipe && SongEngine.genres().some(g => g.id === s.genre)).filter(s => !SongPreview.map(s)).map(s => s.id); assert.equal(missing.join(), '', 'every genre song');
  });
  it('the Songs page draws a strip on the cards and a map with ▶ Preview in the detail', async () => {
    Songbook.open(); const ov = document.querySelector('.overlay.sbk');
    try {
      const card = [...ov.querySelectorAll('.sbk-card')].find(c => /Floor Falls Out/.test(c.textContent)); card.click(); card.scrollIntoView();
      assert.ok(ov.querySelector('.sbk-card .sbk-strip'), 'strips on cards'); assert.ok(ov.querySelector('.sbk-detail .sbk-map'), 'a map'); assert.ok(/Preview/.test(ov.querySelector('.sbk-detail .sbk-prev').textContent));
      await TH.sleep(80); const cv = ov.querySelector('.sbk-detail .sbk-map'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let lit = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) lit++;
      assert.gt(lit, 500, 'the map is drawn');
    } finally { ov.querySelector('.sbk-x').click(); }
  });
  it('▶ Preview renders the build → pause → drop in its own universe (the canvas is untouched) — and you hear the drop', async () => {
    const n0 = Kernel.registry.list().length, r = await SongPreview.render(song('hx1'));
    assert.equal(Kernel.registry.list().length, n0, 'nothing added to your canvas'); assert.ok(r && !r.silent, 'sound');
    const x = r.buf.getChannelData(0), SR = r.buf.sampleRate, k = 1 - Math.exp(-2 * Math.PI * 120 / SR), d = new Float32Array(x.length); let y1 = 0, y2 = 0;   // the low end: two one-pole stages at 120 Hz
    for (let i = 0; i < x.length; i++) { y1 += k * (x[i] - y1); y2 += k * (y1 - y2); d[i] = y2; }
    const rms = (a, b) => { let q = 0, n = 0; for (let i = Math.floor(a * SR); i < Math.min(d.length, b * SR); i++) { q += d[i] * d[i]; n++; } return Math.sqrt(q / Math.max(1, n)); };
    const dropAt = 3 * r.barSec + 0.05;   // two bars of build, one bar of pause, then the drop
    assert.gt(rms(dropAt + 0.1, dropAt + 2 * r.barSec), rms(0.05, r.barSec * 2) * 1.5, 'the drop’s low end is far heavier than the build’s');
    assert.equal(await SongPreview.render(song('hx1')), r, 'rendered once, kept');
  }, { timeout: 60000 });
});

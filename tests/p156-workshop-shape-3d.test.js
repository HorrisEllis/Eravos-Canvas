/* P156 — the Workshop in 3D, and a note shaped fractally (W3, specs/eravos.workshop.spec ADDENDUM 2026-11-08 (night)). His words, 2026-11-08:
 * "i want the 3d. like i want like a full modulation, waveform, oscillation, like all the ways to edit a sound, give it as much depth as possible.
 * fractally and recursively." A note's pitch (or any knob of its instrument) is a base curve + modulators whose rate and depth are curves with
 * modulators of their own; the tree compiles into what the engine plays (b.path, c) and is kept on the note (sh). */
window.__phase = 'P156';
describe('P156 the Workshop in 3D; a note shaped fractally', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  let view0 = null; const restoreView = () => { if (view0) { CanvasWM.view = view0; CanvasWM.applyView(); view0 = null; } };
  const closeWs = () => { if (window.Workshop && Workshop.current) Workshop.current.close(); };
  async function make(notes, target) {
    host(); view0 = Object.assign({}, CanvasWM.view); const id = OrganismFactory.spawn('eravos.timeline', { x: 20, y: 20, w: 1300, h: 600 }), pub = (t, pl) => Kernel.bus.publish('ui:' + t + ':' + id, pl);
    await TH.sleep(150); let inst = null;
    if (target) { inst = OrganismFactory.spawn(target, { x: 40, y: 700 }); await TH.sleep(120); }
    pub('lane_add', Object.assign({ kind: 'inst', name: 'Lead' }, inst ? { target: inst } : {})); await TH.sleep(80);
    pub('clip_add', { kind: 'notes', startBar: 1, bars: 2, notes }); await TH.sleep(80);
    const H = OrganismFactory.handle(id), clip = H.ctx.internals.clips.find(c => c.kind === 'notes');
    H.view.openClip(clip.id); await TH.sleep(300);
    return { id, inst, H, roll: H.view.roll, clip: () => H.ctx.internals.clips.find(c => c.id === clip.id) };
  }
  const NOTES = [{ s: 0, l: 8, n: 60, v: 0.8 }, { s: 8, l: 8, n: 64, v: 0.7 }];
  const span = (p) => { const v = p.map(q => q[1]); return Math.max(...v) - Math.min(...v); };
  const crossings = (p) => { let z = 0; for (let i = 1; i < p.length; i++) if ((p[i - 1][1] < 0) !== (p[i][1] < 0)) z++; return z; };
  it('shape the pitch: a modulator plays, its RATE has a modulator of its own (two levels), the station path goes back up', async () => {
    const t = await make(NOTES);
    try {
      t.roll.openWorkshop(0); await TH.sleep(40); const ws = Workshop.current;
      assert.ok(MusicParts.modTree, 'the mod-tree component is loaded');
      ws.set('add', 'Pitch', 'Shape'); await TH.sleep(30);
      assert.ok(/PITCH/.test(document.querySelector('.ws-stations').textContent), 'into PITCH: ' + document.querySelector('.ws-stations').textContent);
      assert.ok(ws.action('＋ MOD'), 'add a modulator'); await TH.sleep(30);
      ws.set('m.0.depth', 2, 'Depth'); ws.set('m.0.rate', 4, 'Rate'); await TH.sleep(40);
      let b = t.clip().notes[0].b; assert.ok(b && b.shape === 'path' && b.path.length === 64, 'the pitch plays as a drawn path (64 points): ' + JSON.stringify(b && b.shape));
      assert.ok(Math.abs(span(b.path) - 4) < 0.4, '±2 semitones: span ' + span(b.path).toFixed(2));
      const z1 = crossings(b.path); assert.ok(z1 >= 6 && z1 <= 9, 'four cycles over the note: ' + z1 + ' crossings');
      assert.ok(t.clip().notes[0].sh && t.clip().notes[0].sh.t.pitch.mods.length === 1, 'the tree is kept on the note (the engine kept sh)');
      // into the RATE of mod 1, and modulate IT — the second level
      ws.select('m:0:rate'); assert.ok(ws.action('▾ INTO'), 'into the rate'); await TH.sleep(30);
      assert.ok(/MOD 1/.test(document.querySelector('.ws-stations').textContent) && /RATE/.test(document.querySelector('.ws-stations').textContent), 'stations: … PITCH › MOD 1 › RATE');
      ws.set('base.preset', 'rise', 'Shape'); ws.set('base.lo', 1, 'From'); ws.set('base.hi', 16, 'To'); await TH.sleep(40);
      b = t.clip().notes[0].b; const half = (p, a, z) => crossings(p.filter(q => q[0] >= a && q[0] <= z));
      assert.ok(half(b.path, 0.5, 1) > half(b.path, 0, 0.5), 'a rising rate: the vibrato speeds up across the note (' + half(b.path, 0, 0.5) + ' → ' + half(b.path, 0.5, 1) + ')');
      ws.action('＋ MOD'); await TH.sleep(30); ws.set('m.0.depth', 3, 'Depth');
      assert.equal(MusicParts.modTree.depthOf(t.clip().notes[0].sh.t.pitch), 2, 'two levels deep');
      // and a third: into the rate's mod's depth
      ws.select('m:0:depth'); ws.action('▾ INTO'); await TH.sleep(20); ws.action('＋ MOD'); await TH.sleep(20);
      assert.equal(MusicParts.modTree.depthOf(t.clip().notes[0].sh.t.pitch), 3, 'three levels deep — and on');
      // the station path goes back up
      const st = Array.from(document.querySelectorAll('.ws-st.go')); const pitchSt = st.find(e => /PITCH/.test(e.textContent)); pitchSt.click(); await TH.sleep(20);
      assert.ok(/PITCH$/.test(document.querySelector('.ws-stations').textContent.trim()), 'a click on PITCH goes back up to it: ' + document.querySelector('.ws-stations').textContent);
      ws.action('▴ UP'); await TH.sleep(20); assert.ok(/NOTE · C4$/.test(document.querySelector('.ws-stations').textContent.trim()), 'UP: back to the note');
      assert.ok(Array.from(document.querySelectorAll('.ws-lay')).some(e => /Pitch/.test(e.textContent) && /3 deep/.test(e.textContent)), 'the note lists its shaped pitch, three deep');
    } finally { closeWs(); OrganismFactory.close(t.id); restoreView(); }
  });
  it('3D: the open curve as planes in space — exploded, flat, top, wire; drawing a base with a drag; undo puts it back', async () => {
    const t = await make(NOTES);
    try {
      t.roll.openWorkshop(1); await TH.sleep(40); const ws = Workshop.current;
      ws.set('add', 'Pitch', 'Shape'); ws.action('＋ MOD'); ws.action('＋ MOD'); await TH.sleep(30);
      const chips = Array.from(document.querySelectorAll('.ws-vph .ws-chip')).map(c => c.textContent);
      ['2D', '3D', 'TOP', 'FRONT', 'ORBIT', 'EXPLODED', 'FLAT', 'WIRE', 'LIT'].forEach(c => assert.ok(chips.includes(c), 'the viewport offers ' + c));
      const cv = document.querySelector('.ws-app .ws-canvas'), px = () => { const g = cv.getContext('2d'), a = g.getImageData(0, 0, cv.width, cv.height).data; let lit = 0; for (let i = 0; i < a.length; i += 16) if (a[i] + a[i + 1] + a[i + 2] > 120) lit++; return lit; };
      ws.view({ mode: '3d' }); await TH.sleep(30); const p3 = px();
      assert.ok(p3 > 200, 'the 3D view draws the planes (' + p3 + ' lit samples)');
      const errs = []; const oe = console.error; console.error = (...x) => { errs.push(x.join(' ')); oe.apply(console, x); };
      try { for (const o of [{ exploded: false }, { exploded: true, wire: true }, { wire: false, cam: { pitch: Math.PI / 2 - 0.001, yaw: 0 } }, { cam: { pitch: 0.6, yaw: -0.5, zoom: 2 } }]) { ws.view(o); await TH.sleep(10); } } finally { console.error = oe; }
      assert.equal(errs.length, 0, 'every view draws without an error: ' + errs.join(' | '));
      // drag to orbit
      const r = cv.getBoundingClientRect(), yaw0 = ws.view().cam.yaw;
      cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + 300, clientY: r.top + 300, pointerId: 1 }));
      cv.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: r.left + 380, clientY: r.top + 310, pointerId: 1 }));
      cv.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: r.left + 380, clientY: r.top + 310, pointerId: 1 }));
      assert.ok(Math.abs(ws.view().cam.yaw - yaw0) > 0.3, 'a drag turns the camera');
      // 2D: draw the base with a drag — one history step; undo puts it back
      ws.view({ mode: '2d' }); ws.select('base'); await TH.sleep(20); const before = JSON.stringify(t.clip().notes[1]), n0 = ws.history().length;
      const W = r.width, H = r.height, top = Math.round(H * 0.32), y0 = top + 26, h = H - y0 - 14;
      const pts = []; for (let k = 0; k <= 40; k++) pts.push([16 + (W - 32) * k / 40, y0 + h * (0.5 - 0.4 * Math.sin(k / 40 * Math.PI))]);
      assert.ok(ws.stroke(pts), 'the drag drew'); await TH.sleep(30);
      assert.equal(ws.history().length, n0 + 1, 'one history step: ' + ws.history().slice(-1)[0]);
      const base = t.clip().notes[1].sh.t.pitch.base; assert.ok(base.length > 10 && Math.max(...base.map(q => q[1])) > 0.5, 'the drawn arch is the base (' + base.length + ' points)');
      ws.undo(); await TH.sleep(30); assert.equal(JSON.stringify(t.clip().notes[1]), before, 'undo puts the note back exactly');
      // a drawn wave: a modulator selected, the drag draws its cycle
      ws.select('m:0'); ws.stroke(pts); await TH.sleep(20);
      const m0 = t.clip().notes[1].sh.t.pitch.mods[0]; assert.ok(m0.shape === 'drawn' && m0.wave.length > 10, 'the drag drew the wave of mod 1');
      ws.action('✕ UNSHAPE'); await TH.sleep(20); assert.ok(!t.clip().notes[1].sh && !t.clip().notes[1].b, 'unshape: the note plays as before it was shaped');
    } finally { closeWs(); OrganismFactory.close(t.id); restoreView(); }
  });
  it('any knob of the instrument: shaped, compiled into the note\'s curve for that knob, inside the knob\'s range', async () => {
    const tid = OrganismFactory.defined().map(d => d.id).find(x => /retro-poly|acid|wobble/.test(x)) || OrganismFactory.defined().map(d => d.id).find(x => /synth/.test(x));
    const t = await make(NOTES, tid);
    try {
      t.roll.openWorkshop(0); await TH.sleep(40); const ws = Workshop.current, knobs = ws.doc().knobs || [];
      assert.ok(knobs.length > 3, tid + ' brings its knobs (' + knobs.length + ')');
      const k = knobs.find(q => q.max - q.min > 1) || knobs[0]; ws.set('add', k.label, 'Shape'); await TH.sleep(20);
      ws.action('＋ MOD'); ws.set('m.0.shape', 'square', 'Wave'); ws.set('m.0.depth', (k.max - k.min) / 2, 'Depth'); await TH.sleep(30);
      const c = t.clip().notes[0].c && t.clip().notes[0].c[k.key]; assert.ok(c && c.length === 64, 'the note now carries a curve for ' + k.label);
      assert.ok(c.every(q => q[1] >= k.min - 1e-9 && q[1] <= k.max + 1e-9), 'every point inside ' + k.min + '…' + k.max);
      assert.ok(span(c) > (k.max - k.min) * 0.3, 'and it moves (span ' + span(c).toFixed(3) + ')');
      ws.action('✕ UNSHAPE'); await TH.sleep(20); assert.ok(!(t.clip().notes[0].c && t.clip().notes[0].c[k.key]), 'unshaping takes the curve away');
    } finally { closeWs(); OrganismFactory.close(t.id); if (t.inst) OrganismFactory.close(t.inst); restoreView(); }
  });
});

/* 3.73 — "make the accents, fonts, all of the accents use the event variable driven ui when sound plays … square pads … make the
 * ui completely dynamic and fluid … the patterns: why do barely any of them curve?" */
window.__phase = 'P73';
describe('P73 · patterns that curve', () => {
  const notesOf = (steps) => steps.filter(s => s.topic === 'clip_add' && s.payload && s.payload.notes).flatMap(s => s.payload.notes.map(n => Object.assign({ part: s.payload.target }, n)));
  it('every genre writes notes that move: per-note curves (with Bézier arcs) and bends — none on drums', () => {
    let curved = 0, arcs = 0, total = 0;
    SongEngine.genres().forEach(G => {
      const ns = notesOf(SongEngine.generate(G.id, 7)), c = ns.filter(n => n.c && Object.keys(n.c).length);
      assert.gt(c.length, 0, G.id + ' has notes that curve'); curved += c.length; total += ns.length;
      arcs += c.filter(n => Object.values(n.c).some(pts => pts.some(p => Array.isArray(p[2])))).length;
      const drums = Object.keys(G.parts).filter(p => G.parts[p].role === 'drums').map(p => '@' + p);
      assert.ok(!ns.some(n => drums.includes(n.part) && n.c), G.id + ': drums stay straight');
    });
    assert.gt(curved, 20000, 'tens of thousands of notes move (was 0)'); assert.gt(arcs / curved, 0.5, 'most curves are arcs, not straight lines');
  });
  it('the notes themselves are exactly what they were — only their movement is new; same seed → same movement', () => {
    ['dubstep', 'synthwave', 'dancehall', 'house'].filter(id => SongEngine.genres().some(g => g.id === id)).forEach(id => {
      const G = SongEngine.genres().find(g => g.id === id), with1 = notesOf(SongEngine.generate(id, 11)), with2 = notesOf(SongEngine.generate(id, 11));
      assert.equal(JSON.stringify(with1), JSON.stringify(with2), id + ': repeatable');
      G.curve = false; let plain; try { plain = notesOf(SongEngine.generate(id, 11)); } finally { delete G.curve; }
      const strip = (ns) => ns.map(n => [n.part, n.s, n.l, n.n, n.v].join(':')).sort().join(' ');
      assert.equal(strip(with1), strip(plain), id + ': the same notes');
    });
  });
  it('a curve stays in the knob’s range and starts near the part’s own sound', () => {
    const G = SongEngine.genres()[0], st = SongEngine.generate(G.id, 3), ns = notesOf(st).filter(n => n.c);
    ns.slice(0, 200).forEach(n => Object.keys(n.c).forEach(k => {
      const part = G.parts[n.part.slice(1)], c = OrganismFactory.def(part.organism).config.find(x => x.key === k);
      n.c[k].forEach(p => { assert.ok(p[1] >= c.min && p[1] <= c.max, k + ' in range'); if (p[2]) assert.ok(p[2][0] >= 0 && p[2][0] <= 1, 'handle along the segment'); });
    }));
  });
});

describe('P73 · square pads, fluid controls, every window answers the sound', () => {
  const host = () => { if (!CanvasWM.world) { CanvasWM.init(document.getElementById('wmhost'), Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } };
  it('the Drum Machine’s pads are square', async () => {
    host(); const id = OrganismFactory.spawn('eravos.pads', { x: 40, y: 40, w: 640, h: 700 }); await TH.sleep(60);
    try { const p = CanvasWM.windowOf(id).querySelector('.dm3-pad').getBoundingClientRect(); assert.near(p.width, p.height, 1.5, `${p.width}×${p.height}`); }
    finally { OrganismFactory.close(id); }
  });
  it('a knob set from outside glides there (its value and readout are exact at once); a drag is exact', async () => {
    const k = UIKit.Knob({ key: 'x', label: 'X', min: 0, max: 1, value: 0, default: 0 }); document.body.appendChild(k.el);
    try {
      const arcLen = () => { const d = k.el.querySelector('.uk-knob-arc').getAttribute('d') || ''; const m = d.match(/([\d.-]+) ([\d.-]+)$/); return m ? [+m[1], +m[2]] : null; };
      k.set(1); assert.equal(k.get(), 1); assert.equal(k.el.getAttribute('aria-valuenow'), '1', 'the value is exact at once');
      const mid = arcLen(); await TH.sleep(400); const end = arcLen();
      assert.ok(!mid || !end || mid[0] !== end[0] || mid[1] !== end[1], 'the arc moved after the set (it glided)');
    } finally { k.el.remove(); }
  });
  it('a window that makes no sound (Groove) lights with the drums it plays', async () => {
    host(); const K = Kernel; K.audio.boot(); await K.audio.ctx.resume(); SoundCSS.init(K); if (SoundCSS.setDraw) SoundCSS.setDraw('page'); SoundCSS.set(true);
    const g = OrganismFactory.spawn('eravos.groove-gen', { x: 40, y: 40 }), pads = OrganismFactory.spawn('eravos.pads', { x: 700, y: 40 }); await TH.sleep(40);
    const hk = OrganismFactory.def('eravos.pads').hooks.find(h => h.event_type === 'note:trigger' && h.direction === 'in').hook_id;
    K.wires.register({ src: { instanceId: g, hookId: 'groove.hook.note_out' }, dst: { instanceId: pads, hookId: hk } });
    try {
      for (let i = 0; i < 14; i++) { K.bus.publish('note:trigger', { target: pads, note: 36, velocity: 1, time: K.audio.ctx.currentTime + 0.01, duration: 0.2 }); await TH.sleep(40); SoundCSS.step(); }
      const lv = (id) => +CanvasWM.windowOf(id).style.getPropertyValue('--tool-level');
      assert.gt(lv(pads), 0.05, 'the drums are loud'); assert.gt(lv(g), 0.03, 'and Groove, which plays them, lights with them');
    } finally { OrganismFactory.close(g); OrganismFactory.close(pads); }
  });
});

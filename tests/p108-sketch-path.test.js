/* P108 · the timeline's Sketch draws smooth and connected — his words, 2026-11-05: "can you start with the timeline? make it easier
 * and the drawing more smooth and connects to each other". Before, a drawn line in curves mode became a row of short notes, each a
 * straight bend between two points (corners, gaps between them). Now one stroke is ONE note whose bend follows the line itself:
 * smoothed (hand jitter out), reduced to ≤ 48 points, played through a monotone curve (MusicParts.pathAt — no corners, no overshoot). */
window.__phase = 'P108';
describe('P108 · Sketch: one stroke → one smooth note that follows the line', () => {
  function roll() {
    const log = [], view = { ui: UIKit, emit: (k, p) => log.push([k, p]) };
    const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;width:900px;height:420px;z-index:99999;background:#000';
    document.body.appendChild(host);
    const pr = EravosTimelinePianoRoll.create(view, {}); host.appendChild(pr.el);
    pr.show({ id: 'c1', bars: 2, startBar: 1, notes: [] }, { id: 'l1', name: 'Lead', color: '#ff66cc' }, { key: { root: 9, scale: 'minor' } });
    return { pr, log, done: () => host.remove() };
  }
  // a hand-drawn wave: 3 half-periods, ±4 semitones around C5, with a little jitter
  const wave = () => { const P = []; for (let i = 0; i <= 120; i++) P.push([i / 4, 72 + Math.sin(i / 120 * Math.PI * 3) * 4 + (i % 2 ? 0.15 : -0.15)]); return P; };

  it('one stroke is one note, its bend a path that goes where the hand went, with no corners', () => {
    const r = roll();
    try {
      const add = r.pr.sketch(wave(), 'curves');
      assert.equal(add.length, 1, 'one stroke → one note (connected, no gaps)');
      const n = add[0], b = n.b;
      assert.equal(b.shape, 'path'); assert.ok(b.path.length >= 8 && b.path.length <= 48, 'path reduced to ≤ 48 points: ' + b.path.length);
      assert.near(n.s, 0, 0.01); assert.near(n.l, 30, 0.5, 'the note spans the stroke');
      // the played pitch follows the line within half a semitone
      let worst = 0; for (let i = 0; i <= 120; i++) { const f = i / 120, want = Math.sin(f * Math.PI * 3) * 4, got = n.n + MusicParts.pathAt(b.path, f) - 72; worst = Math.max(worst, Math.abs(got - want)); }
      assert.ok(worst < 0.5, 'follows the line within ½ semitone (worst ' + worst.toFixed(2) + ')');
      // smooth: no corner — the slope never jumps between neighbouring samples
      let jump = 0, prev = null; for (let i = 1; i <= 400; i++) { const s = (MusicParts.pathAt(b.path, i / 400) - MusicParts.pathAt(b.path, (i - 1) / 400)) * 400; if (prev !== null) jump = Math.max(jump, Math.abs(s - prev)); prev = s; }
      assert.ok(jump < 6, 'no corners (largest slope jump ' + jump.toFixed(2) + ' st per clip)');
      const e = r.log.filter(x => x[0] === 'clip_edit').pop(); assert.ok(e && e[1].patch.notes.length === 1, 'committed to the clip as one note');
    } finally { r.done(); }
  });

  it('the timeline keeps the drawn path through save (a wave that starts and ends at 0 is still a bend)', async () => {
    const id = OrganismFactory.spawn('eravos.timeline', { x: 40, y: 40 });
    try {
      const H = OrganismFactory.handle(id), pub = (t, pl) => Kernel.bus.publish('ui:' + t + ':' + id, pl);
      pub('lane_add', { kind: 'inst', name: 'Lead' }); await TH.sleep(60);
      const path = [[0, 0], [0.25, 3], [0.5, 0], [0.75, -3], [1, 0]];
      pub('clip_add', { kind: 'notes', startBar: 1, bars: 2, notes: [{ s: 0, l: 16, n: 72, v: 0.8, b: { shape: 'path', path, from: 0, to: 0 } }] }); await TH.sleep(80);
      const c = H.ctx.internals.clips.find(x => x.kind === 'notes'); assert.ok(c, 'clip made');
      const b = c.notes[0].b; assert.ok(b && b.shape === 'path', 'path kept: ' + JSON.stringify(b));
      assert.equal(b.path.length, 5); assert.equal(b.path[1][1], 3); assert.equal(b.from, 0); assert.equal(b.to, 0);
    } finally { OrganismFactory.close(id); }
  });
});

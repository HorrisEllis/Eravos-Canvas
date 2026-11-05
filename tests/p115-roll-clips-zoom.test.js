/* P115 · piano roll: notes like clips, and canvas zoom — his words, 2026-11-05: "what about a canvas mode with a zoom in so it can be
 * smaller or thinner wave forms?" → "im saying the piano roll … i wanted it to be like the song recorder, where theyre like clips".
 * Both are options kept with the Timeline (today's look is the default). */
window.__phase = 'P115';
describe('P115 · piano roll: Clip look and Canvas zoom', () => {
  const HI = 107;
  function roll(state) {
    const log = [], binds = {}, view = { ui: UIKit, state: state || {}, emit: (k, p) => log.push([k, p]), bind: (k, fn) => { binds[k] = fn; } };
    const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;width:1100px;height:460px;z-index:99999;background:#000';
    document.body.appendChild(host);
    const pr = EravosTimelinePianoRoll.create(view, {}); host.appendChild(pr.el);
    pr.show({ id: 'c1', bars: 2, startBar: 1, notes: [{ s: 0, l: 8, n: 69, v: 0.9 }, { s: 8, l: 8, n: 76, v: 0.5 }] }, { id: 'l1', name: 'Lead', color: '#ff66cc', target: 'eravos.supersaw' }, { key: { root: 9, scale: 'minor' } });
    return { pr, log, binds, done: () => host.remove() };
  }
  const px = (cv, x, y) => { const d = cv.getContext('2d').getImageData(Math.round(x * (cv.width / cv.offsetWidth)), Math.round(y * (cv.height / cv.offsetHeight)), 1, 1).data; return [d[0], d[1], d[2]]; };
  it('Clip look: off by default; on, a note is see-through with a waveform inside, and it is kept with the Timeline', () => {
    const r = roll();
    try {
      const st = r.pr.state, cv = r.pr.canvas, x = 4 * st.pps, yTop = (HI - 69) * st.row + 2;
      const solid = px(cv, x, yTop);
      const tog = [...r.pr.el.querySelectorAll('.tlpr-more .uk-toggle')].find(b => /Clip look/.test(b.textContent)); assert.ok(tog, 'a Clip look switch'); assert.ok(!tog.classList.contains('on'), 'off by default');
      tog.click(); const cc = r.log.filter(x => x[0] === 'config_change').pop(); assert.ok(cc && cc[1].key === 'rollClips' && cc[1].value === true, 'kept (rollClips)');
      const clipPx = px(cv, x, yTop); assert.ok(clipPx.reduce((a, b) => a + b) < solid.reduce((a, b) => a + b), 'the body is see-through now: ' + solid + ' → ' + clipPx);
      // a waveform: along the note's middle row the colour comes and goes
      const ys = []; for (let k = 0; k < st.row; k++) ys.push(px(cv, x, (HI - 69) * st.row + k).reduce((a, b) => a + b)); assert.gt(Math.max(...ys) - Math.min(...ys), 120, 'a line drawn inside it');
    } finally { r.done(); }
  });
  it('Canvas zoom: the wheel zooms time and pitch together; rows go down to 4 px; off, the wheel over a note is its velocity as before', () => {
    const r = roll({ rollCanvasZoom: true });
    try {
      const cv = r.pr.canvas, wheel = (dy, o) => cv.dispatchEvent(new WheelEvent('wheel', Object.assign({ deltaY: dy, bubbles: true, cancelable: true, clientX: cv.getBoundingClientRect().left + 100, clientY: cv.getBoundingClientRect().top + 100 }, o || {})));
      const p0 = r.pr.state.pps, r0 = r.pr.state.row; wheel(-100);
      assert.gt(r.pr.state.pps, p0, 'time zoomed in'); assert.gt(r.pr.state.row, r0, 'pitch zoomed in with it');
      for (let i = 0; i < 30; i++) wheel(100); assert.equal(r.pr.state.row, 4, 'down to thin 4 px rows');
      r.binds.rollCanvasZoom(false); const p1 = r.pr.state.pps; wheel(-100); assert.equal(r.pr.state.pps, p1, 'off: the wheel does not zoom');
    } finally { r.done(); }
  });
});

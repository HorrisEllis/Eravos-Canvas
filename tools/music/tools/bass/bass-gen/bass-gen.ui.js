/* eravos.bass-gen UI — 1.1 (3.79, in the look kit, the Groove way). The window is the tool: the line screen (the last two bars as
 * played: pitch up, length across, slides drawn as curves, ghosts hollow, level as brightness), the rhythm strip, a knob bank
 * (ENERGY large, length, octave, slides, ghosts, jumps) and its own chords. Its page adds STEPS — a lane per step for level, octave
 * and slide (drag the bars, click the cells) — and the rest of the feel, beside MOTION and PERFORM from the domain. */
OrganismFactory.reg('eravos.bass-gen', function (view) {
  const UI = view.ui, h = UI.h;
  const cfg = (k) => (view.descriptor.config || []).find(c => c.key === k);
  const ctl = (k, o) => UI.paramControl(view, cfg(k), o || {});
  const head = (title, right) => h('div', { class: 'mo-head' }, [h('span', { class: 'mo-dot' }), h('span', { class: 'mo-cap', text: title }), h('span', { class: 'mo-rule' })].concat(right || []));
  const strip = (k, label) => { const c = ctl(k, { noLabel: true, segMax: 5 }); return h('div', { class: 'gg-strip' }, [h('div', { class: 'mo-lab', text: label }), c ? c.el : null]); };
  // the colour the window shows now (it follows the sound: core/sound-css.js lights --acc)
  let accNow = view.descriptor.accent || '#7c4dff', accAt = 0;
  const acc = (el) => { const n = performance.now(); if (n - accAt > 250) { accAt = n; const v = getComputedStyle(el).getPropertyValue('--acc').trim(); if (v) accNow = v; } return accNow; };
  if (UI.alive) UI.alive(view, { events: ['bass_note'], port: null });

  // ---- the line screen: what it played, the last two bars
  const notes = new Array(32).fill(null); let cursor = -1;
  const now = h('div', { class: 'bl-now', text: '—' }), src = h('div', { class: 'bl-src', text: '' });
  const cv = UI.Canvas(560, 150); cv.classList.add('gg-map');
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, H = cv.H, cw = W / 32, A = acc(cv); g.clearRect(0, 0, W, H);
    for (let s = 0; s < 32; s++) { g.fillStyle = s % 4 === 0 ? '#121a24' : '#0c121a'; g.fillRect(s * cw + 1, 1, cw - 2, H - 2); }
    g.fillStyle = '#1c2836'; g.fillRect(W / 2 - 0.5, 0, 1, H);
    const on = notes.filter(Boolean); if (on.length) {
      let lo = Math.min(...on.map(n => n.note)), hi = Math.max(...on.map(n => n.note)); if (hi - lo < 12) { const m = (hi + lo) / 2; lo = m - 6; hi = m + 6; }
      const y = (n) => 10 + (1 - (n - lo) / (hi - lo)) * (H - 26), nh = 9;
      let prev = null;
      for (let s = 0; s < 32; s++) {
        const n = notes[s]; if (!n) continue;
        let nx = s + 1; while (nx < 32 && !notes[nx]) nx++;   // a note is drawn until the next one starts
        const x = s * cw + 1.5, w = Math.max(cw * 0.6, Math.min(nx - s, n.dur) * cw - 3), yy = y(n.note);
        if (n.slide && prev) {   // the slide: a curve from where the last note was to this one
          const px = prev.x + prev.w, py = prev.y + nh / 2; g.strokeStyle = A; g.globalAlpha = 0.7; g.lineWidth = 1.5;
          g.beginPath(); g.moveTo(px, py); g.bezierCurveTo(px + (x - px) * 0.6, py, x - (x - px) * 0.4, yy + nh / 2, x, yy + nh / 2); g.stroke();
        }
        g.globalAlpha = 0.3 + 0.7 * n.vel; g.shadowColor = A; g.shadowBlur = n.ghost ? 0 : 8 * n.vel;
        if (n.ghost) { g.strokeStyle = A; g.lineWidth = 1; g.strokeRect(x, yy, w, nh); }
        else { g.fillStyle = A; g.fillRect(x, yy, w, nh); }
        g.shadowBlur = 0; g.globalAlpha = 0.85; g.fillStyle = '#e8eef6'; g.font = '600 8.5px monospace';
        if (!n.ghost && w > 18) g.fillText(n.name, x + 2, yy - 2);
        g.globalAlpha = 1; prev = { x, w, y: yy };
      }
    }
    if (cursor >= 0) { const x = cursor * cw; g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(x, 0, cw, H); g.fillStyle = A; g.shadowColor = A; g.shadowBlur = 8; g.fillRect(x, 0, 2, H); g.shadowBlur = 0; }
  }, 30);
  view.on('bass_note', (n) => UI.atTime(view.ac, n.time, () => { notes[n.step] = n; now.textContent = n.name; }));
  view.on('bass_step', (x) => UI.atTime(view.ac, x.time, () => { cursor = x.step; notes[(x.step + 1) % 32] = null; }));
  view.on('state_sync', (s) => { if (!s) return; if (s.note) now.textContent = s.note.name; if (s.following !== undefined) src.textContent = (s.following ? 'ON THE KICK OF THE WIRED GROOVE' : 'ON ITS OWN RHYTHM') + ' · ' + (s.chordFrom ? 'CHORDS FROM THE WIRED CHORDS' : 'ITS OWN CHORDS'); if (s.params && s.params.steps) paintSteps(s.params.steps); });

  // ---- the window
  const play = h('div', { class: 'gg-play' }, [
    h('div', { class: 'gg-top' }, [UI.presetBar(view), h('div', { class: 'gg-tools' }, [UI.Button({ label: '🎲', hint: 'a new seed: the same settings, other ghosts, jumps and slides', onClick: () => view.emit('reseed', {}) }).el])]),
    h('section', { class: 'gg-sec' }, [head('Line', [ctl('rhythm', { noLabel: true }).el]),
      h('div', { class: 'bl-read' }, [now, src]), cv,
      h('div', { class: 'gg-bank' }, [
        h('div', { class: 'gg-knobs' }, [ctl('energy', { big: true, size: 64 }).el, ctl('length', { size: 44 }).el, ctl('octave', { size: 44 }).el, ctl('slides', { size: 44 }).el, ctl('ghosts', { size: 44 }).el, ctl('jumps', { size: 44 }).el]),
        h('div', { class: 'gg-strips' }, [strip('progression', 'Own chords'), strip('chordBars', 'Bars / chord')]),
      ])]),
    h('div', { class: 'gg-hint', text: 'WIRE A CHORDS’ CHORD OUT AND A GROOVE’S STEP OUT IN · ITS NOTE OUT INTO A BASS (REESE, WOBBLE, ACID)' }),
  ]);

  // ---- STEPS (its page): level bars, octave cells, slide cells — one column per 16th
  let St = { vel: new Array(16).fill(0), oct: new Array(16).fill(0), slide: new Array(16).fill(0) };
  const lanes = UI.Canvas(560, 172); lanes.classList.add('gg-map', 'bl-lanes'); lanes.style.cursor = 'pointer';
  const LH = { vel: [0, 100], oct: [108, 138], slide: [142, 172] }, LW = 56;
  UI.loop(lanes, () => {
    const g = lanes.g, W = lanes.fit().W, cw = (W - LW) / 16, A = acc(lanes); g.clearRect(0, 0, W, lanes.H);
    g.font = '700 8.5px monospace'; g.fillStyle = '#8796a8'; g.fillText('LEVEL', 4, 54); g.fillText('OCTAVE', 4, 127); g.fillText('SLIDE', 4, 161);
    for (let s = 0; s < 16; s++) {
      const x = LW + s * cw, beat = s % 4 === 0, base = beat ? '#121a24' : '#0c121a';
      // level: a bar up or down from the middle line
      g.fillStyle = base; g.fillRect(x + 1, LH.vel[0] + 1, cw - 2, 98);
      const v = St.vel[s], mid = 50; g.fillStyle = A; g.globalAlpha = 0.35 + 0.65 * Math.abs(v); g.shadowColor = A; g.shadowBlur = 6 * Math.abs(v);
      if (v) g.fillRect(x + 3, v > 0 ? mid - v * 46 : mid, cw - 6, Math.abs(v) * 46); else g.fillRect(x + 3, mid - 1, cw - 6, 2);
      g.shadowBlur = 0; g.globalAlpha = 1;
      // octave and slide: cells that say what they do
      [['oct', St.oct[s], St.oct[s] > 0 ? '+1' : St.oct[s] < 0 ? '−1' : '·'], ['slide', St.slide[s], St.slide[s] > 0 ? 'ON' : St.slide[s] < 0 ? 'OFF' : 'AUTO']].forEach(([k, val, txt]) => {
        const [y0, y1] = LH[k]; g.fillStyle = base; g.fillRect(x + 1, y0 + 1, cw - 2, y1 - y0 - 2);
        if (val) { g.strokeStyle = val > 0 ? A : '#5b6878'; g.lineWidth = 1.5; g.strokeRect(x + 2, y0 + 2, cw - 4, y1 - y0 - 4); }
        g.fillStyle = val > 0 ? A : val < 0 ? '#8796a8' : '#3a4656'; g.font = '700 8.5px monospace'; g.textAlign = 'center'; g.fillText(txt, x + cw / 2, (y0 + y1) / 2 + 3); g.textAlign = 'left';
      });
      if (cursor >= 0 && cursor % 16 === s) { g.fillStyle = A; g.fillRect(x + 1, 0, cw - 2, 2); }
    }
  }, 30);
  const where = (e) => { const r = lanes.getBoundingClientRect(), sx = lanes.offsetWidth ? r.width / lanes.offsetWidth : 1, lw = LW * sx, cw = (r.width - lw) / 16, y = (e.clientY - r.top) / (r.height / lanes.H);
    return { step: Math.max(0, Math.min(15, Math.floor((e.clientX - r.left - lw) / cw))), y, inLanes: e.clientX - r.left >= lw }; };
  let drag = null;
  const setVel = (e) => { const p = where(e), v = Math.max(-1, Math.min(1, Math.round((50 - p.y) / 46 * 20) / 20)); if (St.vel[p.step] !== v) { St.vel[p.step] = v; view.emit('step_set', { step: p.step, vel: v }); } };
  lanes.addEventListener('contextmenu', e => e.preventDefault());
  lanes.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); const p = where(e); if (!p.inLanes) return;
    const cyc = (v) => v === 0 ? 1 : v > 0 ? -1 : 0;
    if (p.y < LH.vel[1]) { if (e.button === 2) { St.vel[p.step] = 0; view.emit('step_set', { step: p.step, vel: 0 }); return; } drag = true; try { lanes.setPointerCapture(e.pointerId); } catch (x) {} setVel(e); return; }
    const k = p.y < LH.oct[1] + 2 ? 'oct' : 'slide', v = e.button === 2 ? 0 : cyc(St[k][p.step]); St[k][p.step] = v; view.emit('step_set', { step: p.step, [k]: v });
  });
  lanes.addEventListener('pointermove', (e) => { if (drag) setVel(e); });
  ['pointerup', 'pointercancel'].forEach(t => lanes.addEventListener(t, () => { drag = null; }));
  function paintSteps(x) { if (!x || drag) return; ['vel', 'oct', 'slide'].forEach(k => { if (Array.isArray(x[k])) St[k] = x[k].slice(0, 16).concat(new Array(16).fill(0)).slice(0, 16).map(v => +v || 0); }); }
  view.bind('steps', paintSteps);
  const reset = UI.Button({ label: 'Reset steps', hint: 'every step back to its default', onClick: () => view.emit('step_set', { step: 0, all: { vel: 0, oct: 0, slide: 0 } }) }).el;
  const feel = h('div', { class: 'gg-feel' }, [
    head('Steps', [h('span', { class: 'mo-count', text: 'DRAG A LEVEL · CLICK A CELL · RIGHT-CLICK RESETS' }), reset]), lanes,
    head('Feel', [h('span', { class: 'mo-count', text: 'HOW IT MOVES AROUND THE ROOT' })]),
    h('div', { class: 'gg-knobs' }, [ctl('move', { size: 52 }).el, ctl('humanize', { size: 52 }).el, ctl('accent', { size: 52 }).el, ctl('follow', { size: 52 }).el, ctl('seed', { size: 52 }).el]),
  ]);

  view.root.append(play);
  if (view.pageTab) view.pageTab('steps', 'Steps', feel, 'sliders-vertical');
  paintSteps(view.state.steps);
});

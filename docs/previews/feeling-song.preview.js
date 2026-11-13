/* PREVIEW ONLY — the four-feeling pad (tools/music/planned/feeling-song.spec ADDENDUM 2026-11-13 (2)), drawn in the real canvas. Silent. */
(function () {
  const S = OrganismSDK.STD;
  OrganismFactory.define({
    id: 'eravos.feeling-song', domain: 'music', version: '0.1.0', label: 'Feelings', icon: '◇', accent: '#7fb8ff',
    category: 'Embodiment', blurb: 'One pad, a feeling in each corner: drag to blend them.',
    size: { w: 560, h: 560 }, minSize: { w: 360, h: 360 },
    permissions: ['audio_out', 'bus_publish', 'bus_subscribe'],
    hooks: [S.audio_out('fs.hook.audio_out')],
    config: [{ key: 'level', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: 'Level', group: 'OUT' }],
    engine(ctx) { const g = ctx.ac.createGain(); g.gain.value = 0; ctx.track(g); ctx.port('out', { kind: 'audio', direction: 'out', node: g, label: 'out' }); return {}; },
  });
  OrganismFactory.reg('eravos.feeling-song', function (view) {
    const UI = view.ui, h = UI.h;
    // one feeling fills the whole pad; dragging moves inside it, four ways (up · down · left · right)
    const FEEL = { love: 'LOVE', anger: 'ANGER', sadness: 'SADNESS' };
    let feeling = 'sadness';
    let px = 0.62, py = 0.66, trail = [], drag = false;
    const cv = UI.Canvas(520, 470); cv.style.width = '100%'; cv.style.flex = '1'; cv.style.cursor = 'crosshair';
    const at = (e) => { const r = cv.getBoundingClientRect(); px = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); py = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)); };
    cv.addEventListener('pointerdown', e => { drag = true; at(e); }); window.addEventListener('pointermove', e => drag && at(e)); window.addEventListener('pointerup', () => { drag = false; });
    view.__at = (x, y, path) => { px = x; py = y; if (path) trail = path.map(p => ({ x: p[0], y: p[1], a: p[2] })); };
    UI.loop(cv, () => {
      const g = cv.g; cv.fit(); const W = cv.W, H = cv.H || 470;
      g.fillStyle = '#050505'; g.fillRect(0, 0, W, H);
      // the feeling's light, strongest where you are
      const gr = g.createRadialGradient(px * W, py * H, 0, px * W, py * H, Math.max(W, H) * 0.8); gr.addColorStop(0, 'rgba(127,184,255,.22)'); gr.addColorStop(1, 'rgba(127,184,255,.02)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      // the four-way grid
      g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 1; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(W * k / 4, 0); g.lineTo(W * k / 4, H); g.moveTo(0, H * k / 4); g.lineTo(W, H * k / 4); g.stroke(); }
      g.strokeStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
      // the feeling's name, faint, behind everything
      g.font = '600 44px ui-monospace, monospace'; g.textAlign = 'center'; g.fillStyle = 'rgba(235,240,250,.07)'; g.fillText(FEEL[feeling], W / 2, H / 2 + 15); g.textAlign = 'left';
      // the trail: where you have been, fading
      if (drag) { trail.push({ x: px, y: py, a: 1 }); if (trail.length > 90) trail.shift(); }
      trail.forEach((p, i) => { if (i === 0) return; const q = trail[i - 1]; g.strokeStyle = `rgba(127,184,255,${0.6 * i / trail.length})`; g.lineWidth = 2; g.beginPath(); g.moveTo(q.x * W, q.y * H); g.lineTo(p.x * W, p.y * H); g.stroke(); });
      // the dot
      const x = px * W, y = py * H; g.fillStyle = 'rgba(127,184,255,.18)'; g.beginPath(); g.arc(x, y, 22, 0, 6.283); g.fill();
      g.fillStyle = '#7fb8ff'; g.beginPath(); g.arc(x, y, 7, 0, 6.283); g.fill();
    }, 30);
    const cap = UI.Button({ label: '● CAPTURE', kind: 'primary', hint: 'records your drag: a feeling lane and notes on the Timeline', onClick: () => {} });
    const ret = UI.Button({ label: '◎ Return', hint: 'glide back to the middle', onClick: () => {} });
    const seg = UI.Segmented ? UI.Segmented({ options: [{ value: 'love', label: 'Love' }, { value: 'anger', label: 'Anger' }, { value: 'sadness', label: 'Sadness' }], value: feeling, onChange: (v) => { feeling = v; } }) : null;
    view.__feel = (v) => { feeling = v; };
    view.root.style.display = 'flex'; view.root.style.flexDirection = 'column';
    view.root.append(h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [seg ? seg.el : UI.presetBar(view), h('div', { class: 'org-row' }, [ret.el, cap.el])]), cv);
  });
})();

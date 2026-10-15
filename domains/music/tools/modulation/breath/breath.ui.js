/* eravos.breath UI — the breath orb (grows and shrinks with the real signal), phase word, countdown arc, pattern. */
OrganismFactory.reg('eravos.breath', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  let st = { value: 0, phase: 'inhale', until: 0 }; const orb = UI.Canvas(400, 220);
  UI.loop(orb, () => { const g = orb.g; orb.fit(); const W = orb.W, H = 220, cx = W / 2, cy = H / 2, r = 26 + st.value * 70;
    g.fillStyle = '#07040f'; g.fillRect(0, 0, W, H); const gr = g.createRadialGradient(cx, cy, 2, cx, cy, r); gr.addColorStop(0, 'rgba(200,170,255,.9)'); gr.addColorStop(1, 'rgba(136,68,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
    g.strokeStyle = '#8844ff'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 102, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, 1 - st.until / 12))); g.stroke();
    g.fillStyle = '#e9ddff'; g.font = '600 18px sans-serif'; g.textAlign = 'center'; g.fillText(String(st.phase || '').toUpperCase(), cx, cy + 6); g.font = '12px monospace'; g.fillText(Math.max(0, st.until).toFixed(1) + ' s', cx, cy + 26); g.textAlign = 'left'; }, 30);
  view.on('tick', (t) => { st = t; });
  // 3.28: pause / resume up front (Stop and Stop all pause it too)
  const run = UI.Button({ label: '■ Pause', hint: 'pause / resume the breath', onClick: () => view.emit('run', { on: !!view.state.__paused }) });
  view.on('state_sync', (s) => { view.state.__paused = !!s.paused; run.set(s.paused ? '▶ Breathe' : '■ Pause'); });
  view.root.append(h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [run.el, UI.paramControl(view, cfg('pattern'), { segMax: 0 }).el, UI.paramControl(view, cfg('tempoLink')).el]), orb,
    UI.paramPanel(view, ['cIn', 'cHold', 'cOut', 'cRest', 'voiceOn', 'rise', 'bell', 'level'], { size: 28 }),
    UI.hint('Wire the violet dot to the Gothic Organ’s breath input (or any knob) and the music breathes with you. Stop if you feel dizzy.'));
});

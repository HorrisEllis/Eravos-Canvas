/* eravos.breath UI 2.0 — the breath orb (grows and shrinks with the real signal) inside a ring that shows the whole cycle
 * (each segment its own colour, a needle where you are), the word for now and a countdown; a 60-second trace of the breath;
 * the session (time left, cycles, breaths a minute, a log of sessions); sound and output controls. The voice guide speaks
 * here, on the audio clock, so the words land with the bell. */
OrganismFactory.reg('eravos.breath', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const COL = { inhale: '#b388ff', hold: '#00d4ff', exhale: '#8844ff', rest: '#3a4a60' };
  let st = { value: 0, until: 0, cycle: 0, elapsed: 0, remaining: null, bpm: 6, paused: false }, ph = { phase: 'inhale', segs: [['inhale', 5], ['exhale', 5]], seg: 0, t0: 0, duration: 5 }, hist = [];
  const fmt = (s) => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  // ---------------------------------------------------------------- orb + cycle ring
  const orb = UI.Canvas(520, 260);
  UI.loop(orb, () => {
    const g = orb.g; orb.fit(); const W = orb.W, H = 260, cx = W / 2, cy = H / 2, R = 110, r = 26 + st.value * 72;
    g.fillStyle = '#07040f'; g.fillRect(0, 0, W, H);
    const gr = g.createRadialGradient(cx, cy, 2, cx, cy, r); gr.addColorStop(0, 'rgba(220,200,255,.95)'); gr.addColorStop(0.6, 'rgba(160,110,255,.45)'); gr.addColorStop(1, 'rgba(136,68,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
    // the cycle: one arc per segment, a needle at "now"
    const tot = ph.segs.reduce((a, s) => a + s[1], 0) || 1; let a0 = -Math.PI / 2;
    ph.segs.forEach(([name, sec], i) => { const a1 = a0 + sec / tot * Math.PI * 2; g.strokeStyle = COL[name] || '#555'; g.globalAlpha = i === ph.seg ? 1 : 0.35; g.lineWidth = i === ph.seg ? 7 : 4; g.beginPath(); g.arc(cx, cy, R, a0 + 0.02, a1 - 0.02); g.stroke(); a0 = a1; });
    g.globalAlpha = 1;
    const before = ph.segs.slice(0, ph.seg).reduce((a, s) => a + s[1], 0), into = Math.max(0, Math.min(ph.duration, ph.duration - st.until)), an = -Math.PI / 2 + (before + into) / tot * Math.PI * 2;
    if (!st.paused) { g.fillStyle = '#fff'; g.beginPath(); g.arc(cx + Math.cos(an) * R, cy + Math.sin(an) * R, 5, 0, 7); g.fill(); }
    g.fillStyle = '#efe6ff'; g.font = '600 20px sans-serif'; g.textAlign = 'center';
    g.fillText(st.paused ? 'PAUSED' : (ph.sip ? 'SIP IN' : String(ph.phase || '').toUpperCase()), cx, cy + 6);
    g.font = '12px monospace'; g.fillStyle = '#c8b8f0'; if (!st.paused) g.fillText(Math.max(0, st.until).toFixed(1) + ' s', cx, cy + 26);
    g.textAlign = 'left'; g.font = '10px monospace'; g.fillStyle = '#7f6fa8';
    g.fillText('cycle ' + st.cycle, 10, 16); g.fillText((st.bpm || 0).toFixed(1) + ' breaths/min', 10, 30);
    g.textAlign = 'right'; g.fillText(st.remaining !== null && st.remaining !== undefined ? fmt(st.remaining) + ' left' : 'open session', W - 10, 16); g.fillText(fmt(st.elapsed) + ' in', W - 10, 30); g.textAlign = 'left';
  }, 30);
  // ---------------------------------------------------------------- 60 s trace
  const trace = UI.Canvas(520, 70);
  UI.loop(trace, () => { const g = trace.g; trace.fit(); const W = trace.W, H = 70; g.fillStyle = '#07040f'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#2a2040'; g.lineWidth = 1; for (let s = 0; s <= 60; s += 10) { const x = W - s / 60 * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    const now = performance.now(); g.strokeStyle = '#b388ff'; g.lineWidth = 2; g.beginPath(); hist.forEach((p, i) => { const x = W - (now - p.t) / 60000 * W, y = H - 6 - p.v * (H - 12); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke();
    g.fillStyle = '#7f6fa8'; g.font = '9px monospace'; g.fillText('the last minute of breath', 6, 11); }, 20);
  view.on('tick', (t) => { st = t; hist.push({ t: performance.now(), v: t.value }); while (hist.length && performance.now() - hist[0].t > 61000) hist.shift(); });
  view.on('phase', (p) => UI.atTime(view.ac, p.time, () => {
    ph = { phase: p.phase, sip: p.sip, segs: p.segs, seg: p.seg, duration: p.duration };
    if (view.state.guide && window.speechSynthesis && !p.sip) { try { const u = new SpeechSynthesisUtterance({ inhale: 'in', hold: 'hold', exhale: 'out', rest: 'rest' }[p.phase] || ''); u.rate = 0.8; u.pitch = 0.9; u.volume = 0.6; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch (e) {} }
  }));

  // ---------------------------------------------------------------- top: run · pattern · session
  const run = UI.Button({ label: '■ Pause', kind: 'primary', hint: 'pause / begin a new session', onClick: () => view.emit('run', { on: !!view.state.__paused }) });
  const end = UI.Button({ label: 'End session', hint: 'finish now: three bells, and it goes in the log', onClick: () => view.emit('session_end', {}) });
  const about = h('div', { class: 'br-about' });
  const custom = UI.paramPanel(view, ['cIn', 'cHold', 'cOut', 'cRest'], { size: 28 });
  view.bind('pattern', (v) => { custom.style.display = v === 'CUSTOM' ? '' : 'none'; });
  const logBox = h('div', { class: 'br-log' });
  function paintLog(log) {
    logBox.innerHTML = '';
    if (!log || !log.length) { logBox.appendChild(h('span', { class: 'br-dim', text: 'No finished sessions yet — pick a length under Session and breathe until the bells.' })); return; }
    const week = Date.now() - 7 * 864e5, wk = log.filter(r => new Date(r.date).getTime() >= week), mins = wk.reduce((a, r) => a + (r.minutes || 0), 0);
    logBox.append(h('b', { text: 'This week: ' + wk.length + ' session' + (wk.length === 1 ? '' : 's') + ' · ' + Math.round(mins) + ' min' }),
      h('div', { class: 'br-log-list' }, log.slice(-5).reverse().map(r => h('span', { text: r.date + ' · ' + r.minutes + ' min · ' + r.cycles + ' cycles · ' + r.pattern }))),
      UI.Button({ label: 'Clear log', onClick: () => view.emit('log_clear', {}) }).el);
  }
  view.on('session', (s) => { if (s.state === 'done' && window.Shell) window.Shell.toast('◎ Session done — ' + s.rec.minutes + ' min, ' + s.rec.cycles + ' cycles', 'good', 4000); });
  view.on('state_sync', (s) => { view.state.__paused = !!s.paused; run.set(s.paused ? '▶ Breathe' : '■ Pause'); about.textContent = s.about || ''; paintLog(s.log); custom.style.display = view.state.pattern === 'CUSTOM' ? '' : 'none'; });
  view.root.classList.add('breath');
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' } }, [UI.presetBar(view), run.el, end.el]),
    h('div', { class: 'org-row', style: { flexWrap: 'wrap', gap: '8px', alignItems: 'flex-end' } }, [UI.paramControl(view, cfg('pattern'), { segMax: 0 }).el, UI.paramControl(view, cfg('session'), { segMax: 0 }).el, UI.paramControl(view, cfg('program'), { segMax: 0 }).el, UI.paramControl(view, cfg('guide')).el, UI.paramControl(view, cfg('tempoLink')).el]),
    about, orb, trace, custom,
    UI.paramPanel(view, ['pace', 'curve'], { size: 30 }),
    UI.paramPanel(view, ['voiceOn', 'voice', 'chord', 'octave', 'rise', 'bright', 'air', 'bell', 'bellTone', 'bellLevel', 'level'], { size: 30 }),
    UI.paramPanel(view, ['depth', 'floor'], { size: 28 }),
    h('div', { class: 'br-sub', text: 'SESSIONS' }), logBox,
    UI.hint('Wire the violet dots: breath (rises as you breathe in), inverse (rises as you breathe out), gate (1 while breathing in) — to the Gothic Organ’s breath, a filter, a reverb mix, any knob. Stop if you feel dizzy.'));
});

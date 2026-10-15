/* eravos.embodiment-lab UI — a breathing light, a body that lights where the attention is, the cue in words, and the
 * feelings as the main choice. Everything else sits under "deeper". view.* only. */
OrganismFactory.reg('eravos.embodiment-lab', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const NS = 'http://www.w3.org/2000/svg', svg = (tag, a) => { const e = document.createElementNS(NS, tag); Object.keys(a || {}).forEach(k => e.setAttribute(k, a[k])); return e; };
  let tick = { value: 0, running: false, phase: 'rest', until: 0, cycle: 0 }, region = null;
  // ---- the body (regions light with the cue)
  const body = svg('svg', { viewBox: '0 0 120 260', class: 'emb-body', 'aria-hidden': 'true' }), parts = {};
  const part = (id, el) => { el.setAttribute('class', 'emb-part'); el.dataset.region = id; (parts[id] = parts[id] || []).push(el); body.appendChild(el); };
  part('face', svg('ellipse', { cx: 60, cy: 26, rx: 17, ry: 21 }));
  part('throat', svg('rect', { x: 52, y: 46, width: 16, height: 14, rx: 6 }));
  part('chest', svg('path', { d: 'M28 64 Q60 54 92 64 L88 112 Q60 118 32 112 Z' }));
  part('belly', svg('path', { d: 'M32 116 Q60 122 88 116 L84 152 Q60 162 36 152 Z' }));
  part('legs', svg('path', { d: 'M38 158 Q48 164 58 160 L56 236 L44 236 Z' })); part('legs', svg('path', { d: 'M62 160 Q72 164 82 158 L76 236 L64 236 Z' }));
  part('feet', svg('ellipse', { cx: 48, cy: 246, rx: 13, ry: 6 })); part('feet', svg('ellipse', { cx: 72, cy: 246, rx: 13, ry: 6 }));
  [['M18 72 Q10 110 16 150', 'chest'], ['M102 72 Q110 110 104 150', 'chest']].forEach(([d, r]) => part(r, svg('path', { d, class: 'emb-arm' })));
  // ---- the breathing light
  const orb = UI.Canvas(260, 260); orb.classList.add('emb-orb');
  UI.loop(orb, () => {
    orb.fit(); const g = orb.g, W = orb.W, H = orb.H, cx = W / 2, cy = H / 2, v = tick.running ? tick.value : 0.15 + 0.05 * Math.sin(performance.now() / 1400);
    const hue = view.state.glow != null ? view.state.glow : 26, R = Math.min(W, H) * (0.18 + 0.22 * v);
    g.clearRect(0, 0, W, H);
    for (let i = 4; i >= 1; i--) { const r = R * (1 + i * 0.32), gr = g.createRadialGradient(cx, cy, r * 0.2, cx, cy, r); gr.addColorStop(0, `hsla(${hue},80%,70%,${0.05 + 0.05 * v})`); gr.addColorStop(1, `hsla(${hue},80%,60%,0)`); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); }
    const core = g.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.05, cx, cy, R); core.addColorStop(0, `hsla(${hue},90%,92%,0.95)`); core.addColorStop(0.55, `hsla(${hue},75%,65%,0.75)`); core.addColorStop(1, `hsla(${(hue + 330) % 360},70%,35%,0.15)`);
    g.fillStyle = core; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
    g.strokeStyle = `hsla(${hue},80%,80%,0.25)`; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, Math.min(W, H) * 0.42, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * (tick.running && tick.until ? 1 - Math.min(1, tick.until / 8) : 0)); g.stroke();
  }, 30);
  const phaseEl = h('div', { class: 'emb-phase', text: 'Choose a feeling, then begin.' });
  const cueEl = h('div', { class: 'emb-cue', text: '' });
  const go = h('button', { class: 'emb-go', text: '▶ Begin' }); go.onclick = () => view.emit(tick.running ? 'end' : 'begin', {});
  // ---- feelings (the presets of the Feelings pack, and any pack that adds more)
  const chips = h('div', { class: 'emb-feelings' });
  function paintChips(s) {
    chips.innerHTML = ''; (s.presets || []).filter(n => !/^user:/.test(n)).forEach(n => { const label = n.includes(' · ') ? n.split(' · ').slice(1).join(' · ') : n;
      chips.appendChild(h('button', { class: 'emb-chip' + (s.preset === n ? ' on' : ''), text: label, onclick: () => view.emit('preset_load', { name: n }) })); });
  }
  const deeper = h('details', { class: 'emb-deeper' }, [h('summary', { text: 'Deeper — every part of the sound' }), UI.paramPanel(view, null, { size: 30 })]);
  const ceiling = h('div', { class: 'emb-note', text: 'A listening and grounding experience — sound to breathe with, nothing more. Keep it comfortably quiet; stop any time.' });
  view.root.append(
    h('div', { class: 'emb-stage' }, [h('div', { class: 'emb-orbwrap' }, [orb, h('div', { class: 'emb-orb-text' }, [phaseEl, cueEl])]), body]),
    h('div', { class: 'emb-row' }, [go, UI.paramControl(view, cfg('level'), { size: 34 }).el, UI.paramControl(view, cfg('cues')).el]),
    h('div', { class: 'emb-label', text: 'How do you want to feel?' }), chips, deeper, ceiling);
  const words = { inhale: 'breathe in…', hold: 'hold…', exhale: 'breathe out…', rest: 'rest…' };
  view.on('tick', (t) => { tick = t; go.textContent = t.running ? '■ End' : '▶ Begin'; go.classList.toggle('on', t.running); if (t.running) phaseEl.textContent = words[t.phase] || ''; else if (!t.fade) phaseEl.textContent = 'Choose a feeling, then begin.'; });
  view.on('cue', (c) => { region = c.region; cueEl.textContent = c.text; Object.keys(parts).forEach(k => parts[k].forEach(e => e.classList.toggle('on', k === region || region === 'whole'))); });
  view.on('state_sync', (s) => { paintChips(s); if (s.params && s.params.glow != null) view.root.style.setProperty('--glow', `hsl(${s.params.glow} 80% 68%)`); });
  UI.alive(view, { events: ['cue'] });
});

/* eravos.acid-synth UI — CUTOFF / RES / ENV MOD hero, live accent-capacitor meter, generator panel */
OrganismFactory.reg('eravos.acid-synth', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const hero = h('div', { class: 'org-row', style: { justifyContent: 'center', gap: '18px' } }, ['cutoff', 'res', 'envMod'].map(k => UI.paramControl(view, cfg(k), { big: true, size: 64 }).el));
  let charge = 0;
  const cm = UI.Canvas(60, 64); cm.style.width = '60px';
  UI.loop(cm, () => { const g = cm.g; g.fillStyle = '#080b10'; g.fillRect(0, 0, 60, 64); const n = Math.min(1, charge / 0.8); g.fillStyle = n > 0.6 ? '#ffdd00' : '#00ff88'; g.fillRect(18, 64 - n * 56 - 4, 24, n * 56); g.strokeStyle = '#2d3f57'; g.strokeRect(18, 4, 24, 56); g.fillStyle = '#7f93a8'; g.font = '8px monospace'; g.fillText('ACCENT', 12, 62); }, 30);
  view.on('charge', (c) => { charge = c.value; });
  hero.appendChild(h('div', { title: 'accent-sweep capacitor: consecutive accents stack', class: 'org-col', style: { alignItems: 'center' } }, [cm]));
  const sec = UI.paramPanel(view, ['decay', 'accent', 'drive', 'wave', 'octave', 'tune', 'level'], { flat: true, noTitles: true, size: 34 });
  // generator
  const tgt = UI.Select({ label: 'Into sequencer', options: [], onChange: () => {} });
  const refresh = () => tgt.setOptions(view.targets('capability.pattern_store').map(o => ({ value: o.value, label: o.label })));
  tgt.select.addEventListener('pointerdown', refresh); refresh();
  const g = { density: 0.65, accentRate: 0.3, slideRate: 0.2, range: 1, seed: 303 };
  const kn = (k, label, min, max, step) => UI.Knob({ label, min, max, step, value: g[k], default: g[k], size: 30, accent: '#00ff88', onChange: (v) => { g[k] = v; } }).el;
  const seedN = UI.NumberDrag({ min: 1, max: 99999, step: 1, value: g.seed, label: 'seed', prefix: '🎲 ', onChange: (v) => { g.seed = v; } });
  const gen = UI.Button({ label: 'GENERATE', kind: 'primary', hint: 'writes an in-key acid line into the chosen sequencer', onClick: () => { refresh(); const t = tgt.select.value; if (!t) { window.Shell && Shell.toast('Add a Sequencer first — the line is written into it.', 'bad'); return; } view.emit('generate', Object.assign({ target: t, track: 'acid', length: 16 }, g)); } });
  const dice = UI.Button({ label: '🎲', hint: 'new random seed', onClick: () => { g.seed = Math.floor(Math.random() * 99999) + 1; seedN.set(g.seed); gen.el.click(); } });
  const preview = h('div', { style: { display: 'flex', gap: '2px', height: '24px', alignItems: 'flex-end' } });
  view.on('generated', (r) => { preview.innerHTML = ''; r.steps.forEach(s => preview.appendChild(h('div', { style: { flex: 1, height: s.on ? (20 + s.degree * 8) + '%' : '6%', background: s.on ? (s.accent ? '#ffdd00' : '#00ff88') : '#1a2533', borderRight: s.slide ? '3px solid #00d4ff' : '' } }))); });
  const genBox = h('div', { class: 'uk-group' }, [h('div', { class: 'uk-group-title', text: 'LINE GENERATOR — always in key' }), h('div', { class: 'org-row' }, [kn('density', 'Density', 0, 1, 0.01), kn('accentRate', 'Accents', 0, 1, 0.01), kn('slideRate', 'Slides', 0, 1, 0.01), kn('range', 'Octaves', 1, 3, 1), tgt.el]), h('div', { class: 'org-row' }, [gen.el, dice.el, seedN.el]), preview]);
  const kb = UI.Keyboard({ low: 36, high: 60, key: view.key, onDown: (n) => view.emit('audition', { note: n }) });
  view.observe('theory:key-change', (k) => kb.setKey(k));
  view.root.append(h('div', { class: 'org-row' }, [UI.presetBar(view)]), hero, sec, h('div', { style: { height: '6px' } }), genBox, h('div', { style: { height: '6px' } }), kb.el);
});

/* eravos.chord-gen UI — the chord playing now (name + its notes), the progression, TENSION. */
OrganismFactory.reg('eravos.chord-gen', function (view) {
  const UI = view.ui, h = UI.h, MT = window.MusicTheory;
  const now = h('div', { class: 'cg-now', text: '—' }), notes = h('div', { class: 'cg-notes', text: 'press play: a chord every bar' });
  const show = (c) => { if (!c) return; now.textContent = c.name || '—'; notes.textContent = c.notes.map(n => MT.noteName(n)).join(' · '); };
  view.on('chord', (c) => UI.atTime(view.ac, c.time, () => show(c)));
  view.on('state_sync', (s) => show(s.chord));
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view)]),
    h('div', { class: 'cg-box' }, [now, notes]),
    UI.paramPanel(view, null, { size: 34 }),
    UI.hint('Wire its note out into a poly tool (Pad Forge, Supersaw, Retro Poly), and its chord out into a Bassline. Voicing “tension”: TENSION goes triad → add9 → 7sus4 → cluster · 7th, 9th, rootless 9: jazz chords (lofi, neo-soul).'),
  );
  // 3.132 TENSION shapes only the "tension" voicing: with a jazz voicing it dims and says why (DESIGN-GUIDE W7)
  const dim = () => { const el = [...view.root.querySelectorAll('.uk-knob, .uk-field, [data-key]')].find(e => /TENSION/.test(e.textContent || '') && e.querySelector && !e.querySelector('select')); if (!el) return; const v = view.state && view.state.voicing, on = !v || v === 'tension'; el.style.opacity = on ? '' : '0.35'; el.title = on ? '' : 'TENSION shapes the “tension” voicing only'; };
  view.bind && view.bind('voicing', () => setTimeout(dim, 0)); setTimeout(dim, 0);
});

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
    UI.hint('Wire its note out into a poly tool (Pad Forge, Supersaw, Retro Poly), and its chord out into a Bassline. TENSION: triad → add9 → 7sus4 → cluster.'),
  );
});

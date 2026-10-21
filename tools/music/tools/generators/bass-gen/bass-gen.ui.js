/* eravos.bass-gen UI — the note it is on, what it follows, rhythm and ENERGY. */
OrganismFactory.reg('eravos.bass-gen', function (view) {
  const UI = view.ui, h = UI.h;
  const now = h('div', { class: 'cg-now', text: '—' }), src = h('div', { class: 'cg-notes', text: '' });
  const show = (s) => { if (!s) return; if (s.note) now.textContent = s.note.name; if (s.following !== undefined) src.textContent = (s.following ? 'on the kick of the wired Groove' : 'on its own rhythm') + ' · ' + (s.chordFrom ? 'chords from the wired Chords' : 'its own chords'); };
  view.on('bass_note', (n) => UI.atTime(view.ac, n.time, () => { now.textContent = n.name; }));
  view.on('state_sync', show);
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view)]),
    h('div', { class: 'cg-box' }, [now, src]),
    UI.paramPanel(view, null, { size: 34 }),
    UI.hint('Wire a Chords’ chord out and a Groove’s step out into it; wire its note out into a bass (Reese Bass, Wobble Bass, Acid Synth).'),
  );
});

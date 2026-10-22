/* eravos.arp UI — the note it is on, order, rate, octaves, gate, latch, and a keyboard to hold notes by hand. */
OrganismFactory.reg('eravos.arp', function (view) {
  const UI = view.ui, h = UI.h, MT = window.MusicTheory;
  const now = h('div', { class: 'cg-now', text: '—' }), sub = h('div', { class: 'cg-notes', text: 'hold notes, or wire in a Chords' });
  view.on('step', (s) => UI.atTime(view.ac, s.time, () => { now.textContent = MT.noteName(s.note); }));
  // the keyboard holds notes in the arp (it grows with the window, P48.7)
  const kb = UI.Keyboard({ low: 48, high: 72, key: view.key, lock: false, onDown: (n, v) => view.emit('audition', { note: n, velocity: v, duration: 30 }), onUp: (n) => view.emit('audition_off', { note: n }) });
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view)]),
    h('div', { class: 'cg-box' }, [now, sub]), UI.paramPanel(view, null, { size: 34 }), kb.el,
    UI.hint('Wire its note out into any instrument (Supersaw, Retro Poly, Pad Forge…). Notes in hold it; a Chords wired to its chord in feeds it the chord. Press play: it steps on the beat.'),
  );
});

/* eravos.wub-sub UI — the sub's spectrum, follow switch, a low keyboard. Only view.* */
OrganismFactory.reg('eravos.wub-sub', function (view) {
  const UI = view.ui, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  UI.instrumentPanel(view, {
    header: [UI.paramControl(view, cfg('follow')).el, UI.paramControl(view, cfg('wave')).el], low: 24, high: 48, height: 80, color: '#7c4dff',
    keys: ['octave', 'transpose', 'harmonics', 'cut', 'glide', 'attack', 'release', 'level'],
    hint: 'Follows every note sent to a Wub Osc, at its pitch (Octave −1) or deeper, and never wobbles. Wire Sidechain or an inverted Wub Rate into “level” to duck it.',
  });
});

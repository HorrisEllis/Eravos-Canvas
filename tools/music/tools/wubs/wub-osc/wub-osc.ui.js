/* eravos.wub-osc UI — live spectrum of the raw tone, the wave picker up top, a keyboard to play it. Only view.* */
OrganismFactory.reg('eravos.wub-osc', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const wave = UI.paramControl(view, cfg('wave')).el;
  const fmBox = h('div', { class: 'org-row', style: { gap: '8px', margin: 0 } }, [UI.paramControl(view, cfg('ratio')).el]);
  view.bind('wave', (w) => { fmBox.style.display = w === 'fm' ? '' : 'none'; });
  UI.instrumentPanel(view, {
    header: [wave], middle: [fmBox], low: 24, high: 48, color: '#ff2266',
    keys: ['octave', 'transpose', 'fine', 'index', 'voices', 'spread', 'width', 'drift', 'glide', 'attack', 'release', 'dive', 'diveTime', 'level'],
    hint: 'Raw tone only — wire its output into Wub Filter, and Wub Rate into the filter’s “wub”. Reese breathes with Drift; FM growls with Index.',
  });
  if (UI.alive) UI.alive(view);
});

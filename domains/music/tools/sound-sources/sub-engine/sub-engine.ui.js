/* eravos.sub-engine UI — spectrum with the pure-sub band (violet) and the phantom-harmonics band (amber) marked */
OrganismFactory.reg('eravos.sub-engine', function (view) {
  view.ui.instrumentPanel(view, {
    color: '#7a5cff', low: 28, high: 52,
    overlay(g, W, H) {
      const X = (f) => Math.log(f / 20) / Math.log(1000) * W, s = view.state;
      g.fillStyle = 'rgba(122,92,255,.16)'; g.fillRect(X(s.floor || 24), 0, X(180) - X(s.floor || 24), H);
      g.fillStyle = `rgba(255,170,0,${0.05 + 0.2 * (s.phantom || 0)})`; g.fillRect(X(90), 0, X(600) - X(90), H);
      g.font = '10px monospace'; g.fillStyle = '#b9a8ff'; g.fillText('SUB (felt)', X(26) + 3, 12); g.fillStyle = '#ffcc66'; g.fillText('PHANTOM (heard on phones)', X(95) + 3, 12);
    },
    hint: 'Pure sine below 180 Hz stays clean and mono; Phantom adds the 2nd–5th harmonics so small speakers still “hear” the low note. Glide = 808 slides between overlapping notes.',
  });
});

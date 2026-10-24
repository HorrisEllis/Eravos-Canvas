/* eravos.fx-squash UI — the three bands drawn side by side (where they split, how hard each is squashed, the level going in
 * and coming out), then the controls grouped like the engine. Only view.* : state in, view.emit out. */
OrganismFactory.reg('eravos.fx-squash', function (view) {
  const UI = view.ui, h = UI.h, ACC = '#ff5533';
  let meter = null; view.on('meter', (m) => { meter = m; });
  const H = 150, cv = UI.Canvas(520, H); cv.setAttribute('aria-label', 'the three bands: where they split, how hard each is squashed, the level in and out');
  const fx = (f, W) => 24 + (Math.log(f / 20) / Math.log(20000 / 20)) * (W - 32);
  UI.loop(cv, () => {
    view.emit('want_meter', {});
    const g = cv.g, W = cv.fit().W, s = view.state; g.fillStyle = '#0b0a0e'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#2a1e1c'; [100, 1000, 10000].forEach(f => g.fillRect(fx(f, W), 0, 1, H - 16));
    g.fillStyle = '#6d5c58'; g.font = '9px monospace'; [['100', 100], ['1k', 1000], ['10k', 10000]].forEach(([t, f]) => g.fillText(t, fx(f, W) - 6, H - 4));
    const xs = [fx(20, W), fx(s.xLo || 180, W), fx(s.xHi || 2400, W), fx(20000, W)], share = [s.low, s.mid, s.high], a = s.amount || 0;
    const names = ['LOW', 'MID', 'HIGH'];
    for (let i = 0; i < 3; i++) {
      const x0 = xs[i] + 2, x1 = xs[i + 1] - 2, clean = i === 0 && s.lowClean, amt = clean ? 0 : a * (share[i] || 0);
      g.fillStyle = 'rgba(255,85,51,' + (0.08 + 0.35 * amt) + ')'; g.fillRect(x0, 20 + (1 - amt) * (H - 60), x1 - x0, amt * (H - 60) + 4);
      g.fillStyle = clean ? '#7ed4a0' : ACC; g.font = '600 10px sans-serif'; g.fillText(names[i] + (clean ? ' · clean' : ' ' + Math.round(amt * 100) + '%') + (i === 0 && s.monoLow ? ' · mono' : ''), x0 + 4, 14);
      const m = meter && meter.bands && meter.bands[i];
      if (m) { const y = (db) => 20 + (1 - Math.max(0, Math.min(1, (db + 60) / 60))) * (H - 56); const cx = (x0 + x1) / 2;
        g.fillStyle = '#5d4b48'; g.fillRect(cx - 9, y(m.in), 7, H - 36 - y(m.in)); g.fillStyle = '#ffb199'; g.fillRect(cx + 2, y(m.out), 7, H - 36 - y(m.out)); }
    }
    g.fillStyle = '#fff'; [xs[1], xs[2]].forEach(x => g.fillRect(x - 1, 18, 2, H - 34));
    g.font = '9px monospace'; g.fillStyle = '#5d4b48'; g.fillText('▮ in', W - 66, 30); g.fillStyle = '#ffb199'; g.fillText('▮ out', W - 34, 30);
  }, 20);
  const card = (title, keys) => h('div', { class: 'sq-card', style: { background: '#0f0c0d', border: '1px solid #2a1e1c', borderRadius: '10px', padding: '6px 8px', breakInside: 'avoid', marginBottom: '8px' } },
    [h('div', { class: 'uk-group-title', text: title }), UI.paramPanel(view, keys, { flat: true, noTitles: true, size: 34 })]);
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view)]),
    cv,
    h('div', { style: { columnWidth: '240px', columnGap: '8px', marginTop: '8px' } }, [
      card('SQUASH', ['amount', 'mix']), card('BANDS', ['low', 'mid', 'high']), card('SPLIT', ['xLo', 'xHi']),
      card('LOW END', ['lowClean', 'monoLow']), card('LEVELS', ['lowGain', 'midGain', 'highGain']), card('IN / OUT', ['inGain', 'outGain', 'bypass']),
    ]),
    UI.hint('Put it after a growl (or in a Wobble Bass’s growl slot, a Wub Filter’s “after” slot): quiet detail comes up, peaks flatten. Lows clean keeps the sub round; Mono lows keeps it solid.'),
  );
});

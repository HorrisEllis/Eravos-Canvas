/* eravos.wobble-bass UI 2.1 — live spectrum of its own output with the wobble range / vowel formants overlaid */
OrganismFactory.reg('eravos.wobble-bass', function (view) {
  const UI = view.ui, h = UI.h;
  let vowels = null;
  const an = view.tap('out', 4096);
  const spec = UI.Spectrum(an, {
    width: 480, height: 110, color: '#ff2266',
    overlay(g, W, H) {
      const s = view.state; const X = (f) => Math.log(f / 20) / Math.log(1000) * W;
      if (s.filterMode === 'lowpass') {
        const a = X(s.cutoff), b = X(Math.min(20000, s.cutoff * Math.pow(2, s.depth)));
        g.fillStyle = 'rgba(255,34,102,.12)'; g.fillRect(a, 0, b - a, H);
        g.fillStyle = '#ff2266'; g.fillRect(a, 0, 2, H); g.font = '10px monospace'; g.fillText('closed', a + 4, 12); g.fillText('open', b - 28, 12);
      } else if (vowels) {
        const A = vowels[s.vowelA], B = vowels[s.vowelB];
        A.f.forEach((f, i) => { const xa = X(f), xb = X(B.f[i]); g.strokeStyle = '#ffaa00'; g.beginPath(); g.moveTo(xa, H - 20 - i * 18); g.lineTo(xb, H - 20 - i * 18); g.stroke(); g.fillStyle = '#ffaa00'; g.fillRect(xa - 2, H - 24 - i * 18, 4, 8); g.fillStyle = '#00d4ff'; g.fillRect(xb - 2, H - 24 - i * 18, 4, 8); });
        g.font = '11px monospace'; g.fillStyle = '#ffaa00'; g.fillText(s.vowelA, 6, 14); g.fillStyle = '#00d4ff'; g.fillText('→ ' + s.vowelB, 30, 14);
      }
    },
  });
  const divLadder = UI.divisionLadder(view, 'div'); view.bind('div', (v) => divLadder.set(v));
  const cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const ctl = (k, o) => UI.paramControl(view, cfg(k), o);
  const shape = ctl('lfoShape'), mode = ctl('filterMode'), va = ctl('vowelA'), vb = ctl('vowelB');
  const sync = ctl('lfoSync'), retrig = ctl('retrig'), subOct = ctl('subOct');
  const ladderBox = h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' } }, [divLadder.el]);
  // the grid ladder is in charge when Sync is on; the Free rate knob when it is off
  view.bind('lfoSync', (on) => { ladderBox.style.opacity = on ? '1' : '0.3'; ladderBox.title = on ? '' : 'Sync is off — the Free rate knob sets the speed'; });
  const kb = UI.Keyboard({ low: 33, high: 57, key: view.key, onDown: (n, v) => view.emit('audition', { note: n + 12, velocity: v, duration: 30 }), onUp: (n) => view.emit('audition_off', { note: n + 12 }) });
  view.observe('theory:key-change', (k) => kb.setKey(k));
  view.on('state_sync', (s) => { if (s.vowels) vowels = s.vowels; });
  const sec = (t) => h('div', { class: 'uk-group-title', style: { margin: '8px 0 4px' }, text: t });
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view), shape.el]),
    spec,
    sec('WOBBLE RATE'),
    h('div', { class: 'org-row', style: { flexWrap: 'wrap', gap: '6px', margin: 0 } }, [ladderBox, sync.el, retrig.el]),
    sec('FILTER + VOWELS'),
    h('div', { class: 'org-row', style: { flexWrap: 'wrap', gap: '8px', margin: 0 } }, [mode.el, va.el, vb.el, subOct.el]),
    UI.paramPanel(view, ['depth', 'lfoHz', 'lfoPhase', 'ampMod', 'vibrato', 'cutoff', 'res', 'formantShift', 'osc2', 'sub', 'drive', 'shaper', 'spread', 'width', 'noise', 'octave', 'level', 'glide', 'attack', 'release', 'pitchDive', 'diveTime'], { size: 32 }),
    h('div', { style: { height: '6px' } }), kb.el,
    UI.hint('Sync off + Free rate = a growl that ignores the grid. Retrig off keeps the wobble rolling across notes. Dive drops into each note; Pitch wub and Vol wub ride the same LFO.'),
  );
});

/* eravos.wub-filter UI — the live output spectrum with the mouth drawn on it: where it sits closed, how far it opens,
 * and (vowel mode) the formants gliding from the closed vowel to the open one. Only view.* */
OrganismFactory.reg('eravos.wub-filter', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  let vowels = null;
  view.on('state_sync', (s) => { if (s && s.vowels) vowels = s.vowels; });
  const an = view.tap('out', 4096);
  const spec = UI.Spectrum(an, {
    width: 480, height: 120, color: '#ff2266',
    overlay(g, W, H) {
      const s = view.state, X = (f) => Math.log(Math.max(20, f) / 20) / Math.log(1000) * W, inv = !!s.invert;
      g.font = '10px monospace';
      if (s.mode === 'vowel' && vowels) {
        const A = vowels[s.vowelA], B = vowels[s.vowelB], fs = Math.pow(2, (s.formant || 0) / 12);
        if (A && B) A.f.forEach((f, i) => {
          const xa = X(f * fs), xb = X(B.f[i] * fs), y = H - 18 - i * 18;
          g.strokeStyle = '#ffaa00'; g.beginPath(); g.moveTo(xa, y); g.lineTo(xb, y); g.stroke();
          g.fillStyle = '#ffaa00'; g.fillRect(xa - 2, y - 4, 4, 8); g.fillStyle = '#ff2266'; g.fillRect(xb - 2, y - 4, 4, 8);
        });
        g.fillStyle = '#ffaa00'; g.fillText((inv ? 'open ' : 'closed ') + s.vowelA, 6, 12); g.fillStyle = '#ff2266'; g.fillText('→ ' + s.vowelB, 90, 12);
      } else {
        const a = X(s.cutoff), b = X(Math.min(20000, s.cutoff * Math.pow(2, s.range || 0)));
        g.fillStyle = 'rgba(255,34,102,.12)'; g.fillRect(a, 0, b - a, H);
        g.fillStyle = '#ff2266'; g.fillRect(a, 0, 2, H); g.fillRect(b - 1, 0, 1, H);
        g.fillText(inv ? 'open' : 'closed', a + 4, 12); g.fillText(inv ? 'closed' : 'open', Math.max(a + 50, b - 40), 12);
        const p = X(s.cutoff * Math.pow(2, (s.range || 0) * (inv ? 1 - (s.position || 0) : (s.position || 0))));
        g.fillStyle = '#fff'; g.beginPath(); g.arc(p, H - 8, 4, 0, 7); g.fill();
      }
    },
  });
  const ctl = (k) => UI.paramControl(view, cfg(k)).el;
  const vowelRow = h('div', { class: 'org-row', style: { flexWrap: 'wrap', gap: '8px', margin: 0 } }, [ctl('vowelA'), ctl('vowelB')]);
  const combRow = h('div', { class: 'org-row', style: { margin: 0 } }, [UI.paramControl(view, cfg('comb'), { size: 30 }).el]);
  const slopeEl = ctl('slope');
  view.bind('mode', (m) => { vowelRow.style.display = m === 'vowel' ? '' : 'none'; combRow.style.display = m === 'comb' ? '' : 'none'; slopeEl.style.display = m === 'lowpass' ? '' : 'none'; });
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' } }, [UI.presetBar(view), ctl('mode'), slopeEl, ctl('invert'), ctl('bypass')]),
    spec, vowelRow, combRow,
    UI.paramPanel(view, ['cutoff', 'range', 'res', 'position', 'drive', 'formant', 'mix', 'inGain', 'outGain'], { size: 32 }),
    UI.audioRouting(view).el,
    UI.hint('Wire a sound (Wub Osc) into its input and Wub Rate into “wub”. Closed at = the mouth shut; Range = how far it opens. Invert flips it.'),
  );
});

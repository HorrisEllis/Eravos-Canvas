/* eravos.retro-dco UI — the face approved as a preview (tools/music/planned/retro-dco.ui.md, his "Build it.", 2026-11-06): Retro Poly's
 * layout (horizon display, ARP row, knob panel, keyboard) in night-drive cyan; Voice · Filter · Chorus · Hold in the header; the voice
 * cards in the display (each lit by its own voice's level, sent by the worklet, tilted by its own seeded offset); More depth ▸ folded. */
OrganismFactory.reg('eravos.retro-dco', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k), P = (k) => (view.state && view.state[k] !== undefined) ? view.state[k] : cfg(k).default;
  let levels = []; view.on('cards', (c) => { levels = (c && c.levels) || []; });
  const an = view.tap('out', 1024), td = new Float32Array(1024); let lv = 0;
  const cv = UI.Canvas(560, 104); const t0 = performance.now();
  UI.loop(cv, () => {
    const g = cv.g; cv.fit(); const W = cv.W, H = 104, hz = 58, t = (performance.now() - t0) / 1000;
    an.getFloatTimeDomainData(td); let pk = 0; for (let i = 0; i < td.length; i += 4) pk = Math.max(pk, Math.abs(td[i])); lv = Math.max(pk, lv * 0.92);
    const sky = g.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, '#020611'); sky.addColorStop(1, '#0b2a3a'); g.fillStyle = sky; g.fillRect(0, 0, W, hz);
    const cx = W / 2, r = 22 + lv * 10; const mg = g.createLinearGradient(0, hz - r, 0, hz); mg.addColorStop(0, '#d9fbff'); mg.addColorStop(1, '#3be8ff'); g.fillStyle = mg; g.beginPath(); g.arc(cx, hz, r, Math.PI, 0); g.fill();
    g.fillStyle = '#020611'; for (let i = 0; i < 5; i++) g.fillRect(cx - r, hz - 4 - i * 6, r * 2, 1.5 + i * 0.4);
    g.fillStyle = '#01040a'; g.fillRect(0, hz, W, H - hz);
    const bpm = view.bpm || 120, ph = (t * bpm / 60) % 1; g.strokeStyle = 'rgba(59,232,255,.6)'; g.lineWidth = 1;
    for (let i = 0; i < 6; i++) { const z = (i + ph) / 6, y = hz + 22 * z * z; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    for (let i = -12; i <= 12; i++) { g.beginPath(); g.moveTo(cx + i * 8, hz); g.lineTo(cx + i * 60, hz + 22); g.stroke(); }
    // the voice cards: one per voice, lit by its level, tilted by its own seeded offset (Card spread)
    const mono = P('voice') !== 'poly', N = mono ? 1 : P('voices'), spread = P('cards'), cw = Math.min(56, (W - 20) / N - 4), y0 = H - 22;
    for (let v = 0; v < N; v++) { let s = ((P('cardSeed') | 0) * 2654435761 + v * 40503 + 1) >>> 0; s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
      const off = (s / 4294967296 - 0.5) * spread, x = 10 + v * (cw + 4), a = Math.min(1, (levels[v] || 0) * 1.4);
      g.fillStyle = `rgba(59,232,255,${0.16 + 0.7 * a})`; g.fillRect(x, y0, cw, 16);
      g.strokeStyle = '#01040a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 3, y0 + 8 - off * 14); g.lineTo(x + cw - 3, y0 + 8 + off * 14); g.stroke(); }
    g.fillStyle = '#8f8f99'; g.font = '10px ui-monospace, monospace';
    g.fillText(P('voice') + ' · ' + (mono ? (P('voice') === 'unison' ? P('unison') + ' unison' : '1 voice') : N + ' voices') + ' · ' + P('filter') + ' · chorus ' + P('chorus'), 8, 14);
  }, 30);
  const sel = (key) => { const c = UI.paramControl(view, cfg(key), { segMax: 6 }); c.el.dataset.key = key; return c.el; };
  const ctl = (key) => { const c = UI.paramControl(view, cfg(key), { size: 32 }); c.el.dataset.key = key; return c.el; };
  const card = (title, keys) => h('div', { class: 'uk-group' }, [h('div', { class: 'uk-group-title', text: title }), h('div', { class: 'uk-row' }, keys.map(ctl))]);
  const deepBox = h('div', { class: 'uk-panel' }, [card('VOICE CARDS', ['voices', 'cards', 'cardSeed', 'steal']), card('POLY-MOD', ['pmEnvPitch', 'pmEnvPw', 'pmSubPitch', 'sync', 'syncRatio']),
    card('LFO', ['lfoShape', 'lfoRate', 'lfoDelay', 'lfoPitch', 'lfoCutoff', 'lfoPw']), card('VELOCITY', ['velCutoff', 'velAmp']),
    card('CHORUS+', ['chorusMix', 'bbdHiss', 'bbdStages']), card('UNISON', ['unison', 'detune', 'detuneCurve', 'spread']), card('SUB + NOISE', ['subShape', 'subOct', 'noiseColour'])]);
  deepBox.style.display = 'none';   // folded until More depth (the panel's own display beats [hidden])
  const deepB = UI.Button({ label: 'More depth ▸', hint: 'voice cards, poly-mod and hard sync, an LFO with delay, velocity, the chorus\'s bucket brigade, unison, sub and noise', onClick: () => { const show = deepBox.style.display === 'none'; deepBox.style.display = show ? '' : 'none'; deepB.el.textContent = show ? 'More depth ▾' : 'More depth ▸'; } });
  UI.instrumentPanel(view, { color: '#3be8ff', low: 48, high: 72, height: 56,
    header: [sel('voice'), sel('filter'), sel('chorus'), UI.paramControl(view, cfg('hold')).el],
    top: [cv, h('div', { class: 'org-row', style: { gap: '6px', flexWrap: 'wrap' } }, [h('span', { class: 'org-label', text: 'ARP' }), sel('arp'), sel('arpDiv'), UI.paramControl(view, cfg('arpHold')).el])],
    middle: [h('div', { class: 'org-row' }, [deepB.el]), deepBox],
    keys: ['saw', 'pulse', 'width', 'pwm', 'pwmRate', 'sub', 'noise', 'drift', 'octave', 'cutoff', 'res', 'drive', 'envAmt', 'keytrack', 'hpf', 'fA', 'fD', 'fS', 'attack', 'decay', 'sustain', 'release', 'glide', 'arpOct', 'arpGate', 'level'],
    hint: 'Retro Poly\'s face, rebuilt from shared parts. Voice: poly · mono · legato · unison. Filter: the SVF, or the ladder with drive in the loop. Each voice is its own card — Card spread gives each a little of its own pitch, filter and envelope.' });
  // what does nothing in this state dims and says why (W7)
  const RULES = [['drive', 'filter', (v) => v === 'ladder', 'Drive is the ladder\'s (Filter: ladder)'], ['glide', 'voice', (v) => v !== 'poly', 'Glide is for mono, legato and unison'],
    ['syncRatio', 'sync', (v) => !!v, 'Hard sync is off'], ['bbdHiss', 'chorus', (v) => v !== 'off', 'Chorus is off'], ['bbdStages', 'chorus', (v) => v !== 'off', 'Chorus is off'], ['chorusMix', 'chorus', (v) => v !== 'off', 'Chorus is off'],
    ['unison', 'voice', (v) => v === 'unison', 'Voice › unison'], ['detune', 'voice', (v) => v === 'unison', 'Voice › unison'], ['detuneCurve', 'voice', (v) => v === 'unison', 'Voice › unison'], ['spread', 'voice', (v) => v === 'unison', 'Voice › unison'],
    ['voices', 'voice', (v) => v === 'poly', 'one voice in mono, legato and unison'], ['steal', 'voice', (v) => v === 'poly', 'one voice in mono, legato and unison']];
  const dim = () => RULES.forEach(([key, sw, ok, why]) => view.root.querySelectorAll(`[data-key="${key}"]`).forEach(el => { const on = ok(P(sw)); el.style.opacity = on ? '' : '0.35'; el.title = on ? '' : why; }));
  [...new Set(RULES.map(r => r[1]))].forEach(sw => view.bind && view.bind(sw, () => setTimeout(dim, 0))); setTimeout(dim, 0);
});

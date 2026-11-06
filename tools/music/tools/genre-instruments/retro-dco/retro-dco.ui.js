/* eravos.retro-dco UI — the face approved as a preview (tools/music/planned/retro-dco.ui.md, his "Build it.", 2026-11-06): Retro Poly's
 * layout (horizon display, ARP row, knob panel, keyboard) in Retro Poly's magenta (3.142: his "I don't like the blue"); Voice · Filter · Chorus · Hold in the header; the voice
 * cards in the display (each lit by its own voice's level, sent by the worklet, tilted by its own seeded offset); More depth ▸ folded. */
OrganismFactory.reg('eravos.retro-dco', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k), P = (k) => (view.state && view.state[k] !== undefined) ? view.state[k] : cfg(k).default;
  let levels = []; view.on('cards', (c) => { levels = (c && c.levels) || []; });
  const an = view.tap('out', 1024), td = new Float32Array(1024); let lv = 0;
  // 3.142 the look (his: "I don't like the blue. I like the retro poly look." · "Or give it a complete synthwave vibe."): two, shown to him
  //   sunset     Retro Poly's own sky, sun and grid, in its magenta
  //   synthwave  the whole outrun scene: a striped neon sun, wireframe mountains, palms, stars, a neon grid, scanlines
  const LOOK = (global => (global.ERAVOS_RDCO_LOOK || 'sunset'))(window), MAG = '#ff2bd6';
  const cv = UI.Canvas(560, LOOK === 'synthwave' ? 132 : 104); const t0 = performance.now();
  const stars = Array.from({ length: 60 }, (_, i) => [((i * 7919) % 997) / 997, ((i * 104729) % 991) / 991 * 0.75, (i % 3) + 1]);
  const palm = (g, x, base, s, flip) => { g.save(); g.translate(x, base); g.scale(flip ? -s : s, s); g.fillStyle = '#05000c'; g.beginPath();
    g.moveTo(-1.5, 0); g.quadraticCurveTo(2, -20, 5, -42); g.lineTo(7, -42); g.quadraticCurveTo(4, -20, 1.5, 0); g.fill();
    [[-24, -6], [-18, 8], [22, -4], [16, 10], [0, -16]].forEach(([dx, dy]) => { g.beginPath(); g.moveTo(6, -42); g.quadraticCurveTo(6 + dx * 0.5, -48 + dy * 0.2 - 6, 6 + dx, -42 + dy); g.quadraticCurveTo(6 + dx * 0.5, -44 + dy * 0.2, 6, -40); g.fill(); });
    g.restore(); };
  UI.loop(cv, () => {
    const g = cv.g; cv.fit(); const W = cv.W, H = cv.H, t = (performance.now() - t0) / 1000, SW = LOOK === 'synthwave';
    an.getFloatTimeDomainData(td); let pk = 0; for (let i = 0; i < td.length; i += 4) pk = Math.max(pk, Math.abs(td[i])); lv = Math.max(pk, lv * 0.92);
    const hz = SW ? 78 : 58, cx = W / 2, bpm = view.bpm || 120, ph = (t * bpm / 60) % 1;
    const sky = g.createLinearGradient(0, 0, 0, hz);
    if (SW) { sky.addColorStop(0, '#070019'); sky.addColorStop(0.55, '#3a0a5e'); sky.addColorStop(1, '#ff3d7f'); } else { sky.addColorStop(0, '#12002a'); sky.addColorStop(1, '#5a0f5e'); }
    g.fillStyle = sky; g.fillRect(0, 0, W, hz);
    if (SW) stars.forEach(([x, y, z]) => { g.fillStyle = `rgba(255,255,255,${0.35 + 0.35 * Math.sin(t * z + x * 20)})`; g.fillRect(x * W, y * hz * 0.8, z > 2 ? 1.6 : 1, z > 2 ? 1.6 : 1); });
    // the sun: it swells with the sound; its bands cut through it
    const r = (SW ? 30 : 26) + lv * 10, sg = g.createLinearGradient(0, hz - r, 0, hz);
    if (SW) { sg.addColorStop(0, '#ffe66d'); sg.addColorStop(0.5, '#ff8a3d'); sg.addColorStop(1, MAG); } else { sg.addColorStop(0, '#ffe66d'); sg.addColorStop(1, MAG); }
    if (SW) { g.save(); g.shadowColor = MAG; g.shadowBlur = 24; }
    g.fillStyle = sg; g.beginPath(); g.arc(cx, hz, r, Math.PI, 0); g.fill(); if (SW) g.restore();
    g.fillStyle = SW ? '#3a0a5e' : '#12002a'; for (let i = 0; i < (SW ? 6 : 5); i++) g.fillRect(cx - r, hz - 4 - i * (SW ? 5.5 : 6), r * 2, 1.5 + i * 0.5);
    if (SW) {   // wireframe mountains on the horizon, palms either side
      g.strokeStyle = 'rgba(255,61,127,.75)'; g.lineWidth = 1; g.fillStyle = '#12002a';
      [[0, 0.32, 26], [0.62, 1, 22]].forEach(([a, b, hgt]) => { g.beginPath(); g.moveTo(a * W, hz); for (let k = 0; k <= 8; k++) { const x = (a + (b - a) * k / 8) * W, y = hz - (k % 2 ? hgt * (0.6 + 0.4 * Math.sin(k * 1.7 + a * 9)) : hgt * 0.25); g.lineTo(x, y); } g.lineTo(b * W, hz); g.closePath(); g.fill(); g.stroke(); });
      palm(g, W * 0.07, hz + 2, 0.9, false); palm(g, W * 0.93, hz + 2, 1.05, true); palm(g, W * 0.16, hz + 2, 0.6, false);
    }
    g.fillStyle = SW ? '#0a0016' : '#0a0014'; g.fillRect(0, hz, W, H - hz);
    const gh = H - hz - (SW ? 26 : 22) + 22;
    g.strokeStyle = SW ? 'rgba(255,43,214,.85)' : 'rgba(255,43,214,.75)'; g.lineWidth = 1;
    if (SW) { g.save(); g.shadowColor = MAG; g.shadowBlur = 6; }
    for (let i = 0; i < 7; i++) { const z = (i + ph) / 7, y = hz + (gh - 6) * z * z; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    for (let i = -14; i <= 14; i++) { g.beginPath(); g.moveTo(cx + i * 8, hz); g.lineTo(cx + i * 64, H); g.stroke(); }
    if (SW) g.restore();
    // the voice cards: one per voice, lit by its level, tilted by its own seeded offset (Card spread)
    const mono = P('voice') !== 'poly', N = mono ? 1 : P('voices'), spread = P('cards'), cw = Math.min(56, (W - 20) / N - 4), y0 = H - 22;
    for (let v = 0; v < N; v++) { let s = ((P('cardSeed') | 0) * 2654435761 + v * 40503 + 1) >>> 0; s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
      const off = (s / 4294967296 - 0.5) * spread, x = 10 + v * (cw + 4), a = Math.min(1, (levels[v] || 0) * 1.4);
      g.fillStyle = `rgba(255,43,214,${0.18 + 0.7 * a})`; g.fillRect(x, y0, cw, 16);
      g.strokeStyle = '#0a0014'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 3, y0 + 8 - off * 14); g.lineTo(x + cw - 3, y0 + 8 + off * 14); g.stroke(); }
    if (SW) { g.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1); }   // scanlines
    g.fillStyle = SW ? '#ffd1f2' : '#8f8f99'; g.font = '10px ui-monospace, monospace';
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
  UI.instrumentPanel(view, { color: MAG, low: 48, high: 72, height: 56,
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

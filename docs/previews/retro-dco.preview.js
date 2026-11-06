/* PREVIEW ONLY — Retro DCO's face, drawn with the real kit inside the real canvas. Silent: no engine yet (tools/music/planned/retro-dco.ui.md).
 * Retro Poly's layout kept (his: "I love it"): the horizon display, the ARP row, the knob panel, the keyboard. What is new is in the header
 * (Voice, Filter) and folded under More depth ▸ (voice cards, poly-mod, LFO, velocity, chorus character, unison, sub). */
(function () {
  const S = OrganismSDK.STD;
  const n = (key, label, group, def, min, max, step, unit) => ({ key, type: 'number', default: def, min, max, step: step || 0.01, label, group, unit });
  const e = (key, label, group, def, options) => ({ key, type: 'enum', default: def, options, label, group });
  OrganismFactory.define({
    id: 'eravos.retro-dco', domain: 'music', version: '0.1.0', label: 'Retro DCO', icon: '🌃', accent: '#3be8ff',
    category: 'Genre instruments', blurb: '80s DCO poly, rebuilt from parts: voice cards, ladder or SVF, poly-mod, the Juno chorus with its bucket brigade.',
    size: { w: 600, h: 760 }, minSize: { w: 460, h: 560 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe'],
    hooks: [S.audio_out('rd.hook.audio_out'), S.note_in('rd.hook.note_in'), S.midi_in('rd.hook.midi_in'), S.theory_in('rd.hook.theory_in'), S.transport_in('rd.hook.transport_in'),
      S.mod_in('rd.hook.mod_cutoff', 'cutoff'), S.mod_in('rd.hook.mod_pwm', 'pwm'), S.mod_in('rd.hook.mod_res', 'res'), S.mod_in('rd.hook.mod_drift', 'drift')],
    config: [
      // header
      e('voice', 'Voice', 'VOICE', 'poly', ['poly', 'mono', 'legato', 'unison']), e('filter', 'Filter', 'VCF', 'svf 24', ['svf 24', 'ladder']),
      e('chorus', 'Chorus', 'FX', 'I', ['off', 'I', 'II', 'I+II']), { key: 'hold', type: 'boolean', default: false, label: 'Hold', group: 'VOICE' },
      // the face — Retro Poly's knobs, same names, same defaults
      n('saw', 'Saw', 'DCO', 0.7, 0, 1), n('pulse', 'Pulse', 'DCO', 0.5, 0, 1), n('width', 'Width', 'DCO', 0.35, 0.05, 0.5, 0.001), n('pwm', 'PWM', 'DCO', 0.3, 0, 1),
      n('pwmRate', 'PWM rate', 'DCO', 0.6, 0.05, 8, 0.01, 'Hz'), n('sub', 'Sub', 'DCO', 0.3, 0, 1), n('noise', 'Noise', 'DCO', 0, 0, 1), n('drift', 'Drift', 'DCO', 0.3, 0, 1),
      { key: 'octave', type: 'integer', default: 0, min: -4, max: 4, label: 'Octave', group: 'DCO' },
      n('cutoff', 'Cutoff', 'VCF', 2400, 60, 16000, 1, 'Hz'), n('res', 'Reso', 'VCF', 0.35, 0, 1), n('drive', 'Drive', 'VCF', 0, 0, 24, 0.1, 'dB'),
      n('envAmt', 'Env amt', 'VCF', 0.5, -1, 1), n('keytrack', 'Keytrack', 'VCF', 0.5, 0, 1), { key: 'hpf', type: 'integer', default: 0, min: 0, max: 3, label: 'HPF', group: 'VCF' },
      n('fA', 'F att', 'ENV', 0.005, 0.001, 4, 0.001, 's'), n('fD', 'F dec', 'ENV', 0.35, 0.01, 6, 0.01, 's'), n('fS', 'F sus', 'ENV', 0.3, 0, 1),
      n('attack', 'Attack', 'ENV', 0.005, 0.001, 5, 0.001, 's'), n('decay', 'Decay', 'ENV', 0.5, 0.01, 6, 0.01, 's'), n('sustain', 'Sustain', 'ENV', 0.7, 0, 1), n('release', 'Release', 'ENV', 0.4, 0.01, 8, 0.01, 's'),
      n('glide', 'Glide', 'VOICE', 0, 0, 3, 0.001, 's'), n('level', 'Level', 'OUT', 0.6, 0, 1.5),
      e('arp', 'Arp', 'ARP', 'off', ['off', 'up', 'down', 'up-down', 'random', 'played']), e('arpDiv', 'Rate', 'ARP', '1/16', ['1/4', '1/8', '1/16', '1/8t', '1/16t']),
      { key: 'arpOct', type: 'integer', default: 1, min: 1, max: 3, label: 'Octaves', group: 'ARP' }, n('arpGate', 'Gate', 'ARP', 0.55, 0.05, 1), { key: 'arpHold', type: 'boolean', default: false, label: 'Latch', group: 'ARP' },
      // More depth
      { key: 'voices', type: 'integer', default: 6, min: 1, max: 16, label: 'Voices', group: 'CARDS' }, n('cards', 'Card spread', 'CARDS', 0.25, 0, 1), { key: 'cardSeed', type: 'integer', default: 1, min: 1, max: 9999, label: 'Card seed', group: 'CARDS' },
      e('steal', 'Steal', 'CARDS', 'oldest', ['oldest', 'quietest', 'same-note', 'lowest', 'highest']),
      n('pmEnvPitch', 'Env → pitch', 'POLY-MOD', 0, -24, 24, 0.1, 'st'), n('pmEnvPw', 'Env → width', 'POLY-MOD', 0, -1, 1), n('pmSubPitch', 'Sub → pitch', 'POLY-MOD', 0, 0, 1),
      { key: 'sync', type: 'boolean', default: false, label: 'Hard sync', group: 'POLY-MOD' }, n('syncRatio', 'Sync ratio', 'POLY-MOD', 1.5, 1, 8, 0.01, '×'),
      e('lfoShape', 'Shape', 'LFO', 'triangle', ['sine', 'triangle', 'square', 'saw', 'random']), n('lfoRate', 'Rate', 'LFO', 5, 0.05, 30, 0.01, 'Hz'), n('lfoDelay', 'Delay', 'LFO', 0.3, 0, 4, 0.01, 's'),
      n('lfoPitch', '→ pitch', 'LFO', 0, 0, 100, 0.1, 'c'), n('lfoCutoff', '→ cutoff', 'LFO', 0, 0, 2400, 1, 'c'), n('lfoPw', '→ width', 'LFO', 0, 0, 1),
      n('velCutoff', 'Vel → cutoff', 'VELOCITY', 0.3, 0, 1), n('velAmp', 'Vel → level', 'VELOCITY', 0.5, 0, 1),
      n('bbdHiss', 'BBD hiss', 'CHORUS+', -84, -120, -50, 1, 'dB'), { key: 'bbdStages', type: 'integer', default: 1024, min: 256, max: 4096, label: 'BBD stages', group: 'CHORUS+' }, n('chorusMix', 'Chorus mix', 'CHORUS+', 0.5, 0, 1),
      { key: 'unison', type: 'integer', default: 4, min: 2, max: 16, label: 'Unison voices', group: 'UNISON' }, n('detune', 'Detune', 'UNISON', 0.25, 0, 1), e('detuneCurve', 'Curve', 'UNISON', 'supersaw', ['linear', 'exp', 'supersaw']), n('spread', 'Spread', 'UNISON', 0.7, 0, 1),
      e('subShape', 'Sub shape', 'SUB', 'square', ['sine', 'triangle', 'square', 'rounded square']), e('subOct', 'Sub octave', 'SUB', '-1', ['-1', '-2']), e('noiseColour', 'Noise', 'SUB', 'white', ['white', 'pink', 'brown']),
    ],
    engine(ctx) { const g = ctx.ac.createGain(); g.gain.value = 0; ctx.track(g); ctx.port('out', { kind: 'audio', direction: 'out', node: g, label: 'retro dco' });
      ['cutoff', 'pwm', 'res', 'drift'].forEach(k => ctx.modBus(k, { min: -1, max: 1 })); return {}; },
  });
  OrganismFactory.reg('eravos.retro-dco', function (view) {
    const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k), P = (k) => (view.state && view.state[k] !== undefined) ? view.state[k] : cfg(k).default;
    // signature display: Retro Poly's horizon at night — a cyan moon over the grid, and along the bottom the VOICE CARDS: one cell per voice,
    // lit when it plays, each with its own small seeded offset (Card spread) drawn as a tilt
    const cv = UI.Canvas(560, 104); const t0 = performance.now(); let k = 0;
    UI.loop(cv, () => {
      const g = cv.g; cv.fit(); const W = cv.W, H = 104, hz = 58, t = (performance.now() - t0) / 1000; k++;
      const sky = g.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, '#020611'); sky.addColorStop(1, '#0b2a3a'); g.fillStyle = sky; g.fillRect(0, 0, W, hz);
      const cx = W / 2, r = 24; const mg = g.createLinearGradient(0, hz - r, 0, hz); mg.addColorStop(0, '#d9fbff'); mg.addColorStop(1, '#3be8ff'); g.fillStyle = mg; g.beginPath(); g.arc(cx, hz, r, Math.PI, 0); g.fill();
      g.fillStyle = '#020611'; for (let i = 0; i < 5; i++) g.fillRect(cx - r, hz - 4 - i * 6, r * 2, 1.5 + i * 0.4);
      g.fillStyle = '#01040a'; g.fillRect(0, hz, W, H - hz);
      const ph = (t * 2) % 1; g.strokeStyle = 'rgba(59,232,255,.6)'; g.lineWidth = 1;
      for (let i = 0; i < 6; i++) { const z = (i + ph) / 6, y = hz + 22 * z * z; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      for (let i = -12; i <= 12; i++) { g.beginPath(); g.moveTo(cx + i * 8, hz); g.lineTo(cx + i * 60, hz + 22); g.stroke(); }
      // voice cards
      const N = P('voices'), spread = P('cards'), cw = Math.min(56, (W - 20) / N - 4), y0 = H - 22; let s = P('cardSeed');
      const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff - 0.5; };
      for (let v = 0; v < N; v++) { const x = 10 + v * (cw + 4), on = Math.sin(t * 1.3 + v * 1.7) > 0.2, off = rnd() * spread;
        g.fillStyle = on ? 'rgba(59,232,255,.85)' : 'rgba(59,232,255,.18)'; g.fillRect(x, y0, cw, 16);
        g.strokeStyle = '#01040a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 3, y0 + 8 - off * 14); g.lineTo(x + cw - 3, y0 + 8 + off * 14); g.stroke(); }
      g.fillStyle = '#8f8f99'; g.font = '10px ui-monospace, monospace'; g.fillText(P('voice') + ' · ' + N + ' voices · ' + P('filter'), 8, 14);
    }, 30);
    const sel = (key) => { const c = UI.paramControl(view, cfg(key), { segMax: 6 }); c.el.dataset.key = key; return c.el; };
    const ctl = (key) => { const c = UI.paramControl(view, cfg(key), { size: 32 }); c.el.dataset.key = key; return c.el; };
    const card = (title, keys) => h('div', { class: 'uk-group' }, [h('div', { class: 'uk-group-title', text: title }), h('div', { class: 'uk-row' }, keys.map(ctl))]);
    const deepBox = h('div', { class: 'uk-panel' }, [card('VOICE CARDS', ['voices', 'cards', 'cardSeed', 'steal']), card('POLY-MOD', ['pmEnvPitch', 'pmEnvPw', 'pmSubPitch', 'sync', 'syncRatio']),
      card('LFO', ['lfoShape', 'lfoRate', 'lfoDelay', 'lfoPitch', 'lfoCutoff', 'lfoPw']), card('VELOCITY', ['velCutoff', 'velAmp']),
      card('CHORUS+', ['chorusMix', 'bbdHiss', 'bbdStages']), card('UNISON', ['unison', 'detune', 'detuneCurve', 'spread']), card('SUB + NOISE', ['subShape', 'subOct', 'noiseColour'])]);
    deepBox.style.display = 'none';
    const deepB = UI.Button({ label: 'More depth ▸', hint: 'voice cards, poly-mod and hard sync, an LFO with delay, velocity, the chorus\'s bucket brigade, unison, sub and noise', onClick: () => { const show = deepBox.style.display === 'none'; deepBox.style.display = show ? '' : 'none'; deepB.el.textContent = show ? 'More depth ▾' : 'More depth ▸'; } });
    UI.instrumentPanel(view, { color: '#3be8ff', low: 48, high: 72, height: 56,
      header: [sel('voice'), sel('filter'), sel('chorus'), UI.paramControl(view, cfg('hold')).el],
      top: [cv, h('div', { class: 'org-row', style: { gap: '6px', flexWrap: 'wrap' } }, [h('span', { class: 'org-label', text: 'ARP' }), sel('arp'), sel('arpDiv'), UI.paramControl(view, cfg('arpHold')).el])],
      middle: [h('div', { class: 'org-row' }, [deepB.el]), deepBox],
      keys: ['saw', 'pulse', 'width', 'pwm', 'pwmRate', 'sub', 'noise', 'drift', 'octave', 'cutoff', 'res', 'drive', 'envAmt', 'keytrack', 'hpf', 'fA', 'fD', 'fS', 'attack', 'decay', 'sustain', 'release', 'glide', 'arpOct', 'arpGate', 'level'],
      hint: 'Retro Poly\'s face, rebuilt from shared parts. Voice: poly · mono · legato · unison. Filter: the SVF as today, or the ladder with drive in the loop. Each voice is its own card — Card spread gives each a little of its own filter and pitch, like old voice boards.' });
    // what does nothing in this state dims and says why
    const RULES = [['drive', 'filter', (v) => v === 'ladder', 'Drive is the ladder\'s (Filter: ladder)'], ['glide', 'voice', (v) => v !== 'poly', 'Glide is for mono, legato and unison'],
      ['syncRatio', 'sync', (v) => !!v, 'Hard sync is off'], ['bbdHiss', 'chorus', (v) => v !== 'off', 'Chorus is off'], ['bbdStages', 'chorus', (v) => v !== 'off', 'Chorus is off'], ['chorusMix', 'chorus', (v) => v !== 'off', 'Chorus is off'],
      ['unison', 'voice', (v) => v === 'unison', 'Unison voices: Voice › unison'], ['detune', 'voice', (v) => v === 'unison', 'Voice › unison'], ['detuneCurve', 'voice', (v) => v === 'unison', 'Voice › unison'], ['spread', 'voice', (v) => v === 'unison', 'Voice › unison']];
    const dim = () => RULES.forEach(([key, sw, ok, why]) => view.root.querySelectorAll(`[data-key="${key}"]`).forEach(el => { const on = ok(P(sw)); el.style.opacity = on ? '' : '0.35'; el.title = on ? '' : why; }));
    [...new Set(RULES.map(r => r[1]))].forEach(sw => view.bind && view.bind(sw, () => setTimeout(dim, 0))); setTimeout(dim, 0);
  });
})();

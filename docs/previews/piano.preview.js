/* PREVIEW ONLY — Piano's face (tine · reed · felt · upright · grand), drawn with the real kit inside the real canvas. Silent: no engine yet
 * (tools/music/planned/piano.ui.md). */
(function () {
  const S = OrganismSDK.STD;
  const n = (key, label, group, def, min, max, step, unit) => ({ key, type: 'number', default: def, min, max, step: step || 0.01, label, group, unit });
  OrganismFactory.define({
    id: 'eravos.piano', domain: 'music', version: '0.1.0', label: 'Piano', icon: '🎹', accent: '#e7b49b',
    category: 'Instruments', blurb: 'Electric and acoustic pianos, modelled live: a hammer, a tine or reed or string, a body. No samples.',
    size: { w: 600, h: 640 }, minSize: { w: 460, h: 480 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe'],
    hooks: [S.audio_out('pia.hook.audio_out'), S.note_in('pia.hook.note_in'), S.midi_in('pia.hook.midi_in'), S.transport_in('pia.hook.transport_in'),
      S.mod_in('pia.hook.mod_bright', 'brightness'), S.mod_in('pia.hook.mod_trem', 'tremolo')],
    config: [
      { key: 'model', type: 'enum', default: 'tine', options: ['tine', 'reed', 'felt', 'upright', 'honky', 'grand'], label: 'Model', group: 'BODY' },
      n('hardness', 'Hammer', 'STRIKE', 0.45, 0, 1), n('brightness', 'Bright', 'STRIKE', 0.5, 0, 1), n('bell', 'Bell', 'STRIKE', 0.35, 0, 1),
      n('decay', 'Decay', 'BODY', 3.5, 0.3, 20, 0.01, 's'), n('release', 'Release', 'BODY', 0.4, 0.02, 4, 0.01, 's'), n('resonance', 'Resonance', 'BODY', 0.3, 0, 1),
      n('trem', 'Tremolo', 'MOVE', 0.25, 0, 1), n('tremRate', 'Trem rate', 'MOVE', 4.5, 0.5, 12, 0.01, 'Hz'),
      n('drive', 'Drive', 'OUT', 0.15, 0, 1), n('width', 'Width', 'OUT', 0.6, 0, 1), n('level', 'Level', 'OUT', 0.7, 0, 1),
      // More depth
      n('detune', 'String detune', 'STRING+', 0.15, 0, 1), n('inharm', 'Stretch', 'STRING+', 0.5, 0, 1), n('sympathetic', 'Sympathetic', 'STRING+', 0.3, 0, 1),
      n('velCurve', 'Velocity curve', 'PLAY+', 0.5, 0, 1), n('keyOff', 'Key-off thump', 'PLAY+', 0.2, 0, 1), n('pedalNoise', 'Pedal noise', 'PLAY+', 0.1, 0, 1),
      n('micX', 'Mic X', 'MIC', 0.5, 0, 1), n('micY', 'Mic Y', 'MIC', 0.5, 0, 1), n('lid', 'Lid', 'MIC', 0.7, 0, 1),
      { key: 'tremSync', type: 'enum', default: 'free', options: ['free', '1/4', '1/8', '1/8 t', '1/16'], label: 'Tremolo on the beat', group: 'MOVE+' },
      { key: 'pedal', type: 'boolean', default: false, label: 'Sustain pedal', group: 'PLAY' },
    ],
    engine(ctx) { const g = ctx.ac.createGain(); g.gain.value = 0; ctx.track(g); ctx.port('out', { kind: 'audio', direction: 'out', node: g, label: 'piano' });
      ctx.modBus('brightness', { min: -1, max: 1 }); ctx.modBus('tremolo', { min: -1, max: 1 }); return {}; },
  });
  OrganismFactory.reg('eravos.piano', function (view) {
    const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k), P = (k) => (view.state && view.state[k] !== undefined) ? view.state[k] : cfg(k).default;
    // signature display: the hammer striking what sounds (a tine and its tonebar, a reed, or strings) — it rings and decays; beside it the
    // partials it makes (stretched, never exactly harmonic) and the tremolo moving left and right
    const cv = UI.Canvas(540, 120); let t = 0, hit = 0;
    UI.loop(cv, () => {
      const g = cv.g; cv.fit(); const W = cv.W, H = 120; t += 1 / 30; if ((t % 1.6) < 1 / 30) hit = 1; hit *= Math.exp(-1 / 30 / Math.max(0.3, P('decay') / 3));
      const m = P('model'); g.fillStyle = '#050505'; g.fillRect(0, 0, W, H);
      // the hammer
      const hx = W * 0.08, hy = 60 - hit * 18; g.fillStyle = '#c9bfae'; g.fillRect(hx - 8, hy - 4, 16, 8); g.fillRect(hx - 1, hy + 4, 2, 30);
      // what sounds, vibrating
      g.strokeStyle = '#e7b49b'; g.lineWidth = m === 'grand' || m === 'upright' ? 1 : 2; const lines = m === 'grand' ? 3 : m === 'upright' ? 2 : 1;
      for (let s = 0; s < lines; s++) { g.beginPath(); for (let x = 0; x <= W * 0.42; x += 2) { const u = x / (W * 0.42); const y = 52 + s * 5 + Math.sin(u * Math.PI) * Math.sin(t * 40 + s) * hit * 10 * (m === 'felt' ? 0.5 : 1); x ? g.lineTo(W * 0.12 + x, y) : g.moveTo(W * 0.12, y); } g.stroke(); }
      if (m === 'tine') { g.fillStyle = 'rgba(242,232,213,.35)'; g.fillRect(W * 0.12, 70, W * 0.42, 5); }   // the tonebar
      // partials (stretched)
      const px0 = W * 0.62, pw = W * 0.34, B = 0.0004 * (0.3 + P('inharm'));
      g.fillStyle = '#8f8f99'; g.font = '10px ui-monospace, monospace'; g.fillText(m.toUpperCase() + ' · partials', px0, 14);
      for (let k = 1; k <= 12; k++) { const f = k * Math.sqrt(1 + B * k * k), x = px0 + (f / 13) * pw, a = hit * Math.pow(0.72 + 0.2 * P('brightness'), k - 1) * (k === 3 || k === 7 ? 1 + P('bell') : 1);
        g.fillStyle = '#e7b49b'; g.globalAlpha = 0.25 + 0.75 * Math.min(1, a); g.fillRect(x, 100 - Math.min(80, a * 80), 3, Math.min(80, a * 80)); } g.globalAlpha = 1;
      // tremolo
      const tr = P('trem'), pan = Math.sin(t * 2 * Math.PI * P('tremRate')) * tr; g.fillStyle = '#8f8f99'; g.fillText('L', px0, H - 4); g.fillText('R', px0 + pw - 6, H - 4);
      g.fillStyle = '#e7b49b'; g.fillRect(px0 + pw / 2 + pan * pw * 0.4 - 2, H - 12, 4, 6);
      if (P('pedal')) { g.fillStyle = '#e7b49b'; g.fillText('PEDAL', W * 0.12, H - 4); }
    }, 30);
    const ctl = (k) => { const c = UI.paramControl(view, cfg(k), { size: 32 }); c.el.dataset.key = k; return c.el; };
    const card = (title, keys) => h('div', { class: 'uk-group' }, [h('div', { class: 'uk-group-title', text: title }), h('div', { class: 'uk-row' }, keys.map(ctl))]);
    const face = h('div', { class: 'uk-panel' }, [card('STRIKE', ['hardness', 'brightness', 'bell']), card('BODY', ['decay', 'release', 'resonance']), card('MOVE', ['trem', 'tremRate']), card('OUT', ['drive', 'width', 'level'])]);
    const deepBox = h('div', { class: 'uk-panel', hidden: true }, [card('STRING+', ['detune', 'inharm', 'sympathetic']), card('PLAY+', ['velCurve', 'keyOff', 'pedalNoise']), card('MIC', ['micX', 'micY', 'lid']), h('div', { class: 'org-row' }, [UI.paramControl(view, cfg('tremSync')).el])]);
    deepBox.style.display = 'none';   // folded until More depth (the panel's own display beats [hidden])
    const deepB = UI.Button({ label: 'More depth ▸', hint: 'string detune, stretch, sympathetic strings, velocity curve, key-off thump, pedal noise, mic position, lid, tremolo on the beat', onClick: () => { const show = deepBox.style.display === 'none'; deepBox.style.display = show ? '' : 'none'; deepB.set(show ? 'Less ▴' : 'More depth ▸'); } });
    UI.instrumentPanel(view, { color: '#e7b49b', low: 48, high: 72, height: 56,
      header: [UI.paramControl(view, cfg('model'), { segMax: 6 }).el],
      top: [cv, h('div', { class: 'org-row', style: { gap: '6px' } }, [UI.paramControl(view, cfg('pedal')).el])],
      middle: [face, h('div', { class: 'org-row' }, [deepB.el]), deepBox],
      keys: [],
      hint: 'Tine is the electric piano of soul and lofi, reed is the barkier one, felt is the soft muted upright. Bell brings out the tine’s ring; Tremolo moves it left and right.' });
    const RULES = [['bell', 'model', (v) => v === 'tine' || v === 'reed', 'Bell is the tine’s or reed’s ring'], ['trem', 'model', (v) => v === 'tine' || v === 'reed', 'Tremolo is the electric pianos’'], ['tremRate', 'model', (v) => v === 'tine' || v === 'reed', 'Tremolo is the electric pianos’'],
      ['sympathetic', 'model', (v) => v === 'grand' || v === 'upright' || v === 'felt' || v === 'honky', 'strings only'], ['lid', 'model', (v) => v === 'grand', 'only the grand has a lid']];
    const dim = () => RULES.forEach(([k, sw, ok, why]) => { const el = view.root.querySelector(`[data-key="${k}"]`); if (!el) return; const on = ok(P(sw)); el.style.opacity = on ? '' : '0.35'; el.title = on ? '' : why; });
    [...new Set(RULES.map(r => r[1]))].forEach(sw => view.bind && view.bind(sw, () => setTimeout(dim, 0))); setTimeout(dim, 0);
  });
})();

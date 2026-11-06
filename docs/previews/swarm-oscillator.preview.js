/* PREVIEW ONLY — Swarm Oscillator's face, drawn with the real kit inside the real canvas. Silent: no engine yet. */
(function () {
  const S = OrganismSDK.STD;
  const n = (key, label, group, def, min, max, step, unit) => ({ key, type: 'number', default: def, min, max, step: step || 0.01, label, group, unit });
  OrganismFactory.define({
    id: 'eravos.swarm-oscillator', domain: 'music', version: '0.1.0', label: 'Swarm Oscillator', icon: '🐝', accent: '#8a5cff',
    category: 'Genre instruments', blurb: 'Beyond supersaw: unison voices that pull on each other — lock, beat, break apart.',
    size: { w: 580, h: 660 }, minSize: { w: 460, h: 480 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe'],
    hooks: [S.audio_out('so.hook.audio_out'), S.note_in('so.hook.note_in'), S.midi_in('so.hook.midi_in'), S.transport_in('so.hook.transport_in'),
      S.mod_in('so.hook.mod_coupling', 'coupling'), S.mod_in('so.hook.mod_cutoff', 'cutoff'), S.mod_out('so.hook.coherence', 'coherence')],
    config: [
      { key: 'mode', type: 'enum', default: 'coupled', options: ['free', 'coupled', 'harmonic', 'chaotic'], label: 'Mode', group: 'SWARM' },
      { key: 'shape', type: 'enum', default: 'saw', options: ['saw', 'pulse', 'tri', 'table'], label: 'Shape', group: 'OSC' },
      n('voices', 'Voices', 'SWARM', 9, 1, 32, 1), n('spread', 'Spread', 'SWARM', 0.35, 0, 1), n('coupling', 'Coupling', 'SWARM', 0.45, 0, 1),
      n('pull', 'Pull', 'SWARM+', 0.5, 0, 1), n('drift', 'Drift', 'SWARM+', 0.25, 0, 1), n('cluster', 'Cluster', 'SWARM', 0, 0, 1),
      n('table', 'Table', 'OSC+', 0, 0, 1), n('sub', 'Sub', 'OSC+', 0.2, 0, 1), n('octave', 'Octave', 'OSC+', 0, -3, 3, 1),
      n('cutoff', 'Cutoff', 'TONE', 6000, 40, 18000, 1, 'Hz'), n('res', 'Res', 'TONE', 0.2, 0, 1), n('envAmt', 'Env amt', 'FILTER+', 0.4, 0, 1),
      n('attack', 'Attack', 'TONE', 0.01, 0.001, 10, 0.001, 's'), n('decay', 'Decay', 'AMP+', 0.4, 0.01, 4, 0.01, 's'), n('sustain', 'Sustain', 'AMP+', 0.8, 0, 1), n('release', 'Release', 'TONE', 0.6, 0.01, 12, 0.01, 's'),
      n('lfoRate', 'LFO rate', 'MOVE', 0.3, 0.01, 20, 0.01, 'Hz'), n('lfoCouple', 'LFO→Pull', 'MOVE', 0, -1, 1), n('width', 'Width', 'OUT', 0.8, 0, 1), n('monoBelow', 'Mono <', 'STEREO', 120, 20, 400, 1, 'Hz'),
      n('level', 'Level', 'OUT', 0.7, 0, 1),
      { key: 'sync', type: 'enum', default: 'off', options: ['off', '1/4', '1/2', 'bar'], label: 'Lock on beat', group: 'SWARM' },
    ],
    engine(ctx) { const g = ctx.ac.createGain(); g.gain.value = 0; ctx.track(g); ctx.port('out', { kind: 'audio', direction: 'out', node: g, label: 'swarm' });
      ctx.modBus('coupling', { min: -1, max: 1 }); ctx.modBus('cutoff', { min: -4800, max: 4800 });
      const coh = ctx.ac.createConstantSource(); coh.start(); ctx.track(coh); ctx.port('coherence', { kind: 'mod', direction: 'out', node: coh, label: 'coherence' }); return {}; },
  });
  OrganismFactory.reg('eravos.swarm-oscillator', function (view) {
    const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k), P = (k) => view.params ? view.params.get(k) : cfg(k).default;
    // signature display: the swarm — each voice a dot on its orbit (angle = phase, radius = its detune); coupled voices draw lines to the
    // centre of pull; the coherence meter (how locked the swarm is, 0–1) is also a modulation output
    const cv = UI.Canvas(520, 120); const N = 9, ph = [], w = []; for (let i = 0; i < N; i++) { ph.push(Math.random() * 6.28); w.push((i - (N - 1) / 2) * 0.09); }
    let last = performance.now(), coh = 0;
    UI.loop(cv, () => {
      const g = cv.g; cv.fit(); const W = cv.W, H = 120, now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      const K = 0.9 * (0.5 + 0.5 * Math.sin(now / 2600)); // preview: coupling breathes so the lock and the break show
      let cx = 0, cy = 0; ph.forEach(p => { cx += Math.cos(p); cy += Math.sin(p); }); const R = Math.hypot(cx, cy) / N, psi = Math.atan2(cy, cx); coh = R; window.__swarmCoh = R;
      for (let i = 0; i < N; i++) ph[i] += (6 + w[i] * 8 + K * 6 * R * Math.sin(psi - ph[i])) * dt;
      g.fillStyle = '#050507'; g.fillRect(0, 0, W, H);
      const ox = W * 0.36, oy = H / 2;
      g.strokeStyle = 'rgba(138,92,255,.18)'; g.lineWidth = 1; for (let i = 0; i < N; i++) { g.beginPath(); g.arc(ox, oy, 14 + i * 5, 0, 6.283); g.stroke(); }
      const px = ox + Math.cos(psi) * 14 * R * 3, py = oy + Math.sin(psi) * 14 * R * 3;
      for (let i = 0; i < N; i++) { const r = 14 + i * 5, x = ox + Math.cos(ph[i]) * r, y = oy + Math.sin(ph[i]) * r;
        g.strokeStyle = `rgba(185,155,255,${0.08 + 0.35 * K})`; g.beginPath(); g.moveTo(x, y); g.lineTo(px, py); g.stroke();
        g.fillStyle = '#b99bff'; g.beginPath(); g.arc(x, y, 3, 0, 6.283); g.fill(); }
      g.fillStyle = '#e4d9ff'; g.beginPath(); g.arc(px, py, 2.5, 0, 6.283); g.fill();
      // coherence meter
      const mx = W * 0.66, mw = W * 0.3; g.fillStyle = '#8f8f99'; g.font = '10px ui-monospace, monospace'; g.fillText('COHERENCE', mx, 30);
      g.fillStyle = '#151518'; g.fillRect(mx, 38, mw, 8); const mg = g.createLinearGradient(mx, 0, mx + mw, 0); mg.addColorStop(0, '#5a3bd1'); mg.addColorStop(1, '#c7b0ff'); g.fillStyle = mg; g.fillRect(mx, 38, mw * coh, 8);
      g.fillStyle = '#e4d9ff'; g.font = '18px ui-monospace, monospace'; g.fillText(coh.toFixed(2), mx, 72);
      g.fillStyle = '#8f8f99'; g.font = '10px ui-monospace, monospace'; g.fillText(coh > 0.8 ? 'locked' : coh > 0.4 ? 'beating' : 'apart', mx + 50, 72); g.fillText('→ mod out', mx, 92);
    }, 30);
    const sel = (k) => UI.paramControl(view, cfg(k), { segMax: 6 }).el;
    // cards from kit parts, each control tagged with its key (so dynamic rules can find it — as Wobble Bass does)
    const ctl = (k) => { const c = UI.paramControl(view, cfg(k), { size: 32 }); c.el.dataset.key = k; return c.el; };
    const card = (title, keys) => h('div', { class: 'uk-group' }, [h('div', { class: 'uk-group-title', text: title }), h('div', { class: 'uk-row' }, keys.map(ctl))]);
    const face = h('div', { class: 'uk-panel' }, [card('SWARM', ['voices', 'spread', 'coupling', 'cluster']), card('TONE', ['cutoff', 'res', 'attack', 'release']), card('OUT', ['width', 'level'])]);
    // More depth ▸ (DESIGN-GUIDE W2): everything else, nothing outside his control
    const deepBox = h('div', { class: 'uk-panel', hidden: true }, [card('SWARM+', ['pull', 'drift']), card('OSC+', ['table', 'sub', 'octave']), card('FILTER+ / AMP+', ['envAmt', 'decay', 'sustain']), card('MOVE', ['lfoRate', 'lfoCouple']), card('OUT+', ['monoBelow'])]);
    const deepB = UI.Button({ label: 'More depth ▸', hint: 'pull, drift, wavetable, sub, octave, filter envelope, decay / sustain, a movement on the pull, mono low end', onClick: () => { deepBox.hidden = !deepBox.hidden; deepB.set(deepBox.hidden ? 'More depth ▸' : 'More depth ▾'); } });
    UI.instrumentPanel(view, { color: '#8a5cff', low: 48, high: 72, height: 56,
      header: [sel('mode')],
      top: [cv, h('div', { class: 'org-row', style: { gap: '6px', flexWrap: 'wrap' } }, [h('span', { class: 'org-label', text: 'OSC' }), sel('shape'), h('span', { class: 'org-label', text: 'LOCK' }), sel('sync')])],
      middle: [face, h('div', { class: 'org-row' }, [deepB.el]), deepBox],
      keys: [],
      hint: 'Coupling pulls the voices together: low = a loose supersaw, high = one locked wave. Cluster settles them on 3rds, 5ths and octaves. Lock on beat snaps them in phase on the grid.' });
    // dynamic: a control that does nothing in this state dims and says why (as Wobble Bass does)
    const RULES = [['coupling', 'mode', (v) => v !== 'free', 'free: the voices do not pull on each other'], ['pull', 'mode', (v) => v !== 'free', 'free: no pull'], ['lfoCouple', 'mode', (v) => v !== 'free', 'free: no pull to move'],
      ['cluster', 'mode', (v) => v === 'harmonic', 'Cluster works in harmonic mode'], ['table', 'shape', (v) => v === 'table', 'Table works with the table shape']];
    const dim = () => RULES.forEach(([k, sw, ok, why]) => { const el = view.root.querySelector(`[data-key="${k}"]`); if (!el) return; const on = ok(view.state && view.state[sw] !== undefined ? view.state[sw] : cfg(sw).default); el.style.opacity = on ? '' : '0.35'; el.title = on ? '' : '⏸ ' + why; });
    [...new Set(RULES.map(r => r[1]))].forEach(sw => view.bind && view.bind(sw, () => setTimeout(dim, 0))); setTimeout(dim, 0);
  });
})();

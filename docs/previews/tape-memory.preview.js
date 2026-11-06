/* PREVIEW ONLY — Tape Memory's face, drawn with the real kit inside the real canvas. Silent: no engine yet (tools/music/planned/tape-memory.ui.md). */
(function () {
  const S = OrganismSDK.STD;
  const n = (key, label, group, def, min, max, step, unit) => ({ key, type: 'number', default: def, min, max, step: step || 0.01, label, group, unit });
  OrganismFactory.define({
    id: 'eravos.tape-memory', domain: 'music', version: '0.1.0', label: 'Tape Memory', icon: '📼', accent: '#d6b37a',
    category: 'Effects', blurb: 'Lofi wear: wow, flutter, hiss, crackle, dropouts — a copy of a copy, made live.',
    size: { w: 560, h: 600 }, minSize: { w: 440, h: 440 },
    permissions: ['audio_in', 'audio_out', 'bus_publish', 'bus_subscribe'],
    hooks: [S.audio_in('tm.hook.audio_in'), S.audio_out('tm.hook.audio_out'), S.transport_in('tm.hook.transport_in'),
      S.mod_in('tm.hook.mod_wear', 'wear'), S.mod_in('tm.hook.mod_speed', 'speed'), S.mod_out('tm.hook.dropout', 'dropout')],
    config: [
      { key: 'mode', type: 'enum', default: 'cassette', options: ['cassette', 'vhs', 'reel', 'dictaphone'], label: 'Machine', group: 'WEAR' },
      n('wear', 'Wear', 'WEAR', 0.35, 0, 1), n('generation', 'Copies', 'WEAR', 2, 1, 8, 1),
      n('wow', 'Wow', 'MOTION', 0.3, 0, 1), n('flutter', 'Flutter', 'MOTION', 0.2, 0, 1), n('speed', 'Speed', 'MOTION', 1, 0.5, 1.5, 0.001, '×'),
      n('hiss', 'Hiss', 'DUST', 0.25, 0, 1), n('crackle', 'Crackle', 'DUST', 0.2, 0, 1), n('dropouts', 'Dropouts', 'DUST', 0.1, 0, 1),
      n('lowCut', 'Low cut', 'TONE', 60, 20, 400, 1, 'Hz'), n('highCut', 'High cut', 'TONE', 7000, 1500, 18000, 1, 'Hz'), n('drive', 'Saturate', 'TONE', 0.35, 0, 1),
      n('mix', 'Mix', 'OUT', 1, 0, 1), n('level', 'Level', 'OUT', 0.8, 0, 1),
      // More depth
      n('wowRate', 'Wow rate', 'MOTION+', 0.6, 0.05, 4, 0.01, 'Hz'), n('flutterRate', 'Flutter rate', 'MOTION+', 9, 3, 25, 0.1, 'Hz'), n('stereoWow', 'L/R drift', 'MOTION+', 0.2, 0, 1),
      n('crackleSize', 'Crackle size', 'DUST+', 0.4, 0, 1), n('dropLen', 'Dropout length', 'DUST+', 0.08, 0.01, 0.5, 0.01, 's'), n('hissTone', 'Hiss tone', 'DUST+', 0.5, 0, 1),
      n('head', 'Head tilt', 'TAPE+', 0, 0, 1), n('bits', 'Bits', 'DIGITAL', 16, 4, 16, 1), n('rate', 'Sample rate', 'DIGITAL', 48000, 4000, 48000, 100, 'Hz'),
      n('stopTime', 'Stop time', 'STOP', 0.8, 0.1, 4, 0.01, 's'),
      { key: 'wowSync', type: 'enum', default: 'free', options: ['free', '1 bar', '2 bars', '1/2'], label: 'Wow on the beat', group: 'MOTION+' },
    ],
    engine(ctx) { const g = ctx.ac.createGain(); g.gain.value = 0; ctx.track(g); ctx.port('in', { kind: 'audio', direction: 'in', node: g, label: 'in' }); ctx.port('out', { kind: 'audio', direction: 'out', node: g, label: 'out' });
      ctx.modBus('wear', { min: -1, max: 1 }); ctx.modBus('speed', { min: -0.5, max: 0.5 });
      const d = ctx.ac.createConstantSource(); d.start(); ctx.track(d); ctx.port('dropout', { kind: 'mod', direction: 'out', node: d, label: 'dropout' }); return {}; },
  });
  OrganismFactory.reg('eravos.tape-memory', function (view) {
    const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k), P = (k) => (view.state && view.state[k] !== undefined) ? view.state[k] : cfg(k).default;
    // signature display: the cassette — two reels turning (their speed is Speed, their wobble is Wow + Flutter), the pitch line the tape
    // is playing at (scrolls), dust on it (Crackle), the hiss floor, a dropout flashing the line away
    const cv = UI.Canvas(520, 130); let ang = 0, t = 0, drop = 0; const line = new Array(220).fill(0), dust = [];
    UI.loop(cv, () => {
      const g = cv.g; cv.fit(); const W = cv.W, H = 130, dt = 1 / 30; t += dt;
      const wear = P('wear'), wow = P('wow') * (0.5 + wear), flut = P('flutter') * (0.5 + wear), sp = P('speed');
      const pitch = Math.sin(t * 2 * Math.PI * P('wowRate')) * wow * 0.8 + Math.sin(t * 2 * Math.PI * 9) * flut * 0.25 + (Math.random() - 0.5) * flut * 0.15;
      ang += (2.2 * sp + pitch * 0.6) * dt * 3; line.shift(); line.push(pitch);
      if (Math.random() < P('dropouts') * 0.04) drop = 1; drop = Math.max(0, drop - dt * 4);
      if (Math.random() < P('crackle') * 0.5) dust.push({ x: W, y: 70 + (Math.random() - 0.5) * 40, s: 0.6 + Math.random() * 2 * P('crackleSize') });
      g.fillStyle = '#050505'; g.fillRect(0, 0, W, H);
      // reels
      const reel = (cx, r) => { g.strokeStyle = 'rgba(214,179,122,.55)'; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, 34, r, 0, 6.283); g.stroke();
        for (let k = 0; k < 3; k++) { const a = ang + k * 2.094; g.beginPath(); g.moveTo(cx, 34); g.lineTo(cx + Math.cos(a) * (r - 3), 34 + Math.sin(a) * (r - 3)); g.stroke(); }
        g.fillStyle = '#d6b37a'; g.beginPath(); g.arc(cx, 34, 3, 0, 6.283); g.fill(); };
      reel(W * 0.16, 22); reel(W * 0.34, 22);
      g.strokeStyle = 'rgba(214,179,122,.35)'; g.beginPath(); g.moveTo(W * 0.16, 56); g.lineTo(W * 0.34, 56); g.stroke();
      g.fillStyle = '#8f8f99'; g.font = '10px ui-monospace, monospace'; g.fillText(P('mode').toUpperCase() + ' · copy ' + P('generation'), W * 0.45, 18);
      g.fillText('speed ' + sp.toFixed(2) + '×  ·  pitch ' + (pitch >= 0 ? '+' : '') + (pitch * 30).toFixed(0) + ' c', W * 0.45, 34);
      // the pitch line the tape is playing at
      g.strokeStyle = drop > 0.2 ? 'rgba(214,179,122,.15)' : '#e8cf9f'; g.lineWidth = 1.5; g.beginPath();
      line.forEach((v, i) => { const x = i / (line.length - 1) * W, y = 92 - v * 26; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
      // dust (crackle) drifting with the tape
      g.fillStyle = '#f3e3c4'; for (let i = dust.length - 1; i >= 0; i--) { const d = dust[i]; d.x -= W * dt * 0.5 * sp; if (d.x < 0) { dust.splice(i, 1); continue; } g.fillRect(d.x, d.y, d.s, d.s); }
      // hiss floor
      const hiss = P('hiss'); g.fillStyle = 'rgba(214,179,122,.25)'; for (let x = 0; x < W; x += 2) { const v = Math.random() * hiss * 8; g.fillRect(x, H - 4 - v, 1, v); }
      g.fillStyle = '#8f8f99'; g.fillText('hiss', 4, H - 10); if (drop > 0.2) { g.fillStyle = '#d6b37a'; g.fillText('dropout', W - 60, H - 10); }
    }, 30);
    const ctl = (k) => { const c = UI.paramControl(view, cfg(k), { size: 32 }); c.el.dataset.key = k; return c.el; };
    const card = (title, keys) => h('div', { class: 'uk-group' }, [h('div', { class: 'uk-group-title', text: title }), h('div', { class: 'uk-row' }, keys.map(ctl))]);
    const face = h('div', { class: 'uk-panel' }, [card('WEAR', ['wear', 'generation']), card('MOTION', ['wow', 'flutter', 'speed']), card('DUST', ['hiss', 'crackle', 'dropouts']), card('TONE', ['lowCut', 'highCut', 'drive']), card('OUT', ['mix', 'level'])]);
    const deepBox = h('div', { class: 'uk-panel', hidden: true }, [card('MOTION+', ['wowRate', 'flutterRate', 'stereoWow']), h('div', { class: 'org-row' }, [UI.paramControl(view, cfg('wowSync')).el]), card('DUST+', ['crackleSize', 'dropLen', 'hissTone']), card('TAPE+', ['head']), card('DIGITAL', ['bits', 'rate']), card('STOP', ['stopTime'])]);
    deepBox.style.display = 'none';   // folded until More depth (the panel's own display beats [hidden])
    const deepB = UI.Button({ label: 'More depth ▸', hint: 'wow and flutter rates, wow on the beat, left/right drift, crackle size, dropout length, hiss tone, head tilt, bits and sample rate, tape-stop time', onClick: () => { const show = deepBox.style.display === 'none'; deepBox.style.display = show ? '' : 'none'; deepB.set(show ? 'Less ▴' : 'More depth ▸'); } });
    const stop = UI.Button({ label: '⏹ TAPE STOP', kind: 'primary', hint: 'the tape slows to a stop (Stop time); press again: it spins back up', onClick: () => {} });
    view.root.append(
      h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view), stop.el]),
      h('div', { class: 'org-row' }, [UI.paramControl(view, cfg('mode'), { segMax: 6 }).el]),
      cv, face, h('div', { class: 'org-row' }, [deepB.el]), deepBox,
      UI.hint('Wear moves everything at once (wow, flutter, dust, the top end) — the quick way. Copies: each one is a copy of the last, softer and duller. The dust is made live, never a recording.'),
    );
    // dynamic: what does nothing in this state dims and says why
    const RULES = [['head', 'mode', (v) => v === 'vhs', 'Head tilt is the VHS tracking error'], ['dropLen', 'dropouts', (v) => v > 0, 'no dropouts'], ['crackleSize', 'crackle', (v) => v > 0, 'no crackle']];
    const dim = () => RULES.forEach(([k, sw, ok, why]) => { const el = view.root.querySelector(`[data-key="${k}"]`); if (!el) return; const on = ok(P(sw)); el.style.opacity = on ? '' : '0.35'; el.title = on ? '' : why; });
    [...new Set(RULES.map(r => r[1]))].forEach(sw => view.bind && view.bind(sw, () => setTimeout(dim, 0))); setTimeout(dim, 0);
  });
})();

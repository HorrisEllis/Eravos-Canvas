/* eravos.tape-memory UI — the face approved as a preview (tools/music/planned/tape-memory.ui.md, his "yes" 2026-11-06): the reels and the
 * pitch line, WEAR · MOTION · DUST · TONE · OUT on the face, More depth ▸ for the rest; Tape stop the one primary. Only view.*. */
OrganismFactory.reg('eravos.tape-memory', function (view) {
    const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k), P = (k) => (view.state && view.state[k] !== undefined) ? view.state[k] : cfg(k).default;
    // signature display: the cassette — two reels turning (their speed is Speed, their wobble is Wow + Flutter), the pitch line the tape
    // is playing at (scrolls), dust on it (Crackle), the hiss floor, a dropout flashing the line away
    const cv = UI.Canvas(520, 130); let ang = 0, t = 0, drop = 0, stopK = 1; const line = new Array(220).fill(0), dust = [];
    UI.loop(cv, () => {
      const g = cv.g; cv.fit(); const W = cv.W, H = 130, dt = 1 / 30; t += dt;
      const wear = P('wear'), wow = P('wow') * (0.5 + wear), flut = P('flutter') * (0.5 + wear), sp = P('stopped') ? Math.max(0, (stopK = Math.max(0, stopK - (1 / 30) / Math.max(0.1, P('stopTime'))))) * P('speed') : (stopK = Math.min(1, stopK + (1 / 30) / 0.35)) * P('speed');
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
    const face = h('div', { class: 'uk-panel' }, [card('WEAR', ['wear', 'generation']), card('MOTION', ['wow', 'flutter', 'speed']), card('DUST', ['hiss', 'crackle', 'dropouts']), card('TONE', ['lowCut', 'highCut', 'drive']), card('OUT', ['mix', 'outGain'])]);
    const deepBox = h('div', { class: 'uk-panel', hidden: true }, [card('MOTION+', ['wowRate', 'flutterRate', 'stereoWow']), h('div', { class: 'org-row' }, [UI.paramControl(view, cfg('wowSync')).el]), card('DUST+', ['crackleSize', 'dropLen', 'hissTone']), card('TAPE+', ['head']), card('DIGITAL', ['bits', 'rate']), card('STOP', ['stopTime'])]);
    deepBox.style.display = 'none';   // folded until More depth (the panel's own display beats [hidden])
    const deepB = UI.Button({ label: 'More depth ▸', hint: 'wow and flutter rates, wow on the beat, left/right drift, crackle size, dropout length, hiss tone, head tilt, bits and sample rate, tape-stop time', onClick: () => { const show = deepBox.style.display === 'none'; deepBox.style.display = show ? '' : 'none'; deepB.set(show ? 'Less ▴' : 'More depth ▸'); } });
    const stop = UI.Button({ label: '⏹ TAPE STOP', kind: 'primary', hint: 'the tape slows to a stop (Stop time); press again: it spins back up', onClick: () => view.emit('stop', {}) });
    view.bind && view.bind('stopped', (v) => stop.set(v ? '▶ SPIN UP' : '⏹ TAPE STOP'));
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

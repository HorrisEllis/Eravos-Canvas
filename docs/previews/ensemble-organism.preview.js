/* PREVIEW ONLY — Ensemble Organism's face, drawn with the real kit inside the real canvas. Silent: no engine yet
 * (tools/music/planned/ensemble-organism.ui.md; the depth audit: tools/music/planned/ensemble-organism.spec ADDENDUM 2026-11-13). */
(function () {
  const S = OrganismSDK.STD;
  const n = (key, label, group, def, min, max, step, unit, element) => ({ key, type: 'number', default: def, min, max, step: step || 0.01, label, group, unit, element });
  const e = (key, label, group, def, options, element) => ({ key, type: 'enum', default: def, options, label, group, element });
  OrganismFactory.define({
    id: 'eravos.ensemble-organism', domain: 'music', version: '0.1.0', label: 'Ensemble Organism', icon: '≋', accent: '#9fe0d0',
    category: 'Effects', blurb: 'Many lines through a bucket-brigade chip: string-machine shimmer, Juno chorus, Dimension width, a tape choir.',
    size: { w: 580, h: 600 }, minSize: { w: 460, h: 440 },
    permissions: ['audio_in', 'audio_out', 'bus_publish', 'bus_subscribe'],
    hooks: [S.audio_in('eo.hook.audio_in'), S.audio_out('eo.hook.audio_out'), S.transport_in('eo.hook.transport_in'),
      S.mod_in('eo.hook.bloom_in', 'bloom'), S.mod_out('eo.hook.motion', 'motion'), S.mod_out('eo.hook.bloom_out', 'bloomOut')],
    config: [
      e('mode', 'Mode', 'MODE', 'ensemble', ['chorus', 'ensemble', 'flanger', 'doubler'], 'ensemble-core'),
      e('machine', 'Machine', 'MODE', 'string machine', ['juno I', 'juno II', 'juno I+II', 'string machine', 'dimension'], 'ensemble-core'),
      n('lines', 'Lines', 'LINES', 6, 2, 12, 1, '', 'ensemble-core'), n('spread', 'Spread', 'LINES', 0.8, 0, 1, 0.01, '', 'ensemble-core'),
      n('rate', 'Rate', 'MOTION', 0.6, 0.02, 12, 0.01, 'Hz', 'lfo'), n('depth', 'Depth', 'MOTION', 1.5, 0, 6, 0.01, 'ms', 'ensemble-core'),
      n('shimmer', 'Shimmer', 'MOTION', 0.25, 0, 1, 0.01, 'ms', 'ensemble-core'),
      e('chip', 'Chip', 'BUCKET', '1024', ['512', '1024', '2048', '4096'], 'bbd-line'), n('age', 'Age', 'BUCKET', 0.3, 0, 1, 0.01, '', 'bbd-line'),
      n('drive', 'Drive', 'TAPE', 0.15, 0, 1, 0.01, '', 'saturator-tape'),
      n('width', 'Width', 'OUT', 1, 0, 2, 0.01, '', 'stereo-tools'), n('mix', 'Mix', 'OUT', 0.5, 0, 1, 0.01, '', 'stereo-tools'),
      // More depth
      e('sets', 'Sets', 'LINES+', '3-phase', ['even', '3-phase', 'pairs'], 'ensemble-core'), n('setOffset', 'Set offset', 'LINES+', 0.25, 0, 1, 0.01, 'cycle', 'ensemble-core'),
      n('shimmerRate', 'Shimmer rate', 'MOTION+', 6, 2, 12, 0.1, 'Hz', 'ensemble-core'), e('shape', 'Shape', 'MOTION+', 'sine', ['sine', 'triangle', 'smooth random'], 'lfo'),
      e('sync', 'On the beat', 'MOTION+', 'free', ['free', '1/4', '1/2', '1 bar', '2 bars'], 'lfo'), n('base', 'Base', 'MOTION+', 6, 0.5, 30, 0.1, 'ms', 'ensemble-core'),
      { key: 'compand', type: 'boolean', default: true, label: 'Compand', group: 'BUCKET+', element: 'bbd-line' },
      n('dblTime', 'Double at', 'DOUBLER', 22, 8, 60, 0.1, 'ms', 'delay-line'), n('dblWow', 'Wow', 'DOUBLER', 0.3, 0, 1, 0.01, '', 'delay-line'),
      n('feedback', 'Feedback', 'DOUBLER', 0, -0.95, 0.95, 0.01, '', 'delay-line'),
      n('bias', 'Bias', 'TAPE+', 0.2, 0, 1, 0.01, '', 'saturator-tape'), n('bump', 'Bump', 'TAPE+', 2, 0, 6, 0.1, 'dB', 'saturator-tape'),
      n('bassMono', 'Bass mono', 'OUT+', 120, 20, 400, 1, 'Hz', 'stereo-tools'), n('level', 'Level', 'OUT+', 0.8, 0, 1, 0.01, '', 'stereo-tools'),
      n('bloomAmt', 'Bloom', 'BLOOM', 1, 0, 2, 0.01, '', 'own:bloom'), n('bloomTime', 'Bloom time', 'BLOOM', 0.6, 0.05, 4, 0.01, 's', 'own:bloom'),
    ],
    engine(ctx) { const g = ctx.ac.createGain(); g.gain.value = 0; ctx.track(g); ctx.port('in', { kind: 'audio', direction: 'in', node: g, label: 'in' }); ctx.port('out', { kind: 'audio', direction: 'out', node: g, label: 'out' });
      ctx.modBus('bloom', { min: 0, max: 1 }); const d = ctx.ac.createConstantSource(); d.start(); ctx.track(d);
      ctx.port('motion', { kind: 'mod', direction: 'out', node: d, label: 'motion' }); ctx.port('bloomOut', { kind: 'mod', direction: 'out', node: d, label: 'bloom' }); return {}; },
  });
  OrganismFactory.reg('eravos.ensemble-organism', function (view) {
    const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k), P = (k) => (view.state && view.state[k] !== undefined) ? view.state[k] : cfg(k).default;
    let bloom = 0, held = false;
    // signature display: every line as its delay over time (up = longer), drawn left or right by where it sits in the stereo field; the
    // chip's bandwidth as the ceiling (stages and delay set the clock); the hiss floor breathing (Age; the compander sinks it in silence)
    const cv = UI.Canvas(540, 140); let t = 0; const hist = [];
    UI.loop(cv, () => {
      const g = cv.g; cv.fit(); const W = cv.W, H = 140, dt = 1 / 30; t += dt * 0.4;   // drawn at 0.4× speed: the sweep and its shimmer both readable
      bloom += ((held ? 1 : 0) - bloom) * Math.min(1, dt / Math.max(0.05, P('bloomTime')));
      const mode = P('mode'), N = Math.round(mode === 'chorus' ? 2 : mode === 'flanger' ? Math.min(3, P('lines')) : (bloom > 0.5 ? 12 : P('lines')));
      const sets = P('sets'), per = sets === 'pairs' ? 2 : sets === '3-phase' ? 3 : N;
      const base = mode === 'flanger' ? 2 : P('base'), dep = P('depth') * (1 + P('bloomAmt') * bloom), shim = mode === 'chorus' ? 0 : P('shimmer');
      const row = []; for (let k = 0; k < N; k++) { const set = Math.floor(k / per), ph = (k % per) / per + set * P('setOffset');
        row.push(base + dep * Math.sin(2 * Math.PI * (P('rate') * t + ph)) + shim * Math.sin(2 * Math.PI * (P('shimmerRate') * t + ph * 1.7))); }
      hist.push(row); if (hist.length > 160) hist.shift();
      g.fillStyle = '#050505'; g.fillRect(0, 0, W, H);
      const top = 22, bot = H - 22, lo = Math.max(0, base - 7), hi = base + 7, y = (ms) => bot - (ms - lo) / (hi - lo) * (bot - top);
      const half = W / 2 - 6, sp = P('spread');
      for (let k = 0; k < N; k++) {   // left lines on the left half, right lines on the right; Spread 0 draws them all across
        const right = k % 2 === 1, x0 = sp < 0.05 ? 0 : (right ? W / 2 + 6 : 0), w = sp < 0.05 ? W : half;
        g.strokeStyle = `rgba(159,224,208,${0.35 + 0.5 * (1 - k / N)})`; g.lineWidth = 1.2; g.beginPath();
        hist.forEach((r, i) => { const v = r[k]; if (v === undefined) return; const x = x0 + i / 159 * w; i ? g.lineTo(x, y(v)) : g.moveTo(x, y(v)); }); g.stroke();
      }
      const stages = +P('chip'), clock = stages / (2 * base / 1000), bw = clock / 3;
      g.fillStyle = 'rgba(159,224,208,.10)'; g.fillRect(0, 0, W, 14);
      g.fillStyle = '#8f8f99'; g.font = '10px ui-monospace, monospace';
      g.fillText(`CHIP ${stages} · CLOCK ${(clock / 1000).toFixed(0)} kHz · BANDWIDTH ${(bw / 1000).toFixed(1)} kHz`, 6, 10);
      if (sp >= 0.05) { g.fillText('L', 6, 30); g.fillText('R', W / 2 + 12, 30); }
      g.fillText(`${N} LINES · ${mode.toUpperCase()}${bloom > 0.05 ? ' · BLOOM ' + Math.round(bloom * 100) + '%' : ''}`, W - 200, 30);
      const age = P('age'); g.fillStyle = 'rgba(159,224,208,.22)'; for (let x = 0; x < W; x += 2) { const v = Math.random() * age * 9; g.fillRect(x, H - 3 - v, 1, v); }
      g.fillStyle = '#8f8f99'; g.fillText('hiss', 6, H - 8);
    }, 30);
    const ctl = (k) => { const c = UI.paramControl(view, cfg(k), { size: 32, segMax: 6 }); c.el.dataset.key = k; return c.el; };
    const card = (title, keys) => h('div', { class: 'uk-group' }, [h('div', { class: 'uk-group-title', text: title }), h('div', { class: 'uk-row' }, keys.map(ctl))]);
    const face = h('div', { class: 'uk-panel' }, [card('LINES', ['lines', 'spread']), card('MOTION', ['rate', 'depth', 'shimmer']), card('BUCKET', ['chip', 'age']), card('TAPE', ['drive']), card('OUT', ['width', 'mix'])]);
    const deepBox = h('div', { class: 'uk-panel' }, [card('LINES+', ['sets', 'setOffset']), card('MOTION+', ['shimmerRate', 'shape', 'sync', 'base']), card('BUCKET+', ['compand']),
      card('DOUBLER', ['dblTime', 'dblWow', 'feedback']), card('TAPE+', ['bias', 'bump']), card('OUT+', ['bassMono', 'level']), card('BLOOM', ['bloomAmt', 'bloomTime'])]);
    deepBox.style.display = 'none';
    const deepB = UI.Button({ label: 'More depth ▸', hint: 'phase sets and their offset, shimmer rate, shape, on the beat, base delay, compander, the doubler, feedback, tape bias and bump, bass mono, level, how Bloom swells', onClick: () => { const show = deepBox.style.display === 'none'; deepBox.style.display = show ? '' : 'none'; deepB.el.textContent = show ? 'More depth ▾' : 'More depth ▸'; } });
    const bl = UI.Button({ label: '✦ BLOOM', kind: 'primary', hint: 'hold: the ensemble swells — deeper, all twelve lines, full width — over Bloom time; let go: back', onClick: () => {} });
    bl.el.addEventListener('pointerdown', () => { held = true; }); ['pointerup', 'pointerleave'].forEach(ev => bl.el.addEventListener(ev, () => { held = false; }));
    view.root.append(
      h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view), bl.el]),
      h('div', { class: 'org-row', style: { gap: '8px 14px', flexWrap: 'wrap' } }, [UI.paramControl(view, cfg('mode'), { segMax: 6 }).el, UI.paramControl(view, cfg('machine'), { segMax: 6 }).el]),
      cv, face, h('div', { class: 'org-row' }, [deepB.el]), deepBox,
      UI.hint('Many lines through one bucket-brigade chip. Ensemble: lines in sets of three, 120° apart — the string machine. Chorus: two, inverted — the Juno. Age: the chip’s hiss and clock bleed, breathing with the playing.'),
    );
    const RULES = [['feedback', 'mode', (v) => v === 'flanger', 'Feedback is the flange (Flanger)'], ['dblTime', 'mode', (v) => v === 'doubler', 'the doubler plays in Doubler'],
      ['dblWow', 'mode', (v) => v === 'doubler', 'the doubler plays in Doubler'], ['shimmerRate', 'shimmer', (v) => v > 0, 'no shimmer'], ['setOffset', 'sets', (v) => v !== 'even', 'one set: nothing to offset']];
    const dim = () => RULES.forEach(([k, sw, ok, why]) => { const el = view.root.querySelector(`[data-key="${k}"]`); if (!el) return; const on = ok(P(sw)); el.style.opacity = on ? '' : '0.35'; el.title = on ? '' : why; });
    [...new Set(RULES.map(r => r[1]))].forEach(sw => view.bind && view.bind(sw, () => setTimeout(dim, 0))); setTimeout(dim, 0);
    view.__bloom = (v) => { held = v; };
  });
})();

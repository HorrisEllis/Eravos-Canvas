/* eravos.wobble-builder UI — the face approved as a preview (docs/previews/wobble-builder/, his "yes build it.", 2026-11-20), made of the kit so it is
 * one of the tools: THE CHAIN (the slots as they are wired, the wobble's wire into the mouth — its thickness the depth) · WOBBLE · MOUTH · DRIVE · FX ·
 * VOICE · OUT, each slot's part swapped in its own card (its settings follow the part) · HEAR IT (the waveform and the wobble, live) · ⚄ MUTATE (the
 * one every tool uses) · ◆ SYNTHESIZE INTO A TOOL (the builder only) · the keys. A tool it made opens with this same face (its settings its own). */
(function () {
  const WB = window.WobbleBuilder, F = window.OrganismFactory; if (!WB || !F) return;
  function ui(view) {
    const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k), st = (k) => view.state[k] !== undefined ? view.state[k] : cfg(k).default;
    const made = view.descriptor.made, ctl = (k, o) => { const c = UI.paramControl(view, cfg(k), Object.assign({ size: 30 }, o || {})); c.el.dataset.key = k; return c; };
    const ACC = { WOBBLE: '#ffcc00', MOUTH: '#ff2266', DRIVE: '#00d4ff', FX: '#cc44ff', VOICE: '#39e5a0', OUT: '#9fb3c8' };
    const card = (title, how, kids, col) => { const c = h('div', { class: 'uk-group wbb-card', style: { breakInside: 'avoid', margin: '0 0 8px', '--acc': col || '' } }, [h('div', { class: 'uk-group-title', text: title, title: how || '' })].concat(kids)); return c; };
    const row = (kids) => h('div', { class: 'uk-row', style: { flexWrap: 'wrap', gap: '8px', alignItems: 'flex-end' } }, kids);
    // ---- a slot: its part (the socket) and that part's own settings, rebuilt when the part changes
    function slot(title, how, socket, always, col) {
      const box = h('div'), draw = () => { const part = st(socket); box.replaceChildren(row((always || []).map(k => ctl(k).el).concat(
        view.descriptor.config.filter(c => c.part && c.of === socket && [].concat(c.part).includes(part)).map(c => ctl(c.key).el))));
        if (part === 'none') box.append(UI.hint('nothing in this slot: the sound goes straight through')); };
      draw(); view.bind(socket, () => setTimeout(() => { draw(); drawChain(); }, 0));
      const sw = ctl(socket, { segMax: 5, noLabel: true }); return card(title, how, [sw.el, box], col);
    }
    // ---- THE CHAIN: the slots as they are wired; the wobble's wire into the mouth (thickness = depth); a slot clicked = its part's card
    const chain = UI.Canvas(520, 150);
    function drawChain() {
      chain.fit(); const g = chain.g, W = chain.W, H = chain.H; g.clearRect(0, 0, W, H);
      const SHORT = { 'saturator-tube': 'tube', 'saturator-tape': 'tape', bitcrusher: 'crush', 'filter-svf': 'svf', 'filter-ladder': 'ladder', 'delay-line': 'echo', none: '—' };   // the card says the full name
      const slots = [['SOURCE', st('wave'), ACC.VOICE], ['DRIVE', SHORT[st('drive')], ACC.DRIVE], ['MOUTH', SHORT[st('mouth')], ACC.MOUTH], ['FX', SHORT[st('fx')], ACC.FX]];
      const bw = Math.min(118, (W - 70) / 4.4), gap = (W - 60 - bw * 4) / 4, y = 62, bh = 40;
      g.font = '10px DM Mono, monospace'; g.textBaseline = 'middle';
      slots.forEach(([t, part, c], i) => { const x = 6 + i * (bw + gap), none = part === '—';
        g.strokeStyle = c; g.globalAlpha = none ? 0.4 : 1; g.setLineDash([4, 3]); g.strokeRect(x + 0.5, y + 0.5, bw, bh); g.setLineDash([]);
        g.fillStyle = c; g.fillText(t, x + 6, y + 12); g.fillStyle = '#b8cfe0'; g.fillText(part, x + 6, y + 28); g.globalAlpha = 1;
        g.strokeStyle = '#39e5a0aa'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x + bw, y + bh / 2); g.lineTo(x + bw + gap, y + bh / 2); g.stroke(); });
      const ox = 6 + 4 * (bw + gap); g.strokeStyle = '#ff2266'; g.lineWidth = 2; g.strokeRect(ox + 0.5, y + 6.5, 48, bh - 12); g.fillStyle = '#d8f6ff'; g.fillText('OUT', ox + 12, y + bh / 2);
      // the sub: clean, under it all, straight to the out
      g.strokeStyle = ACC.VOICE; g.setLineDash([5, 4]); g.lineWidth = 1.2; g.beginPath(); g.moveTo(6 + bw / 2, y + bh); g.bezierCurveTo(6 + bw / 2, H - 8, ox - 30, H - 8, ox + 24, y + bh - 6); g.stroke(); g.setLineDash([]);
      g.fillStyle = ACC.VOICE; g.fillText('sub ' + Math.round(st('sub') * 100) + ' % · ' + st('subOct') + ' oct, clean', 6 + bw / 2 + 8, H - 10);
      // the wobble: an LFO above the mouth, its wire into the mouth's detune
      const mx = 6 + 2 * (bw + gap); g.strokeStyle = ACC.WOBBLE; g.strokeRect(mx + 0.5, 4.5, bw, 30); g.fillStyle = ACC.WOBBLE; g.fillText('WOBBLE ' + st('rate'), mx + 6, 19);
      g.lineWidth = Math.max(1, st('depth') * 1.6); g.beginPath(); g.moveTo(mx + bw / 2, 35); g.lineTo(mx + bw / 2, y); g.stroke(); g.lineWidth = 1;
      g.fillText(st('depth') + ' oct', mx + bw / 2 + 8, 48);
    }
    chain.addEventListener('pointerdown', (e) => { e.stopPropagation(); const r = chain.getBoundingClientRect(), x = (e.clientX - r.left) / r.width; const t = x < 0.2 ? 'VOICE' : x < 0.4 ? 'DRIVE' : x < 0.6 ? 'MOUTH' : x < 0.8 ? 'FX' : 'OUT';
      const el = [...view.root.querySelectorAll('.wbb-card .uk-group-title')].find(n => n.textContent.startsWith(t)); if (el) { el.parentElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); el.parentElement.classList.add('wbb-flash'); setTimeout(() => el.parentElement.classList.remove('wbb-flash'), 700); } });
    ['wave', 'sub', 'subOct', 'rate', 'lfoShape', 'depth', 'drive', 'mouth', 'fx'].forEach(k => view.bind(k, () => setTimeout(drawChain, 0)));
    // ---- HEAR IT: the waveform as it plays, and its brightness (the wobble) in yellow
    const scope = UI.Canvas(520, 96), an = view.tap('out', 2048), td = new Float32Array(2048), bright = new Float32Array(160); let bi = 0;
    UI.loop(scope, () => {
      scope.fit(); const g = scope.g, W = scope.W, H = scope.H; an.getFloatTimeDomainData(td); g.clearRect(0, 0, W, H);
      let a = 0, d = 0; for (let i = 1; i < td.length; i++) { a += td[i] * td[i]; d += (td[i] - td[i - 1]) ** 2; } bright[bi++ % bright.length] = a > 1e-7 ? Math.sqrt(d / a) : 0;
      g.strokeStyle = '#00d4ff'; g.lineWidth = 1; g.beginPath(); for (let x = 0; x < W; x++) { const v = td[Math.floor(x / W * td.length)], yy = H / 2 - v * H * 0.45; x ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke();
      let mx = 1e-6; for (const b of bright) mx = Math.max(mx, b); g.strokeStyle = '#ffcc00'; g.lineWidth = 2; g.beginPath();
      for (let k = 0; k < bright.length; k++) { const v = bright[(bi + k) % bright.length], x = k / (bright.length - 1) * W, yy = H - 4 - v / mx * (H - 8); k ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke();
    });
    // ---- ⚄ MUTATE: the same mutation as every tool (tools/core/field/mutate.js) — on this tool's own settings
    const target = { id: view.descriptor.id, list: () => view.descriptor.config, get: (k) => st(k),
      set: (p) => Object.keys(p).forEach(k => view.emit('config_change', { key: k, value: p[k] })), hear: () => view.emit('audition', { note: 45, velocity: 0.9, duration: 1.4 }) };
    const dock = window.FieldMutate ? window.FieldMutate.dock(target, { kit: UI, hint: 'swaps slots (a new part\'s settings fresh) and moves a few settings near where they are — heard at once; keep it or throw it' }) : h('div');
    // ---- ◆ SYNTHESIZE INTO A TOOL (the builder only): the gates, then a tool of its own, on the canvas next to this one
    const said = h('div', { class: 'uk-hint wbb-said' }), list = h('div', { class: 'wbb-made' });
    function loadNovelty() {
      if (window.MusicNovelty) return Promise.resolve(window.MusicNovelty);
      return new Promise((res, rej) => { const s = document.createElement('script'); s.src = (window.ERAVOS_TOOLS || '') + 'music/compat/novelty.js'; s.onload = () => res(window.MusicNovelty); s.onerror = () => rej(new Error('the novelty measure did not load')); document.head.appendChild(s); });
    }
    async function synthesize() {
      const name = await UI.ask('Name the tool you made', 'Wobble ' + (WB.made().length + 1)); if (name === null) return;
      said.textContent = 'measuring it against every sound in ERAVOS…';
      let N; try { N = await loadNovelty(); } catch (er) { said.textContent = 'not made — ' + er.message; return; }
      const s = {}; view.descriptor.config.forEach(c => { s[c.key] = st(c.key); });
      const r = WB.make(name, s, view.bpm || 120, N);
      if (!r.ok) { said.textContent = 'not made — ' + r.why; said.classList.add('no'); return; }
      said.classList.remove('no'); said.textContent = '◆ ' + r.rec.name + ' made — ' + r.verdict + (r.verdict === 'CLOSE' ? ' (near ' + r.near + ')' : ' (nearest: ' + r.near + ', ' + r.d + ')') + ' · on the canvas now, and in ＋ Add › Bass';
      try { const w = window.CanvasWM && window.CanvasWM.windowOf(view.instanceId), at = w ? { x: w.offsetLeft + w.offsetWidth + 30, y: w.offsetTop } : undefined; F.spawn(r.id, at); } catch (er) {}
      drawMade(); if (window.Shell && window.Shell.toast) window.Shell.toast('◆ ' + r.rec.name + ' — a tool of its own', 'good', 2600);
    }
    function drawMade() {
      const L = WB.made(); list.replaceChildren();
      if (!L.length) { list.append(UI.hint('nothing made yet. a twin of anything in ERAVOS — or of a tool you made — is refused.')); return; }
      L.slice(0, 8).forEach(r => list.append(h('div', { class: 'wbb-mrow' }, [h('b', { text: r.name }), h('span', { text: r.verdict + ' · ' + r.chain }),
        UI.Button({ label: '＋ Canvas', hint: 'put it on the canvas', onClick: () => { WB.defineMade(r); F.spawn(r.id); } }).el,
        UI.Button({ label: '✕', hint: 'forget it (it stops opening after a restart; anything already on the canvas stays)', onClick: () => { WB.forget(r.id); drawMade(); } }).el])));
    }
    const synthCard = made ? card('MADE WITH THE WOBBLE BUILDER', '', [UI.hint((made.at || '').slice(0, 10) + ' · ' + (made.verdict === 'novel' ? 'new to ERAVOS' : 'close to ' + made.near) + ' · it runs on the builder\'s engine; its settings are its own')])
      : card('SYNTHESIZE — a tool of its own', 'measured first: it must play cleanly and be no twin of anything in ERAVOS or anything you made', [
        UI.Button({ label: '◆ Synthesize into a tool', kind: 'primary', hint: 'name it; it becomes a tool of its own — on the canvas, in ＋ Add › Bass, explodes and mutates like any tool', onClick: synthesize }).el, said, list]);
    if (!made) drawMade();
    const kb = UI.Keyboard ? UI.Keyboard({ low: 33, high: 57, key: view.key, onDown: (n, v) => view.emit('audition', { note: n, velocity: v, duration: 30 }), onUp: (n) => view.emit('audition_off', { note: n }) }) : { el: h('div') };
    const grid = h('div', { class: 'wbb-grid', style: { columnWidth: '300px', columnGap: '8px', marginTop: '6px' } }, [
      card('THE CHAIN — each slot a shared component', 'click a slot to find its card · the yellow wire is the wobble into the mouth (its thickness = depth) · the dashed line is the clean sub', [chain]),
      card('WOBBLE — the LFO into the mouth', 'on the beat; restarted on every note', [row([ctl('rate', { segMax: 9 }).el]), row([ctl('lfoShape').el, ctl('depth').el])], ACC.WOBBLE),
      slot('MOUTH — the filter the wobble moves', 'Cutoff is where it rests; the wobble opens it from there', 'mouth', ['cutoff', 'reso'], ACC.MOUTH),
      slot('DRIVE — before the mouth', 'gives the wobble something to bite', 'drive', [], ACC.DRIVE),
      slot('FX — after the mouth', 'an echo on the beat, tape, or crush', 'fx', [], ACC.FX),
      card('VOICE — the saw and a clean sub', '', [row(['wave', 'pw', 'sub', 'subOct', 'glide', 'octave'].map(k => ctl(k).el))], ACC.VOICE),
      card('OUT', '', [row(['width', 'level'].map(k => ctl(k).el))], ACC.OUT),
      card('HEAR IT — the waveform, and the wobble in yellow', '', [scope]),
      card('MUTATE', 'the same as every tool\'s: it learns what you keep and throw, never the same twice', [dock]),
      synthCard,
    ]);
    view.root.append(h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view)]), grid, h('div', { style: { height: '6px' } }), kb.el);
    setTimeout(drawChain, 0);
    view.wobbleBuilder = { synthesize, dock, drawChain };
  }
  WB.ui = ui;
  F.reg('eravos.wobble-builder', ui);
  WB.made().forEach(r => F.reg(r.id, ui));
  if (!document.getElementById('wbb-css')) { const s = document.createElement('style'); s.id = 'wbb-css';
    s.textContent = '.wbb-card .uk-group-title{color:var(--acc,inherit)}.wbb-flash{box-shadow:0 0 0 2px var(--acc,#00d4ff)}.wbb-said.no{color:#ff5a6e}' +
      '.wbb-made{display:flex;flex-direction:column;gap:4px;margin-top:6px}.wbb-mrow{display:flex;gap:6px;align-items:center;font-size:11px}.wbb-mrow span{flex:1;color:var(--dim);font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}';
    document.head.appendChild(s); }
})();

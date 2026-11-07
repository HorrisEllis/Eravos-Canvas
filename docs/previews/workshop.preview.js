/* PREVIEW ONLY — the Workshop (specs/eravos.workshop.spec): one object on a work surface, edited completely. Not shipped, silent.
 * window.__workshop(kind) draws it full-screen with the real kit: kind 'note' (music's NOTE: its layers drawn large) or 'photo' (the proposed
 * image domain: raster + adjust layers; the picture is generated here from maths — no shipped image). The surface code knows no domain:
 * each kind hands it labels, layers and a drawing. */
(function () {
  const UI = window.UIKit, h = UI.h;
  const KINDS = {
    note: {
      title: 'Note A3', where: ['Song · Night Drive', 'Pattern · Phrase', 'Note A3'], accent: '#8a5cff',
      tools: ['✎ Pen', '〰 Bend', '≈ Smooth', '⁂ Jitter', '⇋ Mirror', '⎘ Stamp', '⌫ Erase'],
      layers: [['Pitch', 'curve · semitones', 100, true], ['Loudness', 'curve', 100, false], ['Brightness', 'curve → its filter', 80, false], ['Pan', 'curve', 100, false], ['Coupling (Swarm)', 'a knob, this note only', 60, false], ['Timing', 'value · +6 ms', 100, false], ['Velocity', 'value · 0.82', 100, false]],
      props: [['Range', '±12 st'], ['Vibrato', '5.2 Hz'], ['Depth', '18 c'], ['Snap', 'to key']],
      history: ['Bend: dive −7 st at 60 %', 'Vibrato from 40 %', 'Brightness: open over the note', 'Coupling: 0.2 → 0.9'],
      preview: ['alone', 'with its neighbours', 'in the song'],
      draw(g, W, H, acc) {
        const x0 = W * 0.08, x1 = W * 0.92, mid = H * 0.48, len = x1 - x0;
        // the note itself: a long body on the table
        g.fillStyle = 'rgba(138,92,255,0.10)'; g.fillRect(x0, mid - 150, len, 300); g.strokeStyle = 'rgba(138,92,255,0.55)'; g.lineWidth = 1.5; g.strokeRect(x0, mid - 150, len, 300);
        // loudness: a filled envelope under everything
        g.beginPath(); g.moveTo(x0, mid + 150); for (let i = 0; i <= 200; i++) { const u = i / 200, a = u < 0.04 ? u / 0.04 : u < 0.2 ? 1 - (u - 0.04) * 1.2 : u < 0.85 ? 0.8 : 0.8 * (1 - (u - 0.85) / 0.15); g.lineTo(x0 + u * len, mid + 150 - a * 300); } g.lineTo(x1, mid + 150); g.closePath(); g.fillStyle = 'rgba(138,92,255,0.16)'; g.fill();
        // brightness: dashed
        g.setLineDash([6, 5]); g.strokeStyle = 'rgba(199,176,255,0.7)'; g.beginPath(); for (let i = 0; i <= 200; i++) { const u = i / 200, b = 0.25 + 0.6 * Math.min(1, u * 1.6) - 0.3 * Math.max(0, u - 0.8); const y = mid + 130 - b * 260; i ? g.lineTo(x0 + u * len, y) : g.moveTo(x0, y); } g.stroke(); g.setLineDash([]);
        // pitch: the selected layer — a dive at 60 %, vibrato from 40 %, with handles
        g.strokeStyle = acc; g.lineWidth = 3; g.beginPath(); const P = (u) => { let st = 0; if (u > 0.6) st = -7 * Math.pow((u - 0.6) / 0.4, 1.6); if (u > 0.4) st += 0.18 * Math.sin(2 * Math.PI * 5.2 * u * 2.2) * Math.min(1, (u - 0.4) * 5); return st; };
        for (let i = 0; i <= 400; i++) { const u = i / 400, y = mid - 40 - P(u) * 22; i ? g.lineTo(x0 + u * len, y) : g.moveTo(x0, y); } g.stroke();
        [[0, 0], [0.4, 0], [0.6, 0], [1, -7]].forEach(([u, st]) => { const x = x0 + u * len, y = mid - 40 - st * 22; g.fillStyle = '#050507'; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); g.strokeStyle = acc; g.lineWidth = 2; g.stroke(); });
        // a ruler: the note's length, and its neighbours ghosted at the edges
        g.fillStyle = '#7f7f8a'; g.font = '11px ui-monospace, monospace'; for (let k = 0; k <= 8; k++) { const x = x0 + k / 8 * len; g.fillRect(x, mid + 160, 1, 6); g.fillText(k === 0 ? '0' : k === 8 ? '1 bar' : '', x - 4, mid + 180); }
        g.fillStyle = 'rgba(138,92,255,0.18)'; g.fillRect(4, mid - 40, x0 - 12, 80); g.fillRect(x1 + 8, mid - 60, W - x1 - 12, 80);
        g.fillStyle = '#e8e2ff'; g.font = '12px ui-monospace, monospace'; g.fillText('PITCH  dive −7 st · vibrato 5.2 Hz   (dashed: brightness · filled: loudness · ghosts at the edges: its neighbours)', x0 + 8, mid - 162);
      },
    },
    // 2026-11-07 his words: "agnostic. the structure defines the shape which defines the emergent properties of the conditions." — a
    // PATTERN: its structure layers (scale, chords, grid, range, density, contour) are the shape; the notes are what the conditions produce.
    // The shaded cells are every note the shape admits (the possibility space); the bright ones emerged (seed 41); the ringed one is yours.
    pattern: {
      title: 'Pattern · Bassline (4 bars)', where: ['Song · Night Drive', 'Pattern · Bassline', 'Note'], accent: '#00d4ff', selected: 'Density',
      tools: ['✎ Pen', '⇕ Range', '⋮ Grid', '◢ Density', '〰 Contour', '⚄ Seed', '🔒 Lock', '⌫ Erase'], tool: 3,
      groups: [['STRUCTURE — THE SHAPE', [['Scale', 'constraint · A minor', 100], ['Chords', 'constraint · i–VI–III–VII', 100], ['Grid', 'constraint · 16ths · 5 of 8', 100], ['Range', 'constraint · A1 – A3', 100], ['Density', 'curve · over the 4 bars', 100], ['Contour', 'curve · up, then home', 70]]],
        ['WHAT EMERGES', [['Notes', 'events · what the conditions produce', 100], ['Yours (locked)', 'events · kept when the shape changes', 100], ['Variation', 'value · seed 41', 100]]]],
      props: [['Start', '30 %'], ['End', '90 %'], ['Shape', 'rise'], ['Over', '4 bars'], ['Live', 'while it plays'], ['Plays into', 'any wired tool']],
      history: ['Scale: A minor', 'Chords: i–VI–III–VII', 'Range: A1 – A3', 'Lock: A2 on bar 1', 'Density: rise 30 → 90 %'],
      preview: ['alone', 'with its tools', 'in the song'],
      draw(g, W, H, acc) {
        const L = 34, R = 34, T = 64, B = 96, x0 = L, x1 = W - R, y0 = T, y1 = H - B, steps = 64, lo = 33, hi = 57, rows = hi - lo + 1;
        const cw = (x1 - x0) / steps, rh = (y1 - y0) / rows, X = (s) => x0 + s * cw, Y = (n) => y1 - (n - lo + 1) * rh;
        const minor = [0, 2, 3, 5, 7, 8, 10], inKey = (n) => minor.includes(((n - 57) % 12 + 12) % 12);
        const chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], tone = (n, bar) => chords[bar].some(c => (((n - c) % 12) + 12) % 12 === 0);
        const eu = [1, 0, 1, 1, 0, 1, 1, 0], onGrid = (s) => eu[s % 8] === 1, dens = (s) => 0.3 + 0.6 * (s / steps), cont = (s) => 40 + 9 * Math.sin(Math.PI * s / steps);
        let seed = 41; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
        // the shape: rows outside the key are closed; the chord's tones in each bar are where the line can land
        for (let n = lo; n <= hi; n++) { const y = Y(n); if (!inKey(n)) { g.fillStyle = '#040406'; g.fillRect(x0, y, x1 - x0, rh); continue; }
          for (let bar = 0; bar < 4; bar++) { g.fillStyle = tone(n, bar) ? 'rgba(0,212,255,0.07)' : 'rgba(255,255,255,0.025)'; g.fillRect(X(bar * 16), y, 16 * cw, rh - 1); } }
        // the grid: steps the rhythm admits are lit columns
        for (let s = 0; s < steps; s++) { if (onGrid(s)) { g.fillStyle = 'rgba(0,212,255,0.045)'; g.fillRect(X(s), y0, cw - 1, y1 - y0); } }
        for (let bar = 0; bar <= 4; bar++) { g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(X(bar * 16), y0, 1, y1 - y0); }
        // the possibility space: every note the shape admits (in key, a chord tone, on the grid)
        for (let s = 0; s < steps; s++) { if (!onGrid(s)) continue; const bar = s >> 4; for (let n = lo; n <= hi; n++) if (inKey(n) && tone(n, bar)) { g.fillStyle = 'rgba(0,212,255,0.16)'; g.beginPath(); g.arc(X(s) + cw / 2, Y(n) + rh / 2, 1.6, 0, 7); g.fill(); } }
        // range: the band the line may move in
        g.strokeStyle = 'rgba(0,212,255,0.35)'; g.setLineDash([4, 4]); g.strokeRect(x0, Y(hi), x1 - x0, Y(lo) - Y(hi) + rh); g.setLineDash([]);
        // contour: where the line leans (a soft guide)
        g.strokeStyle = 'rgba(199,176,255,0.55)'; g.lineWidth = 1.5; g.beginPath(); for (let s = 0; s <= steps; s++) { const y = Y(cont(s)) + rh / 2; s ? g.lineTo(X(s), y) : g.moveTo(X(s), y); } g.stroke();
        // what emerges: on each admitted step, by the density there, the chord tone nearest the contour (seed 41)
        const notes = []; for (let s = 0; s < steps; s++) { if (!onGrid(s) || rnd() > dens(s)) continue; const bar = s >> 4, c = cont(s); let best = null, bd = 1e9;
          for (let n = lo; n <= hi; n++) if (inKey(n) && tone(n, bar)) { const d = Math.abs(n - c) + rnd() * 3; if (d < bd) { bd = d; best = n; } } notes.push([s, best]); }
        notes.forEach(([s, n], i) => { const lock = s === 0; g.fillStyle = acc; g.shadowColor = acc; g.shadowBlur = 10; g.fillRect(X(s) + 1, Y(n) + 1, cw * 1.6, rh - 2); g.shadowBlur = 0;
          if (lock) { g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.strokeRect(X(s) - 2, Y(n) - 2, cw * 1.6 + 6, rh + 4); } void i; });
        // density: the selected layer, drawn under the roll with its two handles
        const dy0 = y1 + 22, dh = 46; g.fillStyle = 'rgba(0,212,255,0.10)'; g.beginPath(); g.moveTo(x0, dy0 + dh); for (let s = 0; s <= steps; s++) g.lineTo(X(s), dy0 + dh - dens(s) * dh); g.lineTo(x1, dy0 + dh); g.closePath(); g.fill();
        g.strokeStyle = acc; g.lineWidth = 2.5; g.beginPath(); for (let s = 0; s <= steps; s++) { const y = dy0 + dh - dens(s) * dh; s ? g.lineTo(X(s), y) : g.moveTo(X(s), y); } g.stroke();
        [[0, dens(0)], [steps, dens(steps)]].forEach(([s, v]) => { g.fillStyle = '#050507'; g.beginPath(); g.arc(X(s), dy0 + dh - v * dh, 6, 0, 7); g.fill(); g.strokeStyle = acc; g.lineWidth = 2; g.stroke(); });
      },
    },
    photo: {
      title: 'Photo (your picture)', where: ['Board · Moodboard', 'Photo', 'Region'], accent: '#ffb347',
      tools: ['🖌 Brush', '⌫ Eraser', '☁ Smudge', '⎘ Clone', '⬚ Select', '⤡ Transform', '▣ Fill'],
      layers: [['Background', 'raster', 100, false], ['Sky fix', 'adjust · curves', 70, false], ['Glow', 'raster · screen', 55, true], ['Mask: subject', 'mask', 100, false]],
      props: [['Size', '42 px'], ['Hardness', '30 %'], ['Flow', '60 %'], ['Blend', 'screen']],
      history: ['Curves: lift shadows', 'Glow: brush 42 px', 'Mask: subject'],
      preview: ['as is', 'before / after', 'full size'],
      draw(g, W, H, acc) {
        const x0 = W * 0.12, y0 = H * 0.1, w = W * 0.76, hh = H * 0.74;
        const sky = g.createLinearGradient(0, y0, 0, y0 + hh); sky.addColorStop(0, '#1b2a6b'); sky.addColorStop(0.55, '#d0607a'); sky.addColorStop(1, '#ffb347'); g.fillStyle = sky; g.fillRect(x0, y0, w, hh);
        g.fillStyle = '#ffe59a'; g.beginPath(); g.arc(x0 + w * 0.62, y0 + hh * 0.6, hh * 0.12, 0, 7); g.fill();
        g.fillStyle = '#20112a'; g.beginPath(); g.moveTo(x0, y0 + hh); for (let i = 0; i <= 40; i++) g.lineTo(x0 + i / 40 * w, y0 + hh * (0.72 + 0.1 * Math.sin(i * 0.7) * Math.cos(i * 0.23))); g.lineTo(x0 + w, y0 + hh); g.fill();
        const gl = g.createRadialGradient(x0 + w * 0.62, y0 + hh * 0.6, 4, x0 + w * 0.62, y0 + hh * 0.6, hh * 0.45); gl.addColorStop(0, 'rgba(255,230,160,0.55)'); gl.addColorStop(1, 'rgba(255,230,160,0)'); g.fillStyle = gl; g.fillRect(x0, y0, w, hh);
        g.strokeStyle = acc; g.lineWidth = 1.5; g.setLineDash([5, 4]); g.strokeRect(x0 + w * 0.48, y0 + hh * 0.42, w * 0.28, hh * 0.34); g.setLineDash([]);
        g.strokeStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc(x0 + w * 0.3, y0 + hh * 0.3, 21, 0, 7); g.stroke();
        g.fillStyle = '#7f7f8a'; g.font = '11px ui-monospace, monospace'; g.fillText('generated here (maths) — the real one opens your own picture', x0, y0 + hh + 18);
      },
    },
  };
  window.__workshop = function (kindId) {
    document.querySelectorAll('.ws-prev').forEach(x => x.remove());
    const K = KINDS[kindId], ov = h('div', { class: 'ws-prev', style: { position: 'fixed', inset: '56px 0 0 0', zIndex: '9000', background: 'var(--bg, #050507)', display: 'grid', gridTemplateColumns: '150px 1fr 280px', gridTemplateRows: '52px 1fr 64px', gap: '8px', padding: '10px', boxSizing: 'border-box' } });
    const card = (t, kids, st) => h('div', { class: 'uk-group', style: Object.assign({ margin: 0, overflow: 'hidden' }, st || {}) }, [h('div', { class: 'uk-group-title', text: t })].concat(kids));
    const head = h('div', { class: 'org-row', style: { gridColumn: '1 / 4', justifyContent: 'space-between', alignItems: 'center' } }, [
      h('div', { class: 'org-row', style: { gap: '10px', alignItems: 'baseline' } }, [h('b', { style: { font: '600 15px var(--font, sans-serif)', letterSpacing: '0.14em', color: 'var(--acc, #00d4ff)' }, text: 'WORKSHOP' }), h('span', { class: 'uk-hint', style: { margin: 0 }, text: K.title })]),
      h('div', { class: 'org-row', style: { gap: '8px' } }, [UI.Button({ label: 'Save to library' }).el, UI.Button({ label: '⎘ Save a layer as a stamp' }).el, UI.Button({ label: 'Apply', kind: 'primary' }).el, UI.Button({ label: '⧉ Pop out' }).el, UI.Button({ label: '×' }).el])]);
    const tools = card('TOOLS', K.tools.map((t, i) => { const b = UI.Button({ label: t }).el; b.style.width = '100%'; b.style.margin = '3px 0'; if (i === (K.tool !== undefined ? K.tool : kindId === 'note' ? 1 : 0)) b.classList.add('on'); return b; }));
    const surf = UI.Canvas(900, 560); surf.style.width = '100%'; surf.style.height = '100%';
    UI.loop(surf, () => { const g = surf.g; surf.fit(); const W = surf.W, H = surf.H || 560; g.fillStyle = '#060608'; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(255,255,255,0.04)'; g.lineWidth = 1; for (let x = 0; x < W; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      K.draw(g, W, H, K.accent); }, 6);
    const centre = h('div', { class: 'uk-group', style: { margin: 0, padding: '0', overflow: 'hidden', position: 'relative' } }, [surf]);
    // a kind may group its layers (the pattern: STRUCTURE — the shape · WHAT EMERGES); the surface draws the groups, it knows no meaning
    const groups = K.groups || [[null, K.layers]], selName = K.selected || (K.layers.find(l => l[3]) || [])[0];
    const row = ([n, t, a]) => h('div', { class: 'org-row', style: { gap: '6px', alignItems: 'center', padding: '4px 6px', margin: '2px 0', borderRadius: '6px', outline: n === selName ? '1px solid ' + K.accent : 'none' } }, [
      h('span', { text: '◉', style: { color: K.accent, fontSize: '12px' } }), h('div', { style: { flex: '1' } }, [h('div', { text: n, style: { fontSize: '12px' } }), h('div', { class: 'uk-hint', style: { margin: 0, fontSize: '10px' }, text: t })]), h('span', { class: 'uk-hint', style: { margin: 0 }, text: a + '%' })]);
    const layers = card('LAYERS', [].concat(...groups.map(([gt, ls]) => (gt ? [h('div', { class: 'org-label', style: { margin: '8px 6px 2px', fontSize: '10px' }, text: gt })] : []).concat(ls.map(row)))));
    const props = card('PROPERTIES — ' + String(selName).toUpperCase(), [h('div', { class: 'uk-row', style: { flexWrap: 'wrap', gap: '6px' } }, K.props.map(([k, v]) => h('div', { style: { minWidth: '110px' } }, [h('div', { class: 'uk-hint', style: { margin: 0, fontSize: '10px' }, text: k }), h('b', { text: v, style: { fontSize: '12px' } })])))]);
    const hist = card('HISTORY', K.history.map((x, i) => h('div', { class: 'uk-hint', style: { margin: '2px 0', color: i === K.history.length - 1 ? 'var(--text, #ddd)' : '' }, text: (i + 1) + '. ' + x })));
    const right = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' } }, [layers, props, hist]);
    const crumbs = h('div', { class: 'org-row', style: { gap: '6px', alignItems: 'center' } }, [h('span', { class: 'org-label', text: 'ZOOM' })].concat(...K.where.map((w, i) => [i ? h('span', { class: 'uk-hint', style: { margin: 0 }, text: '›' }) : null, (() => { const b = UI.Button({ label: w }).el; if (i === K.where.length - 2 && kindId === 'note' || i === 1 && kindId !== 'note') b.classList.add('on'); return b; })()].filter(Boolean))));
    const prev = UI.Segmented({ options: K.preview, value: K.preview[0] });
    const foot = h('div', { class: 'org-row', style: { gridColumn: '1 / 4', justifyContent: 'space-between', alignItems: 'center' } }, [crumbs, h('div', { class: 'org-row', style: { gap: '8px', alignItems: 'center' } }, [h('span', { class: 'org-label', text: kindId === 'photo' ? 'SEE' : 'HEAR' }), prev.el])]);
    ov.append(head, tools, centre, right, foot); document.body.appendChild(ov);
  };
})();

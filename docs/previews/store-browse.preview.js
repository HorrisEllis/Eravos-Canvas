/* PREVIEW ONLY — Browse (specs/eravos.store-browse.spec SB1), drawn in the real canvas with the ＋ Add menu's own layout and classes
 * (ap-*: rail · main · detail, chips, tb-btn), filled with REAL data: the catalog's domains and tools, a tool's packs and presets, its
 * component contracts (CG1, 3.179) and the rhythms and lines decomposed from the songs (SD1, 3.180). Not shipped; nothing is installed.
 * His words (2026-11-13): "like you click browse, and it opens a menu for browsing tools per domain, packs per tool, sounds and presets. a
 * tool page per tool with the relevant dependancies and packs. rhythmes and notes per tool."
 * BrowsePreview.show({ level: 'domains' | 'tools' | 'tool', domain, category, tool, tab }, DATA) */
(function (global) {
  const h = (tag, a, kids) => { const e = document.createElement(tag); Object.entries(a || {}).forEach(([k, v]) => { if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else if (k === 'html') e.innerHTML = v; else if (k === 'style') Object.assign(e.style, v); else if (k.startsWith('on')) e[k] = v; else e.setAttribute(k, v); }); [].concat(kids || []).forEach(c => c != null && e.append(c.nodeType ? c : document.createTextNode(String(c)))); return e; };
  const chip = (t, cls, title) => h('span', { class: 'ap-chip ' + (cls || ''), text: t, title: title || '' });
  const Cat = global.Catalog, F = global.OrganismFactory;
  const STAGE = ['CONTROL', 'SOURCE', 'SHAPE', 'AMP', 'MOD', 'FX', 'OUT'];
  const stageOf = (c) => ({ 'voice-allocator': 'CONTROL', 'unison-stack': 'SOURCE', 'osc-va': 'SOURCE', 'osc-sub': 'SOURCE', 'osc-noise': 'SOURCE', 'filter-svf': 'SHAPE', 'filter-ladder': 'SHAPE', 'env-adsr': 'AMP', lfo: 'MOD', 'random-source': 'MOD', 'bbd-line': 'FX', 'ensemble-core': 'FX' })[c] || 'SHAPE';

  function show(o, D) {
    document.querySelectorAll('.overlay.browse-pv').forEach(x => x.remove());
    const ov = h('div', { class: 'overlay addpop browse-pv' }), rail = h('nav', { class: 'ap-rail' }), main = h('section', { class: 'ap-main' }), detail = h('aside', { class: 'ap-detail' });
    const doms = Cat.domains().filter(d => !d.toolless), dom = doms.find(d => d.id === (o.domain || 'music'));
    const tools = Cat.tools().filter(t => !t.hidden && t.domain === (o.domain || 'music'));
    const path = ['Store', o.level !== 'domains' && dom ? dom.label : null, o.category, o.tool && (Cat.meta(o.tool) || {}).label, o.tab].filter(Boolean);
    const box = h('div', { class: 'ap-box' }, [
      h('header', { class: 'ap-head' }, [h('div', { class: 'ap-title' }, [h('b', { text: '⌕ Browse' }), h('div', { class: 'ap-chips' }, path.map((p, i) => chip((i ? '› ' : '') + p, i === path.length - 1 ? 'mode' : 'dim')))]),
        h('input', { class: 'ap-search', placeholder: 'Search domains, tools, packs, sounds, rhythms…' }), h('button', { class: 'ap-x', text: '✕' })]),
      h('div', { class: 'ap-body' }, [rail, main, detail]),
      h('div', { class: 'ap-foot', text: 'PREVIEW — nothing here is built yet · Domains › Tools › a tool’s page › a pack · every tool a whole zip, isolated · Esc closes' })]);
    ov.appendChild(box); document.body.appendChild(ov);
    const item = (label, n, on) => rail.appendChild(h('button', { class: 'ap-rail-item ' + (on ? 'on' : '') }, [h('span', { class: 'ap-rail-l', text: label }), n != null ? h('small', { text: String(n) }) : null]));
    rail.appendChild(h('div', { class: 'ap-rail-sec', text: 'STORE' }));
    item('Domains', doms.length, o.level === 'domains'); item('Installed', Cat.tools().filter(t => Cat.isInstalled(t.id)).length); item('Updates', 0);
    rail.appendChild(h('div', { class: 'ap-rail-sec', text: (dom ? dom.label : '').toUpperCase() }));
    const cats = [...new Set(tools.map(t => t.category))].sort(); cats.forEach(c => item(c, tools.filter(t => t.category === c).length, o.level === 'tools' && o.category === c));
    if (o.level === 'domains') domains(main, detail, doms);
    else if (o.level === 'tools') toolsGrid(main, detail, tools.filter(t => t.category === o.category), o, D);
    else toolPage(main, detail, o, D);
  }

  function domains(main, detail, doms) {
    main.appendChild(h('div', { class: 'ap-lead' }, [h('h2', { text: 'Domains' }), h('p', { text: 'Each domain is a set of tools that speak the same language (music, video, images …). Install a whole domain, or open it and pick single tools — each comes as one zip with everything it is made of.' })]));
    const grid = h('div', { class: 'ap-modes' });
    doms.forEach(d => { const ts = Cat.tools().filter(t => t.domain === d.id && !t.hidden), inst = ts.filter(t => Cat.isInstalled(t.id)).length, packs = ts.reduce((a, t) => a + (t.packs || 0), 0);
      grid.appendChild(h('div', { class: 'ap-mode ' + (d.id === 'music' ? 'on' : ''), style: { '--acc': d.id === 'music' ? '#ff2266' : '#7f93a8' } }, [
        h('div', { class: 'ap-mode-top' }, [h('span', { class: 'ap-mode-ic', text: d.icon || '◈' }), h('div', {}, [h('b', { text: d.label }), h('small', { text: `${ts.length} tools · ${packs} packs` })])]),
        h('p', { text: d.summary || '' }),
        h('div', { class: 'ap-chiprow' }, [chip(inst ? inst + ' installed' : 'not installed', inst ? 'built' : 'new'), ...(d.ports || []).map(p => chip('speaks ' + p, 'dim'))]),
        h('div', { class: 'ap-mode-act' }, [h('button', { class: 'tb-btn ' + (d.id === 'music' ? 'on' : 'primary'), text: d.id === 'music' ? 'Open — browse its tools' : 'Install the domain' })])])); });
    main.appendChild(grid);
    detail.appendChild(h('div', { class: 'ap-d-empty' }, [h('b', { text: 'A store for domains and tools' }), h('p', { text: 'Every unit comes as a zip with all it is: a tool with its components, its DAG, its packs — isolated from every other tool. Before anything installs, the canvas reads what it needs (its announcement) and shows it here, in words.' })]));
  }

  function toolsGrid(main, detail, ts, o, D) {
    main.appendChild(h('div', { class: 'ap-gridhead' }, [h('h2', { text: o.category }), h('small', { text: ts.length + ' tools' })]));
    const grid = h('div', { class: 'ap-grid' });
    ts.forEach(t => { const pic = t.art || t.thumb || t.preview, a = D.announce[t.id];
      const frame = h('div', { class: 'ap-card-pic' + (t.art || t.thumb ? '' : ' fit') + (t.art ? ' painted' : '') }, pic ? [h('img', { class: 'ap-card-img', src: (global.ERAVOS_TOOLS || '') + pic })] : [h('span', { class: 'ap-card-ic', text: t.icon || '◻' })]);
      grid.appendChild(h('div', { class: 'ap-card' + (t.id === o.tool ? ' sel' : ''), style: { '--acc': t.accent || '#00d4ff' } }, [frame, h('div', { class: 'ap-card-tx' }, [h('b', { text: (t.icon ? t.icon + ' ' : '') + t.label }), h('small', { text: t.summary || '' }),
        h('div', { class: 'ap-chiprow' }, [chip(Cat.isInstalled(t.id) ? 'installed' : 'in the store', Cat.isInstalled(t.id) ? 'built' : 'new'), t.packs ? chip(t.packs + ' packs', 'dim') : null, a ? chip(a.components.length + ' components', 'dim') : null, D.parts[t.id] ? chip(D.parts[t.id].rhythms + ' rhythms · ' + D.parts[t.id].lines + ' lines', 'dim') : null].filter(Boolean))])])); });
    main.appendChild(grid);
    const t = Cat.meta(o.tool), a = D.announce[o.tool];
    detail.append(h('div', { class: 'ap-d-head', style: { '--acc': t.accent } }, [h('span', { class: 'ap-d-tile', text: t.icon }), h('div', {}, [h('h3', { text: t.label }), h('small', { text: t.category + ' · its zip: ' + (a ? a.components.length : 0) + ' components inside' })])]),
      h('p', { class: 'ap-d-blurb', text: t.summary || '' }), h('button', { class: 'tb-btn primary ap-addbtn ap-pagebtn', text: '📘 Open its page' }), h('button', { class: 'tb-btn ap-addbtn2', text: '＋ Add to canvas' }),
      h('div', { class: 'ap-d-sec' }, [h('div', { class: 'ap-sub', text: 'IT ANNOUNCES (from its DAG)' }), ...(a ? a.components.map(c => h('div', { class: 'ap-d-row' }, [h('span', { text: '◆ ' + c }), h('small', { text: 'with its UI element' })])) : [])]));
  }

  function toolPage(main, detail, o, D) {
    const t = Cat.meta(o.tool), a = D.announce[o.tool], tabs = ['About', 'Needs', 'Packs', 'Sounds', 'Rhythms', 'Notes'];
    main.appendChild(h('div', { class: 'ap-d-head', style: { '--acc': t.accent, marginBottom: '10px' } }, [h('span', { class: 'ap-d-tile', text: t.icon }), h('div', {}, [h('h3', { text: t.label }), h('small', { text: t.category + ' · one zip: the tool, ' + a.components.length + ' components, its DAG, ' + (t.packs || 0) + ' packs' })])]));
    main.appendChild(h('div', { class: 'ap-chiprow', style: { marginBottom: '12px' } }, tabs.map(x => { const c = chip(x, x === o.tab ? 'mode' : 'dim'); c.style.cursor = 'pointer'; return c; })));
    if (o.tab === 'Needs') needs(main, a, D); else if (o.tab === 'Packs' || o.tab === 'Sounds') packs(main, o, D); else rhythms(main, o, D);
    detail.append(h('div', { class: 'ap-d-sec' }, [h('div', { class: 'ap-sub', text: 'INSTALL' }), h('div', { class: 'ap-d-row' }, [h('span', { text: Cat.isInstalled(o.tool) ? '✓ installed' : 'not installed' }), h('small', { text: 'v' + ((F.def(o.tool) || {}).version || '1.0.0') })]),
      h('button', { class: 'tb-btn primary ap-addbtn', text: '＋ Add to canvas' }), h('button', { class: 'tb-btn ap-rmbtn', text: 'Remove' })]),
      h('div', { class: 'ap-d-sec' }, [h('div', { class: 'ap-sub', text: 'WHAT WOULD COME WITH IT' }), h('div', { class: 'ap-d-row' }, [h('span', { text: 'nothing else — every part is inside its zip' }), h('small', { text: 'isolated: its components are its own copies' })])]),
      h('div', { class: 'ap-d-sec' }, [h('div', { class: 'ap-sub', text: 'TALKS TO THE CANVAS THROUGH' }), ...['its manifest (read before any code runs)', 'kernel hooks: note in, audio out, modulation', 'the kit elements it announced', 'the music SDK'].map(x => h('div', { class: 'ap-d-row' }, [h('span', { text: '• ' + x })]))]));
  }

  function needs(main, a, D) {
    main.appendChild(h('div', { class: 'ap-sub', text: 'ITS DAG — what it is made of, in the order the sound flows · each component brings its own UI element' }));
    const W = Math.max(600, main.clientWidth - 40), H = 330, cv = h('canvas', { width: W * 2, height: H * 2, style: { width: W + 'px', height: H + 'px', display: 'block', borderRadius: '8px', border: '1px solid var(--line2)', background: '#050507' } }); main.appendChild(cv);
    const g = cv.getContext('2d'); g.scale(2, 2); g.fillStyle = '#050507'; g.fillRect(0, 0, W, H);
    const cols = STAGE.filter(s => a.components.some(c => stageOf(c.split('@')[0]) === s)), cw = W / cols.length, pos = {};
    cols.forEach((s, i) => { g.fillStyle = '#7f93a8'; g.font = '10px ui-monospace, monospace'; g.fillText(s, i * cw + 10, 16);
      a.components.map(c => c.split('@')[0]).filter(c => stageOf(c) === s).forEach((c, j) => { const x = i * cw + 8, y = 28 + j * 66, w = cw - 16; pos[c] = [x, y, w];
        g.fillStyle = 'rgba(255,34,102,.10)'; g.fillRect(x, y, w, 56); g.strokeStyle = '#ff2266'; g.strokeRect(x + .5, y + .5, w - 1, 55);
        g.fillStyle = '#ffe8ef'; g.font = '11px ui-monospace, monospace'; g.fillText(c, x + 6, y + 14);
        const k = D.contracts[c], face = k ? k.element.controls.filter(q => q.face).map(q => q.key) : [];
        g.fillStyle = '#9fb0c2'; g.font = '9px ui-monospace, monospace'; let pt = k ? k.ports.map(p => (p.dir === 'in' ? '←' : '→') + p.type).join(' ') : ''; while (pt.length > 3 && g.measureText(pt).width > w - 10) pt = pt.slice(0, -1); g.fillText(pt, x + 5, y + 25);
        const slot = (w - 8) / Math.max(1, face.length); face.forEach((f, q) => { const cx = x + 4 + slot * q + slot / 2; g.strokeStyle = '#ff2266'; g.beginPath(); g.arc(cx, y + 38, 5.5, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(cx, y + 38); g.lineTo(cx + 3.5, y + 34); g.stroke();
          g.fillStyle = '#c9d4df'; g.font = '8.5px ui-monospace, monospace'; g.textAlign = 'center'; let t = f; while (t.length > 2 && g.measureText(t).width > slot - 4) t = t.slice(0, -1); g.fillText(t === f ? t : t + '…', cx, y + 52); g.textAlign = 'left'; }); }); });
    g.strokeStyle = 'rgba(255,34,102,.45)'; g.lineWidth = 1;
    for (let i = 0; i < cols.length - 1; i++) { g.beginPath(); g.moveTo((i + 1) * cw - 6, 44); g.lineTo((i + 1) * cw + 6, 44); g.stroke(); }
    const n = a.components.reduce((s, c) => s + ((D.contracts[c.split('@')[0]] || {}).variables || []).length, 0);
    main.appendChild(h('div', { class: 'ap-chiprow', style: { marginTop: '10px' } }, [chip(a.components.length + ' components inside its zip', 'built'), chip(a.elements.length + ' UI elements — its face is made from them', 'built'), chip(n + ' variables, each checked against the code', 'dim'), chip('kit: knob · segmented · toggle', 'dim')]));
  }

  function packs(main, o, D) {
    const P = global.ContentPacks ? ContentPacks.list({ tool: o.tool }) : [], def = F.def(o.tool) || {}, presets = Object.keys(def.presets || {});
    if (o.tab === 'Packs') {
      main.appendChild(h('div', { class: 'ap-sub', text: 'ITS PACKS — data beside the tool, never inside its engine; each installs on its own' }));
      const grid = h('div', { class: 'ap-modes' });
      P.forEach(p => grid.appendChild(h('div', { class: 'ap-mode' + (p.enabled ? ' on' : ''), style: { '--acc': '#ff2266' } }, [h('div', { class: 'ap-mode-top' }, [h('span', { class: 'ap-mode-ic', text: '▤' }), h('div', {}, [h('b', { text: p.label }), h('small', { text: p.count + ' ' + p.kinds.join(' · ') })])]),
        h('div', { class: 'ap-chiprow' }, [chip(p.enabled ? 'installed' : 'in the store', p.enabled ? 'built' : 'new'), ...(p.tags || []).slice(0, 3).map(x => chip(x, 'dim'))]), h('div', { class: 'ap-mode-act' }, [h('button', { class: 'tb-btn', text: '▶ Hear it' }), h('button', { class: 'tb-btn ' + (p.enabled ? 'on' : 'primary'), text: p.enabled ? '✓ Installed' : 'Install' })])])));
      main.appendChild(grid);
    } else {
      main.appendChild(h('div', { class: 'ap-sub', text: 'SOUNDS — every preset across its packs, heard before it loads (Preview)' }));
      main.appendChild(h('div', { class: 'ap-grid', style: { gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' } }, presets.map(p => h('div', { class: 'ap-card', style: { '--acc': def.accent || '#ff2266', padding: '10px 12px', flexDirection: 'row', alignItems: 'center', gap: '10px', display: 'flex' } }, [h('button', { class: 'tb-btn', text: '▶' }), h('div', {}, [h('b', { text: p }), h('small', { text: 'Factory' })])]))));
    }
  }

  function rhythms(main, o, D) {
    const sp = D.songParts, isR = o.tab === 'Rhythms', list = (isR ? sp.rhythms : sp.lines).slice(0, 12);
    main.appendChild(h('div', { class: 'ap-sub', text: (isR ? 'RHYTHMS' : 'NOTES') + ` — taken from the songs (${isR ? sp.rhythms.length + ' rhythms' : sp.lines.length + ' lines'} this tool plays across ${sp.songCount} songs) · hear one on the tool, drag it to the canvas or the Timeline` }));
    const grid = h('div', { class: 'ap-grid', style: { gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' } });
    const colW = Math.floor((main.clientWidth - 60) / 2) - 18;
    list.forEach((e, i) => { const W = Math.max(240, colW), H = isR ? 46 : 74, cv = h('canvas', { width: W * 2, height: H * 2, style: { width: W + 'px', height: H + 'px', display: 'block', background: '#050507', borderRadius: '6px' } }), g = cv.getContext('2d'); g.scale(2, 2);
      g.fillStyle = '#050507'; g.fillRect(0, 0, W, H); for (let s = 0; s < 16; s++) { g.fillStyle = s % 4 ? '#0d1218' : '#141c25'; g.fillRect(4 + s * (W - 8) / 16, 4, (W - 8) / 16 - 1, H - 8); }
      if (isR) e.steps.forEach((st, k) => { const v = e.vel[k] || 0.7, x = 4 + st[0] * (W - 8) / 16; g.fillStyle = `rgba(255,34,102,${0.35 + 0.65 * v})`; g.fillRect(x + 1, H - 6 - (H - 12) * v, (W - 8) / 16 - 3, (H - 12) * v); });
      else { const ns = e.notes.map(n => n[2]), lo = Math.min(...ns) - 1, hi = Math.max(...ns) + 1; e.notes.forEach((n, k) => { const x = 4 + n[0] * (W - 8) / 16, w = Math.max(3, n[1] * (W - 8) / 16 - 2), y = 4 + (hi - n[2]) / (hi - lo) * (H - 14); g.fillStyle = `rgba(0,212,255,${0.4 + 0.6 * (e.vel[k] || 0.7)})`; g.fillRect(x + 1, y, w, 6); }); }
      grid.appendChild(h('div', { class: 'ap-card', style: { '--acc': '#ff2266', padding: '8px' } }, [cv, h('div', { class: 'ap-card-tx', style: { padding: '6px 2px 0' } }, [h('b', { text: (isR ? 'Rhythm ' : 'Line ') + (i + 1) + ' · ' + (isR ? e.steps.length + ' hits' : e.notes.length + ' notes') }),
        h('small', { text: `${e.bars} bars in ${e.songs.length} song${e.songs.length > 1 ? 's' : ''}: ${e.songs.slice(0, 2).map(s => D.titles[s] || s).join(', ')}${e.songs.length > 2 ? ' …' : ''}` }),
        h('div', { class: 'ap-chiprow' }, [chip('▶ hear on ' + Cat.meta(o.tool).label, 'dim'), chip('⤓ to the Timeline', 'dim')])])])); });
    main.appendChild(grid);
  }
  global.BrowsePreview = { show };
})(window);

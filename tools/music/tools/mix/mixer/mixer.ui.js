/* eravos.mixer UI — a console: tool strips · lines (GROUP / AUX, + the built-in Reverb and Echo) · master meter.
 * Strips are kept by key and updated in place (a fader is never rebuilt under the hand that drags it). */
OrganismFactory.reg('eravos.mixer', function (view) {
  const UI = view.ui, h = UI.h, A = view.K.audio;
  const LAW = { // dB −60..+12, 0 dB at 75 % travel
    toN: (db) => db <= -60 ? 0 : db <= 0 ? 0.75 * Math.pow((db + 60) / 60, 2) : 0.75 + Math.min(1, db / 12) * 0.25,
    fromN: (n) => n <= 0.001 ? -60 : n <= 0.75 ? +(Math.sqrt(n / 0.75) * 60 - 60).toFixed(1) : +(((n - 0.75) / 0.25) * 12).toFixed(1),
  };
  const fmtDb = (v) => v <= -60 ? '−∞' : (v > 0 ? '+' : '') + (+v).toFixed(1);
  const root = view.root; root.classList.add('mx');
  const addG = UI.Button({ label: '＋ Group', hint: 'a new line: send tools to it (strip → output), then one fader moves them all', onClick: () => view.emit('line_add', { kind: 'group' }) });
  const addV = UI.Button({ label: '＋ Reverb line', hint: 'a new effect line with its own reverb — strips send to it', onClick: () => view.emit('line_add', { kind: 'aux', fx: 'reverb' }) });
  const addE = UI.Button({ label: '＋ Echo line', hint: 'a new effect line with its own echo', onClick: () => view.emit('line_add', { kind: 'aux', fx: 'echo' }) });
  const addP = UI.Button({ label: '＋ Aux', hint: 'a plain line fed by sends (no effect) — a parallel bus', onClick: () => view.emit('line_add', { kind: 'aux', fx: 'plain' }) });
  const wide = UI.paramControl(view, view.descriptor.config.find(c => c.key === 'wide'));
  const meters = UI.paramControl(view, view.descriptor.config.find(c => c.key === 'meters'));
  const expandAll = UI.Button({ label: '▸ Open all', hint: 'show EQ and sends on every strip', onClick: () => { const any = Array.from(comps.values()).some(c => !c.open); comps.forEach(c => c.setOpen(any)); expandAll.set(any ? '▾ Close all' : '▸ Open all'); } });
  const bar = h('div', { class: 'org-row mx-bar' }, [addG.el, addV.el, addE.el, addP.el, h('span', { class: 'wm-spacer' }), expandAll.el, wide.el, meters.el]);
  const tools = h('div', { class: 'mx-group mx-tools' }), linesEl = h('div', { class: 'mx-group mx-lines' }), masterEl = h('div', { class: 'mx-group mx-master' });
  const empty = h('div', { class: 'mx-empty', text: 'Nothing on the canvas makes sound yet — ＋ Add an instrument and its strip appears here by itself.' });
  const desk = h('div', { class: 'mx-desk' }, [tools, h('div', { class: 'mx-sep' }), linesEl, h('div', { class: 'mx-sep' }), masterEl]);
  root.append(bar, desk, UI.hint('Every sound gets a strip · drag a fader (double-click = 0 dB) · ▸ opens EQ and sends · Output sends a strip into a Group · ＋ lines add groups and effect returns · ⤢ fills the screen'));
  view.bind('wide', (v) => root.classList.toggle('wide', !!v));

  let snap = { strips: [], lines: [] };
  const comps = new Map(); // key → strip component
  const auxes = () => snap.lines.filter(l => l.kind === 'aux');
  const groups = () => snap.lines.filter(l => l.kind === 'group');

  function meterEl() { const c = h('canvas', { class: 'mx-meter', width: 10, height: faderH }); c.style.height = faderH + 'px'; return c; }
  // faders use the height the window gives them (⤢ = long throw faders)
  let faderH = 150;
  function sizeFaders() {
    const H = Math.max(120, Math.min(520, (desk.clientHeight || 400) - 250)); if (Math.abs(H - faderH) < 4) return; faderH = H;
    root.querySelectorAll('.mx-strip .uk-fader').forEach(f => { f.style.height = H + 'px'; });
    root.querySelectorAll('.mx-strip .mx-meter:not(.master)').forEach(c => { c.height = H; c.style.height = H + 'px'; });
    mMeter.height = H + 20; mMeter.style.height = (H + 20) + 'px';
  }
  if (window.ResizeObserver) new ResizeObserver(() => sizeFaders()).observe(desk);
  // ---- a tool strip
  function toolStrip(s) {
    const k = s.inst + '/' + s.port, set = (patch) => view.emit('strip_set', { inst: s.inst, port: s.port, patch });
    const el = h('div', { class: 'mx-strip', style: { '--acc': s.accent } });
    const name = h('button', { class: 'mx-name', title: 'show this tool on the canvas', onclick: () => view.emit('focus_tool', { inst: s.inst }) }, [h('span', { class: 'mx-ico', text: s.icon }), h('span', { class: 'mx-lbl', text: s.label + (s.portLabel ? ' · ' + s.portLabel : '') })]);
    const pan = UI.Knob({ label: 'Pan', min: -1, max: 1, step: 0.01, value: s.state.pan, default: 0, size: 30, format: (v) => Math.abs(v) < 0.01 ? 'C' : (v < 0 ? 'L' : 'R') + Math.round(Math.abs(v) * 100), onChange: (v) => set({ pan: v }) });
    const fader = UI.Fader({ min: -60, max: 12, step: 0.1, value: s.state.db, default: 0, height: faderH, law: LAW, format: fmtDb, label: '', onChange: (v) => set({ db: v }) });
    const m = meterEl();
    const mute = h('button', { class: 'mx-btn mx-m', text: 'M', title: 'mute', onclick: () => set({ mute: !cur.state.mute }) });
    const solo = h('button', { class: 'mx-btn mx-s', text: 'S', title: 'solo — only soloed strips are heard', onclick: () => set({ solo: !cur.state.solo }) });
    const out = h('select', { class: 'uk-select mx-out', title: 'where this strip goes' }); out.addEventListener('change', () => set({ line: out.value || null }));
    const more = h('div', { class: 'mx-more' });
    const tog = h('button', { class: 'mx-btn mx-open', text: '▸', title: 'EQ and sends', onclick: () => setOpen(!comp.open) });
    // details: low cut, EQ, sends (built when opened / when aux lines change)
    const lc = UI.Knob({ label: 'Low cut', min: 10, max: 600, step: 1, unit: 'Hz', value: s.state.lowCut || 10, default: 10, size: 26, onChange: (v) => set({ lowCut: v }) });
    const lo = UI.Knob({ label: 'Low', min: -15, max: 15, step: 0.1, unit: 'dB', value: s.state.low, default: 0, size: 26, onChange: (v) => set({ low: v }) });
    const mid = UI.Knob({ label: 'Mid', min: -15, max: 15, step: 0.1, unit: 'dB', value: s.state.mid, default: 0, size: 26, onChange: (v) => set({ mid: v }) });
    const mf = UI.Knob({ label: 'Mid Hz', min: 200, max: 6000, step: 1, value: s.state.midFreq, default: 1000, size: 26, onChange: (v) => set({ midFreq: v }) });
    const hi = UI.Knob({ label: 'High', min: -15, max: 15, step: 0.1, unit: 'dB', value: s.state.high, default: 0, size: 26, onChange: (v) => set({ high: v }) });
    const sendsBox = h('div', { class: 'mx-sends' }); let sendKnobs = new Map(), sendSig = '';
    more.append(h('div', { class: 'mx-mini', text: 'EQ' }), h('div', { class: 'mx-knobs' }, [lc.el, lo.el, mid.el, mf.el, hi.el]), h('div', { class: 'mx-mini', text: 'Sends' }), sendsBox);
    el.append(h('div', { class: 'mx-cap' }), name, tog, more, pan.el, h('div', { class: 'mx-fm' }, [m, fader.el]), h('div', { class: 'mx-ms' }, [mute, solo]), out);
    let cur = s;
    const comp = { el, open: false, meter: m, key: k, inst: s.inst, port: s.port, setOpen, update };
    function setOpen(o) { comp.open = !!o; el.classList.toggle('open', comp.open); tog.textContent = comp.open ? '▾' : '▸'; }
    function update(n) {
      cur = n; const st = n.state;
      pan.set(st.pan); fader.set(st.db); lc.set(st.lowCut || 10); lo.set(st.low); mid.set(st.mid); mf.set(st.midFreq); hi.set(st.high);
      mute.classList.toggle('on', !!st.mute); solo.classList.toggle('on', !!st.solo); el.classList.toggle('muted', !!st.mute);
      // output choices: master + groups (a wired tool is shown as wired: its signal goes where the wire goes)
      const opts = [['', 'Master']].concat(groups().map(g => [g.id, '→ ' + g.name]));
      const sig = JSON.stringify(opts) + n.routed;
      if (out._sig !== sig) { out._sig = sig; out.innerHTML = ''; opts.forEach(([v, l]) => out.appendChild(h('option', { value: v, text: l }))); if (n.routed === 'wired') out.appendChild(h('option', { value: '__w', text: '→ wired' })); if (n.routed === 'song') out.appendChild(h('option', { value: '__s', text: '→ song bus' })); }
      out.value = n.routed === 'wired' ? '__w' : n.routed === 'song' ? '__s' : (st.line || ''); out.disabled = n.routed !== 'home';
      out.title = n.routed === 'wired' ? 'this tool is wired into another tool — its sound goes there (remove the wire to route it here)' : 'where this strip goes';
      // sends: one knob per AUX line
      const ax = auxes(), ssig = ax.map(a => a.id + a.name).join('|');
      if (ssig !== sendSig) {
        sendSig = ssig; sendsBox.innerHTML = ''; sendKnobs = new Map();
        if (!ax.length) sendsBox.appendChild(h('div', { class: 'uk-hint', text: 'no effect lines' }));
        ax.forEach(a => { const kn = UI.Knob({ label: a.name, min: 0, max: 1, step: 0.01, value: (st.sends || {})[a.id] || 0, default: 0, size: 26, onChange: (v) => set({ sends: { [a.id]: v } }) }); sendKnobs.set(a.id, kn); sendsBox.appendChild(kn.el); });
      }
      sendKnobs.forEach((kn, id) => kn.set((st.sends || {})[id] || 0));
    }
    update(s); return comp;
  }
  // ---- a line strip (GROUP / AUX; the built-in Reverb + Echo show their return only)
  function lineStrip(l) {
    const set = (patch) => view.emit('line_set', { id: l.id, patch });
    const el = h('div', { class: 'mx-strip mx-line ' + l.kind + (l.builtin ? ' builtin' : ''), style: { '--acc': l.kind === 'group' ? '#ffc35a' : '#c08bff' } });
    const kind = h('div', { class: 'mx-kind', text: l.kind === 'group' ? 'GROUP' : 'AUX · ' + (l.fx === 'plain' ? 'plain' : l.fx) });
    const name = h('div', { class: 'mx-name mx-rename', title: l.builtin ? 'the master reverb / echo (settings in Master FX)' : 'double-click to rename', text: l.name });
    if (!l.builtin) name.addEventListener('dblclick', () => UI.ask('Line name', l.name).then((n) => { if (n) set({ name: n.slice(0, 24) }); }));
    const m = meterEl(); let comp;
    if (l.builtin) {
      const ret = UI.Knob({ label: 'Return', min: 0, max: 1, step: 0.01, value: l.ret, default: l.id === 'reverb' ? 0.25 : 0.2, size: 34, onChange: (v) => set({ ret: v }) });
      el.append(h('div', { class: 'mx-cap' }), kind, name, ret.el, h('div', { class: 'uk-hint mx-note', text: 'shared with Master FX' }));
      comp = { el, meter: null, key: 'L:' + l.id, update(n) { ret.set(n.ret); } };
      return comp;
    }
    const fader = UI.Fader({ min: -60, max: 12, step: 0.1, value: l.db, default: 0, height: faderH, law: LAW, format: fmtDb, label: '', onChange: (v) => set({ db: v }) });
    const pan = UI.Knob({ label: 'Pan', min: -1, max: 1, step: 0.01, value: l.pan, default: 0, size: 30, onChange: (v) => set({ pan: v }) });
    const lo = UI.Knob({ label: 'Low', min: -15, max: 15, step: 0.1, unit: 'dB', value: l.low, default: 0, size: 26, onChange: (v) => set({ low: v }) });
    const hi = UI.Knob({ label: 'High', min: -15, max: 15, step: 0.1, unit: 'dB', value: l.high, default: 0, size: 26, onChange: (v) => set({ high: v }) });
    const fx = [];
    if (l.fx === 'reverb') fx.push(UI.Knob({ label: 'Size', min: 0.3, max: 8, step: 0.1, unit: 's', value: l.size, default: 2.2, size: 26, onChange: (v) => set({ size: v }) }), UI.Knob({ label: 'Decay', min: 0.5, max: 6, step: 0.1, value: l.decay, default: 2.5, size: 26, onChange: (v) => set({ decay: v }) }));
    if (l.fx === 'echo') fx.push(UI.Knob({ label: 'Time', min: 0.02, max: 2, step: 0.005, unit: 's', value: l.time, default: 0.375, size: 26, onChange: (v) => set({ time: v }) }), UI.Knob({ label: 'Feedback', min: 0, max: 0.92, step: 0.01, value: l.feedback, default: 0.35, size: 26, onChange: (v) => set({ feedback: v }) }));
    const mute = h('button', { class: 'mx-btn mx-m', text: 'M', title: 'mute this line', onclick: () => set({ mute: !cur.mute }) });
    const rm = h('button', { class: 'mx-btn mx-x', text: '×', title: 'remove this line — what went into it goes back to Master', onclick: () => { if (confirm('Remove the line “' + cur.name + '”?')) view.emit('line_remove', { id: l.id }); } });
    const more = h('div', { class: 'mx-more' }, [h('div', { class: 'mx-mini', text: l.fx && l.fx !== 'plain' ? l.fx : 'tone' }), h('div', { class: 'mx-knobs' }, fx.map(k => k.el).concat([lo.el, hi.el]))]);
    const tog = h('button', { class: 'mx-btn mx-open', text: '▸', title: 'tone and effect', onclick: () => comp.setOpen(!comp.open) });
    el.append(h('div', { class: 'mx-cap' }), kind, name, tog, more, pan.el, h('div', { class: 'mx-fm' }, [m, fader.el]), h('div', { class: 'mx-ms' }, [mute, rm]));
    let cur = l;
    comp = { el, open: false, meter: m, key: 'L:' + l.id, line: l.id,
      setOpen(o) { comp.open = !!o; el.classList.toggle('open', comp.open); tog.textContent = comp.open ? '▾' : '▸'; },
      update(n) { cur = n; name.textContent = n.name; fader.set(n.db); pan.set(n.pan); lo.set(n.low); hi.set(n.high); mute.classList.toggle('on', !!n.mute); el.classList.toggle('muted', !!n.mute);
        if (fx[0]) fx[0].set(l.fx === 'reverb' ? n.size : n.time); if (fx[1]) fx[1].set(l.fx === 'reverb' ? n.decay : n.feedback); } };
    return comp;
  }
  // master: meter (its volume, comp and limiter live in Master FX — one control for one thing)
  const mMeter = h('canvas', { class: 'mx-meter master', width: 22, height: 170 });
  masterEl.append(h('div', { class: 'mx-strip mx-mstrip' }, [h('div', { class: 'mx-cap' }), h('div', { class: 'mx-kind', text: 'MASTER' }), h('div', { class: 'mx-name', text: 'what you hear' }), mMeter, h('div', { class: 'uk-hint mx-note', text: 'volume · comp · limiter: Master FX' })]));

  function render(next) {
    snap = next || snap;
    const want = new Map(); snap.strips.forEach(s => want.set(s.inst + '/' + s.port, s)); snap.lines.forEach(l => want.set('L:' + l.id, l));
    comps.forEach((c, k) => { if (!want.has(k)) { c.el.remove(); comps.delete(k); dropTap(k); } });
    snap.strips.forEach(s => { const k = s.inst + '/' + s.port; let c = comps.get(k); if (!c) { c = toolStrip(s); comps.set(k, c); } else c.update(s); tools.appendChild(c.el); });
    snap.lines.forEach(l => { const k = 'L:' + l.id; let c = comps.get(k); if (!c) { c = lineStrip(l); comps.set(k, c); } else c.update(l); linesEl.appendChild(c.el); });
    if (!snap.strips.length) tools.appendChild(empty); else empty.remove();
  }
  view.on('state_sync', (s) => { if (s && s.strips) render({ strips: s.strips, lines: s.lines }); });
  view.on('mix', render);
  view.on('line_added', (p) => { const c = comps.get('L:' + p.id); if (c && c.setOpen) c.setOpen(true); });

  // ---- meters: one loop for every strip; analysers kept per strip and released with it
  const taps = new Map();
  function tapOf(c) {
    if (taps.has(c.key)) return taps.get(c.key);
    let an = null; try { an = c.line ? A.lines.tap(c.line, 256) : A.tap(c.inst, c.port, 256); } catch (e) {}
    taps.set(c.key, an); return an;
  }
  function dropTap(k) { const an = taps.get(k); if (an) { try { an.disconnect(); } catch (e) {} } taps.delete(k); }
  const buf = new Float32Array(256); let mAn = null, raf = 0;
  function level(an) { if (!an) return 0; an.getFloatTimeDomainData(buf); let s = 0, pk = 0; for (let i = 0; i < buf.length; i++) { const v = buf[i]; s += v * v; if (Math.abs(v) > pk) pk = Math.abs(v); } return { rms: Math.sqrt(s / buf.length), pk }; }
  function paint(cv, lv) {
    const g = cv.getContext('2d'), W = cv.width, H = cv.height; g.clearRect(0, 0, W, H); g.fillStyle = '#0b1119'; g.fillRect(0, 0, W, H);
    if (!lv) return; const toY = (a) => { const db = 20 * Math.log10(Math.max(1e-5, a)); return H * (1 - Math.max(0, (db + 60) / 66)); };
    const y = toY(lv.rms), gr = g.createLinearGradient(0, H, 0, 0); gr.addColorStop(0, '#00d48a'); gr.addColorStop(0.72, '#c8ff3d'); gr.addColorStop(0.9, '#ffb020'); gr.addColorStop(1, '#ff3355');
    g.fillStyle = gr; g.fillRect(1, y, W - 2, H - y); g.fillStyle = lv.pk >= 0.99 ? '#ff3355' : '#e8f4ff'; g.fillRect(1, toY(lv.pk), W - 2, 2);
  }
  function tick() {
    raf = requestAnimationFrame(tick);
    if (!view.state.meters || !root.isConnected) return;
    comps.forEach(c => { if (c.meter) paint(c.meter, level(tapOf(c))); });
    if (!mAn) { try { mAn = A.tapMaster(256); } catch (e) {} }
    paint(mMeter, level(mAn));
  }
  raf = requestAnimationFrame(tick);
  view.onDispose(() => { cancelAnimationFrame(raf); Array.from(taps.keys()).forEach(dropTap); if (mAn) { try { mAn.disconnect(); } catch (e) {} } });
  view.emit('request_state', {});
});

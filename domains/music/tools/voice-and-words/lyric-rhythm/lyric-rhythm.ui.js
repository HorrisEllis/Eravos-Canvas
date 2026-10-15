/* eravos.lyric-rhythm UI — write the words; watch them land on the beat. Click a syllable to change its weight
 * (weak → strong → accent), drag it left/right to nudge it. view.* only. */
OrganismFactory.reg('eravos.lyric-rhythm', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  let plan = { steps: 16, notes: [] }, pos = -1, lit = new Map();
  const ta = h('textarea', { class: 'lyr-text', rows: 4, spellcheck: 'false', placeholder: 'Type the words — one line per phrase.' });
  ta.value = view.state.text || ''; let tmr = 0;
  ta.addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(() => view.set('text', ta.value), 250); });
  ['pointerdown', 'keydown', 'wheel'].forEach(t => ta.addEventListener(t, e => e.stopPropagation()));
  view.bind('text', (v) => { if (document.activeElement !== ta && ta.value !== v) ta.value = v || ''; });
  const grid = h('div', { class: 'lyr-grid' }), status = h('div', { class: 'lyr-status' });
  const tgt = h('span', { class: 'lyr-tgt' });
  function paint() {
    grid.innerHTML = ''; const bars = Math.max(1, Math.ceil(plan.steps / 16));
    for (let b = 0; b < bars; b++) {
      const row = h('div', { class: 'lyr-bar' }, [h('span', { class: 'lyr-barno', text: b + 1 })]);
      const lane = h('div', { class: 'lyr-lane' }); for (let q = 0; q < 4; q++) lane.appendChild(h('i', { class: 'lyr-beat', style: { left: (q * 25) + '%' } }));
      lane.appendChild(h('i', { class: 'lyr-head', style: { display: 'none' } }));
      plan.notes.forEach((n, i) => {
        if (Math.floor(n.s / 16) !== b) return;
        const chip = h('button', { class: 'lyr-syl s' + n.stress + (n.last ? ' end' : ''), title: n.word + ' — click: weight · drag: nudge', style: { left: ((n.s % 16) / 16 * 100) + '%', width: `calc(${Math.min(n.l, 16 - n.s % 16) / 16 * 100}% - 2px)` }, text: n.text });
        chip.dataset.i = i; let x0 = null, moved = 0;
        chip.addEventListener('pointerdown', (e) => { e.stopPropagation(); x0 = e.clientX; moved = 0; try { chip.setPointerCapture(e.pointerId); } catch (er) {} });
        chip.addEventListener('pointermove', (e) => { if (x0 === null) return; const stepPx = lane.getBoundingClientRect().width / 16, d = Math.round((e.clientX - x0) / stepPx); if (d !== moved) { chip.style.transform = `translateX(${d * stepPx}px)`; moved = d; } });
        const up = () => { if (x0 === null) return; x0 = null; if (moved) view.emit('syl_edit', { key: n.key, nudge: moved }); else view.emit('syl_edit', { key: n.key, stress: (n.stress + 1) % 3 }); };
        chip.addEventListener('pointerup', up); chip.addEventListener('pointercancel', () => { x0 = null; chip.style.transform = ''; }); chip.addEventListener('lostpointercapture', () => { x0 = null; chip.style.transform = ''; });
        lane.appendChild(chip);
      });
      row.appendChild(lane); grid.appendChild(row);
    }
    const n = plan.notes.length, strong = plan.notes.filter(x => x.stress).length;
    status.textContent = n ? `${n} syllables · ${strong} strong · ${Math.ceil(plan.steps / 16)} bars` : 'Type some words above.';
  }
  view.on('state_sync', (s) => { if (s.plan) { plan = s.plan; paint(); } tgt.textContent = s.target ? '→ ' + view.label(s.target) : '→ add a Drum Machine or synth to hear it'; });
  view.on('pos', (p) => { const b = Math.floor(p.step / 16); grid.querySelectorAll('.lyr-head').forEach((el, i) => { el.style.display = i === b ? 'block' : 'none'; if (i === b) el.style.left = ((p.step % 16) / 16 * 100) + '%'; }); });
  view.on('syl', (p) => { const c = grid.querySelector(`.lyr-syl[data-i="${p.i}"]`); if (c) { c.classList.remove('hit'); void c.offsetWidth; c.classList.add('hit'); } });
  view.on('status', (s) => { status.textContent = s.warn || s.info || ''; status.classList.toggle('warn', !!s.warn); });
  const seg = (k) => UI.paramControl(view, cfg(k), { segMax: 6 }).el;
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view), h('div', { class: 'org-row', style: { margin: 0 } }, [
      UI.Button({ label: '▶ Hear it', hint: 'play it once now', onClick: () => view.emit('preview', {}) }).el,
      UI.Button({ label: '⇢ Timeline', kind: 'primary', hint: 'put it on the Timeline as a clip you can edit', onClick: () => view.emit('send_timeline', {}) }).el,
      UI.Button({ label: '⇢ Sequencer', kind: 'primary', hint: 'your words as Sequencer lanes (4 bars per slot, chained) + a her-voice lane on every line start — then automate it', onClick: () => view.emit('send_sequencer', {}) }).el,
      UI.Button({ label: '↺', hint: 'undo your weight/nudge edits', onClick: () => view.emit('reset_edits', {}) }).el])]),
    ta, h('div', { class: 'org-row lyr-ctl' }, [seg('flow')]),
    h('div', { class: 'org-row lyr-ctl' }, [UI.Button({ label: '♫ Make a song', kind: 'primary', hint: 'grow this rhythm into a whole song, written below on the Timeline', onClick: () => view.emit('expand_song', {}) }).el, UI.paramControl(view, cfg('songGenre'), { segMax: 4 }).el]), h('div', { class: 'org-row lyr-ctl' }, [seg('mode'), tgt]),
    grid, status,
    UI.paramPanel(view, ['bars', 'vary', 'octave', 'range', 'gate', 'level'], { flat: true, noTitles: true, size: 30 }),
    UI.hint('Words become rhythm: strong syllables land on the beat. Click a syllable to make it weak / strong / ACCENT, drag to move it. Wire ⇢ to any instrument, or it plays the first Drum Machine (drums) or synth (melody). Space plays it with the song.'));
  UI.alive(view, { events: ['syl'], port: null });
});

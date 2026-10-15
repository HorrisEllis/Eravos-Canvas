/* eravos.coding.code-cell UI — run bar · editor (Tab indents, Ctrl/⌘+Enter runs) · what came in · the log */
OrganismFactory.reg('eravos.coding.code-cell', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const runB = UI.Button({ label: '▶ Run', kind: 'primary', hint: 'run the code now (Ctrl+Enter)', onClick: () => { flush(); view.emit('run', {}); } });
  const stopB = UI.Button({ label: '■ Stop', hint: 'stop a running cell', onClick: () => view.emit('stop', {}) });
  const status = h('span', { class: 'cc-status', 'aria-live': 'polite', text: 'ready' });
  const ed = h('textarea', { class: 'cc-editor', spellcheck: 'false', 'aria-label': 'Code — the body of an async function: use input, return a result', autocomplete: 'off' });
  let dirty = false, tmr = null;
  const flush = () => { if (!dirty) return; dirty = false; view.emit('code_edit', { code: ed.value }); };
  ed.addEventListener('input', () => { dirty = true; clearTimeout(tmr); tmr = setTimeout(flush, 400); });
  ed.addEventListener('blur', flush);
  ed.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); const a = ed.selectionStart, z = ed.selectionEnd; ed.setRangeText('  ', a, z, 'end'); dirty = true; }
    else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); flush(); view.emit('run', {}); }
  });
  ed.addEventListener('pointerdown', (e) => e.stopPropagation());
  const inBox = h('div', { class: 'cc-in', text: 'nothing has arrived yet — wire a value into “in”, or just press Run' });
  const log = h('div', { class: 'cc-log', role: 'log', 'aria-label': 'Console log' });
  const clr = UI.Button({ label: 'Clear', hint: 'clear the log', onClick: () => view.emit('clear_log', {}) });
  const line = (x) => h('div', { class: 'cc-line ' + (x.level || 'log'), text: x.text });
  view.on('log', (x) => { log.appendChild(line(x)); while (log.children.length > 300) log.firstChild.remove(); log.scrollTop = log.scrollHeight; });
  view.on('input', (x) => { inBox.textContent = 'in: ' + x.preview; });
  view.on('status', (s) => {
    status.className = 'cc-status ' + s.status;
    status.textContent = s.status === 'running' ? 'running…' : s.status === 'ok' ? `done in ${s.ms} ms` : s.status === 'timeout' ? 'stopped — time limit' : s.status === 'stopped' ? 'stopped' : 'error' + (s.line ? ' on line ' + s.line : '');
  });
  view.on('state_sync', (s) => {
    if (typeof s.code === 'string' && !dirty && document.activeElement !== ed && ed.value !== s.code) ed.value = s.code;
    if (s.input) inBox.textContent = 'in: ' + s.input;
    if (Array.isArray(s.logs)) { log.innerHTML = ''; s.logs.forEach(x => log.appendChild(line(x))); log.scrollTop = log.scrollHeight; }
  });
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' } }, [UI.presetBar(view), h('div', { class: 'org-row', style: { gap: '6px' } }, [runB.el, stopB.el, status])]),
    ed, inBox,
    h('div', { class: 'org-row', style: { gap: '8px', flexWrap: 'wrap', alignItems: 'center' } }, [UI.paramControl(view, cfg('auto')).el, UI.paramControl(view, cfg('every'), { size: 28 }).el, UI.paramControl(view, cfg('timeout'), { size: 28 }).el, UI.paramControl(view, cfg('network')).el, clr.el]),
    log,
    UI.hint('Your code is the body of an async function: `input` is what arrived, `return` sends it on (objects → out, text → text and out). It runs on its own thread with no access to the page; network is off unless you turn it on.'),
  );
});

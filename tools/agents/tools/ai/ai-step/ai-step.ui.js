/* eravos.agents.ai-step UI — provider · model · key (kept on this computer) · prompt template · answer · call log */
OrganismFactory.reg('eravos.agents.ai-step', function (view) {
  const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k), pc = (k, o) => UI.paramControl(view, cfg(k), o || { size: 28 }).el;
  const runB = UI.Button({ label: '▶ Run', kind: 'primary', hint: 'ask now', onClick: () => { flush(); view.emit('run', {}); } });
  const cancelB = UI.Button({ label: '■ Cancel', hint: 'stop waiting for the answer', onClick: () => view.emit('cancel', {}) });
  const status = h('span', { class: 'ai-status', 'aria-live': 'polite', text: 'ready' });
  const keyIn = h('input', { class: 'uk-text ai-key', type: 'password', autocomplete: 'off', placeholder: 'paste your key', 'aria-label': 'API key — kept on this computer only' });
  const keySave = UI.Button({ label: 'Save key', hint: 'kept in this browser on this computer — never in projects or exports', onClick: () => { if (keyIn.value.trim()) { view.emit('key_set', { key: keyIn.value.trim() }); keyIn.value = ''; } } });
  const keyClear = UI.Button({ label: 'Forget key', onClick: () => view.emit('key_clear', {}) });
  const keyState = h('span', { class: 'ai-keystate' });
  keyIn.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') keySave.el.click(); });
  const endpointBox = h('div', { class: 'org-row' }, [pc('endpoint')]);
  const ed = h('textarea', { class: 'ai-prompt', spellcheck: 'true', 'aria-label': 'Prompt template — {{input}} is replaced by what arrives' });
  const sys = h('textarea', { class: 'ai-system', spellcheck: 'true', placeholder: 'optional system instructions', 'aria-label': 'System instructions' });
  let dirty = false, tmr = null;
  const flush = () => { if (!dirty) return; dirty = false; view.emit('prompt_edit', { prompt: ed.value, system: sys.value }); };
  [ed, sys].forEach(t => { t.addEventListener('input', () => { dirty = true; clearTimeout(tmr); tmr = setTimeout(flush, 400); }); t.addEventListener('blur', flush); t.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); flush(); view.emit('run', {}); } }); t.addEventListener('pointerdown', (e) => e.stopPropagation()); });
  const inBox = h('div', { class: 'ai-in', text: '{{input}} is empty — wire something in, or write the whole prompt yourself' });
  const ans = h('div', { class: 'ai-answer', role: 'region', 'aria-label': 'Answer', text: '' });
  const log = h('div', { class: 'ai-log', role: 'log', 'aria-label': 'Call log' });
  const traceTxt = h('pre', { class: 'ai-in', style: { whiteSpace: 'pre-wrap', maxHeight: '160px', overflow: 'auto', margin: '4px 0 0' } });
  const traceSum = h('summary', { text: 'Session trace is off — nothing about your session is sent' }), traceBox = h('details', { class: 'ai-sysbox' }, [traceSum, traceTxt]);
  const row = (x) => h('div', { class: 'ai-row ' + x.status, text: x.status === 'ok' ? `✓ ${x.model || ''} · ${x.ms} ms · ${x.tokensIn}→${x.tokensOut} tokens` : x.status === 'retry' ? `↻ retry ${x.attempt}: ${x.message}` : x.status === 'repair' ? `⟲ asked again: ${x.message}` : `✗ ${x.message}` });
  view.on('log', (x) => { log.prepend(row(x)); while (log.children.length > 60) log.lastChild.remove(); });
  view.on('input', (x) => { inBox.textContent = 'input: ' + x.preview; });
  view.on('status', (s) => { status.className = 'ai-status ' + s.status; status.textContent = s.status === 'running' ? 'asking…' : s.status === 'ok' ? `answered in ${s.ms} ms` : s.message || 'error'; });
  view.on('state_sync', (s) => {
    if (typeof s.prompt === 'string' && !dirty && document.activeElement !== ed && ed.value !== s.prompt) ed.value = s.prompt;
    if (typeof s.system === 'string' && !dirty && document.activeElement !== sys && sys.value !== s.system) sys.value = s.system;
    const prov = s.params && s.params.provider; keyState.textContent = prov === 'echo' ? 'no key needed (dry run)' : s.hasKey ? '● key saved on this computer' : '○ no key yet'; keyState.className = 'ai-keystate' + (s.hasKey || prov === 'echo' ? ' ok' : '');
    endpointBox.style.display = prov === 'openai-compatible' ? '' : 'none';
    if (s.answer) ans.textContent = s.answer.json !== undefined ? JSON.stringify(s.answer.json, null, 2) : s.answer.text;
    if (s.input) inBox.textContent = 'input: ' + s.input;
    const tm = s.params && s.params.trace; traceTxt.textContent = s.trace || '';
    traceSum.textContent = !tm || tm === 'off' ? 'Session trace is off — nothing about your session is sent' : `Session trace ${tm === 'append' ? 'is added to every prompt' : 'fills {{session}}'} — what the model will see (${(s.trace || '').split('\n').length} lines)`;
    if (Array.isArray(s.log)) { log.innerHTML = ''; s.log.slice().reverse().forEach(x => log.appendChild(row(x))); }
  });
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' } }, [UI.presetBar(view), h('div', { class: 'org-row', style: { gap: '6px' } }, [runB.el, cancelB.el, status])]),
    h('div', { class: 'org-row', style: { gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' } }, [pc('provider'), pc('model'), pc('output'), pc('requiredKeys')]),
    endpointBox,
    h('div', { class: 'org-row ai-keyrow', style: { gap: '6px', alignItems: 'center', flexWrap: 'wrap' } }, [keyIn, keySave.el, keyClear.el, keyState]),
    h('label', { class: 'ai-lbl', text: 'Prompt  ({{input}} · {{input.field}} · {{date}} · {{session}})' }), ed,
    h('details', { class: 'ai-sysbox' }, [h('summary', { text: 'System instructions' }), sys]),
    inBox,
    h('div', { class: 'org-row', style: { gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' } }, [pc('trace'), pc('traceSize')]), traceBox,
    h('div', { class: 'org-row', style: { gap: '8px', flexWrap: 'wrap', alignItems: 'center' } }, [pc('auto'), pc('temperature'), pc('maxTokens'), pc('timeout'), pc('retries')]),
    h('label', { class: 'ai-lbl', text: 'Answer' }), ans, log,
    UI.hint('Keys stay in this browser on this computer — never in projects, presets, backups or exports. Echo is a free dry run: it returns the filled prompt. Session trace is off until you turn it on: then tool names, wires and problems from this session go with the prompt — never settings, file contents or keys.'),
  );
});

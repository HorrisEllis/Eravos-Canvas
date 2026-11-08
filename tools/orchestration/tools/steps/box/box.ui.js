/* eravos.orchestration.box UI — the step: its kind (coloured by its place in the kinds it was given), what it names, its state, its gate, the
 * last value through it. Only view.* : state in. No kind, system or address is named here. */
OrganismFactory.reg('eravos.orchestration.box', function (view) {
  const UI = view.ui, h = UI.h;
  const hue = (kind, kinds) => { const i = (kinds || []).indexOf(kind); if (i >= 0) return Math.round(i * 360 / kinds.length + 30) % 360;
    let n = 0; for (const c of String(kind)) n = (n * 31 + c.charCodeAt(0)) % 360; return n; };
  const chip = h('span', { class: 'box-kind' }), st = h('span', { class: 'box-state' }), ref = h('div', { class: 'box-ref' }), meta = h('div', { class: 'box-meta' });
  const gate = h('div', { class: 'box-gate' }), last = h('div', { class: 'box-last' });
  view.on('state_sync', (s) => {
    const p = s.params || {}, b = s.box || {}, c = `hsl(${hue(p.kind, s.kinds)} 78% 64%)`;
    chip.textContent = p.kind || 'step'; chip.style.color = c; chip.style.borderColor = c;
    st.textContent = p.state || ''; st.dataset.state = p.state || '';
    ref.textContent = p.ref || '—'; meta.textContent = [p.step, b.contract && (b.contract.requires || []).length ? 'after ' + b.contract.requires.join(', ') : ''].filter(Boolean).join(' · ');
    const g = b.gate; gate.textContent = g ? 'gate · ' + (typeof g === 'object' ? Object.keys(g).join(', ') : String(g)) : ''; gate.style.display = g ? '' : 'none';
    last.textContent = s.last == null ? '' : 'last · ' + (typeof s.last === 'string' ? s.last : JSON.stringify(s.last)).slice(0, 120); last.style.display = s.last == null ? 'none' : '';
  });
  view.root.append(h('div', { class: 'org-row', style: { justifyContent: 'space-between', alignItems: 'center' } }, [chip, st]), ref, meta, gate, last);
});

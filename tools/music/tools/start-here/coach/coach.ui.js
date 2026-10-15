/* eravos.coach UI — card with the current step, progress dots, show me / do it, next / back */
OrganismFactory.reg('eravos.coach', function (view) {
  const UI = view.ui, h = UI.h;
  const title = h('div', { style: { font: '700 16px var(--font)', marginBottom: '2px' } });
  const intro = h('div', { class: 'uk-hint' });
  const dots = h('div', { style: { display: 'flex', gap: '5px', margin: '10px 0' } });
  const text = h('div', { style: { fontSize: '14px', lineHeight: '1.5', minHeight: '84px', padding: '10px 12px', background: '#0b1119', border: '1px solid #223044', borderRadius: '8px' } });
  const sel = UI.Select({ options: [], onChange: (v) => view.set('lesson', v) });
  const showB = UI.Button({ label: '👀 show me', onClick: () => view.emit('show_me', {}) });
  const doB = UI.Button({ label: '✨ do it', kind: 'primary', onClick: () => view.emit('do_it', {}) });
  const back = UI.Button({ label: '◀ back', onClick: () => view.emit('back', {}) });
  const next = UI.Button({ label: 'next ▶', onClick: () => view.emit('next', {}) });
  const cheer = h('div', { class: 'org-note', style: { color: '#00ff88', minHeight: '18px' } });
  view.on('step_done', () => { cheer.textContent = '✔ nice — that worked.'; setTimeout(() => { cheer.textContent = ''; }, 2500); });
  view.on('lesson_done', () => { cheer.textContent = '🎉 Lesson complete!'; });
  view.on('state_sync', (s) => {
    if (!s.lesson) return;
    sel.setOptions(s.lessons); sel.set(s.lesson.id);
    const i = s.params.step, st = s.lesson.steps[i] || s.lesson.steps[s.lesson.steps.length - 1];
    title.textContent = s.lesson.icon + ' ' + s.lesson.title; intro.textContent = s.lesson.intro || '';
    dots.innerHTML = ''; s.lesson.steps.forEach((_, k) => dots.appendChild(h('div', { title: 'step ' + (k + 1), style: { width: '22px', height: '6px', borderRadius: '3px', background: s.done.includes(k) ? '#00ff88' : k === i ? '#fff' : '#223044' } })));
    text.textContent = `${i + 1}. ${st.text}`;
    doB.el.style.display = st.spawn || st.recipe ? '' : 'none';
    showB.el.style.display = st.show || st.spawn ? '' : 'none';
    next.set(st.manual ? 'done — next ▶' : 'skip ▶');
  });
  view.root.append(h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [title, sel.el]), intro, dots, text, cheer, h('div', { class: 'org-row' }, [back.el, showB.el, doB.el, next.el]));
  view.emit('request_state', {});
});

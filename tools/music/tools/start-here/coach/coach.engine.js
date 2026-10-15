/* eravos.coach 1.0.0 — lessons that happen ON the canvas (P8.5)
 * Observes declared bus topics and completes a step only when the real event happens.
 * Never mutates organisms; it may ask the runtime to spawn (recipe:run). Lessons are data (data/lessons.js). */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const LESSONS = () => (window.ERAVOS_DATA && window.ERAVOS_DATA.lessons) || [];
  const OBSERVE = ['kernel:organism-mounted', 'kernel:wire-registered', 'note:trigger', 'transport:play', 'ui:config_change:*', 'asset:ready', 'edm:drop-fired', 'transport:bounce', 'master:loudness', 'ui:starter_load:*', 'ui:track_edit:*', 'ui:load:*', 'ui:record:*'];
  function get(obj, path) { return String(path).split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj); }
  OrganismFactory.define({
    id: 'eravos.coach', domain: 'music', version: '1.0.0', label: 'Coach', icon: '🧭', accent: '#ffffff', phase: 'P8.5',
    category: 'Start here', blurb: 'Step-by-step lessons on the canvas: first beat, bassline, chop her voice, build the drop, export.',
    size: { w: 400, h: 330 }, minSize: { w: 320, h: 240 },
    permissions: ['bus_publish', 'bus_subscribe', 'registry_read'], requires: [],
    provides: ['capability.coach'],
    hooks: [
      Object.assign(S.event('coach.hook.observe_in', 'in', OBSERVE.join('|'), { type: 'object' }, '1.0.0'), { rail: false }),
      Object.assign(S.event('coach.hook.spawn_out', 'out', 'recipe:run|canvas:focus-request', { type: 'object' }, '1.0.0'), { rail: false }),
    ],
    config: [
      { key: 'lesson', type: 'enum', options: LESSONS().map(l => l.id), default: (LESSONS()[0] || {}).id || 'song-for-her', label: 'Lesson', group: 'COACH' },
      { key: 'step', type: 'integer', default: 0, min: 0, max: 50, label: 'Step', group: 'COACH', hidden: true },
      { key: 'showHints', type: 'boolean', default: true, label: 'Hints', group: 'COACH' },
    ],
    ui_hooks: ['next', 'back', 'show_me', 'do_it', 'restart'],
    engine(ctx) {
      const P = ctx.params, K = ctx.K;
      const lesson = () => LESSONS().find(l => l.id === P.get('lesson')) || LESSONS()[0];
      const step = () => { const l = lesson(); return l ? l.steps[P.get('step')] : null; };
      const done = new Set();
      function matchVal(v, want) {
        if (want && typeof want === 'object' && !Array.isArray(want)) {
          if ('$organism' in want) { const r = K.registry.get(v); return !!(r && r.organism_id === want.$organism); }
          if ('$in' in want) return want.$in.includes(v);
          if ('$exists' in want) return (v !== undefined) === !!want.$exists;
          if ('$gt' in want) return typeof v === 'number' && v > want.$gt;
        }
        return v === want;
      }
      function matches(pred, payload, topic) {
        const t = pred.topic;
        if (t.endsWith('*') ? !topic.startsWith(t.slice(0, -1)) : topic !== t) return false;
        if (pred.topicOrganism) { const inst = topic.slice(t.length - 1); const r = K.registry.get(inst); if (!r || r.organism_id !== pred.topicOrganism) return false; }
        return Object.keys(pred.where || {}).every(k => matchVal(get(payload || {}, k), pred.where[k]));
      }
      ctx.matches = matches;
      function evaluate(payload, topic) {
        const st = step(); if (!st || st.manual || !st.done_when) return;
        const preds = Array.isArray(st.done_when) ? st.done_when : [st.done_when];
        if (preds.some(p => matches(p, payload, topic))) complete();
      }
      function complete() {
        const l = lesson(); done.add(P.get('step'));
        ctx.emitUI('step_done', { step: P.get('step') });
        if (P.get('step') < l.steps.length - 1) P.set('step', P.get('step') + 1); else ctx.emitUI('lesson_done', { lesson: l.id });
        ctx.syncUI();
      }
      ctx.complete = complete;
      OBSERVE.forEach(t => ctx.on(t, null, (p, topic) => evaluate(p, topic)));
      // a step whose condition is already true when it becomes current (e.g. organism already mounted)
      function precheck() {
        const st = step(); if (!st || !st.done_when) return;
        const preds = Array.isArray(st.done_when) ? st.done_when : [st.done_when];
        preds.forEach(p => { if (p.topic === 'kernel:organism-mounted' && p.where && p.where.organismId && K.registry.byOrganism(p.where.organismId).length) setTimeout(complete, 400); });
      }
      P.onChange('step', precheck); P.onChange('lesson', () => { done.clear(); P.set('step', 0); precheck(); ctx.syncUI(); });
      ctx.onUI('next', null, () => complete());
      ctx.onUI('back', null, () => { if (P.get('step') > 0) P.set('step', P.get('step') - 1); ctx.syncUI(); });
      ctx.onUI('restart', null, () => { done.clear(); P.set('step', 0); ctx.syncUI(); });
      ctx.onUI('do_it', null, () => { const st = step(); if (st && st.spawn) ctx.emit('recipe:run', { organism: st.spawn }); if (st && st.recipe) ctx.emit('recipe:run', { recipe_id: st.recipe }); });
      ctx.onUI('show_me', null, () => { const st = step(); const id = st && (st.show || st.spawn); const r = id && K.registry.byOrganism(id)[0]; if (r) ctx.emit('canvas:focus-request', { instanceId: r.instance_id }); });
      ctx.stateExtra = () => { const l = lesson(); return { lesson: l, lessons: LESSONS().map(x => ({ value: x.id, label: x.icon + ' ' + x.title })), done: Array.from(done) }; };
      ctx.saveExtra = () => ({ done: Array.from(done) });
      ctx.loadExtra = (x) => { if (x && x.done) x.done.forEach(d => done.add(d)); };
      setTimeout(precheck, 500);
      return {};
    },
  });
})();

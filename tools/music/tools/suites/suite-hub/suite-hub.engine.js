/* eravos.suite 1.0.0 — the SUITE WINDOW: the primary system its parts connect to (spec eravos.suites ADDENDUM 2026-10-21,
 * map eravos.phase48-map P48.5b, decision D-48.5). James, 2026-10-21: "like how there is 4 wub tools, but no primay system.
 * like i want each tool to have its components as tools, then they all connect to the suite, but can be mixed and matched."
 * One window per suite (config `suite` = a suite id from tools/<d>/suites/<id>/suite.json, read through window.Suites).
 * Sound: every part's last sound comes in → level → out (Master unless wired on). It makes no sound of its own. Who belongs is
 * read from the wires (canvas/runtime/suites.js), never stored here. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  OrganismFactory.define({
    id: 'eravos.suite-hub', domain: 'music', version: '1.0.0', label: 'Suite', icon: '🧰', accent: '#ff2266',
    category: 'Suites', blurb: 'A suite’s own window: every part is still its own tool, and they all end here. Build the whole system, add parts one by one, load a scene, mix in parts from other suites.',
    size: { w: 460, h: 560 }, minSize: { w: 340, h: 300 },
    permissions: ['audio_in', 'audio_out', 'bus_publish', 'bus_subscribe', 'registry_read'],
    provides: ['capability.audio_out', 'capability.audio_in', 'capability.suite', 'capability.note_in'],
    hooks: [
      Object.assign(S.audio_in('suite.hook.audio_in', 'in'), { intent: 'every part’s last sound — the system ends here' }),
      S.audio_out('suite.hook.audio_out'),
      S.mod_in('suite.hook.mod_level', 'level'),
      // 3.122 "some tools can't be added to the timeline. Like the suites": the suite takes notes too — it plays its parts that play
      // notes (the voices), not those the suite marks notes: false (drums from a groove, a bassline, chords)
      S.note_in('suite.hook.note_in'), S.note_out('suite.hook.note_out'),
    ],
    config: [
      { key: 'suite', type: 'string', default: '', label: 'Suite', group: 'SUITE', hidden: true },
      { key: 'scene', type: 'string', default: '', label: 'Scene', group: 'SUITE', hidden: true },
      // the parts this window opened (instance ids) — members even before a wire reaches them (canvas/runtime/suites.js)
      { key: 'opened', type: 'array', default: [], label: 'Opened parts', group: 'SUITE', hidden: true },
      { key: 'level', type: 'number', default: 1, min: 0, max: 1.5, step: 0.01, label: 'System level', group: 'OUT' },
      // P48.8 the suite's macros (suite.json macros[0…3]); each one turns several parts' knobs at once — named by the suite
      { key: 'm1', type: 'number', default: 0.5, min: 0, max: 1, step: 0.001, label: 'Macro 1', group: 'MACRO', hidden: true },
      { key: 'm2', type: 'number', default: 0.5, min: 0, max: 1, step: 0.001, label: 'Macro 2', group: 'MACRO', hidden: true },
      { key: 'm3', type: 'number', default: 0.5, min: 0, max: 1, step: 0.001, label: 'Macro 3', group: 'MACRO', hidden: true },
      { key: 'm4', type: 'number', default: 0.5, min: 0, max: 1, step: 0.001, label: 'Macro 4', group: 'MACRO', hidden: true },
    ],
    ui_hooks: [],
    presets: {},
    // no sound of its own, so nothing to preset: no Odd Couples pack, no part in a song (tests/p43-odd-couples.test.js skips it, saying so)
    noPacks: true,
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params;
      const inp = ac.createGain(), level = ac.createGain(); level.gain.value = P.get('level');
      inp.connect(level); ctx.track(level);
      ctx.port('in', { kind: 'audio', direction: 'in', node: inp, label: 'the system' });
      ctx.port('out', { kind: 'audio', direction: 'out', node: level, label: 'suite' });
      const lv = ctx.modBus ? ctx.modBus('level', 1) : null; if (lv) lv.connect(level.gain);
      P.onChange('level', () => level.gain.setTargetAtTime(P.get('level'), ac.currentTime, 0.02));
      // the voices: members whose part does not say notes: false and that take notes themselves
      const voices = () => { const SU = window.Suites; if (!SU || !SU.members) return [];
        const def = SU.get && SU.get(P.get('suite')), skip = new Set(((def && def.parts) || []).filter(x => x.notes === false || x.as === 'mod').map(x => x.tool));
        return Array.from(SU.members(ctx.K, ctx.id).entries()).filter(([id, tool]) => id !== ctx.id && !skip.has(tool) && ctx.K.registry.has(id)
          && Array.from((ctx.K.registry.get(id).hooks || new Map()).values()).some(hk => hk.direction === 'in' && hk.event_type === 'note:trigger')).map(([id]) => id); };
      ctx.onNote((p) => voices().forEach(target => ctx.emit('note:trigger', Object.assign({}, p, { target }))));
      return { unmount() { try { inp.disconnect(); level.disconnect(); } catch (e) {} } };
    },
  });
})();

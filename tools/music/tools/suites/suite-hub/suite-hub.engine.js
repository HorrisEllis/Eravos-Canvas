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
    provides: ['capability.audio_out', 'capability.audio_in', 'capability.suite'],
    hooks: [
      Object.assign(S.audio_in('suite.hook.audio_in', 'in'), { intent: 'every part’s last sound — the system ends here' }),
      S.audio_out('suite.hook.audio_out'),
      S.mod_in('suite.hook.mod_level', 'level'),
    ],
    config: [
      { key: 'suite', type: 'string', default: '', label: 'Suite', group: 'SUITE', hidden: true },
      { key: 'scene', type: 'string', default: '', label: 'Scene', group: 'SUITE', hidden: true },
      { key: 'level', type: 'number', default: 1, min: 0, max: 1.5, step: 0.01, label: 'System level', group: 'OUT' },
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
      return { unmount() { try { inp.disconnect(); level.disconnect(); } catch (e) {} } };
    },
  });
})();

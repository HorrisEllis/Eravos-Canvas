/* eravos.agents.box 0.1.0 — Box · spec box.spec (domain agents · AI Automation)
 * One step of a pipeline as a tool. Data, never a fixed list: its kind, ref and step are words it was given; the whole step rides in extra
 * `box`; a kind's colour is its place in the kinds list it was given. What arrives on in goes out as { step, kind, ref, value }.
 * No network, no system named: a pipeline arrives as an ordinary .erv; running it is its owner's.
 * James, 2026-11-08: "eravos is the build surface for nexus. that way if something needs to be built, we can make a tool for eravos." */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  OrganismFactory.define({
    id: 'eravos.agents.box', domain: 'agents', version: '0.1.0', label: 'Box', icon: '◆', accent: '#00d4ff',
    category: 'Steps', blurb: 'One step of a pipeline: its kind, what it names, its gate — wired to the steps before and after it.',
    size: { w: 260, h: 190 }, minSize: { w: 200, h: 140 },
    permissions: ['bus_publish', 'bus_subscribe'],
    provides: ['capability.step'],
    hooks: [
      S.data_in('box.hook.in', 'in', ['*'], 'what this step receives'),
      S.data_out('box.hook.out', 'out', 'json', 'what this step passes on: { step, kind, ref, value }'),
    ],
    config: [
      { key: 'kind', type: 'string', default: '', label: 'Kind', group: 'STEP', hidden: true },   // data, never shown (his, 2026-11-08)
      { key: 'ref', type: 'string', default: '', label: 'Names', group: 'STEP' },
      { key: 'step', type: 'string', default: '', label: 'Step', group: 'STEP' },
      { key: 'state', type: 'string', default: '', label: 'State', group: 'STEP' },
    ],
    ui_hooks: ['step_set'],
    presets: {},
    engine(ctx) {
      const P = ctx.params;
      let box = null, kinds = [], last = null;
      const out = ctx.dataOut('out', { type: 'json', label: 'step' });
      ctx.dataIn('in', { accepts: ['*'], label: 'in' }, (value) => {
        last = value;
        out({ step: P.get('step'), kind: P.get('kind'), ref: P.get('ref'), value });
        ctx.syncUI();
      });
      // the Workshop's edits (his: "maybe it edits steps, like it does a note, or pattern"): the step's words and its whole box, at once
      ctx.onUI('step_set', null, (x) => { if (!x) return; if (x.params) P.setMany(x.params); if (x.box && typeof x.box === 'object') box = x.box; ctx.syncUI(); });
      ctx.stateExtra = () => ({ box, kinds, last });
      ctx.saveExtra = () => ({ box, kinds, last });
      ctx.loadExtra = (x) => { if (!x) return; box = x.box === undefined ? null : x.box; kinds = Array.isArray(x.kinds) ? x.kinds : []; last = x.last === undefined ? null : x.last; };
      return { unmount() {} };
    },
  });
})();

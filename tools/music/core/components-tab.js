/* 3.126 the Components tab on every music tool's page (his words, 2026-11-06: "Themes and ui, components are any parts that other tools
 * can use" · "Each tool with each component/ui/packs/mod/suite/etc all with a clear line of seperation all added to the tool page").
 * What the tool is made of, read from data/components-map.js (build/components-map.mjs, from the code and the specs):
 *   in it now — shared components its code uses today (the same code in every tool that holds it)
 *   comes out of it — parts of it that become components any tool can use
 *   planned — components its next version stands on
 * Each component names the other tools that hold it: depth added to one reaches them all. */
(function (global) {
  'use strict';
  const TP = global.ToolPage; if (!TP || !TP.addTab) return;
  TP.addTab(({ def, h }) => {
    const MC = global.MusicComponents, F = global.OrganismFactory; if (!MC || def.domain !== 'music') return null;
    const me = MC.tools[def.id] || { uses: [], becomes: [], planned: [] }, C = MC.components;
    const others = (c) => Object.keys(MC.tools).filter(t => t !== def.id && (MC.tools[t].uses.includes(c) || MC.tools[t].becomes.includes(c))).map(t => (F.def(t) || {}).label || t.replace(/^eravos\./, ''));
    const row = (c, tag) => { const x = C[c] || {}, o = others(c);
      return h('div', { class: 'tp-row' + (x.built ? '' : ' off') }, [h('span', { class: 'tp-tag ' + (x.built ? 'lnk' : 'kind'), text: tag }),
        h('div', { class: 'tp-rt' }, [h('b', { text: x.label || c }), h('small', { text: [x.group, x.job].filter(Boolean).join(' · ') + (o.length ? ' — also in ' + o.slice(0, 6).join(', ') + (o.length > 6 ? ' +' + (o.length - 6) : '') : '') })]),
        h('span', { class: 'tp-tag kind', text: x.built ? 'built' : 'to build' })]); };
    const group = (title, list, tag) => list.length ? [h('div', { class: 'tp-cg' }, [h('div', { class: 'tp-sh' }, [h('b', { text: title })]), h('div', { class: 'tp-list' }, list.map(c => row(c, tag)))])] : [];
    const n = me.uses.length + me.becomes.length + me.planned.length;
    const el = h('div', {}, [].concat(
      group('In it now — shared with other tools', me.uses, 'in it'),
      group('Comes out of it — becomes a part any tool can use', me.becomes, 'from it'),
      group('Planned — what its next version stands on', me.planned, 'planned'),
      n ? [] : [h('p', { class: 'tp-p tp-dim', text: 'Nothing shared yet: its code is all its own. As components are built (tools/music/components), the ones it uses show here.' })]));
    return { id: 'components', label: 'Components', ic: 'blocks', sub: n ? `· ${me.uses.length} in it · ${me.becomes.length} from it · ${me.planned.length} planned` : '· none shared yet', el };
  });
})(typeof window !== 'undefined' ? window : globalThis);

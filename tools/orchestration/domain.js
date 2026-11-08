/* ERAVOS orchestration domain — domain.js: registers the Orchestration mode with the shell. Needs the dataflow domain (a box passes json along
 * its wires). Nothing else: a box knows no other system; a pipeline arrives as an ordinary .erv (tools + wires), opened like any project.
 * James, 2026-11-08: "eravos is the build surface for nexus. that way if something needs to be built, we can make a tool for eravos." */
(function (global) {
  'use strict';
  global.Kernel.use({
    id: 'orchestration', version: '0.1.0', label: 'Orchestration', requires: ['dataflow'],
    install() {},
    shell(S) {
      if (typeof S.mode !== 'function') return;
      S.mode({ id: 'orchestration', domain: 'orchestration', label: 'Orchestration', icon: '⛓', accent: '#00d4ff', units: [], categories: ['Steps'],
        brand: { tagline: 'Pipelines as boxes and wires — each step a tool, every dependency a wire.' },
        blurb: 'Open a pipeline (a .erv) or wire steps by hand: gates, systems, agents, macros, pipelines, procedures, tools and builds.' });
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);

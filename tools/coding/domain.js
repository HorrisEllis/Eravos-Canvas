/* ERAVOS coding domain — domain.js: registers the Coding Environment mode with the shell. Needs the dataflow domain (its tools
 * speak text / json / number / trigger). Nothing else: code runs inside its tools' sandboxes, never in the page. */
(function (global) {
  'use strict';
  global.Kernel.use({
    id: 'coding', version: '1.0.0', label: 'Coding Environment', requires: ['dataflow'],
    install() {},
    shell(S) {
      if (typeof S.mode !== 'function') return;
      S.mode({ id: 'coding', domain: 'coding', label: 'Coding Environment', icon: '⌨', accent: '#7cffb2', units: [], categories: ['Code'],
        brand: { tagline: 'Write code that runs beside everything else on the canvas — its inputs and outputs are wires.' },
        blurb: 'JavaScript cells in their own sandbox: wire values in, wire results out to any tool, any domain.' });
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);

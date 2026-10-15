/* ERAVOS agents domain — domain.js: registers the AI Automation mode. Needs the dataflow domain (text / json / trigger).
 * Keys a person enters for an AI provider stay on this computer; nothing here sends anything anywhere by itself. */
(function (global) {
  'use strict';
  global.Kernel.use({
    id: 'agents', version: '1.0.0', label: 'AI Automation', requires: ['dataflow'],
    install() {},
    shell(S) {
      if (typeof S.mode !== 'function') return;
      S.mode({ id: 'agents', domain: 'agents', label: 'AI Automation', icon: '✦', accent: '#ffb86b', units: [], categories: ['AI', 'Code'],
        brand: { tagline: 'Chain AI steps, code and tools into automations you can see — every step a window, every hand-off a wire.' },
        blurb: 'AI steps with any provider (your key stays on this computer), wired to code cells and every other tool.' });
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);

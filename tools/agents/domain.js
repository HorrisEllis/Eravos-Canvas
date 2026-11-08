/* ERAVOS agents domain — domain.js: registers the Automation and Cybernetics mode (was AI Automation; his, 2026-11-08: "maybe call the domain automation and cybernetics?"). Needs the dataflow domain (text / json / trigger).
 * Keys a person enters for an AI provider stay on this computer; nothing here sends anything anywhere by itself. */
(function (global) {
  'use strict';
  global.Kernel.use({
    id: 'agents', version: '1.0.0', label: 'Automation and Cybernetics', requires: ['dataflow'],
    install() {},
    shell(S) {
      if (typeof S.mode !== 'function') return;
      S.mode({ id: 'agents', domain: 'agents', label: 'Automation and Cybernetics', icon: '✦', accent: '#ffb86b', units: [], categories: ['AI', 'Code', 'Steps'],
        brand: { tagline: 'Chain AI steps, code and tools into automations you can see — every step a window, every hand-off a wire.' },
        blurb: 'AI steps with any provider (your key stays on this computer), wired to code cells and every other tool.' });
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);

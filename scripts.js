/* ERAVOS script list — single source for index.html and tests/run.html (order = bottom-up, K-13)
 * The skeleton is domain-free; domains/index.js (the product's domain list) loads the domain packs. */
(function () {
  var base = (document.currentScript && document.currentScript.getAttribute('data-base')) || '';
  window.ERAVOS_BASE = base;
  var S = window.ERAVOS_SCRIPTS = [
    'kernel/kernel.js', 'kernel/intake.js', 'runtime/plain-errors.js',
    'runtime/organism-sdk.js', 'runtime/ui-kit.js', 'runtime/organism-factory.js', 'runtime/content-packs.js', 'runtime/canvas-wm.js',
    'runtime/wire-system.js', 'runtime/tool-settings.js', 'runtime/pack-editor.js', 'runtime/workspace.js', 'runtime/recipes.js', 'runtime/preview.js', 'runtime/history.js', 'runtime/expansion.js', 'runtime/add-menu.js', 'runtime/desktop-bridge.js',
    'domains/index.js'
  ];
  for (var i = 0; i < S.length; i++) document.write('<script src="' + base + S[i] + '"><\/script>');
})();

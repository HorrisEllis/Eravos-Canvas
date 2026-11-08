/* ERAVOS tool list — which domains of drag-and-drop tools this build ships. Each domain is a folder with an index.js
 * that loads its own files. The canvas (../canvas/) knows none of them; it finds this file through ERAVOS_TOOLS.
 * A universe gets every loaded domain unless Kernel.create({domains:[…]}) says otherwise. */
(function () {
  var base = window.ERAVOS_TOOLS || '';
  var D = window.ERAVOS_DOMAINS = ['dataflow', 'music', 'video', 'image', 'agents', 'coding'];
  // the canvas Catalog (canvas/runtime/catalog.js) loads only the domains + tools you installed: catalog.js offers them all
  // as metadata, then boot() writes the loaders that are wanted. No Catalog (an older canvas) → every domain, as before.
  if (window.Catalog) { document.write('<script src="' + base + 'catalog.js"><\/script>'); document.write('<script>window.Catalog.boot(window.ERAVOS_DOMAINS)<\/script>'); return; }
  for (var i = 0; i < D.length; i++) document.write('<script src="' + base + D[i] + '/index.js"><\/script>');
})();

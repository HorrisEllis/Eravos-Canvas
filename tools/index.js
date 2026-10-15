/* ERAVOS tool list — which domains of drag-and-drop tools this build ships. Each domain is a folder with an index.js
 * that loads its own files. The canvas (../canvas/) knows none of them; it finds this file through ERAVOS_TOOLS.
 * A universe gets every loaded domain unless Kernel.create({domains:[…]}) says otherwise. */
(function () {
  var base = window.ERAVOS_TOOLS || '';
  var D = window.ERAVOS_DOMAINS = ['dataflow', 'music', 'video', 'image', 'agents', 'coding'];
  for (var i = 0; i < D.length; i++) document.write('<script src="' + base + D[i] + '/index.js"><\/script>');
})();

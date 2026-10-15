/* ERAVOS domain list — which domain packs this build ships. Each pack is a folder with an index.js that
 * loads its own files. A universe gets every loaded domain unless Kernel.create({domains:[…]}) says otherwise. */
(function () {
  var base = window.ERAVOS_BASE || '';
  var D = window.ERAVOS_DOMAINS = ['dataflow', 'music', 'video', 'image', 'agents', 'coding'];
  for (var i = 0; i < D.length; i++) document.write('<script src="' + base + 'domains/' + D[i] + '/index.js"><\/script>');
})();

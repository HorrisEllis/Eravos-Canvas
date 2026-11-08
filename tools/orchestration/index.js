/* ERAVOS orchestration domain — pipelines as boxes and wires. Its tools live in tools/<category>/<tool>/ (GENERATED tools/index.js). */
(function () {
  var base = (window.ERAVOS_TOOLS || '') + 'orchestration/';
  var F = ['domain.js', 'tools/index.js'];
  for (var i = 0; i < F.length; i++) (window.Catalog ? window.Catalog.load(base + F[i]) : document.write('<script src="' + base + F[i] + '"><\/script>'));
})();

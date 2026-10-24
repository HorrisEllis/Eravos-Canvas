/* ERAVOS agents domain — AI Automation. Its tools live in tools/<category>/<tool>/ (GENERATED tools/index.js). */
(function () {
  var base = (window.ERAVOS_TOOLS || '') + 'agents/';
  var F = ['core/icons.gen.js', 'domain.js', 'tools/index.js'];
  for (var i = 0; i < F.length; i++) (window.Catalog ? window.Catalog.load(base + F[i]) : document.write('<script src="' + base + F[i] + '"><\/script>'));
})();

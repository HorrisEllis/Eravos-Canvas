/* ERAVOS image domain — Image Manipulation: core (the shared pixel pipeline) → domain hookup → GENERATED tools/index.js */
(function () {
  var base = (window.ERAVOS_TOOLS || '') + 'image/';
  var F = ['core/icons.gen.js', 'core/image-core.js', 'domain.js', 'tools/index.js'];
  for (var i = 0; i < F.length; i++) (window.Catalog ? window.Catalog.load(base + F[i]) : document.write('<script src="' + base + F[i] + '"><\/script>'));
})();

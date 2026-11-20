/* ERAVOS core — file list (specs/eravos.bare-canvas.spec BC1, 2026-11-13). Parts every domain shares that are not the canvas: the Field
 * (field/: the domain-free editing surface, window.Workshop — moved here from canvas/runtime, nothing changed). Domain-free like the canvas:
 * it names no domain, tool or topic (tests/boundary.test.js scans it). Element synthesis (elements/, ES1): a tool's face from its elements. Loaded first, always (domain.json "always"). No tools of its own yet. */
(function () {
  var base = (window.ERAVOS_TOOLS || '') + 'core/';
  var F = [['css', 'field/field.css'], ['js', 'field/field.js'], ['js', 'elements/elements.js'], ['js', 'field/motion.js'], ['css', 'field/board.css'], ['js', 'field/board.js']];   // + a tool exploded on the canvas (board.js, 2026-11-20)   // ES1: element synthesis (domain-free)
  for (var i = 0; i < F.length; i++) {
    var u = base + F[i][1], css = F[i][0] === 'css';
    if (window.Catalog) window.Catalog.load(u, css);
    else document.write(css ? '<link rel="stylesheet" href="' + u + '">' : '<script src="' + u + '"><\/script>');
  }
})();

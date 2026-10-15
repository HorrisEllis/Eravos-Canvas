# spec_id: eravos.domain.ui · status MAPPED · folder tools/ui/  (exe: ERAVOS Library/Mods/UI / Web/)
domain: 🧩 UI / Web — Design and edit web interfaces with small tools: a page is a tree of components; style comes from tokens; the result exports as real HTML/CSS.
mode: UI Design
units (toolbar expansion, built only when needed):
    - ui.engine — the component tree + layout solver
    - ui.viewport — device sizes toolbar group
    - ui.tokens — the design token store
tools (each its own folder + spec; mapped ones in planned/):
    - 📄 page — A page (artboard) that holds a component tree.  [in: layout, style → out: layout]
    - ▭ box — A container: flex or grid layout, padding, gap, border, radius.  [in: layout ×N, style → out: layout]
    - 🔤 text-block — Headings and paragraphs with token typography.  [in: text, style → out: layout]
    - 🖼 image-block — An image in the layout (from the image domain or a file).  [in: image, asset → out: layout]
    - 🔘 button — A button with states (rest, hover, press, focus, disabled).  [in: style, event → out: layout, event]
    - 🎛 style-tokens — Colours, type scale, spacing, radii, shadows — one source of style.  [in: — → out: style]
    - 📱 responsive — Preview and override at phone / tablet / desktop widths.  [in: layout → out: layout]
    - ✨ interaction — Hover/press/enter animations and transitions.  [in: layout, modulation → out: layout]
    - 👁 live-preview — The page running for real, in a sandboxed frame.  [in: layout, style → out: event]
    - ♿ a11y-check — Contrast, alt text, labels, focus order, headings.  [in: layout, style → out: json]
    - ⤓ export-web — Export clean HTML + CSS (or a component file).  [in: layout, style → out: asset]
build order: source tools first (they make something to see), then transforms, then exports; one tool per step, each green before the next.
boundary: nothing in tools/ui/ is read by the shell or another domain; the shell sees only units, modes, needs, packs.

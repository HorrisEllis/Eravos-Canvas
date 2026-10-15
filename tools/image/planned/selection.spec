# spec_id: eravos.organism.image.selection · status MAPPED (specified, not built) · domain image
identity:
  id: eravos.image.selection ; label: Smart Select ; icon: 🪄 ; category: Image
  folder: tools/image/tools/<category>/selection/   (tool.json · selection.engine.js · selection.ui.js · selection.spec) — its own pack, never merged into another tool
  purpose: Select by colour (magic wand), range, or edges.
ports:
  in:
    - image — an image frame (ImageBitmap / OffscreenCanvas), sRGB, with alpha
  out:
    - mask — a single-channel image 0…1 (what is selected)
params:
    - mode: wand|colour range|luminance range
    - tolerance
    - contiguous
    - feather
behaviour:
    - flood fill in Lab space
depends_on:
  mode: Photo & Image   units: [image.engine, image.view, image.history]
  works_with: [mask-brush]   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - wand on a 2-colour image selects exactly one colour region
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load

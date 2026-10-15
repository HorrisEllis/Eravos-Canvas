# spec_id: eravos.organism.image.mask-brush · status MAPPED (specified, not built) · domain image
identity:
  id: eravos.image.mask-brush ; label: Mask Brush ; icon: 🖌 ; category: Image
  folder: tools/image/tools/<category>/mask-brush/   (tool.json · mask-brush.engine.js · mask-brush.ui.js · mask-brush.spec) — its own pack, never merged into another tool
  purpose: Paint what is selected — soft brush, eraser, feather.
ports:
  in:
    - image — an image frame (ImageBitmap / OffscreenCanvas), sRGB, with alpha
  out:
    - mask — a single-channel image 0…1 (what is selected)
params:
    - size
    - hardness
    - flow
    - feather
    - invert
behaviour:
    - pressure from pen input
    - mask previewed as red overlay
depends_on:
  mode: Photo & Image   units: [image.engine, image.view, image.history]
  works_with: [layer-stack, selection]   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - a full-strength stroke yields mask=1 under it and 0 outside
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load

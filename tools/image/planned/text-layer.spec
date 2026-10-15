# spec_id: eravos.organism.image.text-layer · status MAPPED (specified, not built) · domain image
identity:
  id: eravos.image.text-layer ; label: Text ; icon: 🔤 ; category: Image
  folder: domains/image/tools/<category>/text-layer/   (tool.json · text-layer.engine.js · text-layer.ui.js · text-layer.spec) — its own pack, never merged into another tool
  purpose: Type on images: font, size, tracking, outline, shadow.
ports:
  in:
    - text — a UTF-8 string
    - style — design tokens (colours, type, spacing, radii) as JSON
  out:
    - image — an image frame (ImageBitmap / OffscreenCanvas), sRGB, with alpha
params:
    - font
    - size
    - weight
    - tracking
    - colour
    - outline
    - shadow
    - align
behaviour:
    - renders to a transparent image for layer-stack
depends_on:
  mode: Photo & Image   units: [image.engine, image.view, image.history]
  works_with: [ui.style-tokens]   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - empty text → fully transparent image of the set size
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load

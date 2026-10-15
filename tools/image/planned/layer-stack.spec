# spec_id: eravos.organism.image.layer-stack · status MAPPED (specified, not built) · domain image
identity:
  id: eravos.image.layer-stack ; label: Layers ; icon: 🗂 ; category: Image
  folder: tools/image/tools/<category>/layer-stack/   (tool.json · layer-stack.engine.js · layer-stack.ui.js · layer-stack.spec) — its own pack, never merged into another tool
  purpose: Stack images with blend modes and opacity — the composite is one image out.
ports:
  in:
    - image ×N — an image frame (ImageBitmap / OffscreenCanvas), sRGB, with alpha
    - mask ×N — a single-channel image 0…1 (what is selected)
  out:
    - image — an image frame (ImageBitmap / OffscreenCanvas), sRGB, with alpha
params:
    - per layer: blend (normal, multiply, screen, overlay, soft light, difference…), opacity, visible
behaviour:
    - composites bottom→top in linear light
    - a mask input limits its layer
depends_on:
  mode: Photo & Image   units: [image.engine, image.view, image.history]
  works_with: [image-source, mask-brush]   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - two 50 % grey layers in multiply → 25 % grey (linear) ±1/255
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load

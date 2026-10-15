# spec_id: eravos.organism.image.grain-texture · status MAPPED (specified, not built) · domain image
identity:
  id: eravos.image.grain-texture ; label: Grain & Texture ; icon: 🌫 ; category: Image
  folder: domains/image/tools/<category>/grain-texture/   (tool.json · grain-texture.engine.js · grain-texture.ui.js · grain-texture.spec) — its own pack, never merged into another tool
  purpose: Film grain, noise, halftone, scanlines, VHS.
ports:
  in:
    - image — an image frame (ImageBitmap / OffscreenCanvas), sRGB, with alpha
    - modulation — control signal (-1…1 or 0…1) into a parameter
  out:
    - image — an image frame (ImageBitmap / OffscreenCanvas), sRGB, with alpha
params:
    - type
    - amount
    - size
    - seed
behaviour:
    - seeded — same seed, same grain
depends_on:
  mode: Photo & Image   units: [image.engine, image.view, image.history]
  works_with: [music.fx-haunt]   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - same seed twice → identical output
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load

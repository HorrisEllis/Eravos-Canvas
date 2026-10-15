# spec_id: eravos.organism.image.blur-sharpen · status MAPPED (specified, not built) · domain image
identity:
  id: eravos.image.blur-sharpen ; label: Blur & Sharpen ; icon: 💧 ; category: Image
  folder: domains/image/tools/<category>/blur-sharpen/   (tool.json · blur-sharpen.engine.js · blur-sharpen.ui.js · blur-sharpen.spec) — its own pack, never merged into another tool
  purpose: Gaussian, lens and motion blur; unsharp mask.
ports:
  in:
    - image — an image frame (ImageBitmap / OffscreenCanvas), sRGB, with alpha
    - mask — a single-channel image 0…1 (what is selected)
    - modulation — control signal (-1…1 or 0…1) into a parameter
  out:
    - image — an image frame (ImageBitmap / OffscreenCanvas), sRGB, with alpha
params:
    - type
    - radius
    - amount
    - threshold
behaviour:
    - separable gaussian
    - mask limits the effect
depends_on:
  mode: Photo & Image   units: [image.engine, image.view, image.history]
  works_with: []   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - radius 0 is identity; blur of a flat colour is the same colour
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load

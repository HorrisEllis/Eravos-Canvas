# spec_id: eravos.organism.image.curves · status MAPPED (specified, not built) · domain image
identity:
  id: eravos.image.curves ; label: Curves ; icon: 〰 ; category: Image
  folder: domains/image/tools/<category>/curves/   (tool.json · curves.engine.js · curves.ui.js · curves.spec) — its own pack, never merged into another tool
  purpose: Tone curves per channel (RGB, R, G, B, luminance).
ports:
  in:
    - image — an image frame (ImageBitmap / OffscreenCanvas), sRGB, with alpha
    - modulation — control signal (-1…1 or 0…1) into a parameter
  out:
    - image — an image frame (ImageBitmap / OffscreenCanvas), sRGB, with alpha
params:
    - points per channel
    - preset: S-curve, fade, crush
behaviour:
    - monotone cubic through the points
    - modulation input moves a chosen point (animate light with music)
depends_on:
  mode: Photo & Image   units: [image.engine, image.view, image.history]
  works_with: [music.lfo]   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - identity curve leaves pixels unchanged; inverted curve → 255-x
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load

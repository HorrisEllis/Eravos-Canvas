# spec_id: eravos.organism.image.histogram · status MAPPED (specified, not built) · domain image
identity:
  id: eravos.image.histogram ; label: Histogram & Scopes ; icon: 📊 ; category: Image
  folder: domains/image/tools/<category>/histogram/   (tool.json · histogram.engine.js · histogram.ui.js · histogram.spec) — its own pack, never merged into another tool
  purpose: Histogram, waveform, vectorscope — see the image as data.
ports:
  in:
    - image — an image frame (ImageBitmap / OffscreenCanvas), sRGB, with alpha
  out:
    - json — a JSON value with a schema
params:
    - scope: histogram|waveform|vectorscope
behaviour:
    - reads only — never changes the image
depends_on:
  mode: Photo & Image   units: [image.engine, image.view, image.history]
  works_with: []   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - a pure red image puts every count in the red 255 bin
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load

# spec_id: eravos.organism.image.crop-transform · status MAPPED (specified, not built) · domain image
identity:
  id: eravos.image.crop-transform ; label: Crop & Transform ; icon: ✂ ; category: Image
  folder: tools/image/tools/<category>/crop-transform/   (tool.json · crop-transform.engine.js · crop-transform.ui.js · crop-transform.spec) — its own pack, never merged into another tool
  purpose: Crop, rotate, flip, scale, perspective.
ports:
  in:
    - image — an image frame (ImageBitmap / OffscreenCanvas), sRGB, with alpha
  out:
    - image — an image frame (ImageBitmap / OffscreenCanvas), sRGB, with alpha
params:
    - crop rect
    - rotate °
    - flip h/v
    - scale
    - perspective 4-corner
behaviour:
    - handles on the preview
    - aspect presets 1:1 4:5 16:9 9:16
depends_on:
  mode: Photo & Image   units: [image.engine, image.view, image.history]
  works_with: []   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - crop 10,10,20,20 of a known image returns exactly those pixels
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load

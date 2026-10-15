# spec_id: eravos.organism.image.image-export · status MAPPED (specified, not built) · domain image
identity:
  id: eravos.image.image-export ; label: Export Image ; icon: ⤓ ; category: Image
  folder: domains/image/tools/<category>/image-export/   (tool.json · image-export.engine.js · image-export.ui.js · image-export.spec) — its own pack, never merged into another tool
  purpose: Save PNG / JPEG / WebP / AVIF at any size.
ports:
  in:
    - image — an image frame (ImageBitmap / OffscreenCanvas), sRGB, with alpha
  out:
    - asset — a file the kernel holds by hash (audio, image, video, json)
params:
    - format
    - quality
    - size
    - colour profile
behaviour:
    - writes to Exports on the exe, downloads in a browser
depends_on:
  mode: Photo & Image   units: [image.engine, image.view, image.history]
  works_with: []   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - PNG export decodes back to identical pixels
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load

# spec_id: eravos.organism.image.image-source · status MAPPED (specified, not built) · domain image
identity:
  id: eravos.image.image-source ; label: Image Source ; icon: 📷 ; category: Image
  folder: tools/image/tools/<category>/image-source/   (tool.json · image-source.engine.js · image-source.ui.js · image-source.spec) — its own pack, never merged into another tool
  purpose: Bring an image in: drop a file, paste, camera, or an asset from any tool.
ports:
  in:
    - (none)
  out:
    - image — an image frame (ImageBitmap / OffscreenCanvas), sRGB, with alpha
    - asset — a file the kernel holds by hash (audio, image, video, json)
params:
    - fit: contain|cover|1:1
    - maxSize: px
behaviour:
    - decodes PNG/JPEG/WebP/AVIF to an ImageBitmap
    - camera grabs a frame on press
    - emits the same frame until replaced
depends_on:
  mode: Photo & Image   units: [image.engine, image.view, image.history]
  works_with: [video.frame-grab]   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - dropping a 2×2 PNG emits an image whose pixels equal the file
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load

# spec_id: eravos.organism.video.frame-grab · status MAPPED (specified, not built) · domain video
identity:
  id: eravos.video.frame-grab ; label: Frame Grab ; icon: 📸 ; category: Video
  folder: tools/video/tools/<category>/frame-grab/   (tool.json · frame-grab.engine.js · frame-grab.ui.js · frame-grab.spec) — its own pack, never merged into another tool
  purpose: Pull any frame out as an image (into the image domain).
ports:
  in:
    - video — a timed stream of image frames + its audio (WebCodecs)
    - trigger — a pulse with a payload — "go now"
  out:
    - image — an image frame (ImageBitmap / OffscreenCanvas), sRGB, with alpha
    - asset — a file the kernel holds by hash (audio, image, video, json)
params:
    - at: time|marker|trigger
behaviour:
    - bridges video → image
depends_on:
  mode: Video   units: [video.engine, video.transport, video.preview]
  works_with: [image.image-source]   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - grab at 0.5 s returns frame 15 of a 30 fps clip
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load

# spec_id: eravos.organism.video.video-grade · status MAPPED (specified, not built) · domain video
identity:
  id: eravos.video.video-grade ; label: Video Grade ; icon: 🎨 ; category: Video
  folder: domains/video/tools/<category>/video-grade/   (tool.json · video-grade.engine.js · video-grade.ui.js · video-grade.spec) — its own pack, never merged into another tool
  purpose: Colour grade every frame (same controls as image Colour Grade).
ports:
  in:
    - video — a timed stream of image frames + its audio (WebCodecs)
    - modulation — control signal (-1…1 or 0…1) into a parameter
  out:
    - video — a timed stream of image frames + its audio (WebCodecs)
params:
    - lift gamma gain
    - HSL
    - LUT
behaviour:
    - per-frame GPU pass
depends_on:
  mode: Video   units: [video.engine, video.transport, video.preview]
  works_with: [image.color-grade]   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - neutral grade leaves frames unchanged
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load

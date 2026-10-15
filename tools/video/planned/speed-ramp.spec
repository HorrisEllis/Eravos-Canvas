# spec_id: eravos.organism.video.speed-ramp · status MAPPED (specified, not built) · domain video
identity:
  id: eravos.video.speed-ramp ; label: Speed Ramp ; icon: ⏩ ; category: Video
  folder: tools/video/tools/<category>/speed-ramp/   (tool.json · speed-ramp.engine.js · speed-ramp.ui.js · speed-ramp.spec) — its own pack, never merged into another tool
  purpose: Slow motion, fast forward, reverse, freeze; ramps on a curve.
ports:
  in:
    - video — a timed stream of image frames + its audio (WebCodecs)
    - modulation — control signal (-1…1 or 0…1) into a parameter
  out:
    - video — a timed stream of image frames + its audio (WebCodecs)
params:
    - speed curve
    - frame blending
behaviour:
    - audio pitch follows or stays
depends_on:
  mode: Video   units: [video.engine, video.transport, video.preview]
  works_with: []   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - speed 2× halves the duration ±1 frame
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load

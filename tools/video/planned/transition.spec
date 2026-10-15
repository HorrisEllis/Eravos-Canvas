# spec_id: eravos.organism.video.transition · status MAPPED (specified, not built) · domain video
identity:
  id: eravos.video.transition ; label: Transition ; icon: 🔀 ; category: Video
  folder: domains/video/tools/<category>/transition/   (tool.json · transition.engine.js · transition.ui.js · transition.spec) — its own pack, never merged into another tool
  purpose: Crossfade, dip, wipe, zoom, glitch between two videos.
ports:
  in:
    - video ×2 — a timed stream of image frames + its audio (WebCodecs)
    - modulation — control signal (-1…1 or 0…1) into a parameter
  out:
    - video — a timed stream of image frames + its audio (WebCodecs)
params:
    - type
    - duration
    - curve
behaviour:
    - modulation drives the mix (sync a wipe to a riser)
depends_on:
  mode: Video   units: [video.engine, video.transport, video.preview]
  works_with: [music.lfo]   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - mix 0 = A exactly, mix 1 = B exactly
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load

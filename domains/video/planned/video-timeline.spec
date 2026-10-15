# spec_id: eravos.organism.video.video-timeline · status MAPPED (specified, not built) · domain video
identity:
  id: eravos.video.video-timeline ; label: Video Timeline ; icon: 🧵 ; category: Video
  folder: domains/video/tools/<category>/video-timeline/   (tool.json · video-timeline.engine.js · video-timeline.ui.js · video-timeline.spec) — its own pack, never merged into another tool
  purpose: Arrange clips on tracks; trim, split, ripple.
ports:
  in:
    - video ×N — a timed stream of image frames + its audio (WebCodecs)
    - event — bus topic with a JSON schema (note:trigger, transport:tick, …)
  out:
    - video — a timed stream of image frames + its audio (WebCodecs)
params:
    - tracks
    - snap: frame|beat|bar
    - ripple
behaviour:
    - snaps to the music transport beats when music is on
depends_on:
  mode: Video   units: [video.engine, video.transport, video.preview]
  works_with: [music.timeline, music.transport]   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - split at frame 15 → two clips that tile the original
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load

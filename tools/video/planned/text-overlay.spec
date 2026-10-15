# spec_id: eravos.organism.video.text-overlay · status MAPPED (specified, not built) · domain video
identity:
  id: eravos.video.text-overlay ; label: Titles ; icon: 🔤 ; category: Video
  folder: domains/video/tools/<category>/text-overlay/   (tool.json · text-overlay.engine.js · text-overlay.ui.js · text-overlay.spec) — its own pack, never merged into another tool
  purpose: Titles and lyrics over video, timed to the song.
ports:
  in:
    - video — a timed stream of image frames + its audio (WebCodecs)
    - text — a UTF-8 string
    - event — bus topic with a JSON schema (note:trigger, transport:tick, …)
  out:
    - video — a timed stream of image frames + its audio (WebCodecs)
params:
    - font
    - animation in/out
    - position
    - timing: bars|seconds
behaviour:
    - can follow timeline markers (verse/chorus/drop)
depends_on:
  mode: Video   units: [video.engine, video.transport, video.preview]
  works_with: [music.timeline]   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - a title from bar 2 to bar 4 at 120 BPM shows from 2.0 s to 6.0 s
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load

# spec_id: eravos.organism.video.beat-cut · status MAPPED (specified, not built) · domain video
identity:
  id: eravos.video.beat-cut ; label: Beat Cut ; icon: 🥁 ; category: Video
  folder: domains/video/tools/<category>/beat-cut/   (tool.json · beat-cut.engine.js · beat-cut.ui.js · beat-cut.spec) — its own pack, never merged into another tool
  purpose: Cut between clips on every beat / bar / drop — edit to music automatically.
ports:
  in:
    - video ×N — a timed stream of image frames + its audio (WebCodecs)
    - event — bus topic with a JSON schema (note:trigger, transport:tick, …)
  out:
    - video — a timed stream of image frames + its audio (WebCodecs)
params:
    - cut on: beat|bar|drop|pad hit
    - order: in turn|random|by energy
behaviour:
    - listens to transport:tick, pad:trigger, edm:drop-fired
depends_on:
  mode: Video   units: [video.engine, video.transport, video.preview]
  works_with: [music.pads, music.bass-drop-builder]   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - at 120 BPM, cut-on-beat yields a cut every 0.5 s ±1 frame
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load

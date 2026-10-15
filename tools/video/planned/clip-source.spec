# spec_id: eravos.organism.video.clip-source · status MAPPED (specified, not built) · domain video
identity:
  id: eravos.video.clip-source ; label: Clip Source ; icon: 🎞 ; category: Video
  folder: tools/video/tools/<category>/clip-source/   (tool.json · clip-source.engine.js · clip-source.ui.js · clip-source.spec) — its own pack, never merged into another tool
  purpose: Bring a video in: drop a file or record the screen/camera.
ports:
  in:
    - (none)
  out:
    - video — a timed stream of image frames + its audio (WebCodecs)
    - audio — Web Audio node (music engine) — sound
    - asset — a file the kernel holds by hash (audio, image, video, json)
params:
    - in/out points
    - loop
behaviour:
    - decodes MP4/WebM/MOV (H.264, VP9, AV1 where supported)
    - audio track exposed as an audio port
depends_on:
  mode: Video   units: [video.engine, video.transport, video.preview]
  works_with: [music.song-recorder]   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - a 1 s 30 fps clip yields 30 frames with matching timestamps
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load

# spec_id: eravos.organism.video.video-export · status MAPPED (specified, not built) · domain video
identity:
  id: eravos.video.video-export ; label: Export Video ; icon: ⤓ ; category: Video
  folder: domains/video/tools/<category>/video-export/   (tool.json · video-export.engine.js · video-export.ui.js · video-export.spec) — its own pack, never merged into another tool
  purpose: Render MP4 / WebM with the song as the audio.
ports:
  in:
    - video — a timed stream of image frames + its audio (WebCodecs)
    - audio — Web Audio node (music engine) — sound
  out:
    - asset — a file the kernel holds by hash (audio, image, video, json)
params:
    - codec
    - bitrate
    - size
    - fps
behaviour:
    - offline render — faster than real time where possible
depends_on:
  mode: Video   units: [video.engine, video.transport, video.preview]
  works_with: [music.song-recorder]   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - exported duration = timeline duration ±1 frame
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load

# spec_id: eravos.organism.agents.song-writer · status MAPPED (specified, not built) · domain agents
identity:
  id: eravos.agents.song-writer ; label: Song Writer (bridge) ; icon: 🎵 ; category: Automation
  folder: tools/agents/tools/<category>/song-writer/   (tool.json · song-writer.engine.js · song-writer.ui.js · song-writer.spec) — its own pack, never merged into another tool
  purpose: Let a flow write music: genre + seed + mood → a song on the canvas.
ports:
  in:
    - json — a JSON value with a schema
    - trigger — a pulse with a payload — "go now"
  out:
    - event — bus topic with a JSON schema (note:trigger, transport:tick, …)
params:
    - genre
    - seed
    - save to Songs
behaviour:
    - uses the Song Engine; a domain bridge, not a copy
depends_on:
  mode: Automation   units: [agents.runner, agents.log, agents.keys]
  works_with: [music.song-engine, music.song-recorder]   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - given genre house + seed 7, the same song as SongEngine.write(“house”, 7)
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load

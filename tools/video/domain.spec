# spec_id: eravos.domain.video · status BUILDING (1 built: video-clip) · folder tools/video/  (exe: tools/video/ beside ERAVOS.exe)
domain: 🎬 Video — Video editing as tools on a canvas: clips, cuts and looks are separate tools; the music transport can drive the edit so cuts land on the beat.
mode: Video
units (toolbar expansion, built only when needed):
    - video.engine — WebCodecs decode/encode + frame clock
    - video.transport — shares the music transport when both are on
    - video.preview — the program monitor
tools (each its own folder + spec; mapped ones in planned/):
    - 🎞 clip-source — Bring a video in: drop a file or record the screen/camera.  [in: — → out: video, audio, asset]
    - 🧵 video-timeline — Arrange clips on tracks; trim, split, ripple.  [in: video ×N, event → out: video]
    - 🥁 beat-cut — Cut between clips on every beat / bar / drop — edit to music automatically.  [in: video ×N, event → out: video]
    - 🔀 transition — Crossfade, dip, wipe, zoom, glitch between two videos.  [in: video ×2, modulation → out: video]
    - 🎨 video-grade — Colour grade every frame (same controls as image Colour Grade).  [in: video, modulation → out: video]
    - 🔤 text-overlay — Titles and lyrics over video, timed to the song.  [in: video, text, event → out: video]
    - ⏩ speed-ramp — Slow motion, fast forward, reverse, freeze; ramps on a curve.  [in: video, modulation → out: video]
    - 📸 frame-grab — Pull any frame out as an image (into the image domain).  [in: video, trigger → out: image, asset]
    - ⤓ video-export — Render MP4 / WebM with the song as the audio.  [in: video, audio → out: asset]
build order: source tools first (they make something to see), then transforms, then exports; one tool per step, each green before the next.
boundary: nothing in tools/video/ is read by the shell or another domain; the shell sees only units, modes, needs, packs.

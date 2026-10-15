# spec_id: eravos.organism.image.color-grade · status MAPPED (specified, not built) · domain image
identity:
  id: eravos.image.color-grade ; label: Colour Grade ; icon: 🎨 ; category: Image
  folder: domains/image/tools/<category>/color-grade/   (tool.json · color-grade.engine.js · color-grade.ui.js · color-grade.spec) — its own pack, never merged into another tool
  purpose: Lift / gamma / gain, HSL, temperature, tint, vibrance, LUT.
ports:
  in:
    - image — an image frame (ImageBitmap / OffscreenCanvas), sRGB, with alpha
    - modulation — control signal (-1…1 or 0…1) into a parameter
  out:
    - image — an image frame (ImageBitmap / OffscreenCanvas), sRGB, with alpha
params:
    - lift gamma gain (RGB wheels)
    - hue/sat/lum per colour band
    - temperature
    - tint
    - vibrance
    - .cube LUT
behaviour:
    - GPU shader where available, CPU fallback
    - loads .cube 3D LUTs
depends_on:
  mode: Photo & Image   units: [image.engine, image.view, image.history]
  works_with: [video.video-grade]   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - neutral settings are identity; +1 stop gain doubles linear values
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load

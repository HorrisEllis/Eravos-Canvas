# spec_id: eravos.organism.ui.image-block · status MAPPED (specified, not built) · domain ui
identity:
  id: eravos.ui.image-block ; label: Image Block ; icon: 🖼 ; category: UI / Web
  folder: domains/ui/tools/<category>/image-block/   (tool.json · image-block.engine.js · image-block.ui.js · image-block.spec) — its own pack, never merged into another tool
  purpose: An image in the layout (from the image domain or a file).
ports:
  in:
    - image — an image frame (ImageBitmap / OffscreenCanvas), sRGB, with alpha
    - asset — a file the kernel holds by hash (audio, image, video, json)
  out:
    - layout — a box tree (component nodes with layout rules)
params:
    - fit
    - aspect
    - alt text (required)
behaviour:
    - refuses export without alt text
depends_on:
  mode: UI Design   units: [ui.engine, ui.viewport, ui.tokens]
  works_with: [image.image-export]   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - missing alt text fails the a11y check
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load

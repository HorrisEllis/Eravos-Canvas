# spec_id: eravos.domain.image · status BUILDING (1 built: image-adjust) · folder domains/image/  (exe: ERAVOS Library/Mods/Image/)
domain: 🖼 Image — Photo manipulation as a chain of small tools: every tool takes an image in and gives an image out, nothing is destructive, any step can be re-wired.
mode: Photo & Image
units (toolbar expansion, built only when needed):
    - image.engine — the frame pipeline + colour management
    - image.view — zoom / fit / 1:1 toolbar group
    - image.history — non-destructive steps
tools (each its own folder + spec; mapped ones in planned/):
    - 📷 image-source — Bring an image in: drop a file, paste, camera, or an asset from any tool.  [in: — → out: image, asset]
    - 🗂 layer-stack — Stack images with blend modes and opacity — the composite is one image out.  [in: image ×N, mask ×N → out: image]
    - ✂ crop-transform — Crop, rotate, flip, scale, perspective.  [in: image → out: image]
    - 〰 curves — Tone curves per channel (RGB, R, G, B, luminance).  [in: image, modulation → out: image]
    - 🎨 color-grade — Lift / gamma / gain, HSL, temperature, tint, vibrance, LUT.  [in: image, modulation → out: image]
    - 🖌 mask-brush — Paint what is selected — soft brush, eraser, feather.  [in: image → out: mask]
    - 🪄 selection — Select by colour (magic wand), range, or edges.  [in: image → out: mask]
    - 💧 blur-sharpen — Gaussian, lens and motion blur; unsharp mask.  [in: image, mask, modulation → out: image]
    - 🌫 grain-texture — Film grain, noise, halftone, scanlines, VHS.  [in: image, modulation → out: image]
    - 🔤 text-layer — Type on images: font, size, tracking, outline, shadow.  [in: text, style → out: image]
    - 📊 histogram — Histogram, waveform, vectorscope — see the image as data.  [in: image → out: json]
    - ⤓ image-export — Save PNG / JPEG / WebP / AVIF at any size.  [in: image → out: asset]
build order: source tools first (they make something to see), then transforms, then exports; one tool per step, each green before the next.
boundary: nothing in domains/image/ is read by the shell or another domain; the shell sees only units, modes, needs, packs.

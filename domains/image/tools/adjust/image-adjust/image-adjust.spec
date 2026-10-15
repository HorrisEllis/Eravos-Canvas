# spec_id: eravos.organism.image.image-adjust · version 1.0.0 · phase P37.1 · status BUILT · domain image (Image Manipulation)
identity:
  id: eravos.image.image-adjust ; label: Image Adjust ; icon: 🖼 ; category: Image
  purpose: the one tool Image Manipulation stands on — open, shape and export a picture, non-destructively, and hand
    the result to any other tool. Merges the mapped image-source + crop-transform + curves/colour-grade + image-export
    into one window; layers, masks and selections stay mapped (planned/).
contract:
  sources: Open… (file) · a file dropped on the canvas (Intake handler image.image-file → a new Image Adjust) · the
    "in" port (image value, e.g. a Video Clip frame). A file source is kept as a kernel asset → saved with the project.
  pipeline (domains/image/core/image-core.js — pure, tested): rotate/flip → crop (normalised to the rotated frame) →
    per-channel LUTs: sRGB→linear, white balance (temperature ±0.3 stops R/B, tint ±0.25 stops G), exposure ×2^EV in
    LINEAR light, →sRGB, levels (black, white, gamma), contrast (pivot 0.5) → per pixel: shadows/highlights (luma-
    weighted, colour kept), saturation + vibrance (luma kept), vignette.
  non-destructive: the original never changes; every adjustment is a param; presets are complete settings.
  output: "out" = the full-resolution result, re-sent 350 ms after the last change; "stats" = size, mean brightness,
    clipped shadow/highlight fractions. Export: PNG / JPEG / WebP (quality), named <name>-adjusted.<ext>.
  preview: rendered by the engine at ≤ 960 px, at most once per frame; hold "Original" for before/after.
ports (data domain): in (image) · out (image) · stats (json)
params: exposure · contrast · highlights · shadows · blackPoint · whitePoint · gamma · temperature · tint · saturation ·
  vibrance · vignette · rotate · flipH · aspect (crop shape) · format · quality. Extra: crop rect, source asset, name.
acceptance (tests/p26-domains.test.js):
  - exposure +1 EV doubles linear light (mid-grey 0.18 → 0.36 in linear, ±1 %)
  - saturation −1 gives R = G = B on every pixel
  - rotate 90 swaps width and height; crop 0.5×0.5 halves both
  - export produces a PNG blob of the cropped size; stats report the clipped fraction of a white picture as 1
  - save/restore keeps the source asset, crop and adjustments

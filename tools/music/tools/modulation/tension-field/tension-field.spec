# spec_id: eravos.tension-field · version 1.0.0 · status built (3.243, 2026-11-27) · template eravos.tool/1
# planned as tools/music/planned/tension-field.spec (its modes measure · map · target and its seven packs kept); built for the Contrast setup
# his words (2026-11-27): "the way it creates ripples and tension" · "tension, oscillations. wavelengths, emergence." · "actually continue with
#   the tensino field then release first."
# direction: specs/eravos.contrast-space.spec (CS5); research docs/research/rumble-techniques.md (method 10: tension held, then released)
identity:
  id: eravos.tension-field ; label: Tension Field ; domain: music ; family: modulation (tension) ; accent: "#ff5a3c"
  lineage: film-score suspense, the EDM build, the drop as a release (technique only)
  novelty: tension HEARD from any sound in four kinds at once and used as signals; a build with a target bar that releases itself, on a
    button, or when any signal pushes its release input
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  tension-meter · energy-curve
signal_dag:
  in → tension-meter
  tension-meter → out
  energy-curve → out
engine: one AudioWorklet (the components' kernel text): input (stereo) → tension-meter each block → loudness, brightness, density, motion and
  their weighted sum; energy-curve from Play (startT) over Hold bars (in seconds from the tempo), released at its end, on RELEASE (releaseT)
  or when releaseIn crosses ½; Tension = the sum (measure), the curve (target) or the higher (both); Release = 1 at the moment it lets go, then
  falls over Release. Six mod outputs.
modes (planned measure · map · target): measure ✓ · target ✓ · map ✓ (each kind is its own output — wire it to any knob) · both (new)
open: harmonic and pitch-instability tension (they read notes) · "reach 80 by bar 16" as a typed value (Peak + Hold do it today)
ports: in (audio) · transport · releaseIn (mod, primary) · out (mod): tension · release · loudness · brightness · density · motion
packs: factory — Slow Burn · Rising Pressure · Suspended Resolution · Dissonance Bloom · Pre-Drop · Psychological Horror · Release Cascade
acceptance (tension-field.test.js, P243):
  - measure: a louder input gives higher Tension; nothing in gives 0
  - target: Hold 1 bar at 120 BPM (2 s), Shape 0: Tension ½ at 1 s, the peak just before 2 s, then it falls, and Release fires at 2 s
  - RELEASE early (releaseIn pushed): Tension falls from where it was; both: never below the build
  - novelty: a modulator (no audio out) — measured by its outputs in the tests, not by the audio survey

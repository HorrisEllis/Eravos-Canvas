# spec_id: eravos.motion · version 1.0.0 · phase P48 · status mapped (not built)
# "I also want to be able to manipulate any of the static tools. Like the destroyer, retro synthwave tool. I want more
#  dynamic, control and fluidity for the static tools. The gothic organ, and dub station."

## Findings (from the code, 2026-10-19)
  F1 Knobs only move when you turn them. Destroyer has 13 settings and 3 modulation inputs; Retro Poly 31 settings and 2
     (cutoff, pwm); Gothic Organ 27 and 1 (breath); Dub Station 21 and 2 (bigKnob, echoSweep). Everything else is static.
  F2 Modulation today = a separate LFO / Envelope / XY Pad window wired to one of those few inputs (ctx.modBus). Fine for
     a patch, too heavy for "make this knob breathe".
  F3 Preset changes and many knob changes jump (setValueAtTime) — audible steps, no morph.
  F4 Only Wobble Bass has a perform pad (3.45). Macro Automation exists as a separate tool.

## M1 Any knob can move (SDK — tools/music/core/sdk-music.js + canvas/runtime: domain-free part in runtime/motion.js)
  Every number / integer / boolean / enum setting of every tool can carry MOTION — no tool code changes needed:
    right-click a knob (or long-press) → Motion: LFO · Envelope (per note) · Random (S&H / smooth) · Steps (1–16) ·
      Follow (another knob, or the input level) · Off
    each motion: depth (± in the knob's own units), rate (sync divisions or Hz), shape, phase, retrigger on note
    a small ring on the knob shows the moving value; the saved value is the knob's centre (the base)
  two paths, chosen per setting automatically:
    audio-rate   settings the engine already exposes as a mod bus (ctx.modBus) → the motion is a node connected to it
                 (sample-accurate, as LFO-to-cutoff is today)
    control-rate every other setting → the runtime writes a LIVE value at 60 Hz through ctx.params.live(key, v):
                 the engine's onChange runs as if turned by hand, but the value is not saved, not undoable, not echoed
                 to the canvas (the base stays the saved value). Enums/booleans step; numbers glide.
  stored per tool instance as a hidden setting `motion` [{ key, kind, depth, rate, div, shape, phase, retrig, src? }]
  → saved with the project, copied with presets only when the preset says so (presets stay sound, not motion, by default)
  descriptor opt-outs: config item { motion: false } (e.g. bypass, mods, files, sample choices)

## M2 Macros (every instrument and effect)
  4 macro knobs per tool (M1–M4, in the window's header strip and on its face). Each macro drives any of the tool's knobs,
  each with its own range (from → to, curve). Right-click a knob → "Assign to M1…". Macros are mod-able (M1 can carry
  motion). Stored as hidden `macros` [{ name, value, targets: [{ key, from, to, curve }] }]. Tools may ship default macros
  in their descriptor (`macros: [...]`) — the four static tools do (below).

## M3 Perform pad (every instrument; effects optional)
  The Wobble Bass pad, generalised: a square XY pad in the window (fold-away). X and Y each map to a macro (default M1/M2).
  Spring-back on release (toggle) · hold (Shift) · double-click resets · touch/pen pressure → M3 where available.
  Moves are recorded by the Timeline as automation like any knob.

## M4 Glide and morph
  every knob change ramps (setTargetAtTime, the tool's own smoothing time, default 15 ms) — no zipper steps
  preset MORPH: choosing a preset can morph over 0–8 bars (window header: ⇢ morph time) — numbers glide, enums switch
  at the midpoint · A/B: two presets on a crossfader (the pad's X can be A↔B)

## M5 What the four static tools get (their specs carry the detail)
  Destroyer      macros Heat (drive+asym+autoGain), Crunch (bits+downsample), Bite (tight+tilt), Tame (postLP+autoTame);
                 pad X=Heat Y=Crunch; new audio-rate buses: tilt, postLP; drive follows input (envelope follower option)
  Retro Poly     macros Brightness (cutoff+envAmt), Motion (pwm+pwmRate+drift), Space (chorus+unison), Pluck (fD+decay);
                 pad X=Brightness Y=Motion; new buses: res, envAmt, drift, chorus; per-voice velocity → cutoff/PWM
  Gothic Organ   macros Swell (expression: level+dark), Registration (drawbar morph between two registrations),
                 Spin (rotary slow↔fast with real ramp), Cathedral (space+release); pad X=Swell Y=Registration;
                 new buses: expression, drawbar set (all 9 as one morphable group), rotor speed with inertia
  Dub Station    macros Big Knob (filter sweep), Throw (echo send+feedback, momentary), Spring, Siren (pitch+rate);
                 pad X=Big Knob Y=Throw (spring-back = the classic dub throw); new buses: echoFeedback, spring, sirenPitch;
                 the skank and siren take note velocity

## Acceptance
  any knob on any tool can be given an LFO from its right-click menu and audibly moves (offline render test per path)
  the saved value is unchanged by motion; undo history does not fill with motion steps
  the four static tools ship 4 macros + a perform pad each; preset morph glides (no step > 1 dB / 50 cents per 10 ms)
  tests: tests/p48-motion.test.js + each tool's own test file

## ADDENDUM 2026-10-22 — M1 built differently: the movers are the part tools (eravos.phase49-map P49.1, D-49.1)
  James, 2026-10-22: "Motion core: any knob can be moved by an LFO or envelope."
  M1 above designed motion inside each knob, with a motion engine of its own. It is superseded, and kept (§0.3). Built instead:
  every knob of every sound tool has an input (knob.<key>). The LFO, Envelope, Wub Rate, XY Pad and Macro tools wire to it, from
  the knob's right-click menu "Move with". The moving value is live (params.live): heard, never saved, never undoable. Reasons:
  those tools exist (§8.6), and his rule of 10-21 makes what other tools can use a part. To confirm: if he meant motion inside the
  knob with no window, M1 can still be built on params.live, which already exists.
  M2–M5 are unchanged and re-phased: M4 → P49.2, M2/M3 → P49.5, M5 → P49.6. M5's "new buses" for the static tools are no longer
  needed: every knob is an input now.

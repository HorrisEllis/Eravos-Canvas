# spec_id: eravos.timeline-depth · version 0.1.0 · status proposed · 2026-11-03 · extends timeline.spec (P48.1 piano roll built)
# "The timeline should be a deep, multilevel editing and control environment, not merely a horizontal strip where you
#  arrange clips." Every meaningful musical object is inspectable, editable, automatable and manipulable at the right level.
# Depends on: eravos.object-model.spec · eravos.temporal.spec · eravos.canvas-family.spec

## Resolution levels — zooming exposes MORE information and controls, not bigger pixels
  project      the whole composition, global structure, energy + tension lanes
  sections     intro, verse, build, drop, breakdown, outro (user-named, any count)
  tracks       instruments, audio, MIDI, effects, groups
  clips        phrases and recordings — an expandable container, never an indivisible rectangle
  events       notes, hits, triggers, automation events
  sub-events   ratchets, subdivisions, articulations, microtiming
  sample       individual samples, transient-level editing
  Moving from arranging a clip to editing its events keeps context (position, selection, surrounding tracks visible).

## Clip depth
  MIDI   position + duration (numeric too) · simultaneous notes · velocity · aftertouch + expression · pitch bend · probability ·
         ratchet · note-level modulation · microtiming · articulation · per-note automation where the instrument supports it
  audio  sample-accurate trim · transient detection · warp markers · time-stretch · pitch-shift · reverse · slice · independent
         transient manipulation · clip envelopes · spectral editing · fades and crossfades (curve per fade)

## Automation — three scopes, each lane with several independently configured bindings
  project              tempo · time signature · master processing · global modulation · global performance controls
  track / instrument   any parameter: cutoff, resonance, oscillator, effects, volume, pan, modulation depth
  event / clip         note expression · clip-level parameters · per-event probability · rhythmic variation · microtiming, articulation
  binding fields       target · range · curve · mode (absolute | relative | modulate) · scope · enabled — a lane can drive targets
                       outside its own section or track (object-model CROSSING)

## Editing operations
  multi-selection across tracks and clips · independent and proportional scaling · precise numeric positioning · stretch and
  compress · repeat and pattern multiplication · quantize with strength · groove templates · humanize · randomize with
  constraints (seeded) · relative and absolute transforms · select by event type, pitch, velocity or parameter · batch editing ·
  non-destructive editing with full undo history (undo tree) · nested loop regions · multiple time grids and snap resolutions
  The user chooses the precision; the software imposes no musical assumption (snap off, any grid, any ratio).

## Timeline intelligence — a structured musical model, not AI in every operation
  Selecting a passage shows its measured shape as editable lanes: note density · pitch trajectory · rhythmic subdivision ·
  harmonic complexity · automation intensity · spectral brightness · spatial spread (components tension-meter, spectral-features,
  energy-curve). Each lane can be edited (draw a steeper rise) and the change is applied as ordinary edits to the objects.
  A build-up becomes a reusable, editable STRUCTURE: saved as a template of those lanes + its relationships, applied to other
  material, and kept linked (edit the structure → every use updates, unless detached).

## Five engines, one time model (eravos.temporal.spec)
  temporal     musical time, absolute time, sample position, tempo and meter
  arrangement  tracks, sections, clips, nesting, sequencing
  event        notes, transients, triggers, articulations, microtiming
  automation   curves, bindings, recording, transformations, modulation
  editing      selection, precision operations, history, non-destructive transforms, batch editing

## Acceptance
  - each level opens from the one above with selection and position kept
  - one lane with 3 bindings drives 3 targets on different tracks, each with its own range and curve
  - quantize at 60 % then undo restores exact original positions; re-opening the quantize op edits its strength
  - a saved build-up structure applied to another section reproduces its lane shapes within 5 % per lane
  - automation, MIDI note and warp marker at the same beat render at the same sample after tempo-map edits

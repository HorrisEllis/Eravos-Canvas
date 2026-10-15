# spec_id: eravos.organism.macro-recorder · version 1.0.0 · phase P38 · status planned · category actions
identity:
  id: eravos.agents.macro-recorder ; label: Macro ; icon: ⏺ ; accent: "#fb7185"
  comp_intent: Record what you do on the canvas — spawn tools, load presets, turn knobs, wire things, press buttons — and replay it as one action (on a key, a trigger or a schedule).
  novelty: Records canvas-level intents (bus ui:* events and factory/wire calls), not mouse coordinates — replays correctly even if windows moved.
engine: capture: ui:* events, preset loads, spawns (as "spawn X, call it #1"), wires between captured aliases ; timing kept or compressed ; parameters in a macro can be made inputs ("ask for BPM") ; replay through the same doors (bus/factory/wires) — never internals ; undo of a replay = one undo step
config: steps[] ; timing keep|fast ; inputs[] ; hotkey
hooks: trigger_in run ; data_in inputs ; trigger_out done
ui: step list (editable, reorder, delete) ; record / stop / play
tests: record spawn+preset+knob → replay on empty canvas produces same state (serialize equal except ids) ; one undo reverts the whole replay

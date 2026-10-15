# spec_id: eravos.p38.canvas-polish · version 1.0.0 · phase P38 · status planned · canvas
identity:
  id: eravos.canvas-polish ; label: Canvas polish
  comp_intent: Three canvas behaviours you asked for — the canvas shrinks completely when the last tool goes, the Song Recorder opens into the Timeline for editing, and the Timeline pops out into its own window.
engine:
  shrink: canvas world size = bounding box of windows + margin ; when the last window closes → world resets to the viewport, scroll to 0,0, zoom 1, dock collapses to its minimum ; animation 200 ms (reduced-motion: none)
  recorder → timeline: Song Recorder gets "Edit in Timeline": the take becomes a clip on a new Timeline track at its recorded bar position (spawns Timeline if needed) ; the dock recorder morphs (FLIP animation) into the Timeline window ; edits in the Timeline are non-destructive on the take asset
  timeline pop-out: CanvasWM host abstraction {mount(el), size, focus, close} with two hosts: canvas window and a separate browser window (window.open, same origin, styles cloned) ; desktop runtime → native window ; the tool never knows which host it is in ; popped window remembers size/position
config: shrinkAnimation bool
hooks: (canvas)
ui: as above
tests: spawn 3 tools far right, close all → scrollWidth equals viewport width ; record 2 bars from bar 5 → Timeline clip at bar 5 length 2 bars ; pop-out Timeline → engine keeps playing, UI events still reach it, closing the pop-out returns it to the canvas

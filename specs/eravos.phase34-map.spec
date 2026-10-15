# eravos.phase34-map.spec — 3.34: nothing sticks · windows that expand · speed per tool · settings per tool ·
#   the Mixer · Hard Tune · the Song editor (record any tool per lane, drag in songs and clips)
# Mapped BEFORE building (user rule). Axioms: nothing pretends to work; nothing is repeated; each tool is its own first.
# Status per item: MAPPED → DONE (only when its acceptance passes).

## The user's words (3.34 request)
  "the timeline needs to resize better, it's hard to use · it keeps getting buggy — if I open the dev console it fixes
  it, like something gets stuck like I'm still dragging · bpm or speed per tool · timeline needs to expand more ·
  full settings for each tool that needs it · adding a lane in the song recorder should be able to record different
  tools specifically · a full mixer with the ability to expand, add new lines to mix · auto tune, T-Pain kind ·
  full song editor: drag in songs, audio clips."

## A. Nothing sticks — one pointer guard for every drag  (runtime/ui-kit.js → UIKit.drag)
  RCA. Opening dev tools blurs the window and changes its size. Blur ends the wire drag and clears the canvas
  classes, so whatever got stuck is a drag that only a blur clears. The code shows several of these:
   1. the canvas pan keeps its `pan` state on blur (only the class is removed), and its move handler never checks
      the buttons → a lost release leaves the whole canvas following the mouse ("position is off, can't click");
   2. knobs / sliders / number-drags / the dock grip / window move+resize never check the buttons either; a release
      that lands while their element is rebuilt (the timeline rebuilds its lane heads and inspector on every edit — a
      lane-gain knob is destroyed mid-drag) is never seen;
   3. the timeline and piano roll call cv.focus() without preventScroll → the browser scrolls the scroller under the
      pointer at the moment of the press → the press lands somewhere other than where it was aimed.
  Fix — ONE mechanism, not one patch per tool:
   · UIKit.drag.begin(end) → done(): every pointer drag registers its end. A capture-phase guard on the window ends
     every registered drag that is still alive AFTER a release finished dispatching (pointerup / pointercancel), on a
     button-less mouse move, on a fresh press, on blur / hidden tab, and on Escape. A drag can no longer outlive the
     press that started it, whatever happened to its element.
   · Used by: canvas pan, window move, window resize, dock grip, wires, knob, slider, number-drag, timeline, piano
     roll, Drop Builder bar. (Remaining tool-local drags adopt it in their next pass; the guard still ends the
     shared ones they sit inside.)
   · focus({ preventScroll: true }) everywhere the app focuses on press.
   · Timeline lane heads are rebuilt only when the lanes' structure changes (not on gain/name edits).
  acceptance: a drag whose element is removed mid-drag ends on the next release / button-less move; a blur ends a
  canvas pan; a press on the timeline does not scroll it; full suite green.

## B. Windows that expand (runtime/canvas-wm.js)
  · ⤢ on every window title bar: fills the visible canvas (at any zoom), again → back to its size. Double-click the
    resize grip still fits to content. The bottom dock gets ⤢ too (full height ↔ its height).
  · Timeline 2.2: the arrangement fills whatever size the window has; lane height zoom (− / ＋ and Alt+wheel);
    Ctrl+wheel over the arrangement zooms time around the pointer (not the canvas); "Fit" fits the song to the width
    and the lanes to the height; the ruler stays on top while lanes scroll; lane gain knob keeps working while dragged.
  acceptance: maximize/restore round-trips the rect; timeline canvas width/height follow the window; Fit shows bar 1
  .. song end inside the visible width.

## C. Speed per tool (domain music, sdk-music onTick)
  Every tool that listens to the transport tick gets two params (added by the music domain at define time — written
  once, not per tool): Speed (¼ ½ ¾ 1 1½ 2 3 4 · own) and Own BPM. The tool's ticks are resampled from the master's:
  a tool at ½ hears a 16th every two master 16ths, at 2 hears two, at "own 93 BPM" hears 93-BPM 16ths that start on
  the master's downbeat and stay phase-locked to it — sample-accurate (tick times are audio times). ctx.bpm and the
  tick's bpm/stepDur report the tool's own tempo, so tempo-synced delays/LFOs follow it.
  acceptance: ×1 is identical to before (same ticks); ×2 doubles tick count with exact half spacing; ½ halves it;
  own BPM 70 under master 140 = ½; params persist with the workspace and show in Settings.

## D. Settings per tool (runtime/tool-settings.js + domain sections)
  ⚙ on every window that has settings: a panel inside the window (scrolls on its own, always reachable) with:
   · every parameter of the tool, grouped by its own groups — nothing a compact face hides is unreachable
   · presets (save as / load / rename by save / delete user preset) and Reset to defaults
   · domain sections (music): Speed (C) · Output (the tool's Mixer strip: volume, pan, mute, output line, sends) ·
     MIDI (arm)
  The runtime part is domain-free (boundary test); domains add sections with ToolSettings.addSection.
  acceptance: opening ⚙ on any tool lists all its config keys; changing one changes the tool's param (and its face);
  Reset restores defaults; music sections appear only on tools they apply to.

## E. The Mixer (new tool: tools/mix/mixer · eravos.mixer, singleton) + strips in the audio domain
  The mixing lives in the audio layer, the Mixer is its face (so the title-bar volume, Settings → Output and the
  Mixer are the same strip — nothing repeated):
   · audio.strip(instance, port): every tool's audio out already has guard → trim. A strip adds, on first use,
     gate (solo) → low cut → 3-band EQ → pan between them, plus post-fader sends. Fader/mute = the existing trim.
   · audio lines (buses): GROUP (sum → EQ → pan → fader → mute → master) and AUX (send-fed: Reverb / Echo / Plain
     → EQ → fader → master). The built-in Reverb and Echo returns show as the first two AUX lines.
   · Output: any tool strip can go to Master or to a Group. Wires still win: a wired tool is shown as "→ wired".
  Mixer UI: a strip per sound-making tool on the canvas (appears/disappears with the tool), each: meter, fader, pan,
  M / S, output, ▸ expand = low cut, EQ, sends to every AUX; lines section with ＋ Group / ＋ Aux (add new lines),
  rename / remove; master strip (output gain, meter). Expand the whole Mixer with ⤢ (B).
  acceptance: fader → trim dB; pan/EQ change the rendered signal; solo silences the others; a Group receives an
  assigned tool and its fader changes the level; an Aux send adds that line's effect; state persists.

## F. Hard Tune (new tool: tools/voice-and-words/hard-tune · eravos.hard-tune) — auto-tune, T-Pain to natural
  audio in → out (wire a mic / her clip / any voice in). AudioWorklet: YIN pitch detection (decimated ×2) +
  pitch-synchronous overlap-add (TD-PSOLA) shifting, normalised by the window sum. Target = nearest allowed note of
  the scale (song key or its own), or the notes played into it (note_in, like a MIDI mode). Retune speed 0 ms =
  the hard robot step; 20–400 ms = natural. Amount (how far to correct), Humanize (leave held notes a little
  free), range low/high, dry/wet, output gain. Honest limits in its spec: monophonic input; formants move with pitch.
  Clip mode: "Tune a clip" renders an audio clip offline through the same worklet → a new clip (to the Song, the
  Drop Builder or download).
  UI: pitch trace (in vs. corrected) scrolling, the scale as 12 note pills (click to allow/deny), the big
  ROBOT ↔ NATURAL retune dial, key/scale, meter.
  acceptance: a 430→450 Hz glide with speed 0 in C major A=440 comes out at 440 ±3 Hz after the attack; amount 0
  leaves pitch unchanged; note_in 60 retargets to C; offline clip tune produces a buffer of the same length.

## G. The Song editor (Song Recorder 2.0 — the bottom dock, now "Song")
  · Lanes record any tool: each lane has a Source (Master or any tool on the canvas). Arm several lanes → one ⏺
    records each armed lane from its own source at the same time, sample-aligned. With no lane armed: as before.
  · Drag in: audio files (any number at once, onto a lane at the drop beat), a song from Songs → My songs (＋ Add →
    My songs), any clip already in the session (＋ Add → Clips: takes, Clip Maker, drops), and "Send clip to… →
    Song" from other tools (existing asset_in).
  · Clip tools: reverse, normalize, varispeed (semitones — pitch and speed together, said so), gain, fades, split,
    duplicate, delete, Tune (F) — all undoable.
  · ⤢ makes the dock fill the screen (B): a full song editor.
  · Timeline vs Song (3.33 H): 3.34 makes the Song the audio editor; the Timeline stays the note/pattern/marker
    arranger. Moving the Timeline's lanes INTO the Song as lane types is the next step (P35) — one transport already
    drives both.
  acceptance: two armed lanes with different sources record two takes in one pass; dropped files land on the lane
  under the pointer at that beat; My songs entry decodes into a clip; reverse/normalize/varispeed change the clip
  audibly and Ctrl+Z restores.

## H. Packaging
  New-layout tools (Mixer, Hard Tune) ship as their own zips; docs, README, version 3.34.0-alpha; full suite green;
  boundary test (runtime stays domain-free) green; validate green.

## Ledger
  3.34.1 DONE  Words → Song (data/rhythm-expand.js, song-engine X hook, p21-rhythm-expand).
  3.34.2 DONE  Bass Pack (data/bass-pack.js, song-engine G.bar, p22-bass-pack) — "new EDM genres".
  merge  DONE  alpha ← 3.34.1 ← 3.34.2; p22 goldens re-captured in-page; windows-x64 payload rebuilt (17 packs/50 tools).
               Suite 557/557. desktop/test skel+bare wait on '.overlay .boot' — stale on old payload too (open).
  OPEN   F Hard Tune · G Song editor (per-lane source, multi-arm) · UI rebuild pass · import & map.

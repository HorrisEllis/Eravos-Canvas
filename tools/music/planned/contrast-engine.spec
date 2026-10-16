# spec_id: eravos.organism.contrast-engine · version 2.0.0 · phase P39 (was P38 v1) · status planned · category arrange
# R7 "tranki by skrillex, look into how it was made, the way it fights the rhythm, i want tools for that."
# v2 supersedes v1 (same intent, kept: SWITCH · GAP · FLIP · STUTTER · score · GENERATE) and adds the rhythm-fighting
# grammar, the snap-back, rivalry, and Tap-Map.
#
# SOURCES & HONESTY: "Tranki" (Skrillex with Tracey, TAICHU, ANITA B QUEEN; album SOMA, track 9) has no published
# production breakdown, and ERAVOS (Claude) cannot listen to audio. Nothing here claims to describe that record. What
# is specced is the documented TECHNIQUE vocabulary of rhythm that fights the grid in bass music, house, dancehall,
# reggaeton/dembow, UKG and footwork — plus TAP-MAP (invention I4), which lets the user show ERAVOS the exact moments he
# means by tapping along, without any audio being captured. A3: no melody, lyric, sample or rhythm transcription of a
# record is shipped; Tap-Map data stays the user's own performance.

identity:
  id: eravos.contrast-engine ; label: Contrast ; icon: ⚡ ; accent: "#ff1744"
  comp_intent: Make rhythm that fights the beat on purpose — and then lands back on it — across ANY tools on the canvas,
    with a score that says how hard it is fighting and a curve that says when.
  novelty: a step DIRECTOR over other tools (it plays no sound itself) + a rhythm-fighting grammar + measured contrast +
    the snap-back as a first-class object.

## The grammar — MOVES (each a lane; every move targets one or more tools/parts on the canvas)
  rhythm that fights:
    DISPLACE    shift a part's pattern by n 16ths against the grid (the riff starts "late" — accents fall off the beat)
    CROSS       play a part in 3 against 4 (or 3:2, 5:4, 7:8): dotted-8th / dotted-quarter cycles over a straight kick —
                the classic "3-3-2" (tresillo) and "3-3-3-3-4" (16-step cross) grids, user-editable
    SYNCOPATE   move chosen hits to the 16th before the beat (anticipation) or after (lay-back), per lane, by amount
    HEMIOLA     regroup bar accents (6/8 feel inside 4/4) for N bars
    METRIC MOD  the hats/percussion switch to triplets (or quintuplets) while the kick stays straight — the bar "slips"
    DEMBOW/RIDDIM SKELETONS  editable skeleton grids (one-drop, steppers, dembow 3+3+2, dancehall, UKG skip, footwork 160
                triplet kick) as the "grid it fights" or the "rebel" — skeletons are generic genre grids, not songs
  contrast that hits:
    SWITCH      which source plays this step from a list (the complextro chop) · GAP (hard silence, tails killed, 1/32–1 bar)
    FLIP        half-time ↔ double-time for N steps (drum map re-mapped) · STUTTER (retrigger 1/8→1/64, accelerating)
    REGISTER    jump a part ±1–2 octaves for a step/phrase (density + register contrast at once — the drop switch)
    CALL/ANSWER two parts alternate phrases; the answer is generated from the call's rhythm (inverted/displaced)
  return:
    SNAP-BACK   the defining move: after F bars of fighting, everything re-aligns on a chosen downbeat (usually bar 4/8's
                "1") with a hit (all parts + crash + sub) — the release that makes the fight feel intentional. Every
                fight has a snap-back unless the user removes it on purpose (then the score shows "unresolved").
## RIVALRY mode (invention I7)
  two roles: the GRID (straight, the body: kick/sub) and the REBEL (bass, vocal chops, perc, stabs). GENERATE writes the
  rebel to maximise syncopation against the grid while keeping a dance constraint: the downbeat of every N bars is shared
  (snap-back), and onset density stays inside a band. Knobs: fight (0–1) · snap every (1/2/4/8 bars) · density band ·
  seed. Same seed → same rebel. Every generated move is an ordinary editable step.
## TAP-MAP (invention I4) — "show me the moment you mean"
  play any song you love in your own player; press TAP-MAP, set the BPM (TAP or type), tap the rhythm you feel on pads /
  keys / Space for a few bars. ERAVOS records ONLY your taps (time, velocity), quantises them against the grid and shows:
  where you pushed against the beat, where you left gaps, where you snapped back. One click turns that into a Contrast
  target curve + rebel skeleton you then make your own. Nothing of the record is captured — it is your performance.
## Measurement (A4) — the contrast score per bar (0–100), shown as a curve over the song
  components: syncopation index (weighted off-beat onsets, Longuet-Higgins & Lee style metric weights) · cross-rhythm
  ratio present · grid displacement · Δ onset density · Δ register · Δ spectral centroid · Δ loudness · silence ratio ·
  source-switch rate. TARGET curve drawn by the user; GENERATE fills moves to hit it (seeded, editable).
config: sources[] ; lanes[] {move, targets, steps, params} ; target curve ; rivalry {fight, snapEvery, band, seed} ;
  tapmaps[] ; quantize ; intensity
hooks: STD.transport_in ; control_out (to tools: mute, retrigger, pitch, rate, preset, param) ; note_out ; data_out score ;
  STD.note_in (Tap-Map from pads/MIDI)
ui: score curve over bars (target vs actual) · move lanes like the Sequencer (shared readable grid, sequencer.spec §V) ·
  a "fight ↔ snap" ribbon above them · source palette (drag tools in) · TAP-MAP button
packs: factory ≥ 30 — Complextro Chop · Half-Time Slam · Grid Fight 3:4 · Tresillo Rebel · Dembow Pressure · One-Drop
  Displace · UKG Skip Fight · Footwork Triplet Storm · Stop-Start · Dancehall Drop Switch · Call & Response · Machine-Gun
  Stutter Fill · Metric Slip · Hemiola Lift · Snap-Back Every 8 …
tests:
  - GAP 1/8 → output < −80 dB for exactly the gap ± 1 ms, no click > −50 dB at the edges
  - CROSS 3:4 places hits every 3 16ths for the stated span; SNAP-BACK aligns all targets on the chosen downbeat ± 1 sample
  - FLIP half-time maps the snare from beats 2/4 to beat 3 and back after N steps
  - RIVALRY: same seed → identical rebel; fight 0 → rebel = grid; fight 1 → syncopation index ≥ threshold and every Nth
    downbeat still shared
  - TAP-MAP stores taps only (no audio buffer is ever created) ; generated target error |actual − target| ≤ 15 per bar

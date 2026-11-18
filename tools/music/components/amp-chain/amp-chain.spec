# spec_id: eravos.component.amp-chain · version 1.0.0 · status built (WD1, 2026-11-16: amp-chain.js + amp-chain.test.mjs; used by wobble-bass)
# rule: eravos.components.spec (small, on its own, documented, shared)
# his words (2026-11-15): "I was saying his sounded centered. Ours rough. … Like I want to make it sound exactly like that." ·
#   (2026-11-16) "the tools need to be broken down as well into their respective components"
identity:
  id: amp-chain ; group: dynamics ; component tool: yes
  job: the growl through an amp with the sub kept clean and centered — LR4 split, lows mono and untouched, highs driven (Character soft →
    gainy), a second LFO-riding filter (Wow), mud cut, presence, de-fizz, a high-pass for the drive's own lows, glue, limiter, safety knee
  extract from: wobble-bass (4.2 AMP) — the move changed nothing: null render 34 / 34 Wobble Bass presets (gate −60 dB), 2026-11-16
used by: wobble-bass
inputs / outputs / limits (built 1.0.0):
  audio in (stereo) → audio out (stereo) · mod in: a control (±0.5) the Wow filter rides ±2 octaves with
  off: the straight path at exactly 1, the amp at exactly 0 — nulls to its input
  variables: on · character 0–1 · drive 0–30 dB · split 60–250 Hz · wow 0–1 · mudCut 0–12 dB · presence 0–12 dB · glue 0–1
  latency: the 4× shaper's and the compressors' look-ahead on the amp path only (off = 0)
rules:
  - never imports a tool; tools import it
  - every numeric control is a modulation destination unless marked fixed
acceptance:
  - amp-chain.test.mjs: the graph it builds (nodes and wires, in order) and the values set, against the code it replaced
  - every tool that assembles it still nulls after any change to it

# spec_id: eravos.fx-spring · version 0.1.0 · status mapped · template eravos.tool/1 (STD.fx)
identity:
  id: eravos.fx-spring ; label: Spring Tank ; domain: music ; category: dub (shown as Dub)
  purpose: the spring reverb: dispersive chirp, boing and drip — the sound of a dub tank hit with a snare.
  related: the SPRING part of Dub Station (dispersive all-pass chirp + feedback combs) · planned space-reverb (a general studio reverb, springs among its types) · fx-gated-reverb (a different room) · technique only
ports:
  in:  in (audio) · mod.decay (±1 → ±1 on Decay) · mod.drip (±1 → ±1 on Drip) · mod.mix (STD.fx) · thump (event: pad:trigger — "kicks" the tank)
  out: out (audio, stereo) · tail (modulation 0..1: the tank's level)
params: springs [1, 2, 3 in parallel] · decay 0.3..5 s · tension 0..1 (shortens echo spacing) · dispersion 0..1 (chirp length) · drip 0..1 (boing / splash on transients) · tone 800..8000 Hz · preHP 40..400 Hz · lowCut 60..400 Hz · drive 0..1 · modulation 0..1 (wobble) · width 0..1 · STD.fx
behaviour:
  - each spring = a chain of N all-pass stages (N = 40..160 by Dispersion), a feedback comb with delay set by Tension and a high-cut for Tone; the chirp comes from the frequency-dependent group delay of the all-pass chain, as in a real helical spring
  - drip: a transient detector on the input adds a short burst of high-frequency, low-gain energy into the chain (the "boing"), scaled by Drip; thump does the same on an event key
  - three springs run with slightly different delays and are mixed to stereo by Width; Modulation moves the comb delay ±0.3 ms at 0.2–1.5 Hz so it never rings the same way twice
  - dry/wet delay-compensated; level-matched at defaults; Drive saturates the input before the tank (a hot send into a tank)
needs: units [music.engine, music.transport, music.tempo, music.meter] · tools [] · permissions [audio_out, audio_in, bus_publish, bus_subscribe]
packs: ships [factory] — Dub Tank · Drippy Splash · Short Surf Spring · Long Boing · Snare Spring Hit · Tight Tank · Wide Triple · Dark Sub Tank
hooks: STD.audio_in ; STD.audio_out ; trigger_in (thump) ; mod_in (decay ; drip ; mix) ; mod_out (tail)
acceptance (fx-spring.test.js):
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - p42 audio survey (node tests/tool-audio.mjs fx-spring): every preset rendered — timing to the sample, pitch to the cent, level never over full scale, Stop all silences it
  - a click: the impulse response shows a chirp — group delay falls monotonically with frequency across 500 Hz–5 kHz
  - decay 2 s: RT60 within ± 20 %
  - drip 0 vs 1 on a snare: energy 2–8 kHz in the first 100 ms is ≥ 6 dB higher at drip 1
  - Mix 50 %: no comb notch deeper than 2 dB
  - tension 1 shortens echo spacing by ≥ 30 % vs tension 0

# dependencies: run node build/planned-deps.mjs — it reads the hooks line above and writes the generated block here (needs the Clear Glass driver; not written by hand)

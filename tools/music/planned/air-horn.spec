# spec_id: eravos.air-horn · version 0.1.0 · status mapped · template eravos.tool/1
identity:
  id: eravos.air-horn ; label: Air Horn ; domain: music ; category: dub (shown as Dub)
  purpose: the sound-system air horn and its cousins: a synthesized horn, siren-blast and hit-stab you can fire from a pad, a key or an event.
  related: the HORN part of Dub Station (hornLevel) · pads (a sample hit) · dub-siren · Rewind (fires on its drop)
ports:
  in:  note_in · trigger (event: pad:trigger / rewind:drop / any hit) · midi_in · mod.pitch (±1 → ±1200 c) · mod.tone (±1 → ±1 octave on the filter)
  out: out (audio, stereo) · env (modulation 0..1: the horn's envelope)
params: type [air horn, train horn, stab, double blast, siren blast] · pitch 150..900 Hz · blasts 1..4 · blastLen 80..800 ms · gap 20..300 ms · chord [single, major 3rd, fifth, cluster] · detune 0..40 c · breath 0..1 (noise) · filter 600..9000 Hz · drive 0..1 · attack · release · tail 0..1 · humanize 0..1 · level
behaviour:
  - a bank of 3–6 detuned square/pulse oscillators in a chord shape through a band-pass and a soft clip, with a noise "air" component and an envelope with a hard attack and a ringing release
  - blasts repeat on the transport or free; each blast has its own slightly random pitch dip (humanize) so a double blast sounds hand-played
  - trigger from Rewind's drop event fires it at the drop's audio time
  - level-matched across types; the stab type is a 60–120 ms hit for stacked use
needs: units [music.engine, music.transport, music.tempo, music.key] · tools [] · permissions [audio_out, midi_in, bus_publish, bus_subscribe]
packs: ships [factory] — Sound System Air Horn · Double Blast · Train Horn · Stab Hit · Siren Blast · Short Rave Horn · Low Truck Horn · Fifth Horn
hooks: STD.note_in ; STD.midi_in ; trigger_in ; STD.audio_out ; mod_in (pitch ; tone) ; mod_out (env)
acceptance (air-horn.test.js):
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - p42 audio survey (node tests/tool-audio.mjs air-horn): every preset rendered — timing to the sample, pitch to the cent, level never over full scale, Stop all silences it
  - pitch at default within 5 c of the set value
  - double blast: two onsets separated by blastLen + gap ± 1 ms
  - trigger event at time t starts the horn within 1 sample of t
  - level-matched: types within ±2 dB RMS
  - Stop all silences within 20 ms with no click larger than −50 dBFS

# dependencies: run node build/planned-deps.mjs — it reads the hooks line above and writes the generated block here (needs the Clear Glass driver; not written by hand)

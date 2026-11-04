# spec_id: eravos.component.note-release · version 1.0.0 · phase P0.3 · status built · kind component (tool: no)
identity:
  id: note-release ; job: let go of a held note (one voice) or of every voice of a note (a pool) — the same few statements the tools each repeated
  lineage: noteOff() of wobble-bass = wub-osc = wub-sub (held note) ; noteOff() of syn-osc = syn-partials (voice pool)
inputs: ac ; gain (AudioParam) + held {note, off} + note + t + release seconds ; or voices[] + note + t + the tool's release(voice, t)
outputs: held.off = t ; the gain held where it is and falling with a time constant of release/4 ; each unreleased voice of the note handed to release()
limits: no state of its own ; t clamps to now ; cancelAndHoldAtTime used when the browser has it
used_by: eravos.wobble-bass, eravos.wub-osc, eravos.wub-sub (releaseHeld) ; eravos.syn-osc, eravos.syn-partials (releaseVoices)
proof: tools/music/components/note-release/note-release.test.mjs (node) — the recorded AudioParam calls equal the five original inline copies ; then tests/null-render.mjs

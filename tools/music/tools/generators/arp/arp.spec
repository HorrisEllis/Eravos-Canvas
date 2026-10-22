# spec_id: eravos.arp · version 1.0.0 · status built · template eravos.tool/1 · map eravos.phase49-map P49.4a
# James, 2026-10-22: "each ;arge tool rebuilt as parts if it can be used by another suite or tool"
identity: id eravos.arp ; label Arp ; domain music ; category generators
  purpose: the arpeggiator as a part. The audit found it inside Retro Poly with no tool for it. Ratio Lattice's arp steps its own
  drone's ratios, which is a different job, and it stays there.
ports:
  in:  note_in (each note held until its time + duration) · midi_in (held until note-off) · chord_in (harmony:chord from a wired
       Chords: its notes held for its bars) · transport_in · every knob (P49.1)
  out: note_out (each step to every instance wired from it)
params: order [up, down, up-down, random, played] · div [1/4, 1/8, 1/16, 1/8t, 1/16t, 1/32] · octaves 1..3 · gate · latch ·
  velocity · transpose
behaviour: Retro Poly's rule. The held notes are sorted (or kept as played) and repeated up the octaves. Down reverses them;
  up-down goes up then down without repeating the ends. On each division of the transport the next note goes to every wired
  instrument, gate × the division long. Triplet divisions fall between 16ths, at their exact times. Latch keeps the last notes
  after they are let go, until new ones come. Its keyboard holds notes by hand. No sound of its own.
acceptance (tests/p49-arp.test.js): a held C-major triad at 1/16 up → C E G C E G… · 2 octaves doubles the run · up-down does not
  repeat the ends · 1/8t gives 12 notes a bar at triplet times · fed by a wired Chords it plays that chord's notes · latch keeps
  playing after release · notes reach only the wired instrument · the tool contract (arp.test.js)

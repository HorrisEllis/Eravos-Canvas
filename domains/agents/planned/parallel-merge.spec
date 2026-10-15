# spec_id: eravos.organism.parallel-merge · version 1.0.0 · phase P38 · status planned · category flow
identity:
  id: eravos.agents.parallel-merge ; label: Fan out / in ; icon: 🔱 ; accent: "#c084fc"
  comp_intent: Send one value to several branches at once and wait for their answers — all, first, or any N — then merge them.
  novelty: Join semantics over the dataflow plane (Each = loop over a list).
engine: fan-out (copies, with branch index in meta) ; join modes all | first | quorum N | timeout with partial ; merge object / array / custom template ; correlation by run id
config: branches ; join mode ; timeout ; merge
hooks: data_in ; data_out per branch (generated) ; data_in per branch ; data_out merged
ui: branch lanes with status
tests: 3 branches, mode all → merged array in branch order ; mode first → first result only, others ignored (logged)

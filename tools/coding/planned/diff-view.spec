# spec_id: eravos.organism.diff-view · version 1.0.0 · phase P38 · status planned · category tools
identity:
  id: eravos.coding.diff-view ; label: Diff ; icon: ⚖ ; accent: "#ffcb6b"
  comp_intent: Compare two texts or JSON values — side by side or inline, word-level highlights — e.g. before/after an AI edit.
  novelty: Myers diff with JSON-aware mode.
engine: Myers line diff + word refinement ; JSON mode (structural, key order ignored) ; ignore whitespace option ; output patch (unified)
config: mode text|json ; ignoreWs ; layout
hooks: data_in a ; data_in b ; data_out patch (text)
ui: side-by-side / inline toggle ; jump to next change
tests: JSON with reordered keys → no changes ; one word changed → one word highlighted

# spec_id: eravos.organism.regex-lab · version 1.0.0 · phase P38 · status planned · category tools
identity:
  id: eravos.coding.regex-lab ; label: Regex ; icon: 🔎 ; accent: "#f78c6c"
  comp_intent: Build a regular expression against real text, see every match and group highlighted, then use it in a pipeline.
  novelty: Live regex with explanation and catastrophic-backtracking guard.
engine: JS RegExp in a Worker with time limit (protects against runaway patterns) ; plain-language explanation of the pattern ; replace preview ; output matches as json
config: pattern ; flags ; replacement
hooks: data_in text ; data_out matches (json) ; data_out replaced (text)
ui: pattern field, flags chips, highlighted sample text, groups table
tests: (a+)+b on 30 a's stops at time limit with a message ; groups listed in order

# spec_id: eravos.organism.variables · version 1.0.0 · phase P38 · status planned · category data
identity:
  id: eravos.agents.variables ; label: Variables ; icon: 🧾 ; accent: "#94a3b8"
  comp_intent: Named values your automations share — counters, lists, last results, settings — like Tasker's global variables, visible and editable.
  novelty: Scoped, typed key-value store with change events (Memory = long-term notes for AI; this = live state).
engine: scopes project|workflow|run ; types text, number, json, list, boolean ; operations set, add, push, pop, toggle, merge, expire after ; change events on ports ; persistence with the project (secrets are NOT allowed here — use ctx.secret tools)
config: variables[] {name, type, scope, value, persist}
hooks: data_in set (json {name, op, value}) ; data_out changed ; data_out value per pinned variable
ui: table with live values, inline edit, history per variable
tests: counter add 1 ×5 → 5 ; list push/pop order ; expire after 1 s clears and emits change

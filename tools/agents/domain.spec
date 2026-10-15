# spec_id: eravos.domain.agents · status BUILDING (1 built: ai-step) · folder tools/agents/  (exe: ERAVOS Library/Mods/Automation/)
domain: 🤖 Automation — AI automation as wired steps: triggers start flows, steps transform data, every run is logged, nothing irreversible happens without an approve step.
mode: Automation
units (toolbar expansion, built only when needed):
    - agents.runner — runs flows as background services
    - agents.log — the run log toolbar group
    - agents.keys — credentials vault (never in projects)
tools (each its own folder + spec; mapped ones in planned/):
    - ⏰ trigger-schedule — Start a flow at times (cron-like) or every N minutes.  [in: — → out: trigger]
    - ⚡ trigger-event — Start a flow when something happens on the canvas (any bus topic) or a file lands.  [in: event → out: trigger, json]
    - 📝 prompt — A prompt template with {slots} filled from inputs.  [in: json, text → out: text]
    - 🧠 llm-call — Send text to a model you configure; get text or JSON back.  [in: text, trigger → out: text, json]
    - 🌐 http-tool — Call an API: method, URL, headers, body.  [in: json, trigger → out: json]
    - 🔧 json-shape — Pick, rename, map and filter JSON.  [in: json → out: json]
    - 🔀 branch — If / else on a condition.  [in: json → out: json ×2]
    - 🔁 each — Run the next steps once per item in a list.  [in: json → out: json]
    - 💾 memory — Keep values between runs (a small key/value store per flow).  [in: json → out: json]
    - ✋ approve — Pause until a person says yes — required before anything irreversible.  [in: json → out: json]
    - 📜 run-log — Every run, every step, inputs and outputs, timing, errors.  [in: event → out: json]
    - 🎵 song-writer — Let a flow write music: genre + seed + mood → a song on the canvas.  [in: json, trigger → out: event]
build order: source tools first (they make something to see), then transforms, then exports; one tool per step, each green before the next.
boundary: nothing in tools/agents/ is read by the shell or another domain; the shell sees only units, modes, needs, packs.

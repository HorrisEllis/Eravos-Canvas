/* eravos.agents.ai-step 1.0.0 — AI Step · spec ai-step.spec (domain agents · AI Automation)
 * One step of an automation that asks an AI model something: a prompt TEMPLATE filled from what arrives on the in port
 * ({{input}}, {{input.some.field}}, {{date}}), sent to the provider you choose — Anthropic, any OpenAI-compatible
 * endpoint (OpenAI, a local server…), or Echo (a dry run that returns the filled prompt, no network) — and the answer
 * sent on as text, or as checked JSON. Keys stay on this computer (ctx.secret, per provider) and are never part of a
 * saved project, preset, backup or export. Every call is logged: provider, model, time, tokens, status.
 * Reliability: time limit (AbortController) · retries with backoff on 429 / 5xx / network errors · Cancel · JSON mode
 * parses the reply (fences tolerated), checks the required keys and makes ONE repair request if they are missing. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function render(tpl, input) {
    const asText = (v) => v === undefined || v === null ? '' : typeof v === 'string' ? v : JSON.stringify(v, null, 2);
    return String(tpl).replace(/\{\{\s*([a-zA-Z_][\w.]*)\s*\}\}/g, (m, path) => {
      if (path === 'date') return new Date().toISOString().slice(0, 10);
      if (path === 'input') return asText(input);
      if (path.startsWith('input.')) { let v = input; for (const k of path.slice(6).split('.')) { if (v == null) break; v = v[k]; } return asText(v); }
      return m;
    });
  }
  function parseJSON(text) {
    const t = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    try { return { ok: true, value: JSON.parse(t) }; } catch (e) {
      const a = t.indexOf('{'), b = t.lastIndexOf('}'), c = t.indexOf('['), d = t.lastIndexOf(']');
      for (const [x, y] of [[a, b], [c, d]]) if (x >= 0 && y > x) { try { return { ok: true, value: JSON.parse(t.slice(x, y + 1)) }; } catch (e2) {} }
      return { ok: false, error: 'the reply is not valid JSON' };
    }
  }
  const missingKeys = (v, keys) => keys.filter(k => !(v && typeof v === 'object' && !Array.isArray(v) && k in v));

  OrganismFactory.define({
    id: 'eravos.agents.ai-step', domain: 'agents', version: '1.0.0', label: 'AI Step', icon: '✦', accent: '#ffb86b', phase: 'P37',
    category: 'AI', blurb: 'Ask an AI model as one step of an automation: a prompt filled from what arrives, any provider, text or checked JSON out.',
    size: { w: 600, h: 620 }, minSize: { w: 400, h: 420 },
    permissions: ['bus_publish', 'bus_subscribe'],
    provides: ['capability.ai'],
    hooks: [
      S.data_in('ai.hook.in', 'in', ['*'], 'fills {{input}} in the prompt'),
      S.data_in('ai.hook.run', 'run', ['trigger'], 'run now'),
      S.data_out('ai.hook.text', 'text', 'text', 'the answer'),
      S.data_out('ai.hook.json', 'json', 'json', 'the answer as checked JSON (JSON mode)'),
      S.data_out('ai.hook.error', 'error', 'text', 'what went wrong, when a run fails'),
    ],
    config: [
      { key: 'provider', type: 'enum', options: ['anthropic', 'openai-compatible', 'echo'], default: 'anthropic', label: 'Provider', group: 'MODEL', hint: 'echo = dry run: returns the filled prompt, no network' },
      { key: 'model', type: 'string', default: 'claude-sonnet-5-5', label: 'Model', group: 'MODEL' },
      { key: 'endpoint', type: 'string', default: 'https://api.openai.com/v1', label: 'Endpoint', group: 'MODEL', hint: 'OpenAI-compatible base URL (e.g. http://localhost:11434/v1 for a local server)' },
      { key: 'temperature', type: 'number', default: 0.7, min: 0, max: 1, step: 0.01, label: 'Temperature', group: 'MODEL' },
      { key: 'maxTokens', type: 'integer', default: 1024, min: 16, max: 16000, step: 1, label: 'Max tokens', group: 'MODEL' },
      { key: 'output', type: 'enum', options: ['text', 'json'], default: 'text', label: 'Answer as', group: 'OUTPUT' },
      { key: 'requiredKeys', type: 'string', default: '', label: 'JSON must have', group: 'OUTPUT', hint: 'comma-separated keys the JSON answer must contain (JSON mode)' },
      { key: 'auto', type: 'boolean', default: false, label: 'Auto', group: 'RUN', hint: 'run every time a new input arrives' },
      { key: 'timeout', type: 'number', default: 60, min: 5, max: 600, step: 1, unit: 's', label: 'Time limit', group: 'RUN' },
      { key: 'retries', type: 'integer', default: 2, min: 0, max: 5, step: 1, label: 'Retries', group: 'RUN', hint: 'on rate limits, server errors and lost connections' },
    ],
    ui_hooks: ['run', 'cancel', 'prompt_edit', 'key_set', 'key_clear', 'clear_log'],
    engine(ctx) {
      const memKeys = {}, getKey = (prov) => ctx.secret('key.' + prov).get() || memKeys[prov] || '';   // memKeys: only if the browser blocks storage
      const P = ctx.params;
      let prompt = 'Summarise this in one sentence:\n\n{{input}}', system = '', input = undefined, busy = null, lastAnswer = null;
      const log = []; const LOG_MAX = 100;
      const out = { text: ctx.dataOut('text', { type: 'text', label: 'answer' }), json: ctx.dataOut('json', { type: 'json', label: 'answer JSON' }), error: ctx.dataOut('error', { type: 'text', label: 'error' }) };
      const note = (e) => { log.push(Object.assign({ at: Date.now() }, e)); while (log.length > LOG_MAX) log.shift(); ctx.emitUI('log', log[log.length - 1]); };
      const plain = (status, body, host) => status === 401 || status === 403 ? 'The key was refused — check it (it is kept on this computer only).'
        : status === 404 ? 'That model or endpoint was not found — check the model name and endpoint.'
        : status === 429 ? 'The provider is rate-limiting — try again in a moment.'
        : status >= 500 ? `The provider had a problem (${status}).`
        : status === 0 ? `Couldn’t reach ${host} — check your connection${/localhost|127\.0\.0\.1/.test(host) ? ' and that the local server allows this page (CORS)' : ''}.`
        : `The request was refused (${status})${body ? ': ' + String(body).slice(0, 160) : ''}.`;

      async function call(text, signal) { // → { text, usage }
        const prov = P.get('provider'), model = P.get('model'), key = getKey(prov), temp = P.get('temperature'), maxT = P.get('maxTokens');
        if (prov === 'echo') return { text, usage: { in: 0, out: 0 }, host: 'echo' };
        const isA = prov === 'anthropic', base = isA ? 'https://api.anthropic.com/v1' : String(P.get('endpoint') || '').replace(/\/+$/, '');
        if (!/^https?:\/\//.test(base)) throw Object.assign(new Error('The endpoint must start with http:// or https://'), { final: true });
        if (isA && !key) throw Object.assign(new Error('Add your Anthropic key first (it is kept on this computer only).'), { final: true });
        const host = base.replace(/^https?:\/\//, '').split('/')[0];
        const url = isA ? base + '/messages' : base + '/chat/completions';
        const headers = { 'content-type': 'application/json' };
        if (isA) Object.assign(headers, { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' });
        else if (key) headers.authorization = 'Bearer ' + key;
        const body = isA ? { model, max_tokens: maxT, temperature: temp, messages: [{ role: 'user', content: text }] }
          : { model, max_tokens: maxT, temperature: temp, messages: (system ? [{ role: 'system', content: system }] : []).concat([{ role: 'user', content: text }]) };
        if (isA && system) body.system = system;
        let r;
        try { r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal }); }
        catch (e) { if (e.name === 'AbortError') throw e; throw Object.assign(new Error(plain(0, '', host)), { retry: true }); }
        if (!r.ok) { let b = ''; try { b = await r.text(); } catch (e) {} throw Object.assign(new Error(plain(r.status, b, host)), { status: r.status, retry: r.status === 429 || r.status >= 500, final: !(r.status === 429 || r.status >= 500) }); }
        const j = await r.json();
        const ans = isA ? (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('') : (((j.choices || [])[0] || {}).message || {}).content || '';
        const usage = isA ? { in: (j.usage || {}).input_tokens || 0, out: (j.usage || {}).output_tokens || 0 } : { in: (j.usage || {}).prompt_tokens || 0, out: (j.usage || {}).completion_tokens || 0 };
        return { text: String(ans), usage, host };
      }
      async function withRetries(text, ctl) {
        let last; const tries = 1 + P.get('retries');
        for (let i = 0; i < tries; i++) {
          if (ctl.signal.aborted) throw Object.assign(new Error('cancelled'), { name: 'AbortError' });
          try { return await call(text, ctl.signal); }
          catch (e) { last = e; if (e.name === 'AbortError' || e.final || !e.retry || i === tries - 1) throw e; note({ status: 'retry', message: e.message, attempt: i + 1 }); await sleep(1000 * Math.pow(2, i)); }
        }
        throw last;
      }
      async function run(why) {
        if (busy) busy.ctl.abort();
        const ctl = new AbortController(), t0 = performance.now(), me = { ctl }; busy = me;
        const limit = setTimeout(() => { me.timedOut = true; ctl.abort(); }, P.get('timeout') * 1000);
        ctx.emitUI('status', { status: 'running', why }); ctx.syncUI();
        const jsonMode = P.get('output') === 'json', req = String(P.get('requiredKeys') || '').split(',').map(s => s.trim()).filter(Boolean);
        let text = render(prompt, input);
        if (jsonMode && P.get('provider') !== 'echo') text += `\n\nReply with JSON only — no prose, no code fences.${req.length ? ' It must have these keys: ' + req.join(', ') + '.' : ''}`;
        try {
          let r = await withRetries(text, ctl), usage = { in: r.usage.in, out: r.usage.out }, value;
          if (jsonMode) {
            let pj = parseJSON(r.text), miss = pj.ok ? missingKeys(pj.value, req) : req;
            if (!pj.ok || miss.length) { // one repair round
              const why2 = !pj.ok ? pj.error : 'missing keys: ' + miss.join(', ');
              note({ status: 'repair', message: why2 });
              const r2 = await withRetries(`${text}\n\nYour previous reply could not be used (${why2}). Previous reply:\n${r.text}\n\nReply again with valid JSON only.`, ctl);
              usage.in += r2.usage.in; usage.out += r2.usage.out; r = r2; pj = parseJSON(r.text); miss = pj.ok ? missingKeys(pj.value, req) : req;
              if (!pj.ok || miss.length) throw Object.assign(new Error('The answer still isn’t usable JSON (' + (!pj.ok ? pj.error : 'missing ' + miss.join(', ')) + ').'), { final: true, raw: r.text });
            }
            value = pj.value;
          }
          if (busy !== me) return;
          lastAnswer = { text: r.text, json: value, at: Date.now() };
          out.text(r.text); if (jsonMode) out.json(value); else { const pj = parseJSON(r.text); if (pj.ok && typeof pj.value === 'object') out.json(pj.value); }
          note({ status: 'ok', provider: P.get('provider'), model: P.get('model'), ms: Math.round(performance.now() - t0), tokensIn: usage.in, tokensOut: usage.out, why });
          ctx.emitUI('status', { status: 'ok', ms: Math.round(performance.now() - t0) });
        } catch (e) {
          if (busy !== me) return;
          const msg = e.name === 'AbortError' ? (me.timedOut ? `No answer within ${P.get('timeout')} s — stopped.` : 'Cancelled.') : e.message;
          out.error(msg); note({ status: 'error', provider: P.get('provider'), model: P.get('model'), ms: Math.round(performance.now() - t0), message: msg });
          ctx.emitUI('status', { status: 'error', message: msg });
        } finally { clearTimeout(limit); if (busy === me) busy = null; ctx.syncUI(); }
      }
      ctx.run = run;
      ctx.dataIn('in', { accepts: ['*'], label: 'input' }, (v) => { input = v; ctx.emitUI('input', { preview: render('{{input}}', v).slice(0, 400) }); if (P.get('auto')) run('input'); });
      ctx.dataIn('run', { accepts: ['trigger'], label: 'run' }, () => run('trigger'));
      ctx.onUI('run', null, () => run('manual'));
      ctx.onUI('cancel', null, () => { if (busy) busy.ctl.abort(); });
      ctx.onUI('prompt_edit', { type: 'object' }, (p) => { if (typeof p.prompt === 'string') prompt = p.prompt.slice(0, 100000); if (typeof p.system === 'string') system = p.system.slice(0, 20000); });
      ctx.onUI('key_set', { type: 'object', required: ['key'] }, (p) => { const k = String(p.key || '').trim(); if (!k) return; const prov = P.get('provider'); if (!ctx.secret('key.' + prov).set(k)) memKeys[prov] = k; ctx.syncUI(); });
      ctx.onUI('key_clear', null, () => { const prov = P.get('provider'); delete memKeys[prov]; ctx.secret('key.' + prov).clear(); ctx.syncUI(); });
      ctx.onUI('clear_log', null, () => { log.length = 0; ctx.syncUI(); });
      P.onChange('provider', () => ctx.syncUI());
      ctx.onSilence && ctx.onSilence((p) => { if (p.hard && busy) busy.ctl.abort(); });
      ctx.saveExtra = () => ({ prompt, system }); // never the key
      ctx.loadExtra = (x) => { if (!x || typeof x.prompt !== 'string') return ctx.fault('MOUNT_005', 'ai step: saved prompt missing'); prompt = x.prompt; system = typeof x.system === 'string' ? x.system : ''; ctx.syncUI(); };
      ctx.stateExtra = () => ({ prompt, system, hasKey: !!getKey(P.get('provider')), busy: !!busy, log: log.slice(-40), answer: lastAnswer, input: input === undefined ? null : render('{{input}}', input).slice(0, 400) });
      ctx.internals = { render, parseJSON, get log() { return log; }, get answer() { return lastAnswer; } };
      return { unmount() { if (busy) busy.ctl.abort(); } };
    },
  });
})();

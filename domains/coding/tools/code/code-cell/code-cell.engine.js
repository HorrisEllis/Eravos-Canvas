/* eravos.coding.code-cell 1.0.0 — Code Cell · spec code-cell.spec (domain coding)
 * You write the body of an async JavaScript function; it receives `input` (whatever arrived on the in port) and `log`.
 * Each run happens in a FRESH Web Worker — its own thread, no access to the page, the canvas or other tools — and is
 * stopped when it passes the time limit or you press Stop. What it returns goes out: objects/arrays/numbers/booleans on
 * "out" (json), strings on "text" and "out". console.log/info/warn/error are captured into the window's log.
 * Network: off by default (fetch, XMLHttpRequest, WebSocket, EventSource and importScripts are removed before your code
 * runs — a convenience barrier, not a security boundary; the spec says so). Runs: ▶ / Ctrl+Enter, a trigger on the
 * "run" port, every new input (Auto), or every N seconds. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const PRELUDE = `
const __fmt = (v) => { if (typeof v === 'string') return v; try { return JSON.stringify(v); } catch (e) { return String(v); } };
const __send = (level, args) => postMessage({ type: 'log', level, text: Array.from(args).map(__fmt).join(' ') });
self.console = { log: (...a) => __send('log', a), info: (...a) => __send('info', a), warn: (...a) => __send('warn', a), error: (...a) => __send('error', a), debug: (...a) => __send('log', a) };
self.onmessage = async (e) => {
  const { code, input, network } = e.data;
  if (!network) { ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts'].forEach(k => { try { self[k] = undefined; } catch (x) {} }); }
  const t0 = performance.now();
  try {
    const fn = new Function('input', 'log', '"use strict"; return (async () => {\\n' + code + '\\n})();');
    let result = await fn(input, (...a) => __send('log', a));
    if (typeof result === 'function' || typeof result === 'symbol') throw new Error('returned a ' + typeof result + ' — return data (text, numbers, objects, lists)');
    if (result !== undefined) { try { result = JSON.parse(JSON.stringify(result)); } catch (x) { throw new Error('the result can’t be sent on: ' + x.message); } }
    postMessage({ type: 'done', result, ms: performance.now() - t0 });
  } catch (err) {
    const m = /<anonymous>:(\\d+):(\\d+)/.exec(String(err && err.stack || ''));
    postMessage({ type: 'error', message: String(err && err.message || err), line: m ? Math.max(1, +m[1] - 3) : null, ms: performance.now() - t0 });
  }
};`;
  const DEFAULT_CODE = "// `input` is whatever arrived on the in port. Return what should go out.\n// log(...) or console.log(...) writes to the log below.\nlog('got', input);\nreturn input;";

  OrganismFactory.define({
    id: 'eravos.coding.code-cell', domain: 'coding', version: '1.0.0', label: 'Code Cell', icon: '⌨', accent: '#7cffb2', phase: 'P37',
    category: 'Code', blurb: 'Write JavaScript that runs in its own sandbox: wire values in, results out — console captured, time limit, stop.',
    size: { w: 600, h: 560 }, minSize: { w: 380, h: 360 },
    permissions: ['bus_publish', 'bus_subscribe'],
    provides: ['capability.code'],
    hooks: [
      S.data_in('code.hook.in', 'in', ['*'], 'the value your code receives as `input`'),
      S.data_in('code.hook.run', 'run', ['trigger'], 'run now'),
      S.data_out('code.hook.out', 'out', 'json', 'what your code returns'),
      S.data_out('code.hook.text', 'text', 'text', 'the result as text'),
    ],
    config: [
      { key: 'auto', type: 'boolean', default: true, label: 'Auto', group: 'RUN', hint: 'run every time a new input arrives' },
      { key: 'every', type: 'number', default: 0, min: 0, max: 3600, step: 1, unit: 's', label: 'Every', group: 'RUN', hint: 'also run every N seconds (0 = off)' },
      { key: 'timeout', type: 'number', default: 2000, min: 100, max: 60000, step: 100, unit: 'ms', label: 'Time limit', group: 'RUN', hint: 'a run that takes longer is stopped' },
      { key: 'network', type: 'boolean', default: false, label: 'Network', group: 'RUN', hint: 'let the code use fetch() — off by default' },
    ],
    ui_hooks: ['run', 'stop', 'code_edit', 'clear_log'],
    engine(ctx) {
      const P = ctx.params;
      let code = DEFAULT_CODE, input = undefined, worker = null, timer = null, running = null, runs = 0, last = null;
      const logs = []; const LOG_MAX = 300;
      const sendOut = ctx.dataOut('out', { type: 'json', label: 'result' }), sendText = ctx.dataOut('text', { type: 'text', label: 'result text' });
      const pushLog = (level, text) => { logs.push({ level, text: String(text).slice(0, 2000), t: Date.now() }); while (logs.length > LOG_MAX) logs.shift(); ctx.emitUI('log', logs[logs.length - 1]); };
      let workerUrl = null, dataUrl = null;
      function makeWorker() {
        if (typeof Worker === 'undefined') throw new Error('this browser has no Web Workers — code can’t run safely here');
        if (!workerUrl) workerUrl = URL.createObjectURL(new Blob([PRELUDE], { type: 'application/javascript' }));
        try { return new Worker(workerUrl); }
        catch (e) { dataUrl = dataUrl || 'data:application/javascript;charset=utf-8,' + encodeURIComponent(PRELUDE); return new Worker(dataUrl); }
      }
      function finish(status, extra) {
        if (timer) { clearTimeout(timer); timer = null; }
        if (worker) { try { worker.terminate(); } catch (e) {} worker = null; }
        const r = running; running = null; if (!r) return;
        last = Object.assign({ status, ms: Math.round(performance.now() - r.t0), at: Date.now() }, extra || {});
        ctx.emitUI('status', last); ctx.syncUI(); r.resolve(last);
      }
      function run(why) {
        if (running) finish('stopped', { message: 'replaced by a new run' });
        return new Promise((resolve) => {
          running = { t0: performance.now(), resolve, why: why || 'manual' }; runs++;
          ctx.emitUI('status', { status: 'running', why: running.why });
          let w; try { w = worker = makeWorker(); } catch (e) { pushLog('error', e.message); finish('error', { message: e.message }); return; }
          w.onmessage = (e) => {
            const m = e.data || {};
            if (m.type === 'log') pushLog(m.level, m.text);
            else if (m.type === 'done') {
              const v = m.result;
              if (v === undefined) pushLog('info', 'returned nothing — nothing sent on');
              else { sendOut(v); if (typeof v === 'string') sendText(v); else sendText(typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)); }
              finish('ok', { result: v, ms: m.ms });
            } else if (m.type === 'error') { pushLog('error', (m.line ? `line ${m.line}: ` : '') + m.message); finish('error', { message: m.message, line: m.line }); }
          };
          w.onerror = (e) => { e.preventDefault && e.preventDefault(); pushLog('error', e.message || 'the code could not start'); finish('error', { message: e.message || 'could not start' }); };
          timer = setTimeout(() => { pushLog('error', `took longer than ${P.get('timeout')} ms — stopped`); finish('timeout', { message: 'time limit' }); }, P.get('timeout'));
          try { w.postMessage({ code, input, network: !!P.get('network') }); }
          catch (e) { pushLog('error', 'the input can’t be passed to the code: ' + e.message); finish('error', { message: e.message }); }
        });
      }
      ctx.run = run;
      ctx.dataIn('in', { accepts: ['*'], label: 'input' }, (v) => { input = v; ctx.emitUI('input', { preview: preview(v) }); if (P.get('auto')) run('input'); });
      ctx.dataIn('run', { accepts: ['trigger'], label: 'run' }, () => run('trigger'));
      let every = null; const arm = () => { if (every) { clearInterval(every); every = null; } const s = P.get('every'); if (s > 0) every = ctx.interval(() => run('timer'), s * 1000); };
      P.onChange('every', arm); arm();
      ctx.onUI('run', null, () => run('manual'));
      ctx.onUI('stop', null, () => { if (running) { pushLog('warn', 'stopped'); finish('stopped'); } });
      ctx.onUI('code_edit', { type: 'object', required: ['code'] }, (p) => { if (typeof p.code !== 'string' || p.code.length > 200000) return ctx.fault('RUNTIME_002', 'code must be text under 200 000 characters'); code = p.code; });
      ctx.onUI('clear_log', null, () => { logs.length = 0; ctx.syncUI(); });
      ctx.onSilence && ctx.onSilence((p) => { if (p.hard && running) finish('stopped', { message: 'Stop all' }); });
      function preview(v) { try { const s = typeof v === 'string' ? v : JSON.stringify(v); return s === undefined ? String(v) : s.slice(0, 400); } catch (e) { return String(v).slice(0, 400); } }
      ctx.saveExtra = () => ({ code });
      ctx.loadExtra = (x) => { if (!x || typeof x.code !== 'string') return ctx.fault('MOUNT_005', 'code cell: saved code missing'); code = x.code; ctx.syncUI(); };
      ctx.stateExtra = () => ({ code, logs: logs.slice(-80), last, running: !!running, input: input === undefined ? null : preview(input) });
      ctx.internals = { get code() { return code; }, get logs() { return logs; }, get last() { return last; }, get runs() { return runs; } };
      return { unmount() { if (running) finish('stopped'); if (every) clearInterval(every); if (workerUrl) URL.revokeObjectURL(workerUrl); } };
    },
  });
})();

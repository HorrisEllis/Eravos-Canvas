/* ERAVOS desktop preload — the only door between the canvas page and the machine (contextIsolation, sandboxed). */
'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('eravosDesktop', {
  info: () => ipcRenderer.invoke('eravos:info'),
  ready: () => ipcRenderer.send('eravos:ready'),
  onFile: (cb) => ipcRenderer.on('eravos:file', (e, f) => cb(f)),
  onPacks: (cb) => ipcRenderer.on('eravos:packs', (e, list) => cb(list)),
  packsDone: () => ipcRenderer.send('eravos:packs-done'),
  fileDone: (id, ok) => ipcRenderer.send('eravos:file-done', { id, ok: !!ok }),
  onSaved: (cb) => ipcRenderer.on('eravos:saved', (e, s) => cb(s)),
  keepPack: (name, data) => ipcRenderer.invoke('eravos:keep-pack', { name, data }),
  openLibrary: (sub) => ipcRenderer.send('eravos:open-library', sub || ''),
  // 3.99 updates (desktop/updater.js): { state: 'available' | 'current' | 'downloading' | 'restarting' | 'error', version, notes, page }
  onUpdate: (cb) => ipcRenderer.on('eravos:update', (e, m) => cb(m)),
  checkUpdate: () => ipcRenderer.invoke('eravos:update-check'),
  // 3.101 states also: 'unpacking' · 'ready' · 'on-close' · 'applied' · 'failed' (with log)
  downloadUpdate: () => ipcRenderer.invoke('eravos:update-download'),
  applyUpdate: () => ipcRenderer.invoke('eravos:update-apply'),
  updateLater: () => ipcRenderer.invoke('eravos:update-later'),
  updateStatus: () => ipcRenderer.invoke('eravos:update-status'),
  openUpdateLog: () => ipcRenderer.send('eravos:update-log'),
});
// ERAVOS Glass (host/glass.js) runs inside the app: tell the page before its scripts run (canvas/runtime/glass-link.js)
{ const g = ipcRenderer.sendSync('eravos:glass'); if (g) contextBridge.exposeInMainWorld('ERAVOS_GLASS', g); }

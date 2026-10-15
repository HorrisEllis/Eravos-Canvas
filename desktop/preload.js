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
});

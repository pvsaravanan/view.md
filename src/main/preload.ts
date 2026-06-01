import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // File dialog & Reading
  openFile: () => ipcRenderer.invoke('open-file-dialog'),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  
  // Shell integration
  openExternal: (url: string) => ipcRenderer.invoke('open-external-url', url),
  
  // OS System theme integration
  getSystemTheme: () => ipcRenderer.invoke('get-system-theme'),
  onThemeChanged: (callback: (isDark: boolean) => void) => {
    const listener = (_event: any, isDark: boolean) => callback(isDark);
    ipcRenderer.on('theme-changed', listener);
    return () => ipcRenderer.removeListener('theme-changed', listener);
  },

  // Incoming files (File Association / Drag and drop)
  onFileOpened: (callback: (filePath: string) => void) => {
    const listener = (_event: any, filePath: string) => callback(filePath);
    ipcRenderer.on('file-opened', listener);
    return () => ipcRenderer.removeListener('file-opened', listener);
  },

  // Frameless window header click controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // Export handlers
  exportPdf: () => ipcRenderer.invoke('export-pdf'),
  exportHtml: (htmlContent: string) => ipcRenderer.invoke('export-html', htmlContent),
});

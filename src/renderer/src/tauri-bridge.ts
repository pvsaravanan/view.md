import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';

const appWindow = getCurrentWindow();

(window as any).electronAPI = {
  openFile: async () => {
    try {
      const res = await invoke<string | null>('open_file_dialog');
      return res;
    } catch (e) {
      console.error('Tauri openFile error:', e);
      return null;
    }
  },
  readFile: async (filePath: string) => {
    try {
      const content = await invoke<string>('read_file', { filePath });
      return { success: true, content, filePath };
    } catch (e: any) {
      return { success: false, error: e.toString() };
    }
  },
  saveFile: async (filePath: string | null, content: string) => {
    try {
      const res = await invoke<string | null>('save_file', { filePath, content });
      return { success: true, filePath: res };
    } catch (e: any) {
      return { success: false, error: e.toString() };
    }
  },
  openExternal: async (url: string) => {
    try {
      await invoke('open_external', { url });
      return true;
    } catch (e) {
      console.error('Tauri openExternal error:', e);
      return false;
    }
  },
  minimize: () => {
    appWindow.minimize();
  },
  maximize: async () => {
    const isMaximized = await appWindow.isMaximized();
    if (isMaximized) {
      appWindow.unmaximize();
    } else {
      appWindow.maximize();
    }
  },
  close: () => {
    appWindow.close();
  },
  onFileOpened: (callback: (filePath: string) => void) => {
    let unlistenFn: (() => void) | null = null;
    listen<string>('file-opened', (event) => {
      callback(event.payload);
    }).then(fn => {
      unlistenFn = fn;
    });
    return () => {
      if (unlistenFn) unlistenFn();
    };
  },
  getSystemTheme: async () => false,
  onThemeChanged: () => () => {},
};

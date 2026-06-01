export interface ElectronAPI {
  openFile: () => Promise<string | null>;
  readFile: (filePath: string) => Promise<{
    success: boolean;
    content?: string;
    filePath?: string;
    error?: string;
  }>;
  openExternal: (url: string) => Promise<boolean>;
  getSystemTheme: () => Promise<boolean>;
  onThemeChanged: (callback: (isDark: boolean) => void) => () => void;
  onFileOpened: (callback: (filePath: string) => void) => () => void;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

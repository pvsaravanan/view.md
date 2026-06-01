import { app, BrowserWindow, ipcMain, dialog, shell, nativeTheme, protocol, net } from 'electron';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';

// Define custom protocol name
const PROTOCOL_NAME = 'view-media';

// Register the custom protocol schemes as secure and bypassing content security policy if needed
protocol.registerSchemesAsPrivileged([
  {
    scheme: PROTOCOL_NAME,
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      corsEnabled: true,
      bypassCSP: true,
    },
  },
]);

let mainWindow: BrowserWindow | null = null;
let fileToOpenOnStartup: string | null = null;

// Determine if we are in dev mode
const isDev = process.env.VITE_DEV_SERVER_URL !== undefined || process.argv.includes('--dev');

// Helper to check and resolve file arguments
function parseFilePathArg(argv: string[]): string | null {
  // Find arguments that could be a file path. Ignore flags starting with -
  const args = argv.filter((arg, idx) => {
    if (idx === 0) return false; // executable path
    if (isDev && idx === 1) return false; // dot path (e.g. '.') in dev
    if (arg.startsWith('-')) return false; // flags
    return true;
  });

  if (args.length > 0) {
    const candidatePath = path.resolve(args[0]);
    try {
      if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
        const ext = path.extname(candidatePath).toLowerCase();
        if (ext === '.md' || ext === '.markdown' || ext === '.txt') {
          return candidatePath;
        }
      }
    } catch (e) {
      console.error('Error verifying startup file arg:', e);
    }
  }
  return null;
}

// Single Instance Lock
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  // Listen for second instance launch
  app.on('second-instance', (event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();

      // Parse the file arg from the second instance's command line
      const fileToOpen = parseFilePathArg(commandLine);
      if (fileToOpen) {
        mainWindow.webContents.send('file-opened', fileToOpen);
      }
    }
  });

  // Save the startup file if double clicked on app startup
  fileToOpenOnStartup = parseFilePathArg(process.argv);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 760,
    minWidth: 800,
    minHeight: 500,
    frame: false, // Frameless window for premium design
    show: false, // Hide until ready to avoid flashing
    backgroundColor: '#070a13', // slate-950 background matches theme
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Set default menu to null (no standard menus to look extremely clean)
  mainWindow.setMenu(null);

  // Load target URL or file
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      
      // If a file was passed on startup, send it to the renderer
      if (fileToOpenOnStartup) {
        setTimeout(() => {
          mainWindow?.webContents.send('file-opened', fileToOpenOnStartup);
        }, 300); // Small delay to let the React app bind listeners
      }
    }
  });

  // Pipe Chromium console messages directly to the terminal stdout for instant debugging
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const levelStr = level === 3 ? 'ERROR' : level === 2 ? 'WARNING' : 'INFO';
    console.log(`[Renderer ${levelStr}] ${message} (${path.basename(sourceId)}:${line})`);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Set up custom media protocol
function registerMediaProtocol() {
  protocol.handle(PROTOCOL_NAME, (request) => {
    try {
      const url = new URL(request.url);
      
      // Decoded path includes potential drive letters (e.g., C:/...)
      let filePath = decodeURIComponent(url.pathname);
      
      // On Windows, paths from URL look like "/C:/path/to/file" - strip the leading slash
      if (filePath.startsWith('/') && filePath.match(/^\/[a-zA-Z]:/)) {
        filePath = filePath.substring(1);
      }
      
      const normalizedPath = path.normalize(filePath);
      
      // Basic security check: ensure file exists
      if (fs.existsSync(normalizedPath)) {
        const fileUrl = pathToFileURL(normalizedPath).toString();
        return net.fetch(fileUrl);
      }
    } catch (error) {
      console.error('Error handling media protocol request:', error);
    }
    
    // Return empty 404 response on failure
    return new Response('File not found', { status: 404 });
  });
}

app.whenReady().then(() => {
  registerMediaProtocol();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handler Registrations

// 1. File Access IPCs
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Markdown Files', extensions: ['md', 'markdown'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('read-file', async (event, filePath: string) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return {
      success: true,
      content,
      filePath
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
});

// 2. Shell Actions
ipcMain.handle('open-external-url', async (event, url: string) => {
  // Add safety check: only open http or https URLs
  if (url.startsWith('http://') || url.startsWith('https://')) {
    await shell.openExternal(url);
    return true;
  }
  return false;
});

// 3. Theme Queries
ipcMain.handle('get-system-theme', () => {
  return nativeTheme.shouldUseDarkColors;
});

// Sync theme changes with the renderer
nativeTheme.on('updated', () => {
  if (mainWindow) {
    mainWindow.webContents.send('theme-changed', nativeTheme.shouldUseDarkColors);
  }
});

// 4. Custom Window Actions (for Frameless window header controls)
ipcMain.on('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  mainWindow?.close();
});

// 5. Export Actions
ipcMain.handle('export-pdf', async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return false;
  
  const { filePath } = await dialog.showSaveDialog(window, {
    title: 'Export as PDF',
    defaultPath: 'document.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  
  if (filePath) {
    try {
      const pdfBuffer = await window.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
      });
      fs.writeFileSync(filePath, pdfBuffer);
      return true;
    } catch (e) {
      console.error('Failed to export PDF', e);
      return false;
    }
  }
  return false;
});

ipcMain.handle('export-html', async (event, htmlContent: string) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return false;

  const { filePath } = await dialog.showSaveDialog(window, {
    title: 'Export as HTML',
    defaultPath: 'document.html',
    filters: [{ name: 'HTML', extensions: ['html'] }]
  });

  if (filePath) {
    try {
      fs.writeFileSync(filePath, htmlContent);
      return true;
    } catch (e) {
      console.error('Failed to export HTML', e);
      return false;
    }
  }
  return false;
});

import { app, BrowserWindow, ipcMain, session } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { Client } from 'ssh2'
import { Notebook_v1_readFile, Notebook_v1_saveFile } from '../services/api/notebook'
import { SFTP_v1_listDirectory, SFTP_v1_downloadFile } from '../services/api/sftp'
import { Launcher_v1_launchExternal } from '../services/api/launcher'
import { AppStore_v1_discoverAvailableApps, AppStore_v1_installExternalApp } from '../services/api/appStore'
import {
  Filesystem_v1_getItemsInPath,
  Filesystem_v1_createFolder,
  Filesystem_v1_createFile,
  Filesystem_v1_deleteItem,
  Filesystem_v1_renameItem,
  Filesystem_v1_readAppFile,
} from '../services/api/filesystem'

// The built directory structure
//
// ├─┬─ dist
// │ ├─┬─ main
// │ │ └── index.js
// │ ├─┬─ preload
// │ │ └── index.js
// │ └── window
//
let win: BrowserWindow | null
const VITE_DEV_SERVER_URL = 'http://localhost:5173'

function createWindow() {
  win = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (!app.isPackaged) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    // In production, load the static HTML file.
    const indexPath = path.join(__dirname, '..', 'window', 'index.html');
    win.loadFile(indexPath);
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  // --- SFTP Connection Management ---
  const sftpConnections = new Map<string, { client: Client, sftp: any }>();

  ipcMain.handle('sftp:connect', (_event, config) => {
    return new Promise((resolve) => {
      const client = new Client();
      const sessionId = `sftp-session-${Date.now()}`;

      client.on('ready', () => {
        client.sftp((err: any, sftp: any) => {
          if (err) {
            resolve({ success: false, error: err.message });
            return;
          }
          sftpConnections.set(sessionId, { client, sftp });
          resolve({ success: true, sessionId });
        });
      });

      client.on('error', (err: any) => {
        resolve({ success: false, error: err.message });
      });

      client.on('close', () => {
        sftpConnections.delete(sessionId);
      });

      client.connect({
        ...config,
        port: parseInt(config.port, 10) || 22,
      });
    });
  });

  ipcMain.handle('sftp:disconnect', (_event, sessionId: string) => {
    const conn = sftpConnections.get(sessionId);
    if (conn) {
      conn.client.end();
      sftpConnections.delete(sessionId);
    }
  });

  ipcMain.handle('sftp:list', (_event, sessionId: string, path: string) => {
    const conn = sftpConnections.get(sessionId);
    if (conn) {
      return SFTP_v1_listDirectory(conn.sftp, path);
    }
    return null; // Or return an error object
  });

  ipcMain.handle('sftp:download', (_event, sessionId: string, path: string) => {
    const conn = sftpConnections.get(sessionId);
    if (conn) {
      return SFTP_v1_downloadFile(conn.sftp, path);
    }
    return null; // Or return an error object
  });

  // Ensure the virtual filesystem directory exists on startup
  const virtualFsPath = path.join(process.cwd(), 'virtual-fs', 'Desktop');
  if (!fs.existsSync(virtualFsPath)) {
    fs.mkdirSync(virtualFsPath, { recursive: true });
  }

  // Register IPC handlers for our new notebook functions
  ipcMain.handle('notebook:readFile', (_event, filePath: string) => {
    return Notebook_v1_readFile(filePath)
  })

  ipcMain.handle('notebook:saveFile', (_event, filePath: string, content: string) => {
    return Notebook_v1_saveFile(filePath, content)
  })

  // Register IPC handlers for our new filesystem functions
  ipcMain.handle('fs:getItemsInPath', (_event, path: string) => {
    return Filesystem_v1_getItemsInPath(path)
  })
  ipcMain.handle('fs:createFolder', (_event, path: string, folderName: string) => {
    return Filesystem_v1_createFolder(path, folderName)
  })
  ipcMain.handle('fs:createFile', (_event, path: string, fileName: string) => {
    return Filesystem_v1_createFile(path, fileName)
  })
  ipcMain.handle('fs:deleteItem', (_event, path: string) => {
    return Filesystem_v1_deleteItem(path)
  })
  ipcMain.handle('fs:renameItem', (_event, path: string, newName: string) => {
    return Filesystem_v1_renameItem(path, newName)
  })
  ipcMain.handle('fs:readAppFile', (_event, path: string) => {
    return Filesystem_v1_readAppFile(path)
  })

  // Register IPC handler for launching external apps
  ipcMain.handle('launcher:launchExternal', (_event, path: string) => {
    return Launcher_v1_launchExternal(path);
  });

  // Register IPC handlers for App Store
  ipcMain.handle('appStore:discover', () => {
    return AppStore_v1_discoverAvailableApps();
  });
  ipcMain.handle('appStore:install', (_event, app) => {
    return AppStore_v1_installExternalApp(app);
  });

  createWindow()
})

import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { setupCaptureHandlers, captureService } from './capture';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 260,
    height: 280,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'hidden',
    frame: false,
    resizable: false,
    transparent: true,
    vibrancy: 'under-window',
    alwaysOnTop: true
  });

  mainWindow.loadFile(path.join(__dirname, '../index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 開発モードでファイル変更を監視
  if (process.argv.includes('--dev')) {
    const watchFiles = [
      path.join(__dirname, '../style.css'),
      path.join(__dirname, '../index.html')
    ];
    
    watchFiles.forEach(file => {
      fs.watchFile(file, () => {
        console.log(`File changed: ${file}`);
        if (mainWindow) {
          mainWindow.webContents.reload();
        }
      });
    });
  }

  // ウィンドウコントロールのIPC設定
  ipcMain.on('window-minimize', () => {
    if (mainWindow) {
      mainWindow.minimize();
    }
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
    if (mainWindow) {
      mainWindow.close();
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
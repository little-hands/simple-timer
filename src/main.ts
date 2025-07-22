import { app, BrowserWindow, ipcMain, Notification } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// 開発環境でのみelectron-reloaderを有効化
if (process.env.NODE_ENV !== 'production') {
  try {
    require('electron-reloader')(module, {
      debug: true,
      watchRenderer: true
    });
  } catch (_) {
    console.log('Error loading electron-reloader');
  }
}

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 180,
    height: 180,
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

  // タイマー終了通知の受信ハンドラー
  ipcMain.on('timer-finished', (event, totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    // 時間表示の生成
    let timeStr = '';
    if (minutes > 0 && seconds > 0) {
        timeStr = `${minutes}分${seconds}秒`;
    } else if (minutes > 0) {
        timeStr = `${minutes}分`;
    } else {
        timeStr = `${seconds}秒`;
    }
    
    // Mac通知センターに表示（音なし）
    const notification = new Notification({
        title: 'タイマー終了',
        body: `${timeStr}のタイマーが終了しました`,
        silent: true
    });
    
    // 通知クリック時にウィンドウをフォーカス
    notification.on('click', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
    
    notification.show();
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
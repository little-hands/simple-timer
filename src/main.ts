import { app, BrowserWindow, ipcMain, Notification, screen } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;

// electron-storeを動的インポート
let store: any;

function createWindow(): void {
  // 保存されたウィンドウ位置を取得
  const savedBounds = store?.get('windowBounds') as { x: number, y: number } | undefined;
  
  mainWindow = new BrowserWindow({
    width: 180,
    height: 180,
    x: savedBounds?.x,
    y: savedBounds?.y,
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

  // ウィンドウが移動されたら位置を保存
  mainWindow.on('moved', () => {
    if (mainWindow && store) {
      const bounds = mainWindow.getBounds();
      store.set('windowBounds', { x: bounds.x, y: bounds.y });
    }
  });

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
}

// フルスクリーンオーバーレイウィンドウを作成
function createOverlayWindow(): void {
  // プライマリディスプレイのサイズを取得
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.bounds;

  overlayWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true
    },
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    fullscreen: false,
    skipTaskbar: true,
    focusable: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    show: false // 最初は非表示
  });

  // MacでのmacOS特有のオーバーレイ設定
  if (process.platform === 'darwin') {
    overlayWindow.setAlwaysOnTop(true, 'screen-saver');
    overlayWindow.setVisibleOnAllWorkspaces(true);
  }

  const overlayPath = path.join(__dirname, '../overlay.html');
  overlayWindow.loadFile(overlayPath);

  // 開発モードでDevToolsを開く
  if (process.argv.includes('--dev')) {
    overlayWindow.webContents.openDevTools({ mode: 'detach' });
  }

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });
}

// タイマー終了通知の受信ハンドラー（グローバル）
function setupIPCHandlers() {
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

  // トランプアニメーション制御のIPC
  ipcMain.on('show-cards-celebration', () => {
    if (overlayWindow) {
      overlayWindow.show();
      overlayWindow.webContents.send('start-cards-animation');
      
      // 6秒後に自動的に隠す
      setTimeout(() => {
        if (overlayWindow) {
          overlayWindow.hide();
        }
      }, 6000);
    }
  });
}

app.whenReady().then(async () => {
  // electron-storeを初期化
  const Store = (await import('electron-store')).default;
  store = new Store();
  
  createWindow();
  // オーバーレイウィンドウも準備
  createOverlayWindow();
  // IPCハンドラー設定
  setupIPCHandlers();
});

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
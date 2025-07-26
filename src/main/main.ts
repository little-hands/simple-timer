/**
 * Electronアプリケーションのメインプロセスエントリーポイント
 * 
 * @description
 * このファイルはアプリケーションの起動とライフサイクル管理を行います。
 * 実際の処理は各責務に応じたクラスに委譲されています：
 * - AppConfigStore: アプリケーション設定の管理
 * - WindowStateStore: ウィンドウ状態の永続化
 * - WindowManager: ウィンドウの作成と管理
 * - IPCHandler: プロセス間通信の処理
 */
import { app, BrowserWindow } from 'electron';
import { AppConfigStore } from './AppConfigStore';
import { WindowStateStore } from './WindowStateStore';
import { TimerWindowManager } from './TimerWindowManager';
import { OverlayWindowManager } from './OverlayWindowManager';
import { SettingsWindowManager } from './SettingsWindowManager';
import { IPCHandler } from './handlers/IPCHandler';

// グローバルインスタンス
let appConfigStore: AppConfigStore;
let windowStateStore: WindowStateStore;
let timerWindowManager: TimerWindowManager;
let overlayWindowManager: OverlayWindowManager;
let settingsWindowManager: SettingsWindowManager;
let ipcHandler: IPCHandler;

/**
 * アプリケーションの初期化を行います
 * 
 * @remarks
 * 各マネージャークラスの初期化と依存関係の注入を行います
 */
async function initializeApp(): Promise<void> {
  // 開発モード判定
  const isDevelopmentMode = process.argv.includes('--dev');
  
  // 設定マネージャーの初期化
  appConfigStore = new AppConfigStore(isDevelopmentMode);
  await appConfigStore.initialize();
  
  // ウィンドウ状態ストアの初期化
  windowStateStore = new WindowStateStore();
  await windowStateStore.initialize();
  
  // ウィンドウマネージャーの初期化
  timerWindowManager = new TimerWindowManager(appConfigStore, windowStateStore, isDevelopmentMode);
  overlayWindowManager = new OverlayWindowManager(appConfigStore, isDevelopmentMode);
  
  // IPCハンドラーの初期化
  ipcHandler = new IPCHandler(timerWindowManager, overlayWindowManager, appConfigStore);
  ipcHandler.setupHandlers();
  
  // ウィンドウの作成
  const savedBounds = windowStateStore.getTimerWindowBounds();
  const timerWindow = timerWindowManager.createWindow(savedBounds);
  overlayWindowManager.createWindow();
  
  // 設定ウィンドウマネージャーの初期化（タイマーウィンドウが必要）
  if (timerWindow) {
    settingsWindowManager = new SettingsWindowManager(timerWindow);
    ipcHandler.setSettingsWindowManager(settingsWindowManager);
  }
}

/**
 * アプリケーション起動時の処理
 */
app.whenReady().then(async () => {
  await initializeApp();
});

/**
 * すべてのウィンドウが閉じられた時の処理
 * 
 * @remarks
 * macOS以外のプラットフォームではアプリケーションを終了します
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * アプリケーションがアクティブ化された時の処理
 * 
 * @remarks
 * macOSでDockアイコンがクリックされた時などに呼ばれます
 */
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const savedBounds = windowStateStore.getTimerWindowBounds();
    timerWindowManager.createWindow(savedBounds);
  }
});


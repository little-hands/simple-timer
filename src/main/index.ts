/**
 * Electronアプリケーションのメインプロセスエントリーポイント
 * 
 * @description
 * このファイルはアプリケーションの起動とライフサイクル管理を行います。
 * 実際の処理は各責務に応じたクラスに委譲されています：
 * - ConfigManager: 設定の永続化と管理
 * - WindowManager: ウィンドウの作成と管理
 * - IPCHandler: プロセス間通信の処理
 */
import { app, BrowserWindow } from 'electron';
import { ConfigManager } from './ConfigManager';
import { WindowManager } from './WindowManager';
import { IPCHandler } from './IPCHandler';

// グローバルインスタンス
let configManager: ConfigManager;
let windowManager: WindowManager;
let ipcHandler: IPCHandler;

/**
 * アプリケーションの初期化を行います
 * 
 * @remarks
 * 各マネージャークラスの初期化と依存関係の注入を行います
 */
async function initializeApp(): Promise<void> {
  // 設定マネージャーの初期化
  configManager = new ConfigManager();
  await configManager.initialize();
  
  // ウィンドウマネージャーの初期化
  windowManager = new WindowManager(configManager);
  
  // IPCハンドラーの初期化
  ipcHandler = new IPCHandler(windowManager, configManager);
  ipcHandler.setupHandlers();
  
  // ウィンドウの作成
  const savedBounds = configManager.getWindowBounds();
  windowManager.createMainWindow(savedBounds);
  windowManager.createOverlayWindow();
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
    const savedBounds = configManager.getWindowBounds();
    windowManager.createMainWindow(savedBounds);
  }
});


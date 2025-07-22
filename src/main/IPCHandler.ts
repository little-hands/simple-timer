/**
 * プロセス間通信（IPC）のハンドリングを担当するクラス
 * 
 * @description
 * このクラスは以下の責務を持ちます：
 * - レンダラープロセスからのIPCイベントの受信と処理
 * - 通知の表示とウィンドウフォーカス管理
 * - ウィンドウ制御コマンドの処理
 * - カードアニメーションの制御
 * 
 * すべてのIPC通信はこのクラスに集約され、
 * WindowManagerを通じて適切なウィンドウ操作を行います。
 */
import { ipcMain, Notification } from 'electron';
import { IPCChannels } from '../types/electron';
import { WindowManager } from './WindowManager';
import { AppConfigManager } from './AppConfigManager';

export class IPCHandler {
  /**
   * IPCHandlerのコンストラクタ
   * 
   * @param windowManager - ウィンドウ管理クラスのインスタンス
   * @param appConfigManager - アプリケーション設定管理クラスのインスタンス
   */
  constructor(
    private windowManager: WindowManager,
    private appConfigManager: AppConfigManager
  ) {}
  
  /**
   * すべてのIPCハンドラーを設定します
   * 
   * @remarks
   * アプリケーション起動時に一度だけ呼び出されます。
   * 各IPCチャンネルに対応するハンドラーを登録します。
   * 
   * @example
   * ```typescript
   * const ipcHandler = new IPCHandler(windowManager, configManager);
   * ipcHandler.setupHandlers();
   * ```
   */
  setupHandlers(): void {
    // タイマー終了通知
    ipcMain.on(IPCChannels.TIMER_FINISHED, (event, totalSeconds: number) => {
      this.handleTimerFinished(totalSeconds);
    });
    
    // ウィンドウ制御
    ipcMain.on(IPCChannels.WINDOW_MINIMIZE, () => {
      this.handleWindowControl('minimize');
    });
    
    ipcMain.on(IPCChannels.WINDOW_MAXIMIZE, () => {
      this.handleWindowControl('maximize');
    });
    
    ipcMain.on(IPCChannels.WINDOW_CLOSE, () => {
      this.handleWindowControl('close');
    });
    
    // カードアニメーション
    ipcMain.on(IPCChannels.SHOW_CARDS_CELEBRATION, () => {
      this.handleCardsCelebration();
    });
  }
  
  /**
   * タイマー終了時の処理を行います
   * 
   * @param totalSeconds - タイマーの総秒数
   * @private
   * 
   * @remarks
   * - Mac通知センターに終了通知を表示
   * - 通知クリック時はメインウィンドウにフォーカス
   * - 通知は音なしで表示（サウンドは別途再生される）
   */
  private handleTimerFinished(totalSeconds: number): void {
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
      const mainWindow = this.windowManager.getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
    
    notification.show();
  }
  
  /**
   * ウィンドウ制御コマンドを処理します
   * 
   * @param action - 実行するアクション（minimize, maximize, close）
   * @private
   * 
   * @remarks
   * メインウィンドウに対する制御のみを行います。
   * オーバーレイウィンドウは対象外です。
   */
  private handleWindowControl(action: 'minimize' | 'maximize' | 'close'): void {
    const mainWindow = this.windowManager.getMainWindow();
    
    if (!mainWindow || mainWindow.isDestroyed()) {
      return;
    }
    
    switch (action) {
      case 'minimize':
        mainWindow.minimize();
        break;
        
      case 'maximize':
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize();
        } else {
          mainWindow.maximize();
        }
        break;
        
      case 'close':
        mainWindow.close();
        break;
    }
  }
  
  /**
   * カードセレブレーションアニメーションを処理します
   * 
   * @private
   * 
   * @remarks
   * - オーバーレイウィンドウを表示
   * - アニメーション開始イベントを送信
   * - 指定時間後に自動的に非表示
   */
  private handleCardsCelebration(): void {
    const overlayWindow = this.windowManager.getOverlayWindow();
    
    if (!overlayWindow || overlayWindow.isDestroyed()) {
      console.error('Overlay window not available for cards celebration');
      return;
    }
    
    // オーバーレイウィンドウを表示
    this.windowManager.showOverlay();
    
    // アニメーション開始イベントを送信
    overlayWindow.webContents.send(IPCChannels.START_CARDS_ANIMATION);
    
    // 設定された時間後に自動的に隠す
    const duration = this.appConfigManager.getCardAnimationDuration();
    setTimeout(() => {
      this.windowManager.hideOverlay();
    }, duration);
  }
  
}
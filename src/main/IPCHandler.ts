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
import { IPCChannels, EffectType } from '../types/electron';
import { MainWindowManager } from './MainWindowManager';
import { OverlayWindowManager } from './OverlayWindowManager';
import { AppConfigStore } from './AppConfigStore';
import { SettingsWindowManager } from './SettingsWindowManager';

export class IPCHandler {
  private settingsWindowManager: SettingsWindowManager | null = null;

  /**
   * IPCHandlerのコンストラクタ
   * 
   * @param mainWindowManager - メインウィンドウ管理クラスのインスタンス
   * @param overlayWindowManager - オーバーレイウィンドウ管理クラスのインスタンス
   * @param appConfigStore - アプリケーション設定ストアクラスのインスタンス
   */
  constructor(
    private mainWindowManager: MainWindowManager,
    private overlayWindowManager: OverlayWindowManager,
    private appConfigStore: AppConfigStore
  ) {}

  /**
   * 設定ウィンドウマネージャーを設定します
   * 
   * @param settingsWindowManager - 設定ウィンドウ管理クラスのインスタンス
   */
  setSettingsWindowManager(settingsWindowManager: SettingsWindowManager): void {
    this.settingsWindowManager = settingsWindowManager;
  }
  
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
    
    // 雪エフェクト
    ipcMain.on(IPCChannels.SHOW_SNOW_EFFECT, () => {
      this.handleSnowEffect();
    });
    
    // 設定管理API
    ipcMain.handle(IPCChannels.GET_APP_CONFIG, () => {
      return this.appConfigStore.getPublicConfig();
    });
    
    ipcMain.handle(IPCChannels.SET_EFFECT_TYPE, async (event, effectType: EffectType) => {
      await this.appConfigStore.setEffectType(effectType);
      return true;
    });

    // 設定ウィンドウ制御
    ipcMain.on(IPCChannels.SHOW_SETTINGS_WINDOW, () => {
      this.handleShowSettingsWindow();
    });

    ipcMain.on(IPCChannels.HIDE_SETTINGS_WINDOW, () => {
      this.handleHideSettingsWindow();
    });
  }
  
  /**
   * タイマー終了時の処理を行います
   * 
   * @param totalSeconds - タイマーの総秒数
   * @private
   * 
   * @remarks
   * - 設定されたエフェクトタイプに応じて処理を分岐
   * - notifier: Mac通知センターへの通知表示
   * - cards: トランプアニメーション表示
   */
  private handleTimerFinished(totalSeconds: number): void {
    const effectType = this.appConfigStore.getEffectType();
    this.executeEffect(effectType, totalSeconds);
  }
  
  /**
   * エフェクトタイプに応じた処理を実行します
   * 
   * @param effectType - 実行するエフェクトタイプ
   * @param totalSeconds - タイマーの総秒数
   * @private
   */
  private executeEffect(effectType: EffectType, totalSeconds: number): void {
    switch (effectType) {
      case 'notifier':
        this.showNotification(totalSeconds);
        break;
      case 'cards':
        this.handleCardsCelebration();
        break;
      case 'snow':
        this.handleSnowEffect();
        break;
    }
  }
  
  /**
   * Mac通知センターに通知を表示します
   * 
   * @param totalSeconds - タイマーの総秒数
   * @private
   * 
   * @remarks
   * - Mac通知センターに終了通知を表示
   * - 通知クリック時はメインウィンドウにフォーカス
   * - 通知は音なしで表示（サウンドは別途再生される）
   */
  private showNotification(totalSeconds: number): void {
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
      const mainWindow = this.mainWindowManager.getWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
    
    notification.show();
  }

  /**
   * 設定ウィンドウの表示を処理します
   * 
   * @private
   */
  private handleShowSettingsWindow(): void {
    if (this.settingsWindowManager) {
      this.settingsWindowManager.show();
    }
  }

  /**
   * 設定ウィンドウの非表示を処理します
   * 
   * @private
   */
  private handleHideSettingsWindow(): void {
    if (this.settingsWindowManager) {
      this.settingsWindowManager.hide();
    }
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
    const mainWindow = this.mainWindowManager.getWindow();
    
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
    const overlayWindow = this.overlayWindowManager.getWindow();
    
    if (!overlayWindow || overlayWindow.isDestroyed()) {
      console.error('Overlay window not available for cards celebration');
      return;
    }
    
    // オーバーレイウィンドウを表示
    this.overlayWindowManager.show();
    
    // アニメーション開始イベントを送信
    overlayWindow.webContents.send(IPCChannels.START_CARDS_ANIMATION);
    
    // 設定された時間後に自動的に隠す
    const duration = this.appConfigStore.getCardAnimationDuration();
    setTimeout(() => {
      this.overlayWindowManager.hide();
    }, duration);
  }
  
  /**
   * 雪エフェクトアニメーションを処理します
   * 
   * @private
   * 
   * @remarks
   * - オーバーレイウィンドウを表示
   * - 雪アニメーション開始イベントを送信
   * - 指定時間後に自動的に非表示
   */
  private handleSnowEffect(): void {
    const overlayWindow = this.overlayWindowManager.getWindow();
    
    if (!overlayWindow || overlayWindow.isDestroyed()) {
      console.error('Overlay window not available for snow effect');
      return;
    }
    
    // OverlayWindowManagerの雪エフェクトメソッドを使用
    this.overlayWindowManager.showSnowEffect();
  }
  
}
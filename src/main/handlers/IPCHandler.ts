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
import { ipcMain } from 'electron';
import { IPCChannels, EffectType } from "../../types/app-types";
import { TimerWindowManager } from '../TimerWindowManager';
import { OverlayWindowManager } from '../OverlayWindowManager';
import { AppConfigStore } from '../AppConfigStore';
import { SettingsWindowManager } from '../SettingsWindowManager';
import { EffectExecutor } from './EffectExecutor';

export class IPCHandler {
  private settingsWindowManager: SettingsWindowManager | null = null;
  private effectExecutor: EffectExecutor;

  /**
   * IPCHandlerのコンストラクタ
   * 
   * @param timerWindowManager - タイマーウィンドウ管理クラスのインスタンス
   * @param overlayWindowManager - オーバーレイウィンドウ管理クラスのインスタンス
   * @param appConfigStore - アプリケーション設定ストアクラスのインスタンス
   */
  constructor(
    private timerWindowManager: TimerWindowManager,
    private overlayWindowManager: OverlayWindowManager,
    private appConfigStore: AppConfigStore
  ) {
    this.effectExecutor = new EffectExecutor(
      timerWindowManager,
      overlayWindowManager,
      appConfigStore
    );
  }

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
    ipcMain.on(IPCChannels.TIMER_FINISHED, async (event, totalSeconds: number) => {
      await this.effectExecutor.executeTimerFinishedEffect(totalSeconds);
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
    
    // ポップアップメッセージ非表示
    ipcMain.on('hide-popup-message', () => {
      this.handleHidePopupMessage();
    });
    
    // オーバーレイクリックスルー設定
    ipcMain.on('set-click-through', (event, enable: boolean) => {
      this.overlayWindowManager.setClickThrough(enable);
    });
    
    // 設定管理API
    ipcMain.handle(IPCChannels.GET_APP_CONFIG, () => {
      return this.appConfigStore.getPublicConfig();
    });
    
    ipcMain.handle(IPCChannels.SET_EFFECT_TYPE, async (event, effectType: EffectType) => {
      await this.appConfigStore.setEffectType(effectType);
      
      // タイマーウィンドウに設定変更を通知
      const timerWindow = this.timerWindowManager.getWindow();
      if (timerWindow && !timerWindow.isDestroyed()) {
        timerWindow.webContents.send(IPCChannels.EFFECT_TYPE_CHANGED, effectType);
      }
      
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
   * タイマーウィンドウに対する制御のみを行います。
   * オーバーレイウィンドウは対象外です。
   */
  private handleWindowControl(action: 'minimize' | 'maximize' | 'close'): void {
    const timerWindow = this.timerWindowManager.getWindow();
    
    if (!timerWindow || timerWindow.isDestroyed()) {
      return;
    }
    
    switch (action) {
      case 'minimize':
        timerWindow.minimize();
        break;
        
      case 'maximize':
        if (timerWindow.isMaximized()) {
          timerWindow.unmaximize();
        } else {
          timerWindow.maximize();
        }
        break;
        
      case 'close':
        timerWindow.close();
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
  private async handleCardsCelebration(): Promise<void> {
    try {
      await this.overlayWindowManager.showCardsCelebration();
    } catch (error) {
      console.error('Failed to handle cards celebration:', error);
    }
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
  private async handleSnowEffect(): Promise<void> {
    try {
      await this.overlayWindowManager.showSnowEffect();
    } catch (error) {
      console.error('Failed to handle snow effect:', error);
    }
  }
  
  /**
   * ポップアップメッセージを処理します
   */
  private async handlePopupMessage(): Promise<void> {
    try {
      await this.overlayWindowManager.showPopupMessage();
    } catch (error) {
      console.error('Failed to handle popup message:', error);
    }
  }
  
  /**
   * ポップアップメッセージの非表示を処理します
   */
  private handleHidePopupMessage(): void {
    this.overlayWindowManager.hidePopupMessage();
  }
}
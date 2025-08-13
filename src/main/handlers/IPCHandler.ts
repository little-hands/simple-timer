/**
 * IPCハンドラークラス
 * レンダラーからのIPCイベントを受信し、各Window Managerに振り分け。
 */
import { ipcMain } from 'electron';
import { IPCChannels, EffectType } from '../../types/app-types';
import { TimerWindowManager } from '../TimerWindowManager';
import { OverlayWindowManager } from '../OverlayWindowManager';
import { AppConfigStore } from '../AppConfigStore';
import { SettingsWindowManager } from '../SettingsWindowManager';
import { NotificationExecutor } from './NotificationExecutor';

export class IPCHandler {
  private settingsWindowManager: SettingsWindowManager | null = null;
  private readonly notificationExecutor: NotificationExecutor;

  /**
   * @param timerWindowManager - タイマーウィンドウ管理
   * @param overlayWindowManager - オーバーレイウィンドウ管理
   * @param appConfigStore - アプリ設定ストア
   */
  constructor(
    private readonly timerWindowManager: TimerWindowManager,
    private readonly overlayWindowManager: OverlayWindowManager,
    private readonly appConfigStore: AppConfigStore
  ) {
    this.notificationExecutor = new NotificationExecutor(timerWindowManager);
  }

  /**
   * 設定ウィンドウマネージャーを設定
   * @param settingsWindowManager - 設定ウィンドウ管理
   */
  setSettingsWindowManager(settingsWindowManager: SettingsWindowManager): void {
    this.settingsWindowManager = settingsWindowManager;
  }

  /**
   * IPCハンドラーを登録
   * アプリ起動時に1回実行
   */
  setupHandlers(): void {
    // タイマー終了通知
    ipcMain.on(IPCChannels.TIMER_FINISHED, async (event, totalSeconds: number) => {
      await this.handleTimerFinished(totalSeconds);
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
   * タイマー終了時処理
   * エフェクトタイプに応じて振り分け
   * @param totalSeconds - タイマー総秒数
   * @private
   */
  private async handleTimerFinished(totalSeconds: number): Promise<void> {
    const effectType = this.appConfigStore.getEffectType();

    switch (effectType) {
      case 'notifier':
        // 通知ロジックはNotificationExecutorに委譲
        await this.notificationExecutor.executeTimerFinishedEffect(totalSeconds);
        break;
      case 'cards':
      case 'snow':
      case 'popup':
        // オーバーレイ系は直接OverlayWindowManagerを呼ぶ
        await this.overlayWindowManager.showOverlayEffect(effectType);
        break;
    }
  }

  /**
   * 設定ウィンドウ表示処理
   * @private
   */
  private handleShowSettingsWindow(): void {
    if (this.settingsWindowManager) {
      this.settingsWindowManager.show();
    }
  }

  /**
   * 設定ウィンドウ非表示処理
   * @private
   */
  private handleHideSettingsWindow(): void {
    if (this.settingsWindowManager) {
      this.settingsWindowManager.hide();
    }
  }

  /**
   * ウィンドウ制御処理
   * @param action - アクション（minimize, maximize, close）
   * @private
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
}

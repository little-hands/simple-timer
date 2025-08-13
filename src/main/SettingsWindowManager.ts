/**
 * 設定ウィンドウ管理クラス
 * モーダル設定ウィンドウのライフサイクルとタイマーウィンドウとの連携を担当。
 */
import { BrowserWindow, screen } from 'electron';
import path from 'path';

export class SettingsWindowManager {
  private settingsWindow: BrowserWindow | null = null;
  private readonly timerWindow: BrowserWindow;

  /**
   * @param timerWindow - タイマーウィンドウ
   */
  constructor(timerWindow: BrowserWindow) {
    this.timerWindow = timerWindow;
  }

  /**
   * 設定ウィンドウを作成・表示
   */
  async show(): Promise<void> {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.show();
      this.settingsWindow.focus();
      return;
    }

    // タイマーウィンドウの位置を取得
    const timerBounds = this.timerWindow.getBounds();
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    // 設定ウィンドウの位置を計算（タイマーウィンドウの中央）
    const settingsWidth = 340;
    const settingsHeight = 541;
    const x = Math.max(
      0,
      Math.min(timerBounds.x + (timerBounds.width - settingsWidth) / 2, screenWidth - settingsWidth)
    );
    const y = Math.max(
      0,
      Math.min(
        timerBounds.y + (timerBounds.height - settingsHeight) / 2,
        screenHeight - settingsHeight
      )
    );

    this.settingsWindow = new BrowserWindow({
      width: settingsWidth,
      height: settingsHeight,
      x: x,
      y: y,
      parent: this.timerWindow,
      modal: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      show: false,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      webPreferences: {
        preload: path.join(__dirname, '../preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // 設定HTMLファイルを読み込み
    await this.settingsWindow.loadFile(path.join(__dirname, '../settings/settings.html'));

    // ウィンドウが準備できたら表示
    this.settingsWindow.once('ready-to-show', () => {
      this.settingsWindow?.show();
    });

    // ウィンドウが閉じられた時の処理
    this.settingsWindow.on('closed', () => {
      this.settingsWindow = null;
    });

    // フォーカスが外れた時に閉じる
    this.settingsWindow.on('blur', () => {
      this.hide();
    });
  }

  /**
   * 設定ウィンドウを非表示
   */
  hide(): void {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.close();
    }
  }
}

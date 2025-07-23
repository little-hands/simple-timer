/**
 * 設定ウィンドウの管理を担当するクラス
 * 
 * @description
 * このクラスは以下の責務を持ちます：
 * - 設定ウィンドウのライフサイクル管理
 * - タイマーウィンドウとの連携
 * - 設定ウィンドウの表示・非表示制御
 */
import { BrowserWindow, screen } from 'electron';
import path from 'path';

export class SettingsWindowManager {
  private settingsWindow: BrowserWindow | null = null;
  private timerWindow: BrowserWindow;

  /**
   * SettingsWindowManagerのコンストラクタ
   * 
   * @param timerWindow - タイマーウィンドウのインスタンス
   */
  constructor(timerWindow: BrowserWindow) {
    this.timerWindow = timerWindow;
  }

  /**
   * 設定ウィンドウを作成・表示します
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
    const settingsWidth = 320;
    const settingsHeight = 480;
    const x = Math.max(0, Math.min(
      timerBounds.x + (timerBounds.width - settingsWidth) / 2,
      screenWidth - settingsWidth
    ));
    const y = Math.max(0, Math.min(
      timerBounds.y + (timerBounds.height - settingsHeight) / 2,
      screenHeight - settingsHeight
    ));

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
        nodeIntegration: false
      }
    });

    // 設定HTMLファイルを読み込み
    await this.settingsWindow.loadFile('src/settings/settings.html');

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
   * 設定ウィンドウを非表示にします
   */
  hide(): void {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.close();
    }
  }

  /**
   * 設定ウィンドウのインスタンスを取得します
   * 
   * @returns 設定ウィンドウのインスタンス（null の場合もある）
   */
  getWindow(): BrowserWindow | null {
    return this.settingsWindow;
  }

  /**
   * 設定ウィンドウのリソースを解放します
   */
  destroy(): void {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.destroy();
      this.settingsWindow = null;
    }
  }
}
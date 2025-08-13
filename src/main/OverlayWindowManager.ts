/**
 * オーバーレイウィンドウ管理クラス
 * フルスクリーン透明ウィンドウでエフェクトを表示。タイマーウィンドウとは独立動作。
 */
import { BrowserWindow, screen } from 'electron';
import * as path from 'path';
import { OVERLAY_WINDOW_CONFIG, EFFECT_DURATION } from './constants';
import { AppConfigStore } from './AppConfigStore';
import { IPCChannels, EffectType } from '../types/app-types';

export class OverlayWindowManager {
  private window: BrowserWindow | null = null;
  private currentHtmlFile: string | null = null;

  /**
   * @param appConfigStore - アプリ設定ストア
   * @param isDevelopmentMode - 開発モードフラグ
   */
  constructor(
    private appConfigStore: AppConfigStore,
    private isDevelopmentMode: boolean
  ) {}

  /**
   * オーバーレイウィンドウを作成
   * @returns 作成したBrowserWindow
   */
  createWindow(): BrowserWindow {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.bounds;

    this.window = new BrowserWindow({
      ...OVERLAY_WINDOW_CONFIG,
      width,
      height,
      webPreferences: {
        ...OVERLAY_WINDOW_CONFIG.webPreferences,
        preload: path.join(__dirname, '../preload.js'),
      },
    });

    // macOS固有の設定
    if (process.platform === 'darwin') {
      this.window.setAlwaysOnTop(true, 'screen-saver');
      this.window.setVisibleOnAllWorkspaces(true);
    }

    const initialHtmlPath = path.join(__dirname, '../overlay/overlay.html');
    this.window.loadFile(initialHtmlPath);
    this.currentHtmlFile = initialHtmlPath;

    // 開発モード時のDevTools
    if (this.isDevelopmentMode) {
      this.window.webContents.openDevTools({ mode: 'detach' });
      console.log('OverlayWindowManager: DevTools opened for overlay window');
    }

    // ウィンドウクローズ時のクリーンアップ
    this.window.on('closed', () => {
      this.window = null;
      this.currentHtmlFile = null;
    });

    return this.window;
  }

  /**
   * オーバーレイウィンドウを表示
   */
  show(): void {
    if (this.window) {
      this.window.show();
    }
  }

  /**
   * オーバーレイウィンドウを非表示
   */
  hide(): void {
    if (this.window) {
      this.window.hide();
    }
  }

  /**
   * 汎用オーバーレイエフェクトを表示
   * @param effectType - エフェクトタイプ（popup, cards, snow等）
   */
  async showOverlayEffect(effectType: string): Promise<void> {
    try {
      // ウィンドウが存在しない場合は作成
      if (!this.window || this.window.isDestroyed()) {
        this.createWindow();
      }
      if (!this.window) {
        throw new Error('Failed to create overlay window');
      }

      // overlay.htmlが読み込まれていることを確認
      if (this.currentHtmlFile !== path.join(__dirname, '../overlay/overlay.html')) {
        await this.window.loadFile(path.join(__dirname, '../overlay/overlay.html'));
        this.currentHtmlFile = path.join(__dirname, '../overlay/overlay.html');
      }
      this.show();

      // EffectManager経由で指定されたエフェクトを表示
      this.window.webContents.send(IPCChannels.START_OVERLAY_EFFECT, effectType);
    } catch (error) {
      console.error(`Failed to show overlay effect: ${effectType}`, error);
    }
  }

  /**
   * クリックスルー設定を変更
   * @param enable - 有効/無効
   */
  setClickThrough(enable: boolean): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.setIgnoreMouseEvents(enable);
      console.log(`OverlayWindowManager: Click-through ${enable ? 'enabled' : 'disabled'}`);
    }
  }
}

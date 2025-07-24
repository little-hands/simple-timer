/**
 * オーバーレイウィンドウの管理を担当するクラス
 * 
 * @description
 * このクラスは以下の責務を持ちます：
 * - カードアニメーション用オーバーレイウィンドウの作成と管理
 * - フルスクリーン透明ウィンドウの表示・非表示制御
 * - 開発モード時のDevTools管理
 * 
 * タイマーウィンドウとは独立して動作し、
 * タイマー終了時のカードアニメーション表示専用です。
 */
import { BrowserWindow, screen } from 'electron';
import * as path from 'path';
import { OVERLAY_WINDOW_CONFIG, EFFECT_DURATION } from './constants';
import { AppConfigStore } from './AppConfigStore';
import { IPCChannels } from '../types/electron';

export class OverlayWindowManager {
  private window: BrowserWindow | null = null;
  
  /**
   * OverlayWindowManagerのコンストラクタ
   * 
   * @param appConfigStore - アプリケーション設定ストアクラスのインスタンス
   * @param isDevelopmentMode - 開発モードかどうか
   */
  constructor(
    private appConfigStore: AppConfigStore,
    private isDevelopmentMode: boolean
  ) {}
  
  /**
   * オーバーレイウィンドウを作成します
   * 
   * @returns 作成されたBrowserWindow
   * 
   * @remarks
   * - フルスクリーンの透明なウィンドウとして作成
   * - カードアニメーション専用
   * - macOS固有の設定を適用（screen-saver レベル）
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
        preload: path.join(__dirname, '../preload.js')
      }
    });
    
    // macOS固有の設定
    if (process.platform === 'darwin') {
      this.window.setAlwaysOnTop(true, 'screen-saver');
      this.window.setVisibleOnAllWorkspaces(true);
    }
    
    this.window.loadFile(path.join(__dirname, '../overlay/overlay.html'));
    
    // 開発モード時のDevTools
    if (this.isDevelopmentMode && this.appConfigStore.getDevSettings()?.openDevTools) {
      this.window.webContents.openDevTools({ mode: 'detach' });
    }
    
    // ウィンドウクローズ時のクリーンアップ
    this.window.on('closed', () => {
      this.window = null;
    });
    
    return this.window;
  }
  
  /**
   * オーバーレイウィンドウを取得します
   * 
   * @returns オーバーレイウィンドウ、存在しない場合はnull
   */
  getWindow(): BrowserWindow | null {
    return this.window;
  }
  
  /**
   * オーバーレイウィンドウを表示します
   * 
   * @remarks
   * オーバーレイウィンドウが存在しない場合は何もしません
   */
  show(): void {
    if (this.window) {
      this.window.show();
    }
  }
  
  /**
   * オーバーレイウィンドウを非表示にします
   * 
   * @remarks
   * オーバーレイウィンドウが存在しない場合は何もしません
   */
  hide(): void {
    if (this.window) {
      this.window.hide();
    }
  }
  
  /**
   * 雪エフェクトを表示します
   * 
   * @remarks
   * - オーバーレイウィンドウを表示
   * - 雪アニメーション開始イベントを送信
   * - 指定時間後に自動的に非表示
   */
  showSnowEffect(): void {
    if (!this.window || this.window.isDestroyed()) {
      console.error('Overlay window not available for snow effect');
      return;
    }
    
    // オーバーレイウィンドウを表示
    this.show();
    
    // 雪アニメーション開始イベントを送信
    this.window.webContents.send(IPCChannels.START_SNOW_ANIMATION);
    
    // 設定された時間後に自動的に隠す
    setTimeout(() => {
      this.hide();
    }, EFFECT_DURATION.SNOW);
  }
  
  /**
   * ポップアップメッセージを表示します
   * 
   * @remarks
   * - popup.htmlを専用で読み込み
   * - ポップアップメッセージ表示
   * - 3秒後に自動的に非表示
   */
  async showPopupMessage(): Promise<void> {
    try {
      // ウィンドウが存在しない場合は作成
      if (!this.window || this.window.isDestroyed()) {
        this.createWindow();
      }
      
      if (!this.window) {
        throw new Error('Failed to create overlay window');
      }
      
      // popup.htmlを読み込み
      await this.window.loadFile(path.join(__dirname, '../overlay/popup.html'));
      
      // オーバーレイウィンドウを表示
      this.show();
      
      // 3秒後に自動的に隠す
      setTimeout(() => {
        this.hide();
      }, 3000);
      
    } catch (error) {
      console.error('Failed to show popup message:', error);
      // フォールバック: コンソールにメッセージ表示
      console.log('✨ Time\'s up ✨');
    }
  }
  
  /**
   * ポップアップメッセージを非表示にします
   * 
   * @remarks
   * ユーザーのクリックやESCキーによる即座消去用
   */
  hidePopupMessage(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.hide();
    }
  }
  
}
/**
 * オーバーレイウィンドウの管理を担当するクラス
 * 
 * @description
 * このクラスは以下の責務を持ちます：
 * - カードアニメーション用オーバーレイウィンドウの作成と管理
 * - フルスクリーン透明ウィンドウの表示・非表示制御
 * - 開発モード時のDevTools管理
 * 
 * メインウィンドウとは独立して動作し、
 * タイマー終了時のカードアニメーション表示専用です。
 */
import { BrowserWindow, screen } from 'electron';
import * as path from 'path';
import { OVERLAY_WINDOW_CONFIG } from './constants';
import { AppConfigManager } from './AppConfigManager';

export class OverlayWindowManager {
  private window: BrowserWindow | null = null;
  
  /**
   * OverlayWindowManagerのコンストラクタ
   * 
   * @param appConfigManager - アプリケーション設定管理クラスのインスタンス
   * @param isDevelopmentMode - 開発モードかどうか
   */
  constructor(
    private appConfigManager: AppConfigManager,
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
      height
    });
    
    // macOS固有の設定
    if (process.platform === 'darwin') {
      this.window.setAlwaysOnTop(true, 'screen-saver');
      this.window.setVisibleOnAllWorkspaces(true);
    }
    
    this.window.loadFile(path.join(__dirname, '../../overlay.html'));
    
    // 開発モード時のDevTools
    if (this.isDevelopmentMode && this.appConfigManager.getDevSettings()?.openDevTools) {
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
  
}
/**
 * Electronウィンドウの作成と管理を担当するクラス
 * 
 * @description
 * このクラスは以下の責務を持ちます：
 * - メインウィンドウとオーバーレイウィンドウの作成
 * - ウィンドウのライフサイクル管理
 * - ウィンドウ間の連携制御
 * - 開発モード時のDevTools管理
 * 
 * ウィンドウの設定値は constants.ts で定義され、
 * 位置情報は ConfigManager を通じて永続化されます。
 */
import { BrowserWindow, screen } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { WindowBounds } from '../types/electron';
import { MAIN_WINDOW_CONFIG, OVERLAY_WINDOW_CONFIG, WATCH_FILES } from './constants';
import { ConfigManager } from './ConfigManager';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private overlayWindow: BrowserWindow | null = null;
  
  /**
   * WindowManagerのコンストラクタ
   * 
   * @param configManager - 設定管理クラスのインスタンス
   */
  constructor(private configManager: ConfigManager) {}
  
  /**
   * メインウィンドウを作成します
   * 
   * @param savedBounds - 保存されたウィンドウ位置（オプション）
   * @returns 作成されたBrowserWindow
   * 
   * @remarks
   * - 保存された位置情報がある場合はその位置に表示
   * - ウィンドウ移動時は自動的に位置を保存
   * - 開発モード時はファイル変更の監視を行う
   * 
   * @example
   * ```typescript
   * const savedBounds = configManager.getWindowBounds();
   * windowManager.createMainWindow(savedBounds);
   * ```
   */
  createMainWindow(savedBounds?: WindowBounds): BrowserWindow {
    this.mainWindow = new BrowserWindow({
      ...MAIN_WINDOW_CONFIG,
      x: savedBounds?.x,
      y: savedBounds?.y,
      webPreferences: {
        ...MAIN_WINDOW_CONFIG.webPreferences,
        preload: path.join(__dirname, '../preload.js')
      }
    });
    
    this.mainWindow.loadFile(path.join(__dirname, '../../index.html'));
    
    // ウィンドウ移動時の位置保存
    this.mainWindow.on('moved', () => {
      if (this.mainWindow) {
        const bounds = this.mainWindow.getBounds();
        this.configManager.saveWindowBounds({ x: bounds.x, y: bounds.y });
      }
    });
    
    // ウィンドウクローズ時のクリーンアップ
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
    
    // 開発モード時のファイル監視
    if (this.isDevelopmentMode()) {
      this.setupFileWatching();
    }
    
    return this.mainWindow;
  }
  
  /**
   * オーバーレイウィンドウを作成します
   * 
   * @returns 作成されたBrowserWindow
   * 
   * @remarks
   * - フルスクリーンの透明なウィンドウとして作成
   * - カードアニメーション専用
   * - macOS固有の設定を適用（screen-saver レベル）
   * 
   * @example
   * ```typescript
   * windowManager.createOverlayWindow();
   * ```
   */
  createOverlayWindow(): BrowserWindow {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.bounds;
    
    this.overlayWindow = new BrowserWindow({
      ...OVERLAY_WINDOW_CONFIG,
      width,
      height
    });
    
    // macOS固有の設定
    if (process.platform === 'darwin') {
      this.overlayWindow.setAlwaysOnTop(true, 'screen-saver');
      this.overlayWindow.setVisibleOnAllWorkspaces(true);
    }
    
    this.overlayWindow.loadFile(path.join(__dirname, '../../overlay.html'));
    
    // 開発モード時のDevTools
    if (this.isDevelopmentMode() && this.configManager.getAppConfig().dev?.openDevTools) {
      this.overlayWindow.webContents.openDevTools({ mode: 'detach' });
    }
    
    // ウィンドウクローズ時のクリーンアップ
    this.overlayWindow.on('closed', () => {
      this.overlayWindow = null;
    });
    
    return this.overlayWindow;
  }
  
  /**
   * メインウィンドウを取得します
   * 
   * @returns メインウィンドウ、存在しない場合はnull
   */
  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }
  
  /**
   * オーバーレイウィンドウを取得します
   * 
   * @returns オーバーレイウィンドウ、存在しない場合はnull
   */
  getOverlayWindow(): BrowserWindow | null {
    return this.overlayWindow;
  }
  
  
  /**
   * オーバーレイウィンドウを表示します
   * 
   * @remarks
   * オーバーレイウィンドウが存在しない場合は何もしません
   */
  showOverlay(): void {
    if (this.overlayWindow) {
      this.overlayWindow.show();
    }
  }
  
  /**
   * オーバーレイウィンドウを非表示にします
   * 
   * @remarks
   * オーバーレイウィンドウが存在しない場合は何もしません
   */
  hideOverlay(): void {
    if (this.overlayWindow) {
      this.overlayWindow.hide();
    }
  }
  
  
  /**
   * 開発モードかどうかを判定します
   * 
   * @returns 開発モードの場合true
   * @private
   */
  private isDevelopmentMode(): boolean {
    return process.argv.includes('--dev');
  }
  
  /**
   * ファイル変更の監視を設定します
   * 
   * @remarks
   * 開発モード時のみ有効。監視対象ファイルが変更されたら
   * メインウィンドウを自動的にリロードします。
   * @private
   */
  private setupFileWatching(): void {
    const config = this.configManager.getAppConfig();
    
    if (!config.dev?.enableFileWatch) {
      return;
    }
    
    WATCH_FILES.forEach(file => {
      const filePath = path.join(__dirname, '..', file);
      
      fs.watchFile(filePath, () => {
        console.log(`File changed: ${filePath}`);
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.reload();
        }
      });
    });
  }
}
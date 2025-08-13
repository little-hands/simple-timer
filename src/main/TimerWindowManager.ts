/**
 * タイマーウィンドウ管理クラス
 * メインウィンドウのライフサイクルと位置保存を管理。オーバーレイはOverlayWindowManagerが担当。
 */
import { BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { WindowBounds } from "../types/app-types";
import { TIMER_WINDOW_CONFIG, WATCH_FILES } from './constants';
import { AppConfigStore } from './AppConfigStore';
import { WindowStateStore } from './WindowStateStore';

export class TimerWindowManager {
  private window: BrowserWindow | null = null;
  
  /**
   * @param appConfigStore - アプリ設定ストア
   * @param windowStateStore - ウィンドウ状態ストア
   * @param isDevelopmentMode - 開発モードフラグ
   */
  constructor(
    private appConfigStore: AppConfigStore,
    private windowStateStore: WindowStateStore,
    private isDevelopmentMode: boolean
  ) {}
  
  /**
   * タイマーウィンドウを作成
   * @param savedBounds - 保存済み位置（オプション）
   * @returns 作成したBrowserWindow
   */
  createWindow(savedBounds?: WindowBounds): BrowserWindow {
    this.window = new BrowserWindow({
      ...TIMER_WINDOW_CONFIG,
      x: savedBounds?.x,
      y: savedBounds?.y,
      webPreferences: {
        ...TIMER_WINDOW_CONFIG.webPreferences,
        preload: path.join(__dirname, '../preload.js')
      }
    });
    
    this.window.loadFile(path.join(__dirname, '../timer/timer.html'));
    
    // ウィンドウ移動時の位置保存
    this.window.on('moved', () => {
      if (this.window) {
        const bounds = this.window.getBounds();
        this.windowStateStore.saveTimerWindowBounds({ x: bounds.x, y: bounds.y });
      }
    });
    
    // ウィンドウクローズ時のクリーンアップ
    this.window.on('closed', () => {
      this.window = null;
    });
    
    // 開発モード時の設定
    if (this.isDevelopmentMode) {
      // DevToolsを開く
      this.window.webContents.openDevTools();
      // ファイル監視を設定
      this.setupFileWatching();
    }
    
    return this.window;
  }
  
  /**
   * タイマーウィンドウを取得
   */
  getWindow(): BrowserWindow | null {
    return this.window;
  }
  
  
  /**
   * 開発モード時のファイル監視設定
   * @private
   */
  private setupFileWatching(): void {
    const devSettings = this.appConfigStore.getDevSettings();
    
    if (!devSettings?.enableFileWatch) {
      return;
    }
    
    WATCH_FILES.forEach(file => {
      const filePath = path.join(__dirname, '..', file);
      
      fs.watchFile(filePath, () => {
        console.log(`File changed: ${filePath}`);
        if (this.window && !this.window.isDestroyed()) {
          this.window.webContents.reload();
        }
      });
    });
  }
}
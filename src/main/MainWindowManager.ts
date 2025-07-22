/**
 * メインウィンドウの管理を担当するクラス
 * 
 * @description
 * このクラスは以下の責務を持ちます：
 * - メインウィンドウの作成とライフサイクル管理
 * - ウィンドウ位置の自動保存
 * - 開発モード時のファイル監視とリロード
 * 
 * ユーザーが操作するメインのタイマーウィンドウのみを担当し、
 * オーバーレイウィンドウは OverlayWindowManager が管理します。
 */
import { BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { WindowBounds } from '../types/electron';
import { MAIN_WINDOW_CONFIG, WATCH_FILES } from './constants';
import { AppConfigStore } from './AppConfigStore';
import { WindowStateStore } from './WindowStateStore';

export class MainWindowManager {
  private window: BrowserWindow | null = null;
  
  /**
   * MainWindowManagerのコンストラクタ
   * 
   * @param appConfigStore - アプリケーション設定ストアクラスのインスタンス
   * @param windowStateStore - ウィンドウ状態ストアのインスタンス
   * @param isDevelopmentMode - 開発モードかどうか
   */
  constructor(
    private appConfigStore: AppConfigStore,
    private windowStateStore: WindowStateStore,
    private isDevelopmentMode: boolean
  ) {}
  
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
   */
  createWindow(savedBounds?: WindowBounds): BrowserWindow {
    this.window = new BrowserWindow({
      ...MAIN_WINDOW_CONFIG,
      x: savedBounds?.x,
      y: savedBounds?.y,
      webPreferences: {
        ...MAIN_WINDOW_CONFIG.webPreferences,
        preload: path.join(__dirname, '../preload.js')
      }
    });
    
    this.window.loadFile(path.join(__dirname, '../../index.html'));
    
    // ウィンドウ移動時の位置保存
    this.window.on('moved', () => {
      if (this.window) {
        const bounds = this.window.getBounds();
        this.windowStateStore.saveMainWindowBounds({ x: bounds.x, y: bounds.y });
      }
    });
    
    // ウィンドウクローズ時のクリーンアップ
    this.window.on('closed', () => {
      this.window = null;
    });
    
    // 開発モード時のファイル監視
    if (this.isDevelopmentMode) {
      this.setupFileWatching();
    }
    
    return this.window;
  }
  
  /**
   * メインウィンドウを取得します
   * 
   * @returns メインウィンドウ、存在しない場合はnull
   */
  getWindow(): BrowserWindow | null {
    return this.window;
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
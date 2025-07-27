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
import { IPCChannels, EffectType } from "../types/app-types";

export class OverlayWindowManager {
  private window: BrowserWindow | null = null;
  private currentHtmlFile: string | null = null;
  
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
   * エフェクトに適したHTMLファイルを確実に読み込む
   */
  private async ensureCorrectHtmlLoaded(effectType: EffectType): Promise<void> {
    if (!this.window) {
      throw new Error('Window must be created before loading HTML');
    }
    
    const htmlFile = effectType === 'popup' ? 'popup.html' : 'overlay.html';
    const htmlPath = path.join(__dirname, `../overlay/${htmlFile}`);
    
    // HTMLファイルが異なる場合のみ読み込み
    if (this.currentHtmlFile !== htmlPath) {
      await this.window.loadFile(htmlPath);
      this.currentHtmlFile = htmlPath;
    }
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
   * カードセレブレーションアニメーションを表示します
   * 
   * @remarks
   * - オーバーレイウィンドウを表示
   * - カードアニメーション開始イベントを送信
   * - 設定された時間後に自動的に非表示
   */
  async showCardsCelebration(): Promise<void> {
    try {
      if (!this.window || this.window.isDestroyed()) {
        this.createWindow();
      }
      
      if (!this.window) {
        throw new Error('Failed to create overlay window');
      }
      
      // 適切なHTMLファイルを読み込み
      await this.ensureCorrectHtmlLoaded('cards');
      
      // オーバーレイウィンドウを表示
      this.show();
      
      // カードアニメーション開始イベントを送信
      this.window.webContents.send(IPCChannels.START_CARDS_ANIMATION);
      
      // 設定された時間後に自動的に隠す
      const duration = this.appConfigStore.getCardAnimationDuration();
      setTimeout(() => {
        this.hide();
      }, duration);
    } catch (error) {
      console.error('Failed to show cards celebration:', error);
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
  async showSnowEffect(): Promise<void> {
    try {
      if (!this.window || this.window.isDestroyed()) {
        this.createWindow();
      }
      
      if (!this.window) {
        throw new Error('Failed to create overlay window');
      }
      
      // 適切なHTMLファイルを読み込み
      await this.ensureCorrectHtmlLoaded('snow');
      
      // オーバーレイウィンドウを表示
      this.show();
      
      // 雪アニメーション開始イベントを送信
      this.window.webContents.send(IPCChannels.START_SNOW_ANIMATION);
      
      // 設定された時間後に自動的に隠す
      setTimeout(() => {
        this.hide();
      }, EFFECT_DURATION.SNOW);
    } catch (error) {
      console.error('Failed to show snow effect:', error);
    }
  }
  
  /**
   * ポップアップメッセージを表示します（新方式）
   * 
   * @remarks
   * - EffectManager経由でpopupエフェクトを表示
   * - HTMLの切り替え不要
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
      
      // overlay.htmlが読み込まれていることを確認
      if (this.currentHtmlFile !== path.join(__dirname, '../overlay/overlay.html')) {
        await this.window.loadFile(path.join(__dirname, '../overlay/overlay.html'));
        this.currentHtmlFile = path.join(__dirname, '../overlay/overlay.html');
      }
      this.show();
      
      // EffectManager経由でポップアップを表示
      this.window.webContents.send(IPCChannels.START_POPUP_ANIMATION);
    } catch (error) {
      console.error('Failed to show popup message:', error);
    }
  }
  
  /**
   * ポップアップメッセージを非表示にします
   */
  hidePopupMessage(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.hide();
    }
  }
  
  /**
   * 汎用オーバーレイエフェクトを表示します
   * 
   * @param effectType - 実行するエフェクトタイプ（popup, cards, snow など）
   * 
   * @remarks
   * - EffectManager経由で指定されたエフェクトを表示
   * - HTMLの切り替え不要
   * - 既存の個別メソッドの汎用版
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
   * オーバーレイウィンドウのクリックスルー設定を変更します
   */
  setClickThrough(enable: boolean): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.setIgnoreMouseEvents(enable);
      console.log(`OverlayWindowManager: Click-through ${enable ? 'enabled' : 'disabled'}`);
    }
  }
}
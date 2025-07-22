/**
 * アプリケーション全体で使用される定数定義
 */
import { AppConfig } from '../types/electron';

/**
 * メインウィンドウの設定
 */
export const MAIN_WINDOW_CONFIG = {
  width: 180,
  height: 180,
  webPreferences: {
    contextIsolation: true,
    nodeIntegration: false
  },
  titleBarStyle: 'hidden' as const,
  frame: false,
  resizable: false,
  transparent: true,
  vibrancy: 'under-window' as const,
  alwaysOnTop: true
};

/**
 * オーバーレイウィンドウの設定
 */
export const OVERLAY_WINDOW_CONFIG = {
  x: 0,
  y: 0,
  webPreferences: {
    contextIsolation: false,
    nodeIntegration: true
  },
  frame: false,
  transparent: true,
  alwaysOnTop: true,
  fullscreen: false,
  skipTaskbar: true,
  focusable: false,
  resizable: false,
  movable: false,
  minimizable: false,
  maximizable: false,
  closable: false,
  show: false
};

/**
 * デフォルトのアプリケーション設定
 */
export const DEFAULT_APP_CONFIG: AppConfig = {
  defaultTimerSeconds: 180, // 3分
  mainWindowSize: {
    width: MAIN_WINDOW_CONFIG.width,
    height: MAIN_WINDOW_CONFIG.height
  },
  cardAnimationDuration: 6000,
  dev: {
    enableFileWatch: true,
    openDevTools: true
  }
};

/**
 * 開発モードで監視するファイル
 */
export const WATCH_FILES = [
  '../style.css',
  '../index.html'
];
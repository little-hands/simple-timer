/**
 * Electron関連の型定義
 */

/**
 * ウィンドウの位置情報
 */
export interface WindowBounds {
  x: number;
  y: number;
}

/**
 * アプリケーション設定
 */
export interface AppConfig {
  /** デフォルトのタイマー時間（秒） */
  defaultTimerSeconds: number;
  /** メインウィンドウのデフォルトサイズ */
  mainWindowSize: {
    width: number;
    height: number;
  };
  /** カードアニメーションの表示時間（ミリ秒） */
  cardAnimationDuration: number;
  /** 開発モード時の設定 */
  dev?: {
    /** ファイル監視を有効にするか */
    enableFileWatch: boolean;
    /** DevToolsを自動で開くか */
    openDevTools: boolean;
  };
}

/**
 * IPC通信のイベント名
 */
export enum IPCChannels {
  // タイマー関連
  TIMER_FINISHED = 'timer-finished',
  
  // ウィンドウ制御
  WINDOW_MINIMIZE = 'window-minimize',
  WINDOW_MAXIMIZE = 'window-maximize',
  WINDOW_CLOSE = 'window-close',
  
  // アニメーション
  SHOW_CARDS_CELEBRATION = 'show-cards-celebration',
  START_CARDS_ANIMATION = 'start-cards-animation'
}


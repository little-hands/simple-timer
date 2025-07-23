/**
 * ウィンドウ状態の永続化ストレージを担当するクラス
 * 
 * @description
 * このクラスは以下の責務を持ちます：
 * - ウィンドウ位置情報の保存と復元
 * - ウィンドウ状態の永続化ストレージ
 * - UI関連の状態データの管理
 * 
 * アプリケーション機能設定は AppConfigManager が担当し、
 * このクラスは純粋にUI状態の永続化のみを扱います。
 */
import { WindowBounds } from '../types/electron';

export class WindowStateStore {
  private store: any; // electron-storeのインスタンス
  
  /**
   * WindowStateStoreのコンストラクタ
   * 
   * @remarks
   * electron-storeは動的インポートで初期化する必要があるため、
   * コンストラクタではなくinitializeメソッドで初期化します
   */
  constructor() {
    this.store = null;
  }
  
  /**
   * WindowStateStoreを初期化します
   * 
   * @returns 初期化が完了したPromise
   * @throws electron-storeのインポートに失敗した場合
   * 
   * @example
   * ```typescript
   * const windowStateStore = new WindowStateStore();
   * await windowStateStore.initialize();
   * ```
   */
  async initialize(): Promise<void> {
    const Store = (await import('electron-store')).default;
    this.store = new Store();
  }
  
  /**
   * 保存されたタイマーウィンドウの位置情報を取得します
   * 
   * @returns 保存されたウィンドウ位置、存在しない場合はundefined
   * 
   * @example
   * ```typescript
   * const bounds = windowStateStore.getTimerWindowBounds();
   * if (bounds) {
   *   console.log(`Window position: ${bounds.x}, ${bounds.y}`);
   * }
   * ```
   */
  getTimerWindowBounds(): WindowBounds | undefined {
    if (!this.store) {
      console.warn('WindowStateStore not initialized');
      return undefined;
    }
    
    return this.store.get('timerWindow.bounds') as WindowBounds | undefined;
  }
  
  /**
   * タイマーウィンドウの位置情報を保存します
   * 
   * @param bounds - 保存するウィンドウ位置情報
   * 
   * @example
   * ```typescript
   * windowStateStore.saveTimerWindowBounds({ x: 100, y: 200 });
   * ```
   */
  saveTimerWindowBounds(bounds: WindowBounds): void {
    if (!this.store) {
      console.warn('WindowStateStore not initialized');
      return;
    }
    
    this.store.set('timerWindow.bounds', bounds);
  }
  
}
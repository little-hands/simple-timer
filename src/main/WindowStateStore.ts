/**
 * ウィンドウ状態の永続化クラス
 * ウィンドウ位置情報の保存・復元を担当。機能設定はAppConfigStoreが管理。
 */
import { WindowBounds } from '../types/app-types';

export class WindowStateStore {
  private store: any; // electron-storeのインスタンス

  constructor() {
    this.store = null;
  }

  /**
   * electron-storeを動的インポートして初期化
   */
  async initialize(): Promise<void> {
    const Store = (await import('electron-store')).default;
    this.store = new Store();
  }

  /**
   * タイマーウィンドウの保存済み位置を取得
   * @returns 位置情報またはundefined
   */
  getTimerWindowBounds(): WindowBounds | undefined {
    if (!this.store) {
      console.warn('WindowStateStore not initialized');
      return undefined;
    }

    return this.store.get('timerWindow.bounds') as WindowBounds | undefined;
  }

  /**
   * タイマーウィンドウの位置を保存
   * @param bounds - 位置情報
   */
  saveTimerWindowBounds(bounds: WindowBounds): void {
    if (!this.store) {
      console.warn('WindowStateStore not initialized');
      return;
    }

    this.store.set('timerWindow.bounds', bounds);
  }
}

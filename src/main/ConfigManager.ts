/**
 * アプリケーション設定の管理を担当するクラス
 * 
 * @description
 * このクラスは以下の責務を持ちます：
 * - アプリケーション設定の永続化と読み込み
 * - ウィンドウ位置情報の保存と復元
 * - デフォルト設定の提供
 * 
 * electron-storeを使用してユーザー設定をローカルに保存します。
 * 設定ファイルは自動的にユーザーのアプリケーションデータディレクトリに保存されます。
 */
import { AppConfig, WindowBounds } from '../types/electron';
import { DEFAULT_APP_CONFIG } from './constants';

export class ConfigManager {
  private store: any; // electron-storeのインスタンス
  
  /**
   * ConfigManagerのコンストラクタ
   * 
   * @remarks
   * electron-storeは動的インポートで初期化する必要があるため、
   * コンストラクタではなくinitializeメソッドで初期化します
   */
  constructor() {
    this.store = null;
  }
  
  /**
   * ConfigManagerを初期化します
   * 
   * @returns 初期化が完了したPromise
   * @throws electron-storeのインポートに失敗した場合
   * 
   * @example
   * ```typescript
   * const configManager = new ConfigManager();
   * await configManager.initialize();
   * ```
   */
  async initialize(): Promise<void> {
    const Store = (await import('electron-store')).default;
    this.store = new Store();
  }
  
  /**
   * 保存されたウィンドウ位置情報を取得します
   * 
   * @returns 保存されたウィンドウ位置、存在しない場合はundefined
   * 
   * @example
   * ```typescript
   * const bounds = configManager.getWindowBounds();
   * if (bounds) {
   *   console.log(`Window position: ${bounds.x}, ${bounds.y}`);
   * }
   * ```
   */
  getWindowBounds(): WindowBounds | undefined {
    if (!this.store) {
      console.warn('ConfigManager not initialized');
      return undefined;
    }
    
    return this.store.get('windowBounds') as WindowBounds | undefined;
  }
  
  /**
   * ウィンドウ位置情報を保存します
   * 
   * @param bounds - 保存するウィンドウ位置情報
   * 
   * @example
   * ```typescript
   * configManager.saveWindowBounds({ x: 100, y: 200 });
   * ```
   */
  saveWindowBounds(bounds: WindowBounds): void {
    if (!this.store) {
      console.warn('ConfigManager not initialized');
      return;
    }
    
    this.store.set('windowBounds', bounds);
  }
  
  /**
   * アプリケーション設定を取得します
   * 
   * @returns アプリケーション設定（保存された設定とデフォルト設定のマージ）
   * 
   * @remarks
   * 保存された設定が部分的な場合、デフォルト設定で補完されます
   * 
   * @example
   * ```typescript
   * const config = configManager.getAppConfig();
   * console.log(`Default timer: ${config.defaultTimerSeconds} seconds`);
   * ```
   */
  getAppConfig(): AppConfig {
    if (!this.store) {
      console.warn('ConfigManager not initialized, returning defaults');
      return DEFAULT_APP_CONFIG;
    }
    
    const savedConfig = this.store.get('appConfig') as Partial<AppConfig> | undefined;
    
    // 保存された設定とデフォルト設定をマージ
    return {
      ...DEFAULT_APP_CONFIG,
      ...(savedConfig || {})
    };
  }
  
  
}
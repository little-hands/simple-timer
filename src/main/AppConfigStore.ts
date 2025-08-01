/**
 * アプリケーション設定の管理を担当するクラス
 * 
 * @description
 * このクラスは以下の責務を持ちます：
 * - アプリケーション機能設定の提供
 * - デフォルト設定値の管理
 * - 開発モード設定の管理
 * 
 * UI状態（ウィンドウ位置など）は WindowStateStore が担当し、
 * このクラスは純粋にアプリケーションの動作設定のみを扱います。
 */
import { AppConfig, EffectType } from "../types/app-types";
import { DEFAULT_APP_CONFIG } from './constants';

export class AppConfigStore {
  private store: any; // electron-storeのインスタンス
  private isDevelopmentMode: boolean;
  
  /**
   * AppConfigStoreのコンストラクタ
   * 
   * @param isDevelopmentMode - 開発モードかどうか
   * 
   * @remarks
   * electron-storeは動的インポートで初期化する必要があるため、
   * コンストラクタではなくinitializeメソッドで初期化します
   */
  constructor(isDevelopmentMode: boolean = false) {
    this.store = null;
    this.isDevelopmentMode = isDevelopmentMode;
  }
  
  /**
   * AppConfigStoreを初期化します
   * 
   * @returns 初期化が完了したPromise
   * @throws electron-storeのインポートに失敗した場合
   * 
   * @example
   * ```typescript
   * const configStore = new AppConfigStore();
   * await configStore.initialize();
   * ```
   */
  async initialize(): Promise<void> {
    const Store = (await import('electron-store')).default;
    this.store = new Store();
  }
  
  /**
   * デフォルトのタイマー時間を取得します（秒単位）
   * 
   * @returns デフォルトタイマー時間（秒）
   * 
   * @remarks
   * 開発モード時は1秒、通常時は設定値を返します
   * 
   * @example
   * ```typescript
   * const seconds = configStore.getDefaultTimerSeconds(); // 180 または 1（開発モード）
   * ```
   */
  getDefaultTimerSeconds(): number {
    // 開発モード時は1秒を返す
    if (this.isDevelopmentMode) {
      return 1;
    }
    const config = this.getAppConfig();
    return config.defaultTimerSeconds;
  }
  
  /**
   * カードアニメーションの表示時間を取得します（ミリ秒単位）
   * 
   * @returns アニメーション表示時間（ミリ秒）
   * 
   * @example
   * ```typescript
   * const duration = configStore.getCardAnimationDuration(); // 6000
   * ```
   */
  getCardAnimationDuration(): number {
    const config = this.getAppConfig();
    return config.cardAnimationDuration;
  }
  
  /**
   * 開発モード設定を取得します
   * 
   * @returns 開発モード設定、設定がない場合はデフォルト値
   * 
   * @example
   * ```typescript
   * const devSettings = configStore.getDevSettings();
   * if (devSettings.enableFileWatch) {
   *   setupFileWatching();
   * }
   * ```
   */
  getDevSettings(): AppConfig['dev'] {
    const config = this.getAppConfig();
    return config.dev || DEFAULT_APP_CONFIG.dev;
  }
  
  /**
   * エフェクトタイプを取得します
   * 
   * @returns 現在設定されているエフェクトタイプ
   * 
   * @example
   * ```typescript
   * const effectType = configStore.getEffectType(); // 'notifier' | 'cards'
   * ```
   */
  getEffectType(): EffectType {
    const config = this.getAppConfig();
    return config.effectType;
  }
  
  /**
   * エフェクトタイプを設定・保存します
   * 
   * @param effectType - 設定するエフェクトタイプ
   * @throws AppConfigStoreが初期化されていない場合
   * 
   * @example
   * ```typescript
   * await configStore.setEffectType('cards');
   * ```
   */
  async setEffectType(effectType: EffectType): Promise<void> {
    if (!this.store) {
      throw new Error('AppConfigStore not initialized');
    }
    
    const currentConfig = this.getAppConfig();
    const updatedConfig = { ...currentConfig, effectType };
    this.store.set('appConfig', updatedConfig);
  }
  
  /**
   * レンダラープロセスに公開するための設定を取得します
   * 
   * @returns レンダラーで利用可能なアプリケーション設定
   * 
   * @remarks
   * 開発モード時はdefaultTimerSecondsを1秒に上書きします
   * 
   * @example
   * ```typescript
   * const publicConfig = configStore.getPublicConfig();
   * ```
   */
  getPublicConfig(): AppConfig {
    const config = this.getAppConfig();
    
    // 開発モード時はデフォルトタイマー秒数を1秒に上書き
    if (this.isDevelopmentMode) {
      return {
        ...config,
        defaultTimerSeconds: 1
      };
    }
    
    return config;
  }
  
  
  /**
   * 完全なアプリケーション設定を取得します
   * 
   * @returns アプリケーション設定（保存された設定とデフォルト設定のマージ）
   * @private
   * 
   * @remarks
   * 保存された設定が部分的な場合、デフォルト設定で補完されます
   */
  private getAppConfig(): AppConfig {
    if (!this.store) {
      console.warn('AppConfigStore not initialized, returning defaults');
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
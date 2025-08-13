/**
 * アプリケーション設定の管理クラス
 * 機能設定とデフォルト値を管理。UI状態はWindowStateStoreが担当。
 */
import { AppConfig, EffectType } from "../types/app-types";
import { DEFAULT_APP_CONFIG } from './constants';

export class AppConfigStore {
  private store: any; // electron-storeのインスタンス
  private isDevelopmentMode: boolean;
  
  /**
   * @param isDevelopmentMode - 開発モードフラグ
   */
  constructor(isDevelopmentMode: boolean = false) {
    this.store = null;
    this.isDevelopmentMode = isDevelopmentMode;
  }
  
  /**
   * electron-storeを動的インポートして初期化
   */
  async initialize(): Promise<void> {
    const Store = (await import('electron-store')).default;
    this.store = new Store();
  }
  
  /**
   * 開発モード設定を取得
   */
  getDevSettings(): AppConfig['dev'] {
    const config = this.getAppConfig();
    return config.dev || DEFAULT_APP_CONFIG.dev;
  }
  
  /**
   * 現在のエフェクトタイプを取得
   */
  getEffectType(): EffectType {
    const config = this.getAppConfig();
    return config.effectType;
  }
  
  /**
   * エフェクトタイプを保存
   * @param effectType - 新しいエフェクトタイプ
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
   * レンダラー向け設定を取得
   * 開発モード時はタイマーを1秒に上書き
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
   * 保存済み設定とデフォルト設定をマージして取得
   * @private
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
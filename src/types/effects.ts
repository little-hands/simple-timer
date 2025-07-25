/**
 * エフェクトの共通インターフェース
 * 各エフェクトはこのインターフェースを実装することで統一的に管理される
 */
export interface IEffect {
  /** エフェクトの一意識別子 */
  readonly id: string;
  
  /** エフェクトを開始する */
  start(): Promise<void>;
  
  /** エフェクトを停止する */
  stop(): Promise<void>;
  
  /** エフェクトのリソースをクリーンアップする */
  cleanup(): void;
  
  /** エフェクトが現在アクティブかどうか */
  isActive(): boolean;
}

/**
 * エフェクトの種類
 */
export type EffectType = 'cards' | 'snow' | 'popup';

/**
 * エフェクト作成のためのファクトリーインターフェース
 */
export interface IEffectFactory {
  createEffect(type: EffectType, container: HTMLElement): IEffect;
}
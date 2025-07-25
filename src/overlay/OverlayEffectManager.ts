import { IEffect, EffectType } from '../types/effects.js';
import { PopupEffect } from './effects/PopupEffect.js';

/**
 * オーバーレイエフェクトを統一的に管理するマネージャー
 * 各エフェクトの独立性を保ちながら、ライフサイクルを制御する
 */
export class OverlayEffectManager {
  private activeEffects = new Map<EffectType, IEffect>();
  private containers = new Map<EffectType, HTMLElement>();
  
  constructor() {
    console.log('OverlayEffectManager: Initializing');
    this.initializeContainers();
  }
  
  /**
   * オーバーレイを完全透過（クリックスルー）にする
   */
  private setClickThrough(enable: boolean): void {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI && electronAPI.setClickThrough) {
      electronAPI.setClickThrough(enable);
      console.log(`OverlayEffectManager: Click-through ${enable ? 'enabled' : 'disabled'}`);
    }
  }
  
  /**
   * 各エフェクト用のコンテナを初期化
   */
  private initializeContainers(): void {
    // 各エフェクトゾーンへの参照を保持
    const zones: Record<EffectType, string> = {
      cards: 'cards-zone',
      snow: 'snow-zone', 
      popup: 'popup-zone'
    };
    
    for (const [type, id] of Object.entries(zones)) {
      const container = document.getElementById(id);
      if (container) {
        this.containers.set(type as EffectType, container);
        console.log(`OverlayEffectManager: Container initialized for ${type}`);
      } else {
        console.warn(`OverlayEffectManager: Container not found for ${type}`);
      }
    }
  }
  
  /**
   * エフェクトを表示する（既存のものは自動的に停止）
   */
  async showEffect(type: EffectType): Promise<void> {
    console.log(`OverlayEffectManager: Showing effect ${type}`);
    
    // エフェクト表示時はクリックスルーを無効化
    this.setClickThrough(false);
    
    // 既存の同じタイプのエフェクトを停止
    await this.stopEffect(type);
    
    // コンテナ取得
    const container = this.containers.get(type);
    if (!container) {
      console.error(`OverlayEffectManager: No container for ${type}`);
      return;
    }
    
    // 新しいエフェクトを作成・開始
    const effect = this.createEffect(type, container);
    this.activeEffects.set(type, effect);
    
    try {
      await effect.start();
      console.log(`OverlayEffectManager: Effect ${type} started successfully`);
    } catch (error) {
      console.error(`OverlayEffectManager: Failed to start ${type}`, error);
      this.activeEffects.delete(type);
    }
  }
  
  /**
   * エフェクトを停止する
   */
  async stopEffect(type: EffectType): Promise<void> {
    const effect = this.activeEffects.get(type);
    if (effect) {
      console.log(`OverlayEffectManager: Stopping effect ${type}`);
      try {
        await effect.stop();
      } catch (error) {
        console.error(`OverlayEffectManager: Error stopping ${type}`, error);
      } finally {
        effect.cleanup();
        this.activeEffects.delete(type);
        
        // すべてのエフェクトが停止した場合、クリックスルーを有効化
        if (this.activeEffects.size === 0) {
          this.setClickThrough(true);
        }
      }
    }
  }
  
  /**
   * すべてのエフェクトを停止する
   */
  async stopAllEffects(): Promise<void> {
    console.log('OverlayEffectManager: Stopping all effects');
    const promises: Promise<void>[] = [];
    
    for (const type of this.activeEffects.keys()) {
      promises.push(this.stopEffect(type));
    }
    
    await Promise.all(promises);
  }
  
  /**
   * エフェクトインスタンスを作成する
   */
  private createEffect(type: EffectType, container: HTMLElement): IEffect {
    switch (type) {
      case 'popup':
        return new PopupEffect(container);
      
      case 'cards':
        // TODO: CardsEffectクラスを実装
        throw new Error('CardsEffect not implemented yet');
        
      case 'snow':
        // TODO: SnowEffectクラスを実装
        throw new Error('SnowEffect not implemented yet');
        
      default:
        throw new Error(`Unknown effect type: ${type}`);
    }
  }
  
  /**
   * 指定したエフェクトがアクティブかどうか
   */
  isEffectActive(type: EffectType): boolean {
    const effect = this.activeEffects.get(type);
    return effect ? effect.isActive() : false;
  }
}
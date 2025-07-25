import { IEffect } from '../../types/effects.js';

/**
 * ポップアップエフェクトの実装
 * タイマー終了時にメッセージを表示する
 */
export class PopupEffect implements IEffect {
  readonly id: string;
  private container: HTMLElement;
  private active: boolean = false;
  private autoHideTimer?: NodeJS.Timeout;
  
  constructor(container: HTMLElement) {
    this.id = `popup-${Date.now()}`;
    this.container = container;
  }
  
  async start(): Promise<void> {
    console.log(`PopupEffect[${this.id}]: Starting`);
    
    // 既存のコンテンツをクリア
    this.cleanup();
    
    // ポップアップHTML作成
    this.container.innerHTML = `
      <div class="popup-content" id="popup-content-${this.id}">
        <div class="popup-message">
          <span class="popup-icon">⏰</span>
          <span class="popup-text">Time's up!</span>
        </div>
      </div>
    `;
    
    // クリック時の非表示イベント追加
    const popupContent = document.getElementById(`popup-content-${this.id}`);
    if (popupContent) {
      popupContent.addEventListener('click', () => {
        console.log(`PopupEffect[${this.id}]: Clicked, hiding`);
        this.stop();
      });
      
      // ポインターイベントを有効化（クリック可能にする）
      popupContent.style.pointerEvents = 'auto';
      popupContent.style.cursor = 'pointer';
    }
    
    // アクティブ状態に
    this.active = true;
    
    // 5秒後に自動非表示
    this.autoHideTimer = setTimeout(() => {
      console.log(`PopupEffect[${this.id}]: Auto-hiding`);
      this.stop();
    }, 5000);
  }
  
  async stop(): Promise<void> {
    console.log(`PopupEffect[${this.id}]: Stopping`);
    
    // フェードアウトアニメーション（後で実装）
    this.container.style.opacity = '0';
    
    // アニメーション完了待ち
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // クリーンアップ
    this.cleanup();
    this.active = false;
  }
  
  cleanup(): void {
    console.log(`PopupEffect[${this.id}]: Cleanup`);
    
    // タイマークリア
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = undefined;
    }
    
    // DOM クリア
    this.container.innerHTML = '';
    this.container.style.opacity = '1';
  }
  
  isActive(): boolean {
    return this.active;
  }
}
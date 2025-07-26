/**
 * タイマー終了時のエフェクト実行を担当するクラス
 * 
 * @description
 * このクラスは以下の責務を持ちます：
 * - エフェクトタイプに応じた適切なエフェクトの実行
 * - Mac通知センターへの通知表示
 * - 各種アニメーションエフェクトの制御
 * 
 * 設定されたエフェクトタイプ（notifier/cards/snow/popup）に応じて
 * 適切なエフェクトを実行し、タイマー終了をユーザーに通知します。
 */
import { Notification } from 'electron';
import { EffectType } from "../../types/app-types";
import { TimerWindowManager } from '../TimerWindowManager';
import { OverlayWindowManager } from '../OverlayWindowManager';
import { AppConfigStore } from '../AppConfigStore';

export class EffectExecutor {
  /**
   * EffectExecutorのコンストラクタ
   * 
   * @param timerWindowManager - タイマーウィンドウ管理クラスのインスタンス
   * @param overlayWindowManager - オーバーレイウィンドウ管理クラスのインスタンス
   * @param appConfigStore - アプリケーション設定ストアクラスのインスタンス
   */
  constructor(
    private timerWindowManager: TimerWindowManager,
    private overlayWindowManager: OverlayWindowManager,
    private appConfigStore: AppConfigStore
  ) {}

  /**
   * タイマー終了時のエフェクトを実行します
   * 
   * @param totalSeconds - タイマーの総秒数
   * 
   * @remarks
   * - 設定されたエフェクトタイプに応じて処理を分岐
   * - notifier: Mac通知センターへの通知表示
   * - cards: トランプアニメーション表示
   * - snow: 雪エフェクトアニメーション表示
   * - popup: ポップアップメッセージ表示
   */
  async executeTimerFinishedEffect(totalSeconds: number): Promise<void> {
    const effectType = this.appConfigStore.getEffectType();
    await this.executeEffect(effectType, totalSeconds);
  }
  
  /**
   * エフェクトタイプに応じた処理を実行します
   * 
   * @param effectType - 実行するエフェクトタイプ
   * @param totalSeconds - タイマーの総秒数
   * @private
   */
  private async executeEffect(effectType: EffectType, totalSeconds: number): Promise<void> {
    switch (effectType) {
      case 'notifier':
        this.showNotification(totalSeconds);
        break;
      case 'cards':
        await this.executeCardsCelebration();
        break;
      case 'snow':
        await this.executeSnowEffect();
        break;
      case 'popup':
        await this.executePopupMessage();
        break;
    }
  }
  
  /**
   * Mac通知センターに通知を表示します
   * 
   * @param totalSeconds - タイマーの総秒数
   * @private
   * 
   * @remarks
   * - Mac通知センターに終了通知を表示
   * - 通知クリック時はタイマーウィンドウにフォーカス
   * - 通知は音なしで表示（サウンドは別途再生される）
   */
  private showNotification(totalSeconds: number): void {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    // 時間表示の生成
    let timeStr = '';
    if (minutes > 0 && seconds > 0) {
      timeStr = `${minutes}分${seconds}秒`;
    } else if (minutes > 0) {
      timeStr = `${minutes}分`;
    } else {
      timeStr = `${seconds}秒`;
    }
    
    // Mac通知センターに表示（音なし）
    const notification = new Notification({
      title: 'タイマー終了',
      body: `${timeStr}のタイマーが終了しました`,
      silent: true
    });
    
    // 通知クリック時にウィンドウをフォーカス
    notification.on('click', () => {
      const timerWindow = this.timerWindowManager.getWindow();
      if (timerWindow && !timerWindow.isDestroyed()) {
        timerWindow.show();
        timerWindow.focus();
      }
    });
    
    notification.show();
  }
  
  /**
   * カードセレブレーションアニメーションを実行します
   * 
   * @private
   * 
   * @remarks
   * - オーバーレイウィンドウを表示
   * - アニメーション開始イベントを送信
   * - 指定時間後に自動的に非表示
   */
  private async executeCardsCelebration(): Promise<void> {
    try {
      await this.overlayWindowManager.showCardsCelebration();
    } catch (error) {
      console.error('Failed to execute cards celebration:', error);
    }
  }
  
  /**
   * 雪エフェクトアニメーションを実行します
   * 
   * @private
   * 
   * @remarks
   * - オーバーレイウィンドウを表示
   * - 雪アニメーション開始イベントを送信
   * - 指定時間後に自動的に非表示
   */
  private async executeSnowEffect(): Promise<void> {
    try {
      await this.overlayWindowManager.showSnowEffect();
    } catch (error) {
      console.error('Failed to execute snow effect:', error);
    }
  }
  
  /**
   * ポップアップメッセージを実行します
   * 
   * @private
   */
  private async executePopupMessage(): Promise<void> {
    try {
      await this.overlayWindowManager.showPopupMessage();
    } catch (error) {
      console.error('Failed to execute popup message:', error);
    }
  }
  
  /**
   * ポップアップメッセージを非表示にします
   */
  hidePopupMessage(): void {
    this.overlayWindowManager.hidePopupMessage();
  }
}
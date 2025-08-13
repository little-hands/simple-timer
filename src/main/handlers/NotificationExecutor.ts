/**
 * タイマー終了時の通知実行を担当するクラス
 * 
 * @description
 * このクラスは以下の責務を持ちます：
 * - Mac通知センターへの通知表示
 * - 通知クリック時のウィンドウフォーカス制御
 * 
 * notifierエフェクトタイプ選択時に、
 * Mac通知センターを通じてタイマー終了を通知します。
 */
import { Notification } from 'electron';
import { TimerWindowManager } from '../TimerWindowManager';

export class NotificationExecutor {
  /**
   * NotificationExecutorのコンストラクタ
   * 
   * @param timerWindowManager - タイマーウィンドウ管理クラスのインスタンス
   */
  constructor(
    private timerWindowManager: TimerWindowManager
  ) {}

  /**
   * タイマー終了時の通知を実行します
   * 
   * @param totalSeconds - タイマーの総秒数
   * 
   * @remarks
   * Mac通知センターへの通知表示を行います。
   * 通知クリック時はタイマーウィンドウにフォーカスします。
   */
  async executeTimerFinishedEffect(totalSeconds: number): Promise<void> {
    this.showNotification(totalSeconds);
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
}
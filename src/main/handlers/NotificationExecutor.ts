/**
 * 通知実行クラス
 * Mac通知センターへの通知表示とウィンドウフォーカス制御を担当。
 */
import { Notification } from 'electron';
import { TimerWindowManager } from '../TimerWindowManager';

export class NotificationExecutor {
  /**
   * @param timerWindowManager - タイマーウィンドウ管理
   */
  constructor(private readonly timerWindowManager: TimerWindowManager) {}

  /**
   * タイマー終了通知を実行
   * @param totalSeconds - タイマー総秒数
   */
  async executeTimerFinishedEffect(totalSeconds: number): Promise<void> {
    this.showNotification(totalSeconds);
  }

  /**
   * Mac通知センターに通知表示（音なし）
   * @param totalSeconds - タイマー総秒数
   * @private
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
      silent: true,
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

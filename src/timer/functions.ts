/**
 * タイマー関連の純粋関数群
 * UIから独立した計算処理を担当
 */

/**
 * 秒数をMM:SS形式の文字列に変換する
 * @param seconds - 変換する秒数
 * @returns MM:SS形式の文字列
 */
export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 数字入力処理：4桁のスタックに新しい数字を追加
 * @param currentStack - 現在の4桁文字列（例："0123"）
 * @param digit - 追加する数字（0-9）
 * @returns 更新された4桁文字列
 */
export function processNumberInput(currentStack: string, digit: number): string {
    // 4桁入力済み（0000以外）の場合、自動リセット
    if (currentStack !== "0000" && currentStack.replace(/^0+/, '').length >= 4) {
        return "000" + digit;
    }
    
    // 右からpush（左の桁を削除、右に新しい数字を追加）
    return currentStack.slice(1) + digit;
}

/**
 * 入力スタックから分秒への変換（制限処理付き）
 * @param stack - 4桁の入力スタック（例："1234" = 12分34秒）
 * @returns 分と秒のオブジェクト（制限：分59、秒59）
 */
export function convertStackToTime(stack: string): { minutes: number, seconds: number } {
    // スタックから生の値を取得
    const rawMinutes = parseInt(stack.slice(0, 2));
    const rawSeconds = parseInt(stack.slice(2, 4));
    
    let minutes = rawMinutes;
    let seconds = rawSeconds;
    
    // 秒数の制限処理
    if (seconds >= 60) {
        seconds = 59;
    }
    
    // 分数の制限処理
    if (minutes >= 60) {
        minutes = 59;
    }
    
    return { minutes, seconds };
}

/**
 * プログレスバーのstroke-dashoffset用の比率を計算する純粋関数
 * 
 * @param totalSeconds - タイマーの総秒数（初期設定時間）
 * @param timeLeft - 残り時間（秒）
 * @returns stroke-dashoffsetに使用する比率（0-1）
 *   - 1: 未開始状態（プログレスバー非表示、circumference分オフセット）
 *   - 0.5: 50%完了（半分のオフセット）
 *   - 0: 完了状態（オフセットなし、プログレスバー満タン）
 */
export function calculateProgressRatio(totalSeconds: number, timeLeft: number): number {
    if (totalSeconds <= 0) {
        return 1; // 未開始状態（100%オフセット）
    }
    
    const progress = (totalSeconds - timeLeft) / totalSeconds;
    return 1 - progress; // 残りの比率（オフセット比率）
}
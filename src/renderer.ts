let timeLeft: number = 3 * 60; // デフォルト3分
let totalSeconds: number = 3 * 60;
let timerInterval: number | null = null;
let isRunning: boolean = false;

// 入力値スタック（4桁の数値を文字列で管理）
let inputStack = "0000";

const timerDisplay = document.getElementById('timerDisplay') as HTMLElement;
const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
const statusText = document.getElementById('statusText') as HTMLElement;
const progressCircle = document.getElementById('progressCircle') as unknown as SVGCircleElement;
const timerContainer = document.querySelector('.timer-container') as HTMLElement;


function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 数字入力処理（純粋関数）
function processNumberInput(currentStack: string, digit: number): string {
    // 4桁入力済み（0000以外）の場合、自動リセット
    if (currentStack !== "0000" && currentStack.replace(/^0+/, '').length >= 4) {
        return "000" + digit;
    }
    
    // 右からpush（左の桁を削除、右に新しい数字を追加）
    return currentStack.slice(1) + digit;
}

// 入力スタックから分秒への変換（制限処理付き、純粋関数）
function convertStackToTime(stack: string): { minutes: number, seconds: number } {
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
function calculateProgressRatio(totalSeconds: number, timeLeft: number): number {
    if (totalSeconds <= 0) {
        return 1; // 未開始状態（100%オフセット）
    }
    
    const progress = (totalSeconds - timeLeft) / totalSeconds;
    return 1 - progress; // 残りの比率（オフセット比率）
}

function updateProgress(): void {
    try {
        const ratio = calculateProgressRatio(totalSeconds, timeLeft);
        const circumference = 2 * Math.PI * 65;
        const offset = ratio * circumference;
        progressCircle.style.strokeDashoffset = offset.toString();
    } catch (error) {
        console.warn('プログレス更新に失敗しました:', error);
    }
}

function updateDisplay(): void {
    try {
        timerDisplay.textContent = formatTime(timeLeft);
        updateProgress();
    } catch (error) {
        console.warn('表示更新に失敗しました:', error);
    }
}

function updateStartButtonIcon(): void {
    try {
        const playIcon = startBtn.querySelector('.play-icon') as SVGElement;
        const pauseIcon = startBtn.querySelector('.pause-icon') as SVGElement;
        
        if (!playIcon || !pauseIcon) {
            console.warn('再生・一時停止アイコンが見つかりません');
            return;
        }
        
        if (isRunning) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        } else {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
    } catch (error) {
        console.warn('ボタンアイコン更新に失敗しました:', error);
    }
}






function toggleTimer(): void {
    if (!isRunning) {
        if (totalSeconds === 0) {
            return;
        }
        startTimer();
    } else {
        pauseTimer();
    }
}

function startTimer(): void {
    isRunning = true;
    updateStartButtonIcon();

    timerInterval = window.setInterval(() => {
        timeLeft--;
        updateDisplay();

        if (timeLeft <= 0) {
            window.clearInterval(timerInterval!);
            timerInterval = null;
            timerFinished();
        }
    }, 1000);

    updateDisplay();
}

function pauseTimer(): void {
    if (timerInterval) {
        window.clearInterval(timerInterval);
        timerInterval = null;
    }
    isRunning = false;
    updateStartButtonIcon();
}

function resetTimer(): void {
    if (timerInterval) {
        window.clearInterval(timerInterval);
        timerInterval = null;
    }
    isRunning = false;
    timeLeft = 3 * 60;
    totalSeconds = 3 * 60;
    
    // 入力スタックもリセット
    inputStack = "0000";

    updateStartButtonIcon();
    timerContainer.classList.remove('timer-finished');

    updateDisplay();
}

async function playAlarmSound(): Promise<void> {
    try {
        const audio = new Audio();
        audio.src = './assets/sounds/jidaigeki.mp3';
        await audio.play();
    } catch (error) {
        console.warn('音声の再生に失敗しました:', error);
        // 音声再生の失敗はアプリケーションの継続に影響しないため、エラーを投げない
    }
}

function sendNotification(): void {
    try {
        const electronAPI = (window as any).electronAPI;
        if (electronAPI && typeof electronAPI.timerFinished === 'function') {
            electronAPI.timerFinished(totalSeconds);
        } else {
            throw new Error('ElectronAPI が利用できません');
        }
    } catch (error) {
        console.warn('通知の送信に失敗しました:', error);
        
        // フォールバック: HTML5通知を試行
        try {
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('タイマー終了', {
                    body: '設定した時間になりました！',
                    silent: false
                });
            }
        } catch (fallbackError) {
            console.warn('フォールバック通知も失敗しました:', fallbackError);
        }
    }
}

async function timerFinished(): Promise<void> {
    try {
        isRunning = false;
        updateStartButtonIcon();
        timerContainer.classList.add('timer-finished');
        
        // 通知送信
        sendNotification();
        
        // アラーム音（非同期で実行、失敗してもアプリは継続）
        playAlarmSound();
        
    } catch (error) {
        console.error('タイマー終了処理でエラーが発生しました:', error);
        // タイマー終了の基本状態は設定済みなので、エラーがあってもアプリは継続
    }
}


// イベントリスナー
startBtn.addEventListener('click', toggleTimer);
resetBtn.addEventListener('click', resetTimer);


// キーボードショートカット
document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.code === 'Space') {
        e.preventDefault();
        toggleTimer();
    } else if (e.key.toLowerCase() === 'r') {
        resetTimer();
    } else if (!isRunning && e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        
        // 新しいスタックを計算
        inputStack = processNumberInput(inputStack, parseInt(e.key));
        
        // スタックから分秒を計算
        const { minutes, seconds } = convertStackToTime(inputStack);
        
        // タイマー値を更新
        totalSeconds = minutes * 60 + seconds;
        timeLeft = totalSeconds;
        
        // UIを更新
        updateDisplay();
    }
});

// 通知許可の要求（エラーハンドリング付き）
async function requestNotificationPermission(): Promise<void> {
    try {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    } catch (error) {
        console.warn('通知許可の要求に失敗しました:', error);
    }
}

// 通知許可要求を実行
requestNotificationPermission();

// 初期表示
updateDisplay();
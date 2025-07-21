let timeLeft: number = 3 * 60; // デフォルト3分
let totalSeconds: number = 3 * 60;
let timerInterval: number | null = null;
let isRunning: boolean = false;
let isEditing: boolean = false;

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

function updateProgress(): void {
    try {
        if (totalSeconds <= 0) {
            progressCircle.style.strokeDashoffset = '0';
            return;
        }
        
        const progress = (totalSeconds - timeLeft) / totalSeconds;
        const circumference = 2 * Math.PI * 65;
        const offset = circumference - (progress * circumference);
        progressCircle.style.strokeDashoffset = offset.toString();
    } catch (error) {
        console.warn('プログレス更新に失敗しました:', error);
    }
}

function updateDisplay(): void {
    try {
        if (!isEditing) {
            timerDisplay.textContent = formatTime(timeLeft);
        }
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

function enableTimerEdit(): void {
    if (isRunning || isEditing) return;
    
    isEditing = true;
    timerDisplay.classList.add('editing');
    
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    timerDisplay.innerHTML = `
        <input type="number" class="timer-input" value="${minutes}" id="minutesTimerInput" min="0" max="99" placeholder="00">
        <span class="timer-colon">:</span>
        <input type="number" class="timer-input" value="${seconds}" id="secondsTimerInput" min="0" max="59" placeholder="00">
        <button class="close-edit-btn" id="closeEditBtn">&times;</button>
    `;
    
    const minutesInput = document.getElementById('minutesTimerInput') as HTMLInputElement;
    const secondsInput = document.getElementById('secondsTimerInput') as HTMLInputElement;
    const closeEditBtn = document.getElementById('closeEditBtn') as HTMLButtonElement;
    
    [minutesInput, secondsInput].forEach(input => {
        input.addEventListener('blur', handleTimerInputBlur);
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                saveTimerEdit();
            } else if (e.key === 'Escape') {
                cancelTimerEdit();
            }
        });
        
        input.addEventListener('input', function(e) {
            const target = e.target as HTMLInputElement;
            let value = parseInt(target.value) || 0;
            
            if (target.id === 'secondsTimerInput' && value > 59) {
                target.value = '59';
            } else if (target.id === 'minutesTimerInput' && value > 99) {
                target.value = '99';
            }
        });
    });

    // バツボタンのイベントリスナー
    closeEditBtn.addEventListener('click', () => {
        cancelTimerEdit();
    });

    setTimeout(() => {
        minutesInput.focus();
        minutesInput.select();
    }, 0);
}

function handleOutsideClick(event: Event): void {
    if (!isEditing) return;
    
    const timerDisplayElement = document.getElementById('timerDisplay');
    const target = event.target as Node;
    const isClickInsideTimer = timerDisplayElement && timerDisplayElement.contains(target);
    
    if (!isClickInsideTimer) {
        saveTimerEdit();
        document.removeEventListener('click', handleOutsideClick, true);
    }
}

let blurTimeout: number;
function handleTimerInputBlur(): void {
    clearTimeout(blurTimeout);
    blurTimeout = window.setTimeout(() => {
        const activeElement = document.activeElement as HTMLElement;
        const isTimerInput = activeElement && (
            activeElement.id === 'minutesTimerInput' || 
            activeElement.id === 'secondsTimerInput'
        );
        
        if (!isTimerInput) {
            saveTimerEdit();
        }
    }, 100);
}

function saveTimerEdit(): void {
    if (!isEditing) return;
    
    try {
        const minutesInput = document.getElementById('minutesTimerInput') as HTMLInputElement;
        const secondsInput = document.getElementById('secondsTimerInput') as HTMLInputElement;
        
        if (!minutesInput || !secondsInput) {
            console.warn('タイマー入力要素が見つかりません');
            cancelTimerEdit();
            return;
        }
        
        const minutes = Math.max(0, Math.min(99, parseInt(minutesInput.value) || 0));
        const seconds = Math.max(0, Math.min(59, parseInt(secondsInput.value) || 0));
        
        // 最小1秒は設定する（0秒タイマーを防ぐ）
        const newTotalSeconds = minutes * 60 + seconds;
        if (newTotalSeconds === 0) {
            totalSeconds = 1; // 最小1秒
            timeLeft = 1;
        } else {
            totalSeconds = newTotalSeconds;
            timeLeft = newTotalSeconds;
        }
        
        cancelTimerEdit();
        updateDisplay();
        
        document.removeEventListener('click', handleOutsideClick, true);
    } catch (error) {
        console.error('タイマー編集保存でエラーが発生しました:', error);
        cancelTimerEdit();
    }
}

function cancelTimerEdit(): void {
    if (!isEditing) return;
    
    try {
        isEditing = false;
        timerDisplay.classList.remove('editing');
        timerDisplay.textContent = formatTime(timeLeft);
        
        document.removeEventListener('click', handleOutsideClick, true);
    } catch (error) {
        console.warn('編集モード終了でエラーが発生しました:', error);
        // 強制的に編集状態をリセット
        isEditing = false;
    }
}

function toggleTimer(): void {
    if (isEditing) {
        saveTimerEdit();
        return;
    }
    
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
    isEditing = false;
    timeLeft = 3 * 60;
    totalSeconds = 3 * 60;

    updateStartButtonIcon();
    timerContainer.classList.remove('timer-finished');
    timerDisplay.classList.remove('editing');

    updateDisplay();
}

async function playAlarmSound(): Promise<void> {
    try {
        const audio = new Audio();
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE';
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

// ドラッグとクリックの両立のためのイベント制御
document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // 編集モード中で、入力欄以外をクリックした場合は編集モードを解除
    if (isEditing) {
        const timerDisplayElement = document.getElementById('timerDisplay');
        if (timerDisplayElement && !timerDisplayElement.contains(target)) {
            saveTimerEdit();
            return;
        }
    }
    
    // タイマー表示をクリックした場合は編集モードを開始
    if (target.closest('#timerDisplay') && !isRunning && !isEditing) {
        enableTimerEdit();
    }
});

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
        enableTimerEdit();
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
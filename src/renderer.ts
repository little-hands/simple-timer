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
    const progress = (totalSeconds - timeLeft) / totalSeconds;
    const circumference = 2 * Math.PI * 65;
    const offset = circumference - (progress * circumference);
    progressCircle.style.strokeDashoffset = offset.toString();
}

function updateDisplay(): void {
    if (!isEditing) {
        timerDisplay.textContent = formatTime(timeLeft);
    }
    updateProgress();
}

function updateStartButtonIcon(): void {
    const playIcon = startBtn.querySelector('.play-icon') as SVGElement;
    const pauseIcon = startBtn.querySelector('.pause-icon') as SVGElement;
    
    if (isRunning) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    } else {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
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
    
    const minutesInput = document.getElementById('minutesTimerInput') as HTMLInputElement;
    const secondsInput = document.getElementById('secondsTimerInput') as HTMLInputElement;
    
    if (!minutesInput || !secondsInput) return;
    
    const minutes = parseInt(minutesInput.value) || 0;
    const seconds = parseInt(secondsInput.value) || 0;
    
    totalSeconds = minutes * 60 + seconds;
    timeLeft = totalSeconds;
    
    cancelTimerEdit();
    updateDisplay();
    
    document.removeEventListener('click', handleOutsideClick, true);
}

function cancelTimerEdit(): void {
    if (!isEditing) return;
    
    isEditing = false;
    timerDisplay.classList.remove('editing');
    timerDisplay.textContent = formatTime(timeLeft);
    
    document.removeEventListener('click', handleOutsideClick, true);
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

function timerFinished(): void {
    isRunning = false;
    updateStartButtonIcon();
    timerContainer.classList.add('timer-finished');
    
    // Mac通知センターに通知を送信
    (window as any).electronAPI.timerFinished(totalSeconds);
    
    // アラーム音
    const audio = new Audio();
    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE';
    audio.play();
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

// 通知許可の要求
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// 初期表示
updateDisplay();
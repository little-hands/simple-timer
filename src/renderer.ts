let timeLeft: number = 0;
let timerInterval: number | null = null;
let isRunning: boolean = false;

const timerDisplay = document.getElementById('timerDisplay') as HTMLElement;
const minutesInput = document.getElementById('minutesInput') as HTMLInputElement;
const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
const stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;
const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;

function updateDisplay(): void {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer(): void {
    if (!isRunning) {
        if (timeLeft === 0) {
            timeLeft = parseInt(minutesInput.value) * 60;
        }
        
        isRunning = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        minutesInput.disabled = true;
        
        timerInterval = window.setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateDisplay();
            } else {
                stopTimer();
                notifyTimerComplete();
            }
        }, 1000);
    }
}

function stopTimer(): void {
    isRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    
    if (timerInterval) {
        window.clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer(): void {
    stopTimer();
    timeLeft = 0;
    updateDisplay();
    minutesInput.disabled = false;
}

function notifyTimerComplete(): void {
    new Notification('タイマー終了', {
        body: 'タイマーが終了しました！',
        silent: false
    });
    
    const audio = new Audio();
    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE';
    audio.play();
}

startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click', stopTimer);
resetBtn.addEventListener('click', resetTimer);

document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (isRunning) {
            stopTimer();
        } else {
            startTimer();
        }
    } else if (e.key.toLowerCase() === 'r') {
        resetTimer();
    } else if (!isRunning && e.key >= '0' && e.key <= '9') {
        minutesInput.focus();
    }
});

minutesInput.addEventListener('change', () => {
    if (!isRunning) {
        timeLeft = 0;
        updateDisplay();
    }
});
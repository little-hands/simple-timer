import { formatTime, processNumberInput, convertStackToTime, calculateProgressRatio } from './functions.js';

let timeLeft: number = 3 * 60; // デフォルト3分
let totalSeconds: number = 3 * 60;
let timerInterval: number | null = null;
let isRunning: boolean = false;

// 入力値スタック（4桁の数値を文字列で管理）
let inputStack = "0000";

// エフェクト選択関連の状態
let currentEffectType: 'notifier' | 'cards' | 'snow' = 'notifier'; // デフォルト

const timerDisplay = document.getElementById('timerDisplay') as HTMLElement;
const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
const statusText = document.getElementById('statusText') as HTMLElement;
const progressCircle = document.getElementById('progressCircle') as unknown as SVGCircleElement;
const timerContainer = document.querySelector('.timer-container') as HTMLElement;
const settingsBtn = document.getElementById('settingsBtn') as HTMLButtonElement;
// cardsContainerはローカルでは不要（フルスクリーンオーバーレイで表示）

function updateProgress(totalSecondsParam: number, timeLeftParam: number): void {
    try {
        const ratio = calculateProgressRatio(totalSecondsParam, timeLeftParam);
        const circumference = 2 * Math.PI * 65;
        const offset = ratio * circumference;
        progressCircle.style.strokeDashoffset = offset.toString();
    } catch (error) {
        console.warn('プログレス更新に失敗しました:', error);
    }
}

function updateDisplay(timeLeftParam: number, totalSecondsParam: number): void {
    try {
        timerDisplay.textContent = formatTime(timeLeftParam);
        updateProgress(totalSecondsParam, timeLeftParam);
    } catch (error) {
        console.warn('表示更新に失敗しました:', error);
    }
}

function updateStartButtonIcon(isRunningParam: boolean): void {
    try {
        const playIcon = startBtn.querySelector('.play-icon') as SVGElement;
        const pauseIcon = startBtn.querySelector('.pause-icon') as SVGElement;
        
        if (!playIcon || !pauseIcon) {
            console.warn('再生・一時停止アイコンが見つかりません');
            return;
        }
        
        if (isRunningParam) {
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
    updateStartButtonIcon(isRunning);

    timerInterval = window.setInterval(() => {
        timeLeft--;
        updateDisplay(timeLeft, totalSeconds);

        if (timeLeft <= 0) {
            window.clearInterval(timerInterval!);
            timerInterval = null;
            timerFinished();
        }
    }, 1000);

    updateDisplay(timeLeft, totalSeconds);
}

function pauseTimer(): void {
    if (timerInterval) {
        window.clearInterval(timerInterval);
        timerInterval = null;
    }
    isRunning = false;
    updateStartButtonIcon(isRunning);
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

    updateStartButtonIcon(isRunning);
    timerContainer.classList.remove('timer-finished');

    updateDisplay(timeLeft, totalSeconds);
}

async function playAlarmSound(): Promise<void> {
    try {
        const audio = new Audio();
        audio.src = '../assets/sounds/jidaigeki.mp3';
        await audio.play();
    } catch (error) {
        console.warn('音声の再生に失敗しました:', error);
        // 音声再生の失敗はアプリケーションの継続に影響しないため、エラーを投げない
    }
}

async function playSnowSound(): Promise<void> {
    try {
        const audio = new Audio();
        audio.src = '../assets/sounds/sleigh_bells.mp3';
        await audio.play();
    } catch (error) {
        console.warn('雪エフェクト音声の再生に失敗しました:', error);
        // 音声再生の失敗はアプリケーションの継続に影響しないため、エラーを投げない
    }
}

// フルスクリーントランプアニメーション開始
function startCardsCelebration(): void {
    try {
        const electronAPI = (window as any).electronAPI;
        
        if (electronAPI && typeof electronAPI.showCardsCelebration === 'function') {
            electronAPI.showCardsCelebration();
        } else {
            console.warn('ElectronAPI showCardsCelebration が利用できません');
        }
    } catch (error) {
        console.warn('トランプアニメーション開始に失敗しました:', error);
    }
}

// 雪エフェクトアニメーション開始
function startSnowEffect(): void {
    try {
        const electronAPI = (window as any).electronAPI;
        
        if (electronAPI && typeof electronAPI.showSnowEffect === 'function') {
            electronAPI.showSnowEffect();
        } else {
            console.warn('ElectronAPI showSnowEffect が利用できません');
        }
    } catch (error) {
        console.warn('雪エフェクト開始に失敗しました:', error);
    }
}

function sendNotification(totalSecondsParam: number): void {
    try {
        const electronAPI = (window as any).electronAPI;
        if (electronAPI && typeof electronAPI.timerFinished === 'function') {
            electronAPI.timerFinished(totalSecondsParam);
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
        updateStartButtonIcon(isRunning);
        timerContainer.classList.add('timer-finished');
        
        console.log('🎯 タイマー終了:', { currentEffectType });
        
        // エフェクト設定に基づく実行
        switch (currentEffectType) {
            case 'notifier':
                console.log('📢 通知エフェクト実行');
                // 通知 + 音声の組み合わせ
                sendNotification(totalSeconds);
                playAlarmSound();
                break;
            case 'cards':
                console.log('🃏 トランプエフェクト実行');
                // トランプアニメーション + 音声
                startCardsCelebration();
                playAlarmSound();
                break;
            case 'snow':
                console.log('❄️ 雪エフェクト実行');
                // 雪アニメーション + 専用音声
                startSnowEffect();
                playSnowSound();
                break;
        }
        
    } catch (error) {
        console.error('タイマー終了処理でエラーが発生しました:', error);
        // タイマー終了の基本状態は設定済みなので、エラーがあってもアプリは継続
    }
}

// 設定読み込み
async function loadAppConfig(): Promise<void> {
    try {
        const electronAPI = (window as any).electronAPI;
        if (electronAPI && typeof electronAPI.getAppConfig === 'function') {
            const config = await electronAPI.getAppConfig();
            currentEffectType = config.effectType;
            console.log('設定読み込み完了:', { effectType: currentEffectType, config });
            updateSettingsUI();
        }
    } catch (error) {
        console.warn('設定読み込みに失敗しました:', error);
        currentEffectType = 'notifier'; // フォールバック
    }
}

// エフェクト設定保存
async function saveEffectType(effectType: 'notifier' | 'cards' | 'snow'): Promise<void> {
    try {
        const electronAPI = (window as any).electronAPI;
        if (electronAPI && typeof electronAPI.setEffectType === 'function') {
            await electronAPI.setEffectType(effectType);
            currentEffectType = effectType;
            console.log('設定保存完了:', { effectType: currentEffectType });
            updateSettingsUI();
        }
    } catch (error) {
        console.warn('設定保存に失敗しました:', error);
    }
}

// UI状態更新
function updateSettingsUI(): void {
    // 設定ウィンドウで状態管理するため、タイマーウィンドウでは何もしない
    console.log('Current effect type:', currentEffectType);
}

// 設定ウィンドウを開く
function openSettingsWindow(): void {
    try {
        const electronAPI = (window as any).electronAPI;
        if (electronAPI && typeof electronAPI.showSettingsWindow === 'function') {
            electronAPI.showSettingsWindow();
        }
    } catch (error) {
        console.warn('設定ウィンドウの表示に失敗しました:', error);
    }
}


// イベントリスナー
startBtn.addEventListener('click', toggleTimer);
resetBtn.addEventListener('click', resetTimer);
settingsBtn.addEventListener('click', openSettingsWindow);


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
        updateDisplay(timeLeft, totalSeconds);
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

// 設定読み込み
loadAppConfig();

// 設定変更通知の受信
const electronAPI = (window as any).electronAPI;
if (electronAPI && typeof electronAPI.receive === 'function') {
    electronAPI.receive('effect-type-changed', (effectType: string) => {
        currentEffectType = effectType as 'notifier' | 'cards' | 'snow';
        console.log('エフェクトタイプが変更されました:', effectType);
    });
}

// 初期表示
updateDisplay(timeLeft, totalSeconds);
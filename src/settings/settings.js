let currentEffectType = 'notifier';

// 設定読み込み
async function loadSettings() {
    try {
        const electronAPI = window.electronAPI;
        if (electronAPI && electronAPI.getAppConfig) {
            const config = await electronAPI.getAppConfig();
            currentEffectType = config.effectType;
            updateSelection();
        }
    } catch (error) {
        console.warn('設定読み込みに失敗しました:', error);
    }
}

// 選択状態の更新
function updateSelection() {
    const options = document.querySelectorAll('.option-item');
    options.forEach(option => {
        const effectType = option.getAttribute('data-effect');
        option.classList.toggle('selected', effectType === currentEffectType);
    });
}

// エフェクト選択処理
async function selectEffect(effectType) {
    try {
        const electronAPI = window.electronAPI;
        if (electronAPI && electronAPI.setEffectType) {
            await electronAPI.setEffectType(effectType);
            currentEffectType = effectType;
            updateSelection();
        }
    } catch (error) {
        console.warn('設定保存に失敗しました:', error);
    }
}

// イベントリスナー
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();

    // 閉じるボタン
    document.getElementById('closeBtn').addEventListener('click', () => {
        if (window.electronAPI && window.electronAPI.hideSettingsWindow) {
            window.electronAPI.hideSettingsWindow();
        }
    });

    // エフェクト選択
    document.querySelectorAll('.option-item').forEach(option => {
        option.addEventListener('click', () => {
            const effectType = option.getAttribute('data-effect');
            selectEffect(effectType);
        });
    });

    // ESCキーで閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (window.electronAPI && window.electronAPI.hideSettingsWindow) {
                window.electronAPI.hideSettingsWindow();
            }
        }
    });
});
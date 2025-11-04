import { EffectType, AppConfig } from '../types/app-types';

let currentEffectType: EffectType = 'notifier';

// 設定読み込み
async function loadSettings(): Promise<void> {
    try {
        const electronAPI = window.electronAPI;
        if (electronAPI && electronAPI.getAppConfig) {
            const config: AppConfig = await electronAPI.getAppConfig();
            currentEffectType = config.effectType;
            updateSelection();
        }
    } catch (error) {
        console.warn('設定読み込みに失敗しました:', error);
    }
}

// 選択状態の更新
function updateSelection(): void {
    const options = document.querySelectorAll<HTMLElement>('.option-item');
    options.forEach((option: HTMLElement) => {
        const effectType = option.getAttribute('data-effect');
        if (!effectType) {
            console.warn('data-effect属性が見つかりません');
            return;
        }
        option.classList.toggle('selected', effectType === currentEffectType);
    });
}

// エフェクト選択処理
async function selectEffect(effectType: EffectType): Promise<void> {
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

// ウィンドウを閉じる処理
function handleClose(): void {
    if (window.electronAPI?.hideSettingsWindow) {
        window.electronAPI.hideSettingsWindow();
    }
}

// オプションクリック時の処理
function handleOptionClick(option: HTMLElement): void {
    const effectType = option.getAttribute('data-effect');
    if (!effectType) {
        console.warn('data-effect属性が見つかりません');
        return;
    }

    // 型ガード: EffectTypeかどうかチェック
    const validEffectTypes: EffectType[] = ['notifier', 'cards', 'snow', 'popup'];
    if (!validEffectTypes.includes(effectType as EffectType)) {
        console.warn(`無効なエフェクトタイプ: ${effectType}`);
        return;
    }

    selectEffect(effectType as EffectType);
}

// イベントリスナー
document.addEventListener('DOMContentLoaded', (): void => {
    loadSettings();

    // 閉じるボタン
    document.getElementById('closeBtn')?.addEventListener('click', handleClose);

    // エフェクト選択
    document.querySelectorAll<HTMLElement>('.option-item').forEach((option: HTMLElement) => {
        option.addEventListener('click', () => handleOptionClick(option));
    });

    // ESCキーで閉じる
    document.addEventListener('keydown', (e: KeyboardEvent): void => {
        if (e.key === 'Escape') {
            handleClose();
        }
    });
});
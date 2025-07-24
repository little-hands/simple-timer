// ポップアップメッセージ JavaScript
// シンプルなElectron IPC連携とユーザーインタラクション処理

// ポップアップを閉じる関数
function dismissPopup() {
    const overlay = document.querySelector('.popup-overlay');
    if (overlay) {
        overlay.classList.add('fade-out');
        
        // フェードアウト完了後に Electron に通知
        setTimeout(() => {
            if (window.electronAPI && typeof window.electronAPI.hidePopupMessage === 'function') {
                window.electronAPI.hidePopupMessage();
            }
        }, 300);
    }
}

// ESCキーでのポップアップ消去
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        dismissPopup();
    }
});

// ポップアップ初期化処理
document.addEventListener('DOMContentLoaded', () => {
    console.log('ポップアップ表示完了 - CSSでクリック制御');
});

// エラーハンドリング
window.addEventListener('error', (event) => {
    console.warn('ポップアップでエラーが発生しました:', event.error);
    // エラーが発生した場合も確実に閉じる
    if (window.electronAPI && typeof window.electronAPI.hidePopupMessage === 'function') {
        window.electronAPI.hidePopupMessage();
    }
});
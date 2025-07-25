console.log('overlay-manager-test.js: Starting...');

// EffectManagerのテスト用エントリーポイント
// 後でoverlay.jsに統合する

// TypeScriptのコンパイル済みファイルをインポート
(async () => {
  try {
    console.log('overlay-manager-test.js: Importing OverlayEffectManager...');
    const { OverlayEffectManager } = await import('./overlay/OverlayEffectManager.js');
    
    console.log('overlay-manager-test.js: Creating EffectManager instance...');
    window.effectManager = new OverlayEffectManager();
    console.log('overlay-manager-test.js: EffectManager created successfully');
    console.log('OverlayEffectManager initialized and ready');
    
  } catch (error) {
    console.error('overlay-manager-test.js: Failed to import/create EffectManager:', error);
  }
})();

// テスト用：popupエフェクトを表示
window.testPopup = async () => {
  console.log('Testing popup effect...');
  await window.effectManager.showEffect('popup');
};

// IPC通信の設定（初期化完了後）
const setupIPC = () => {
  if (window.electronAPI && window.effectManager) {
    console.log('overlay-manager-test.js: Setting up IPC listeners...');
    
    // 新しいAPI
    if (window.electronAPI.onStartPopupAnimation) {
      window.electronAPI.onStartPopupAnimation(() => {
        console.log('IPC: Start popup animation received (new API)');
        if (window.effectManager) {
          window.effectManager.showEffect('popup');
        }
      });
    }
    
    // 旧API互換
    if (window.electronAPI.receive) {
      window.electronAPI.receive('start-popup-animation', () => {
        console.log('IPC: Start popup animation received (old API)');
        if (window.effectManager) {
          window.effectManager.showEffect('popup');
        }
      });
    }
    
    console.log('overlay-manager-test.js: IPC setup complete');
  } else {
    console.warn('overlay-manager-test.js: electronAPI or effectManager not ready, retrying...');
    setTimeout(setupIPC, 100);
  }
};

setTimeout(setupIPC, 100);
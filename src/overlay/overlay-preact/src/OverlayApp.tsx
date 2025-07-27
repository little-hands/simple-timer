import { useState, useEffect } from 'preact/hooks';
import { PopupComponent } from './components/PopupComponent';
import { CardsComponent } from './components/CardsComponent';
import { SnowComponent } from './components/SnowComponent';

type EffectType = 'popup-preact' | 'sample' | 'cards' | 'snow' | null;

export function OverlayApp() {
  const [currentEffect, setCurrentEffect] = useState<EffectType>(null);

  useEffect(() => {
    console.log('OverlayApp: Setting up IPC listeners...');
    
    // ElectronAPIの準備を待つ
    const setupIPC = () => {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI) {
        console.log('OverlayApp: ElectronAPI ready, setting up listeners');
        
        // 汎用オーバーレイエフェクト開始イベント
        electronAPI.receive('start-overlay-effect', (effectType: string) => {
          console.log(`OverlayApp: Start overlay effect received: ${effectType}`);
          handleOverlayEffect(effectType);
        });
        
        console.log('OverlayApp: IPC setup complete');
      } else {
        console.warn('OverlayApp: electronAPI not ready, retrying...');
        setTimeout(setupIPC, 100);
      }
    };

    setupIPC();
  }, []);

  const handleOverlayEffect = (effectType: string) => {
    console.log(`OverlayApp: Starting overlay effect: ${effectType}`);
    
    // エフェクト開始時はクリックスルーを無効化
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.setClickThrough) {
      electronAPI.setClickThrough(false);
      console.log('OverlayApp: Click-through disabled');
    }
    
    try {
      switch (effectType) {
        case 'popup-preact':
        case 'sample':
          // Preactベースのポップアップ
          setCurrentEffect('popup-preact');
          break;
        case 'cards':
          // Cards エフェクト（プレースホルダー）
          setCurrentEffect('cards');
          break;
        case 'snow':
          // Snow エフェクト（プレースホルダー）
          setCurrentEffect('snow');
          break;
        default:
          console.warn(`OverlayApp: Unknown effect type: ${effectType}`);
          // フォールバック: デフォルトエフェクトとしてpopup-preactを表示
          setCurrentEffect('popup-preact');
          break;
      }
      
      console.log(`OverlayApp: ${effectType} effect started`);
    } catch (error) {
      console.error(`OverlayApp: Failed to show ${effectType} effect:`, error);
    }
  };

  const handleEffectDismiss = () => {
    console.log('OverlayApp: Effect dismissed');
    setCurrentEffect(null);
    
    // エフェクト終了後はクリックスルーを有効化
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.setClickThrough) {
      electronAPI.setClickThrough(true);
      console.log('OverlayApp: Click-through enabled');
    }
  };

  return (
    <div className="overlay-app">
      {currentEffect === 'popup-preact' && (
        <PopupComponent onDismiss={handleEffectDismiss} />
      )}
      {currentEffect === 'cards' && (
        <CardsComponent onDismiss={handleEffectDismiss} />
      )}
      {currentEffect === 'snow' && (
        <SnowComponent onDismiss={handleEffectDismiss} />
      )}
    </div>
  );
}
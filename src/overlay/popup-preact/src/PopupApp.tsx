import { useState, useEffect } from 'preact/hooks';

export function PopupApp() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // アニメーション開始
    setIsVisible(true);
    
    // 3秒後に自動的に非表示
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <div className={`popup-overlay ${isVisible ? 'visible' : ''}`} onClick={handleDismiss}>
      <div className="popup-container">
        <div className="clock-icon">⏰</div>
        
        <div className="speech-bubble">
          <div className="sparkle-container">
            <div className="sparkle">✨</div>
            <div className="sparkle">✨</div>
            <div className="sparkle">✨</div>
            <div className="sparkle">✨</div>
            
            <div className="main-text">Time's up</div>
          </div>
          
          <div className="click-anywhere-hint">Click anywhere to dismiss</div>
        </div>
      </div>
    </div>
  );
}
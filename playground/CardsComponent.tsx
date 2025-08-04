import { useEffect, useRef, useState } from 'preact/hooks';

interface CardsComponentProps {
  onDismiss?: () => void;
  /** カード生成間隔（ミリ秒） */
  interval?: number;
  /** 総カード数 */
  totalCards?: number;
  /** アニメーション時間（秒） */
  duration?: number;
  /** 自動終了するか */
  autoFinish?: boolean;
}

interface CardInfo {
  id: number;
  element: HTMLDivElement;
  createdAt: number;
  duration: number;
  position: { x: number; y: number };
  rotation: number;
  timeoutId?: number;
}

/**
 * トランプカードが降り注ぐアニメーションエフェクト
 * オリジナルのcard-effects.jsの仕様に忠実に再現
 */
export function CardsComponent({ 
  onDismiss, 
  interval = 80, 
  totalCards = 104, 
  duration = 4,
  autoFinish = true 
}: CardsComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({
    totalCreated: 0,
    currentActive: 0,
    peakActive: 0
  });
  
  // CardManagerのロジックをPreact用に移植
  const activeCardsRef = useRef<Map<number, CardInfo>>(new Map());
  const cardIdCounterRef = useRef(0);
  const cardIntervalRef = useRef<number | null>(null);

  const createCardElement = (): HTMLDivElement => {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const suitNames = ['spades', 'hearts', 'diamonds', 'clubs'];
    
    const suit = Math.floor(Math.random() * suits.length);
    const value = values[Math.floor(Math.random() * values.length)];
    
    const card = document.createElement('div');
    card.className = `playing-card ${suitNames[suit]}`;
    card.textContent = value;
    card.setAttribute('data-suit', suits[suit]);
    
    return card;
  };

  const getRandomDuration = (): number => {
    return (duration + (Math.random() * 2 - 1)) * 1000; // ±1秒のバリエーション
  };

  const updateStats = () => {
    const currentActive = activeCardsRef.current.size;
    setStats(prev => ({
      totalCreated: prev.totalCreated + 1,
      currentActive,
      peakActive: Math.max(prev.peakActive, currentActive)
    }));
  };

  const removeCard = (cardId: number): boolean => {
    const cardInfo = activeCardsRef.current.get(cardId);
    if (!cardInfo) return false;

    if (cardInfo.timeoutId) {
      clearTimeout(cardInfo.timeoutId);
    }
    
    try {
      if (cardInfo.element && cardInfo.element.parentNode) {
        cardInfo.element.parentNode.removeChild(cardInfo.element);
      }
    } catch (error) {
      console.warn('Failed to remove card element:', error);
    }
    
    activeCardsRef.current.delete(cardId);
    setStats(prev => ({ ...prev, currentActive: activeCardsRef.current.size }));
    
    return true;
  };

  const createCard = (): CardInfo | null => {
    if (!containerRef.current) return null;

    const cardId = cardIdCounterRef.current++;
    const card = createCardElement();
    
    const cardInfo: CardInfo = {
      id: cardId,
      element: card,
      createdAt: Date.now(),
      duration: getRandomDuration(),
      position: { 
        x: Math.random() * window.innerWidth, 
        y: -100 
      },
      rotation: (Math.random() - 0.5) * 1080 // -540度から540度
    };

    // アニメーション設定
    card.style.left = `${cardInfo.position.x}px`;
    card.style.top = `${cardInfo.position.y}px`;
    card.style.setProperty('--rotation', `${cardInfo.rotation}deg`);
    card.style.setProperty('--fall-duration', `${cardInfo.duration / 1000}s`);
    
    // 自動削除タイマー
    cardInfo.timeoutId = window.setTimeout(() => {
      removeCard(cardInfo.id);
    }, cardInfo.duration + 1000);

    // 管理対象に追加
    activeCardsRef.current.set(cardId, cardInfo);
    updateStats();
    
    // DOM追加
    containerRef.current.appendChild(card);
    
    return cardInfo;
  };

  const forceCleanup = () => {
    activeCardsRef.current.forEach(cardInfo => {
      if (cardInfo.timeoutId) {
        clearTimeout(cardInfo.timeoutId);
      }
    });
    
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    
    activeCardsRef.current.clear();
    setStats(prev => ({ ...prev, currentActive: 0 }));
  };

  const startCardsCelebration = () => {
    if (cardIntervalRef.current) return;
    
    // 前回の残骸をクリア
    forceCleanup();
    
    let cardCount = 0;
    
    console.log(`Starting cards celebration: ${totalCards} cards, ${interval}ms interval`);
    
    cardIntervalRef.current = window.setInterval(() => {
      createCard();
      cardCount++;
      
      if (cardCount >= totalCards) {
        if (cardIntervalRef.current) {
          clearInterval(cardIntervalRef.current);
          cardIntervalRef.current = null;
        }
        console.log('Cards generation completed');
        
        if (autoFinish) {
          // 全アニメーション終了後にonDismissを呼び出し
          setTimeout(() => {
            forceCleanup();
            onDismiss?.();
          }, Math.max(duration * 1000 + 2000, 8000)); // アニメーション時間 + 余裕2秒
        }
      }
    }, interval);
  };

  // コンポーネントマウント時にアニメーション開始
  useEffect(() => {
    startCardsCelebration();
    
    // クリーンアップ
    return () => {
      if (cardIntervalRef.current) {
        clearInterval(cardIntervalRef.current);
      }
      forceCleanup();
    };
  }, []); // 依存配列を空にして初回のみ実行

  return (
    <div 
      ref={containerRef}
      className="cards-effect-container"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000
      }}
    >
      {/* デバッグ用統計情報（オプション） */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px',
            pointerEvents: 'auto'
          }}
        >
          <div>Active: {stats.currentActive}</div>
          <div>Total: {stats.totalCreated}</div>
          <div>Peak: {stats.peakActive}</div>
        </div>
      )}
      
      <style>{`
        .playing-card {
          position: absolute;
          width: 60px;
          height: 84px;
          background: white;
          border: 1px solid #333;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
          font-family: 'Times New Roman', serif;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          animation: cardFall var(--fall-duration, 4s) ease-in-out forwards;
          transform: rotateZ(var(--rotation, 0deg));
        }

        .playing-card.hearts,
        .playing-card.diamonds {
          color: #ff0000;
        }

        .playing-card.spades,
        .playing-card.clubs {
          color: #000000;
        }

        .playing-card::after {
          content: attr(data-suit);
          position: absolute;
          bottom: 4px;
          right: 4px;
          font-size: 14px;
        }

        @keyframes cardFall {
          0% {
            transform: translateY(-100px) rotateZ(var(--rotation, 0deg));
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(calc(100vh + 100px)) rotateZ(calc(var(--rotation, 0deg) + 360deg));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
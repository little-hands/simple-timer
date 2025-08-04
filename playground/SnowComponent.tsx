import { useEffect, useRef, useState } from 'preact/hooks';

interface SnowComponentProps {
  onDismiss?: () => void;
  /** 雪の密度（1秒あたりの生成数） */
  density?: number;
  /** 降雪速度（秒） */
  speed?: number;
  /** 雪フレークの種類 */
  snowflakeType?: 'mixed' | 'dots' | 'stars' | 'flakes' | 'sparkles';
  /** 風エフェクトを有効にするか */
  windEffect?: boolean;
  /** ブラーエフェクトを有効にするか */
  blurEffect?: boolean;
  /** 背景テーマ */
  backgroundType?: 'default' | 'winter' | 'night' | 'twilight';
  /** 自動終了時間（秒、0で無効） */
  autoFinishTime?: number;
}

interface SnowflakeInfo {
  id: number;
  element: HTMLDivElement;
  createdAt: number;
  duration: number;
}

/**
 * 雪が降るアニメーションエフェクト
 * playgroundのsnow-effect.htmlの仕様を基に実装
 */
export function SnowComponent({ 
  onDismiss,
  density = 50,
  speed = 10,
  snowflakeType = 'mixed',
  windEffect = false,
  blurEffect = false,
  backgroundType = 'default',
  autoFinishTime = 10
}: SnowComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({
    totalCreated: 0,
    currentActive: 0
  });
  
  const activeSnowflakesRef = useRef<Map<number, SnowflakeInfo>>(new Map());
  const snowflakeIdCounterRef = useRef(0);
  const snowIntervalRef = useRef<number | null>(null);

  const snowflakeChars = {
    dots: ['•', '·', '∙'],
    stars: ['*', '✦', '✧', '★', '☆'],
    flakes: ['❄', '❅', '❆', '❄️'],
    sparkles: ['✨', '✨', '✨'],
    mixed: ['•', '·', '*', '❄', '❅', '❆', '✨', '★']
  };

  const createSnowflakeElement = (x?: number): HTMLDivElement => {
    const chars = snowflakeChars[snowflakeType];
    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';
    
    // 風エフェクト
    if (windEffect) {
      snowflake.classList.add('wind-effect');
    }
    
    snowflake.textContent = chars[Math.floor(Math.random() * chars.length)];
    
    // ランダムなサイズ
    const sizes = ['size-small', 'size-medium', 'size-large', 'size-xlarge'];
    snowflake.classList.add(sizes[Math.floor(Math.random() * sizes.length)]);
    
    // 位置設定
    if (x !== undefined) {
      snowflake.style.left = x + 'px';
    } else {
      snowflake.style.left = Math.random() * window.innerWidth + 'px';
    }
    snowflake.style.top = '-50px';
    
    // アニメーション速度
    const randomSpeed = speed + (Math.random() * 10 - 5); // ±5秒のランダム性
    snowflake.style.animationDuration = randomSpeed + 's';
    
    // ブラーエフェクト
    if (blurEffect) {
      snowflake.style.filter = `blur(${Math.random() * 2}px)`;
    }
    
    // 透明度のバリエーション
    snowflake.style.opacity = (0.3 + Math.random() * 0.7).toString();
    
    return snowflake;
  };

  const updateStats = () => {
    const currentActive = activeSnowflakesRef.current.size;
    setStats(prev => ({
      totalCreated: prev.totalCreated + 1,
      currentActive
    }));
  };

  const removeSnowflake = (snowflakeId: number): boolean => {
    const snowflakeInfo = activeSnowflakesRef.current.get(snowflakeId);
    if (!snowflakeInfo) return false;
    
    try {
      if (snowflakeInfo.element && snowflakeInfo.element.parentNode) {
        snowflakeInfo.element.parentNode.removeChild(snowflakeInfo.element);
      }
    } catch (error) {
      console.warn('Failed to remove snowflake element:', error);
    }
    
    activeSnowflakesRef.current.delete(snowflakeId);
    setStats(prev => ({ ...prev, currentActive: activeSnowflakesRef.current.size }));
    
    return true;
  };

  const createSnowflake = (x?: number): SnowflakeInfo | null => {
    if (!containerRef.current) return null;

    const snowflakeId = snowflakeIdCounterRef.current++;
    const snowflake = createSnowflakeElement(x);
    
    const duration = (speed + (Math.random() * 10 - 5)) * 1000;
    
    const snowflakeInfo: SnowflakeInfo = {
      id: snowflakeId,
      element: snowflake,
      createdAt: Date.now(),
      duration
    };

    // アニメーション終了時に削除
    snowflake.addEventListener('animationend', () => {
      removeSnowflake(snowflakeId);
    });

    // 管理対象に追加
    activeSnowflakesRef.current.set(snowflakeId, snowflakeInfo);
    updateStats();
    
    // DOM追加
    containerRef.current.appendChild(snowflake);
    
    return snowflakeInfo;
  };

  const forceCleanup = () => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    
    activeSnowflakesRef.current.clear();
    setStats(prev => ({ ...prev, currentActive: 0 }));
  };

  const startSnowfall = () => {
    if (snowIntervalRef.current) return;
    
    const interval = 5000 / density; // 密度に応じて間隔を調整
    
    // 即座にいくつか作成
    for (let i = 0; i < 5; i++) {
      setTimeout(() => createSnowflake(), i * 100);
    }
    
    snowIntervalRef.current = window.setInterval(() => {
      createSnowflake();
    }, interval);
  };

  const stopSnowfall = () => {
    if (snowIntervalRef.current) {
      clearInterval(snowIntervalRef.current);
      snowIntervalRef.current = null;
    }
  };

  // コンポーネントマウント時にアニメーション開始
  useEffect(() => {
    startSnowfall();
    
    // 自動終了タイマー
    let autoFinishTimer: number | undefined;
    if (autoFinishTime > 0) {
      autoFinishTimer = window.setTimeout(() => {
        stopSnowfall();
        // 既存の雪が落ち切るまで待ってから終了
        setTimeout(() => {
          forceCleanup();
          onDismiss?.();
        }, speed * 1000 + 2000);
      }, autoFinishTime * 1000);
    }
    
    // クリーンアップ
    return () => {
      stopSnowfall();
      if (autoFinishTimer) {
        clearTimeout(autoFinishTimer);
      }
      forceCleanup();
    };
  }, []); // 依存配列を空にして初回のみ実行

  const getBackgroundClass = () => {
    switch (backgroundType) {
      case 'winter': return 'background-winter';
      case 'night': return 'background-night';
      case 'twilight': return 'background-twilight';
      default: return '';
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`snow-effect-container ${getBackgroundClass()}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
        background: backgroundType === 'default' ? 
          'linear-gradient(to bottom, #1e3c72, #2a5298)' : 
          undefined
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
        </div>
      )}
      
      <style>{`
        .snowflake {
          position: absolute;
          color: white;
          user-select: none;
          pointer-events: none;
          animation: snowfall linear;
          font-size: 1em;
          filter: blur(0px);
        }

        @keyframes snowfall {
          0% {
            transform: translateY(-100vh) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(100px) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes sway {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(50px);
          }
        }

        .wind-effect .snowflake {
          animation: snowfall linear, sway 3s ease-in-out infinite;
        }

        .size-small {
          font-size: 0.8em;
        }

        .size-medium {
          font-size: 1.2em;
        }

        .size-large {
          font-size: 1.6em;
        }

        .size-xlarge {
          font-size: 2em;
        }

        .background-winter {
          background: linear-gradient(to bottom, #e6f2ff, #cce7ff) !important;
        }

        .background-night {
          background: linear-gradient(to bottom, #0f0c29, #302b63, #24243e) !important;
        }

        .background-twilight {
          background: linear-gradient(to bottom, #ffd89b, #19547b) !important;
        }
      `}</style>
    </div>
  );
}
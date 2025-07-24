// DOM要素の取得
const cardsContainer = document.getElementById('cardsContainer');

/**
 * カードアニメーション管理クラス
 * 
 * @description
 * トランプカードアニメーションの作成、管理、制御を担当します。
 * 個々のカードの状態を追跡し、一括制御や統計情報の提供を行います。
 */
class CardManager {
  constructor() {
    this.activeCards = new Map(); // cardId -> cardInfo
    this.cardIdCounter = 0;
    this.stats = {
      totalCreated: 0,
      currentActive: 0,
      peakActive: 0
    };
  }

  /**
   * 新しいカードを作成してアニメーションを開始します
   * 
   * @returns {Object} カード情報オブジェクト
   */
  createCard() {
    const cardId = this.cardIdCounter++;
    const card = this._createCardElement();
    
    const cardInfo = {
      id: cardId,
      element: card,
      createdAt: Date.now(),
      duration: this._getRandomDuration(),
      position: { 
        x: Math.random() * window.innerWidth, 
        y: -100 
      },
      rotation: (Math.random() - 0.5) * 1080, // -540度から540度
      timeoutId: null
    };

    // アニメーション設定
    this._setupAnimation(cardInfo);
    
    // 管理対象に追加
    this.activeCards.set(cardId, cardInfo);
    this._updateStats();
    
    // DOM追加
    cardsContainer.appendChild(card);
    
    return cardInfo;
  }

  /**
   * 指定されたカードを削除します
   * 
   * @param {number} cardId - 削除するカードのID
   * @returns {boolean} 削除に成功した場合true
   */
  removeCard(cardId) {
    try {
      const cardInfo = this.activeCards.get(cardId);
      if (!cardInfo) {
        return false;
      }

      // クリーンアップ
      if (cardInfo.timeoutId) {
        clearTimeout(cardInfo.timeoutId);
      }
      
      this._safeRemoveElement(cardInfo.element);
      this.activeCards.delete(cardId);
      this._updateStats();
      
      return true;
    } catch (error) {
      console.error('Failed to remove card:', error);
      return false;
    }
  }

  /**
   * すべてのカードを強制的に削除します（メモリ安全性確保）
   */
  forceCleanup() {
    try {
      // 全タイムアウトクリア
      this.activeCards.forEach(cardInfo => {
        if (cardInfo.timeoutId) {
          clearTimeout(cardInfo.timeoutId);
        }
      });
      
      // DOM完全削除
      cardsContainer.innerHTML = '';
      
      // Map完全クリア
      this.activeCards.clear();
      
      // 統計リセット
      this.stats.currentActive = 0;
      
      console.log('CardManager: Force cleanup completed');
    } catch (error) {
      console.error('Failed to force cleanup:', error);
    }
  }

  /**
   * すべてのカードアニメーションを一時停止します
   */
  pauseAll() {
    this.activeCards.forEach(cardInfo => {
      // CSS アニメーションを一時停止
      if (cardInfo.element) {
        cardInfo.element.style.animationPlayState = 'paused';
      }
      
      // タイムアウトをクリア
      if (cardInfo.timeoutId) {
        clearTimeout(cardInfo.timeoutId);
        cardInfo.timeoutId = null;
      }
    });
  }

  /**
   * 一時停止されたカードアニメーションを再開します
   */
  resumeAll() {
    this.activeCards.forEach(cardInfo => {
      // CSS アニメーションを再開
      if (cardInfo.element) {
        cardInfo.element.style.animationPlayState = 'running';
      }
      
      // 残り時間を再計算してタイムアウトを設定
      const elapsed = Date.now() - cardInfo.createdAt;
      const remaining = Math.max(0, cardInfo.duration - elapsed);
      
      if (remaining > 0) {
        cardInfo.timeoutId = setTimeout(() => {
          this.removeCard(cardInfo.id);
        }, remaining);
      } else {
        // 既に時間が経過している場合は即座に削除
        this.removeCard(cardInfo.id);
      }
    });
  }

  /**
   * 現在の統計情報を取得します
   * 
   * @returns {Object} 統計情報オブジェクト
   */
  getStats() {
    return {
      totalCreated: this.stats.totalCreated,
      currentActive: this.activeCards.size,
      peakActive: this.stats.peakActive
    };
  }

  /**
   * 詳細な統計情報を取得します（デバッグ用）
   * 
   * @returns {Object} 詳細統計情報オブジェクト
   */
  getDetailedStats() {
    return {
      ...this.getStats(),
      activeCardIds: Array.from(this.activeCards.keys()),
      averageLifetime: this._calculateAverageLifetime()
    };
  }

  /**
   * アクティブなカード数を取得します
   * 
   * @returns {number} アクティブなカード数
   */
  getActiveCount() {
    return this.activeCards.size;
  }

  // Private methods

  /**
   * カード要素を作成します
   * 
   * @returns {HTMLElement} カード要素
   * @private
   */
  _createCardElement() {
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
  }

  /**
   * カードのアニメーションを設定します
   * 
   * @param {Object} cardInfo - カード情報オブジェクト
   * @private
   */
  _setupAnimation(cardInfo) {
    const { element, position, duration, rotation } = cardInfo;
    
    // 位置とアニメーション設定
    element.style.left = `${position.x}px`;
    element.style.top = `${position.y}px`;
    element.style.setProperty('--rotation', `${rotation}deg`);
    element.style.setProperty('--fall-duration', `${duration / 1000}s`);
    
    // 自動削除タイマー
    cardInfo.timeoutId = setTimeout(() => {
      this.removeCard(cardInfo.id);
    }, duration + 1000); // 少し余裕を持たせる
  }

  /**
   * ランダムなアニメーション時間を取得します
   * 
   * @returns {number} アニメーション時間（ミリ秒）
   * @private
   */
  _getRandomDuration() {
    return (3 + Math.random() * 3) * 1000; // 3-6秒
  }

  /**
   * 統計情報を更新します
   * 
   * @private
   */
  _updateStats() {
    this.stats.totalCreated++;
    this.stats.currentActive = this.activeCards.size;
    this.stats.peakActive = Math.max(this.stats.peakActive, this.stats.currentActive);
  }

  /**
   * 安全にDOM要素を削除します
   * 
   * @param {HTMLElement} element - 削除する要素
   * @private
   */
  _safeRemoveElement(element) {
    try {
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    } catch (error) {
      console.warn('Failed to remove element:', error);
    }
  }

  /**
   * 平均生存時間を計算します
   * 
   * @returns {number} 平均生存時間（ミリ秒）
   * @private
   */
  _calculateAverageLifetime() {
    if (this.activeCards.size === 0) return 0;
    
    const now = Date.now();
    let totalLifetime = 0;
    
    this.activeCards.forEach(cardInfo => {
      totalLifetime += now - cardInfo.createdAt;
    });
    
    return totalLifetime / this.activeCards.size;
  }
}

// CardManagerのグローバルインスタンス
const cardManager = new CardManager();

// 旧関数（互換性のため残置、内部でCardManagerを使用）
function createPlayingCard() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const suitNames = ['spades', 'hearts', 'diamonds', 'clubs'];
    
    const suit = Math.floor(Math.random() * suits.length);
    const value = values[Math.floor(Math.random() * values.length)];
    
    const card = document.createElement('div');
    card.className = `playing-card ${suitNames[suit]}`;
    card.textContent = value;
    card.setAttribute('data-suit', suits[suit]);
    
    // ランダムな開始位置（画面幅全体）
    const startX = Math.random() * window.innerWidth;
    card.style.left = `${startX}px`;
    card.style.top = `-100px`;
    
    // ランダムな回転とアニメーション時間
    const rotation = (Math.random() - 0.5) * 1080; // -540度から540度
    const duration = 3 + Math.random() * 3; // 3秒から6秒
    
    card.style.setProperty('--rotation', `${rotation}deg`);
    card.style.setProperty('--fall-duration', `${duration}s`);
    
    cardsContainer.appendChild(card);
    
    // アニメーション終了後に要素を削除
    setTimeout(() => {
        if (card.parentNode) {
            card.remove();
        }
    }, duration * 1000 + 1000); // 少し余裕を持たせる
}

// ソリティアクリア風のカード連続生成（CardManager使用版）
function startCardsCelebration() {
    // 前回の残骸を完全削除（メモリ安全性確保）
    cardManager.forceCleanup();
    
    let cardCount = 0;
    const maxCards = 104; // 2デッキ分
    const interval = 80; // カード生成間隔（ミリ秒）
    
    console.log('Starting cards celebration with CardManager');
    
    const cardInterval = setInterval(() => {
        cardManager.createCard();
        cardCount++;
        
        if (cardCount >= maxCards) {
            clearInterval(cardInterval);
            console.log('Cards generation completed:', cardManager.getStats());
            
            // 全アニメーション終了後の保険クリーンアップ（8秒後）
            setTimeout(() => {
                cardManager.forceCleanup();
                console.log('Animation cleanup completed');
            }, 8000); // 最大6秒アニメーション + 余裕2秒
        }
    }, interval);
}

// 雪エフェクトクラス
class SnowEffect {
    constructor() {
        this.canvas = document.getElementById('snowCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.snowflakes = [];
        this.animationId = null;
        this.isActive = false;
        
        this.initCanvas();
        this.generateSnowflakes();
        this.setupEventListeners();
    }
    
    initCanvas() {
        // キャンバスサイズを画面サイズに合わせる
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // 物理的なキャンバスサイズを設定
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        // CSSサイズを設定
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // コンテキストをスケーリング
        this.ctx.scale(dpr, dpr);
        
        // 論理サイズを更新（スノーフレーク座標計算用）
        this.screenWidth = rect.width;
        this.screenHeight = rect.height;
    }
    
    generateSnowflakes() {
        // 150個の雪片を生成
        for (let i = 0; i < 150; i++) {
            this.snowflakes.push(new Snowflake(this.screenWidth || window.innerWidth, this.screenHeight || window.innerHeight));
        }
    }
    
    setupEventListeners() {
        // リサイズ対応
        window.addEventListener('resize', () => {
            this.initCanvas();
        });
        
        // クリック・ESCキーで早期終了
        document.addEventListener('click', () => {
            if (this.isActive) {
                this.stop();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) {
                this.stop();
            }
        });
    }
    
    start() {
        if (this.isActive) return;
        
        this.isActive = true;
        const overlay = document.getElementById('snowOverlay');
        overlay.classList.add('active');
        
        this.animate();
        
        // 5秒後に自動終了
        this.autoStopTimeout = setTimeout(() => {
            this.stop();
        }, 5000);
    }
    
    stop() {
        if (!this.isActive) return;
        
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        if (this.autoStopTimeout) {
            clearTimeout(this.autoStopTimeout);
            this.autoStopTimeout = null;
        }
        
        const overlay = document.getElementById('snowOverlay');
        overlay.classList.remove('active');
        
        // フェードアウト完了後にキャンバスをクリア
        setTimeout(() => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }, 500);
    }
    
    animate() {
        if (!this.isActive) return;
        
        // キャンバスをクリア
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 全ての雪片を更新・描画
        this.snowflakes.forEach(flake => {
            flake.update();
            flake.draw(this.ctx);
        });
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
}

// 雪片クラス
class Snowflake {
    constructor(screenWidth, screenHeight) {
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        this.time = Math.random() * Math.PI * 2; // 横揺れ用の時間オフセット
        this.reset();
    }
    
    reset() {
        // より均等な初期位置分散
        this.x = Math.random() * this.screenWidth;
        // 初期表示時は画面全体に分散、再生成時は画面上部から
        if (this.y === undefined) {
            // 初期生成時：画面全体にランダム分散
            this.y = Math.random() * this.screenHeight;
        } else {
            // 再生成時：画面上部のより広い範囲から
            this.y = -Math.random() * 200 - 20;
        }
        
        // ランダムな速度（より自然な動き）
        this.vx = (Math.random() - 0.5) * 1.5; // 横方向速度を少し増加
        this.vy = Math.random() * 2 + 0.8; // 縦方向速度（0.8-2.8px/frame）
        
        // ランダムなサイズと透明度
        this.radius = Math.random() * 4 + 1.5; // 1.5-5.5px（より多様なサイズ）
        this.alpha = Math.random() * 0.5 + 0.5; // 0.5-1.0（より透明度のバリエーション）
    }
    
    update() {
        // 時間を進める
        this.time += 0.02;
        
        // 位置更新（横揺れ効果を追加）
        this.y += this.vy;
        this.x += this.vx + Math.sin(this.time) * 0.3; // 横揺れ効果
        
        // 画面外に出たら上部から再生成
        if (this.y > this.screenHeight + 10) {
            this.reset();
        }
        
        // 横方向の画面外処理
        if (this.x > this.screenWidth + 10) {
            this.x = -10;
        } else if (this.x < -10) {
            this.x = this.screenWidth + 10;
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        // 薄いグレーの縁取りを描画
        ctx.strokeStyle = 'rgba(150, 150, 150, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // 白い雪片を描画
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// 雪エフェクトインスタンス
const snowEffect = new SnowEffect();

// メインプロセスからのアニメーション開始指示を受信
window.electronAPI.receive('start-cards-animation', () => {
    startCardsCelebration();
});

window.electronAPI.receive('start-snow-animation', () => {
    snowEffect.start();
});
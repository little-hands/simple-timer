/**
 * トランプカードエフェクトの処理
 * オーバーレイウィンドウでのカードアニメーション機能を提供
 */

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

// CardManagerクラスのみを定義（エクスポートは別ファイルで行う）
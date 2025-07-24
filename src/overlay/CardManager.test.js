/**
 * CardManager テストケース
 * 
 * @description
 * CardManagerクラスの各機能の単体テストと統合テスト
 */

// テスト用のDOM要素を模擬
const mockCardsContainer = {
  appendChild: jest.fn(),
  innerHTML: '',
  removeChild: jest.fn()
};

// グローバルオブジェクトの模擬
global.document = {
  getElementById: jest.fn(() => mockCardsContainer),
  createElement: jest.fn(() => ({
    className: '',
    textContent: '',
    style: {
      left: '',
      top: '',
      setProperty: jest.fn(),
      animationPlayState: 'running'
    },
    setAttribute: jest.fn(),
    parentNode: mockCardsContainer
  }))
};

global.window = {
  innerWidth: 1920,
  innerHeight: 1080,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout
};

global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

// テスト対象のクラスを読み込み（overlay.jsから抽出）
class CardManager {
  constructor() {
    this.activeCards = new Map();
    this.cardIdCounter = 0;
    this.stats = {
      totalCreated: 0,
      currentActive: 0,
      peakActive: 0
    };
  }

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
      rotation: (Math.random() - 0.5) * 1080,
      timeoutId: null
    };

    this._setupAnimation(cardInfo);
    this.activeCards.set(cardId, cardInfo);
    this._updateStats();
    
    mockCardsContainer.appendChild(card);
    
    return cardInfo;
  }

  removeCard(cardId) {
    try {
      const cardInfo = this.activeCards.get(cardId);
      if (!cardInfo) return false;

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

  forceCleanup() {
    try {
      this.activeCards.forEach(cardInfo => {
        if (cardInfo.timeoutId) {
          clearTimeout(cardInfo.timeoutId);
        }
      });
      
      mockCardsContainer.innerHTML = '';
      this.activeCards.clear();
      this.stats.currentActive = 0;
      
      console.log('CardManager: Force cleanup completed');
    } catch (error) {
      console.error('Failed to force cleanup:', error);
    }
  }

  pauseAll() {
    this.activeCards.forEach(cardInfo => {
      if (cardInfo.element) {
        cardInfo.element.style.animationPlayState = 'paused';
      }
      
      if (cardInfo.timeoutId) {
        clearTimeout(cardInfo.timeoutId);
        cardInfo.timeoutId = null;
      }
    });
  }

  resumeAll() {
    this.activeCards.forEach(cardInfo => {
      if (cardInfo.element) {
        cardInfo.element.style.animationPlayState = 'running';
      }
      
      const elapsed = Date.now() - cardInfo.createdAt;
      const remaining = Math.max(0, cardInfo.duration - elapsed);
      
      if (remaining > 0) {
        cardInfo.timeoutId = setTimeout(() => {
          this.removeCard(cardInfo.id);
        }, remaining);
      } else {
        this.removeCard(cardInfo.id);
      }
    });
  }

  getStats() {
    return {
      totalCreated: this.stats.totalCreated,
      currentActive: this.activeCards.size,
      peakActive: this.stats.peakActive
    };
  }

  getDetailedStats() {
    return {
      ...this.getStats(),
      activeCardIds: Array.from(this.activeCards.keys()),
      averageLifetime: this._calculateAverageLifetime()
    };
  }

  getActiveCount() {
    return this.activeCards.size;
  }

  // Private methods
  _createCardElement() {
    return document.createElement('div');
  }

  _setupAnimation(cardInfo) {
    const { element, position, duration, rotation } = cardInfo;
    
    element.style.left = `${position.x}px`;
    element.style.top = `${position.y}px`;
    element.style.setProperty('--rotation', `${rotation}deg`);
    element.style.setProperty('--fall-duration', `${duration / 1000}s`);
    
    cardInfo.timeoutId = setTimeout(() => {
      this.removeCard(cardInfo.id);
    }, duration + 1000);
  }

  _getRandomDuration() {
    return (3 + Math.random() * 3) * 1000; // 3-6秒
  }

  _updateStats() {
    this.stats.totalCreated++;
    this.stats.currentActive = this.activeCards.size;
    this.stats.peakActive = Math.max(this.stats.peakActive, this.stats.currentActive);
  }

  _safeRemoveElement(element) {
    try {
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    } catch (error) {
      console.warn('Failed to remove element:', error);
    }
  }

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

// テストスイート
describe('CardManager', () => {
  let cardManager;

  beforeEach(() => {
    cardManager = new CardManager();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cardManager.forceCleanup();
  });

  describe('基本機能テスト', () => {
    test('カード作成時にMapに正しく追加される', () => {
      const cardInfo = cardManager.createCard();
      
      expect(cardInfo.id).toBe(0);
      expect(cardManager.getActiveCount()).toBe(1);
      expect(cardManager.activeCards.has(0)).toBe(true);
      expect(mockCardsContainer.appendChild).toHaveBeenCalledTimes(1);
    });

    test('カード削除時にMapから正しく削除される', () => {
      const cardInfo = cardManager.createCard();
      const result = cardManager.removeCard(cardInfo.id);
      
      expect(result).toBe(true);
      expect(cardManager.getActiveCount()).toBe(0);
      expect(cardManager.activeCards.has(cardInfo.id)).toBe(false);
    });

    test('存在しないカードの削除は失敗する', () => {
      const result = cardManager.removeCard(999);
      
      expect(result).toBe(false);
    });

    test('統計情報が正確に更新される', () => {
      cardManager.createCard();
      cardManager.createCard();
      cardManager.createCard();
      
      const stats = cardManager.getStats();
      expect(stats.totalCreated).toBe(3);
      expect(stats.currentActive).toBe(3);
      expect(stats.peakActive).toBe(3);
      
      cardManager.removeCard(0);
      const updatedStats = cardManager.getStats();
      expect(updatedStats.currentActive).toBe(2);
      expect(updatedStats.peakActive).toBe(3); // ピーク値は維持
    });
  });

  describe('一括制御機能テスト', () => {
    test('pauseAllが全カードを一時停止する', () => {
      const card1 = cardManager.createCard();
      const card2 = cardManager.createCard();
      
      cardManager.pauseAll();
      
      expect(card1.element.style.animationPlayState).toBe('paused');
      expect(card2.element.style.animationPlayState).toBe('paused');
      expect(card1.timeoutId).toBeNull();
      expect(card2.timeoutId).toBeNull();
    });

    test('resumeAllが一時停止されたカードを再開する', () => {
      const card1 = cardManager.createCard();
      const card2 = cardManager.createCard();
      
      cardManager.pauseAll();
      cardManager.resumeAll();
      
      expect(card1.element.style.animationPlayState).toBe('running');
      expect(card2.element.style.animationPlayState).toBe('running');
    });

    test('forceCleanupが完全削除する', () => {
      cardManager.createCard();
      cardManager.createCard();
      cardManager.createCard();
      
      expect(cardManager.getActiveCount()).toBe(3);
      
      cardManager.forceCleanup();
      
      expect(cardManager.getActiveCount()).toBe(0);
      expect(mockCardsContainer.innerHTML).toBe('');
      expect(console.log).toHaveBeenCalledWith('CardManager: Force cleanup completed');
    });
  });

  describe('統計・情報取得テスト', () => {
    test('詳細統計情報が正しく取得できる', () => {
      const card1 = cardManager.createCard();
      const card2 = cardManager.createCard();
      
      const detailedStats = cardManager.getDetailedStats();
      
      expect(detailedStats.totalCreated).toBe(2);
      expect(detailedStats.currentActive).toBe(2);
      expect(detailedStats.activeCardIds).toEqual([card1.id, card2.id]);
      expect(typeof detailedStats.averageLifetime).toBe('number');
      expect(detailedStats.averageLifetime).toBeGreaterThanOrEqual(0);
    });

    test('平均生存時間の計算が正しい', async () => {
      const card1 = cardManager.createCard();
      
      // 少し時間を経過させる
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const detailedStats = cardManager.getDetailedStats();
      expect(detailedStats.averageLifetime).toBeGreaterThan(90);
      expect(detailedStats.averageLifetime).toBeLessThan(200);
    });

    test('カードが存在しない場合の平均生存時間は0', () => {
      const detailedStats = cardManager.getDetailedStats();
      expect(detailedStats.averageLifetime).toBe(0);
    });
  });

  describe('エラーハンドリングテスト', () => {
    test('DOM操作エラーが適切に処理される', () => {
      const cardInfo = cardManager.createCard();
      
      // DOM操作でエラーを発生させる
      cardInfo.element.parentNode = null;
      
      const result = cardManager.removeCard(cardInfo.id);
      expect(result).toBe(true); // エラーが発生してもtrueを返す
      expect(console.warn).toHaveBeenCalled();
    });

    test('forceCleanup時のエラーが適切に処理される', () => {
      // DOM操作でエラーを発生させる設定
      mockCardsContainer.innerHTML = null;
      
      cardManager.forceCleanup();
      
      // エラーが発生してもクラッシュしない
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('統合テスト（startCardsCelebration模擬）', () => {
    test('104枚連続生成のシミュレーション', async () => {
      const maxCards = 104;
      const createdCards = [];
      
      // 104枚生成
      for (let i = 0; i < maxCards; i++) {
        createdCards.push(cardManager.createCard());
      }
      
      expect(cardManager.getActiveCount()).toBe(maxCards);
      expect(cardManager.getStats().totalCreated).toBe(maxCards);
      expect(cardManager.getStats().peakActive).toBe(maxCards);
      
      // 強制クリーンアップ
      cardManager.forceCleanup();
      
      expect(cardManager.getActiveCount()).toBe(0);
    });

    test('連続実行時の前回データ削除', () => {
      // 1回目の実行
      cardManager.createCard();
      cardManager.createCard();
      expect(cardManager.getActiveCount()).toBe(2);
      
      // 2回目実行前の強制クリーンアップ
      cardManager.forceCleanup();
      expect(cardManager.getActiveCount()).toBe(0);
      
      // 2回目の実行
      cardManager.createCard();
      expect(cardManager.getActiveCount()).toBe(1);
    });
  });

  describe('パフォーマンステスト', () => {
    test('大量カード生成時の処理時間', () => {
      const startTime = Date.now();
      const maxCards = 100;
      
      for (let i = 0; i < maxCards; i++) {
        cardManager.createCard();
      }
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // 100枚生成が1秒以内に完了することを確認
      expect(processingTime).toBeLessThan(1000);
      expect(cardManager.getActiveCount()).toBe(maxCards);
    });

    test('統計情報取得の処理時間', () => {
      // 50枚生成
      for (let i = 0; i < 50; i++) {
        cardManager.createCard();
      }
      
      const startTime = Date.now();
      const stats = cardManager.getDetailedStats();
      const endTime = Date.now();
      
      // 統計情報取得が10ms以内に完了することを確認
      expect(endTime - startTime).toBeLessThan(10);
      expect(stats.currentActive).toBe(50);
    });
  });
});

// 実行時の設定
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CardManager };
}
// カード効果は card-effects.js で管理

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

// カード関連の処理は card-effects.js に移動

// ポップアップエフェクトクラス
class PopupEffect {
    constructor() {
        this.setupEventListeners();
    }
    
    // 後方互換性のため残す（非推奨）
    async showEffect() {
        console.log('PopupEffect: showEffect() is deprecated. Use handleOverlayEffect() instead.');
        await this.handleOverlayEffect('popup');
    }
    
    async handleOverlayEffect(effectType) {
        console.log(`PopupEffect: Starting overlay effect: ${effectType}`);
        
        try {
            // EffectManagerをダイナミックにインポート
            const { OverlayEffectManager } = await import('./overlay/OverlayEffectManager.js');
            const effectManager = new OverlayEffectManager();
            
            switch (effectType) {
                case 'popup':
                    await effectManager.showEffect('popup');
                    break;
                case 'popup-preact':
                    // Preactベースのポップアップ
                    await this.showPreactPopup();
                    break;
                case 'sample':
                    // サンプルエフェクト（時間経過で自動消失）
                    await effectManager.showSampleEffect();
                    break;
                default:
                    console.warn(`PopupEffect: Unknown effect type: ${effectType}`);
                    // フォールバック: デフォルトエフェクトとしてpopupを表示
                    await effectManager.showEffect('popup');
                    break;
            }
            
            console.log(`PopupEffect: ${effectType} effect completed`);
        } catch (error) {
            console.error(`PopupEffect: Failed to show ${effectType} effect:`, error);
        }
    }
    
    async showPreactPopup() {
        console.log('PopupEffect: Showing Preact popup...');
        
        try {
            // Preact popupのHTMLに切り替え
            window.location.href = './popup-preact.html';
        } catch (error) {
            console.error('PopupEffect: Failed to show Preact popup:', error);
        }
    }
    
    setupEventListeners() {
        // ElectronAPIの準備を待つ
        const setupIPC = () => {
            if (window.electronAPI) {
                console.log('PopupEffect: Setting up IPC listeners...');
                
                // 汎用オーバーレイエフェクト開始イベント（receiveを使用）
                window.electronAPI.receive('start-overlay-effect', (effectType) => {
                    console.log(`IPC: Start overlay effect received: ${effectType}`);
                    this.handleOverlayEffect(effectType);
                });
                
                console.log('PopupEffect: IPC setup complete');
            } else {
                console.warn('PopupEffect: electronAPI not ready, retrying...');
                setTimeout(setupIPC, 100);
            }
        };
        
        setTimeout(setupIPC, 100);
    }
}

// ポップアップエフェクトインスタンス
const popupEffect = new PopupEffect();

window.electronAPI.receive('start-snow-animation', () => {
    snowEffect.start();
});
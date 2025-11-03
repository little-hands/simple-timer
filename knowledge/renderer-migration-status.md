# レンダラープロセスの技術スタック移行状況

**作成日**: 2025-11-03  
**最終更新**: 2025-11-03

## 概要
Simple Timerアプリには3つの独立したレンダラープロセス（BrowserWindow）があります。
それぞれ異なる技術スタックで実装されており、段階的な移行が進行中です。

## 3つのレンダラープロセス

### 1. Timer Window（タイマー画面）
**役割**: メインのタイマーUI、カウントダウン制御

**ファイル構成**:
```
src/timer/
├── timer.html       # HTMLテンプレート
├── timer.ts         # TypeScript実装
├── timer.css        # スタイル
├── functions.ts     # 純粋関数群
└── functions.test.ts # ユニットテスト
```

**技術スタック**:
- TypeScript ✅
- ES6 Modules ✅
- ユニットテスト完備 ✅

**状態**: ✅ **完了** - TypeScript化、モジュール化済み

---

### 2. Overlay Window（エフェクト表示）
**役割**: フルスクリーン透明ウィンドウでエフェクト表示

**ファイル構成**:
```
src/overlay/
├── overlay.html                 # エントリーポイント
└── overlay-preact/             # Preact実装
    ├── vite.config.ts
    └── src/
        ├── OverlayApp.tsx      # ルートコンポーネント
        ├── main.tsx            # エントリー
        ├── style.css
        └── components/
            ├── CardsComponent.tsx   # トランプカードエフェクト
            ├── SnowComponent.tsx    # 雪エフェクト
            └── PopupComponent.tsx   # ポップアップエフェクト
```

**技術スタック**:
- Preact + TypeScript ✅
- Viteビルド ✅
- コンポーネント指向 ✅

**状態**: ✅ **完了** - Preact実装完了、4種類のエフェクト対応

**対応エフェクト**:
- `notifier` - Mac通知センター + アラーム音
- `cards` - トランプカードアニメーション
- `snow` - 雪エフェクト
- `popup` - ポップアップ表示

---

### 3. Settings Window（設定画面）
**役割**: エフェクト選択などの設定UI

**ファイル構成**:
```
src/settings/
├── settings.html    # HTMLテンプレート
├── settings.js      # Vanilla JavaScript実装
└── settings.css     # スタイル
```

**技術スタック**:
- Vanilla JavaScript ⚠️
- ES5スタイル ⚠️
- 型定義なし ⚠️

**状態**: ⚠️ **移行未完了** - TypeScript化が必要

**問題点**:
1. **技術スタックの不統一**: timer/overlayはTypeScriptだが、settingsはVanilla JS
2. **型安全性の欠如**: TypeScriptの恩恵を受けられない
3. **モジュール管理の不在**: ES6 Modulesを使用していない
4. **保守性の低下**: 他のコードベースとの一貫性がない

---

## 移行の歴史（推測）

### Phase 1: 初期実装
- すべてのレンダラーをVanilla JavaScriptで実装

### Phase 2: Timer TypeScript化 ✅
- メインのタイマーロジックをTypeScript化
- 純粋関数の分離とテスト追加
- ES6 Modules導入

### Phase 3: Overlay Preact化 ✅
- 視覚エフェクトのためにPreact導入
- コンポーネント指向の実装
- 複数エフェクトの統一管理

### Phase 4: Settings TypeScript化 ⏳ **← 現在ここ**
- まだ実施されていない
- 技術スタック統一のため必要

---

## 次のステップ

### 優先度: 高
**Settings WindowのTypeScript化**

**目的**:
- 技術スタックの統一
- 型安全性の向上
- 保守性の改善

**作業内容**:
1. `settings.js` → `settings.ts` にリネーム・変換
2. ES6 Modules化
3. 型定義の追加
4. electronAPI呼び出しの型安全化

**期待される効果**:
- コードベース全体の一貫性向上
- バグの早期発見（型チェック）
- リファクタリングの容易さ

---

## 参考情報

### 関連ファイル
- メインプロセス: `src/main/main.ts`
- IPC通信: `src/main/handlers/IPCHandler.ts`
- 型定義: `src/types/app-types.ts`
- Preload: `src/preload.ts`

### 関連Issue
- Issue #7: メニューバーアイコン表示（作業中）
- Issue #21: Settings WindowのTypeScript化

# Effects Playground

このディレクトリには、Simple Timerアプリのエフェクトを単体で試したり、実験したりするためのHTMLファイルが含まれています。

## Playgroundファイル

### 1. Cards Effect Playground (`cards-effect.html`)

トランプカードが画面に降り注ぐアニメーションエフェクトを体験できるプレイグラウンドです。

**機能:**
- 3種類のアニメーション（落下、スパイラル、バウンス）
- カード枚数の調整（10〜100枚）
- アニメーション時間の調整（1〜10秒）
- ドラッグ&ドロップでカードを動かせる
- リアルタイム統計表示

**操作方法:**
- `スペースキー`: アニメーション開始
- `Escキー`: アニメーション停止
- `Cキー`: 全カードクリア
- マウスドラッグ: カードを移動

### 2. Snow Effect Playground (`snow-effect.html`)

雪が画面に降るアニメーションエフェクトを体験できるプレイグラウンドです。

**機能:**
- 密度調整（10〜200）
- 降雪速度調整（3〜30秒）
- 4種類の雪フレークタイプ（ドット、星、雪結晶、スパークル）
- 4種類の背景テーマ
- 風エフェクト（左右に揺れる）
- ブラーエフェクト
- バーストモード（一気に大量の雪）

**操作方法:**
- `スペースキー`: 降雪開始
- `Escキー`: 降雪停止
- `Cキー`: 全雪クリア
- `Bキー`: スノーバースト
- マウスクリック: クリック位置に雪を生成

### 3. Preact Components Test (`preact-test.html`)

上記エフェクトのPreactコンポーネント版をテストできるファイルです。

**機能:**
- 純粋なPreact/Hooks実装
- overlay-preact統合対応
- 設定可能なProps
- 自動クリーンアップ
- 開発用統計情報

**操作方法:**
- `1キー`: カードエフェクト開始
- `2キー`: スノーエフェクト開始  
- `Escキー`: エフェクト停止

### 4. Preact Component Files

#### `CardsComponent.tsx`
overlay-preactにそのまま移植可能なカードエフェクトコンポーネント。

**Props:**
```typescript
interface CardsComponentProps {
  onDismiss?: () => void;
  interval?: number;      // カード生成間隔（ミリ秒）
  totalCards?: number;    // 総カード数
  duration?: number;      // アニメーション時間（秒）
  autoFinish?: boolean;   // 自動終了するか
}
```

#### `SnowComponent.tsx`
overlay-preactにそのまま移植可能なスノーエフェクトコンポーネント。

**Props:**
```typescript
interface SnowComponentProps {
  onDismiss?: () => void;
  density?: number;           // 雪の密度
  speed?: number;             // 降雪速度（秒）
  snowflakeType?: string;     // 雪フレークの種類
  windEffect?: boolean;       // 風エフェクト
  blurEffect?: boolean;       // ブラーエフェクト
  backgroundType?: string;    // 背景テーマ
  autoFinishTime?: number;    // 自動終了時間（秒）
}
```

## 使用方法

### 1. ブラウザで直接開く

```bash
# カードエフェクトのプレイグラウンド
open playground/cards-effect.html

# スノーエフェクトのプレイグラウンド
open playground/snow-effect.html

# Preactコンポーネントのテスト
open playground/preact-test.html
```

### 2. HTTPサーバーを使用する（推奨）

```bash
# Python 3の場合
cd playground
python3 -m http.server 8000

# Node.jsのhttp-serverを使用する場合
npx http-server playground

# ブラウザで以下にアクセス
# http://localhost:8000/cards-effect.html
# http://localhost:8000/snow-effect.html
# http://localhost:8000/preact-test.html
```

## 開発用途

これらのファイルは以下の用途で使用できます：

1. **エフェクトの動作確認**: Electronアプリを起動せずに単体でエフェクトをテスト
2. **パフォーマンステスト**: 様々な設定でのパフォーマンス影響を確認
3. **クロスブラウザテスト**: Safari、Chrome、Firefoxでの互換性確認
4. **レスポンシブテスト**: 異なる画面サイズでの動作確認
5. **エフェクトのプロトタイピング**: 新しいアニメーションの実験

## 注意事項

- これらのファイルはElectronのpreload APIを使用していないため、Electronアプリとは独立して動作します
- パフォーマンステストの結果は、実際のElectronアプリでの動作と異なる場合があります
- 大量のエフェクトを同時に実行する場合、ブラウザが重くなる可能性があります

## カスタマイズ

各ファイルのCSS変数やJavaScript設定を変更することで、エフェクトをカスタマイズできます：

- アニメーション速度の調整
- 色やサイズの変更
- 新しいアニメーションパターンの追加
- キーボードショートカットの変更

## Electronアプリへの統合

### HTMLプレイグラウンドからの統合

テストが完了したエフェクトは、以下の手順でElectronアプリに統合できます：

1. エフェクトのCSS/JavaScriptコードを`src/overlay/overlay-preact/`に移植
2. PreactコンポーネントとしてラップCore
3. `OverlayApp.tsx`で新しいエフェクトタイプを追加
4. `AppConfigStore`でエフェクト設定を追加

### Preactコンポーネントの統合

PlaygroundのPreactコンポーネントファイルをそのままoverlay-preactに移植できます：

1. **ファイルコピー:**
   ```bash
   # CardsComponentを移植
   cp playground/CardsComponent.tsx src/overlay/overlay-preact/src/components/
   
   # SnowComponentを移植
   cp playground/SnowComponent.tsx src/overlay/overlay-preact/src/components/
   ```

2. **OverlayApp.tsxで統合:**
   ```typescript
   import { CardsComponent } from './components/CardsComponent';
   import { SnowComponent } from './components/SnowComponent';
   
   // handleOverlayEffect内で使用
   case 'cards':
     setCurrentEffect('cards');
     break;
   case 'snow':
     setCurrentEffect('snow');
     break;
   
   // レンダリング部分
   {currentEffect === 'cards' && (
     <CardsComponent onDismiss={handleEffectDismiss} />
   )}
   {currentEffect === 'snow' && (
     <SnowComponent onDismiss={handleEffectDismiss} />
   )}
   ```

3. **設定の追加:**
   ```typescript
   // AppConfigStore.tsでエフェクト設定を拡張
   interface AppConfig {
     // 既存設定...
     cardsEffectConfig?: {
       interval: number;
       totalCards: number;
       duration: number;
     };
     snowEffectConfig?: {
       density: number;
       speed: number;
       snowflakeType: string;
       // ...他の設定
     };
   }
   ```

### 統合のメリット

- **即座に使用可能**: playgroundで動作確認済みのコンポーネント
- **設定可能**: Props経由で様々なパラメータを調整可能
- **メモリ安全**: 自動クリーンアップ機能内蔵
- **TypeScript対応**: 型安全な実装
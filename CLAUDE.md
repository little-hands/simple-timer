# Simple Timer プロジェクト

## プロジェクト概要
MacのデスクトップElectronアプリとして、AS Timerユーザーが乗り換えたくなるレベルのタイマーアプリを開発する。

## 目的
- 普段使いのタイマー（集中作業・生活リズム・リマインドなどに）

## 対象ユーザー
- 自分（Macユーザー）
- AS Timerユーザーが「乗り換えたくなる」レベルを目指す

## 必須機能（MVP）
- カウントダウンタイマー（分単位）
- スタート・ストップ・リセット
- シンプルなUI（なるべくマウス不要で完結）
- 通知（終了時の音やポップアップ）

## 追加したい機能（Nice to have）
- キーボードショートカット
- ダークモード対応
- メニューバー常駐
- 設定プリセット（25分集中/5分休憩 みたいな）
- 作業ログ（何回タイマー回したか）

## 技術スタック
- Platform: Mac デスクトップ
- Framework: Electron
- Language: JavaScript/TypeScript（未定）

## 開発順序
1. **基本セットアップ**
   - Electron環境構築
   - 基本的なウィンドウ表示

2. **コアタイマー機能**
   - カウントダウンロジック
   - 分単位の時間設定
   - スタート/ストップ/リセット

3. **シンプルUI**
   - 最小限のボタンとディスプレイ
   - キーボードショートカット（Space:開始/停止、R:リセット、数字:時間設定）

4. **通知機能**
   - タイマー終了時の音
   - Mac通知センター連携

5. **追加機能（優先度順）**
   - ダークモード
   - メニューバー常駐
   - プリセット（25分/5分など）
   - 作業ログ

## 開発進捗

### Phase 1: 基本実装 ✅
- [x] Electronプロジェクトの初期セットアップ
- [x] 基本的なタイマー機能の実装（カウントダウン、スタート・ストップ・リセット）
- [x] 円形プログレスバーによる視覚的UI
- [x] アイコンベースの操作ボタン（再生・リセット）

### Phase 2: UI最適化 ✅
- [x] レイアウト調整とボタン配置の最適化
- [x] アプリサイズの最適化（180x180正方形ウィンドウ）
- [x] プログレスリング周辺へのボタン配置

### Phase 3: アプリ配布対応 ✅
- [x] electron-builderによるmacOSアプリパッケージング
- [x] Intel/Apple Silicon両対応のDMG生成
- [x] カスタムアプリアイコンの作成と実装
- [x] 透明角処理によるアイコン品質向上

### 今後のタスク
- [ ] 通知機能の実装（音・Mac通知）
- [ ] キーボードショートカットの実装
- [ ] ダークモード対応
- [ ] メニューバー常駐機能
- [ ] プリセット機能（ポモドーロなど）
- [ ] 作業ログ機能

## 技術仕様

### アーキテクチャ
- **メインプロセス**: `src/main/` - 責務分離されたElectronメインプロセス管理
  - `index.ts` - アプリケーションエントリーポイント
  - `AppConfigStore.ts` - アプリケーション機能設定の管理
  - `WindowStateStore.ts` - ウィンドウ状態の永続化ストレージ
  - `TimerWindowManager.ts` / `OverlayWindowManager.ts` - ウィンドウのライフサイクル管理
  - `IPCHandler.ts` - プロセス間通信の処理
  - `constants.ts` - 定数定義
- **レンダラー**: `src/renderer/` - ES6モジュール形式のブラウザ環境コード
  - `renderer.ts` - タイマーロジックとUI制御
  - `functions.ts` - 純粋関数群（計算処理）
  - `functions.test.ts` - 関数群のユニットテスト
- **プリロード**: `src/preload.ts` - セキュアなAPI橋渡し
- **スタイリング**: `style.css` - フレックスボックスレイアウト
- **型定義**: `src/types/electron.ts` - TypeScript型定義

### ウィンドウ設定
- サイズ: 180x180px（正方形）
- リサイズ不可
- 常に最前面表示

### UI要素
- **進捗表示**: SVGによる円形プログレスリング（半径65px）
- **操作ボタン**: アイコンベース（再生/一時停止、リセット）
- **配置**: タイマー円周辺の右上・左下エリア

### ビルド設定
- **ターゲット**: macOS (Intel/Apple Silicon)
- **出力形式**: DMG、ZIP
- **アイコン**: 透明角処理済みicnsファイル

## リポジトリ
https://github.com/little-hands/simple-timer

## 関連ドキュメント
- [UI要素名一覧](UI_ELEMENTS.md) - 指示時に使用する各要素の名称定義

## 作業用ドキュメント管理ルール

### work_documents/ ディレクトリ
一時的な作業ファイルやメモは `work_documents/` ディレクトリ内で管理する。

#### 基本ルール
- **Git管理対象外**: `.gitignore` で除外されており、コミットされない
- **一時的なファイル専用**: 実装プラン、TODO、作業メモなどの一時的なファイルのみ
- **作業完了後の移動**: 必要な情報は `CLAUDE.md`、コード内コメント、Issue等の適切な場所に移動

#### ファイル命名規則
```
issue-{イシュー番号}_{作業内容の概要}.md
```

**命名例:**
- `issue-1_direct-number-input-implementation.md` - Issue #1: 直接数字入力機能実装
- `issue-3_menubar-resident-feature.md` - Issue #3: メニューバー常駐機能実装
- `issue-6_dark-mode-support.md` - Issue #6: ダークモード対応

#### 使用用途
- **実装計画**: 段階的開発のフェーズ設計
- **進捗管理**: チェックリスト形式の作業進捗
- **作業メモ**: 実装中の注意点や発見事項
- **ユーザー確認手順**: 動作確認の具体的な手順書
- **トラブルシューティング**: 問題発生時の対処法

#### ベストプラクティス
- **Issue番号の明記**: 対応するGitHub Issue番号を必ず含める
- **作業概要の明記**: ファイル名から内容が推測できるようにする
- **完了後のクリーンアップ**: 作業完了時に必要な情報を適切な場所に移動
- **バックアップ不要**: 一時ファイルのため、削除しても問題ない前提で管理

## GitHub Issue テンプレート

新機能や改善要求のissueを作成する際は、以下のテンプレート構造に従うこと：

### 1. ユーザーストーリー
```
[ユーザータイプ]として、
[機能・要求]がしたい。
なぜなら[理由・背景]
```

### 2. 受入基準
Gherkin記法（Given-When-Then）を使用してテストシナリオを記述：
```
**Scenario 1: [シナリオ名]**
- Given [前提条件]
- When [アクション]
- Then [期待される結果]

**Scenario 2: [シナリオ名]**
- Given [前提条件]  
- When [アクション]
- Then [期待される結果]
```

### 3. 技術設計
以下の項目を含む技術設計の詳細：
- **現在の実装状況分析**
- **アーキテクチャ選択の根拠**
- **実装アプローチ**
- **具体的なコード修正内容**（ファイル別）
- **設計改善ポイント**
- **エラーハンドリング戦略**
- **テスト手法の推奨事項**

このテンプレートにより、ユーザー視点から技術実装まで包括的にカバーし、実装の品質と一貫性を確保する。

## Issue #13 技術設計（Phase 4リファクタリング対応版）

### 現在のアーキテクチャ分析（Phase 4完了後）

**リファクタリング後の構造**:
```
src/
├── main/           (メインプロセス - Node.js CommonJS)
├── renderer/       (レンダラープロセス - ES6 Modules)
│   ├── renderer.ts      - UIロジック・ElectronAPI呼び出し
│   ├── functions.ts     - 純粋関数群（計算処理）
│   └── functions.test.ts - ユニットテスト
├── preload.ts      (セキュアブリッジ - CommonJS)
└── types/          (型定義)
```

**現在のエフェクト実行フロー**:
```typescript
// src/renderer/renderer.ts:173-192
async function timerFinished(): Promise<void> {
    // 1. 基本状態変更
    isRunning = false;
    updateStartButtonIcon(isRunning);
    timerContainer.classList.add('timer-finished');
    
    // 2. 全エフェクト実行（要変更）
    sendNotification(totalSeconds);        // Mac通知 + IPC
    playAlarmSound();                     // ブラウザ音声
    startCardsCelebration();              // トランプ + IPC
}
```

### アーキテクチャ選択の根拠

**ES6モジュール対応**:
- レンダラーコードは全てES6 modules形式
- `import`/`export`構文使用
- ブラウザ環境での動作保証

**責務分離の活用**:
- `functions.ts`: 計算処理（純粋関数）
- `renderer.ts`: UI制御・IPC通信
- エフェクト選択ロジックは`renderer.ts`に追加

**設定管理の配置**:
- メインプロセス: `AppConfigStore`で永続化
- レンダラープロセス: 設定値のキャッシュと使用のみ

### 実装アプローチ（フェーズ別）

**Phase 1: 型定義と設定拡張**
```typescript
// src/types/electron.ts
export type EffectType = 'notifier' | 'cards';

export interface AppConfig {
  // 既存設定...
  effectType: EffectType;
}

export enum IPCChannels {
  // 既存チャンネル...
  GET_APP_CONFIG = 'get-app-config',
  SET_EFFECT_TYPE = 'set-effect-type'
}
```

**Phase 2: preload.ts API拡張**
```typescript
// src/preload.ts 追加
contextBridge.exposeInMainWorld('electronAPI', {
  // 既存API...
  
  // 設定管理API（新規追加）
  getAppConfig: (): Promise<AppConfig> => ipcRenderer.invoke('get-app-config'),
  setEffectType: (effectType: EffectType): Promise<void> => 
    ipcRenderer.invoke('set-effect-type', effectType)
});
```

**Phase 3: AppConfigStore設定保存機能**
```typescript
// src/main/AppConfigStore.ts 拡張
export class AppConfigStore {
  getEffectType(): EffectType {
    const config = this.getAppConfig();
    return config.effectType;
  }
  
  async setEffectType(effectType: EffectType): Promise<void> {
    if (!this.store) {
      throw new Error('AppConfigStore not initialized');
    }
    
    const currentConfig = this.getAppConfig();
    const updatedConfig = { ...currentConfig, effectType };
    this.store.set('appConfig', updatedConfig);
  }
  
  // レンダラーへの公開用（セキュリティ考慮）
  getPublicConfig(): AppConfig {
    return this.getAppConfig();
  }
}
```

**Phase 4: IPCHandler拡張**
```typescript
// src/main/IPCHandler.ts 追加処理
export class IPCHandler {
  setupHandlers(): void {
    // 既存ハンドラー...
    
    // 設定API
    ipcMain.handle(IPCChannels.GET_APP_CONFIG, () => {
      return this.appConfigStore.getPublicConfig();
    });
    
    ipcMain.handle(IPCChannels.SET_EFFECT_TYPE, async (event, effectType: EffectType) => {
      await this.appConfigStore.setEffectType(effectType);
      return true;
    });
  }
  
  private handleTimerFinished(totalSeconds: number): void {
    const effectType = this.appConfigStore.getEffectType();
    this.executeEffect(effectType, totalSeconds);
  }
  
  private executeEffect(effectType: EffectType, totalSeconds: number): void {
    switch (effectType) {
      case 'notifier':
        this.showNotification(totalSeconds);
        break;
      case 'cards':
        this.handleCardsCelebration();
        break;
    }
  }
}
```

**Phase 5: レンダラー側エフェクト制御**
```typescript
// src/renderer/renderer.ts 新規追加部分

// エフェクト選択関連の状態
let currentEffectType: EffectType = 'notifier'; // デフォルト

// 設定読み込み
async function loadAppConfig(): Promise<void> {
  try {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI && typeof electronAPI.getAppConfig === 'function') {
      const config = await electronAPI.getAppConfig();
      currentEffectType = config.effectType;
      updateSettingsUI();
    }
  } catch (error) {
    console.warn('設定読み込みに失敗しました:', error);
    currentEffectType = 'notifier'; // フォールバック
  }
}

// timerFinished関数の修正
async function timerFinished(): Promise<void> {
  try {
    isRunning = false;
    updateStartButtonIcon(isRunning);
    timerContainer.classList.add('timer-finished');
    
    // エフェクト設定に基づく実行
    switch (currentEffectType) {
      case 'notifier':
        // 通知 + 音声の組み合わせ
        sendNotification(totalSeconds);
        playAlarmSound();
        break;
      case 'cards':
        // トランプアニメーションのみ
        startCardsCelebration();
        break;
    }
    
  } catch (error) {
    console.error('タイマー終了処理でエラーが発生しました:', error);
  }
}

// アプリ初期化時に設定読み込み
loadAppConfig();
```

### 設計改善ポイント

**ES6モジュール活用**:
- `import`/`export`による明確な依存関係
- ツリーシェイキング対応
- モジュール境界の明確化

**責務分離の強化**:
- `functions.ts`: 純粋関数（テスト容易）
- `renderer.ts`: UI制御・IPC通信・状態管理
- `main/`: 永続化・ネイティブ機能

**型安全性**:
- `EffectType`による選択肢の型制約
- `AppConfig`インターフェースによる設定構造保証
- preload.tsでのIPC通信型安全性

**エラーハンドリング**:
- 設定読み込み失敗時のフォールバック
- IPC通信エラーの適切な処理
- UI状態の一貫性保証

## 開発フロー - Electron自動起動システム


## tmux操作ガイド

### tmux send-keysコマンドの使用ルール
**文字列を送信する場合は**、必ず以下の形式で実行すること：
```bash
tmux send-keys -t {ペインID（%N形式）} "{送信する文字列}" && sleep 0.2 Enter
```

## 開発ベストプラクティス

### 段階的開発手法

#### 1. Issue管理のベストプラクティス
- **粒度の細分化**: 大きな機能を小さな実装可能な単位に分解
- **ラベリング**: カテゴリ別ラベル（例：通知機能🔔、メニューバー常駐📍）で分類
- **ユーザーストーリー**: Gherkin記法（Given-When-Then）で受入基準を明確化
- **技術設計**: アーキテクチャ選択の根拠と具体的実装手順を文書化

#### 2. 段階的開発プロセス
新機能開発時は以下の段階を踏む：

**Phase 1: 現状確認**
- 既存機能の動作確認
- 基盤となるコードの理解
- 既存実装との競合チェック

**Phase 2-N: 段階的実装**
- 各段階で1つの明確な目標設定
- 段階ごとの動作確認（自動 + ユーザー確認）
- 問題発生時の切り戻し可能性確保

**最終段階: 統合テスト**
- エンドツーエンドでの動作確認
- 既存機能への影響確認
- ユーザー受入テスト

#### 3. セッション継続性の確保
- **TODO管理ファイル**: セッション間で進捗を引き継ぐためのMarkdownファイル作成
- **チェックリスト形式**: 各段階の作業内容と確認項目を明示
- **ユーザー確認ポイント**: 自動化できない部分の明確な指示
- **トラブルシューティング**: よくある問題と解決方法の事前記載

#### 4. 品質確保のポイント

**各段階での必須確認項目**
- [ ] `npm run build` でエラーがない
- [ ] TypeScriptコンパイルエラーがない
- [ ] 既存機能が正常動作する
- [ ] コンソールエラーがない（DevTools + ターミナル）

**ブラウザ単体テスト手法**
HTML/CSSベースのUI機能開発時は、Electronから独立してブラウザで単体テストを実施する：

```html
<!-- example: src/overlay/popup-test.html -->
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="popup.css">
  <style>
    .test-controls {
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(255, 255, 255, 0.9);
      padding: 20px;
      border-radius: 10px;
      z-index: 10000;
    }
  </style>
</head>
<body>
  <!-- テスト用コントロールUI -->
  <div class="test-controls">
    <button onclick="showPopup()">Show</button>
    <button onclick="hidePopup()">Hide</button>
    <p>画面サイズ: <span id="screenSize"></span></p>
  </div>
  
  <!-- 実際のUI要素 -->
  <div class="popup-overlay" id="popupOverlay">
    <!-- popup内容 -->
  </div>
  
  <script>
    // テスト用JavaScript
    function showPopup() { /* 表示ロジック */ }
    function hidePopup() { /* 非表示ロジック */ }
  </script>
</body>
</html>
```

**利点:**
- **高速フィードバック**: Electronビルド不要で即座に確認
- **レスポンシブテスト**: ブラウザサイズ変更で様々な画面サイズを簡単テスト
- **アニメーション確認**: DevToolsでCSS調整しながらリアルタイム確認
- **クロスブラウザ確認**: Safari/Chrome/Firefoxでの互換性確認
- **デバッグ効率**: ブラウザDevToolsの豊富なデバッグ機能活用

**実行手順:**
```bash
# テストファイル作成
touch src/overlay/feature-test.html

# ブラウザで開く
open src/overlay/feature-test.html

# 確認項目
# - 基本表示・配置
# - アニメーション品質  
# - レスポンシブ動作
# - 操作イベント（クリック・キー）
```

**適用場面:**
- オーバーレイ・ポップアップUI
- アニメーション効果
- レスポンシブレイアウト
- CSS視覚効果全般

**ユーザー確認が必要なタイミング**
- UI/UXに関わる変更の確認
- 通知やサウンドなどのOS連携機能
- ウィンドウ動作やフォーカス変更
- エンドツーエンドの動作確認

**ユーザー確認の具体的な指示方法**
- **手順の明確化**: 「1分タイマーを設定→開始→待機→確認」のような具体的ステップ
- **期待動作の詳細**: 「画面右上にブラウザ風の四角いポップアップが表示される」など、見た目や動作を具体的に記述
- **確認項目のチェックリスト**: 各要素を個別にチェックできるリスト形式
- **問題時の対処法**: 「通知が表示されない場合：ブラウザの通知許可設定を確認」のような具体的な対処方法
- **比較確認**: 「Phase 4の時と比べて通知が1つ減った」のような前後比較
- **ビフォーアフターの明示**: 「従来は◯◯だったが、新しくは××になる」の形式で変化を明確化

#### 5. 技術債務の管理
- **設計見直し**: 実装前のアーキテクチャ検討と改善提案
- **段階的リファクタリング**: 既存コードとの統合を考慮した設計
- **型安全性**: TypeScriptの型定義を活用した堅牢な実装
- **責任分離**: メインプロセスとレンダラープロセスの適切な役割分担

#### 6. 開発効率化
- **並行開発の回避**: 一度に一つの機能に集中
- **最小単位での動作確認**: 問題の早期発見と修正
- **既存機能の保護**: 新機能追加時の既存機能への影響最小化
- **ドキュメント駆動**: 実装前の設計文書化と合意形成

### 適用例
Mac通知センター連携機能の開発では：
1. 11個の細かいIssueに分解
2. 6段階の実装フェーズ設計
3. 各段階でのユーザー確認ポイント明示
4. セッション継続用のTODOファイル作成
5. 既存HTML5通知からネイティブ通知への段階的移行

この手法により、大きな機能でも安全かつ確実に実装が可能。

## 開発プロセス

### 5段階開発フロー

新機能開発や問題修正は以下の5段階プロセスで進める：

#### **1. 📋 計画 (Planning)**
- 要求の明確化とゴール設定
- 技術選択と設計方針の決定
- TodoWriteでタスクの分解と優先順位付け
- 潜在的リスクの特定と対策検討

#### **2. ⚡ 実装 (Implementation)**
- 段階的な機能開発（小さな単位での開発サイクル）
- 各段階でのビルド確認とテスト作成
- TodoWriteでプログレス管理
- 継続的な動作確認

#### **3. ✅ 確認 (Quality Check)**
- 全体ビルドとテスト実行（`npm run build` + `npm test`）
- Electronアプリの動作確認
- 既存機能への影響チェック
- パフォーマンスとセキュリティ確認

#### **4. 🔧 改善 (Improvement)**
- 発見された問題の修正
- コードの最適化とリファクタリング
- 設計の見直しと改善
- 次回開発への改善点抽出

#### **5. 📝 記録 (Learning Documentation)**
- 重要な技術知見の文書化
- トラブルシューティング情報のCLAUDE.mdへの追加
- ベストプラクティスの更新
- 次回開発での活用準備

### プロセスの利点

- **品質向上**: 段階的確認による問題の早期発見
- **知見蓄積**: 学習内容の体系的な記録と再利用
- **効率化**: 計画的なタスク管理と進捗の可視化
- **保守性**: 設計思想と解決方法の明文化

## リファクタリング方針

### 責務分離とYAGNI適用の原則

#### 1. 単一責任の原則（SRP）による責務分離
コードベースの保守性向上のため、各クラスが明確で単一の責務を持つよう設計する：

**分離の指針**
- **データの性質による分離**: 機能設定 vs UI状態
- **変更の理由による分離**: 設定変更 vs ウィンドウ操作
- **ライフサイクルによる分離**: 永続化 vs 一時状態

**実施例: ConfigManager の分離**
```
Before: ConfigManager (混在した責務)
├── アプリ設定管理
├── ウィンドウ状態管理
└── electron-store操作

After: 明確な責務分離
├── AppConfigManager (機能設定)
│   ├── タイマーデフォルト時間
│   ├── アニメーション設定
│   └── 開発モード設定
└── WindowStateStore (UI状態永続化)
    ├── ウィンドウ位置
    ├── ウィンドウサイズ
    └── 表示状態
```

#### 2. YAGNI（You Aren't Gonna Need It）の徹底適用
実装時は現在必要な機能のみを実装し、将来の拡張は実際に必要になってから追加する：

**削除対象の判断基準**
- 使用されていないメソッド
- 汎用的すぎるインターフェース
- 想定される将来機能のためのメソッド
- テストでしか呼ばれないメソッド

**実施例**
```typescript
// 削除: 汎用的すぎて使用されない
- getWindow(type: WindowType) 

// 削除: 将来機能のための実装
- resetAll(), saveAppConfig() 

// 削除: 自動処理で十分
- closeAllWindows(), removeAllHandlers()
```

#### 3. 命名による意図の明確化
クラス名・メソッド名で責務と動作を明確に表現する：

**命名の改善例**
- `ConfigManager` → `AppConfigManager` + `WindowStateStore`
- `stateManager` → `windowStateStore` 
- `Manager`系 → より具体的な責務を表す名前

#### 4. TSDocによる設計意図の文書化
各クラスの責務・依存関係・使用例をTSDocで明文化：

**文書化内容**
- クラスの責務と役割
- 他クラスとの依存関係
- 使用例とベストプラクティス
- 制約事項と注意点

#### 5. 依存関係の最適化
各クラスが必要最小限の依存関係のみを持つよう設計：

**依存関係の整理例**
```typescript
// Before: 全機能への依存
WindowManager(configManager: ConfigManager)

// After: 必要な機能のみへの依存
WindowManager(
  appConfigManager: AppConfigManager,    // 設定取得のみ
  windowStateStore: WindowStateStore     // 状態保存のみ
)

IPCHandler(
  windowManager: WindowManager,
  appConfigManager: AppConfigManager     // 設定取得のみ
)
```

#### 6. 段階的リファクタリングの実践
大規模な変更は段階的に実施し、各段階で動作確認を行う：

**リファクタリング手順**
1. **現状分析**: 既存コードの責務と依存関係を整理
2. **設計検討**: 分離後のクラス構成と責務を設計  
3. **段階的実装**: 新クラス作成 → 依存関係更新 → 旧コード削除
4. **YAGNI適用**: 未使用メソッドの特定と削除
5. **動作確認**: 各段階でのビルド・実行確認

この方針により、コードベースの保守性・可読性・テスタビリティが大幅に向上し、将来の機能追加や変更が容易になる。

#### 7. 高凝集・低結合の設計原則
すべてのクラス設計において、高凝集・低結合を最優先で追求する：

**高凝集（High Cohesion）の実現**
- クラスの責務を1文で明確に説明できること
- すべてのメソッドが同一の目的に向かって協調していること
- 責務に関係のないプロパティやメソッドを含まないこと
- クラス内の要素が密接に関連し合っていること

**低結合（Low Coupling）の実現**
- 必要最小限の依存関係のみを持つこと
- グローバル状態や外部環境への直接依存を避けること
- 副作用のない純粋な関数・メソッドを優先すること
- 依存関係を明示的に注入し、テスト可能な設計にすること

**設計時の判定基準**
- 「このクラスは何をするクラスか？」を1文で答えられるか
- 「このメソッドはクラスの責務に直接関係するか？」を明確に判断できるか
- 「外部環境に依存せずにユニットテストできるか？」を確認できるか

## Git Worktree ネーミングルール

### Worktree ディレクトリ名
```
# Issue有り
{プロジェクト名}-issue{番号}
例: simple-timer-issue17

# Issue無し  
{プロジェクト名}-{種別}-{概要}
例: simple-timer-spike-webgl
```

### ブランチ名
```
# Issue有り
{種別}/issue-{番号}-{概要}
例: feature/issue-17-card-animation-manager

# Issue無し
{種別}/{概要}  
例: spike/webgl-animations
```

### ブランチ種別
- `feature/` - 新機能
- `bugfix/` - バグ修正
- `hotfix/` - 緊急修正
- `refactor/` - リファクタリング
- `spike/` - 技術調査
- `experiment/` - 実験
- `docs/` - ドキュメント
- `chore/` - 雑務

### 作成コマンド
```bash
# Issue有り
git worktree add ../simple-timer-issue17 -b feature/issue-17-card-animation-manager

# Issue無し
git worktree add ../simple-timer-spike-webgl -b spike/webgl-animations
```
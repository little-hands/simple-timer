# Mac通知センター連携 - 段階的開発TODO

## 全体の流れ
Issue #5: Mac通知センター連携の実装を段階的に進める

## Phase 1: 現状確認 ⏳
**目的**: 既存の通知機能の動作を確認

### 作業内容
```bash
# 1. 現在のアプリを起動
npm run start

# 2. 1分タイマーを設定して動作確認
# ✅ HTML5通知が表示されるか
# ✅ 音声が再生されるか
```

### 確認項目
- [ ] HTML5通知が正常に表示される
- [ ] 音声が正常に再生される
- [ ] タイマーの基本動作に問題がない

### 🔍 **ユーザー確認必須**
Phase 2に進む前に、ユーザーが以下を具体的に確認する：

#### タイマー基本動作の確認
- [ ] アプリが正常に起動した
- [ ] デフォルト3分の表示になっている
- [ ] 再生ボタンをクリックして正常にカウントダウンが始まる
- [ ] 一時停止ボタンで正常に停止する
- [ ] リセットボタンで3分に戻る

#### 通知動作の確認（1分タイマーで実施）
1. **タイマー設定**: タイマー表示をクリックして1分に変更
2. **開始**: 再生ボタンクリック
3. **待機**: 1分間待つ（他のアプリを使っても良い）
4. **通知確認**:
   - [ ] **HTML5通知**: 画面右上にブラウザ風の小さな通知ポップアップが表示される
   - [ ] **通知内容**: 「タイマー終了」「設定した時間になりました！」と表示される
   - [ ] **音声**: 短い「ピピピ」のような電子音が鳴る
   - [ ] **通知の消え方**: 数秒後に自動で消える、またはクリックで消える

#### 問題がある場合の確認
- [ ] 通知が表示されない場合：ブラウザの通知許可設定を確認
- [ ] 音が鳴らない場合：Macの音量設定を確認
- [ ] タイマーが動かない場合：DevToolsでエラーを確認

#### 期待される動作
現在はHTML5のNotification APIを使用しているため：
- **通知スタイル**: ブラウザ風の四角いポップアップ（Mac通知センター風ではない）
- **通知位置**: 画面右上
- **アプリアイコン**: 表示されない場合がある
- **クリック動作**: 特に何も起こらない（ウィンドウフォーカスしない）

---

## Phase 2: IPC基盤の準備 ⏳
**目的**: preload.tsにIPC通信を追加し、通信テスト

### 修正ファイル: `src/preload.ts`
```typescript
// 既存のcontextBridge.exposeInMainWorldに追加
timerFinished: (totalSeconds: number) => ipcRenderer.send('timer-finished', totalSeconds)

// validChannelsにも追加
const validChannels = ['timer-start', 'timer-stop', 'timer-reset', 'timer-finished'];
```

### テスト用修正: `src/renderer.ts`
```typescript
function timerFinished(): void {
    console.log('Timer finished with totalSeconds:', totalSeconds);
    (window as any).electronAPI.timerFinished(totalSeconds);
    
    // 既存の通知・音声コードはそのまま残す
    new Notification('タイマー終了', {
        body: '設定した時間になりました！',
        silent: false
    });
    const audio = new Audio();
    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE';
    audio.play();
}
```

### 確認項目
- [ ] `npm run build` でエラーがない
- [ ] コンソールログが出力される
- [ ] 既存の通知・音声が正常動作

---

## Phase 3: メインプロセス通知受信 ⏳
**目的**: main.tsで通知受信・ログ確認

### 修正ファイル: `src/main.ts`
```typescript
// 既存のipcMainハンドラーの後に追加
ipcMain.on('timer-finished', (event, totalSeconds: number) => {
    console.log('Received timer-finished:', totalSeconds);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    console.log(`Timer finished: ${minutes}分${seconds}秒`);
});
```

### 確認項目
- [ ] ターミナルでメインプロセスのログが出力される
- [ ] totalSecondsが正しく渡されている
- [ ] 分秒の計算が正しい

---

## Phase 4: ネイティブ通知の実装 ⏳
**目的**: Electronネイティブ通知を表示

### 修正ファイル: `src/main.ts`
```typescript
import { app, BrowserWindow, ipcMain, Notification } from 'electron'; // Notificationを追加

ipcMain.on('timer-finished', (event, totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    // 時間表示の生成
    let timeStr = '';
    if (minutes > 0 && seconds > 0) {
        timeStr = `${minutes}分${seconds}秒`;
    } else if (minutes > 0) {
        timeStr = `${minutes}分`;
    } else {
        timeStr = `${seconds}秒`;
    }
    
    const notification = new Notification({
        title: 'タイマー終了',
        body: `${timeStr}のタイマーが終了しました`
    });
    
    notification.show();
    console.log('Native notification shown:', timeStr);
});
```

### 確認項目
- [ ] Mac通知センターに通知が表示される
- [ ] 通知の内容が正しい（例：「1分のタイマーが終了しました」）
- [ ] この段階ではダブル通知（HTML5 + Native）が表示される

### 🔍 **ユーザー確認必須**
Phase 5に進む前に、ユーザーが以下を具体的に確認する：

#### ダブル通知の確認（1分タイマーで実施）
1. **タイマー設定**: 1分に設定して開始
2. **待機**: 1分間待つ
3. **通知確認**:
   - [ ] **従来のHTML5通知**: 画面右上にブラウザ風の四角いポップアップが表示
   - [ ] **新しいネイティブ通知**: Mac通知センター風の通知も表示（より角丸で洗練された見た目）
   - [ ] **通知内容**: 新しい通知に「1分のタイマーが終了しました」と表示される
   - [ ] **合計2つ**: 同時に2つの通知が表示される（ダブル通知状態）
   - [ ] **音声**: 1回だけ再生される

#### Mac通知センター風通知の特徴
- **見た目**: 角丸でより洗練されたデザイン
- **位置**: 画面右上（HTML5通知とは少し異なる位置）
- **アプリアイコン**: Electronアプリのアイコンが表示される
- **持続時間**: HTML5通知より長く表示される場合がある

#### 確認すべき違い
- [ ] 新しい通知の方が見た目が洗練されている
- [ ] 新しい通知にアプリアイコンが表示されている
- [ ] 通知の内容が「1分のタイマーが終了しました」になっている（従来は「設定した時間になりました！」）

#### 問題がある場合
- [ ] ネイティブ通知が表示されない：macOSの通知設定でElectronアプリの通知を許可
- [ ] 2つとも表示されない：Phase 3のIPC通信が正常動作しているか確認

---

## Phase 5: HTML5通知の無効化 ⏳
**目的**: 重複通知を解消

### 修正ファイル: `src/renderer.ts`
```typescript
function timerFinished(): void {
    isRunning = false;
    updateStartButtonIcon();
    timerContainer.classList.add('timer-finished');
    
    // IPCでメインプロセスに通知を要求
    (window as any).electronAPI.timerFinished(totalSeconds);
    
    // HTML5通知をコメントアウト
    // new Notification('タイマー終了', {
    //     body: '設定した時間になりました！',
    //     silent: false
    // });
    
    // 音声は残す
    const audio = new Audio();
    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE';
    audio.play();
}
```

### 確認項目
- [ ] ネイティブ通知のみ表示される
- [ ] HTML5通知が表示されない
- [ ] 音声は正常に再生される

### 🔍 **ユーザー確認必須**
Phase 6に進む前に、ユーザーが以下を具体的に確認する：

#### 重複解消の確認（1分タイマーで実施）
1. **タイマー設定**: 1分に設定して開始
2. **待機**: 1分間待つ
3. **通知確認**:
   - [ ] **HTML5通知なし**: 従来のブラウザ風四角いポップアップが表示されない
   - [ ] **ネイティブ通知のみ**: Mac通知センター風の通知のみ表示される
   - [ ] **通知内容**: 「1分のタイマーが終了しました」と正しく表示される
   - [ ] **通知数**: 1つだけ表示される（重複解消）
   - [ ] **音声**: 正常に再生される

#### 確認すべき変化
- [ ] Phase 4の時と比べて通知が1つ減った
- [ ] 残った通知がMac通知センター風の洗練されたデザイン
- [ ] アプリアイコンが通知に表示されている
- [ ] 音声は引き続き正常に再生される

#### 期待される最終状態
- **通知**: Mac通知センター風のみ（ブラウザ風は消失）
- **音声**: 正常に再生
- **見た目**: より洗練されたネイティブな通知
- **アイコン**: アプリアイコンが表示
- **内容**: 「◯分のタイマーが終了しました」形式

#### 問題がある場合
- [ ] 通知が全く表示されない：renderer.tsの修正でIPCコードが正常か確認
- [ ] HTML5通知がまだ表示される：コメントアウトが正しくできているか確認
- [ ] 音声が鳴らない：音声コードがコメントアウトされていないか確認

---

## Phase 6: 通知クリック機能 ⏳
**目的**: 通知クリック時のウィンドウフォーカス

### 修正ファイル: `src/preload.ts`
```typescript
// 既存のexposeInMainWorldに追加
focusWindow: () => ipcRenderer.send('window-focus')
```

### 修正ファイル: `src/main.ts`
```typescript
// 通知クリックイベント追加
ipcMain.on('timer-finished', (event, totalSeconds: number) => {
    // ... 既存の通知表示コード
    
    notification.on('click', () => {
        console.log('Notification clicked');
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
    
    notification.show();
});

// ウィンドウフォーカス用ハンドラー追加
ipcMain.on('window-focus', () => {
    if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
    }
});
```

### 確認項目
- [ ] アプリを最小化した状態でタイマー終了
- [ ] 通知をクリックするとウィンドウがフォーカスされる
- [ ] ウィンドウが前面に表示される

### 🔍 **ユーザー確認必須（最終テスト）**
完了前に、ユーザーが以下の手順で確認する：
1. [ ] アプリを起動し、1分タイマーを設定
2. [ ] アプリウィンドウを最小化（Cmd+M）
3. [ ] タイマー終了まで他の作業をする
4. [ ] Mac通知センターに通知が表示される
5. [ ] 通知をクリックする
6. [ ] タイマーアプリのウィンドウが前面に表示される

---

## 各Phase間での重要な確認ポイント

### 必須チェック項目
- [ ] **ビルドエラーがないか**: `npm run build`
- [ ] **型エラーがないか**: TypeScriptコンパイル確認
- [ ] **既存機能が壊れていないか**: タイマーの基本動作
- [ ] **コンソールエラーがないか**: DevToolsとターミナル両方

### トラブルシューティング
- Phase2でIPC通信が失敗する場合: preload.tsのvalidChannels配列を確認
- Phase4で通知が表示されない場合: macOSの通知設定を確認
- Phase6でクリックイベントが動作しない場合: mainWindowの状態を確認

---

## 完了後の最終テスト

### テストケース1: 基本動作
1. 1分タイマーを設定
2. タイマー開始
3. 通知が「1分のタイマーが終了しました」で表示される
4. 音声が再生される

### テストケース2: バックグラウンド動作
1. 1分30秒タイマーを設定
2. アプリを最小化
3. 通知が「1分30秒のタイマーが終了しました」で表示される
4. 通知をクリックしてウィンドウがフォーカスされる

### テストケース3: 秒単位タイマー
1. 30秒タイマーを設定
2. 通知が「30秒のタイマーが終了しました」で表示される

---

## 進捗管理
- [ ] Phase 1完了
- [ ] Phase 2完了  
- [ ] Phase 3完了
- [ ] Phase 4完了
- [ ] Phase 5完了
- [ ] Phase 6完了
- [ ] 最終テスト完了

## メモ欄
```
// ここに開発中のメモや問題点を記録

```
import { OverlayWindowManager } from './OverlayWindowManager';
import { AppConfigStore } from './AppConfigStore';
import { BrowserWindow } from 'electron';

// Electronのモック
jest.mock('electron', () => ({
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadFile: jest.fn().mockResolvedValue(undefined),
    show: jest.fn(),
    hide: jest.fn(),
    setAlwaysOnTop: jest.fn(),
    setVisibleOnAllWorkspaces: jest.fn(),
    isDestroyed: jest.fn().mockReturnValue(false),
    webContents: {
      openDevTools: jest.fn(),
      send: jest.fn(),
    },
    on: jest.fn(),
  })),
  screen: {
    getPrimaryDisplay: jest.fn().mockReturnValue({
      bounds: { width: 1920, height: 1080 },
    }),
  },
}));

// pathのモック
jest.mock('path', () => ({
  join: jest.fn().mockImplementation((...args) => args.join('/')),
}));

// AppConfigStoreのモック
const mockAppConfigStore = {
  getDevSettings: jest.fn().mockReturnValue({
    openDevTools: false,
  }),
} as unknown as AppConfigStore;

describe('OverlayWindowManager - popup functionality', () => {
  let overlayManager: OverlayWindowManager;
  let mockWindow: any;

  beforeEach(() => {
    jest.clearAllMocks();
    overlayManager = new OverlayWindowManager(false);

    // BrowserWindowのモックインスタンスを取得
    mockWindow = {
      loadFile: jest.fn().mockResolvedValue(undefined),
      show: jest.fn(),
      hide: jest.fn(),
      setAlwaysOnTop: jest.fn(),
      setVisibleOnAllWorkspaces: jest.fn(),
      isDestroyed: jest.fn().mockReturnValue(false),
      webContents: {
        openDevTools: jest.fn(),
        send: jest.fn(),
      },
      on: jest.fn(),
    };

    (BrowserWindow as jest.MockedClass<typeof BrowserWindow>).mockImplementation(() => mockWindow);
  });

  describe('showOverlayEffect()', () => {
    test('ウィンドウが存在しない場合、新しいウィンドウを作成する', async () => {
      await overlayManager.showOverlayEffect('popup');

      expect(BrowserWindow).toHaveBeenCalledTimes(1);
      expect(mockWindow.loadFile).toHaveBeenCalledWith('__dirname/../overlay/overlay.html');
      expect(mockWindow.show).toHaveBeenCalledTimes(1);
    });

    test('既存ウィンドウが破棄されている場合、新しいウィンドウを作成する', async () => {
      // 既存ウィンドウを作成
      overlayManager.createWindow();
      jest.clearAllMocks();

      // ウィンドウが破棄された状態をシミュレート
      mockWindow.isDestroyed.mockReturnValue(true);

      await overlayManager.showOverlayEffect('popup');

      expect(BrowserWindow).toHaveBeenCalledTimes(1);
      expect(mockWindow.loadFile).toHaveBeenCalledWith('__dirname/../overlay/overlay.html');
    });

    test('popup.htmlを正しく読み込む', async () => {
      await overlayManager.showOverlayEffect('popup');

      expect(mockWindow.loadFile).toHaveBeenCalledWith('__dirname/../overlay/overlay.html');
    });

    test('ウィンドウを表示する', async () => {
      await overlayManager.showOverlayEffect('popup');

      expect(mockWindow.show).toHaveBeenCalledTimes(1);
    });

    test('3秒後に自動的に非表示にする', async () => {
      jest.useFakeTimers();

      await overlayManager.showOverlayEffect('popup');

      // 3秒経過前は非表示されない
      expect(mockWindow.hide).not.toHaveBeenCalled();

      // 3秒経過
      jest.advanceTimersByTime(3000);

      expect(mockWindow.hide).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });

    test('ファイル読み込みエラー時はコンソールにフォールバック表示', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      mockWindow.loadFile.mockRejectedValue(new Error('File not found'));

      await overlayManager.showOverlayEffect('popup');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to show popup message:',
        expect.any(Error)
      );
      expect(consoleSpy).toHaveBeenCalledWith("✨ Time's up ✨");

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    test('ウィンドウ作成失敗時はエラーハンドリング', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // BrowserWindow作成時にnullを返すように設定
      (BrowserWindow as jest.MockedClass<typeof BrowserWindow>).mockImplementation(
        () => null as any
      );

      await overlayManager.showOverlayEffect('popup');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to show popup message:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('hide()', () => {
    test('ウィンドウが存在する場合、非表示にする', () => {
      overlayManager.createWindow();

      overlayManager.hide();

      expect(mockWindow.hide).toHaveBeenCalledTimes(1);
    });

    test('ウィンドウが存在しない場合、何もしない', () => {
      overlayManager.hide();

      // エラーが発生しないことを確認
      expect(mockWindow.hide).not.toHaveBeenCalled();
    });

    test('ウィンドウが破棄されている場合、何もしない', () => {
      overlayManager.createWindow();
      mockWindow.isDestroyed.mockReturnValue(true);

      overlayManager.hide();

      expect(mockWindow.hide).not.toHaveBeenCalled();
    });
  });

  describe('統合テスト', () => {
    test('showOverlayEffect → hide の完全なフロー', async () => {
      // エフェクト表示
      await overlayManager.showOverlayEffect('popup');

      expect(mockWindow.loadFile).toHaveBeenCalledWith('__dirname/../overlay/overlay.html');
      expect(mockWindow.show).toHaveBeenCalledTimes(1);

      // 手動で非表示
      overlayManager.hide();

      expect(mockWindow.hide).toHaveBeenCalledTimes(1);
    });

    test('複数回のshowOverlayEffect呼び出し', async () => {
      await overlayManager.showOverlayEffect('popup');
      await overlayManager.showOverlayEffect('cards');

      // ウィンドウは1回だけ作成される（既存を再利用）
      expect(BrowserWindow).toHaveBeenCalledTimes(1);
      // loadFileは1回だけ（同じHTMLファイル）
      expect(mockWindow.loadFile).toHaveBeenCalledTimes(1);
      // showは2回呼ばれる
      expect(mockWindow.show).toHaveBeenCalledTimes(2);
    });
  });
});

import * as puppeteer from 'puppeteer';
import { ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';

interface CaptureResult {
  success: boolean;
  path?: string;
  error?: string;
}

interface ScreenshotParams {
  url: string;
  outputPath: string;
}

interface TimerParams {
  html: string;
  outputPath: string;
}

class CaptureService {
  private browser: puppeteer.Browser | null = null;

  async initialize(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async captureScreenshot(url: string, outputPath: string): Promise<string> {
    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser!.newPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      await page.screenshot({ path: outputPath as `${string}.png`, fullPage: true });
      return outputPath;
    } finally {
      await page.close();
    }
  }

  async captureTimerState(timerHtml: string, outputPath: string): Promise<string> {
    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser!.newPage();
    try {
      await page.setContent(timerHtml);
      await page.screenshot({ path: outputPath as `${string}.png` });
      return outputPath;
    } finally {
      await page.close();
    }
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

const captureService = new CaptureService();

export function setupCaptureHandlers(): void {
  ipcMain.handle('capture:screenshot', async (event, params: ScreenshotParams): Promise<CaptureResult> => {
    try {
      const result = await captureService.captureScreenshot(params.url, params.outputPath);
      return { success: true, path: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('capture:timer', async (event, params: TimerParams): Promise<CaptureResult> => {
    try {
      const result = await captureService.captureTimerState(params.html, params.outputPath);
      return { success: true, path: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('capture:cleanup', async (): Promise<void> => {
    await captureService.cleanup();
  });
}

export { captureService };
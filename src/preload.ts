import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel: string, data?: any) => {
    const validChannels = ['timer-start', 'timer-stop', 'timer-reset', 'timer-finished'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel: string, func: (...args: any[]) => void) => {
    const validChannels = ['timer-update', 'start-cards-animation', 'start-snow-animation', 'start-popup-animation', 'effect-type-changed'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event: IpcRendererEvent, ...args: any[]) => func(...args));
    }
  },
  
  // 新しいAPI追加
  onStartPopupAnimation: (callback: () => void) => {
    ipcRenderer.on('start-popup-animation', callback);
  },
  setClickThrough: (enable: boolean) => ipcRenderer.send('set-click-through', enable),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  timerFinished: (totalSeconds: number) => ipcRenderer.send('timer-finished', totalSeconds),
  showCardsCelebration: () => ipcRenderer.send('show-cards-celebration'),
  showSnowEffect: () => ipcRenderer.send('show-snow-effect'),
  hidePopupMessage: () => ipcRenderer.send('hide-popup-message'),
  
  // 設定管理API
  getAppConfig: () => ipcRenderer.invoke('get-app-config'),
  setEffectType: (effectType: string) => ipcRenderer.invoke('set-effect-type', effectType),
  showSettingsWindow: () => ipcRenderer.send('show-settings-window'),
  hideSettingsWindow: () => ipcRenderer.send('hide-settings-window')
});
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel: string, data?: any) => {
    const validChannels = ['timer-start', 'timer-stop', 'timer-reset', 'timer-finished'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel: string, func: (...args: any[]) => void) => {
    const validChannels = ['timer-update', 'start-cards-animation', 'start-snow-animation', 'effect-type-changed'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event: IpcRendererEvent, ...args: any[]) => func(...args));
    }
  },
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  timerFinished: (totalSeconds: number) => ipcRenderer.send('timer-finished', totalSeconds),
  showCardsCelebration: () => ipcRenderer.send('show-cards-celebration'),
  showSnowEffect: () => ipcRenderer.send('show-snow-effect'),
  
  // 設定管理API
  getAppConfig: () => ipcRenderer.invoke('get-app-config'),
  setEffectType: (effectType: string) => ipcRenderer.invoke('set-effect-type', effectType),
  showSettingsWindow: () => ipcRenderer.send('show-settings-window'),
  hideSettingsWindow: () => ipcRenderer.send('hide-settings-window')
});
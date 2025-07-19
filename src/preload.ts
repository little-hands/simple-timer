import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel: string, data?: any) => {
    const validChannels = ['timer-start', 'timer-stop', 'timer-reset'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel: string, func: (...args: any[]) => void) => {
    const validChannels = ['timer-update'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event: IpcRendererEvent, ...args: any[]) => func(...args));
    }
  }
});
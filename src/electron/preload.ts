import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  tailscale: {
    getStatus: () => Promise<any>;
    discoverNodes: () => Promise<any[]>;
    getNodes: () => Promise<any[]>;
    getLoginUrl: () => Promise<string | null>;
    login: (authKey?: string) => Promise<boolean>;
    isRunning: () => Promise<boolean>;
    needsAuth: () => Promise<boolean>;
    onEvent: (callback: (event: any) => void) => () => void;
  };
}

const electronAPI: ElectronAPI = {
  tailscale: {
    getStatus: () => ipcRenderer.invoke('tailscale:status'),
    discoverNodes: () => ipcRenderer.invoke('tailscale:discover'),
    getNodes: () => ipcRenderer.invoke('tailscale:nodes'),
    getLoginUrl: () => ipcRenderer.invoke('tailscale:loginUrl'),
    login: (authKey) => ipcRenderer.invoke('tailscale:login', authKey),
    isRunning: () => ipcRenderer.invoke('tailscale:isRunning'),
    needsAuth: () => ipcRenderer.invoke('tailscale:needsAuth'),
    onEvent: (callback) => {
      const handler = (_event: any, data: any) => callback(data);
      ipcRenderer.on('tailscale:event', handler);
      return () => ipcRenderer.removeListener('tailscale:event', handler);
    },
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

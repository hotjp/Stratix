import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { EmbeddedTailscale } from '../stratix-tailscale/EmbeddedTailscale';

let mainWindow: BrowserWindow | null = null;
let tailscale: EmbeddedTailscale | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    title: 'Stratix',
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/frontend/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function initializeTailscale() {
  const stateDir = path.join(app.getPath('userData'), 'tailscale');
  
  tailscale = new EmbeddedTailscale({
    openClawPort: 18789,
    stateDir,
    hostname: 'stratix',
    authKey: process.env.STRATIX_TAILSCALE_AUTH_KEY,
    healthCheckInterval: 60000,
  });

  tailscale.subscribe((event) => {
    if (mainWindow) {
      mainWindow.webContents.send('tailscale:event', event);
    }
  });

  const started = await tailscale.start();
  
  if (started) {
    tailscale.startHealthCheck();
  }

  return started;
}

ipcMain.handle('tailscale:status', async () => {
  return tailscale?.getStatus() || null;
});

ipcMain.handle('tailscale:discover', async () => {
  if (!tailscale) return [];
  return tailscale.discoverOpenClawNodes();
});

ipcMain.handle('tailscale:nodes', async () => {
  return tailscale?.getOpenClawNodes() || [];
});

ipcMain.handle('tailscale:loginUrl', async () => {
  return tailscale?.getLoginURL() || null;
});

ipcMain.handle('tailscale:login', async (_event, authKey?: string) => {
  return tailscale?.login(authKey) || false;
});

ipcMain.handle('tailscale:isRunning', async () => {
  return tailscale?.isTailscaleRunning() || false;
});

ipcMain.handle('tailscale:needsAuth', async () => {
  return tailscale?.needsAuthentication() || false;
});

app.whenReady().then(async () => {
  createWindow();
  await initializeTailscale();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    tailscale?.stop();
    app.quit();
  }
});

app.on('before-quit', async () => {
  await tailscale?.stop();
});

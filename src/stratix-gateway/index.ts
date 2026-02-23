import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { StatusSyncService } from './api/websocket/StatusSync';
import { setStatusSyncService } from './api/routes/command';
import agentRoutes from './api/routes/agent';
import commandRoutes from './api/routes/command';
import templateRoutes from './api/routes/template';
import textureRoutes from './api/routes/texture';
import openclawRoutes, { initWebSocketServer } from './api/routes/openclaw';
import { dataStoreService } from './dataStoreService';
import { ensureDirSync } from 'fs-extra';

import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3010;
const WS_PORT = parseInt(process.env.WS_PORT || '3011', 10);
const DATA_DIR = process.env.DATA_DIR || 'stratix-data';
const TEXTURES_DIR = path.join(DATA_DIR, 'textures');

ensureDirSync(TEXTURES_DIR);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/textures', express.static(TEXTURES_DIR));

app.use('/api/stratix/config/agent', agentRoutes);
app.use('/api/stratix/command', commandRoutes);
app.use('/api/stratix/config/template', templateRoutes);
app.use('/api/stratix/texture', textureRoutes);
app.use('/api/stratix/openclaw', openclawRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    services: {
      http: 'running',
      websocket: 'running',
      dataStore: dataStoreService.isInitialized() ? 'initialized' : 'not initialized'
    }
  });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    code: 500,
    message: 'Internal server error',
    data: null,
    requestId: `stratix-req-${Date.now()}`
  });
});

async function startServer() {
  try {
    console.log('Initializing data store...');
    await dataStoreService.initialize(DATA_DIR);
    console.log('Data store initialized');

    const server = http.createServer(app);
    
    initWebSocketServer(server);

    server.listen(PORT, () => {
      console.log(`Stratix Gateway running on port ${PORT}`);
    });

    const statusSyncService = new StatusSyncService(WS_PORT);
    setStatusSyncService(statusSyncService);
    console.log(`WebSocket server running on port ${WS_PORT}`);

    function gracefulShutdown() {
      console.log('Shutting down gracefully...');
      
      server.close(() => {
        console.log('HTTP server closed');
      });
      
      statusSyncService.close();
      console.log('WebSocket server closed');
      
      process.exit(0);
    }

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      gracefulShutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection:', reason);
    });

    return { app, server, statusSyncService };
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

const serverPromise = startServer();

export { app, serverPromise };

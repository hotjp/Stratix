/**
 * Stratix Gateway - 网关服务入口
 * 
 * 整合所有模块，启动 HTTP 和 WebSocket 服务
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { StatusSyncService } from './api/websocket/StatusSync';
import { setStatusSyncService } from './api/routes/command';
import agentRoutes from './api/routes/agent';
import commandRoutes from './api/routes/command';
import templateRoutes from './api/routes/template';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const WS_PORT = parseInt(process.env.WS_PORT || '3001', 10);

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/api/stratix/config/agent', agentRoutes);
app.use('/api/stratix/command', commandRoutes);
app.use('/api/stratix/config/template', templateRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    services: {
      http: 'running',
      websocket: 'running'
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

const server = app.listen(PORT, () => {
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

export { app, server, statusSyncService };

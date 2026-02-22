# Feature 008: 网关服务启动与集成

## 功能概述
整合所有模块，实现完整的网关服务启动、配置和关闭流程。

## 功能需求

### 1. HTTP 服务器启动

#### 1.1 服务器配置
- **框架**：Express 或 Koa
- **端口**：3000（默认）
- **环境**：development / production

#### 1.2 中间件配置
- **CORS**：跨域资源共享
- **Body Parser**：请求体解析
- **Logger**：请求日志
- **Error Handler**：错误处理

#### 1.3 启动逻辑
```typescript
const app = express();
app.use(cors());
app.use(express.json());
app.use(logger);

// 注册路由
app.use('/api/stratix/config/agent', agentRoutes);
app.use('/api/stratix/command', commandRoutes);
app.use('/api/stratix/config/template', templateRoutes);

app.listen(3000, () => {
  console.log('Stratix Gateway running on port 3000');
});
```

### 2. API 路由集成

#### 2.1 路由列表
- `/api/stratix/config/agent/*` - Agent 配置 API
- `/api/stratix/command/*` - 指令执行 API
- `/api/stratix/config/template/*` - 模板管理 API

#### 2.2 路由注册
```typescript
import agentRoutes from './api/routes/agent';
import commandRoutes from './api/routes/command';
import templateRoutes from './api/routes/template';

app.use('/api/stratix/config/agent', agentRoutes);
app.use('/api/stratix/command', commandRoutes);
app.use('/api/stratix/config/template', templateRoutes);
```

### 3. WebSocket 服务器集成

#### 3.1 启动 WebSocket
```typescript
import { StatusSyncService } from './api/websocket/StatusSync';

const statusSyncService = new StatusSyncService(3001);
```

#### 3.2 注入到路由
```typescript
import { setStatusSyncService } from './api/routes/command';

setStatusSyncService(statusSyncService);
```

#### 3.3 端口配置
- HTTP 端口：3000
- WebSocket 端口：3001

### 4. 环境变量配置

#### 4.1 配置文件
```bash
# .env
PORT=3000
WS_PORT=3001
NODE_ENV=development

# OpenClaw 配置
OPENCLAW_ENDPOINT=http://localhost:8080
OPENCLAW_API_KEY=your-api-key

# 数据库配置
DB_PATH=stratix-data/stratix.db.json
```

#### 4.2 配置读取
```typescript
import dotenv from 'dotenv';
dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  wsPort: process.env.WS_PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  dbPath: process.env.DB_PATH || 'stratix-data/stratix.db.json'
};
```

### 5. 优雅关闭

#### 5.1 关闭流程
```
1. 停止接收新请求
2. 等待现有请求完成（超时 30 秒）
3. 关闭 WebSocket 服务器
4. 关闭 HTTP 服务器
5. 清理资源
6. 退出进程
```

#### 5.2 信号处理
```typescript
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  console.log('Shutting down gracefully...');
  
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
  
  statusSyncService.close();
  console.log('WebSocket server closed');
  
  process.exit(0);
}
```

### 6. 错误处理

#### 6.1 全局错误处理
```typescript
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(500).json({
    code: 500,
    message: 'Internal server error',
    data: null,
    requestId: `stratix-req-${Date.now()}`
  });
});
```

#### 6.2 未捕获异常处理
```typescript
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
```

### 7. 日志系统

#### 7.1 日志级别
- **INFO**：正常信息
- **WARN**：警告信息
- **ERROR**：错误信息
- **DEBUG**：调试信息

#### 7.2 日志格式
```
[2026-02-22 15:00:00] INFO: Stratix Gateway started on port 3000
[2026-02-22 15:00:05] INFO: Client connected. Total clients: 1
[2026-02-22 15:00:10] ERROR: Failed to execute command: cmd-001
```

#### 7.3 日志输出
- 开发环境：控制台输出
- 生产环境：文件输出 + 控制台

### 8. 健康检查

#### 8.1 健康检查端点
```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    services: {
      http: 'running',
      websocket: 'running',
      database: 'connected'
    }
  });
});
```

#### 8.2 检查项
- HTTP 服务器状态
- WebSocket 服务器状态
- 数据库连接状态
- OpenClaw 连接状态（可选）

### 9. 启动脚本

#### 9.1 package.json scripts
```json
{
  "scripts": {
    "start": "node dist/stratix-gateway/index.js",
    "dev": "ts-node src/stratix-gateway/index.ts",
    "build": "tsc",
    "test": "jest"
  }
}
```

#### 9.2 启动命令
```bash
# 开发环境
npm run dev

# 生产环境
npm run build
npm start
```

## 技术实现

### 文件结构
```
src/stratix-gateway/
├── index.ts                   # 网关入口
├── config/
│   └── index.ts               # 配置管理
└── middleware/
    ├── logger.ts              # 日志中间件
    └── errorHandler.ts        # 错误处理中间件
```

### 核心代码（index.ts）
```typescript
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
const WS_PORT = process.env.WS_PORT || 3001;

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
    timestamp: Date.now()
  });
});

app.use((err, req, res, next) => {
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
```

## 测试用例

### 1. 服务启动测试
- **操作**：运行 npm run dev
- **预期**：HTTP 和 WebSocket 服务器正常启动

### 2. API 路由测试
- **操作**：访问各个 API 端点
- **预期**：所有路由正常工作

### 3. 健康检查测试
- **操作**：GET /health
- **预期**：返回 status: 'ok'

### 4. 优雅关闭测试
- **操作**：发送 SIGTERM 信号
- **预期**：服务器优雅关闭

### 5. 错误处理测试
- **操作**：触发未捕获异常
- **预期**：记录错误并优雅关闭

### 6. 环境变量测试
- **操作**：设置不同环境变量
- **预期**：配置正确读取

## 验收标准
- [ ] HTTP 服务器正常启动
- [ ] WebSocket 服务器正常启动
- [ ] 所有 API 路由正常工作
- [ ] 环境变量正确读取
- [ ] 优雅关闭正常工作
- [ ] 错误处理完善
- [ ] 健康检查正常
- [ ] 日志系统正常

## 依赖
- `express`：HTTP 框架
- `cors`：CORS 中间件
- `dotenv`：环境变量
- `ws`：WebSocket 库
- 所有子模块

## 预估工时
- **开发时间**：1.5 天
- **测试时间**：1 天
- **总计**：2.5 天

## 备注
- 支持 Docker 容器化部署 - 可选
- 支持 PM2 进程管理 - 可选
- 支持 Kubernetes 部署 - 可选

# Feature 007: 状态同步服务（StatusSyncService）

## 功能概述
实现 WebSocket 服务器，用于实时推送 Agent 状态、指令状态等事件到前端。

## 功能需求

### 1. WebSocket 服务器初始化

#### 1.1 服务器配置
- **端口**：3001（默认）
- **协议**：WebSocket (ws://)
- **心跳检测**：支持 ping/pong

#### 1.2 初始化逻辑
```typescript
const wss = new WebSocketServer({ port: 3001 });
wss.on('connection', (ws) => {
  // 客户端连接处理
});
```

### 2. 客户端连接管理

#### 2.1 连接池
- **数据结构**：`Set<WebSocket>`
- **功能**：
  - 添加新连接
  - 移除断开连接
  - 维护连接状态

#### 2.2 连接事件
- `connection`：客户端连接
- `close`：客户端断开
- `error`：连接错误
- `message`：接收消息

#### 2.3 连接生命周期
```
1. 客户端连接 → 添加到连接池
2. 发送欢迎消息
3. 监听消息和关闭事件
4. 客户端断开 → 从连接池移除
```

### 3. 广播功能（broadcast）

#### 3.1 功能描述
向所有连接的客户端广播消息

#### 3.2 实现逻辑
```typescript
public broadcast(event: StratixStateSyncEvent): void {
  const message = JSON.stringify(event);
  this.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
```

#### 3.3 优化
- 仅向订阅特定事件的客户端发送（可选）
- 支持消息队列和批量发送（可选）

### 4. Agent 状态通知（notifyAgentStatus）

#### 4.1 功能描述
通知所有客户端 Agent 状态变化

#### 4.2 事件格式
```typescript
{
  eventType: 'stratix:agent_status_update',
  payload: {
    agentId: 'agent-001',
    status: 'online' | 'offline' | 'busy' | 'error'
  },
  timestamp: 1645521234567,
  requestId: 'stratix-req-1645521234567'
}
```

#### 4.3 状态类型
- `online`：在线
- `offline`：离线
- `busy`：忙碌（执行任务中）
- `error`：错误

#### 4.4 触发场景
- Agent 启动/关闭
- Agent 开始/完成任务
- Agent 发生错误

### 5. 指令状态通知（notifyCommandStatus）

#### 5.1 功能描述
通知所有客户端指令执行状态变化

#### 5.2 事件格式
```typescript
{
  eventType: 'stratix:command_status_update',
  payload: {
    commandId: 'cmd-001',
    agentId: 'agent-001',
    commandStatus: 'pending' | 'running' | 'success' | 'failed',
    progress?: 50,
    result?: any,
    error?: string
  },
  timestamp: 1645521234567,
  requestId: 'stratix-req-1645521234567'
}
```

#### 5.3 状态类型
- `pending`：等待执行
- `running`：执行中
- `success`：执行成功
- `failed`：执行失败

#### 5.4 触发场景
- 指令提交
- 指令开始执行
- 指令进度更新
- 指令完成（成功/失败）

### 6. Agent 创建通知（可选）

#### 6.1 事件格式
```typescript
{
  eventType: 'stratix:agent_create',
  payload: {
    agentId: 'agent-001',
    name: '文案英雄',
    type: 'writer'
  },
  timestamp: 1645521234567,
  requestId: 'stratix-req-1645521234567'
}
```

#### 6.2 触发场景
- 创建新 Agent
- 导入 Agent 配置

### 7. 错误处理

#### 7.1 错误类型
- 连接错误
- 消息发送失败
- 客户端异常断开

#### 7.2 处理逻辑
- 记录错误日志
- 移除无效连接
- 不影响其他客户端

### 8. 心跳检测

#### 8.1 功能
- 定期发送 ping 消息
- 客户端响应 pong
- 超时未响应则断开

#### 8.2 配置
- **心跳间隔**：30 秒
- **超时时间**：60 秒

## 技术实现

### 文件结构
```
src/stratix-gateway/api/websocket/
└── StatusSync.ts             # 状态同步服务
```

### 核心代码（StatusSync.ts）
```typescript
import { WebSocketServer, WebSocket } from 'ws';
import { StratixStateSyncEvent } from '@/stratix-core/stratix-protocol';

export class StatusSyncService {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(port: number = 3001) {
    this.wss = new WebSocketServer({ port });
    this.setupServer();
    this.startHeartbeat();
  }

  private setupServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);
      console.log(`Client connected. Total clients: ${this.clients.size}`);

      ws.on('pong', () => {
        (ws as any).isAlive = true;
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`Client disconnected. Total clients: ${this.clients.size}`);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      this.sendWelcome(ws);
    });
  }

  private sendWelcome(ws: WebSocket): void {
    const welcomeMessage: StratixStateSyncEvent = {
      eventType: 'stratix:connected',
      payload: { message: 'Connected to Stratix Gateway' },
      timestamp: Date.now(),
      requestId: `stratix-req-${Date.now()}`
    };
    ws.send(JSON.stringify(welcomeMessage));
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((ws: WebSocket) => {
        if (!(ws as any).isAlive) {
          this.clients.delete(ws);
          return ws.terminate();
        }

        (ws as any).isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  public broadcast(event: StratixStateSyncEvent): void {
    const message = JSON.stringify(event);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  public notifyAgentStatus(
    agentId: string,
    status: 'online' | 'offline' | 'busy' | 'error'
  ): void {
    this.broadcast({
      eventType: 'stratix:agent_status_update',
      payload: { agentId, status },
      timestamp: Date.now(),
      requestId: `stratix-req-${Date.now()}`
    });
  }

  public notifyCommandStatus(
    commandId: string,
    agentId: string,
    status: 'pending' | 'running' | 'success' | 'failed',
    progress?: number,
    result?: any,
    error?: string
  ): void {
    this.broadcast({
      eventType: 'stratix:command_status_update',
      payload: {
        commandId,
        agentId,
        commandStatus: status,
        progress,
        result,
        error
      },
      timestamp: Date.now(),
      requestId: `stratix-req-${Date.now()}`
    });
  }

  public close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.wss.close();
  }
}
```

## 测试用例

### 1. 客户端连接测试
- **操作**：WebSocket 客户端连接到 ws://localhost:3001
- **预期**：连接成功，收到欢迎消息

### 2. 广播消息测试
- **操作**：调用 broadcast 方法
- **预期**：所有连接的客户端收到消息

### 3. Agent 状态通知测试
- **操作**：调用 notifyAgentStatus
- **预期**：客户端收到 stratix:agent_status_update 事件

### 4. 指令状态通知测试
- **操作**：调用 notifyCommandStatus
- **预期**：客户端收到 stratix:command_status_update 事件

### 5. 客户端断开测试
- **操作**：客户端主动断开连接
- **预期**：从连接池移除，不影响其他客户端

### 6. 心跳检测测试
- **操作**：等待心跳间隔
- **预期**：定期发送 ping，客户端响应 pong

### 7. 多客户端测试
- **操作**：多个客户端同时连接
- **预期**：所有客户端正常工作，消息正确广播

## 验收标准
- [ ] WebSocket 服务器正常启动
- [ ] 客户端连接管理正确
- [ ] broadcast 方法正常工作
- [ ] notifyAgentStatus 方法正常工作
- [ ] notifyCommandStatus 方法正常工作
- [ ] 心跳检测有效
- [ ] 错误处理完善

## 依赖
- `ws`：WebSocket 库
- `stratix-protocol.ts`：事件类型定义

## 预估工时
- **开发时间**：1.5 天
- **测试时间**：1 天
- **总计**：2.5 天

## 备注
- 支持 SSL/TLS 加密连接 - 可选
- 支持客户端认证 - 可选
- 支持消息压缩 - 可选

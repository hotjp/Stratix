# Feature 005: 指令执行 API 路由

## 功能概述
实现指令执行相关的 HTTP API 接口，包括指令执行、取消和状态查询。

## 功能需求

### 1. 执行指令（POST /api/stratix/command/execute）

#### 1.1 请求格式
```typescript
POST /api/stratix/command/execute
Content-Type: application/json

{
  "commandId": "cmd-001",
  "agentId": "agent-001",
  "skillId": "skill-001",
  "params": {
    "action": "写文案",
    "target": "产品介绍"
  }
}
```

#### 1.2 响应格式
```json
{
  "code": 200,
  "message": "Command execution started",
  "data": {
    "commandId": "cmd-001",
    "status": "pending"
  },
  "requestId": "stratix-req-1645521234567"
}
```

#### 1.3 执行流程
1. 验证指令参数
2. 获取 Agent 配置
3. 调用 CommandTransformer 转换并执行
4. 立即返回指令 ID（异步执行）
5. 通过 WebSocket 推送状态更新

#### 1.4 错误处理
- 400：参数缺失或无效
- 404：Agent 或 Skill 不存在
- 500：执行失败

### 2. 取消指令（POST /api/stratix/command/cancel）

#### 2.1 请求格式
```typescript
POST /api/stratix/command/cancel
Content-Type: application/json

{
  "commandId": "cmd-001"
}
```

#### 2.2 响应格式
```json
{
  "code": 200,
  "message": "Command cancelled",
  "data": {
    "commandId": "cmd-001",
    "status": "cancelled"
  },
  "requestId": "stratix-req-1645521234567"
}
```

#### 2.3 取消逻辑
- 检查指令是否存在
- 检查指令状态（pending/running 可取消）
- 调用 OpenClaw 取消接口（如果支持）
- 更新指令状态为 cancelled
- 推送 WebSocket 通知

#### 2.4 错误处理
- 404：指令不存在
- 400：指令已完成，无法取消

### 3. 查询指令状态（GET /api/stratix/command/status）

#### 3.1 请求格式
```typescript
GET /api/stratix/command/status?commandId=cmd-001
```

#### 3.2 响应格式
```json
{
  "code": 200,
  "message": "Command status fetched",
  "data": {
    "commandId": "cmd-001",
    "agentId": "agent-001",
    "status": "running",
    "progress": 50,
    "result": null,
    "error": null,
    "startedAt": 1645521234567,
    "updatedAt": 1645521244567
  },
  "requestId": "stratix-req-1645521234567"
}
```

#### 3.3 状态类型
- `pending`：等待执行
- `running`：执行中
- `success`：执行成功
- `failed`：执行失败
- `cancelled`：已取消

#### 3.4 进度跟踪
- 0-100 的进度百分比
- 根据 OpenClaw 返回的进度更新

### 4. 指令队列管理（可选）

#### 4.1 功能
- 维护执行中的指令队列
- 支持指令优先级
- 支持并发限制

#### 4.2 数据结构
```typescript
interface CommandQueueItem {
  commandId: string;
  agentId: string;
  status: string;
  priority: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}
```

### 5. 异步执行与回调

#### 5.1 异步执行
- 使用 Promise 或 async/await
- 执行在后台进行
- 不阻塞 HTTP 响应

#### 5.2 状态回调
- OpenClaw 执行过程中回调
- 更新指令状态
- 推送 WebSocket 通知

## 技术实现

### 文件结构
```
src/stratix-gateway/api/routes/
└── command.ts                # 指令 API 路由
```

### 核心代码（command.ts）
```typescript
import { Router, Request, Response } from 'express';
import { CommandTransformer } from '../../command-transformer/CommandTransformer';
import { ConfigManager } from '../../config-manager/ConfigManager';
import { StatusSyncService } from '../websocket/StatusSync';
import { StratixCommandData } from '@/stratix-core/stratix-protocol';

const router = Router();
const commandTransformer = new CommandTransformer();
const configManager = new ConfigManager();
let statusSyncService: StatusSyncService;

export function setStatusSyncService(service: StatusSyncService) {
  statusSyncService = service;
}

router.post('/execute', async (req: Request, res: Response) => {
  try {
    const command: StratixCommandData = req.body;
    const { agentId } = command;

    const agentConfig = await configManager.getAgent(agentId);
    if (!agentConfig) {
      return res.json({
        code: 404,
        message: 'Agent not found',
        data: null,
        requestId: `stratix-req-${Date.now()}`
      });
    }

    statusSyncService?.notifyCommandStatus(
      command.commandId,
      agentId,
      'pending'
    );

    commandTransformer.transformAndExecute(command, agentConfig)
      .then(result => {
        statusSyncService?.notifyCommandStatus(
          command.commandId,
          agentId,
          'success'
        );
      })
      .catch(error => {
        statusSyncService?.notifyCommandStatus(
          command.commandId,
          agentId,
          'failed'
        );
      });

    res.json({
      code: 200,
      message: 'Command execution started',
      data: {
        commandId: command.commandId,
        status: 'pending'
      },
      requestId: `stratix-req-${Date.now()}`
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: 'Internal server error',
      data: null,
      requestId: `stratix-req-${Date.now()}`
    });
  }
});

router.post('/cancel', async (req: Request, res: Response) => {
  try {
    const { commandId } = req.body;

    res.json({
      code: 200,
      message: 'Command cancelled',
      data: {
        commandId,
        status: 'cancelled'
      },
      requestId: `stratix-req-${Date.now()}`
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: 'Internal server error',
      data: null,
      requestId: `stratix-req-${Date.now()}`
    });
  }
});

router.get('/status', async (req: Request, res: Response) => {
  try {
    const { commandId } = req.query;

    res.json({
      code: 200,
      message: 'Command status fetched',
      data: {
        commandId,
        status: 'success',
        progress: 100,
        result: 'Execution completed'
      },
      requestId: `stratix-req-${Date.now()}`
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: 'Internal server error',
      data: null,
      requestId: `stratix-req-${Date.now()}`
    });
  }
});

export default router;
```

## 测试用例

### 1. 执行指令测试
- **请求**：POST /execute，完整指令
- **预期**：返回 code: 200，异步执行开始

### 2. 执行指令 - Agent 不存在测试
- **请求**：POST /execute，不存在的 agentId
- **预期**：返回 code: 404

### 3. 取消指令测试
- **请求**：POST /cancel，有效的 commandId
- **预期**：返回 code: 200，状态为 cancelled

### 4. 查询状态测试
- **请求**：GET /status?commandId=cmd-001
- **预期**：返回 code: 200 和状态信息

### 5. 异步执行测试
- **测试**：执行长时间指令
- **预期**：立即返回，WebSocket 推送状态更新

## 验收标准
- [ ] 指令执行接口正常工作
- [ ] 取消指令接口正常工作
- [ ] 状态查询接口正常工作
- [ ] 异步执行正确实现
- [ ] WebSocket 状态推送正常
- [ ] 错误处理完善

## 依赖
- `express`：HTTP 框架
- `CommandTransformer`：指令转换器
- `ConfigManager`：配置管理器
- `StatusSyncService`：状态同步服务

## 预估工时
- **开发时间**：1.5 天
- **测试时间**：1 天
- **总计**：2.5 天

## 备注
- 支持指令重试机制 - 可选
- 支持指令超时自动取消 - 可选
- 支持指令依赖关系 - 可选

# Feature 004: Agent 配置 API 路由

## 功能概述
实现 Agent 配置相关的 HTTP API 接口，提供创建、保存、获取、删除、列表等操作。

## 功能需求

### 1. 创建 Agent（POST /api/stratix/config/agent/create）

#### 1.1 请求格式
```typescript
POST /api/stratix/config/agent/create
Content-Type: application/json

{
  "agentId": "agent-001",
  "name": "文案英雄",
  "type": "writer",
  "skills": [ /* StratixSkillConfig[] */ ],
  "openClawConfig": { /* StratixOpenClawConfig */ }
}
```

#### 1.2 响应格式
```json
{
  "code": 200,
  "message": "Agent created",
  "data": { /* StratixAgentConfig */ },
  "requestId": "stratix-req-1645521234567"
}
```

#### 1.3 错误处理
- 400：参数缺失或格式错误
- 409：Agent 已存在
- 500：服务器内部错误

### 2. 保存 Agent（PUT /api/stratix/config/agent/save）

#### 2.1 请求格式
```typescript
PUT /api/stratix/config/agent/save
Content-Type: application/json

{
  "agentId": "agent-001",
  "name": "文案英雄（更新）",
  "skills": [ /* 更新后的技能列表 */ ]
}
```

#### 2.2 响应格式
```json
{
  "code": 200,
  "message": "Agent saved",
  "data": { /* 更新后的 StratixAgentConfig */ },
  "requestId": "stratix-req-1645521234567"
}
```

#### 2.3 特性
- 支持更新已存在的 Agent
- 支持创建新 Agent（upsert 语义）

### 3. 获取 Agent（GET /api/stratix/config/agent/get）

#### 3.1 请求格式
```typescript
GET /api/stratix/config/agent/get?agentId=agent-001
```

#### 3.2 响应格式
```json
{
  "code": 200,
  "message": "Agent fetched",
  "data": { /* StratixAgentConfig */ },
  "requestId": "stratix-req-1645521234567"
}
```

#### 3.3 错误处理
- 404：Agent 不存在

### 4. 删除 Agent（DELETE /api/stratix/config/agent/delete）

#### 4.1 请求格式
```typescript
DELETE /api/stratix/config/agent/delete?agentId=agent-001
```

#### 4.2 响应格式
```json
{
  "code": 200,
  "message": "Agent deleted",
  "data": null,
  "requestId": "stratix-req-1645521234567"
}
```

#### 4.3 错误处理
- 404：Agent 不存在

### 5. 获取 Agent 列表（GET /api/stratix/config/agent/list）

#### 5.1 请求格式
```typescript
GET /api/stratix/config/agent/list
```

#### 5.2 响应格式
```json
{
  "code": 200,
  "message": "Agents fetched",
  "data": [
    { /* StratixAgentConfig */ },
    { /* StratixAgentConfig */ }
  ],
  "requestId": "stratix-req-1645521234567"
}
```

#### 5.3 可选功能
- 支持分页（page, pageSize）
- 支持筛选（type, status）
- 支持排序（sortBy, sortOrder）

### 6. 通用规范

#### 6.1 请求 ID
- 格式：`stratix-req-{timestamp}`
- 用途：日志追踪和调试

#### 6.2 响应码
- 200：成功
- 400：请求参数错误
- 404：资源不存在
- 409：资源冲突
- 500：服务器内部错误

#### 6.3 日志记录
- 记录所有 API 请求
- 记录错误堆栈
- 记录响应时间

## 技术实现

### 文件结构
```
src/stratix-gateway/api/routes/
└── agent.ts                  # Agent API 路由
```

### 核心代码（agent.ts）
```typescript
import { Router, Request, Response } from 'express';
import { ConfigManager } from '../../config-manager/ConfigManager';
import { StratixApiResponse } from '@/stratix-core/stratix-protocol';

const router = Router();
const configManager = new ConfigManager();

router.post('/create', async (req: Request, res: Response) => {
  try {
    const agentConfig = req.body;
    const result = await configManager.createAgent(agentConfig);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: 'Internal server error',
      data: null,
      requestId: `stratix-req-${Date.now()}`
    });
  }
});

router.put('/save', async (req: Request, res: Response) => {
  try {
    const agentConfig = req.body;
    const result = await configManager.saveAgent(agentConfig);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: 'Internal server error',
      data: null,
      requestId: `stratix-req-${Date.now()}`
    });
  }
});

router.get('/get', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.query;
    const agent = await configManager.getAgent(agentId as string);
    
    if (!agent) {
      res.json({
        code: 404,
        message: 'Agent not found',
        data: null,
        requestId: `stratix-req-${Date.now()}`
      });
    } else {
      res.json({
        code: 200,
        message: 'Agent fetched',
        data: agent,
        requestId: `stratix-req-${Date.now()}`
      });
    }
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: 'Internal server error',
      data: null,
      requestId: `stratix-req-${Date.now()}`
    });
  }
});

router.delete('/delete', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.query;
    const result = await configManager.deleteAgent(agentId as string);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: 'Internal server error',
      data: null,
      requestId: `stratix-req-${Date.now()}`
    });
  }
});

router.get('/list', async (req: Request, res: Response) => {
  try {
    const agents = await configManager.listAgents();
    res.json({
      code: 200,
      message: 'Agents fetched',
      data: agents,
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

### 1. 创建 Agent 测试
- **请求**：POST /create，完整配置
- **预期**：返回 code: 200，Agent 创建成功

### 2. 创建重复 Agent 测试
- **请求**：POST /create，已存在的 agentId
- **预期**：返回 code: 409，提示冲突

### 3. 保存 Agent 测试
- **请求**：PUT /save，更新配置
- **预期**：返回 code: 200，配置更新成功

### 4. 获取 Agent 测试
- **请求**：GET /get?agentId=agent-001
- **预期**：返回 code: 200 和 Agent 配置

### 5. 获取不存在 Agent 测试
- **请求**：GET /get?agentId=not-exist
- **预期**：返回 code: 404

### 6. 删除 Agent 测试
- **请求**：DELETE /delete?agentId=agent-001
- **预期**：返回 code: 200

### 7. 获取列表测试
- **请求**：GET /list
- **预期**：返回 code: 200 和 Agent 列表

## 验收标准
- [ ] 所有 API 接口正常工作
- [ ] 响应格式符合 StratixApiResponse
- [ ] 错误处理完善
- [ ] 请求 ID 生成正确
- [ ] 日志记录完整

## 依赖
- `express`：HTTP 框架
- `ConfigManager`：配置管理器
- `stratix-protocol.ts`：数据类型定义

## 预估工时
- **开发时间**：1 天
- **测试时间**：0.5 天
- **总计**：1.5 天

## 备注
- 使用 Express Router 组织路由
- 支持请求参数验证（使用 Joi 或 Zod）- 可选
- 支持请求限流（Rate Limiting）- 可选

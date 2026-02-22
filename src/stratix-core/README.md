# Stratix Core - 核心协议层

## 概述

Stratix Core 是 Stratix 星策系统的基础设施层，提供统一数据协议定义和事件总线，是所有模块的依赖基础。

## 核心职责

- **统一数据协议定义**：定义 Stratix 系统所有标准化数据结构
- **事件总线**：提供模块间通信的事件发布/订阅机制
- **类型定义**：提供全局 TypeScript 类型定义

## 安装

```bash
npm install
```

## 使用示例

### 1. 导入模块

```typescript
import {
  StratixAgentConfig,
  StratixEventBus,
  StratixFrontendOperationEvent,
} from '@stratix/core';
```

### 2. 使用事件总线

```typescript
// 获取事件总线实例
const eventBus = StratixEventBus.getInstance();

// 订阅事件
eventBus.subscribe('stratix:agent_select', (event) => {
  console.log('Agent selected:', event.payload.agentIds);
});

// 发布事件
const selectEvent: StratixFrontendOperationEvent = {
  eventType: 'stratix:agent_select',
  payload: { agentIds: ['stratix-1234567890-abc'] },
  timestamp: Date.now(),
  requestId: 'stratix-req-1234567890-xyz',
};
eventBus.emit(selectEvent);

// 取消订阅
eventBus.unsubscribe('stratix:agent_select', handler);
```

### 3. 创建 Agent 配置

```typescript
const agentConfig: StratixAgentConfig = {
  agentId: 'stratix-1234567890-abc',
  name: '文案英雄',
  type: 'writer',
  soul: {
    identity: '专业文案创作者',
    goals: ['快速生成高质量文案'],
    personality: '细心、高效、有创意',
  },
  memory: {
    shortTerm: [],
    longTerm: [],
    context: '我是 Stratix 星策系统的文案英雄',
  },
  skills: [
    {
      skillId: 'stratix-skill-write-article',
      name: '快速写文案',
      description: '根据主题生成文案',
      parameters: [
        {
          paramId: 'topic',
          name: '文案主题',
          type: 'string',
          required: true,
          defaultValue: '',
        },
      ],
      executeScript: '{"action":"generate_content"}',
    },
  ],
  model: {
    name: 'claude-3-sonnet',
    params: { temperature: 0.7, topP: 0.9 },
  },
  openClawConfig: {
    accountId: 'stratix-1234567890-abc',
    endpoint: 'http://localhost:8000',
  },
};
```

## 文件结构

```
src/stratix-core/
├── init.md                      # 模块设计文档
├── README.md                    # 本文档
├── stratix-protocol.ts          # 统一数据协议定义
├── StratixEventBus.ts           # 事件总线实现
├── index.ts                     # 模块统一导出
└── types/
    └── index.d.ts               # 全局类型声明
```

## 事件类型清单

| 事件类型 | 方向 | 说明 |
|----------|------|------|
| `stratix:agent_select` | 前端 → 总线 | Agent 被选中 |
| `stratix:agent_deselect` | 前端 → 总线 | Agent 取消选中 |
| `stratix:command_execute` | 前端 → 总线 | 执行指令 |
| `stratix:command_cancel` | 前端 → 总线 | 取消指令 |
| `stratix:agent_status_update` | 总线 → 前端 | Agent 状态更新 |
| `stratix:command_status_update` | 总线 → 前端 | 指令状态更新 |
| `stratix:agent_create` | 总线 → 前端 | Agent 创建通知 |
| `stratix:config_updated` | 设计器 → 总线 | 配置更新通知 |

## 开发规范

### 命名规范

- **事件类型**：必须以 `stratix:` 为前缀
- **ID 格式**：所有 ID 必须以 `stratix-` 为前缀
  - Agent ID: `stratix-{timestamp}-{random}`
  - Skill ID: `stratix-skill-{action}`
  - Command ID: `stratix-cmd-{timestamp}`
  - Request ID: `stratix-req-{timestamp}-{random}`

### 类型安全

所有接口和类型定义都使用 TypeScript，确保类型安全。在使用任何数据结构时，请严格遵循 `stratix-protocol.ts` 中定义的类型。

## 开发边界

- ✅ 提供数据结构和通信机制
- ✅ 确保类型安全
- ❌ 不包含任何业务逻辑
- ❌ 不依赖任何业务模块

## 注意事项

1. 此模块必须最先开发，供其他模块依赖
2. 类型定义变更需要通知所有依赖模块
3. 事件总线采用单例模式，全局共享一个实例

## 构建和测试

```bash
# 类型检查
npm run typecheck

# 构建
npm run build

# 开发模式（监听文件变化）
npm run dev
```

## 许可证

MIT

## 联系方式

Stratix Team

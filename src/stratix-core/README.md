# Stratix Core - 核心协议层

## 概述

Stratix Core 是 Stratix 星策系统的基础设施层，提供统一数据协议定义、事件总线和实用工具类，是所有模块的依赖基础。

## 核心职责

- **统一数据协议定义**：定义 Stratix 系统所有标准化数据结构
- **事件总线**：提供模块间通信的事件发布/订阅机制
- **类型定义**：提供全局 TypeScript 类型定义
- **实用工具**：提供 ID 生成器、事件构建器、配置校验器、请求帮助器

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
  StratixIdGenerator,
  StratixEventBuilder,
  StratixConfigValidator,
  StratixRequestHelper,
} from '@stratix/core';
```

### 2. ID 生成器 (StratixIdGenerator)

```typescript
const idGenerator = StratixIdGenerator.getInstance();

// 生成各类 ID
const agentId = idGenerator.generateAgentId();      // stratix-1709123456789-abc12def
const skillId = idGenerator.generateSkillId('write-article');  // stratix-skill-write-article-abc12def
const commandId = idGenerator.generateCommandId();  // stratix-cmd-1709123456789-abc12def
const requestId = idGenerator.generateRequestId();  // stratix-req-1709123456789-abc12def

// 验证 ID 格式
idGenerator.isValidAgentId('stratix-1709123456789-abc12def');  // true
idGenerator.isValidSkillId('stratix-skill-write-article-abc12def');  // true
```

### 3. 事件构建器 (StratixEventBuilder)

```typescript
const eventBuilder = StratixEventBuilder.getInstance();
const eventBus = StratixEventBus.getInstance();

// 构建并发布 Agent 选中事件
const selectEvent = eventBuilder.buildAgentSelectEvent(['stratix-123-abc']);
eventBus.emit(selectEvent);

// 构建指令执行事件
const commandData = eventBuilder.buildCommandData(
  'stratix-skill-write-article',
  'stratix-123-abc',
  { topic: '产品介绍', wordCount: 500 }
);
const commandEvent = eventBuilder.buildCommandExecuteEvent(commandData);
eventBus.emit(commandEvent);

// 构建 Agent 状态更新事件
const statusEvent = eventBuilder.buildAgentStatusUpdateEvent('stratix-123-abc', 'busy');
eventBus.emit(statusEvent);
```

### 4. 配置校验器 (StratixConfigValidator)

```typescript
const validator = StratixConfigValidator.getInstance();

// 校验 Agent 配置
const result = validator.validateAgentConfig(agentConfig);

if (result.valid) {
  console.log('配置有效');
} else {
  console.log('配置错误:', result.errors);
  console.log('配置警告:', result.warnings);
}

// 快速校验
if (validator.isValidAgentConfig(agentConfig)) {
  // 配置有效，继续处理
}
```

### 5. 请求帮助器 (StratixRequestHelper)

```typescript
const requestHelper = StratixRequestHelper.getInstance();

// 生成成功响应
const successResponse = requestHelper.success({ agentId: 'stratix-123-abc' }, 'Agent 创建成功');

// 生成错误响应
const errorResponse = requestHelper.badRequest('缺少必填字段');

// 生成分页响应
const paginatedResponse = requestHelper.paginated(items, 100, 1, 10);

// 包装异步操作
const response = await requestHelper.wrapAsync(
  async () => {
    // 执行异步操作
    return await createAgent(config);
  },
  'Agent 创建成功',
  'Agent 创建失败'
);
```

### 6. 使用事件总线

```typescript
const eventBus = StratixEventBus.getInstance();

// 订阅事件
eventBus.subscribe('stratix:agent_select', (event) => {
  console.log('Agent selected:', event.payload.agentIds);
});

// 发布事件（建议使用 EventBuilder）
const selectEvent = eventBuilder.buildAgentSelectEvent(['stratix-123-abc']);
eventBus.emit(selectEvent);

// 取消订阅
eventBus.unsubscribe('stratix:agent_select', handler);
```

### 7. 创建 Agent 配置

```typescript
const idGenerator = StratixIdGenerator.getInstance();

const agentConfig: StratixAgentConfig = {
  agentId: idGenerator.generateAgentId(),
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
      skillId: idGenerator.generateSkillId('write-article'),
      name: '快速写文案',
      description: '根据主题生成文案',
      parameters: [
        {
          paramId: idGenerator.generateParamId('topic'),
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
    accountId: 'account-123',
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
├── types/
│   └── index.d.ts               # 全局类型声明
└── utils/
    ├── index.ts                 # 工具类统一导出
    ├── StratixIdGenerator.ts    # ID 生成器
    ├── StratixEventBuilder.ts   # 事件构建器
    ├── StratixConfigValidator.ts # 配置校验器
    └── StratixRequestHelper.ts  # 请求帮助器
```

## 工具类概览

| 工具类 | 用途 | 主要方法 |
|--------|------|----------|
| `StratixIdGenerator` | 生成标准 ID | `generateAgentId()`, `generateSkillId()`, `isValidAgentId()` |
| `StratixEventBuilder` | 构建标准事件 | `buildAgentSelectEvent()`, `buildCommandExecuteEvent()` |
| `StratixConfigValidator` | 校验配置 | `validateAgentConfig()`, `validateSkillConfig()` |
| `StratixRequestHelper` | 生成 API 响应 | `success()`, `error()`, `paginated()`, `wrapAsync()` |

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
  - Skill ID: `stratix-skill-{action}-{random}`
  - Command ID: `stratix-cmd-{timestamp}-{random}`
  - Request ID: `stratix-req-{timestamp}-{random}`

### 类型安全

所有接口和类型定义都使用 TypeScript，确保类型安全。在使用任何数据结构时，请严格遵循 `stratix-protocol.ts` 中定义的类型。

## 开发边界

- ✅ 提供数据结构和通信机制
- ✅ 提供实用工具类
- ✅ 确保类型安全
- ❌ 不包含任何业务逻辑
- ❌ 不依赖任何业务模块

## 注意事项

1. 此模块必须最先开发，供其他模块依赖
2. 类型定义变更需要通知所有依赖模块
3. 所有工具类采用单例模式，全局共享一个实例

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

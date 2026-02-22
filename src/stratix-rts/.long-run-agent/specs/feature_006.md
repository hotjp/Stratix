# Feature feature_006 - Event Bus Integration

## 元信息
- **优先级**: P0（核心模块）
- **负责人**: Stratix RTS Team
- **预计工时**: 1天
- **创建时间**: 2026-02-22 16:14:33

## 功能描述
实现与 Stratix 事件总线的集成层，负责将玩家操作转换为标准化事件发射，以及接收状态同步事件并更新视图。严格遵循事件驱动架构，不直接调用其他模块。

## 功能设计方案

### 核心类设计
```typescript
// src/stratix-rts/StratixRTSEventManager.ts
import Phaser from 'phaser';
import StratixEventBus from '@/stratix-core/StratixEventBus';
import {
  StratixFrontendOperationEvent,
  StratixStateSyncEvent,
  StratixAgentConfig,
  StratixCommandData,
  StratixFrontendEventType,
  StratixStateSyncEventType
} from '@/stratix-core/stratix-protocol';

export class StratixRTSEventManager {
  private eventBus: StratixEventBus;
  private scene: Phaser.Scene;
  private boundHandlers: Map<string, (event: StratixStateSyncEvent) => void> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.eventBus = StratixEventBus.getInstance();
  }

  /**
   * 订阅所有事件
   */
  public subscribeAll(): void {
    this.subscribe('stratix:agent_create', this.onAgentCreate.bind(this));
    this.subscribe('stratix:agent_status_update', this.onAgentStatusUpdate.bind(this));
    this.subscribe('stratix:command_status_update', this.onCommandStatusUpdate.bind(this));
  }

  /**
   * 取消所有订阅
   */
  public unsubscribeAll(): void {
    this.boundHandlers.forEach((handler, eventType) => {
      this.eventBus.unsubscribe(eventType, handler);
    });
    this.boundHandlers.clear();
  }

  private subscribe(
    eventType: StratixStateSyncEventType, 
    handler: (event: StratixStateSyncEvent) => void
  ): void {
    this.boundHandlers.set(eventType, handler);
    this.eventBus.subscribe(eventType, handler);
  }

  // ==================== 发射事件 ====================

  /**
   * 发射 Agent 选中事件
   */
  public emitAgentSelect(agentIds: string[]): void {
    const event: StratixFrontendOperationEvent = {
      eventType: 'stratix:agent_select',
      payload: { agentIds },
      timestamp: Date.now(),
      requestId: this.generateRequestId()
    };
    this.eventBus.emit(event);
  }

  /**
   * 发射 Agent 取消选中事件
   */
  public emitAgentDeselect(agentIds: string[]): void {
    const event: StratixFrontendOperationEvent = {
      eventType: 'stratix:agent_deselect',
      payload: { agentIds },
      timestamp: Date.now(),
      requestId: this.generateRequestId()
    };
    this.eventBus.emit(event);
  }

  /**
   * 发射指令执行事件
   */
  public emitCommandExecute(agentIds: string[], command: StratixCommandData): void {
    const event: StratixFrontendOperationEvent = {
      eventType: 'stratix:command_execute',
      payload: { agentIds, command },
      timestamp: Date.now(),
      requestId: this.generateRequestId()
    };
    this.eventBus.emit(event);
  }

  /**
   * 发射指令取消事件
   */
  public emitCommandCancel(commandId: string): void {
    const event: StratixFrontendOperationEvent = {
      eventType: 'stratix:command_cancel',
      payload: { commandId },
      timestamp: Date.now(),
      requestId: this.generateRequestId()
    };
    this.eventBus.emit(event);
  }

  // ==================== 接收事件处理 ====================

  /**
   * 处理 Agent 创建事件
   */
  private onAgentCreate(event: StratixStateSyncEvent): void {
    const agentConfig = event.payload.data as StratixAgentConfig;
    if (!agentConfig) return;

    // 通过场景事件通知场景创建精灵
    this.scene.events.emit('stratix:create-agent', agentConfig);
  }

  /**
   * 处理 Agent 状态更新事件
   */
  private onAgentStatusUpdate(event: StratixStateSyncEvent): void {
    const { agentId, status } = event.payload;
    if (!agentId || !status) return;

    // 通过场景事件通知场景更新精灵状态
    this.scene.events.emit('stratix:update-agent-status', { agentId, status });
  }

  /**
   * 处理指令状态更新事件
   */
  private onCommandStatusUpdate(event: StratixStateSyncEvent): void {
    const { agentId, commandStatus } = event.payload;
    if (!agentId || !commandStatus) return;

    // 通过场景事件通知场景更新指令状态
    this.scene.events.emit('stratix:update-command-status', { agentId, commandStatus });
  }

  // ==================== 工具方法 ====================

  /**
   * 生成请求 ID
   * 格式: stratix-req-{timestamp}-{6位随机字符}
   */
  private generateRequestId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `stratix-req-${timestamp}-${random}`;
  }
}
```

### 事件类型定义

#### 发射事件 (RTS → Event Bus)
| 事件类型 | 触发时机 | payload 结构 |
|----------|----------|--------------|
| stratix:agent_select | 玩家选中 Agent | `{ agentIds: string[] }` |
| stratix:agent_deselect | 玩家取消选中 | `{ agentIds: string[] }` |
| stratix:command_execute | 玩家执行指令 | `{ agentIds: string[], command: StratixCommandData }` |
| stratix:command_cancel | 玩家取消指令 | `{ commandId: string }` |

#### 接收事件 (Event Bus → RTS)
| 事件类型 | 处理逻辑 | payload 结构 |
|----------|----------|--------------|
| stratix:agent_create | 创建精灵 | `{ data: StratixAgentConfig }` |
| stratix:agent_status_update | 更新状态 | `{ agentId, status }` |
| stratix:command_status_update | 更新指令 | `{ agentId, commandStatus }` |

### 在场景中集成
```typescript
// 在 StratixRTSGameScene 中
private eventManager: StratixRTSEventManager;

create(): void {
  // 初始化事件管理器
  this.eventManager = new StratixRTSEventManager(this);
  this.eventManager.subscribeAll();

  // 监听场景内部事件
  this.events.on('stratix:create-agent', this.onCreateAgent, this);
  this.events.on('stratix:update-agent-status', this.onUpdateAgentStatus, this);
  this.events.on('stratix:update-command-status', this.onUpdateCommandStatus, this);

  // ... 其他初始化
}

private onCreateAgent(config: StratixAgentConfig): void {
  this.addAgentSprite(config);
}

private onUpdateAgentStatus(data: { agentId: string; status: AgentStatus }): void {
  const sprite = this.agentSprites.get(data.agentId);
  if (sprite) {
    sprite.setAgentStatus(data.status);
  }
  this.statusBar.setAgentStatus(data.agentId, data.status);
}

private onUpdateCommandStatus(data: { agentId: string; commandStatus: CommandStatus }): void {
  const sprite = this.agentSprites.get(data.agentId);
  if (sprite) {
    sprite.setCommandStatus(data.commandStatus);
  }
}

// 场景销毁时清理
shutdown(): void {
  this.eventManager.unsubscribeAll();
  this.events.off('stratix:create-agent');
  this.events.off('stratix:update-agent-status');
  this.events.off('stratix:update-command-status');
}

// 处理玩家操作，发射事件
private handleCommand(target: { x: number; y: number }): void {
  if (this.selectedAgentIds.size === 0) return;

  const command: StratixCommandData = {
    commandId: `stratix-cmd-${Date.now()}`,
    skillId: 'default-skill',  // 从指令面板获取
    agentId: Array.from(this.selectedAgentIds)[0],
    params: { targetX: target.x, targetY: target.y },
    executeAt: Date.now()
  };

  this.eventManager.emitCommandExecute(
    Array.from(this.selectedAgentIds), 
    command
  );
}
```

### 事件流程图
```
┌─────────────────────────────────────────────────────────────┐
│                      Stratix RTS                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [玩家操作] ──────▶ StratixRTSEventManager                  │
│                          │                                  │
│                          │ emitAgentSelect()                │
│                          │ emitCommandExecute()             │
│                          ▼                                  │
│                   ┌──────────────┐                          │
│                   │  Event Bus   │ ◀──── 其他模块           │
│                   └──────────────┘                          │
│                          │                                  │
│                          │ stratix:agent_create             │
│                          │ stratix:status_update            │
│                          ▼                                  │
│                   onAgentCreate()                           │
│                   onStatusUpdate()                          │
│                          │                                  │
│                          ▼                                  │
│                   scene.events.emit()                       │
│                          │                                  │
│                          ▼                                  │
│                   [更新精灵/状态栏]                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Request ID 格式
```
stratix-req-{timestamp}-{6位随机字符}
示例: stratix-req-1709318400000-a1b2c3
```

## 开发步骤
- [ ] 步骤 1：创建 StratixRTSEventManager.ts 类
- [ ] 步骤 2：实现 generateRequestId() 生成器
- [ ] 步骤 3：实现 4 个发射事件方法
- [ ] 步骤 4：实现 3 个接收事件处理器
- [ ] 步骤 5：实现 subscribeAll() 批量订阅
- [ ] 步骤 6：实现 unsubscribeAll() 批量取消
- [ ] 步骤 7：集成到场景生命周期（create/shutdown）

## 测试用例
| 用例编号 | 场景 | 操作步骤 | 预期结果 |
|----------|------|----------|----------|
| TC-001 | 选中事件 | 调用 emitAgentSelect() | 事件总线收到事件 |
| TC-002 | 指令事件 | 调用 emitCommandExecute() | 事件总线收到事件 |
| TC-003 | 创建精灵 | 总线发射 agent_create | 场景创建新精灵 |
| TC-004 | 状态更新 | 总线发射 status_update | 精灵颜色变化 |
| TC-005 | Request ID | 检查生成的 ID | 符合格式 stratix-req-xxx-xxx |
| TC-006 | 取消订阅 | 调用 unsubscribeAll() | 不再接收事件 |
| TC-007 | 内存泄漏 | 场景销毁后检查 | 无残留事件监听器 |

## 验收标准
- [ ] 4 个发射事件正确发送到事件总线
- [ ] 3 个接收事件正确处理并通过 scene.events 转发
- [ ] Request ID 格式符合规范
- [ ] 使用 Map 存储处理器引用，支持取消订阅
- [ ] 场景销毁时正确清理所有订阅
- [ ] 无内存泄漏

## 依赖
- stratix-core/stratix-protocol.ts
- stratix-core/StratixEventBus.ts
- feature_001 (Phaser Game Scene Core)
- feature_002 (Agent Sprite System)

## 参考 API
- `StratixEventBus.getInstance()` - 获取单例
- `eventBus.emit(event)` - 发射事件
- `eventBus.subscribe(eventType, handler)` - 订阅事件
- `eventBus.unsubscribe(eventType, handler)` - 取消订阅
- `scene.events.emit/on/off()` - 场景内部事件

## 变更记录
| 日期 | 变更内容 | 变更人 |
|------|----------|--------|
| 2026-02-22 | 初始创建 | - |
| 2026-02-22 | 更新为实际 API，添加场景事件转发 | AI Agent |

# Feature 005: 指令取消功能

## 功能概述
支持用户取消正在执行或等待中的指令，发射指令取消事件，并更新指令状态。

## 功能需求

### 1. 取消指令触发
- **触发场景**：
  - 指令正在执行中（`status: 'running'`）
  - 指令在队列中等待（`status: 'pending'`）
- **触发方式**：
  - **方式 1**：点击指令日志中的"取消"按钮
  - **方式 2**：右键点击 Agent 精灵，选择"取消指令"
  - **方式 3**：使用快捷键（如 Esc）
- **限制条件**：
  - 已执行完成的指令（`status: 'success'` 或 `'failed'`）不能取消

### 2. 取消确认
- **场景**：取消指令是一个不可逆操作
- **确认机制**：
  - 弹出确认对话框
  - 展示即将取消的指令信息（指令 ID、Agent 名称、技能名称）
  - 用户确认后发射取消事件，取消则不执行

### 3. 取消事件发射
- **事件类型**：`stratix:command_cancel`
- **数据结构**：`StratixFrontendOperationEvent`
- **事件数据**：
  ```typescript
  {
    eventType: 'stratix:command_cancel',
    payload: {
      commandId: string  // 要取消的指令 ID
    },
    timestamp: number,
    requestId: string
  }
  ```

### 4. 取消后状态更新
- **UI 更新**：
  - 指令日志中对应指令的状态更新为 `failed` 或 `cancelled`
  - 显示取消原因："用户取消"
  - 取消按钮消失（因为已取消的指令不能再次取消）
- **Agent 状态更新**：
  - 如果 Agent 因该指令处于 `busy` 状态，应恢复为 `online`
  - 如果 Agent 仍在执行其他指令，保持 `busy` 状态

### 5. 批量取消（可选）
- **场景**：用户选中多个 Agent，取消它们正在执行的所有指令
- **处理方式**：
  - 获取所有选中 Agent 的 `running` 或 `pending` 状态指令
  - 批量发射取消事件
  - 批量更新指令状态

## 技术实现

### 文件结构
```
src/stratix-command-panel/
├── StratixCommandPanel.ts     # 核心逻辑类
└── components/
    └── CommandLog.vue         # 指令日志组件（更新）
```

### 核心代码（StratixCommandPanel.ts 更新）
```typescript
import { 
  StratixFrontendOperationEvent, 
  StratixStateSyncEvent 
} from '@/stratix-core/stratix-protocol';
import StratixEventBus from '@/stratix-core/StratixEventBus';

export default class StratixCommandPanel extends Phaser.Scene {
  private stratixEventBus: StratixEventBus;

  /**
   * 取消指令（核心方法）
   * @param commandId 指令 ID
   */
  public async cancelCommand(commandId: string): Promise<void> {
    // 1. 获取指令日志
    const log = this.getCommandLog(commandId);
    if (!log) {
      console.error('指令不存在:', commandId);
      return;
    }

    // 2. 检查指令状态（只能取消 running 或 pending 状态的指令）
    if (log.status !== 'running' && log.status !== 'pending') {
      console.error('指令已完成，无法取消:', log.status);
      return;
    }

    // 3. 确认取消
    const confirmed = await this.confirmCancellation(log);
    if (!confirmed) {
      console.log('用户取消取消操作');
      return;
    }

    // 4. 发射取消事件
    const cancelEvent: StratixFrontendOperationEvent = {
      eventType: 'stratix:command_cancel',
      payload: {
        commandId
      },
      timestamp: Date.now(),
      requestId: `stratix-req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    };
    this.stratixEventBus.emit(cancelEvent);

    // 5. 更新本地指令状态（立即反馈）
    this.updateCommandStatus(commandId, 'failed', undefined, '用户取消');

    console.log('已取消指令:', commandId);
  }

  /**
   * 确认取消操作
   * @param log 指令日志
   * @returns 用户是否确认
   */
  private async confirmCancellation(log: CommandLog): Promise<boolean> {
    const message = `
      确定要取消以下指令吗？

      指令 ID：${log.commandId}
      Agent：${log.agentName}
      技能：${log.skillName}
      状态：${log.status}

      此操作不可撤销。
    `;

    // 使用确认对话框（简化版）
    // 实际项目中应使用更完善的 UI 组件
    return confirm(message);
  }

  /**
   * 获取指令日志（从日志列表中）
   * @param commandId 指令 ID
   * @returns 指令日志（未找到返回 null）
   */
  private getCommandLog(commandId: string): CommandLog | null {
    // TODO: 从指令日志列表中查找
    return null;
  }

  /**
   * 更新指令状态（本地更新）
   * @param commandId 指令 ID
   * @param status 新状态
   * @param result 执行结果（可选）
   * @param error 错误信息（可选）
   */
  private updateCommandStatus(
    commandId: string,
    status: 'pending' | 'running' | 'success' | 'failed',
    result?: string,
    error?: string
  ): void {
    // 调用 CommandLog 组件的 updateLogStatus 方法
    // this.commandLogComponent.updateLogStatus(commandId, status, result, error);
    
    console.log('更新指令状态:', commandId, status, error);
  }

  /**
   * 批量取消指令（可选功能）
   * @param agentIds Agent ID 列表
   */
  public async batchCancelCommands(agentIds: string[]): Promise<void> {
    // 1. 获取所有选中 Agent 的 running/pending 指令
    const commandsToCancel = this.getCommandsByAgentIds(agentIds);

    if (commandsToCancel.length === 0) {
      console.log('没有可取消的指令');
      return;
    }

    // 2. 确认批量取消
    const message = `确定要取消 ${commandsToCancel.length} 个指令吗？`;
    const confirmed = confirm(message);
    if (!confirmed) {
      return;
    }

    // 3. 批量发射取消事件
    commandsToCancel.forEach(commandId => {
      const cancelEvent: StratixFrontendOperationEvent = {
        eventType: 'stratix:command_cancel',
        payload: { commandId },
        timestamp: Date.now(),
        requestId: `stratix-req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      };
      this.stratixEventBus.emit(cancelEvent);
    });

    // 4. 批量更新本地指令状态
    commandsToCancel.forEach(commandId => {
      this.updateCommandStatus(commandId, 'failed', undefined, '用户批量取消');
    });

    console.log(`已批量取消 ${commandsToCancel.length} 个指令`);
  }

  /**
   * 获取指定 Agent 的所有运行中/等待中的指令
   * @param agentIds Agent ID 列表
   * @returns 指令 ID 数组
   */
  private getCommandsByAgentIds(agentIds: string[]): string[] {
    // TODO: 从指令日志列表中筛选
    return [];
  }
}
```

### CommandLog.vue 更新（添加取消按钮逻辑）
```vue
<!-- 在 CommandLog.vue 中更新 cancelCommand 方法 -->
<script setup lang="ts">
const cancelCommand = (commandId: string) => {
  // 发射取消事件给父组件
  emit('cancel', commandId);
};

const emit = defineEmits<{
  (e: 'cancel', commandId: string): void;
}>();
</script>

<!-- 更新模板，仅在 running 或 pending 状态显示取消按钮 -->
<template>
  <div class="log-actions">
    <button 
      v-if="log.status === 'running' || log.status === 'pending'"
      @click.stop="cancelCommand(log.commandId)"
      class="cancel-btn"
    >
      取消
    </button>
  </div>
</template>
```

### RTS 界面集成（右键取消指令）
```typescript
// 在 StratixRTSGameScene.ts 中添加右键取消指令功能

/**
 * 初始化玩家交互（RTS 核心操作）
 */
private initPlayerInput() {
  // ... 原有代码 ...

  // 鼠标右键：取消指令
  this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    if (pointer.rightButtonDown() && this.selectedAgentIds.length > 0) {
      // 弹出上下文菜单
      this.showContextMenu(pointer.x, pointer.y);
    }
  });
}

/**
 * 显示上下文菜单（包含"取消指令"选项）
 */
private showContextMenu(x: number, y: number) {
  // 创建上下文菜单（简化版，使用 DOM）
  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.position = 'absolute';
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  menu.innerHTML = `
    <div class="menu-item" id="cancel-command">取消指令</div>
    <div class="menu-item" id="view-log">查看日志</div>
  `;

  document.body.appendChild(menu);

  // 绑定点击事件
  document.getElementById('cancel-command')?.addEventListener('click', () => {
    // 批量取消选中 Agent 的所有指令
    this.cancelCommandsForAgents(this.selectedAgentIds);
    document.body.removeChild(menu);
  });

  // 点击其他区域关闭菜单
  document.addEventListener('click', () => {
    if (document.body.contains(menu)) {
      document.body.removeChild(menu);
    }
  }, { once: true });
}

/**
 * 取消指定 Agent 的所有指令
 * @param agentIds Agent ID 列表
 */
private cancelCommandsForAgents(agentIds: string[]) {
  // 调用指令面板的批量取消方法
  const commandPanel = this.scene.get('StratixCommandPanel') as StratixCommandPanel;
  if (commandPanel) {
    commandPanel.batchCancelCommands(agentIds);
  }
}
```

## 测试用例

### 1. 单个指令取消测试
- **输入**：点击运行中指令的"取消"按钮
- **预期**：
  - 弹出确认对话框
  - 确认后发射 `stratix:command_cancel` 事件
  - 指令状态更新为 `failed`，显示"用户取消"

### 2. 已完成指令取消测试
- **输入**：点击已完成指令的"取消"按钮（按钮应不存在）
- **预期**：
  - 取消按钮不显示
  - 无法取消已完成的指令

### 3. 批量取消测试
- **输入**：选中 3 个 Agent，右键选择"取消指令"
- **预期**：
  - 弹出确认对话框
  - 确认后发射 3 个取消事件
  - 所有指令状态更新为 `failed`

### 4. 取消确认测试
- **输入**：点击取消按钮，在确认对话框中点击"取消"
- **预期**：
  - 不发射取消事件
  - 指令状态保持不变

### 5. 取消后 Agent 状态恢复测试
- **输入**：取消一个正在执行的指令
- **预期**：
  - Agent 状态从 `busy` 恢复为 `online`
  - 指令日志状态更新为 `failed`

## 验收标准
- [ ] 支持取消单个指令
- [ ] 仅运行中/等待中的指令显示取消按钮
- [ ] 取消前弹出确认对话框
- [ ] 正确发射取消事件
- [ ] 取消后更新指令状态
- [ ] 支持批量取消功能（可选）
- [ ] 支持右键菜单取消（可选）

## 依赖
- `stratix-protocol.ts`：数据类型定义
- `StratixEventBus`：事件总线
- `CommandLog` 组件：指令日志组件

## 预估工时
- **开发时间**：2 天
- **测试时间**：1 天
- **总计**：3 天

## 备注
- 取消指令是一个不可逆操作，需谨慎处理
- 取消后应通知中间件停止正在执行的任务
- 支持快捷键取消（可选）
- 支持批量取消功能（可选）
- 取消事件需携带足够的上下文信息（如 Agent ID、技能 ID）

# Feature 003: 指令构建与提交

## 功能概述
将用户编辑的指令参数与 Agent 信息结合，生成符合 Stratix 协议的标准化指令（StratixCommandData），并通过事件总线发射给指令转换中间件。

## 功能需求

### 1. 指令构建
- **输入数据**：
  - 选中的 Agent ID 列表（`selectedAgentIds`）
  - 选中的技能配置（`skill: StratixSkillConfig`）
  - 用户填写的参数（`params: Record<string, any>`）
- **输出数据**：`StratixCommandData` 对象
- **构建规则**：
  - `commandId`：格式为 `stratix-cmd-{timestamp}-{random}`
  - `skillId`：从技能配置中获取
  - `agentId`：从选中 Agent 列表中获取（单个 Agent 时直接使用，多个 Agent 时需要批量处理）
  - `params`：用户填写的参数对象
  - `executeAt`：指令执行时间戳（默认为当前时间）

### 2. 批量指令处理
- **场景**：用户选中多个 Agent 执行同一指令
- **处理方式**：
  - **方式 1**：生成多个指令，每个指令对应一个 Agent
  - **方式 2**：生成一个批量指令，携带所有 Agent ID
- **选择策略**：
  - MVP 版本采用方式 1（简单易实现）
  - 后续优化为方式 2（减少网络请求）

### 3. 指令发射
- **事件类型**：`stratix:command_execute`
- **数据结构**：`StratixFrontendOperationEvent`
- **发射时机**：
  - 用户点击"执行指令"按钮
  - 用户按下快捷键（如 Enter）
- **事件数据**：
  ```typescript
  {
    eventType: 'stratix:command_execute',
    payload: {
      agentIds: string[],
      command: StratixCommandData
    },
    timestamp: number,
    requestId: string
  }
  ```

### 4. 指令确认
- **场景**：批量执行或高风险指令（如删除、修改）
- **确认机制**：
  - 弹出确认对话框
  - 展示即将执行的指令详情（Agent 名称、技能名称、参数预览）
  - 用户确认后发射指令，取消则不执行

### 5. 指令队列（可选）
- **场景**：用户连续提交多个指令
- **处理方式**：
  - 将指令加入队列，按顺序执行
  - 显示队列状态（排队中、执行中、已完成）
  - 支持取消排队中的指令

## 技术实现

### 文件结构
```
src/stratix-command-panel/
├── StratixCommandPanel.ts     # 核心逻辑类
└── utils/
    └── CommandBuilder.ts      # 指令构建工具
```

### 核心代码（CommandBuilder.ts）
```typescript
import { 
  StratixCommandData, 
  StratixSkillConfig, 
  StratixFrontendOperationEvent 
} from '@/stratix-core/stratix-protocol';

export default class CommandBuilder {
  /**
   * 构建单个指令
   * @param agentId Agent ID
   * @param skill 技能配置
   * @param params 参数对象
   * @returns Stratix 标准指令数据
   */
  static buildCommand(
    agentId: string,
    skill: StratixSkillConfig,
    params: Record<string, any>
  ): StratixCommandData {
    return {
      commandId: this.generateCommandId(),
      skillId: skill.skillId,
      agentId,
      params,
      executeAt: Date.now()
    };
  }

  /**
   * 批量构建指令（每个 Agent 一个指令）
   * @param agentIds Agent ID 列表
   * @param skill 技能配置
   * @param params 参数对象
   * @returns Stratix 标准指令数据数组
   */
  static buildCommands(
    agentIds: string[],
    skill: StratixSkillConfig,
    params: Record<string, any>
  ): StratixCommandData[] {
    return agentIds.map(agentId => 
      this.buildCommand(agentId, skill, params)
    );
  }

  /**
   * 生成指令 ID（Stratix 标准格式）
   * @returns 指令 ID，格式：stratix-cmd-{timestamp}-{random}
   */
  private static generateCommandId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    return `stratix-cmd-${timestamp}-${random}`;
  }

  /**
   * 构建指令执行事件（Stratix 标准格式）
   * @param command 指令数据
   * @param agentIds Agent ID 列表
   * @returns Stratix 标准事件
   */
  static buildCommandEvent(
    command: StratixCommandData,
    agentIds: string[]
  ): StratixFrontendOperationEvent {
    return {
      eventType: 'stratix:command_execute',
      payload: {
        agentIds,
        command
      },
      timestamp: Date.now(),
      requestId: `stratix-req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    };
  }

  /**
   * 构建批量指令执行事件（每个指令一个事件）
   * @param commands 指令数据数组
   * @param agentIds Agent ID 列表
   * @returns Stratix 标准事件数组
   */
  static buildBatchCommandEvents(
    commands: StratixCommandData[],
    agentIds: string[]
  ): StratixFrontendOperationEvent[] {
    return commands.map((command, index) => 
      this.buildCommandEvent(command, [agentIds[index]])
    );
  }

  /**
   * 预览指令（用于确认对话框）
   * @param command 指令数据
   * @param skill 技能配置
   * @returns 指令预览文本
   */
  static previewCommand(
    command: StratixCommandData,
    skill: StratixSkillConfig
  ): string {
    const paramsText = Object.entries(command.params)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    
    return `技能: ${skill.name}\n参数: ${paramsText}`;
  }
}
```

### 核心逻辑（StratixCommandPanel.ts）
```typescript
import Phaser from 'phaser';
import { 
  StratixFrontendOperationEvent, 
  StratixStateSyncEvent, 
  StratixCommandData, 
  StratixSkillConfig 
} from '@/stratix-core/stratix-protocol';
import StratixEventBus from '@/stratix-core/StratixEventBus';
import CommandBuilder from './utils/CommandBuilder';

export default class StratixCommandPanel extends Phaser.Scene {
  private stratixEventBus: StratixEventBus;
  private selectedAgentIds: string[] = [];
  private selectedSkill: StratixSkillConfig | null = null;

  constructor() {
    super('StratixCommandPanel');
    this.stratixEventBus = StratixEventBus.getInstance();
  }

  /**
   * 执行指令（核心方法）
   * @param skillId 技能 ID
   * @param params 参数对象
   */
  public async executeCommand(skillId: string, params: Record<string, any>): Promise<void> {
    // 1. 获取选中的技能配置
    const skill = this.getSkillById(skillId);
    if (!skill) {
      console.error('技能不存在:', skillId);
      return;
    }

    // 2. 批量执行确认（如果选中多个 Agent）
    if (this.selectedAgentIds.length > 1) {
      const confirmed = await this.confirmBatchExecution(skill, params);
      if (!confirmed) {
        console.log('用户取消批量执行');
        return;
      }
    }

    // 3. 构建指令（批量或单个）
    const commands = CommandBuilder.buildCommands(
      this.selectedAgentIds,
      skill,
      params
    );

    // 4. 发射指令事件（批量发射）
    commands.forEach((command, index) => {
      const event = CommandBuilder.buildCommandEvent(
        command,
        [this.selectedAgentIds[index]]
      );
      this.stratixEventBus.emit(event);
      this.addCommandLog(command, skill.name);
    });

    console.log(`已提交 ${commands.length} 个指令`);
  }

  /**
   * 确认批量执行
   * @param skill 技能配置
   * @param params 参数对象
   * @returns 用户是否确认
   */
  private async confirmBatchExecution(
    skill: StratixSkillConfig,
    params: Record<string, any>
  ): Promise<boolean> {
    // 构建确认消息
    const message = `
      即将对 ${this.selectedAgentIds.length} 个 Agent 执行指令：
      技能：${skill.name}
      参数：${JSON.stringify(params, null, 2)}
      
      是否确认执行？
    `;

    // 使用 Phaser 确认对话框（简化版）
    // 实际项目中应使用更完善的 UI 组件
    return confirm(message);
  }

  /**
   * 获取技能配置（从技能列表中）
   * @param skillId 技能 ID
   * @returns 技能配置（未找到返回 null）
   */
  private getSkillById(skillId: string): StratixSkillConfig | null {
    // TODO: 从技能列表中查找
    return this.selectedSkill;
  }

  /**
   * 添加指令执行日志
   * @param command 指令数据
   * @param skillName 技能名称
   */
  private addCommandLog(command: StratixCommandData, skillName: string): void {
    // TODO: 添加到指令日志列表
    console.log('添加指令日志:', command.commandId, skillName);
  }

  /**
   * 设置选中的 Agent
   * @param agentIds Agent ID 列表
   */
  public setSelectedAgents(agentIds: string[]): void {
    this.selectedAgentIds = agentIds;
  }

  /**
   * 设置选中的技能
   * @param skill 技能配置
   */
  public setSelectedSkill(skill: StratixSkillConfig): void {
    this.selectedSkill = skill;
  }
}
```

## 测试用例

### 1. 单个指令构建测试
- **输入**：1 个 Agent ID，1 个技能，参数对象
- **预期**：
  - 生成 1 个 `StratixCommandData` 对象
  - `commandId` 格式为 `stratix-cmd-{timestamp}-{random}`
  - 参数对象正确映射

### 2. 批量指令构建测试
- **输入**：3 个 Agent ID，1 个技能，参数对象
- **预期**：
  - 生成 3 个 `StratixCommandData` 对象
  - 每个对象的 `agentId` 不同
  - 其他字段（skillId、params）相同

### 3. 指令发射测试
- **输入**：调用 `executeCommand` 方法
- **预期**：
  - 事件总线收到 `stratix:command_execute` 事件
  - 事件数据格式符合 `StratixFrontendOperationEvent` 协议

### 4. 批量确认测试
- **输入**：选中 3 个 Agent，点击"执行指令"
- **预期**：
  - 弹出确认对话框
  - 点击"确认"后发射 3 个指令事件
  - 点击"取消"后不发射任何事件

### 5. 指令 ID 唯一性测试
- **输入**：连续调用 100 次 `buildCommand`
- **预期**：
  - 生成 100 个不同的 `commandId`
  - 所有 ID 符合格式 `stratix-cmd-{timestamp}-{random}`

## 验收标准
- [ ] 正确构建单个指令
- [ ] 正确构建批量指令
- [ ] 指令 ID 格式符合 Stratix 协议
- [ ] 通过事件总线发射指令
- [ ] 批量执行前弹出确认对话框
- [ ] 事件数据格式符合 Stratix 协议

## 依赖
- `stratix-protocol.ts`：数据类型定义
- `StratixEventBus`：事件总线

## 预估工时
- **开发时间**：2 天
- **测试时间**：1 天
- **总计**：3 天

## 备注
- 指令 ID 需保证唯一性（时间戳 + 随机数）
- 批量执行时需考虑性能优化（事件合并）
- 支持指令队列功能（可选）

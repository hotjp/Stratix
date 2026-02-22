# Feature feature_003 - 指令构建与提交

## 元信息
- **优先级**: P0
- **负责人**: stratix-team
- **预计工时**: 3天
- **创建时间**: 2026-02-22 17:21:49

## 功能描述
将用户编辑的指令参数与 Agent 信息结合，生成符合 Stratix 协议的标准化指令（StratixCommandData），并通过事件总线发射给指令转换中间件。

## 功能设计方案

### 1. 指令构建
- **输入数据**：
  - 选中的 Agent ID 列表（`selectedAgentIds`）
  - 选中的技能配置（`skill: StratixSkillConfig`）
  - 用户填写的参数（`params: Record<string, any>`）
- **输出数据**：`StratixCommandData` 对象
- **构建规则**：
  - `commandId`：格式为 `stratix-cmd-{timestamp}-{random}`
  - `skillId`：从技能配置中获取
  - `agentId`：从选中 Agent 列表中获取
  - `params`：用户填写的参数对象
  - `executeAt`：指令执行时间戳（默认为当前时间）

### 2. 批量指令处理
- **场景**：用户选中多个 Agent 执行同一指令
- **处理方式**：
  - **方式 1**：生成多个指令，每个指令对应一个 Agent（MVP 版本）
  - **方式 2**：生成一个批量指令，携带所有 Agent ID（后续优化）

### 3. 指令发射
- **事件类型**：`stratix:command_execute`
- **数据结构**：`StratixFrontendOperationEvent`
- **发射时机**：
  - 用户点击"执行指令"按钮
  - 用户按下快捷键（如 Enter）
- **事件数据格式**：
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
- **场景**：批量执行或高风险指令
- **确认机制**：
  - 弹出确认对话框
  - 展示即将执行的指令详情（Agent 名称、技能名称、参数预览）
  - 用户确认后发射指令，取消则不执行

### 5. 技术实现
**文件结构**：
```
src/stratix-command-panel/
├── StratixCommandPanel.ts     # 核心逻辑类
└── utils/
    └── CommandBuilder.ts      # 指令构建工具
```

**核心接口**：
- 发射事件：`stratix:command_execute`
- 依赖：StratixEventBus

## 开发步骤
- [ ] 步骤 1：创建 CommandBuilder.ts 工具类，实现单个指令构建逻辑
- [ ] 步骤 2：实现批量指令构建逻辑
- [ ] 步骤 3：实现指令 ID 生成逻辑（保证唯一性）
- [ ] 步骤 4：实现指令发射逻辑（通过事件总线）
- [ ] 步骤 5：实现批量执行确认对话框
- [ ] 步骤 6：集成到 StratixCommandPanel.ts 核心类
- [ ] 步骤 7：编写单元测试（指令 ID 唯一性测试、批量指令测试）

## 测试用例
| 用例编号 | 场景 | 操作步骤 | 预期结果 |
|----------|------|----------|----------|
| TC-001 | 单个指令构建测试 | 1 个 Agent ID，1 个技能，参数对象 | 生成 1 个 `StratixCommandData` 对象，commandId 格式正确 |
| TC-002 | 批量指令构建测试 | 3 个 Agent ID，1 个技能，参数对象 | 生成 3 个 `StratixCommandData` 对象，每个 agentId 不同 |
| TC-003 | 指令发射测试 | 调用 `executeCommand` 方法 | 事件总线收到 `stratix:command_execute` 事件，数据格式正确 |
| TC-004 | 批量确认测试（确认） | 选中 3 个 Agent，点击"执行指令"，点击"确认" | 发射 3 个指令事件 |
| TC-005 | 批量确认测试（取消） | 选中 3 个 Agent，点击"执行指令"，点击"取消" | 不发射任何事件 |
| TC-006 | 指令 ID 唯一性测试 | 连续调用 100 次 `buildCommand` | 生成 100 个不同的 commandId，格式符合规范 |

## 验收标准
- [ ] 正确构建单个指令，数据格式符合 Stratix 协议
- [ ] 正确构建批量指令，每个 Agent 对应一个指令
- [ ] 指令 ID 格式为 `stratix-cmd-{timestamp}-{random}`，保证唯一性
- [ ] 通过事件总线发射 `stratix:command_execute` 事件
- [ ] 批量执行前弹出确认对话框
- [ ] 事件数据格式符合 `StratixFrontendOperationEvent` 协议
- [ ] 代码通过 ESLint 检查，无类型错误

## 变更记录
| 日期 | 变更内容 | 变更人 |
|------|----------|--------|
| 2026-02-22 | 初始创建 | AI Assistant |
| 2026-02-22 | 迁移内容到 LRA 标准格式 | AI Assistant |

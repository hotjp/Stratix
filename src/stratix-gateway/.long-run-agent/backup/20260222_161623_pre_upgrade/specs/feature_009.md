# Feature 009: 技能执行器（SkillExecutor）

## 元信息
- **优先级**: P1
- **负责人**: stratix-team
- **预计工时**: 1 天
- **创建时间**: 2026-02-22 16:14:05

## 功能描述
封装具体的技能执行逻辑，支持自定义技能类型扩展，提供技能执行前后的钩子机制（before/after hooks），实现技能执行的统一管理和监控。

## 功能设计方案

### 1. 核心接口设计

```typescript
// src/stratix-gateway/command-transformer/SkillExecutor.ts

export interface SkillExecutionContext {
  skill: StratixSkillConfig;
  params: Record<string, any>;
  agentConfig: StratixAgentConfig;
  requestId: string;
}

export interface SkillExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
}

export interface SkillHook {
  before?(context: SkillExecutionContext): Promise<void>;
  after?(context: SkillExecutionContext, result: SkillExecutionResult): Promise<void>;
}

export type SkillType = 'copywriting' | 'development' | 'analysis' | 'custom';
```

### 2. 功能模块

#### 2.1 技能类型注册
- 支持注册自定义技能类型
- 内置技能类型：
  - `copywriting`: 文案技能，调用 AI 文案生成 API
  - `development`: 开发技能，调用代码生成工具
  - `analysis`: 分析技能，调用数据分析服务
  - `custom`: 自定义技能，由用户扩展

#### 2.2 钩子机制
- `before` 钩子：技能执行前调用，可用于参数验证、日志记录
- `after` 钩子：技能执行后调用，可用于结果处理、状态更新

#### 2.3 执行流程
```
1. 注册 before 钩子执行
2. 技能参数验证
3. 调用 OpenClaw 执行技能
4. 注册 after 钩子执行
5. 返回执行结果
```

### 3. 类结构

```typescript
export class SkillExecutor {
  private openClawConnector: OpenClawConnector;
  private hooks: Map<string, SkillHook[]>;
  private skillTypes: Map<SkillType, SkillHandler>;

  constructor(openClawConnector: OpenClawConnector);

  // 注册钩子
  registerHook(skillId: string, hook: SkillHook): void;

  // 注册技能类型处理器
  registerSkillType(type: SkillType, handler: SkillHandler): void;

  // 执行技能
  async execute(context: SkillExecutionContext): Promise<SkillExecutionResult>;

  // 批量执行技能
  async executeBatch(contexts: SkillExecutionContext[]): Promise<SkillExecutionResult[]>;

  // 验证技能参数
  validateParams(skill: StratixSkillConfig, params: Record<string, any>): boolean;
}
```

## 开发步骤
- [ ] 步骤 1：创建 SkillExecutor 类基础结构，定义接口类型
- [ ] 步骤 2：实现技能类型注册机制
- [ ] 步骤 3：实现 before/after 钩子机制
- [ ] 步骤 4：实现技能执行核心逻辑，集成 OpenClawConnector
- [ ] 步骤 5：实现批量执行功能
- [ ] 步骤 6：编写单元测试

## 测试用例
| 用例编号 | 场景 | 操作步骤 | 预期结果 |
|----------|------|----------|----------|
| TC-001 | 基础技能执行 | 调用 execute 方法执行文案技能 | 返回成功结果，包含生成的文案 |
| TC-002 | before 钩子执行 | 注册 before 钩子并执行技能 | before 钩子在技能执行前被调用 |
| TC-003 | after 钩子执行 | 注册 after 钩子并执行技能 | after 钩子在技能执行后被调用 |
| TC-004 | 参数验证失败 | 传入缺少必填参数的技能 | 返回验证失败错误 |
| TC-005 | 批量执行 | 调用 executeBatch 执行多个技能 | 所有技能依次执行，返回结果数组 |
| TC-006 | 自定义技能类型 | 注册自定义技能类型处理器 | 自定义技能能够正常执行 |

## 验收标准
- [ ] 支持注册自定义技能类型
- [ ] before/after 钩子正常工作
- [ ] 技能执行成功返回正确结果
- [ ] 参数验证有效
- [ ] 批量执行功能正常
- [ ] 单元测试覆盖率 > 80%

## 变更记录
| 日期 | 变更内容 | 变更人 |
|------|----------|--------|
| 2026-02-22 | 初始创建 | - |

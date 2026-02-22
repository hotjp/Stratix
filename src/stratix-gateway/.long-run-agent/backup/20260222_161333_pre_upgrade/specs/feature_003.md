# Feature 003: 指令转换器（CommandTransformer）

## 功能概述
将前端发送的游戏化指令（StratixCommandData）转换为 OpenClaw 标准调用格式，并执行指令。

## 功能需求

### 1. 指令转换逻辑

#### 1.1 技能匹配
- **输入**：StratixCommandData（包含 skillId 和 params）
- **步骤**：
  1. 从 Agent 配置中查找匹配的技能
  2. 未找到则抛出错误

#### 1.2 模板变量替换
- **模板格式**：`{{paramName}}`
- **替换逻辑**：
  ```typescript
  // 输入 executeScript: "执行 {{action}} 操作，目标 {{target}}"
  // 输入 params: { action: "写文案", target: "产品介绍" }
  // 输出: "执行 写文案 操作，目标 产品介绍"
  ```
- **支持类型**：字符串、数字、布尔值
- **替换方式**：全局替换（所有匹配的变量）

#### 1.3 脚本解析
- **格式**：JSON 字符串
- **解析**：`JSON.parse(executeScript)`
- **错误处理**：解析失败抛出详细错误

### 2. 指令执行流程

#### 2.1 完整流程
```
1. 接收 StratixCommandData
2. 获取 Agent 配置
3. 查找技能（根据 skillId）
4. 替换模板变量
5. 解析执行脚本
6. 调用 OpenClaw 执行
7. 返回执行结果
```

#### 2.2 异步执行
- 支持异步指令执行
- 立即返回指令 ID
- 通过 WebSocket 推送状态更新

### 3. 参数验证

#### 3.1 必填参数检查
- 检查所有模板变量是否都有对应参数
- 缺少参数返回详细错误

#### 3.2 参数类型检查
- 验证参数类型是否符合预期（可选）
- 类型不匹配返回警告或错误

### 4. 错误处理

#### 4.1 错误类型
- **技能未找到**：`Skill not found: ${skillId}`
- **参数缺失**：`Missing parameter: ${paramName}`
- **脚本解析失败**：`Failed to parse executeScript`
- **执行失败**：OpenClaw 返回的错误

#### 4.2 错误响应格式
```json
{
  "code": 400,
  "message": "Skill not found: skill-001",
  "data": null,
  "requestId": "stratix-req-1645521234567"
}
```

### 5. 技能执行器（SkillExecutor）

#### 5.1 功能
- 封装具体的技能执行逻辑
- 支持自定义技能类型
- 支持技能钩子（before/after）

#### 5.2 示例技能类型
- **文案技能**：调用 AI 文案生成 API
- **开发技能**：调用代码生成工具
- **分析技能**：调用数据分析服务

## 技术实现

### 文件结构
```
src/stratix-gateway/command-transformer/
├── CommandTransformer.ts     # 指令转换核心类
├── SkillExecutor.ts          # 技能执行器
└── TemplateEngine.ts         # 模板引擎（可选）
```

### 核心代码（CommandTransformer.ts）
```typescript
import { StratixCommandData, StratixAgentConfig, StratixSkillConfig } from '@/stratix-core/stratix-protocol';
import { OpenClawConnector } from '../openclaw-connector/OpenClawConnector';

export class CommandTransformer {
  private openClawConnector: OpenClawConnector;

  constructor() {
    this.openClawConnector = new OpenClawConnector();
  }

  public async transformAndExecute(
    command: StratixCommandData,
    agentConfig: StratixAgentConfig
  ): Promise<any> {
    const skill = this.findSkill(agentConfig, command.skillId);
    if (!skill) {
      throw new Error(`Skill not found: ${command.skillId}`);
    }

    const executeScript = this.replaceTemplateVariables(
      skill.executeScript,
      command.params
    );

    const action = this.parseExecuteScript(executeScript);

    return await this.openClawConnector.execute(
      agentConfig.openClawConfig,
      action
    );
  }

  private findSkill(
    agentConfig: StratixAgentConfig,
    skillId: string
  ): StratixSkillConfig | null {
    return agentConfig.skills.find(s => s.skillId === skillId) || null;
  }

  private replaceTemplateVariables(
    template: string,
    params: Record<string, any>
  ): string {
    let result = template;

    Object.entries(params).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    });

    const missingParams = this.findMissingParameters(result);
    if (missingParams.length > 0) {
      throw new Error(`Missing parameters: ${missingParams.join(', ')}`);
    }

    return result;
  }

  private findMissingParameters(template: string): string[] {
    const regex = /{{([^}]+)}}/g;
    const matches: string[] = [];
    let match;

    while ((match = regex.exec(template)) !== null) {
      matches.push(match[1]);
    }

    return [...new Set(matches)];
  }

  private parseExecuteScript(script: string): any {
    try {
      return JSON.parse(script);
    } catch (error) {
      throw new Error(`Failed to parse executeScript: ${error}`);
    }
  }

  public validateCommand(
    command: StratixCommandData,
    agentConfig: StratixAgentConfig
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const skill = this.findSkill(agentConfig, command.skillId);
    if (!skill) {
      errors.push(`Skill not found: ${command.skillId}`);
      return { valid: false, errors };
    }

    const requiredParams = this.extractRequiredParameters(skill.executeScript);
    requiredParams.forEach(param => {
      if (!(param in command.params)) {
        errors.push(`Missing required parameter: ${param}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private extractRequiredParameters(template: string): string[] {
    const regex = /{{([^}]+)}}/g;
    const params: string[] = [];
    let match;

    while ((match = regex.exec(template)) !== null) {
      params.push(match[1]);
    }

    return [...new Set(params)];
  }
}
```

## 测试用例

### 1. 基础转换测试
- **输入**：StratixCommandData 和 Agent 配置
- **预期**：正确转换为 OpenClaw action 并执行

### 2. 模板变量替换测试
- **输入**：模板字符串和参数
- **预期**：所有变量正确替换

### 3. 参数缺失测试
- **输入**：缺少参数的指令
- **预期**：抛出 "Missing parameters" 错误

### 4. 技能未找到测试
- **输入**：不存在的 skillId
- **预期**：抛出 "Skill not found" 错误

### 5. 脚本解析失败测试
- **输入**：格式错误的 executeScript
- **预期**：抛出 "Failed to parse executeScript" 错误

### 6. 参数验证测试
- **输入**：validateCommand 方法
- **预期**：返回验证结果和错误列表

### 7. 复杂模板测试
- **输入**：包含多个相同变量的模板
- **预期**：所有相同变量都被替换

## 验收标准
- [ ] 技能匹配正确
- [ ] 模板变量替换完整
- [ ] 脚本解析成功
- [ ] OpenClaw 调用正确
- [ ] 参数验证有效
- [ ] 错误处理完善

## 依赖
- `OpenClawConnector`：OpenClaw 连接器
- `stratix-protocol.ts`：数据类型定义

## 预估工时
- **开发时间**：1.5 天
- **测试时间**：1 天
- **总计**：2.5 天

## 备注
- 支持更复杂的模板语法（如条件语句、循环）- 可选
- 支持模板缓存优化性能 - 可选
- 支持自定义模板引擎 - 可选

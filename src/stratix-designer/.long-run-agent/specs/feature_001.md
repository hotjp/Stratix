# Feature feature_001 - ConfigValidator & ConfigConverter

## 元信息
- **优先级**: P0（核心基础工具）
- **负责人**: AI Agent
- **预计工时**: 0.5 天
- **创建时间**: 2026-02-22 15:46:25

## 功能描述
配置校验与转换工具，用于确保 Agent 配置的完整性和正确性，并支持 Stratix 配置与 OpenClaw 格式之间的转换。

## 功能设计方案

### ConfigValidator
- `validate(config)`: 完整配置校验
- `validateAgentId(agentId)`: Agent ID 格式校验（必须以 `stratix-` 开头）
- `validateSoul(soul)`: Soul 配置校验（identity、goals 必填）
- `validateSkills(skills)`: 技能配置校验（至少一个技能）
- `validateModel(model)`: 模型配置校验
- `validateOpenClawConfig(config)`: OpenClaw 配置校验

### ConfigConverter
- `toOpenClawFormat(config)`: 转换为 OpenClaw 原生格式
- `fromOpenClawFormat(openClawConfig)`: 从 OpenClaw 格式导入
- `toJson(config)`: 序列化为 JSON
- `fromJson(json)`: 从 JSON 反序列化
- `mergeConfigs(base, override)`: 合并两个配置

### 文件结构
```
utils/
├── ConfigValidator.ts
├── ConfigConverter.ts
└── index.ts
```

## 开发步骤
- [x] 步骤 1：创建 ConfigValidator 类，实现所有校验方法
- [x] 步骤 2：创建 ConfigConverter 类，实现格式转换方法
- [x] 步骤 3：创建统一导出 index.ts
- [x] 步骤 4：类型检查通过

## 测试用例
| 用例编号 | 场景 | 操作步骤 | 预期结果 |
|----------|------|----------|----------|
| TC-001 | 校验有效配置 | 调用 validate() | valid: true |
| TC-002 | 校验无效 agentId | agentId 不以 stratix- 开头 | valid: false |
| TC-003 | 校验空技能列表 | skills: [] | valid: false |
| TC-004 | 转换为 OpenClaw 格式 | 调用 toOpenClawFormat() | 生成正确格式 |
| TC-005 | JSON 序列化/反序列化 | toJson -> fromJson | 配置一致 |

## 验收标准
- [x] 标准 1：所有校验规则正确实现
- [x] 标准 2：OpenClaw 格式转换正确
- [x] 标准 3：TypeScript 类型检查通过

## 变更记录
| 日期 | 变更内容 | 变更人 |
|------|----------|--------|
| 2026-02-22 | 初始创建 | AI |
| 2026-02-22 | 开发完成 | AI |

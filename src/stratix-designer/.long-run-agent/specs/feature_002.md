# Feature feature_002 - 预设模板库

## 元信息
- **优先级**: P0（核心数据）
- **负责人**: AI Agent
- **预计工时**: 0.5 天
- **创建时间**: 2026-02-22 15:46:25

## 功能描述
提供三种预设英雄模板：文案英雄、开发英雄、数据分析英雄，用于快速创建新 Agent。

## 功能设计方案

### 模板类型
1. **WriterHeroTemplate** - 文案英雄
   - 模型: claude-3-sonnet, temperature: 0.7
   - 技能: 快速写文案
   
2. **DevHeroTemplate** - 开发英雄
   - 模型: gpt-4o, temperature: 0.6
   - 技能: 编写代码
   
3. **AnalystHeroTemplate** - 数据分析英雄
   - 模型: claude-3-opus, temperature: 0.5
   - 技能: 数据分析

### HeroTemplateBase 接口
```typescript
interface HeroTemplateBase {
  getTemplate(agentId?: string): StratixAgentConfig;
  getType(): HeroType;
  getName(): string;
  getDescription(): string;
}
```

### 文件结构
```
templates/
├── types.ts              # HeroTemplateBase 接口
├── WriterHeroTemplate.ts
├── DevHeroTemplate.ts
├── AnalystHeroTemplate.ts
└── index.ts              # 统一导出
```

## 开发步骤
- [x] 步骤 1：定义 HeroTemplateBase 接口和工具函数
- [x] 步骤 2：实现 WriterHeroTemplate
- [x] 步骤 3：实现 DevHeroTemplate
- [x] 步骤 4：实现 AnalystHeroTemplate
- [x] 步骤 5：创建统一导出

## 测试用例
| 用例编号 | 场景 | 操作步骤 | 预期结果 |
|----------|------|----------|----------|
| TC-001 | 获取文案模板 | WriterHeroTemplate.getTemplate() | 正确的 writer 类型配置 |
| TC-002 | 获取开发模板 | DevHeroTemplate.getTemplate() | 正确的 dev 类型配置 |
| TC-003 | 获取分析模板 | AnalystHeroTemplate.getTemplate() | 正确的 analyst 类型配置 |
| TC-004 | 自动生成 ID | getTemplate() 无参数 | agentId 以 stratix- 开头 |

## 验收标准
- [x] 标准 1：三种模板完整实现
- [x] 标准 2：模板数据符合 init.md 规范
- [x] 标准 3：skillId 以 stratix-skill- 开头

## 变更记录
| 日期 | 变更内容 | 变更人 |
|------|----------|--------|
| 2026-02-22 | 初始创建 | AI |
| 2026-02-22 | 开发完成 | AI |

# Feature 010: 模板管理器（TemplateManager）

## 元信息
- **优先级**: P1
- **负责人**: stratix-team
- **预计工时**: 1 天
- **创建时间**: 2026-02-22 16:14:07

## 功能描述
管理 Agent 配置模板，提供模板的增删改查、导入导出功能，支持模板分类和标签管理，为用户提供快速创建 Agent 配置的能力。

## 功能设计方案

### 1. 核心接口设计

```typescript
// src/stratix-gateway/config-manager/TemplateManager.ts

export interface StratixTemplate {
  templateId: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  config: StratixAgentConfig;
  createdAt: number;
  updatedAt: number;
  isBuiltIn: boolean;
}

export interface TemplateFilter {
  category?: string;
  tags?: string[];
  keyword?: string;
}

export interface TemplateExportData {
  version: string;
  exportedAt: number;
  templates: StratixTemplate[];
}
```

### 2. 功能模块

#### 2.1 模板 CRUD 操作
- `createTemplate(template: StratixTemplate)`: 创建新模板
- `getTemplate(templateId: string)`: 获取单个模板
- `listTemplates(filter?: TemplateFilter)`: 列表查询（支持筛选）
- `updateTemplate(templateId: string, updates: Partial<StratixTemplate>)`: 更新模板
- `deleteTemplate(templateId: string)`: 删除模板

#### 2.2 模板导入导出
- `exportTemplates(templateIds: string[])`: 导出模板为 JSON
- `importTemplates(data: TemplateExportData)`: 从 JSON 导入模板
- 支持批量导入导出
- 导入时自动检测模板 ID 冲突（覆盖/跳过/重命名）

#### 2.3 模板分类和标签
- 预置分类：
  - `copywriting`: 文案创作
  - `development`: 软件开发
  - `analysis`: 数据分析
  - `marketing`: 营销推广
  - `custom`: 自定义
- 支持多标签
- 支持按分类和标签筛选

#### 2.4 内置模板
- 提供内置模板，不可删除
- 内置模板包括：
  - AI 文案助手
  - 代码生成助手
  - 数据分析助手

### 3. 类结构

```typescript
export class TemplateManager {
  private db: Low<StratixDatabase>;

  constructor();

  // CRUD
  async createTemplate(template: Omit<StratixTemplate, 'templateId' | 'createdAt' | 'updatedAt'>): Promise<StratixTemplate>;
  async getTemplate(templateId: string): Promise<StratixTemplate | null>;
  async listTemplates(filter?: TemplateFilter): Promise<StratixTemplate[]>;
  async updateTemplate(templateId: string, updates: Partial<StratixTemplate>): Promise<StratixTemplate | null>;
  async deleteTemplate(templateId: string): Promise<boolean>;

  // 导入导出
  async exportTemplates(templateIds?: string[]): Promise<TemplateExportData>;
  async importTemplates(data: TemplateExportData, conflictStrategy: 'overwrite' | 'skip' | 'rename'): Promise<{ imported: number; skipped: number }>;

  // 辅助方法
  async getCategories(): Promise<string[]>;
  async getTags(): Promise<string[]>;
  async createFromTemplate(templateId: string, overrides?: Partial<StratixAgentConfig>): Promise<StratixAgentConfig>;

  // 内置模板
  private initBuiltInTemplates(): void;
}
```

### 4. 与 ConfigManager 集成
- ConfigManager 使用 TemplateManager 创建 Agent
- `createAgentFromTemplate(templateId: string, overrides)`: 从模板创建 Agent

## 开发步骤
- [ ] 步骤 1：创建 TemplateManager 类基础结构，定义接口类型
- [ ] 步骤 2：实现模板 CRUD 操作
- [ ] 步骤 3：实现模板筛选功能（分类、标签、关键字）
- [ ] 步骤 4：实现模板导入导出功能
- [ ] 步骤 5：实现内置模板初始化
- [ ] 步骤 6：集成到 ConfigManager
- [ ] 步骤 7：编写单元测试

## 测试用例
| 用例编号 | 场景 | 操作步骤 | 预期结果 |
|----------|------|----------|----------|
| TC-001 | 创建模板 | 调用 createTemplate 创建新模板 | 模板创建成功，返回完整模板信息 |
| TC-002 | 获取模板 | 调用 getTemplate 获取已存在的模板 | 返回正确的模板信息 |
| TC-003 | 列表筛选 | 调用 listTemplates 并传入分类筛选 | 只返回指定分类的模板 |
| TC-004 | 更新模板 | 调用 updateTemplate 更新模板信息 | 模板更新成功 |
| TC-005 | 删除模板 | 调用 deleteTemplate 删除非内置模板 | 模板删除成功 |
| TC-006 | 删除内置模板 | 尝试删除内置模板 | 返回错误，模板未被删除 |
| TC-007 | 导出模板 | 调用 exportTemplates 导出指定模板 | 返回正确格式的 JSON 数据 |
| TC-008 | 导入模板 | 调用 importTemplates 导入模板数据 | 模板导入成功 |
| TC-009 | 导入冲突处理 | 导入已存在的模板（overwrite 策略）| 原模板被覆盖 |
| TC-010 | 从模板创建 Agent | 调用 createFromTemplate | 返回基于模板的 Agent 配置 |

## 验收标准
- [ ] 模板 CRUD 操作正常
- [ ] 分类和标签筛选功能正常
- [ ] 导入导出功能正常
- [ ] 内置模板不可删除
- [ ] 与 ConfigManager 集成正常
- [ ] 单元测试覆盖率 > 80%

## 变更记录
| 日期 | 变更内容 | 变更人 |
|------|----------|--------|
| 2026-02-22 | 初始创建 | - |

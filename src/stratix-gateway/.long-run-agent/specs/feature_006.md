# Feature 006: 模板管理 API 路由

## 功能概述
实现 Agent 配置模板的管理功能，包括模板列表、导入和导出。

## 功能需求

### 1. 获取模板列表（GET /api/stratix/config/template/list）

#### 1.1 请求格式
```typescript
GET /api/stratix/config/template/list
```

#### 1.2 响应格式
```json
{
  "code": 200,
  "message": "Templates fetched",
  "data": [
    {
      "templateId": "template-001",
      "name": "文案英雄模板",
      "type": "writer",
      "description": "标准文案 Agent 配置模板",
      "skills": [ /* StratixSkillConfig[] */ ],
      "createdAt": 1645521234567
    }
  ],
  "requestId": "stratix-req-1645521234567"
}
```

#### 1.3 模板分类
- 按类型分类（writer, dev, analyst）
- 按用途分类（通用、专用）
- 支持搜索和筛选

### 2. 导入模板（POST /api/stratix/config/template/import）

#### 2.1 请求格式
```typescript
POST /api/stratix/config/template/import
Content-Type: application/json

{
  "templateId": "template-001",
  "name": "文案英雄模板",
  "type": "writer",
  "description": "标准文案 Agent 配置模板",
  "skills": [ /* StratixSkillConfig[] */ ]
}
```

#### 2.2 响应格式
```json
{
  "code": 200,
  "message": "Template imported",
  "data": { /* StratixTemplateConfig */ },
  "requestId": "stratix-req-1645521234567"
}
```

#### 2.3 导入逻辑
- 验证模板格式
- 检查模板 ID 唯一性
- 保存到模板数据库
- 返回导入结果

#### 2.4 错误处理
- 400：模板格式无效
- 409：模板 ID 已存在

### 3. 导出模板（POST /api/stratix/config/template/export）

#### 3.1 请求格式
```typescript
POST /api/stratix/config/template/export
Content-Type: application/json

{
  "templateId": "template-001",
  "format": "json"
}
```

#### 3.2 响应格式
```json
{
  "code": 200,
  "message": "Template exported",
  "data": { /* 完整的模板配置 */ },
  "requestId": "stratix-req-1645521234567"
}
```

#### 3.3 导出格式
- `json`：JSON 格式（默认）
- `yaml`：YAML 格式（可选）
- 支持自定义格式（可选）

#### 3.4 导出内容
- 完整的模板配置
- 包含所有技能定义
- 包含 OpenClaw 配置模板

### 4. 模板管理器（TemplateManager）

#### 4.1 功能
- 模板的 CRUD 操作
- 模板验证
- 模板版本管理（可选）

#### 4.2 核心方法
```typescript
class TemplateManager {
  async listTemplates(): Promise<StratixTemplateConfig[]>
  async importTemplate(template: StratixTemplateConfig): Promise<StratixApiResponse>
  async exportTemplate(templateId: string, format: string): Promise<any>
  async deleteTemplate(templateId: string): Promise<StratixApiResponse>
}
```

### 5. 预设模板

#### 5.1 文案英雄模板
```json
{
  "templateId": "template-writer-001",
  "name": "文案英雄模板",
  "type": "writer",
  "skills": [
    {
      "skillId": "skill-quick-write",
      "name": "快速写文案",
      "description": "快速生成营销文案",
      "executeScript": "{\"type\":\"write\",\"params\":{\"action\":\"{{action}}\",\"target\":\"{{target}}\"}}"
    }
  ]
}
```

#### 5.2 开发英雄模板
```json
{
  "templateId": "template-dev-001",
  "name": "开发英雄模板",
  "type": "dev",
  "skills": [
    {
      "skillId": "skill-code-gen",
      "name": "代码生成",
      "description": "生成指定功能的代码",
      "executeScript": "{\"type\":\"codegen\",\"params\":{\"language\":\"{{language}}\",\"feature\":\"{{feature}}\"}}"
    }
  ]
}
```

### 6. 模板应用

#### 6.1 从模板创建 Agent
- 选择模板
- 填写必要参数（agentId, name）
- 生成 Agent 配置
- 调用 Agent 创建 API

#### 6.2 模板与 Agent 关系
- 模板是 Agent 的蓝图
- 一个模板可以创建多个 Agent
- Agent 可以自定义修改（不影响模板）

## 技术实现

### 文件结构
```
src/stratix-gateway/config-manager/
├── ConfigManager.ts          # 配置管理核心类
└── TemplateManager.ts        # 模板管理器

src/stratix-gateway/api/routes/
└── template.ts               # 模板 API 路由
```

### 核心代码（TemplateManager.ts）
```typescript
import { StratixApiResponse } from '@/stratix-core/stratix-protocol';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

interface StratixTemplateConfig {
  templateId: string;
  name: string;
  type: string;
  description?: string;
  skills: any[];
  createdAt?: number;
}

interface StratixDatabase {
  agents: any[];
  templates: StratixTemplateConfig[];
}

export class TemplateManager {
  private db: Low<StratixDatabase>;

  constructor(db: Low<StratixDatabase>) {
    this.db = db;
  }

  public async listTemplates(): Promise<StratixTemplateConfig[]> {
    await this.db.read();
    return this.db.data.templates;
  }

  public async importTemplate(
    template: StratixTemplateConfig
  ): Promise<StratixApiResponse> {
    await this.db.read();

    const existing = this.db.data.templates.find(
      t => t.templateId === template.templateId
    );

    if (existing) {
      return {
        code: 409,
        message: 'Template already exists',
        data: null,
        requestId: `stratix-req-${Date.now()}`
      };
    }

    template.createdAt = Date.now();
    this.db.data.templates.push(template);
    await this.db.write();

    return {
      code: 200,
      message: 'Template imported',
      data: template,
      requestId: `stratix-req-${Date.now()}`
    };
  }

  public async exportTemplate(
    templateId: string,
    format: string = 'json'
  ): Promise<StratixApiResponse> {
    await this.db.read();

    const template = this.db.data.templates.find(
      t => t.templateId === templateId
    );

    if (!template) {
      return {
        code: 404,
        message: 'Template not found',
        data: null,
        requestId: `stratix-req-${Date.now()}`
      };
    }

    return {
      code: 200,
      message: 'Template exported',
      data: template,
      requestId: `stratix-req-${Date.now()}`
    };
  }

  public async deleteTemplate(
    templateId: string
  ): Promise<StratixApiResponse> {
    await this.db.read();

    const index = this.db.data.templates.findIndex(
      t => t.templateId === templateId
    );

    if (index < 0) {
      return {
        code: 404,
        message: 'Template not found',
        data: null,
        requestId: `stratix-req-${Date.now()}`
      };
    }

    this.db.data.templates.splice(index, 1);
    await this.db.write();

    return {
      code: 200,
      message: 'Template deleted',
      data: null,
      requestId: `stratix-req-${Date.now()}`
    };
  }
}
```

## 测试用例

### 1. 获取模板列表测试
- **请求**：GET /list
- **预期**：返回 code: 200 和模板列表

### 2. 导入模板测试
- **请求**：POST /import，新模板
- **预期**：返回 code: 200，模板导入成功

### 3. 导入重复模板测试
- **请求**：POST /import，已存在的 templateId
- **预期**：返回 code: 409

### 4. 导出模板测试
- **请求**：POST /export，有效的 templateId
- **预期**：返回 code: 200 和完整模板

### 5. 导出不存在模板测试
- **请求**：POST /export，不存在的 templateId
- **预期**：返回 code: 404

## 验收标准
- [ ] 模板列表接口正常工作
- [ ] 模板导入接口正常工作
- [ ] 模板导出接口正常工作
- [ ] 模板格式验证有效
- [ ] 错误处理完善

## 依赖
- `express`：HTTP 框架
- `lowdb`：数据库
- `stratix-protocol.ts`：数据类型定义

## 预估工时
- **开发时间**：1 天
- **测试时间**：0.5 天
- **总计**：1.5 天

## 备注
- 支持模板版本管理 - 可选
- 支持模板分享和协作 - 可选
- 支持从现有 Agent 创建模板 - 可选

# Feature 001: 配置管理器（ConfigManager）

## 功能概述
实现 Agent 配置的持久化管理，使用 lowdb 进行本地 JSON 存储，支持 Agent 配置的增删改查操作。

## 功能需求

### 1. 数据库初始化
- **存储路径**：`stratix-data/stratix.db.json`
- **数据结构**：
  ```typescript
  interface StratixDatabase {
    agents: StratixAgentConfig[];
    templates: StratixAgentConfig[];
  }
  ```
- **初始化逻辑**：
  - 自动创建数据目录
  - 初始化空数据库结构
  - 支持异步读写

### 2. Agent CRUD 操作

#### 2.1 创建 Agent
- **方法**：`createAgent(config: StratixAgentConfig): Promise<StratixApiResponse>`
- **功能**：
  - 验证配置完整性
  - 检查 agentId 唯一性
  - 写入数据库
  - 返回标准响应格式
- **返回示例**：
  ```json
  {
    "code": 200,
    "message": "Agent created",
    "data": { /* StratixAgentConfig */ },
    "requestId": "stratix-req-1645521234567"
  }
  ```

#### 2.2 获取 Agent
- **方法**：`getAgent(agentId: string): Promise<StratixAgentConfig | null>`
- **功能**：
  - 根据 agentId 查询配置
  - 未找到返回 null

#### 2.3 列出所有 Agent
- **方法**：`listAgents(): Promise<StratixAgentConfig[]>`
- **功能**：返回所有 Agent 配置列表

#### 2.4 保存 Agent
- **方法**：`saveAgent(config: StratixAgentConfig): Promise<StratixApiResponse>`
- **功能**：
  - 更新已存在的 Agent（根据 agentId）
  - 不存在则创建新 Agent
  - 支持 upsert 语义

#### 2.5 删除 Agent
- **方法**：`deleteAgent(agentId: string): Promise<StratixApiResponse>`
- **功能**：
  - 根据 agentId 删除配置
  - 返回删除结果

### 3. 错误处理
- 数据库读写失败
- 配置验证失败
- 唯一性冲突
- 返回标准错误响应：
  ```json
  {
    "code": 400,
    "message": "Agent already exists",
    "data": null,
    "requestId": "stratix-req-1645521234567"
  }
  ```

## 技术实现

### 文件结构
```
src/stratix-gateway/config-manager/
├── ConfigManager.ts          # 配置管理核心类
└── ConfigValidator.ts        # 配置验证工具（可选）
```

### 核心代码（ConfigManager.ts）
```typescript
import { StratixAgentConfig, StratixApiResponse } from '@/stratix-core/stratix-protocol';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { ensureDirSync } from 'fs-extra';
import path from 'path';

interface StratixDatabase {
  agents: StratixAgentConfig[];
  templates: StratixAgentConfig[];
}

export class ConfigManager {
  private db: Low<StratixDatabase>;
  private dbPath: string = 'stratix-data/stratix.db.json';

  constructor() {
    this.initializeDatabase();
    this.db = new Low<StratixDatabase>(
      new JSONFile<StratixDatabase>(this.dbPath),
      { agents: [], templates: [] }
    );
  }

  private initializeDatabase(): void {
    const dir = path.dirname(this.dbPath);
    ensureDirSync(dir);
  }

  private generateRequestId(): string {
    return `stratix-req-${Date.now()}`;
  }

  public async createAgent(config: StratixAgentConfig): Promise<StratixApiResponse> {
    await this.db.read();
    
    const existing = this.db.data.agents.find(a => a.agentId === config.agentId);
    if (existing) {
      return {
        code: 400,
        message: 'Agent already exists',
        data: null,
        requestId: this.generateRequestId()
      };
    }

    this.db.data.agents.push(config);
    await this.db.write();

    return {
      code: 200,
      message: 'Agent created',
      data: config,
      requestId: this.generateRequestId()
    };
  }

  public async getAgent(agentId: string): Promise<StratixAgentConfig | null> {
    await this.db.read();
    return this.db.data.agents.find(a => a.agentId === agentId) || null;
  }

  public async listAgents(): Promise<StratixAgentConfig[]> {
    await this.db.read();
    return this.db.data.agents;
  }

  public async saveAgent(config: StratixAgentConfig): Promise<StratixApiResponse> {
    await this.db.read();
    
    const index = this.db.data.agents.findIndex(a => a.agentId === config.agentId);
    if (index >= 0) {
      this.db.data.agents[index] = config;
    } else {
      this.db.data.agents.push(config);
    }
    
    await this.db.write();

    return {
      code: 200,
      message: 'Agent saved',
      data: config,
      requestId: this.generateRequestId()
    };
  }

  public async deleteAgent(agentId: string): Promise<StratixApiResponse> {
    await this.db.read();
    
    const index = this.db.data.agents.findIndex(a => a.agentId === agentId);
    if (index < 0) {
      return {
        code: 404,
        message: 'Agent not found',
        data: null,
        requestId: this.generateRequestId()
      };
    }

    this.db.data.agents = this.db.data.agents.filter(a => a.agentId !== agentId);
    await this.db.write();

    return {
      code: 200,
      message: 'Agent deleted',
      data: null,
      requestId: this.generateRequestId()
    };
  }
}
```

## 测试用例

### 1. 创建 Agent 测试
- **输入**：完整的 StratixAgentConfig
- **预期**：返回 code: 200，数据写入数据库

### 2. 创建重复 Agent 测试
- **输入**：已存在的 agentId
- **预期**：返回 code: 400，提示 "Agent already exists"

### 3. 获取 Agent 测试
- **输入**：存在的 agentId
- **预期**：返回完整的 StratixAgentConfig

### 4. 获取不存在 Agent 测试
- **输入**：不存在的 agentId
- **预期**：返回 null

### 5. 保存 Agent 测试
- **输入**：更新的配置
- **预期**：更新数据库中的配置，返回 code: 200

### 6. 删除 Agent 测试
- **输入**：存在的 agentId
- **预期**：从数据库中删除，返回 code: 200

### 7. 删除不存在 Agent 测试
- **输入**：不存在的 agentId
- **预期**：返回 code: 404

## 验收标准
- [ ] 数据库文件正确初始化
- [ ] 所有 CRUD 操作正常工作
- [ ] 错误处理完善
- [ ] 响应格式符合 StratixApiResponse 规范
- [ ] 支持并发读写（lowdb 内置支持）

## 依赖
- `lowdb`：轻量级 JSON 数据库
- `fs-extra`：文件系统工具
- `stratix-protocol.ts`：数据类型定义

## 预估工时
- **开发时间**：1 天
- **测试时间**：0.5 天
- **总计**：1.5 天

## 备注
- 数据库文件路径可配置（通过环境变量）
- 后续可扩展为远程数据库（MongoDB/PostgreSQL）
- 支持数据库备份和恢复功能（可选）

# Feature 002: OpenClaw 连接器（OpenClawConnector）

## 功能概述
实现与 OpenClaw 实例的连接管理，支持本地和远程 OpenClaw 实例调用，提供连接池管理和错误重试机制。

## 功能需求

### 1. 连接池管理
- **连接池结构**：`Map<string, ConnectionInfo>`
- **ConnectionInfo**：
  ```typescript
  interface ConnectionInfo {
    config: StratixOpenClawConfig;
    lastUsed: number;
    status: 'active' | 'inactive' | 'error';
  }
  ```
- **管理功能**：
  - 自动创建连接
  - 连接状态跟踪
  - 连接超时清理（可选）

### 2. 指令执行（execute）

#### 2.1 基础执行
- **方法**：`execute(config: StratixOpenClawConfig, action: any): Promise<any>`
- **功能**：
  - 根据 config.endpoint 和 config.accountId 调用 OpenClaw API
  - 发送 action 数据到 `/api/execute` 端点
  - 返回执行结果

#### 2.2 请求格式
```typescript
POST ${endpoint}/api/execute
{
  "accountId": "account-001",
  "action": {
    "type": "write",
    "params": { /* ... */ }
  }
}
```

#### 2.3 响应处理
- 成功：返回 OpenClaw 执行结果
- 失败：抛出错误，包含详细错误信息

### 3. 状态查询（getStatus）

#### 3.1 查询逻辑
- **方法**：`getStatus(config: StratixOpenClawConfig): Promise<any>`
- **功能**：调用 `/api/status/${accountId}` 获取状态
- **返回**：OpenClaw 实例的当前状态

#### 3.2 请求格式
```typescript
GET ${endpoint}/api/status/${accountId}
```

### 4. 错误处理与重试

#### 4.1 错误类型
- **网络错误**：连接失败、超时
- **OpenClaw 错误**：认证失败、执行错误
- **配置错误**：endpoint 无效、accountId 缺失

#### 4.2 重试机制
- **重试次数**：默认 3 次
- **重试延迟**：指数退避（1s, 2s, 4s）
- **可配置**：通过环境变量或配置参数

#### 4.3 超时处理
- **请求超时**：默认 30 秒
- **连接超时**：默认 5 秒
- **可配置**：通过 axios timeout 配置

### 5. 并发控制
- 支持多个并发请求
- 连接池自动管理
- 避免重复创建连接

## 技术实现

### 文件结构
```
src/stratix-gateway/openclaw-connector/
├── OpenClawConnector.ts      # 连接器核心类
├── ConnectionPool.ts         # 连接池管理（可选）
└── types.ts                  # 类型定义（可选）
```

### 核心代码（OpenClawConnector.ts）
```typescript
import { StratixOpenClawConfig } from '@/stratix-core/stratix-protocol';
import axios, { AxiosInstance, AxiosError } from 'axios';

interface ConnectionInfo {
  config: StratixOpenClawConfig;
  client: AxiosInstance;
  lastUsed: number;
  status: 'active' | 'inactive' | 'error';
}

export class OpenClawConnector {
  private connectionPool: Map<string, ConnectionInfo> = new Map();
  private maxRetries: number = 3;
  private requestTimeout: number = 30000;

  constructor(options?: { maxRetries?: number; timeout?: number }) {
    if (options?.maxRetries) this.maxRetries = options.maxRetries;
    if (options?.timeout) this.requestTimeout = options.timeout;
  }

  private getOrCreateClient(config: StratixOpenClawConfig): AxiosInstance {
    const key = `${config.endpoint}:${config.accountId}`;
    
    if (!this.connectionPool.has(key)) {
      const client = axios.create({
        baseURL: config.endpoint,
        timeout: this.requestTimeout,
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
        }
      });

      this.connectionPool.set(key, {
        config,
        client,
        lastUsed: Date.now(),
        status: 'active'
      });
    }

    const connInfo = this.connectionPool.get(key)!;
    connInfo.lastUsed = Date.now();
    return connInfo.client;
  }

  public async execute(config: StratixOpenClawConfig, action: any): Promise<any> {
    return this.retryOperation(async () => {
      const client = this.getOrCreateClient(config);
      const response = await client.post('/api/execute', {
        accountId: config.accountId,
        action
      });
      return response.data;
    });
  }

  public async getStatus(config: StratixOpenClawConfig): Promise<any> {
    return this.retryOperation(async () => {
      const client = this.getOrCreateClient(config);
      const response = await client.get(`/api/status/${config.accountId}`);
      return response.data;
    });
  }

  private async retryOperation<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public getConnectionStatus(key: string): ConnectionInfo | undefined {
    return this.connectionPool.get(key);
  }

  public clearConnection(key: string): void {
    this.connectionPool.delete(key);
  }
}
```

## 测试用例

### 1. 基础执行测试
- **输入**：有效的 config 和 action
- **预期**：成功调用 OpenClaw API 并返回结果

### 2. 连接池测试
- **输入**：多次调用同一 config
- **预期**：复用相同的 Axios 实例

### 3. 重试机制测试
- **输入**：模拟网络错误（第一次失败，第二次成功）
- **预期**：自动重试并最终成功

### 4. 超时测试
- **输入**：慢速响应的 OpenClaw 实例
- **预期**：在超时时间后抛出错误

### 5. 状态查询测试
- **输入**：有效的 config
- **预期**：返回 OpenClaw 实例状态

### 6. 错误处理测试
- **输入**：无效的 endpoint
- **预期**：抛出详细错误信息

### 7. 并发请求测试
- **输入**：同时发送多个请求
- **预期**：所有请求正确处理，无连接冲突

## 验收标准
- [ ] 连接池正确管理
- [ ] execute 方法正常工作
- [ ] getStatus 方法正常工作
- [ ] 重试机制有效
- [ ] 超时处理正确
- [ ] 并发请求无问题

## 依赖
- `axios`：HTTP 客户端
- `stratix-protocol.ts`：数据类型定义

## 预估工时
- **开发时间**：1.5 天
- **测试时间**：1 天
- **总计**：2.5 天

## 备注
- 支持配置 OpenClaw API Key 认证（可选）
- 后续可扩展支持 gRPC 协议
- 支持连接健康检查（可选）

# Feature 011: 连接池管理（ConnectionPool）

## 元信息
- **优先级**: P1
- **负责人**: stratix-team
- **预计工时**: 1 天
- **创建时间**: 2026-02-22 16:14:08

## 功能描述
管理 OpenClaw 实例的连接池，实现连接复用、自动重连、连接超时处理，提供连接健康检查机制，优化多个 OpenClaw 实例的连接管理效率。

## 功能设计方案

### 1. 核心接口设计

```typescript
// src/stratix-gateway/openclaw-connector/ConnectionPool.ts

export interface ConnectionInfo {
  key: string;
  endpoint: string;
  accountId: string;
  status: 'connected' | 'disconnected' | 'error' | 'reconnecting';
  lastUsed: number;
  createdAt: number;
  errorCount: number;
  lastError?: string;
}

export interface ConnectionPoolOptions {
  maxConnections?: number;          // 最大连接数，默认 100
  idleTimeout?: number;             // 空闲超时时间（毫秒），默认 300000 (5分钟)
  reconnectAttempts?: number;       // 重连尝试次数，默认 3
  reconnectDelay?: number;          // 重连延迟（毫秒），默认 1000
  healthCheckInterval?: number;     // 健康检查间隔（毫秒），默认 60000
  requestTimeout?: number;          // 请求超时时间（毫秒），默认 30000
}

export interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  errorConnections: number;
}
```

### 2. 功能模块

#### 2.1 连接管理
- `getAdapter(config)`: 获取或创建连接，支持连接复用
- `releaseAdapter(key)`: 释放连接（标记为空闲）
- `removeAdapter(key)`: 移除并关闭连接
- `disconnectAll()`: 断开所有连接

#### 2.2 自动重连
- 连接断开时自动尝试重连
- 重连策略：指数退避（1s, 2s, 4s...）
- 重连次数限制，超过则标记为 error 状态

#### 2.3 连接超时处理
- 空闲连接超时自动断开
- 请求超时处理
- 连接建立超时处理

#### 2.4 健康检查
- 定期检查连接状态
- 自动清理无效连接
- 提供连接状态查询接口

#### 2.5 连接池监控
- 连接池统计信息
- 连接状态列表
- 连接使用情况追踪

### 3. 类结构

```typescript
export class ConnectionPool {
  private adapters: Map<string, OpenClawAdapterInterface>;
  private connectionInfo: Map<string, ConnectionInfo>;
  private options: ConnectionPoolOptions;
  private healthCheckTimer?: NodeJS.Timeout;

  constructor(options?: ConnectionPoolOptions);

  // 连接管理
  async getAdapter(config: StratixOpenClawConfig): Promise<OpenClawAdapterInterface>;
  async releaseAdapter(key: string): Promise<void>;
  async removeAdapter(key: string): Promise<void>;
  async disconnectAll(): Promise<void>;

  // 状态查询
  getConnectionInfo(key: string): ConnectionInfo | null;
  getAllConnectionInfo(): ConnectionInfo[];
  getPoolStats(): PoolStats;

  // 健康检查
  startHealthCheck(): void;
  stopHealthCheck(): void;
  private performHealthCheck(): Promise<void>;

  // 内部方法
  private createAdapter(config: StratixOpenClawConfig): OpenClawAdapterInterface;
  private generateKey(config: StratixOpenClawConfig): string;
  private handleConnectionError(key: string, error: Error): void;
  private attemptReconnect(key: string): Promise<boolean>;
  private cleanupIdleConnections(): Promise<void>;
}
```

### 4. 与 OpenClawConnector 集成
- OpenClawConnector 内部使用 ConnectionPool 管理连接
- 所有 OpenClaw 请求通过连接池获取连接

```typescript
// OpenClawConnector 使用示例
export class OpenClawConnector {
  private connectionPool: ConnectionPool;

  constructor() {
    this.connectionPool = new ConnectionPool({
      maxConnections: 100,
      idleTimeout: 300000,
      reconnectAttempts: 3
    });
  }

  async execute(config: StratixOpenClawConfig, action: any): Promise<any> {
    const adapter = await this.connectionPool.getAdapter(config);
    // 执行操作...
  }
}
```

## 开发步骤
- [ ] 步骤 1：创建 ConnectionPool 类基础结构，定义接口类型
- [ ] 步骤 2：实现连接获取和复用逻辑
- [ ] 步骤 3：实现连接创建（区分本地/远程）
- [ ] 步骤 4：实现自动重连机制
- [ ] 步骤 5：实现空闲连接清理和超时处理
- [ ] 步骤 6：实现健康检查机制
- [ ] 步骤 7：实现连接池监控接口
- [ ] 步骤 8：集成到 OpenClawConnector
- [ ] 步骤 9：编写单元测试

## 测试用例
| 用例编号 | 场景 | 操作步骤 | 预期结果 |
|----------|------|----------|----------|
| TC-001 | 获取新连接 | 首次调用 getAdapter | 创建新连接并返回 |
| TC-002 | 连接复用 | 对相同配置再次调用 getAdapter | 返回已有连接，不创建新连接 |
| TC-003 | 连接释放 | 调用 releaseAdapter | 连接状态变为 idle |
| TC-004 | 空闲超时清理 | 等待空闲超时后检查 | 空闲连接被自动断开 |
| TC-005 | 自动重连 | 模拟连接断开 | 自动尝试重连 |
| TC-006 | 重连失败 | 超过重连次数限制 | 连接状态变为 error |
| TC-007 | 健康检查 | 启动健康检查 | 定期执行健康检查 |
| TC-008 | 断开所有连接 | 调用 disconnectAll | 所有连接被断开 |
| TC-009 | 连接池统计 | 调用 getPoolStats | 返回正确的统计信息 |
| TC-010 | 最大连接数限制 | 创建超过最大连接数的连接 | 拒绝新连接或回收旧连接 |

## 验收标准
- [ ] 连接复用功能正常
- [ ] 自动重连机制正常
- [ ] 空闲连接自动清理
- [ ] 健康检查正常工作
- [ ] 连接池统计信息准确
- [ ] 与 OpenClawConnector 集成正常
- [ ] 单元测试覆盖率 > 80%

## 变更记录
| 日期 | 变更内容 | 变更人 |
|------|----------|--------|
| 2026-02-22 | 初始创建 | - |

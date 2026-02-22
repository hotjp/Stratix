# Feature 011: OpenClaw 适配器类型定义

## Feature Overview
定义 OpenClaw 适配器所需的所有 TypeScript 类型接口，为本地和远程适配器提供统一的类型约束。

## Module
stratix-openclaw-adapter

## Priority
P0 (最高)

## Dependencies
- stratix-core (stratix-protocol.ts)

## Implementation Details

### File: src/stratix-openclaw-adapter/types.ts
定义所有 OpenClaw 适配器相关的 TypeScript 接口和类型：
- OpenClawAdapterInterface - 适配器统一接口
- OpenClawAction - OpenClaw 操作定义
- OpenClawResponse - OpenClaw 响应格式
- OpenClawStatus - OpenClaw 状态信息
- OpenClawEvent - OpenClaw 事件定义
- OpenClawConnectionConfig - 连接配置

## Key Types

### OpenClawAdapterInterface
适配器统一接口，所有适配器必须实现：
```typescript
interface OpenClawAdapterInterface {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  execute(action: OpenClawAction): Promise<OpenClawResponse>;
  getStatus(): Promise<OpenClawStatus>;
  subscribe(callback: (event: OpenClawEvent) => void): void;
}
```

### OpenClawAction
OpenClaw 操作定义：
```typescript
interface OpenClawAction {
  action: string;
  params: Record<string, any>;
}
```

### OpenClawResponse
OpenClaw 响应格式：
```typescript
interface OpenClawResponse {
  success: boolean;
  data?: any;
  error?: string;
}
```

### OpenClawStatus
OpenClaw 状态信息：
```typescript
interface OpenClawStatus {
  connected: boolean;
  accountId: string;
  lastActive: number;
}
```

### OpenClawEvent
OpenClaw 事件定义：
```typescript
interface OpenClawEvent {
  type: string;
  data: any;
}
```

### OpenClawConnectionConfig
连接配置（基于 StratixOpenClawConfig）：
```typescript
interface OpenClawConnectionConfig {
  accountId: string;
  endpoint: string;
  apiKey?: string;
  timeout?: number;
  retryAttempts?: number;
}
```

## Design Principles
1. 所有接口必须类型安全
2. 支持本地和远程适配器的统一抽象
3. 易于扩展新的适配器类型
4. 与 stratix-protocol.ts 保持一致

## Acceptance Criteria
- [ ] 所有接口定义完整且类型安全
- [ ] TypeScript 编译无错误
- [ ] 符合 init.md 中的接口规范
- [ ] 包含完整的 JSDoc 注释
- [ ] 导出所有类型供其他模块使用

## Estimated Time
0.5 天

## Notes
- 此 Feature 是所有其他 Feature 的基础，必须最先完成
- 需要与 stratix-protocol.ts 保持兼容
- 建议使用 JSDoc 为每个接口添加详细注释

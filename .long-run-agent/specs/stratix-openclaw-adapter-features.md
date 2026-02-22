# Stratix OpenClaw Adapter OpenClaw 接入层 - Feature 拆分文档

## 模块概述
Stratix OpenClaw Adapter 是星策系统的 OpenClaw 接入层，负责适配本地和远程 OpenClaw 实例，屏蔽连接差异，为上层提供统一的调用接口。该模块不处理业务逻辑，仅负责 OpenClaw 连接和调用。

## Feature 清单

### Feature 11: 类型定义 (types.ts)
**优先级**: P0 (最高)  
**预估时间**: 0.5 天  
**状态**: 待开发

#### 功能描述
定义 OpenClaw 适配器所需的所有 TypeScript 类型：
- OpenClawAdapterInterface - 适配器统一接口
- OpenClawAction - OpenClaw 操作定义
- OpenClawResponse - OpenClaw 响应格式
- OpenClawStatus - OpenClaw 状态信息
- OpenClawEvent - OpenClaw 事件定义
- OpenClawConnectionConfig - 连接配置

#### 依赖
- stratix-core (stratix-protocol.ts)

#### 交付物
- `src/stratix-openclaw-adapter/types.ts` - 完整的类型定义文件

#### 验收标准
1. 所有接口定义完整且类型安全
2. TypeScript 编译无错误
3. 符合 init.md 中的接口规范
4. 包含完整的 JSDoc 注释

---

### Feature 12: 本地 OpenClaw 适配器 (LocalOpenClawAdapter.ts)
**优先级**: P0 (最高)  
**预估时间**: 2 天  
**状态**: 待开发

#### 功能描述
实现本地 OpenClaw 实例的适配器：
- WebSocket 连接管理
- HTTP API 调用封装
- 事件订阅机制
- 连接状态管理
- 错误处理和重连机制

#### 依赖
- stratix-core (stratix-protocol.ts)
- types.ts (Feature 11)
- axios
- ws

#### 交付物
- `src/stratix-openclaw-adapter/LocalOpenClawAdapter.ts` - 本地适配器实现

#### 验收标准
1. 实现 OpenClawAdapterInterface 所有方法
2. WebSocket 连接稳定可靠
3. HTTP 调用正确封装
4. 事件订阅正常工作
5. 错误处理完善
6. 包含完整的 JSDoc 注释

---

### Feature 13: 远程 OpenClaw 适配器 (RemoteOpenClawAdapter.ts)
**优先级**: P0 (最高)  
**预估时间**: 1.5 天  
**状态**: 待开发

#### 功能描述
实现远程 OpenClaw 服务的适配器：
- HTTP API 调用封装
- API Key 认证处理
- 连接验证机制
- 事件订阅（轮询或 SSE，MVP 可简化）
- 错误处理

#### 依赖
- stratix-core (stratix-protocol.ts)
- types.ts (Feature 11)
- axios

#### 交付物
- `src/stratix-openclaw-adapter/RemoteOpenClawAdapter.ts` - 远程适配器实现

#### 验收标准
1. 实现 OpenClawAdapterInterface 所有方法
2. API Key 认证正确处理
3. HTTP 调用正确封装
4. 错误处理完善
5. 包含完整的 JSDoc 注释

---

### Feature 14: 连接池管理 (ConnectionPool.ts)
**优先级**: P1 (高)  
**预估时间**: 1.5 天  
**状态**: 待开发

#### 功能描述
实现多 OpenClaw 实例的连接池管理：
- 适配器缓存和复用
- 自动选择适配器类型（本地/远程）
- 批量断开连接
- 连接健康检查
- 自动重连机制

#### 依赖
- stratix-core (stratix-protocol.ts)
- types.ts (Feature 11)
- LocalOpenClawAdapter.ts (Feature 12)
- RemoteOpenClawAdapter.ts (Feature 13)

#### 交付物
- `src/stratix-openclaw-adapter/ConnectionPool.ts` - 连接池实现

#### 验收标准
1. 正确管理多个适配器实例
2. 自动区分本地/远程并选择对应适配器
3. 连接复用正常工作
4. 断开连接功能正常
5. 包含完整的 JSDoc 注释

---

### Feature 15: 模块导出与工厂函数 (index.ts)
**优先级**: P1 (高)  
**预估时间**: 0.5 天  
**状态**: 待开发

#### 功能描述
创建模块统一导出文件和适配器工厂函数：
- 导出所有类型定义
- 导出所有适配器类
- 导出连接池类
- 提供 createOpenClawAdapter 工厂函数

#### 依赖
- types.ts (Feature 11)
- LocalOpenClawAdapter.ts (Feature 12)
- RemoteOpenClawAdapter.ts (Feature 13)
- ConnectionPool.ts (Feature 14)

#### 交付物
- `src/stratix-openclaw-adapter/index.ts` - 统一导出文件

#### 验收标准
1. 所有类型和类正确导出
2. 工厂函数正常工作
3. 模块可以正确导入使用
4. 包含完整的 JSDoc 注释

---

## 开发顺序
1. **Feature 11** (类型定义) - 必须最先完成，是其他 feature 的基础
2. **Feature 12** (本地适配器) - 依赖 Feature 11，可与 Feature 13 并行开发
3. **Feature 13** (远程适配器) - 依赖 Feature 11，可与 Feature 12 并行开发
4. **Feature 14** (连接池管理) - 依赖 Feature 12 和 Feature 13
5. **Feature 15** (模块导出) - 最后完成

## 依赖关系
```
Feature 11 (类型定义)
    ├── Feature 12 (本地适配器)
    └── Feature 13 (远程适配器)
            └── Feature 14 (连接池管理)
                    └── Feature 15 (模块导出)
```

## 总预估时间
**6 天**

## 技术栈
- TypeScript (主要语言)
- axios (HTTP 客户端)
- ws (WebSocket 客户端)
- Node.js / npm (包管理)

## 核心接口规范

### OpenClawAdapterInterface
所有适配器必须实现以下接口：
```typescript
interface OpenClawAdapterInterface {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  execute(action: OpenClawAction): Promise<OpenClawResponse>;
  getStatus(): Promise<OpenClawStatus>;
  subscribe(callback: (event: OpenClawEvent) => void): void;
}
```

## 注意事项
1. 本地适配器优先使用 WebSocket 实现状态订阅
2. 远程适配器需要处理认证（API Key）
3. 连接池需要实现自动重连机制
4. 错误处理需要区分网络错误和业务错误
5. MVP 版本可简化远程适配器的订阅功能
6. 不处理业务逻辑
7. 仅负责 OpenClaw 连接和调用
8. 不修改 OpenClaw 返回的数据格式
9. 所有 ID 必须以 `stratix-` 为前缀

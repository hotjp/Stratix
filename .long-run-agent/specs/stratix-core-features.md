# Stratix Core 核心协议层 - Feature 拆分文档

## 模块概述
Stratix Core 是整个星策系统的基础设施层，提供统一数据协议定义和事件总线，是所有模块的依赖基础。

## Feature 清单

### Feature 1: 统一数据协议定义 (stratix-protocol.ts)
**优先级**: P0 (最高)  
**预估时间**: 2 天  
**状态**: 待开发

#### 功能描述
定义 Stratix 系统所有标准化数据结构，包括：
- StratixApiResponse - 统一 API 响应格式
- StratixAgentConfig - Agent 配置（核心数据结构）
- StratixSoulConfig - Soul 配置（身份、目标、性格）
- StratixMemoryConfig - 记忆配置
- StratixSkillConfig - 技能配置
- StratixSkillParameter - 技能参数
- StratixModelConfig - 模型配置
- StratixOpenClawConfig - OpenClaw 对接配置
- StratixCommandData - 指令数据
- StratixFrontendOperationEvent - 前端操作事件
- StratixStateSyncEvent - 状态同步事件
- StratixCreateAgentRequest - 创建 Agent 请求

#### 交付物
- `src/stratix-core/stratix-protocol.ts` - 完整的数据协议定义文件

#### 验收标准
1. 所有接口定义完整且类型安全
2. TypeScript 编译无错误
3. 符合 init.md 中的协议规范
4. 包含完整的 JSDoc 注释

---

### Feature 2: 事件总线实现 (StratixEventBus.ts)
**优先级**: P0 (最高)  
**预估时间**: 1 天  
**状态**: 待开发

#### 功能描述
实现模块间通信的事件发布/订阅机制，基于 mitt 库：
- 单例模式的 StratixEventBus 类
- emit 方法 - 发布事件
- subscribe 方法 - 订阅事件
- unsubscribe 方法 - 取消订阅

#### 依赖
- mitt (npm 包)

#### 交付物
- `src/stratix-core/StratixEventBus.ts` - 事件总线实现文件

#### 验收标准
1. 正确实现单例模式
2. 支持所有定义的事件类型
3. 类型安全的事件发布和订阅
4. 包含完整的 JSDoc 注释

---

### Feature 3: 全局类型声明 (types/index.d.ts)
**优先级**: P1 (高)  
**预估时间**: 0.5 天  
**状态**: 待开发

#### 功能描述
提供全局 TypeScript 类型声明，扩展项目所需的类型定义。

#### 交付物
- `src/stratix-core/types/index.d.ts` - 全局类型声明文件

#### 验收标准
1. 正确导出所有需要的类型
2. 支持 TypeScript 全局类型扩展
3. 编译无错误

---

### Feature 4: 模块导出与文档
**优先级**: P1 (高)  
**预估时间**: 0.5 天  
**状态**: 待开发

#### 功能描述
- 创建模块统一导出文件 (index.ts)
- 编写模块使用文档 (README.md)
- 添加使用示例

#### 交付物
- `src/stratix-core/index.ts` - 统一导出文件
- `src/stratix-core/README.md` - 模块使用文档

#### 验收标准
1. 模块可以正确导入使用
2. 文档清晰完整，包含使用示例
3. 符合项目整体规范

---

## 开发顺序
1. **Feature 1** (统一数据协议定义) - 必须最先完成，是其他 feature 的基础
2. **Feature 2** (事件总线实现) - 依赖 Feature 1
3. **Feature 3** (全局类型声明) - 可与 Feature 2 并行
4. **Feature 4** (模块导出与文档) - 最后完成

## 依赖关系
```
Feature 1 (数据协议)
    ├── Feature 2 (事件总线)
    └── Feature 3 (类型声明)
            └── Feature 4 (导出文档)
```

## 总预估时间
**4 天**

## 技术栈
- TypeScript (主要语言)
- mitt (事件发射器，需安装)
- Node.js / npm (包管理)

## 注意事项
1. 此模块必须最先开发，供其他模块依赖
2. 所有事件类型必须以 `stratix:` 为前缀
3. 所有 ID 必须以 `stratix-` 为前缀
4. 类型定义变更需要通知所有依赖模块
5. 不包含任何业务逻辑
6. 仅提供数据结构和通信机制

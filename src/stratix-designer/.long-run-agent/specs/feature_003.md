# Feature feature_003 - StratixHeroDesigner 核心类

## 元信息
- **优先级**: P0（核心逻辑）
- **负责人**: AI Agent
- **预计工时**: 1 天
- **创建时间**: 2026-02-22 15:46:26

## 功能描述
英雄设计器核心类，负责 Agent 的创建、编辑、导入导出和配置管理，与事件总线集成实现模块间通信。

## 功能设计方案

### 核心方法
- `createNewHero(heroType)`: 基于模板创建新英雄
- `saveHeroConfig(config)`: 保存配置并发射事件
- `loadHeroConfig(agentId)`: 加载已有配置
- `deleteHeroConfig(agentId)`: 删除配置
- `importHeroConfig(json)`: 导入 JSON 配置
- `exportHeroConfig(agentId?)`: 导出为 JSON
- `downloadHeroConfig(agentId?)`: 浏览器下载文件
- `getPresetTemplates()`: 获取预设模板列表
- `getCurrentConfig()`: 获取当前配置

### 依赖
- stratix-core/stratix-protocol.ts
- stratix-core/StratixEventBus
- ./utils/ConfigValidator
- ./utils/ConfigConverter
- ./templates/*

### 事件发射
- `stratix:config_updated`: 配置保存/更新时
- `stratix:config_deleted`: 配置删除时

### 文件结构
```
StratixHeroDesigner.ts
index.ts (模块导出)
```

## 开发步骤
- [x] 步骤 1：创建 StratixHeroDesigner 类框架
- [x] 步骤 2：实现模板相关方法
- [x] 步骤 3：实现配置 CRUD 方法
- [x] 步骤 4：实现导入导出方法
- [x] 步骤 5：集成事件总线
- [x] 步骤 6：创建模块统一导出

## 测试用例
| 用例编号 | 场景 | 操作步骤 | 预期结果 |
|----------|------|----------|----------|
| TC-001 | 创建文案英雄 | createNewHero('writer') | 返回 writer 类型配置 |
| TC-002 | 保存配置 | saveHeroConfig(validConfig) | code: 200 |
| TC-003 | 保存无效配置 | saveHeroConfig(invalidConfig) | code: 400 |
| TC-004 | 导入配置 | importHeroConfig(jsonString) | 正确解析 |
| TC-005 | 导出配置 | exportHeroConfig() | 返回 JSON 字符串 |
| TC-006 | 事件发射 | saveHeroConfig() 后 | 收到 config_updated 事件 |

## 验收标准
- [x] 标准 1：所有方法正确实现
- [x] 标准 2：配置校验集成
- [x] 标准 3：事件总线集成
- [x] 标准 4：TypeScript 类型检查通过

## 变更记录
| 日期 | 变更内容 | 变更人 |
|------|----------|--------|
| 2026-02-22 | 初始创建 | AI |
| 2026-02-22 | 开发完成 | AI |

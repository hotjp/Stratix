# Feature feature_001 - 核心数据存储

## 元信息
- **优先级**: P0（核心功能）
- **负责人**: stratix-team
- **预计工时**: 2天
- **创建时间**: 2026-02-22 15:45:09
- **状态**: ✅ 已完成

## 功能描述
使用 lowdb 实现轻量级本地 JSON 数据存储，提供 Agent 配置、模板和日志的 CRUD 操作，是 stratix-data-store 模块的核心基础设施。

## 功能设计方案

### 数据库 Schema
```typescript
interface StratixDatabase {
  version: string;
  agents: StratixAgentConfig[];
  templates: { preset: StratixAgentConfig[]; custom: StratixAgentConfig[] };
  logs: StratixCommandLog[];
  metadata: { createdAt: number; updatedAt: number };
}
```

### 核心接口
| 方法 | 功能 |
|------|------|
| `initialize()` | 初始化数据库，创建默认结构 |
| `saveAgent(config)` | 保存/更新 Agent 配置 |
| `getAgent(agentId)` | 获取单个 Agent |
| `listAgents()` | 列出所有 Agent |
| `deleteAgent(agentId)` | 删除 Agent |
| `saveCustomTemplate(config)` | 保存自定义模板 |
| `listTemplates()` | 列出所有模板 |
| `deleteCustomTemplate(agentId)` | 删除自定义模板 |
| `addLog(log)` | 添加日志 |
| `updateLog(logId, updates)` | 更新日志 |
| `getLogs(options)` | 查询日志 |
| `exportData()` | 导出数据 |
| `importData(jsonData)` | 导入数据 |

## 开发步骤
- [x] 步骤 1：创建 types.ts 类型定义
- [x] 步骤 2：实现 StratixDataStore 核心类
- [x] 步骤 3：实现 Agent CRUD
- [x] 步骤 4：实现 Template CRUD
- [x] 步骤 5：实现 Log CRUD
- [x] 步骤 6：实现数据导出/导入

## 测试用例
| 用例编号 | 场景 | 操作步骤 | 预期结果 |
|----------|------|----------|----------|
| TC-001 | 初始化数据库 | 调用 initialize() | 创建 stratix.db.json |
| TC-002 | 保存 Agent | saveAgent(config) | 成功写入 |
| TC-003 | 重复保存 | 保存相同 agentId | 更新而非新增 |
| TC-004 | 查询 Agent | getAgent(agentId) | 返回正确数据 |
| TC-005 | 删除 Agent | deleteAgent(agentId) | 成功删除 |
| TC-006 | 日志限制 | 添加 101 条日志 | 仅保留 100 条 |

## 验收标准
- [x] 数据库文件创建于 stratix-data/stratix.db.json
- [x] 所有 CRUD 操作正确执行
- [x] metadata.updatedAt 每次写入自动更新
- [x] 日志自动清理超过 100 条的旧记录
- [x] TypeScript 类型检查通过

## 变更记录
| 日期 | 变更内容 | 变更人 |
|------|----------|--------|
| 2026-02-22 | 初始创建 | - |
| 2026-02-22 | 完成实现 | AI |

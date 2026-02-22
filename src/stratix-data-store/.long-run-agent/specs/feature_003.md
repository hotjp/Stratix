# Feature feature_003 - 日志存储

## 元信息
- **优先级**: P1（重要功能）
- **负责人**: stratix-team
- **预计工时**: 1天
- **创建时间**: 2026-02-22 15:45:09
- **状态**: ✅ 已完成

## 功能描述
提供指令执行日志的创建、更新和查询功能，支持按 Agent 和状态过滤。

## 功能设计方案

### 日志结构
```typescript
interface StratixCommandLog {
  logId: string;
  commandId: string;
  agentId: string;
  skillId: string;
  skillName: string;
  params: Record<string, any>;
  status: 'pending' | 'running' | 'success' | 'failed';
  result?: string;
  error?: string;
  startTime: number;
  endTime?: number;
}
```

### 状态流转
```
pending -> running -> success/failed
```

### 核心接口
| 方法 | 功能 |
|------|------|
| `createLog(commandId, agentId, ...)` | 创建日志 |
| `updateStatus(logId, status, ...)` | 更新状态 |
| `markRunning(logId)` | 标记为运行中 |
| `markSuccess(logId, result)` | 标记为成功 |
| `markFailed(logId, error)` | 标记为失败 |
| `getLog(logId)` | 获取单条日志 |
| `getRecentLogs(agentId, limit)` | 获取最近日志 |
| `getLogs(options)` | 条件查询日志 |
| `getLogsByStatus(status)` | 按状态查询 |
| `clearAllLogs()` | 清空所有日志 |
| `getDuration(logId)` | 获取执行时长 |

## 开发步骤
- [x] 步骤 1：创建 LogStore 类
- [x] 步骤 2：实现日志创建和状态更新
- [x] 步骤 3：实现日志查询功能
- [x] 步骤 4：实现执行时长计算

## 测试用例
| 用例编号 | 场景 | 操作步骤 | 预期结果 |
|----------|------|----------|----------|
| TC-001 | 创建日志 | createLog(...) | 返回带 logId 的日志 |
| TC-002 | 状态更新 | markSuccess(logId) | 状态变为 success |
| TC-003 | 按Agent查询 | getRecentLogs(agentId) | 返回该 Agent 的日志 |
| TC-004 | 计算时长 | getDuration(logId) | 返回毫秒数 |

## 验收标准
- [x] 日志 ID 格式为 stratix-log-{timestamp}-{random}
- [x] 状态正确流转
- [x] 支持按 agentId 过滤
- [x] 结束时间自动记录
- [x] TypeScript 类型检查通过

## 变更记录
| 日期 | 变更内容 | 变更人 |
|------|----------|--------|
| 2026-02-22 | 初始创建 | - |
| 2026-02-22 | 完成实现 | AI |

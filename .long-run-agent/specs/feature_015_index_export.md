# Feature 015: 模块导出与工厂函数

## Feature Overview
创建模块统一导出文件和适配器工厂函数。

## Module
stratix-openclaw-adapter

## Priority
P1 (高)

## Dependencies
- types.ts (Feature 011)
- LocalOpenClawAdapter.ts (Feature 012)
- RemoteOpenClawAdapter.ts (Feature 013)
- ConnectionPool.ts (Feature 014)

## Implementation Details

### File: src/stratix-openclaw-adapter/index.ts
- 导出所有类型定义
- 导出所有适配器类
- 提供 createOpenClawAdapter 工厂函数

## Acceptance Criteria
- [x] 所有类型和类正确导出
- [x] 工厂函数正常工作
- [x] 模块可以正确导入使用

## Status
✅ 已完成

## Estimated Time
0.5 天

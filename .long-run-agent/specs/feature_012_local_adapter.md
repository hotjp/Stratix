# Feature 012: 本地 OpenClaw 适配器

## Feature Overview
实现本地 OpenClaw 实例的适配器，支持 WebSocket 和 HTTP API。

## Module
stratix-openclaw-adapter

## Priority
P0 (最高)

## Dependencies
- types.ts (Feature 011)
- axios
- ws

## Implementation Details

### File: src/stratix-openclaw-adapter/LocalOpenClawAdapter.ts
- WebSocket 连接管理
- HTTP API 调用封装
- 事件订阅机制
- 错误处理

## Acceptance Criteria
- [x] 实现 OpenClawAdapterInterface 所有方法
- [x] WebSocket 连接稳定可靠
- [x] HTTP 调用正确封装
- [x] 事件订阅正常工作
- [x] 错误处理完善

## Status
✅ 已完成

## Estimated Time
2 天

# Feature 013: 远程 OpenClaw 适配器

## Feature Overview
实现远程 OpenClaw 服务的适配器，支持 HTTP API 和 API Key 认证。

## Module
stratix-openclaw-adapter

## Priority
P0 (最高)

## Dependencies
- types.ts (Feature 011)
- axios

## Implementation Details

### File: src/stratix-openclaw-adapter/RemoteOpenClawAdapter.ts
- HTTP API 调用封装
- API Key 认证处理
- 连接验证机制
- 错误处理

## Acceptance Criteria
- [x] 实现 OpenClawAdapterInterface 所有方法
- [x] API Key 认证正确处理
- [x] HTTP 调用正确封装
- [x] 错误处理完善

## Status
✅ 已完成

## Estimated Time
1.5 天

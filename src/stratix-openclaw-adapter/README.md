# Stratix OpenClaw Adapter

连接 Stratix 到 OpenClaw 的适配器模块。

## 特性

- **HTTP Tools Invoke API** - 调用 OpenClaw 的所有工具
- **OpenAI 兼容 API** - Chat Completions 端点（需启用）
- **本地/远程适配** - 自动选择合适的适配器

## 快速开始

```typescript
import { createOpenClawAdapter } from '@/stratix-openclaw-adapter';

const adapter = createOpenClawAdapter({
  accountId: 'my-account',
  endpoint: 'http://127.0.0.1:18789',
  apiKey: 'your-token',
});

// 连接
await adapter.connect();

// 调用工具
const sessions = await adapter.invokeTool('sessions_list');
const agents = await adapter.invokeTool('agents_list');

// 发送消息（需要启用 chatCompletions）
const response = await adapter.sendMessage('Hello!');
```

## OpenClaw 配置

### 1. 设置认证 Token

在 `~/.openclaw/openclaw.json` 中：

```json
{
  "gateway": {
    "auth": {
      "mode": "token",
      "token": "your-secure-token"
    }
  }
}
```

### 2. 启用 Chat Completions（可选）

```json
{
  "gateway": {
    "http": {
      "endpoints": {
        "chatCompletions": { "enabled": true }
      }
    }
  }
}
```

重启 OpenClaw: `openclaw gateway restart`

## API 参考

### LocalOpenClawAdapter

| 方法 | 说明 |
|------|------|
| `connect()` | 连接到 Gateway |
| `disconnect()` | 断开连接 |
| `getStatus()` | 获取连接状态 |
| `invokeTool(tool, args?)` | 调用工具 |
| `sendMessage(message, options?)` | 发送聊天消息 |
| `openaiChatCompletion(request)` | OpenAI 兼容 API |
| `streamChatCompletion(request, onChunk)` | 流式聊天 |
| `listSessions()` | 列出会话 |
| `listAgents()` | 列出代理 |
| `listModels()` | 列出模型 |

### 可用工具

通过 `invokeTool` 可以调用：

- `sessions_list` - 列出会话
- `agents_list` - 列出代理
- `models_list` - 列出模型
- `health` - 健康检查
- 更多工具参考 OpenClaw 文档

## 测试

```bash
# 本地测试
OPENCLAW_API_KEY=your-token npx tsx src/stratix-openclaw-adapter/test-connection.ts

# 远程测试
OPENCLAW_REMOTE_ENDPOINT=https://your-server.com \
OPENCLAW_REMOTE_API_KEY=your-token \
npx tsx src/stratix-openclaw-adapter/test-connection.ts
```

## 端口说明

| 端口 | 用途 |
|------|------|
| 18789 | Gateway HTTP/WebSocket API |
| 18792 | 浏览器控制 WebSocket (CDP) |

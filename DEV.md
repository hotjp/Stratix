# Stratix 开发指南

## 开发命令

### 浏览器端开发（主要）

```bash
# 启动前端开发服务器
npm run dev:frontend

# 启动后端 API
npm run dev:backend

# 同时启动前后端
npm run dev

# 运行测试
npm test
npm run test:ui
```

### Electron 桌面端（远程连接功能）

```bash
# 开发模式启动 Electron
npm run electron:dev

# 打包 Electron 应用
npm run electron:build
```

### Tailscale 远程连接

```bash
# 测试嵌入式 Tailscale
npm run tailscale:test

# 交互式登录
npm run tailscale:login

# 使用 Auth Key 登录
STRATIX_TAILSCALE_AUTH_KEY=tskey-auth-xxxxx npm run tailscale:test
```

## 构建产物

| 目录 | 说明 |
|------|------|
| `dist/` | 后端 + 前端构建产物 |
| `dist/electron/` | Electron 主进程代码 |
| `release/` | Electron 打包输出 |
| `bin/` | Tailscale 二进制文件 |

## 配置文件

| 文件 | 说明 |
|------|------|
| `tsconfig.json` | 主 TypeScript 配置 |
| `tsconfig.electron.json` | Electron 专用配置 |
| `electron.config.json` | Electron 打包配置 |
| `vite.config.ts` | 前端构建配置 |

## 架构说明

```
浏览器端 (Vite + Vue + Phaser)
    ↓ HTTP/WebSocket
后端 Gateway (Express)
    ↓ HTTP API
OpenClaw 适配器
    ↓ HTTP/WS
┌───────────────────────────────────┐
│ 本地 OpenClaw (127.0.0.1:18789)   │
│ 远程 OpenClaw (via Tailscale)     │
└───────────────────────────────────┘

Electron 模式：
- 额外提供嵌入式 Tailscale 集成
- 自动发现 tailnet 内的 OpenClaw 节点
- 支持 P2P 加密连接
```

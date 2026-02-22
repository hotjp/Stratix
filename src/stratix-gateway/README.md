# Stratix Gateway - 星策网关

## 模块概述

星策网关是 Stratix 星策系统的核心枢纽，负责前端指令转换、配置管理、OpenClaw 连接和状态同步。

## 核心功能

### 1. 配置管理器
- Agent 配置的增删改查
- 使用 lowdb 进行本地 JSON 存储
- 集成 StratixConfigValidator 进行配置验证

### 2. OpenClaw 连接器
- 管理与 OpenClaw 实例的连接
- 连接池管理
- 错误重试机制（3次重试，指数退避）

### 3. 指令转换器
- 将游戏化指令转换为 OpenClaw 调用
- 模板变量替换（`{{paramName}}` 格式）
- 参数验证

### 4. 状态同步服务
- WebSocket 实时推送
- Agent 状态更新
- 指令状态更新

### 5. HTTP API 路由
- Agent 配置 API
- 指令执行 API
- 模板管理 API

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
cp src/stratix-gateway/.env.example src/stratix-gateway/.env
# 编辑 .env 文件配置你的参数
```

### 3. 启动服务
```bash
# 开发模式
npx ts-node src/stratix-gateway/index.ts

# 或编译后运行
npm run build
node dist/stratix-gateway/index.js
```

### 4. 测试健康检查
```bash
curl http://localhost:3000/health
```

## API 端点

### Agent 配置 API
- `POST /api/stratix/config/agent/create` - 创建 Agent
- `PUT /api/stratix/config/agent/save` - 保存 Agent
- `GET /api/stratix/config/agent/get?agentId=xxx` - 获取 Agent
- `DELETE /api/stratix/config/agent/delete?agentId=xxx` - 删除 Agent
- `GET /api/stratix/config/agent/list` - 列出所有 Agent

### 指令执行 API
- `POST /api/stratix/command/execute` - 执行指令
- `POST /api/stratix/command/cancel` - 取消指令
- `GET /api/stratix/command/status?commandId=xxx` - 查询指令状态

### 模板管理 API
- `GET /api/stratix/config/template/list` - 获取模板列表
- `POST /api/stratix/config/template/import` - 导入模板
- `POST /api/stratix/config/template/export` - 导出模板

## WebSocket 事件

### 连接
```javascript
const ws = new WebSocket('ws://localhost:3001');
```

### 事件类型
- `stratix:agent_status_update` - Agent 状态更新
- `stratix:command_status_update` - 指令状态更新

## 开发进度

### ✅ 已完成
- [x] Feature 001: 配置管理器
- [x] Feature 002: OpenClaw 连接器
- [x] Feature 003: 指令转换器
- [x] Feature 004: Agent 配置 API 路由
- [x] Feature 005: 指令执行 API 路由
- [x] Feature 006: 模板管理 API 路由
- [x] Feature 007: 状态同步服务
- [x] Feature 008: 网关服务启动与集成

## 目录结构

```
src/stratix-gateway/
├── index.ts                    # 网关入口
├── .env.example                # 环境配置示例
├── config-manager/             # 配置管理中间件
│   ├── ConfigManager.ts
│   └── index.ts
├── command-transformer/        # 指令转换中间件
│   ├── CommandTransformer.ts
│   └── index.ts
├── openclaw-connector/         # OpenClaw 连接中间件
│   ├── OpenClawConnector.ts
│   └── index.ts
├── api/
│   ├── routes/                 # HTTP API 路由
│   │   ├── agent.ts
│   │   ├── command.ts
│   │   └── template.ts
│   └── websocket/              # WebSocket 服务
│       └── StatusSync.ts
└── .long-run-agent/            # LRA 工具配置
    ├── config.json
    ├── feature_list.json
    ├── operation_log.json
    ├── records/
    └── specs/
        ├── feature_001.md
        ├── feature_002.md
        ├── feature_003.md
        ├── feature_004.md
        ├── feature_005.md
        ├── feature_006.md
        ├── feature_007.md
        └── feature_008.md
```

## 注意事项

1. **端口配置**：HTTP 默认 3000，WebSocket 默认 3001
2. **数据库**：使用 lowdb，数据存储在 `stratix-data/stratix.db.json`
3. **CORS**：已启用跨域支持
4. **优雅关闭**：支持 SIGTERM 和 SIGINT 信号

## 许可证

MIT

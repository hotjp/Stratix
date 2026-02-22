# Stratix 星策系统

基于 Phaser RTS 游戏化界面的多 Agent 可视化指挥平台。

## 项目结构

```
src/
├── stratix-core/              # 核心协议层
│   ├── stratix-protocol.ts    # 类型定义
│   ├── StratixEventBus.ts     # 事件总线
│   └── utils/                 # 工具函数
├── stratix-gateway/           # 中间件服务层（HTTP API + WebSocket）
│   ├── api/routes/            # REST API 路由
│   ├── api/websocket/         # WebSocket 状态同步
│   ├── command-transformer/   # 指令转换 + 技能执行
│   └── config-manager/        # 配置管理 + 模板管理
├── stratix-openclaw-adapter/  # OpenClaw 接入层
│   ├── LocalOpenClawAdapter.ts
│   ├── RemoteOpenClawAdapter.ts
│   └── ConnectionPool.ts
├── stratix-data-store/        # 数据存储层
│   ├── StratixDataStore.ts    # 核心存储
│   ├── TemplateLibrary.ts     # 模板库
│   ├── LogStore.ts            # 日志存储
│   └── BackupManager.ts       # 备份管理
├── stratix-designer/          # Hero 设计器（Vue 组件）
│   ├── StratixHeroDesigner.ts
│   ├── components/            # Vue 编辑器组件
│   ├── templates/             # 预设模板
│   └── utils/                 # 配置校验/转换
├── stratix-command-panel/     # 指令面板
└── stratix-rts/               # 实时策略层
```

## 模块依赖关系

```
stratix-core (协议层)
    ↓
├── stratix-gateway ──→ stratix-openclaw-adapter
├── stratix-data-store
├── stratix-designer
└── stratix-command-panel
```

## 开发环境

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 开发命令

```bash
# 类型检查
npm run typecheck

# 代码检查
npm run lint

# 同时启动前后端开发（推荐）
npm run dev

# 后端开发（热重载）
npm run dev:backend

# 前端开发（Vite）
npm run dev:frontend
```

## 测试

使用 Playwright 进行自动化测试：

```bash
# 安装 Playwright 浏览器（首次运行前需要）
npx playwright install

# 运行所有测试
npm test

# 带 UI 界面运行测试
npm run test:ui

# 有头模式运行（显示浏览器）
npm run test:headed

# 调试模式
npm run test:debug
```

### 测试文件

- `tests/app.spec.ts` - 应用主界面测试
- `tests/rts.spec.ts` - RTS 模块测试
- `tests/api.spec.ts` - API 接口测试

## 构建

```bash
# 完整构建（后端 + 前端）
npm run build

# 仅构建后端
npm run build:backend

# 仅构建前端
npm run build:frontend

# 清理构建产物
npm run clean
```

### 构建输出

```
dist/
├── stratix-core/           # 后端编译产物 (CommonJS)
├── stratix-gateway/
├── stratix-data-store/
├── stratix-openclaw-adapter/
├── stratix-designer/
└── frontend/               # 前端打包产物
    ├── stratix-designer.js   # UMD 格式
    ├── stratix-designer.mjs  # ESM 格式
    └── stratix-designer.css
```

## 运行

```bash
# 运行构建后的后端服务
npm run start

# 开发模式直接运行 TypeScript
npm run start:dev
```

默认端口：
- HTTP API: `3000`
- WebSocket: `3001`

## 技术栈

| 类型 | 技术 |
|------|------|
| 语言 | TypeScript |
| 后端框架 | Express |
| 前端框架 | Vue 3 |
| 构建工具 | Vite + tsc |
| 数据存储 | lowdb (JSON) |
| WebSocket | ws |
| HTTP 客户端 | axios |

## 路径别名

项目使用 TypeScript 路径别名，配置在 `tsconfig.json`：

```json
{
  "paths": {
    "@/*": ["src/*"],
    "@stratix-core/*": ["src/stratix-core/*"]
  }
}
```

构建时通过 `tsc-alias` 转换为相对路径。

## License

MIT

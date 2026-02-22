# Stratix RTS Module Features

## Module Overview
Stratix RTS 是 Stratix 星策系统的核心前端渲染模块，负责提供 2D RTS 游戏化界面。

## Core Responsibilities
- 2D RTS 画布渲染（地图、Agent 精灵、选框、视觉反馈）
- 玩家交互（选中、框选、指令下发、视角控制）
- 状态可视化（Agent 状态、指令执行状态）
- 事件发射（通过事件总线与其他模块通信）

## Development Boundaries
- 不处理指令转换、不直接对接 OpenClaw、不存储配置/日志
- 仅通过事件总线与其他模块通信
- 严格遵循 stratix-protocol.ts 定义的数据格式

## Feature List

| Feature ID | Name | Priority | Status |
|------------|------|----------|--------|
| feature_012 | Phaser Game Scene Core | P0 | Pending |
| feature_013 | Agent Sprite System | P0 | Pending |
| feature_014 | Select Box Component | P1 | Pending |
| feature_015 | Status Bar Component | P1 | Pending |
| feature_016 | Input Handler | P0 | Pending |
| feature_017 | Event Bus Integration | P0 | Pending |

## Dependencies
- phaser (3.x)
- stratix-core/stratix-protocol.ts
- stratix-core/StratixEventBus.ts

## File Structure
```
src/stratix-rts/
├── init.md
├── StratixRTSGameScene.ts
├── sprites/
│   └── AgentSprite.ts
├── ui/
│   ├── SelectBox.ts
│   └── StatusBar.ts
└── utils/
    └── InputHandler.ts
```

## Estimated Total Time
2-3 weeks

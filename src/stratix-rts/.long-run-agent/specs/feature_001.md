# Feature feature_001 - Phaser Game Scene Core

## 元信息
- **优先级**: P0（核心模块）
- **负责人**: Stratix RTS Team
- **预计工时**: 2天
- **创建时间**: 2026-02-22 16:14:23

## 功能描述
实现 Stratix RTS 的核心 Phaser 3 游戏场景，负责地图渲染、摄像机控制和场景生命周期管理。作为整个 RTS 界面的入口和容器，承载 Agent 精灵、UI 组件和输入处理。

## 功能设计方案

### 核心类设计
```typescript
// src/stratix-rts/StratixRTSGameScene.ts
import Phaser from 'phaser';
import StratixEventBus from '@/stratix-core/StratixEventBus';
import { StratixAgentConfig } from '@/stratix-core/stratix-protocol';

export default class StratixRTSGameScene extends Phaser.Scene {
  private stratixEventBus: StratixEventBus;
  private agentSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private selectedAgentIds: Set<string> = new Set();

  constructor() {
    super({ key: 'StratixRTSGameScene' });
    this.stratixEventBus = StratixEventBus.getInstance();
  }

  preload(): void {
    this.load.image('stratix-tile', 'assets/stratix/tile/star-tile.png');
    this.load.spritesheet('stratix-agent', 'assets/stratix/agent/hero-sprites.png', {
      frameWidth: 32,
      frameHeight: 32
    });
  }

  create(): void {
    this.initStratixMap();
    this.initCamera();
    this.initInputHandlers();
    this.subscribeStratixEvents();
  }

  update(time: number, delta: number): void {
    // 每帧更新逻辑（如需要）
  }

  private initStratixMap(): void {
    // 使用 TileSprite 创建可滚动的地图背景
    const mapWidth = 1600;  // 50 * 32
    const mapHeight = 960;  // 30 * 32
    
    this.add.tileSprite(
      mapWidth / 2, 
      mapHeight / 2, 
      mapWidth, 
      mapHeight, 
      'stratix-tile'
    );
  }

  private initCamera(): void {
    const mapWidth = 1600;
    const mapHeight = 960;
    
    // 设置相机边界
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    
    // 设置初始缩放
    this.cameras.main.setZoom(1.2);
  }

  private initInputHandlers(): void {
    // 将在 feature_005 中实现
  }

  private subscribeStratixEvents(): void {
    // 将在 feature_006 中实现
  }

  // 公共方法供其他组件调用
  public addAgentSprite(config: StratixAgentConfig): Phaser.GameObjects.Sprite {
    // 将在 feature_002 中实现
    return null;
  }

  public getAgentSprites(): Map<string, Phaser.GameObjects.Sprite> {
    return this.agentSprites;
  }

  public getSelectedAgentIds(): Set<string> {
    return this.selectedAgentIds;
  }
}
```

### 地图配置
- 瓦片大小: 32x32 像素
- 地图尺寸: 50x30 瓦片 = 1600x960 像素
- 主题: 星策星际感（使用 TileSprite 实现）

### 摄像机配置
| 配置项 | 值 | Phaser API |
|--------|-----|------------|
| 边界 | 0,0,1600,960 | `cameras.main.setBounds(x, y, w, h)` |
| 默认缩放 | 1.2 | `cameras.main.setZoom(1.2)` |
| 最小缩放 | 0.8 | 在 wheel 事件中 clamp |
| 最大缩放 | 2.0 | 在 wheel 事件中 clamp |

### 资源加载
```typescript
preload(): void {
  // 可选：设置 CDN 基础路径
  // this.load.setBaseURL('https://cdn.stratix.io/assets/');
  
  this.load.image('stratix-tile', 'assets/stratix/tile/star-tile.png');
  this.load.spritesheet('stratix-agent', 'assets/stratix/agent/hero-sprites.png', {
    frameWidth: 32,
    frameHeight: 32
  });
}
```

### 游戏配置
```typescript
// 在入口文件中
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'stratix-rts-container',
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',  // 深色太空背景
  pixelArt: true,              // 保持像素清晰
  scene: [StratixRTSGameScene]
};

new Phaser.Game(config);
```

## 开发步骤
- [ ] 步骤 1：创建 StratixRTSGameScene.ts 基础类结构
- [ ] 步骤 2：实现 preload() 资源加载
- [ ] 步骤 3：实现 initStratixMap() 使用 TileSprite
- [ ] 步骤 4：实现 initCamera() 配置相机边界和缩放
- [ ] 步骤 5：创建入口文件配置 Phaser.Game

## 测试用例
| 用例编号 | 场景 | 操作步骤 | 预期结果 |
|----------|------|----------|----------|
| TC-001 | 场景加载 | 启动游戏 | 场景正常显示，无 JS 错误 |
| TC-002 | 地图渲染 | 检查地图 | TileSprite 正确显示星际主题 |
| TC-003 | 相机边界 | 尝试移出地图 | 相机被限制在 0-1600, 0-960 范围内 |
| TC-004 | 资源加载 | 检查 Network | 所有资源成功加载，无 404 |

## 验收标准
- [ ] 场景可正常启动，无 JS 错误
- [ ] 地图使用 TileSprite 正确渲染
- [ ] 相机边界限制生效
- [ ] 初始缩放为 1.2

## 依赖
- phaser (3.x)
- stratix-core/StratixEventBus.ts
- stratix-core/stratix-protocol.ts

## 参考 API
- `this.add.tileSprite(x, y, width, height, key)` - 创建可滚动地图
- `this.cameras.main.setBounds(x, y, width, height)` - 设置相机边界
- `this.cameras.main.setZoom(value)` - 设置缩放
- `this.load.image/spritesheet()` - 资源加载

## 变更记录
| 日期 | 变更内容 | 变更人 |
|------|----------|--------|
| 2026-02-22 | 初始创建 | - |
| 2026-02-22 | 更新为 Phaser 实际 API | AI Agent |

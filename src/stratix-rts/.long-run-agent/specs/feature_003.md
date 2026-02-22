# Feature feature_003 - Select Box Component

## 元信息
- **优先级**: P1（重要模块）
- **负责人**: Stratix RTS Team
- **预计工时**: 1天
- **创建时间**: 2026-02-22 16:14:27

## 功能描述
实现拖拽选框组件，支持玩家通过鼠标拖拽框选多个 Agent。选框使用 Phaser.Graphics 动态绘制，遵循 Stratix UI/UX 设计规范，使用绿色边框和半透明绿色填充。

## 功能设计方案

### 核心类设计
```typescript
// src/stratix-rts/ui/SelectBox.ts
import Phaser from 'phaser';

export interface SelectBoxConfig {
  lineColor: number;
  fillColor: number;
  lineWidth: number;
  fillAlpha: number;
  minSize: number; // 最小触发尺寸
}

// Stratix 选框默认配置（遵循 UI/UX 设计规范）
const DEFAULT_CONFIG: SelectBoxConfig = {
  lineColor: 0x00ff00,   // Stratix Green
  fillColor: 0x00ff00,   // Stratix Green
  lineWidth: 2,
  fillAlpha: 0.2,        // 20% 透明度
  minSize: 10            // 最小 10x10 触发选框
};

export class SelectBox {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private config: SelectBoxConfig;
  private startPoint: { x: number; y: number } | null = null;
  private isActive: boolean = false;

  constructor(scene: Phaser.Scene, config?: Partial<SelectBoxConfig>) {
    this.scene = scene;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // 创建 Graphics 对象用于绘制选框
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(1000); // 确保在精灵上层，在 UI 下层
    this.graphics.setScrollFactor(0); // 跟随摄像机（世界坐标）
  }

  /**
   * 开始选框（鼠标按下时调用）
   * @param x 世界坐标 X
   * @param y 世界坐标 Y
   */
  public start(x: number, y: number): void {
    this.startPoint = { x, y };
    this.isActive = true;
    this.graphics.clear();
  }

  /**
   * 更新选框（鼠标移动时调用）
   * @param x 世界坐标 X
   * @param y 世界坐标 Y
   */
  public update(x: number, y: number): void {
    if (!this.isActive || !this.startPoint) return;

    this.graphics.clear();

    // 计算矩形边界（支持任意方向拖拽）
    const rect = this.getRectangle(x, y);

    // 绘制半透明填充
    this.graphics.fillStyle(this.config.fillColor, this.config.fillAlpha);
    this.graphics.fillRect(rect.x, rect.y, rect.width, rect.height);

    // 绘制边框
    this.graphics.lineStyle(this.config.lineWidth, this.config.lineColor, 1);
    this.graphics.strokeRect(rect.x, rect.y, rect.width, rect.height);
  }

  /**
   * 结束选框（鼠标释放时调用）
   * @returns 返回标准化的选区矩形，用于碰撞检测；如果面积太小返回 null
   */
  public end(): Phaser.Geom.Rectangle | null {
    if (!this.isActive || !this.startPoint) {
      return null;
    }

    const pointer = this.scene.input.activePointer;
    const rect = this.getRectangle(pointer.worldX, pointer.worldY);

    // 清除选框
    this.graphics.clear();
    this.isActive = false;
    this.startPoint = null;

    // 只有超过最小面积才返回
    if (rect.width >= this.config.minSize && rect.height >= this.config.minSize) {
      return rect;
    }

    return null;
  }

  /**
   * 获取当前选区（用于实时检测）
   */
  public getCurrentBounds(): Phaser.Geom.Rectangle | null {
    if (!this.isActive || !this.startPoint) return null;
    const pointer = this.scene.input.activePointer;
    return this.getRectangle(pointer.worldX, pointer.worldY);
  }

  /**
   * 计算标准化矩形（宽高始终为正数）
   */
  private getRectangle(endX: number, endY: number): Phaser.Geom.Rectangle {
    if (!this.startPoint) {
      return new Phaser.Geom.Rectangle(0, 0, 0, 0);
    }

    // 计算左上角坐标（取最小值）
    const x = Math.min(this.startPoint.x, endX);
    const y = Math.min(this.startPoint.y, endY);
    
    // 计算宽高（取绝对值）
    const width = Math.abs(endX - this.startPoint.x);
    const height = Math.abs(endY - this.startPoint.y);

    return new Phaser.Geom.Rectangle(x, y, width, height);
  }

  /**
   * 检查精灵是否在选区内
   */
  public containsSprite(sprite: Phaser.GameObjects.Sprite): boolean {
    const bounds = this.getCurrentBounds();
    if (!bounds) return false;
    return Phaser.Geom.Rectangle.Contains(bounds, sprite.x, sprite.y);
  }

  /**
   * 获取选区内的所有精灵
   */
  public getSpritesInBounds(sprites: Iterable<Phaser.GameObjects.Sprite>): Phaser.GameObjects.Sprite[] {
    const bounds = this.getCurrentBounds();
    if (!bounds) return [];
    
    const result: Phaser.GameObjects.Sprite[] = [];
    for (const sprite of sprites) {
      if (Phaser.Geom.Rectangle.Contains(bounds, sprite.x, sprite.y)) {
        result.push(sprite);
      }
    }
    return result;
  }

  /**
   * 销毁组件
   */
  public destroy(): void {
    this.graphics.destroy();
  }
}
```

### 视觉设计（遵循 Stratix UI/UX 规范）
```
  ┌──────────────────────┐
  │░░░░░░░░░░░░░░░░░░░░░░│ ← 绿色半透明填充 (0x00ff00, alpha=0.2)
  │░░░░░░░░░░░░░░░░░░░░░░│
  │░░ [Agent1] ░░░░░░░░░░│
  │░░░░░ [Agent2] ░░░░░░░│
  └──────────────────────┘
    ↑ 绿色边框 (0x00ff00, 2px)
```

### 选框配置

| 属性 | 值 | 说明 |
|------|-----|------|
| 边框颜色 | 0x00ff00 | Stratix Green |
| 填充颜色 | 0x00ff00 | Stratix Green |
| 边框宽度 | 2px | 绿色实线 |
| 填充透明度 | 20% | alpha=0.2 |
| 最小尺寸 | 10x10 px | 小于此尺寸不触发选框 |
| 图层深度 | 1000 | 在精灵上层，在 UI 下层 |

### 在场景中的使用
```typescript
// 在 StratixRTSGameScene 中
private selectBox: SelectBox;
private dragThreshold: number = 5; // 拖拽阈值

create(): void {
  this.selectBox = new SelectBox(this);
  
  // 鼠标按下
  this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    if (pointer.leftButtonDown()) {
      // 检查是否点击了精灵
      const clickedSprite = this.getSpriteAtPointer(pointer);
      if (!clickedSprite) {
        // 点击空白区域，开始选框
        this.selectBox.start(pointer.worldX, pointer.worldY);
      }
    }
  });

  // 鼠标移动
  this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
    if (pointer.leftButtonDown()) {
      this.selectBox.update(pointer.worldX, pointer.worldY);
    }
  });

  // 鼠标释放
  this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
    if (pointer.leftButtonReleased()) {
      const bounds = this.selectBox.end();
      if (bounds) {
        this.selectAgentsInRect(bounds);
      }
    }
  });
}

/**
 * 选中矩形区域内的所有 Agent
 */
private selectAgentsInRect(rect: Phaser.Geom.Rectangle): void {
  // 清除之前选中
  this.agentSprites.forEach((sprite, agentId) => {
    sprite.setHighlight(false);
  });
  this.selectedAgentIds.clear();

  // 选中区域内的 Agent
  this.agentSprites.forEach((sprite, agentId) => {
    if (Phaser.Geom.Rectangle.Contains(rect, sprite.x, sprite.y)) {
      sprite.setHighlight(true);
      this.selectedAgentIds.add(agentId);
    }
  });

  // 发射选中事件
  if (this.selectedAgentIds.size > 0) {
    this.eventManager.emitAgentSelect(Array.from(this.selectedAgentIds));
  }
}

/**
 * 获取鼠标位置的精灵
 */
private getSpriteAtPointer(pointer: Phaser.Input.Pointer): Phaser.GameObjects.Sprite | null {
  const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
  
  for (const [agentId, sprite] of this.agentSprites) {
    const bounds = sprite.getBounds();
    if (bounds.contains(worldPoint.x, worldPoint.y)) {
      return sprite;
    }
  }
  
  return null;
}
```

## 开发步骤
- [ ] 步骤 1：创建 ui/SelectBox.ts 类
- [ ] 步骤 2：实现 start() 开始选框
- [ ] 步骤 3：实现 update() 动态绘制（使用 Graphics）
- [ ] 步骤 4：实现 end() 返回标准化边界
- [ ] 步骤 5：实现 getRectangle() 处理反向拖拽
- [ ] 步骤 6：实现 getSpritesInBounds() 辅助方法
- [ ] 步骤 7：集成到场景的输入处理

## 测试用例
| 用例编号 | 场景 | 操作步骤 | 预期结果 |
|----------|------|----------|----------|
| TC-001 | 开始选框 | 调用 start(100, 100) | Graphics 准备绘制 |
| TC-002 | 向右下拖 | 拖拽到 (200, 200) | 矩形 x=100, y=100, w=100, h=100 |
| TC-003 | 向左上拖 | 从 (200,200) 拖到 (100,100) | 矩形正确标准化 (x=100, y=100) |
| TC-004 | 完成选框 | 调用 end() | 返回 Phaser.Geom.Rectangle |
| TC-005 | 点击释放 | 快速点击无拖拽 | 返回 null（面积小于 10x10） |
| TC-006 | 视觉效果 | 观察选框 | 绿色边框 2px + 20% 透明绿色填充 |
| TC-007 | 世界坐标 | 移动摄像机后拖拽 | 选框跟随世界坐标 |
| TC-008 | 图层深度 | 选框与精灵重叠 | 选框在精灵上方 |

## 验收标准
- [ ] 使用 Phaser.Graphics 绘制选框
- [ ] 支持任意方向拖拽（4个方向）
- [ ] 边界值始终为正数（标准化）
- [ ] 绿色边框 2px，填充透明度 20%
- [ ] 松开鼠标后选框消失
- [ ] 最小面积过滤（<10px 忽略）
- [ ] 使用世界坐标（跟随摄像机）
- [ ] 正确的图层深度

## 依赖
- phaser (3.x)
- feature_001 (Phaser Game Scene Core)

## 参考 API
- `scene.add.graphics()` - 创建 Graphics 对象
- `graphics.fillStyle(color, alpha).fillRect()` - 填充矩形
- `graphics.lineStyle(width, color, alpha).strokeRect()` - 绘制边框
- `Phaser.Geom.Rectangle` - 矩形类
- `Phaser.Geom.Rectangle.Contains(rect, x, y)` - 点是否在矩形内
- `cameras.main.getWorldPoint(x, y)` - 屏幕坐标转世界坐标

## 变更记录
| 日期 | 变更内容 | 变更人 |
|------|----------|--------|
| 2026-02-22 | 初始创建 | - |
| 2026-02-22 | 更新为 Graphics API 实现 | AI Agent |
| 2026-02-22 | 添加 UI/UX 设计规范，添加世界坐标支持 | AI Agent |

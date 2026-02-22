# Feature feature_005 - Input Handler

## 元信息
- **优先级**: P0（核心模块）
- **负责人**: Stratix RTS Team
- **预计工时**: 2天
- **创建时间**: 2026-02-22 16:14:31

## 功能描述
实现统一的输入处理器，管理所有玩家交互操作，包括鼠标点击、拖拽选框、右键指令、滚轮缩放和键盘快捷键。将原始 Phaser 输入事件转换为业务回调。

## 功能设计方案

### 核心类设计
```typescript
// src/stratix-rts/utils/InputHandler.ts
import Phaser from 'phaser';

export interface InputConfig {
  zoomSpeed: number;
  minZoom: number;
  maxZoom: number;
  panSpeed: number;
}

export interface InputCallbacks {
  onSelect?: (agentIds: string[]) => void;
  onDeselect?: () => void;
  onCommand?: (target: { x: number; y: number }) => void;
  onCameraMove?: (deltaX: number, deltaY: number) => void;
  onZoom?: (zoom: number) => void;
  onDragStart?: (x: number, y: number) => void;
  onDragUpdate?: (x: number, y: number) => void;
  onDragEnd?: () => Phaser.Geom.Rectangle | null;
}

const DEFAULT_CONFIG: InputConfig = {
  zoomSpeed: 0.001,
  minZoom: 0.8,
  maxZoom: 2.0,
  panSpeed: 4
};

export class InputHandler {
  private scene: Phaser.Scene;
  private config: InputConfig;
  private callbacks: InputCallbacks;
  private isEnabled: boolean = true;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private isDragging: boolean = false;

  constructor(
    scene: Phaser.Scene, 
    callbacks: InputCallbacks, 
    config?: Partial<InputConfig>
  ) {
    this.scene = scene;
    this.callbacks = callbacks;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.initKeyboard();
    this.initMouse();
  }

  private initKeyboard(): void {
    if (!this.scene.input.keyboard) return;
    
    // 创建方向键
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    
    // ESC 键取消选中
    const escKey = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ESC
    );
    escKey.on('down', () => {
      if (this.isEnabled && this.callbacks.onDeselect) {
        this.callbacks.onDeselect();
      }
    });

    // +/- 键缩放
    const plusKey = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.PLUS
    );
    const minusKey = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.MINUS
    );
    
    plusKey.on('down', () => this.zoomCamera(0.1));
    minusKey.on('down', () => this.zoomCamera(-0.1));
  }

  private initMouse(): void {
    // 鼠标按下
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isEnabled) return;

      if (pointer.leftButtonDown()) {
        this.isDragging = true;
        if (this.callbacks.onDragStart) {
          this.callbacks.onDragStart(pointer.worldX, pointer.worldY);
        }
      }
    });

    // 鼠标移动
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isEnabled) return;

      if (this.isDragging && pointer.leftButtonDown()) {
        if (this.callbacks.onDragUpdate) {
          this.callbacks.onDragUpdate(pointer.worldX, pointer.worldY);
        }
      }
    });

    // 鼠标释放
    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.isEnabled) return;

      if (pointer.leftButtonReleased() && this.isDragging) {
        this.isDragging = false;
        if (this.callbacks.onDragEnd) {
          const bounds = this.callbacks.onDragEnd();
          // 如果返回 null，表示是点击而非拖拽
          if (!bounds) {
            // 检查是否点击了精灵
            const hitSprite = this.getSpriteAtPointer(pointer);
            if (hitSprite && this.callbacks.onSelect) {
              this.callbacks.onSelect([hitSprite.getData('agentId')]);
            }
          }
        }
      }

      // 右键释放 - 发射指令
      if (pointer.rightButtonReleased()) {
        if (this.callbacks.onCommand) {
          this.callbacks.onCommand({
            x: pointer.worldX,
            y: pointer.worldY
          });
        }
      }
    });

    // 滚轮缩放
    this.scene.input.on('wheel', (
      pointer: Phaser.Input.Pointer, 
      gameObjects: Phaser.GameObjects.GameObject[], 
      deltaX: number, 
      deltaY: number
    ) => {
      if (!this.isEnabled) return;
      
      const camera = this.scene.cameras.main;
      const currentZoom = camera.zoom;
      const newZoom = Phaser.Math.Clamp(
        currentZoom - deltaY * this.config.zoomSpeed,
        this.config.minZoom,
        this.config.maxZoom
      );
      
      camera.setZoom(newZoom);
      
      if (this.callbacks.onZoom) {
        this.callbacks.onZoom(newZoom);
      }
    });
  }

  private getSpriteAtPointer(pointer: Phaser.Input.Pointer): Phaser.GameObjects.Sprite | null {
    // 使用场景的 hitTest 检测
    const gameObjects = this.scene.input.hitTestPointer(pointer);
    
    for (const obj of gameObjects) {
      if (obj instanceof Phaser.GameObjects.Sprite && obj.getData('agentId')) {
        return obj;
      }
    }
    
    return null;
  }

  private zoomCamera(delta: number): void {
    const camera = this.scene.cameras.main;
    const newZoom = Phaser.Math.Clamp(
      camera.zoom + delta,
      this.config.minZoom,
      this.config.maxZoom
    );
    camera.setZoom(newZoom);
    
    if (this.callbacks.onZoom) {
      this.callbacks.onZoom(newZoom);
    }
  }

  /**
   * 每帧更新（在场景的 update 中调用）
   */
  public update(): void {
    if (!this.isEnabled || !this.cursors) return;

    const camera = this.scene.cameras.main;
    let moveX = 0;
    let moveY = 0;

    if (this.cursors.left.isDown) moveX = -this.config.panSpeed;
    else if (this.cursors.right.isDown) moveX = this.config.panSpeed;

    if (this.cursors.up.isDown) moveY = -this.config.panSpeed;
    else if (this.cursors.down.isDown) moveY = this.config.panSpeed;

    if (moveX !== 0 || moveY !== 0) {
      camera.scrollX += moveX;
      camera.scrollY += moveY;
      
      if (this.callbacks.onCameraMove) {
        this.callbacks.onCameraMove(moveX, moveY);
      }
    }
  }

  public enable(): void {
    this.isEnabled = true;
  }

  public disable(): void {
    this.isEnabled = false;
  }

  public destroy(): void {
    this.scene.input.off('pointerdown');
    this.scene.input.off('pointermove');
    this.scene.input.off('pointerup');
    this.scene.input.off('wheel');
  }
}
```

### 输入事件映射

#### 鼠标事件
| 原始事件 | 条件 | 回调 |
|----------|------|------|
| pointerdown + left | 点击空白 | onDragStart |
| pointerdown + left | 点击精灵 | - |
| pointermove + left down | 拖拽中 | onDragUpdate |
| pointerup + left released | 无拖拽面积 | onSelect (单选) |
| pointerup + left released | 有拖拽面积 | onDragEnd (框选) |
| pointerup + right released | 有选中 | onCommand |
| wheel + deltaY | 滚轮 | onZoom |

#### 键盘事件
| 按键 | 动作 |
|------|------|
| Escape | onDeselect |
| ArrowUp | camera.scrollY -= panSpeed |
| ArrowDown | camera.scrollY += panSpeed |
| ArrowLeft | camera.scrollX -= panSpeed |
| ArrowRight | camera.scrollX += panSpeed |
| + | camera.zoom += 0.1 |
| - | camera.zoom -= 0.1 |

### 在场景中使用
```typescript
// 在 StratixRTSGameScene 中
private inputHandler: InputHandler;

create(): void {
  const callbacks: InputCallbacks = {
    onSelect: (agentIds) => this.handleSelect(agentIds),
    onDeselect: () => this.handleDeselect(),
    onCommand: (target) => this.handleCommand(target),
    onDragStart: (x, y) => this.selectBox.start(x, y),
    onDragUpdate: (x, y) => this.selectBox.update(x, y),
    onDragEnd: () => {
      const bounds = this.selectBox.end();
      if (bounds) {
        this.selectAgentsInRect(bounds);
      }
      return bounds;
    },
    onZoom: (zoom) => console.log('Zoom:', zoom)
  };

  this.inputHandler = new InputHandler(this, callbacks);
}

update(time: number, delta: number): void {
  this.inputHandler.update();
}

private handleSelect(agentIds: string[]): void {
  // 清除之前选中
  this.selectedAgentIds.forEach(id => {
    const sprite = this.agentSprites.get(id);
    if (sprite) sprite.setHighlight(false);
  });
  this.selectedAgentIds.clear();

  // 设置新选中
  agentIds.forEach(id => {
    const sprite = this.agentSprites.get(id);
    if (sprite) {
      sprite.setHighlight(true);
      this.selectedAgentIds.add(id);
    }
  });

  // 发射事件
  this.eventManager.emitAgentSelect(Array.from(this.selectedAgentIds));
}
```

## 开发步骤
- [ ] 步骤 1：创建 utils/InputHandler.ts 类
- [ ] 步骤 2：实现 initMouse() 鼠标事件处理
- [ ] 步骤 3：实现 initKeyboard() 键盘事件处理
- [ ] 步骤 4：实现滚轮缩放
- [ ] 步骤 5：实现方向键平移
- [ ] 步骤 6：实现 getSpriteAtPointer() 精灵点击检测
- [ ] 步骤 7：实现 enable/disable/destroy

## 测试用例
| 用例编号 | 场景 | 操作步骤 | 预期结果 |
|----------|------|----------|----------|
| TC-001 | 单击精灵 | 左键点击 Agent | 触发 onSelect |
| TC-002 | 框选精灵 | 拖拽选框 | 触发 onDragEnd |
| TC-003 | 取消选中 | 按 Escape | 触发 onDeselect |
| TC-004 | 右键指令 | 选中后右键 | 触发 onCommand |
| TC-005 | 滚轮缩放 | 滚轮向上 | onZoom，范围 0.8-2.0 |
| TC-006 | 键盘移动 | 按方向键 | onCameraMove |
| TC-007 | 禁用输入 | 调用 disable() | 所有输入无响应 |

## 验收标准
- [ ] 左键单击选中单个 Agent
- [ ] 左键拖拽框选多个 Agent
- [ ] 右键发射指令事件
- [ ] 滚轮缩放范围 0.8-2.0
- [ ] Escape 取消选中
- [ ] 方向键平移摄像机
- [ ] 可启用/禁用输入
- [ ] 在场景 update 中调用 inputHandler.update()

## 依赖
- phaser (3.x)
- feature_001 (Phaser Game Scene Core)
- feature_003 (Select Box Component)

## 参考 API
- `scene.input.on('pointerdown/move/up', callback)` - 指针事件
- `scene.input.on('wheel', callback)` - 滚轮事件
- `scene.input.keyboard.createCursorKeys()` - 方向键
- `scene.input.keyboard.addKey(keyCode)` - 添加按键监听
- `Phaser.Math.Clamp(value, min, max)` - 数值约束
- `scene.input.hitTestPointer(pointer)` - 点击检测

## 变更记录
| 日期 | 变更内容 | 变更人 |
|------|----------|--------|
| 2026-02-22 | 初始创建 | - |
| 2026-02-22 | 更新为 Phaser 实际 API | AI Agent |

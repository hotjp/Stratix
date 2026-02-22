# Feature feature_002 - Agent Sprite System

## 元信息
- **优先级**: P0（核心模块）
- **负责人**: Stratix RTS Team
- **预计工时**: 2天
- **创建时间**: 2026-02-22 16:14:26

## 功能描述
实现 Agent 精灵系统，负责在 RTS 地图上渲染和管理 Agent 实体，包括状态可视化、选中高亮和指令执行反馈。每个 Agent 以「英雄」形象呈现，贴合星策「军团」定位。

## 功能设计方案

### 核心类设计
```typescript
// src/stratix-rts/sprites/AgentSprite.ts
import Phaser from 'phaser';
import { StratixAgentConfig } from '@/stratix-core/stratix-protocol';

export type AgentStatus = 'online' | 'offline' | 'busy' | 'error';
export type CommandStatus = 'pending' | 'running' | 'success' | 'failed';
export type AgentType = 'writer' | 'dev' | 'analyst' | string;

// Stratix 色彩系统常量
const COLORS = {
  // 状态颜色
  status: {
    online: 0x00ff00,
    offline: 0x888888,
    busy: 0xffff00,
    error: 0xff4444,
    pending: 0x00ffff
  },
  // Agent 类型颜色
  type: {
    writer: 0x4A90E2,
    dev: 0x9B59B6,
    analyst: 0xE67E22
  },
  // UI 颜色
  ui: {
    selection: 0x00ff00,
    nameText: '#ffffff',
    nameBg: 'rgba(0, 0, 0, 0.6)'
  }
};

export class AgentSprite extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Sprite;
  private nameText: Phaser.GameObjects.Text;
  private statusIndicator: Phaser.GameObjects.Graphics;
  private selectionRing: Phaser.GameObjects.Graphics;
  private typeIcon: Phaser.GameObjects.Graphics;
  private agentId: string;
  private agentName: string;
  private agentType: AgentType;
  private currentStatus: AgentStatus = 'online';
  private isSelected: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, config: StratixAgentConfig) {
    super(scene, x, y);
    
    this.agentId = config.agentId;
    this.agentName = config.name;
    this.agentType = config.type;

    // 1. 创建选中环（最底层，初始隐藏）
    this.selectionRing = scene.add.graphics();
    this.drawSelectionRing();
    this.selectionRing.setVisible(false);
    this.add(this.selectionRing);

    // 2. 创建英雄精灵（32x32）
    this.sprite = scene.add.sprite(0, 0, 'stratix-agent');
    this.add(this.sprite);

    // 3. 创建类型图标（精灵右下角）
    this.typeIcon = scene.add.graphics();
    this.drawTypeIcon(config.type);
    this.add(this.typeIcon);

    // 4. 创建状态指示器（精灵正上方）
    this.statusIndicator = scene.add.graphics();
    this.drawStatusIndicator(COLORS.status.online);
    this.add(this.statusIndicator);

    // 5. 创建名称标签（状态指示器上方）
    this.nameText = scene.add.text(0, -24, config.name, {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: COLORS.ui.nameText,
      backgroundColor: COLORS.ui.nameBg,
      padding: { x: 6, y: 2 }
    });
    this.nameText.setOrigin(0.5);
    this.add(this.nameText);

    // 设置交互
    this.sprite.setInteractive({ useHandCursor: true });
    this.setData('agentId', config.agentId);
    this.setData('agentType', config.type);
    
    // 设置层级深度
    this.setDepth(y); // 按 y 坐标排序，实现正确的遮挡关系
  }

  /**
   * 绘制选中环
   */
  private drawSelectionRing(): void {
    this.selectionRing.clear();
    this.selectionRing.lineStyle(2, COLORS.ui.selection, 1);
    this.selectionRing.strokeCircle(0, 0, 22); // 直径 44px
  }

  /**
   * 绘制状态指示器（圆点）
   */
  private drawStatusIndicator(color: number): void {
    this.statusIndicator.clear();
    this.statusIndicator.fillStyle(color, 1);
    this.statusIndicator.fillCircle(0, -16, 3); // 直径 6px
  }

  /**
   * 绘制类型图标（小圆点）
   */
  private drawTypeIcon(type: AgentType): void {
    const color = COLORS.type[type as keyof typeof COLORS.type] || 0xffffff;
    this.typeIcon.clear();
    this.typeIcon.fillStyle(color, 1);
    this.typeIcon.fillCircle(10, 10, 4); // 右下角小圆点
  }

  /**
   * 设置 Agent 状态
   */
  public setAgentStatus(status: AgentStatus): void {
    this.currentStatus = status;
    const color = COLORS.status[status];
    
    // 更新状态指示器
    this.drawStatusIndicator(color);

    // 更新精灵整体色调
    if (status === 'offline') {
      this.sprite.setTint(0x888888);
      this.setAlpha(0.5);
    } else if (status === 'busy') {
      this.sprite.setTint(color);
      this.startBusyAnimation();
    } else {
      this.sprite.setTint(color);
      this.setAlpha(1);
    }

    // 如果当前选中，保持选中状态
    if (this.isSelected) {
      this.sprite.setTint(COLORS.ui.selection);
    }
  }

  /**
   * 设置指令状态
   */
  public setCommandStatus(status: CommandStatus): void {
    const color = COLORS.status[status];
    this.sprite.setTint(color);

    switch (status) {
      case 'success':
        this.playSuccessAnimation();
        break;
      case 'failed':
        this.playErrorAnimation();
        break;
      case 'running':
        // 保持当前颜色，不额外动画
        break;
    }
  }

  /**
   * 设置选中状态
   */
  public setHighlight(selected: boolean): void {
    this.isSelected = selected;
    this.selectionRing.setVisible(selected);
    
    if (selected) {
      this.sprite.setTint(COLORS.ui.selection);
      // 选中弹跳动画
      this.scene.tweens.add({
        targets: this.sprite,
        scale: { from: 1, to: 1.1 },
        duration: 100,
        yoyo: true
      });
    } else {
      this.setAgentStatus(this.currentStatus);
    }
  }

  /**
   * 忙碌脉冲动画
   */
  private startBusyAnimation(): void {
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 1, to: 0.7 },
      duration: 500,
      yoyo: true,
      repeat: -1
    });
  }

  /**
   * 成功闪烁动画
   */
  private playSuccessAnimation(): void {
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 1, to: 0.3 },
      duration: 200,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.setAgentStatus(this.currentStatus);
      }
    });
  }

  /**
   * 错误抖动动画
   */
  private playErrorAnimation(): void {
    const originalX = this.x;
    this.scene.tweens.add({
      targets: this,
      x: { from: originalX - 3, to: originalX + 3 },
      duration: 50,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.x = originalX;
        this.setAgentStatus(this.currentStatus);
      }
    });
  }

  public getAgentId(): string {
    return this.agentId;
  }

  public getAgentName(): string {
    return this.agentName;
  }

  public getAgentType(): AgentType {
    return this.agentType;
  }

  /**
   * 更新深度（用于遮挡排序）
   */
  public updateDepth(): void {
    this.setDepth(this.y);
  }
}
```

### 视觉结构
```
        [Agent Name]        ← 名称标签 (12px, 白色, 黑色背景 60%)
            ●               ← 状态指示器 (6px 圆点, 彩色)
          ╭───╮
          │ 🧙 │ ●          ← 英雄精灵 (32x32) + 类型图标 (右下角彩色小点)
          ╰───╯
          ◯                 ← 选中环 (44px 直径, 绿色, 2px 线宽, 选中时显示)
```

### 状态颜色映射（遵循 Stratix 色彩系统）
| 状态 | 色值 | 十六进制 | 视觉效果 |
|------|------|----------|----------|
| online | 绿色 | 0x00ff00 | 正常显示，绿色圆点 |
| offline | 灰色 | 0x888888 | 半透明 50%，灰色圆点 |
| busy | 黄色 | 0xffff00 | 脉冲动画，黄色圆点 |
| error | 红色 | 0xff4444 | 抖动效果，红色圆点 |

### Agent 类型颜色（与 Command Panel 一致）
| 类型 | 色值 | 十六进制 | 位置 |
|------|------|----------|------|
| writer | 蓝色 | 0x4A90E2 | 右下角小圆点 |
| dev | 紫色 | 0x9B59B6 | 右下角小圆点 |
| analyst | 橙色 | 0xE67E22 | 右下角小圆点 |

### 在场景中使用
```typescript
// 在 StratixRTSGameScene 中
public addAgentSprite(config: StratixAgentConfig): AgentSprite {
  const x = Phaser.Math.Between(100, 1500);
  const y = Phaser.Math.Between(100, 860);
  
  const agentSprite = new AgentSprite(this, x, y, config);
  this.add.existing(agentSprite);
  
  this.agentSprites.set(config.agentId, agentSprite);
  
  return agentSprite;
}
```

## 开发步骤
- [ ] 步骤 1：创建 sprites/AgentSprite.ts 继承 Container
- [ ] 步骤 2：实现选中环、类型图标、状态指示器、名称标签
- [ ] 步骤 3：实现 setAgentStatus() 状态切换
- [ ] 步骤 4：实现 setCommandStatus() 指令反馈动画
- [ ] 步骤 5：实现 setHighlight() 选中高亮
- [ ] 步骤 6：实现动画效果（脉冲、闪烁、抖动）

## 测试用例
| 用例编号 | 场景 | 操作步骤 | 预期结果 |
|----------|------|----------|----------|
| TC-001 | 精灵创建 | 调用 new AgentSprite() | 显示精灵+名称+类型图标+状态圆点 |
| TC-002 | 状态切换 | 调用 setAgentStatus('busy') | 精灵变黄并开始脉冲动画 |
| TC-003 | 选中高亮 | 调用 setHighlight(true) | 显示绿色选中环，弹跳动画 |
| TC-004 | 指令成功 | 调用 setCommandStatus('success') | 精灵闪烁 2 次后恢复 |
| TC-005 | 指令失败 | 调用 setCommandStatus('failed') | 精灵左右抖动 3 次 |
| TC-006 | 类型颜色 | 创建 writer 类型 Agent | 右下角显示蓝色小圆点 |
| TC-007 | 遮挡排序 | 多个 Agent 在不同 Y 坐标 | Y 坐标大的 Agent 在上层 |

## 验收标准
- [ ] Agent 精灵继承 Phaser.GameObjects.Container
- [ ] 名称标签显示在精灵上方 24px
- [ ] 状态指示器为 6px 圆点，颜色符合 Stratix 色彩系统
- [ ] 类型图标使用 Command Panel 一致的类型颜色
- [ ] 选中环为 44px 直径绿色圆环
- [ ] 动画效果流畅（脉冲、闪烁、抖动）
- [ ] 按 Y 坐标正确排序遮挡关系

## 依赖
- phaser (3.x)
- feature_001 (Phaser Game Scene Core)
- stratix-core/stratix-protocol.ts

## 参考 API
- `Phaser.GameObjects.Container` - 容器基类
- `sprite.setInteractive({ useHandCursor: true })` - 启用交互
- `sprite.setTint(color)` - 设置颜色色调
- `scene.tweens.add(config)` - 添加动画
- `graphics.fillStyle().fillCircle()` - 绘制圆形
- `graphics.lineStyle().strokeCircle()` - 绘制圆环

## 变更记录
| 日期 | 变更内容 | 变更人 |
|------|----------|--------|
| 2026-02-22 | 初始创建 | - |
| 2026-02-22 | 更新为 Phaser 实际 API | AI Agent |
| 2026-02-22 | 添加 UI/UX 设计规范，与 Command Panel 风格统一 | AI Agent |

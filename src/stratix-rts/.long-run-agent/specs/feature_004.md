# Feature feature_004 - Status Bar Component

## 元信息
- **优先级**: P1（重要模块）
- **负责人**: Stratix RTS Team
- **预计工时**: 1天
- **创建时间**: 2026-02-22 16:14:29

## 功能描述
实现状态栏组件，固定在屏幕底部，用于显示 Agent 状态消息和指令执行进度。使用 Phaser.GameObjects.Container 和 Graphics 实现，不受摄像机滚动影响，遵循 Stratix UI/UX 设计规范。

## 功能设计方案

### 核心类设计
```typescript
// src/stratix-rts/ui/StatusBar.ts
import Phaser from 'phaser';
import { AgentStatus, CommandStatus } from '../sprites/AgentSprite';

// Stratix 色彩系统
const COLORS = {
  background: 0x000000,
  backgroundAlpha: 0.7,
  border: 0x00ff00,
  borderAlpha: 0.5,
  text: '#ffffff',
  progressBg: 0x333333,
  progressFill: 0x00ff00,
  errorText: '#ff4444'
};

export class StatusBar extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;
  private messageText: Phaser.GameObjects.Text;
  private iconGraphics: Phaser.GameObjects.Graphics;
  private progressBar: Phaser.GameObjects.Graphics;
  private progressText: Phaser.GameObjects.Text;
  private clearTimer: Phaser.Time.TimerEvent | null = null;
  private width: number;
  private height: number = 40;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number) {
    super(scene, x, y);
    
    this.width = width;
    
    // 1. 创建背景
    this.background = scene.add.graphics();
    this.drawBackground();
    this.add(this.background);

    // 2. 创建状态图标
    this.iconGraphics = scene.add.graphics();
    this.add(this.iconGraphics);

    // 3. 创建消息文本
    this.messageText = scene.add.text(28, 10, '', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: COLORS.text
    });
    this.add(this.messageText);

    // 4. 创建进度条
    this.progressBar = scene.add.graphics();
    this.add(this.progressBar);

    // 5. 创建进度百分比文本
    this.progressText = scene.add.text(width - 50, 10, '', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: COLORS.text
    });
    this.progressText.setOrigin(1, 0);
    this.add(this.progressText);

    // 固定在屏幕上，不受摄像机滚动影响
    this.setScrollFactor(0);
    this.setDepth(2000);
    
    // 初始隐藏
    this.setVisible(false);
  }

  /**
   * 绘制背景
   */
  private drawBackground(): void {
    this.background.clear();
    
    // 半透明深色背景
    this.background.fillStyle(COLORS.background, COLORS.backgroundAlpha);
    this.background.fillRoundedRect(0, 0, this.width, this.height, 8);
    
    // 顶部绿色边线
    this.background.lineStyle(1, COLORS.border, COLORS.borderAlpha);
    this.background.lineBetween(0, 0, this.width, 0);
  }

  /**
   * 绘制状态图标（圆点）
   */
  private drawStatusIcon(color: number): void {
    this.iconGraphics.clear();
    this.iconGraphics.fillStyle(color, 1);
    this.iconGraphics.fillCircle(14, 18, 4);
  }

  /**
   * 设置 Agent 状态消息
   */
  public setAgentStatus(agentName: string, status: AgentStatus): void {
    const statusConfig: Record<AgentStatus, { message: string; color: number; autoClear: number }> = {
      online:    { message: `Agent ${agentName} is online`, color: 0x00ff00, autoClear: 2000 },
      offline:   { message: `Agent ${agentName} is offline`, color: 0x888888, autoClear: 2000 },
      busy:      { message: `Agent ${agentName} is working...`, color: 0xffff00, autoClear: 0 },
      error:     { message: `Agent ${agentName} encountered an error`, color: 0xff4444, autoClear: 0 }
    };

    const config = statusConfig[status];
    this.drawStatusIcon(config.color);
    this.setMessage(config.message, config.autoClear);
    this.hideProgress();
  }

  /**
   * 设置指令状态消息
   */
  public setCommandStatus(agentName: string, status: CommandStatus, progress?: number): void {
    const statusConfig: Record<CommandStatus, { message: string; color: number; autoClear: number }> = {
      pending:  { message: `Command queued for ${agentName}...`, color: 0x00ffff, autoClear: 0 },
      running:  { message: `Executing command for ${agentName}...`, color: 0xffff00, autoClear: 0 },
      success:  { message: `Command for ${agentName} completed!`, color: 0x00ff00, autoClear: 3000 },
      failed:   { message: `Command for ${agentName} failed!`, color: 0xff4444, autoClear: 0 }
    };

    const config = statusConfig[status];
    this.drawStatusIcon(config.color);
    this.setMessage(config.message, config.autoClear);

    // 失败时显示红色文本
    if (status === 'failed') {
      this.messageText.setColor(COLORS.errorText);
    } else {
      this.messageText.setColor(COLORS.text);
    }

    if (status === 'running' && progress !== undefined) {
      this.showProgress(progress);
    } else {
      this.hideProgress();
    }
  }

  /**
   * 设置消息
   */
  public setMessage(message: string, autoClear: number = 3000): void {
    // 清除之前的定时器
    if (this.clearTimer) {
      this.clearTimer.remove();
      this.clearTimer = null;
    }

    this.messageText.setText(message);
    this.setVisible(true);

    if (autoClear > 0) {
      this.clearTimer = this.scene.time.delayedCall(autoClear, () => {
        this.clear();
      });
    }
  }

  /**
   * 显示进度条
   */
  public showProgress(progress: number): void {
    const barWidth = this.width - 100; // 留出左右边距和百分比文本空间
    const barHeight = 6;
    const barY = 26;
    const barX = 28;
    const fillWidth = Math.floor((progress / 100) * barWidth);

    this.progressBar.clear();

    // 进度条背景
    this.progressBar.fillStyle(COLORS.progressBg, 1);
    this.progressBar.fillRoundedRect(barX, barY, barWidth, barHeight, 3);

    // 进度条填充
    this.progressBar.fillStyle(COLORS.progressFill, 1);
    this.progressBar.fillRoundedRect(barX, barY, fillWidth, barHeight, 3);

    // 进度百分比
    this.progressText.setText(`${Math.floor(progress)}%`);
  }

  /**
   * 隐藏进度条
   */
  public hideProgress(): void {
    this.progressBar.clear();
    this.progressText.setText('');
  }

  /**
   * 清除状态栏
   */
  public clear(): void {
    this.messageText.setText('');
    this.messageText.setColor(COLORS.text);
    this.hideProgress();
    this.iconGraphics.clear();
    this.setVisible(false);
    
    if (this.clearTimer) {
      this.clearTimer.remove();
      this.clearTimer = null;
    }
  }
}
```

### 视觉设计（遵循 Stratix UI/UX 规范）
```
┌─────────────────────────────────────────────────────────────┐
│─────────────────────────────────────────────────────────────│ ← 顶部绿色边线 (alpha=0.5)
│ ● Agent stratix-writer-001 is working...            42%    │
│   ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────────────────────────────────┘
   ↑ 状态图标      ↑ 消息文本 (14px 白色)       ↑ 进度百分比
   (6px 彩色圆点)                              ↑ 进度条 (6px 高)
   
   背景: 半透明黑色 (alpha=0.7)
   圆角: 8px
```

### 组件尺寸
| 属性 | 值 |
|------|-----|
| 宽度 | 屏幕宽度 80% |
| 高度 | 40px |
| 圆角 | 8px |
| 内边距 | 左 28px, 右 50px |
| 位置 | 屏幕底部居中 |

### 状态图标颜色
| 状态 | 图标颜色 |
|------|----------|
| online | 绿色 0x00ff00 |
| offline | 灰色 0x888888 |
| busy | 黄色 0xffff00 |
| error | 红色 0xff4444 |
| pending | 青色 0x00ffff |

### 在场景中使用
```typescript
// 在 StratixRTSGameScene 中
private statusBar: StatusBar;

create(): void {
  // 创建状态栏，位于屏幕底部居中
  const barWidth = this.cameras.main.width * 0.8;
  const barX = (this.cameras.main.width - barWidth) / 2;
  const barY = this.cameras.main.height - 50;
  
  this.statusBar = new StatusBar(this, barX, barY, barWidth);
  this.add.existing(this.statusBar);
}

// 响应事件更新状态栏
private onAgentStatusUpdate(data: { agentId: string; status: AgentStatus }): void {
  const sprite = this.agentSprites.get(data.agentId);
  if (sprite) {
    this.statusBar.setAgentStatus(sprite.getAgentName(), data.status);
  }
}

// 窗口大小改变时重新定位
private onResize(): void {
  const barWidth = this.cameras.main.width * 0.8;
  const barX = (this.cameras.main.width - barWidth) / 2;
  const barY = this.cameras.main.height - 50;
  
  this.statusBar.setPosition(barX, barY);
  // 需要重新绘制背景...
}
```

## 开发步骤
- [ ] 步骤 1：创建 ui/StatusBar.ts 继承 Container
- [ ] 步骤 2：实现背景绘制（使用 Graphics）
- [ ] 步骤 3：实现状态图标绘制
- [ ] 步骤 4：实现消息文本显示
- [ ] 步骤 5：实现进度条组件
- [ ] 步骤 6：实现 setAgentStatus() 状态显示
- [ ] 步骤 7：实现 setCommandStatus() 指令状态
- [ ] 步骤 8：实现自动清除定时器
- [ ] 步骤 9：设置 setScrollFactor(0) 固定位置

## 测试用例
| 用例编号 | 场景 | 操作步骤 | 预期结果 |
|----------|------|----------|----------|
| TC-001 | 显示消息 | 调用 setMessage() | 消息正确显示 |
| TC-002 | Agent 上线 | 调用 setAgentStatus('online') | 显示绿色圆点 + "is online" |
| TC-003 | 进度更新 | 调用 showProgress(50) | 进度条填充 50%，显示 "50%" |
| TC-004 | 自动清除 | 设置 2 秒自动清除 | 2 秒后消息消失 |
| TC-005 | 错误保持 | 显示错误消息 | 消息持续显示，文本为红色 |
| TC-006 | 手动清除 | 调用 clear() | 状态栏清空并隐藏 |
| TC-007 | 固定位置 | 移动摄像机 | 状态栏不随摄像机移动 |
| TC-008 | 状态图标 | 查看不同状态 | 图标颜色符合 Stratix 色彩系统 |

## 验收标准
- [ ] 继承 Phaser.GameObjects.Container
- [ ] 使用 setScrollFactor(0) 固定在屏幕上
- [ ] 背景为半透明黑色，顶部有绿色边线
- [ ] 状态图标为 6px 圆点，颜色符合 Stratix 色彩系统
- [ ] 消息文本 14px 白色
- [ ] 进度条高度 6px，绿色填充
- [ ] 成功消息自动清除（3秒）
- [ ] 错误消息需手动清除，文本为红色
- [ ] 高 z-index 确保在最上层

## 依赖
- phaser (3.x)
- feature_002 (Agent Sprite System)

## 参考 API
- `Phaser.GameObjects.Container` - 容器基类
- `setScrollFactor(0)` - 固定不受摄像机滚动影响
- `scene.time.delayedCall(delay, callback)` - 延迟调用
- `graphics.fillRoundedRect()` - 绘制圆角矩形
- `graphics.lineBetween()` - 绘制直线

## 变更记录
| 日期 | 变更内容 | 变更人 |
|------|----------|--------|
| 2026-02-22 | 初始创建 | - |
| 2026-02-22 | 更新为 Container + Graphics 实现 | AI Agent |
| 2026-02-22 | 添加 UI/UX 设计规范，增加状态图标 | AI Agent |

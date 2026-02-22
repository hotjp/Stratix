import Phaser from 'phaser';
import { StratixAgentConfig } from '../../stratix-core/stratix-protocol';

export type AgentStatus = 'online' | 'offline' | 'busy' | 'error';
export type CommandStatus = 'pending' | 'running' | 'success' | 'failed';
export type AgentType = 'writer' | 'dev' | 'analyst' | string;

export const COLORS = {
  status: {
    online: 0x00ff00,
    offline: 0x888888,
    busy: 0xffff00,
    error: 0xff4444,
    pending: 0x00ffff
  },
  type: {
    writer: 0x4A90E2,
    dev: 0x9B59B6,
    analyst: 0xE67E22
  },
  ui: {
    selection: 0x00ff00
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
  private busyTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, config: StratixAgentConfig) {
    super(scene, x, y);
    
    this.agentId = config.agentId;
    this.agentName = config.name;
    this.agentType = config.type;

    this.selectionRing = scene.add.graphics();
    this.drawSelectionRing();
    this.selectionRing.setVisible(false);
    this.add(this.selectionRing);

    this.sprite = scene.add.sprite(0, 0, 'stratix-agent');
    this.add(this.sprite);

    this.typeIcon = scene.add.graphics();
    this.drawTypeIcon(config.type);
    this.add(this.typeIcon);

    this.statusIndicator = scene.add.graphics();
    this.drawStatusIndicator(COLORS.status.online);
    this.add(this.statusIndicator);

    this.nameText = scene.add.text(0, -24, config.name, {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 6, y: 2 }
    });
    this.nameText.setOrigin(0.5);
    this.add(this.nameText);

    this.sprite.setInteractive({ useHandCursor: true });
    this.setData('agentId', config.agentId);
    this.setData('agentType', config.type);
    
    this.setDepth(y);
  }

  private drawSelectionRing(): void {
    this.selectionRing.clear();
    this.selectionRing.lineStyle(2, COLORS.ui.selection, 1);
    this.selectionRing.strokeCircle(0, 0, 22);
  }

  private drawStatusIndicator(color: number): void {
    this.statusIndicator.clear();
    this.statusIndicator.fillStyle(color, 1);
    this.statusIndicator.fillCircle(0, -16, 3);
  }

  private drawTypeIcon(type: AgentType): void {
    const color = COLORS.type[type as keyof typeof COLORS.type] || 0xffffff;
    this.typeIcon.clear();
    this.typeIcon.fillStyle(color, 1);
    this.typeIcon.fillCircle(10, 10, 4);
  }

  public setAgentStatus(status: AgentStatus): void {
    this.currentStatus = status;
    const color = COLORS.status[status];
    
    this.drawStatusIndicator(color);
    
    this.stopBusyAnimation();

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

    if (this.isSelected) {
      this.sprite.setTint(COLORS.ui.selection);
    }
  }

  public setCommandStatus(status: CommandStatus): void {
    const statusColorMap: Record<CommandStatus, number> = {
      pending: COLORS.status.pending,
      running: COLORS.status.busy,
      success: COLORS.status.online,
      failed: COLORS.status.error
    };
    const color = statusColorMap[status];
    this.sprite.setTint(color);

    switch (status) {
      case 'success':
        this.playSuccessAnimation();
        break;
      case 'failed':
        this.playErrorAnimation();
        break;
    }
  }

  public setHighlight(selected: boolean): void {
    this.isSelected = selected;
    this.selectionRing.setVisible(selected);
    
    if (selected) {
      this.sprite.setTint(COLORS.ui.selection);
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

  private startBusyAnimation(): void {
    this.busyTween = this.scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 1, to: 0.7 },
      duration: 500,
      yoyo: true,
      repeat: -1
    });
  }

  private stopBusyAnimation(): void {
    if (this.busyTween) {
      this.busyTween.stop();
      this.busyTween = null;
      this.sprite.setAlpha(1);
    }
  }

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

  public getCurrentStatus(): AgentStatus {
    return this.currentStatus;
  }

  public isAgentSelected(): boolean {
    return this.isSelected;
  }

  public updateDepth(): void {
    this.setDepth(this.y);
  }

  public destroy(): void {
    this.stopBusyAnimation();
    super.destroy();
  }
}

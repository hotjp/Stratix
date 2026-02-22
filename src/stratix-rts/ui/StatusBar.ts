import Phaser from 'phaser';
import { AgentStatus, CommandStatus } from '../sprites/AgentSprite';

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
  private barWidth: number;
  private barHeight: number = 40;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number) {
    super(scene, x, y);
    
    this.barWidth = width;
    
    this.background = scene.add.graphics();
    this.drawBackground();
    this.add(this.background);

    this.iconGraphics = scene.add.graphics();
    this.add(this.iconGraphics);

    this.messageText = scene.add.text(28, 10, '', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: COLORS.text
    });
    this.add(this.messageText);

    this.progressBar = scene.add.graphics();
    this.add(this.progressBar);

    this.progressText = scene.add.text(width - 20, 10, '', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: COLORS.text
    });
    this.progressText.setOrigin(1, 0);
    this.add(this.progressText);

    this.setScrollFactor(0);
    this.setDepth(2000);
    
    this.setVisible(false);
  }

  private drawBackground(): void {
    this.background.clear();
    
    this.background.fillStyle(COLORS.background, COLORS.backgroundAlpha);
    this.background.fillRoundedRect(0, 0, this.barWidth, this.barHeight, 8);
    
    this.background.lineStyle(1, COLORS.border, COLORS.borderAlpha);
    this.background.lineBetween(0, 0, this.barWidth, 0);
  }

  private drawStatusIcon(color: number): void {
    this.iconGraphics.clear();
    this.iconGraphics.fillStyle(color, 1);
    this.iconGraphics.fillCircle(14, 18, 4);
  }

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

  public setMessage(message: string, autoClear: number = 3000): void {
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

  public showProgress(progress: number): void {
    const progressBarWidth = this.barWidth - 100;
    const progressBarHeight = 6;
    const barY = 26;
    const barX = 28;
    const clampedProgress = Math.max(0, Math.min(100, progress));
    const fillWidth = Math.floor((clampedProgress / 100) * progressBarWidth);

    this.progressBar.clear();

    this.progressBar.fillStyle(COLORS.progressBg, 1);
    this.progressBar.fillRoundedRect(barX, barY, progressBarWidth, progressBarHeight, 3);

    if (fillWidth > 0) {
      this.progressBar.fillStyle(COLORS.progressFill, 1);
      this.progressBar.fillRoundedRect(barX, barY, fillWidth, progressBarHeight, 3);
    }

    this.progressText.setText(`${Math.floor(clampedProgress)}%`);
  }

  public hideProgress(): void {
    this.progressBar.clear();
    this.progressText.setText('');
  }

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

  public resize(width: number): void {
    this.barWidth = width;
    this.progressText.setX(width - 20);
    this.drawBackground();
  }
}

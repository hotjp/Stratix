import Phaser from 'phaser';

export interface ToolbarConfig {
  buttonWidth: number;
  buttonHeight: number;
  buttonSpacing: number;
  buttonColor: number;
  buttonHoverColor: number;
  buttonActiveColor: number;
  textColor: string;
  borderColor: number;
}

const DEFAULT_CONFIG: ToolbarConfig = {
  buttonWidth: 100,
  buttonHeight: 32,
  buttonSpacing: 8,
  buttonColor: 0x2a2a4e,
  buttonHoverColor: 0x3a3a6e,
  buttonActiveColor: 0xff6600,
  textColor: '#ffffff',
  borderColor: 0x00ff00
};

interface ToolbarButton {
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
  callback: () => void;
  isActive: boolean;
}

export class Toolbar extends Phaser.GameObjects.Container {
  private config: ToolbarConfig;
  private buttons: ToolbarButton[] = [];
  private activeButtonKey: string | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, config?: Partial<ToolbarConfig>) {
    super(scene, x, y);
    
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.setScrollFactor(0);
    this.setDepth(2001);
  }

  public addButton(key: string, label: string, callback: () => void, isToggle: boolean = false): void {
    const buttonX = this.buttons.length * (this.config.buttonWidth + this.config.buttonSpacing);
    
    const container = this.scene.add.container(buttonX, 0);
    
    const background = this.scene.add.rectangle(
      this.config.buttonWidth / 2,
      this.config.buttonHeight / 2,
      this.config.buttonWidth,
      this.config.buttonHeight,
      this.config.buttonColor,
      1
    );
    background.setStrokeStyle(1, this.config.borderColor, 0.5);
    container.add(background);
    
    const text = this.scene.add.text(
      this.config.buttonWidth / 2,
      this.config.buttonHeight / 2,
      label,
      {
        fontSize: '12px',
        fontFamily: 'Arial, sans-serif',
        color: this.config.textColor
      }
    );
    text.setOrigin(0.5);
    container.add(text);
    
    const button: ToolbarButton = {
      container,
      background,
      text,
      callback: () => {
        if (isToggle) {
          this.toggleButton(key);
        }
        callback();
      },
      isActive: false
    };
    
    background.setInteractive({ useHandCursor: true });
    
    background.on('pointerover', () => {
      if (!button.isActive) {
        background.setFillStyle(this.config.buttonHoverColor);
      }
    });
    
    background.on('pointerout', () => {
      if (!button.isActive) {
        background.setFillStyle(this.config.buttonColor);
      }
    });
    
    background.on('pointerdown', () => {
      button.callback();
    });
    
    this.add(container);
    this.buttons.push(button);
  }

  public setButtonActive(key: string, active: boolean): void {
    const button = this.buttons.find((_, index) => {
      const btnKey = Object.keys(this.buttons)[index];
      return btnKey === key;
    });
    
    if (button) {
      button.isActive = active;
      button.background.setFillStyle(
        active ? this.config.buttonActiveColor : this.config.buttonColor
      );
      
      if (active) {
        this.activeButtonKey = key;
      } else if (this.activeButtonKey === key) {
        this.activeButtonKey = null;
      }
    }
  }

  private toggleButton(key: string): void {
    const buttonIndex = this.buttons.findIndex((_, index) => {
      const btnKey = Object.keys(this.buttons)[index];
      return btnKey === key;
    });
    
    if (buttonIndex >= 0) {
      const button = this.buttons[buttonIndex];
      const newState = !button.isActive;
      
      if (this.activeButtonKey && this.activeButtonKey !== key) {
        this.deactivateButton(this.activeButtonKey);
      }
      
      button.isActive = newState;
      button.background.setFillStyle(
        newState ? this.config.buttonActiveColor : this.config.buttonColor
      );
      
      this.activeButtonKey = newState ? key : null;
    }
  }

  private deactivateButton(key: string): void {
    const buttonIndex = this.buttons.findIndex((_, index) => {
      const btnKey = Object.keys(this.buttons)[index];
      return btnKey === key;
    });
    
    if (buttonIndex >= 0) {
      const button = this.buttons[buttonIndex];
      button.isActive = false;
      button.background.setFillStyle(this.config.buttonColor);
    }
  }

  public setActiveButton(key: string | null): void {
    if (this.activeButtonKey) {
      this.deactivateButton(this.activeButtonKey);
    }
    
    if (key) {
      this.setButtonActive(key, true);
    }
    
    this.activeButtonKey = key;
  }

  public getActiveButtonKey(): string | null {
    return this.activeButtonKey;
  }

  public show(): void {
    this.setVisible(true);
  }

  public hide(): void {
    this.setVisible(false);
  }

  public destroy(): void {
    this.buttons.forEach(button => {
      button.background.destroy();
      button.text.destroy();
      button.container.destroy();
    });
    this.buttons = [];
    super.destroy();
  }
}

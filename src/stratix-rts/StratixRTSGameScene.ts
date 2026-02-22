import Phaser from 'phaser';
import { StratixAgentConfig } from '../stratix-core/stratix-protocol';
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, DEFAULT_ZOOM } from './constants';
import { AgentSprite, AgentStatus, CommandStatus } from './sprites/AgentSprite';
import { StratixRTSEventManager } from './StratixRTSEventManager';
import { InputHandler, InputCallbacks } from './utils/InputHandler';
import { SelectBox } from './ui/SelectBox';

export { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM, BG_COLOR } from './constants';

export default class StratixRTSGameScene extends Phaser.Scene {
  private eventManager: StratixRTSEventManager;
  private inputHandler: InputHandler;
  private selectBox: SelectBox;
  private agentSprites: Map<string, AgentSprite> = new Map();
  private selectedAgentIds: Set<string> = new Set();

  constructor() {
    super({ key: 'StratixRTSGameScene' });
  }

  preload(): void {
    this.generatePlaceholderTextures();
  }

  private generatePlaceholderTextures(): void {
    const tileGraphics = this.make.graphics();
    tileGraphics.fillStyle(0x1a1a2e, 1);
    tileGraphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    tileGraphics.lineStyle(1, 0x2a2a4e, 0.3);
    tileGraphics.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
    for (let i = 0; i < 3; i++) {
      const starX = Phaser.Math.Between(2, TILE_SIZE - 2);
      const starY = Phaser.Math.Between(2, TILE_SIZE - 2);
      tileGraphics.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.2, 0.5));
      tileGraphics.fillCircle(starX, starY, 1);
    }
    tileGraphics.generateTexture('stratix-tile', TILE_SIZE, TILE_SIZE);
    tileGraphics.destroy();

    const agentGraphics = this.make.graphics();
    agentGraphics.fillStyle(0x00ff00, 1);
    agentGraphics.fillCircle(16, 16, 12);
    agentGraphics.fillStyle(0xffffff, 1);
    agentGraphics.fillCircle(12, 12, 3);
    agentGraphics.fillCircle(20, 12, 3);
    agentGraphics.lineStyle(2, 0x00aa00, 1);
    agentGraphics.beginPath();
    agentGraphics.arc(16, 18, 5, 0, Math.PI);
    agentGraphics.strokePath();
    agentGraphics.generateTexture('stratix-agent', 32, 32);
    agentGraphics.destroy();
  }

  create(): void {
    this.initStratixMap();
    this.initCamera();
    this.initSelectBox();
    this.initInputHandler();
    this.initEventManager();
  }

  update(_time: number, _delta: number): void {
    this.inputHandler?.update();
  }

  private initStratixMap(): void {
    this.add.tileSprite(
      MAP_WIDTH / 2,
      MAP_HEIGHT / 2,
      MAP_WIDTH,
      MAP_HEIGHT,
      'stratix-tile'
    );
  }

  private initCamera(): void {
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.cameras.main.setZoom(DEFAULT_ZOOM);
  }

  private initSelectBox(): void {
    this.selectBox = new SelectBox(this);
  }

  private initInputHandler(): void {
    const callbacks: InputCallbacks = {
      onSelect: (agentIds: string[]) => this.handleSelect(agentIds),
      onDeselect: () => this.clearSelection(),
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
      onZoom: (zoom) => console.log('[StratixRTS] Zoom:', zoom.toFixed(2))
    };

    this.inputHandler = new InputHandler(this, callbacks);
  }

  private initEventManager(): void {
    this.eventManager = new StratixRTSEventManager(this);
    this.eventManager.subscribeAll();

    this.events.on('stratix:create-agent', this.onCreateAgent, this);
    this.events.on('stratix:update-agent-status', this.onUpdateAgentStatus, this);
    this.events.on('stratix:update-command-status', this.onUpdateCommandStatus, this);
  }

  private handleSelect(agentIds: string[]): void {
    this.clearSelection();
    agentIds.forEach(id => {
      const sprite = this.agentSprites.get(id);
      if (sprite) {
        sprite.setHighlight(true);
        this.selectedAgentIds.add(id);
      }
    });
  }

  private selectAgentsInRect(rect: Phaser.Geom.Rectangle): void {
    this.clearSelection();
    this.agentSprites.forEach((sprite, agentId) => {
      if (Phaser.Geom.Rectangle.Contains(rect, sprite.x, sprite.y)) {
        sprite.setHighlight(true);
        this.selectedAgentIds.add(agentId);
      }
    });
  }

  private handleCommand(target: { x: number; y: number }): void {
    if (this.selectedAgentIds.size === 0) return;
    console.log('[StratixRTS] Command to:', target, 'agents:', Array.from(this.selectedAgentIds));
  }

  private onCreateAgent(config: StratixAgentConfig): void {
    this.addAgentSprite(config);
  }

  private onUpdateAgentStatus(data: { agentId: string; status: AgentStatus }): void {
    const sprite = this.agentSprites.get(data.agentId);
    if (sprite) {
      sprite.setAgentStatus(data.status);
    }
  }

  private onUpdateCommandStatus(data: { agentId: string; commandStatus: CommandStatus }): void {
    const sprite = this.agentSprites.get(data.agentId);
    if (sprite) {
      sprite.setCommandStatus(data.commandStatus);
    }
  }

  public addAgentSprite(config: StratixAgentConfig): AgentSprite {
    const x = Phaser.Math.Between(100, MAP_WIDTH - 100);
    const y = Phaser.Math.Between(100, MAP_HEIGHT - 100);
    
    const agentSprite = new AgentSprite(this, x, y, config);
    this.add.existing(agentSprite);
    
    this.agentSprites.set(config.agentId, agentSprite);
    
    return agentSprite;
  }

  public getAgentSprites(): Map<string, AgentSprite> {
    return this.agentSprites;
  }

  public getSelectedAgentIds(): Set<string> {
    return this.selectedAgentIds;
  }

  public getEventManager(): StratixRTSEventManager {
    return this.eventManager;
  }

  public selectAgent(agentId: string): void {
    const sprite = this.agentSprites.get(agentId);
    if (sprite) {
      this.selectedAgentIds.add(agentId);
      sprite.setHighlight(true);
    }
  }

  public deselectAgent(agentId: string): void {
    const sprite = this.agentSprites.get(agentId);
    if (sprite) {
      this.selectedAgentIds.delete(agentId);
      sprite.setHighlight(false);
    }
  }

  public clearSelection(): void {
    this.selectedAgentIds.forEach(agentId => {
      const sprite = this.agentSprites.get(agentId);
      if (sprite) {
        sprite.setHighlight(false);
      }
    });
    this.selectedAgentIds.clear();
  }

  shutdown(): void {
    this.inputHandler?.destroy();
    this.selectBox?.destroy();
    this.eventManager?.unsubscribeAll();
    this.events.off('stratix:create-agent');
    this.events.off('stratix:update-agent-status');
    this.events.off('stratix:update-command-status');
  }
}

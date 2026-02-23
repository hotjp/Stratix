import Phaser from 'phaser';
import StratixRTSGameScene, { BG_COLOR } from './StratixRTSGameScene';

export interface StratixRTSConfig {
  parent: string | HTMLElement;
  width?: number;
  height?: number;
}

export function createStratixRTS(config: StratixRTSConfig): Phaser.Game {
  const parentEl = typeof config.parent === 'string' 
    ? document.getElementById(config.parent) 
    : config.parent;
  
  const width = config.width ?? parentEl?.clientWidth ?? 800;
  const height = config.height ?? parentEl?.clientHeight ?? 600;
  
  const gameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: config.parent,
    width: width,
    height: height,
    backgroundColor: BG_COLOR,
    pixelArt: true,
    scene: [StratixRTSGameScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: width,
      height: height,
      parent: config.parent
    }
  };

  const game = new Phaser.Game(gameConfig);
  
  const handleResize = () => {
    if (!parentEl) return;
    
    const newWidth = config.width ?? parentEl.clientWidth;
    const newHeight = config.height ?? parentEl.clientHeight;
    
    game.scale.resize(newWidth, newHeight);
  };
  
  window.addEventListener('resize', handleResize);
  
  const originalDestroy = game.destroy.bind(game);
  game.destroy = (removeCanvas: boolean = false, noReturn: boolean = false) => {
    window.removeEventListener('resize', handleResize);
    originalDestroy(removeCanvas, noReturn);
  };
  
  game.events.once('ready', () => {
    game.events.emit('ready');
  });
  
  return game;
}

export { default as StratixRTSGameScene } from './StratixRTSGameScene';
export { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM, BG_COLOR } from './constants';
export { AgentSprite, COLORS } from './sprites/AgentSprite';
export type { AgentStatus, CommandStatus, AgentType } from './sprites/AgentSprite';
export { StratixRTSEventManager } from './StratixRTSEventManager';
export { InputHandler } from './utils/InputHandler';
export type { InputConfig, InputCallbacks, InputMode } from './utils/InputHandler';
export { SelectBox } from './ui/SelectBox';
export type { SelectBoxConfig } from './ui/SelectBox';
export { StatusBar } from './ui/StatusBar';
export { Toolbar } from './ui/Toolbar';
export type { ToolbarConfig } from './ui/Toolbar';
export { TaskZone } from './zones/TaskZone';
export type { TaskZoneConfig, CornerPosition } from './zones/TaskZone';
export { TaskZonePreview } from './zones/TaskZonePreview';
export type { TaskZonePreviewConfig } from './zones/TaskZonePreview';
export { CommandSystem } from './systems/CommandSystem';
export type { Command, CommandType, MoveCommand, AttackCommand, AttackMoveCommand, StopCommand, PatrolCommand, HoldPositionCommand, GatherCommand, CommandContext } from './systems/CommandSystem';
export { ControlGroupSystem } from './systems/ControlGroupSystem';
export type { ControlGroup } from './systems/ControlGroupSystem';

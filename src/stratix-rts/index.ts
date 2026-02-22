import Phaser from 'phaser';
import StratixRTSGameScene, { BG_COLOR } from './StratixRTSGameScene';

export interface StratixRTSConfig {
  parent: string | HTMLElement;
  width?: number;
  height?: number;
}

export function createStratixRTS(config: StratixRTSConfig): Phaser.Game {
  const width = config.width ?? 800;
  const height = config.height ?? 600;
  
  const gameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: config.parent,
    width: width,
    height: height,
    backgroundColor: BG_COLOR,
    pixelArt: true,
    scene: [StratixRTSGameScene],
    scale: {
      mode: Phaser.Scale.NONE,
      width: width,
      height: height
    }
  };

  const game = new Phaser.Game(gameConfig);
  
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
export type { InputConfig, InputCallbacks } from './utils/InputHandler';
export { SelectBox } from './ui/SelectBox';
export type { SelectBoxConfig } from './ui/SelectBox';
export { StatusBar } from './ui/StatusBar';

/**
 * 动画配置
 */

import { ANIMATION_OFFSETS, ANIMATION_CONFIGS, FRAME_SIZE } from '../constants';

export interface AnimationInfo {
  name: string;
  label: string;
  offset: number;
  rows: number;
  frames: number[];
  folderName?: string;
}

export const ANIMATIONS: AnimationInfo[] = [
  { name: 'spellcast', label: '施法', offset: ANIMATION_OFFSETS.spellcast, rows: 4, frames: ANIMATION_CONFIGS.spellcast.cycle },
  { name: 'thrust', label: '刺击', offset: ANIMATION_OFFSETS.thrust, rows: 4, frames: ANIMATION_CONFIGS.thrust.cycle },
  { name: 'walk', label: '行走', offset: ANIMATION_OFFSETS.walk, rows: 4, frames: ANIMATION_CONFIGS.walk.cycle },
  { name: 'slash', label: '挥砍', offset: ANIMATION_OFFSETS.slash, rows: 4, frames: ANIMATION_CONFIGS.slash.cycle },
  { name: 'shoot', label: '射击', offset: ANIMATION_OFFSETS.shoot, rows: 4, frames: ANIMATION_CONFIGS.shoot.cycle },
  { name: 'hurt', label: '受伤', offset: ANIMATION_OFFSETS.hurt, rows: 1, frames: ANIMATION_CONFIGS.hurt.cycle },
  { name: 'climb', label: '攀爬', offset: ANIMATION_OFFSETS.climb, rows: 1, frames: ANIMATION_CONFIGS.climb.cycle },
  { name: 'idle', label: '待机', offset: ANIMATION_OFFSETS.idle, rows: 4, frames: ANIMATION_CONFIGS.idle.cycle },
  { name: 'jump', label: '跳跃', offset: ANIMATION_OFFSETS.jump, rows: 4, frames: ANIMATION_CONFIGS.jump.cycle },
  { name: 'sit', label: '坐下', offset: ANIMATION_OFFSETS.sit, rows: 4, frames: ANIMATION_CONFIGS.sit.cycle },
  { name: 'emote', label: '表情', offset: ANIMATION_OFFSETS.emote, rows: 4, frames: ANIMATION_CONFIGS.emote.cycle },
  { name: 'run', label: '奔跑', offset: ANIMATION_OFFSETS.run, rows: 4, frames: ANIMATION_CONFIGS.run.cycle },
  { name: 'combat_idle', label: '战斗待机', offset: ANIMATION_OFFSETS.combat_idle, rows: 4, frames: ANIMATION_CONFIGS.combat_idle.cycle, folderName: 'combat_idle' },
  { name: 'backslash', label: '反手斩', offset: ANIMATION_OFFSETS.backslash, rows: 4, frames: ANIMATION_CONFIGS.backslash.cycle },
  { name: 'halfslash', label: '半斩', offset: ANIMATION_OFFSETS.halfslash, rows: 4, frames: ANIMATION_CONFIGS.halfslash.cycle }
];

export function getAnimationInfo(name: string): AnimationInfo | undefined {
  return ANIMATIONS.find(a => a.name === name || a.folderName === name);
}

export function getAnimationOffset(name: string): number {
  return ANIMATION_OFFSETS[name] ?? 0;
}

export function getAnimationHeight(name: string): number {
  const config = ANIMATION_CONFIGS[name];
  return config ? config.num * FRAME_SIZE : FRAME_SIZE;
}

export function getFramePosition(animation: string, frame: number, direction: number): { x: number; y: number } {
  const offset = getAnimationOffset(animation);
  const x = frame * FRAME_SIZE;
  const y = offset + direction * FRAME_SIZE;
  return { x, y };
}

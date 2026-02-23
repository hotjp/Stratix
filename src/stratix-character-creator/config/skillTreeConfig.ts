/**
 * 技能树配置
 * 预定义技能节点数据
 */

import type { SkillNode } from '../types';

export const SKILL_NODES: SkillNode[] = [
  {
    nodeId: 'skill_base_health',
    name: '基础体质',
    description: '提升生命值上限',
    prerequisites: [],
    attributes: { health: 10 },
    position: { x: 0, y: 0 }
  },
  {
    nodeId: 'skill_base_attack',
    name: '基础攻击',
    description: '提升基础攻击力',
    prerequisites: [],
    attributes: { attack: 2 },
    position: { x: 1, y: 0 }
  },
  {
    nodeId: 'skill_base_defense',
    name: '基础防御',
    description: '提升基础防御力',
    prerequisites: [],
    attributes: { defense: 2 },
    position: { x: 2, y: 0 }
  },
  {
    nodeId: 'skill_health_boost',
    name: '体质强化',
    description: '大幅提升生命值',
    prerequisites: ['skill_base_health'],
    attributes: { health: 20 },
    position: { x: 0, y: 1 }
  },
  {
    nodeId: 'skill_attack_combo',
    name: '连击',
    description: '攻击时有几率连击',
    prerequisites: ['skill_base_attack'],
    attributes: { attack: 3, critChance: 5 },
    position: { x: 1, y: 1 }
  },
  {
    nodeId: 'skill_shield_mastery',
    name: '盾牌精通',
    description: '提升盾牌防御效果',
    prerequisites: ['skill_base_defense'],
    attributes: { defense: 5, blockChance: 10 },
    position: { x: 2, y: 1 }
  },
  {
    nodeId: 'skill_vitality',
    name: '生命力',
    description: '持续恢复生命',
    prerequisites: ['skill_health_boost'],
    attributes: { health: 15, regen: 1 },
    position: { x: 0, y: 2 }
  },
  {
    nodeId: 'skill_fury',
    name: '狂暴',
    description: '低血量时提升攻击',
    prerequisites: ['skill_attack_combo'],
    attributes: { attack: 5, critDamage: 20 },
    position: { x: 1, y: 2 }
  },
  {
    nodeId: 'skill_iron_skin',
    name: '钢铁之躯',
    description: '大幅提升防御',
    prerequisites: ['skill_shield_mastery'],
    attributes: { defense: 8, armor: 5 },
    position: { x: 2, y: 2 }
  },
  {
    nodeId: 'skill_speed_base',
    name: '敏捷训练',
    description: '提升移动速度',
    prerequisites: [],
    attributes: { speed: 1 },
    position: { x: 3, y: 0 }
  },
  {
    nodeId: 'skill_dodge',
    name: '闪避',
    description: '有几率闪避攻击',
    prerequisites: ['skill_speed_base'],
    attributes: { speed: 1, dodgeChance: 5 },
    position: { x: 3, y: 1 }
  },
  {
    nodeId: 'skill_evasion',
    name: ' evasion',
    description: '大幅提升闪避率',
    prerequisites: ['skill_dodge'],
    attributes: { dodgeChance: 10, speed: 1 },
    position: { x: 3, y: 2 }
  },
  {
    nodeId: 'skill_magic_base',
    name: '魔法入门',
    description: '提升魔法值上限',
    prerequisites: [],
    attributes: { mana: 10 },
    position: { x: 4, y: 0 }
  },
  {
    nodeId: 'skill_mana_regen',
    name: '冥想',
    description: '提升魔法恢复速度',
    prerequisites: ['skill_magic_base'],
    attributes: { mana: 15, manaRegen: 1 },
    position: { x: 4, y: 1 }
  },
  {
    nodeId: 'skill_arcane_power',
    name: '奥术之力',
    description: '提升魔法伤害',
    prerequisites: ['skill_mana_regen'],
    attributes: { magicDamage: 5, mana: 10 },
    position: { x: 4, y: 2 }
  }
];

export const SKILL_TREE_CONFIG = {
  nodes: SKILL_NODES,
  maxPoints: 10
};

export const SKILL_CATEGORIES = {
  combat: { name: '战斗', color: '#ff6b6b', icon: '⚔️' },
  defense: { name: '防御', color: '#4ecdc4', icon: '🛡️' },
  mobility: { name: '机动', color: '#45b7d1', icon: '💨' },
  magic: { name: '魔法', color: '#a55eea', icon: '✨' },
  utility: { name: '辅助', color: '#95a5a6', icon: '🔧' }
};

export const ATTRIBUTE_LABELS: Record<string, string> = {
  health: '生命值',
  attack: '攻击力',
  defense: '防御力',
  speed: '速度',
  mana: '魔法值',
  critChance: '暴击率',
  critDamage: '暴击伤害',
  blockChance: '格挡率',
  dodgeChance: '闪避率',
  armor: '护甲',
  regen: '生命恢复',
  manaRegen: '魔法恢复',
  magicDamage: '魔法伤害'
};

import { StratixAgentConfig, StratixSkillConfig } from '@/stratix-core/stratix-protocol';

export type HeroType = 'writer' | 'dev' | 'analyst';

export interface HeroTemplateBase {
  getTemplate(agentId?: string): StratixAgentConfig;
  getType(): HeroType;
  getName(): string;
  getDescription(): string;
}

export function generateAgentId(type: HeroType): string {
  return `stratix-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${type}`;
}

export function generateSkillId(action: string): string {
  return `stratix-skill-${action}`;
}

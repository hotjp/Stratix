import { StratixAgentConfig } from '@/stratix-core/stratix-protocol';
import { HeroTemplateBase, HeroType, generateAgentId, generateSkillId } from './types';

export class WriterHeroTemplate implements HeroTemplateBase {
  private static readonly TYPE: HeroType = 'writer';
  private static readonly NAME = '文案英雄';
  private static readonly DESCRIPTION = '专业文案创作者，擅长各类文案撰写，语言生动、贴合主题，高效产出高质量内容';

  getType(): HeroType {
    return WriterHeroTemplate.TYPE;
  }

  getName(): string {
    return WriterHeroTemplate.NAME;
  }

  getDescription(): string {
    return WriterHeroTemplate.DESCRIPTION;
  }

  getTemplate(agentId?: string): StratixAgentConfig {
    const id = agentId || generateAgentId(WriterHeroTemplate.TYPE);
    return {
      agentId: id,
      name: WriterHeroTemplate.NAME,
      type: WriterHeroTemplate.TYPE,
      soul: {
        identity: '专业文案创作者，擅长各类文案撰写，语言生动、贴合主题，高效产出高质量内容',
        goals: [
          '根据用户需求，快速生成符合要求的文案',
          '优化文案语言，提升可读性与传播性',
          '结合用户提供的上下文，保持文案风格统一',
        ],
        personality: '细心、高效、有创意，善于倾听需求，及时调整文案方向',
      },
      memory: {
        shortTerm: [],
        longTerm: [],
        context: '我是 Stratix 星策系统的文案英雄，专注于为用户提供高质量文案撰写服务。',
      },
      skills: [
        {
          skillId: generateSkillId('write-article'),
          name: '快速写文案',
          description: '根据主题、字数要求，生成符合风格的文案，支持调整语气（正式/活泼）',
          parameters: [
            { paramId: 'topic', name: '文案主题', type: 'string', required: true, defaultValue: 'Stratix 星策系统介绍' },
            { paramId: 'wordCount', name: '文案字数', type: 'number', required: true, defaultValue: 500 },
            { paramId: 'tone', name: '语气风格', type: 'string', required: false, defaultValue: '正式' },
          ],
          executeScript: '{"action":"generate_content","params":{"prompt":"写一篇关于{{topic}}的文案，字数{{wordCount}}字，语气{{tone}}"}}',
        },
      ],
      model: { name: 'claude-3-sonnet', params: { temperature: 0.7, topP: 0.9 } },
      openClawConfig: { accountId: id, endpoint: 'http://localhost:8000' },
    };
  }
}

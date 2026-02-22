import {
  StratixAgentConfig,
  StratixSoulConfig,
  StratixMemoryConfig,
  StratixSkillConfig,
  StratixModelConfig,
  StratixOpenClawConfig,
  StratixSkillParameter,
} from '@/stratix-core/stratix-protocol';

export interface OpenClawTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required: string[];
    };
  };
}

export interface OpenClawAgentConfig {
  account_id: string;
  endpoint: string;
  api_key?: string;
  model: string;
  model_params: Record<string, any>;
  system_prompt: string;
  tools: OpenClawTool[];
}

export class ConfigConverter {
  static toOpenClawFormat(config: StratixAgentConfig): OpenClawAgentConfig {
    return {
      account_id: config.openClawConfig.accountId,
      endpoint: config.openClawConfig.endpoint,
      api_key: config.openClawConfig.apiKey,
      model: config.model.name,
      model_params: config.model.params || {},
      system_prompt: this.buildSystemPrompt(config.soul, config.memory),
      tools: this.convertSkillsToTools(config.skills),
    };
  }

  static fromOpenClawFormat(openClawConfig: OpenClawAgentConfig, baseConfig: Partial<StratixAgentConfig> = {}): StratixAgentConfig {
    return {
      agentId: baseConfig.agentId || `stratix-${Date.now()}-imported`,
      name: baseConfig.name || '导入的英雄',
      type: baseConfig.type || 'writer',
      soul: baseConfig.soul || {
        identity: '',
        goals: [],
        personality: '',
      },
      memory: baseConfig.memory || {
        shortTerm: [],
        longTerm: [],
        context: '',
      },
      skills: baseConfig.skills || [],
      model: {
        name: openClawConfig.model,
        params: openClawConfig.model_params,
      },
      openClawConfig: {
        accountId: openClawConfig.account_id,
        endpoint: openClawConfig.endpoint,
        apiKey: openClawConfig.api_key,
      },
    };
  }

  static toJson(config: StratixAgentConfig, pretty: boolean = true): string {
    return pretty ? JSON.stringify(config, null, 2) : JSON.stringify(config);
  }

  static fromJson(json: string): StratixAgentConfig {
    const parsed = JSON.parse(json);
    return this.applyDefaults(parsed);
  }

  static mergeConfigs(base: StratixAgentConfig, override: Partial<StratixAgentConfig>): StratixAgentConfig {
    return {
      ...base,
      ...override,
      soul: {
        ...base.soul,
        ...(override.soul || {}),
      },
      memory: {
        ...base.memory,
        ...(override.memory || {}),
      },
      model: {
        ...base.model,
        ...(override.model || {}),
        params: {
          ...base.model.params,
          ...((override.model as any)?.params || {}),
        },
      },
      openClawConfig: {
        ...base.openClawConfig,
        ...(override.openClawConfig || {}),
      },
      skills: override.skills !== undefined ? override.skills : base.skills,
    };
  }

  private static buildSystemPrompt(soul: StratixSoulConfig, memory: StratixMemoryConfig): string {
    const parts: string[] = [];

    if (soul.identity) {
      parts.push(`## 身份\n${soul.identity}`);
    }

    if (soul.goals && soul.goals.length > 0) {
      parts.push(`## 目标\n${soul.goals.map((g: string, i: number) => `${i + 1}. ${g}`).join('\n')}`);
    }

    if (soul.personality) {
      parts.push(`## 性格\n${soul.personality}`);
    }

    if (memory.context) {
      parts.push(`## 上下文\n${memory.context}`);
    }

    return parts.join('\n\n');
  }

  private static convertSkillsToTools(skills: StratixSkillConfig[]): OpenClawTool[] {
    return skills.map((skill) => ({
      type: 'function' as const,
      function: {
        name: skill.skillId,
        description: skill.description,
        parameters: {
          type: 'object',
          properties: this.convertParametersToProperties(skill.parameters),
          required: skill.parameters.filter((p: StratixSkillParameter) => p.required).map((p: StratixSkillParameter) => p.paramId),
        },
      },
    }));
  }

  private static convertParametersToProperties(parameters: StratixSkillConfig['parameters']): Record<string, any> {
    const properties: Record<string, any> = {};

    parameters.forEach((param: StratixSkillParameter) => {
      properties[param.paramId] = {
        type: param.type,
        description: param.name,
        default: param.defaultValue,
      };
    });

    return properties;
  }

  private static applyDefaults(raw: any): StratixAgentConfig {
    return {
      agentId: raw.agentId || `stratix-${Date.now()}-imported`,
      name: raw.name || '导入的英雄',
      type: raw.type || 'writer',
      soul: raw.soul || { identity: '', goals: [], personality: '' },
      memory: raw.memory || { shortTerm: [], longTerm: [], context: '' },
      skills: raw.skills || [],
      model: raw.model || { name: 'claude-3-sonnet', params: {} },
      openClawConfig: raw.openClawConfig || { accountId: '', endpoint: 'http://localhost:8000' },
    };
  }
}

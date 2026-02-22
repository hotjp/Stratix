/**
 * Stratix 配置校验器
 * 
 * 校验 Agent/Skill/Model 配置是否符合 Stratix 规范
 */

import {
  StratixAgentConfig,
  StratixSkillConfig,
  StratixModelConfig,
  StratixSoulConfig,
  StratixMemoryConfig,
  StratixOpenClawConfig,
  StratixSkillParameter,
} from '../stratix-protocol';
import StratixIdGenerator from './StratixIdGenerator';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class StratixConfigValidator {
  private static instance: StratixConfigValidator;
  private idGenerator: StratixIdGenerator;

  private constructor() {
    this.idGenerator = StratixIdGenerator.getInstance();
  }

  public static getInstance(): StratixConfigValidator {
    if (!StratixConfigValidator.instance) {
      StratixConfigValidator.instance = new StratixConfigValidator();
    }
    return StratixConfigValidator.instance;
  }

  /**
   * 校验 Agent 配置
   * @param config Agent 配置
   */
  public validateAgentConfig(config: StratixAgentConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 必填字段校验
    if (!config.agentId) {
      errors.push('agentId 是必填字段');
    } else if (!this.idGenerator.isValidAgentId(config.agentId)) {
      errors.push('agentId 格式无效，应为 stratix-{timestamp}-{random}');
    }

    if (!config.name || config.name.trim() === '') {
      errors.push('name 是必填字段');
    }

    if (!config.type) {
      errors.push('type 是必填字段');
    }

    // Soul 配置校验
    if (!config.soul) {
      errors.push('soul 配置是必填的');
    } else {
      const soulResult = this.validateSoulConfig(config.soul);
      errors.push(...soulResult.errors);
      warnings.push(...soulResult.warnings);
    }

    // Memory 配置校验
    if (!config.memory) {
      errors.push('memory 配置是必填的');
    } else {
      const memoryResult = this.validateMemoryConfig(config.memory);
      errors.push(...memoryResult.errors);
      warnings.push(...memoryResult.warnings);
    }

    // Skills 配置校验
    if (!config.skills || config.skills.length === 0) {
      errors.push('skills 至少需要配置一个技能');
    } else {
      config.skills.forEach((skill, index) => {
        const skillResult = this.validateSkillConfig(skill);
        skillResult.errors.forEach((err) => errors.push(`skills[${index}]: ${err}`));
        skillResult.warnings.forEach((warn) => warnings.push(`skills[${index}]: ${warn}`));
      });
    }

    // Model 配置校验
    if (!config.model) {
      errors.push('model 配置是必填的');
    } else {
      const modelResult = this.validateModelConfig(config.model);
      errors.push(...modelResult.errors);
      warnings.push(...modelResult.warnings);
    }

    // OpenClaw 配置校验
    if (!config.openClawConfig) {
      errors.push('openClawConfig 是必填的');
    } else {
      const openClawResult = this.validateOpenClawConfig(config.openClawConfig);
      errors.push(...openClawResult.errors);
      warnings.push(...openClawResult.warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 校验 Soul 配置
   */
  public validateSoulConfig(config: StratixSoulConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.identity || config.identity.trim() === '') {
      errors.push('identity 是必填字段');
    } else if (config.identity.length < 10) {
      warnings.push('identity 描述过短，建议至少 10 个字符');
    }

    if (!config.goals || config.goals.length === 0) {
      warnings.push('goals 建议至少设置一个目标');
    }

    if (!config.personality || config.personality.trim() === '') {
      warnings.push('personality 建议设置性格描述');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * 校验 Memory 配置
   */
  public validateMemoryConfig(config: StratixMemoryConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(config.shortTerm)) {
      errors.push('shortTerm 必须是数组');
    }

    if (!Array.isArray(config.longTerm)) {
      errors.push('longTerm 必须是数组');
    }

    if (!config.context || config.context.trim() === '') {
      warnings.push('context 建议设置上下文');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * 校验 Skill 配置
   */
  public validateSkillConfig(config: StratixSkillConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.skillId) {
      errors.push('skillId 是必填字段');
    } else if (!this.idGenerator.isValidSkillId(config.skillId)) {
      warnings.push('skillId 建议使用 stratix-skill-{action}-{random} 格式');
    }

    if (!config.name || config.name.trim() === '') {
      errors.push('name 是必填字段');
    }

    if (!config.description || config.description.trim() === '') {
      warnings.push('description 建议设置技能描述');
    }

    if (!config.parameters || config.parameters.length === 0) {
      warnings.push('parameters 建议至少设置一个参数');
    } else {
      config.parameters.forEach((param, index) => {
        const paramResult = this.validateSkillParameter(param);
        paramResult.errors.forEach((err) => errors.push(`parameters[${index}]: ${err}`));
        paramResult.warnings.forEach((warn) => warnings.push(`parameters[${index}]: ${warn}`));
      });
    }

    if (!config.executeScript || config.executeScript.trim() === '') {
      errors.push('executeScript 是必填字段');
    } else {
      try {
        JSON.parse(config.executeScript);
      } catch {
        errors.push('executeScript 必须是有效的 JSON 字符串');
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * 校验技能参数
   */
  public validateSkillParameter(param: StratixSkillParameter): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!param.paramId) {
      errors.push('paramId 是必填字段');
    }

    if (!param.name || param.name.trim() === '') {
      errors.push('name 是必填字段');
    }

    const validTypes = ['string', 'number', 'boolean', 'object'];
    if (!validTypes.includes(param.type)) {
      errors.push(`type 必须是 ${validTypes.join(' | ')} 之一`);
    }

    if (param.defaultValue === undefined && !param.required) {
      warnings.push('非必填参数建议设置 defaultValue');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * 校验 Model 配置
   */
  public validateModelConfig(config: StratixModelConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.name || config.name.trim() === '') {
      errors.push('name 是必填字段');
    }

    if (!config.params) {
      warnings.push('params 建议设置模型参数');
    } else {
      if (config.params.temperature !== undefined) {
        if (config.params.temperature < 0 || config.params.temperature > 2) {
          errors.push('temperature 应在 0-2 之间');
        }
      }

      if (config.params.topP !== undefined) {
        if (config.params.topP < 0 || config.params.topP > 1) {
          errors.push('topP 应在 0-1 之间');
        }
      }

      if (config.params.maxTokens !== undefined) {
        if (config.params.maxTokens < 1) {
          errors.push('maxTokens 应大于 0');
        }
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * 校验 OpenClaw 配置
   */
  public validateOpenClawConfig(config: StratixOpenClawConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.accountId || config.accountId.trim() === '') {
      errors.push('accountId 是必填字段');
    }

    if (!config.endpoint || config.endpoint.trim() === '') {
      errors.push('endpoint 是必填字段');
    } else {
      try {
        new URL(config.endpoint);
      } catch {
        errors.push('endpoint 必须是有效的 URL');
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * 快速校验 Agent 配置（仅返回是否有效）
   */
  public isValidAgentConfig(config: StratixAgentConfig): boolean {
    return this.validateAgentConfig(config).valid;
  }

  /**
   * 快速校验 Skill 配置（仅返回是否有效）
   */
  public isValidSkillConfig(config: StratixSkillConfig): boolean {
    return this.validateSkillConfig(config).valid;
  }
}

export default StratixConfigValidator;

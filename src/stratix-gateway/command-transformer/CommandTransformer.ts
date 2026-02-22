/**
 * Stratix Gateway - 指令转换器
 * 
 * 将前端游戏化指令转换为 OpenClaw 标准调用格式
 * 支持模板变量替换和参数验证
 */

import { StratixCommandData, StratixAgentConfig, StratixSkillConfig } from '../../stratix-core/stratix-protocol';
import { OpenClawConnector } from '../openclaw-connector/OpenClawConnector';

export class CommandTransformer {
  private openClawConnector: OpenClawConnector;

  constructor(openClawConnector?: OpenClawConnector) {
    this.openClawConnector = openClawConnector || new OpenClawConnector();
  }

  public async transformAndExecute(
    command: StratixCommandData,
    agentConfig: StratixAgentConfig
  ): Promise<any> {
    const skill = this.findSkill(agentConfig, command.skillId);
    if (!skill) {
      throw new Error(`Skill not found: ${command.skillId}`);
    }

    const executeScript = this.replaceTemplateVariables(
      skill.executeScript,
      command.params
    );

    const action = this.parseExecuteScript(executeScript);

    return await this.openClawConnector.execute(
      agentConfig.openClawConfig,
      action
    );
  }

  private findSkill(
    agentConfig: StratixAgentConfig,
    skillId: string
  ): StratixSkillConfig | null {
    return agentConfig.skills.find(s => s.skillId === skillId) || null;
  }

  private replaceTemplateVariables(
    template: string,
    params: Record<string, any>
  ): string {
    let result = template;

    Object.entries(params).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    });

    const missingParams = this.findMissingParameters(result);
    if (missingParams.length > 0) {
      throw new Error(`Missing parameters: ${missingParams.join(', ')}`);
    }

    return result;
  }

  private findMissingParameters(template: string): string[] {
    const regex = /{{([^}]+)}}/g;
    const matches: string[] = [];
    let match;

    while ((match = regex.exec(template)) !== null) {
      matches.push(match[1]);
    }

    return [...new Set(matches)];
  }

  private parseExecuteScript(script: string): any {
    try {
      return JSON.parse(script);
    } catch (error) {
      throw new Error(`Failed to parse executeScript: ${error}`);
    }
  }

  public validateCommand(
    command: StratixCommandData,
    agentConfig: StratixAgentConfig
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const skill = this.findSkill(agentConfig, command.skillId);
    if (!skill) {
      errors.push(`Skill not found: ${command.skillId}`);
      return { valid: false, errors };
    }

    const requiredParams = this.extractRequiredParameters(skill.executeScript);
    requiredParams.forEach(param => {
      if (!(param in command.params)) {
        errors.push(`Missing required parameter: ${param}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private extractRequiredParameters(template: string): string[] {
    const regex = /{{([^}]+)}}/g;
    const params: string[] = [];
    let match;

    while ((match = regex.exec(template)) !== null) {
      params.push(match[1]);
    }

    return [...new Set(params)];
  }
}

export default CommandTransformer;

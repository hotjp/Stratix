/**
 * Stratix ID 生成器
 * 
 * 生成符合 Stratix 规范的各类 ID
 * 所有 ID 必须以 "stratix-" 为前缀
 */

export class StratixIdGenerator {
  private static instance: StratixIdGenerator;

  private constructor() {}

  public static getInstance(): StratixIdGenerator {
    if (!StratixIdGenerator.instance) {
      StratixIdGenerator.instance = new StratixIdGenerator();
    }
    return StratixIdGenerator.instance;
  }

  /**
   * 生成随机字符串
   * @param length 字符串长度，默认 8
   */
  private generateRandomString(length: number = 8): string {
    return Math.random().toString(36).slice(2, 2 + length);
  }

  /**
   * 生成 Agent ID
   * 格式：stratix-{timestamp}-{random}
   * @example stratix-1709123456789-abc12def
   */
  public generateAgentId(): string {
    return `stratix-${Date.now()}-${this.generateRandomString(8)}`;
  }

  /**
   * 生成 Skill ID
   * 格式：stratix-skill-{action}-{random}
   * @param action 技能动作名称
   * @example stratix-skill-write-article-abc12def
   */
  public generateSkillId(action: string): string {
    return `stratix-skill-${action}-${this.generateRandomString(8)}`;
  }

  /**
   * 生成 Command ID
   * 格式：stratix-cmd-{timestamp}-{random}
   * @example stratix-cmd-1709123456789-abc12def
   */
  public generateCommandId(): string {
    return `stratix-cmd-${Date.now()}-${this.generateRandomString(8)}`;
  }

  /**
   * 生成 Request ID
   * 格式：stratix-req-{timestamp}-{random}
   * @example stratix-req-1709123456789-abc12def
   */
  public generateRequestId(): string {
    return `stratix-req-${Date.now()}-${this.generateRandomString(8)}`;
  }

  /**
   * 生成 Param ID
   * 格式：stratix-param-{name}-{random}
   * @param name 参数名称
   * @example stratix-param-topic-abc12def
   */
  public generateParamId(name: string): string {
    return `stratix-param-${name}-${this.generateRandomString(6)}`;
  }

  /**
   * 生成 Template ID
   * 格式：stratix-tpl-{type}-{timestamp}
   * @param type 模板类型
   * @example stratix-tpl-writer-1709123456789
   */
  public generateTemplateId(type: string): string {
    return `stratix-tpl-${type}-${Date.now()}`;
  }

  /**
   * 验证 ID 是否符合 Stratix 规范
   * @param id 待验证的 ID
   * @returns 是否有效
   */
  public isValidStratixId(id: string): boolean {
    return id.startsWith('stratix-');
  }

  /**
   * 验证 Agent ID 格式
   * @param agentId Agent ID
   */
  public isValidAgentId(agentId: string): boolean {
    const pattern = /^stratix-\d+-[a-z0-9]+$/;
    return pattern.test(agentId);
  }

  /**
   * 验证 Skill ID 格式
   * @param skillId Skill ID
   */
  public isValidSkillId(skillId: string): boolean {
    const pattern = /^stratix-skill-[a-z0-9-]+-[a-z0-9]+$/;
    return pattern.test(skillId);
  }

  /**
   * 验证 Command ID 格式
   * @param commandId Command ID
   */
  public isValidCommandId(commandId: string): boolean {
    const pattern = /^stratix-cmd-\d+-[a-z0-9]+$/;
    return pattern.test(commandId);
  }

  /**
   * 验证 Request ID 格式
   * @param requestId Request ID
   */
  public isValidRequestId(requestId: string): boolean {
    const pattern = /^stratix-req-\d+-[a-z0-9]+$/;
    return pattern.test(requestId);
  }
}

export default StratixIdGenerator;

/**
 * Stratix Core - 全局类型声明
 * 
 * 此文件扩展 TypeScript 类型系统，为 Stratix 项目提供全局类型支持
 */

declare namespace Stratix {
  /**
   * Agent 状态类型
   */
  type AgentStatus = 'online' | 'offline' | 'busy' | 'error';

  /**
   * 指令执行状态类型
   */
  type CommandStatus = 'pending' | 'running' | 'success' | 'failed';

  /**
   * Agent 类型
   */
  type AgentType = 'writer' | 'dev' | 'analyst' | string;

  /**
   * 技能参数类型
   */
  type SkillParameterType = 'string' | 'number' | 'boolean' | 'object';
}

/**
 * 扩展全局类型
 */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      STRATIX_ENV?: 'development' | 'production' | 'test';
      STRATIX_OPENCLAW_ENDPOINT?: string;
      STRATIX_OPENCLAW_API_KEY?: string;
    }
  }
}

export {};

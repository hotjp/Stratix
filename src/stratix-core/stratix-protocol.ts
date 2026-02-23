/**
 * Stratix Core - 统一数据协议定义
 * 
 * 本文件定义了 Stratix 星策系统的所有标准化数据结构
 * 所有模块必须依赖此协议进行数据交换
 */

/**
 * BodyType - 角色体型类型
 */
export type BodyType = 'male' | 'female' | 'teen' | 'muscular' | 'pregnant' | 'child';

/**
 * PartSelection - 部件选择
 */
export interface PartSelection {
  itemId: string;
  variant: string;
}

/**
 * SkillTreeState - 技能树状态
 */
export interface SkillTreeState {
  selectedNodes: string[];
  unlockedNodes: string[];
}

/**
 * CharacterTexture - 角色纹理信息
 */
export interface CharacterTexture {
  filePath: string;
  width: number;
  height: number;
  animations: string[];
  generatedAt: number;
}

/**
 * CharacterAppearance - 角色外观配置
 */
export interface CharacterAppearance {
  bodyType: BodyType;
  parts: Record<string, PartSelection>;
  thumbnail?: string;
}

/**
 * CharacterData - 角色扩展数据（来自 Character Creator）
 */
export interface CharacterData {
  characterId: string;
  bodyType: BodyType;
  parts: Record<string, PartSelection>;
  skillTree: SkillTreeState;
  attributes: Record<string, number>;
  thumbnail?: string;
  texture?: CharacterTexture;
  createdAt: number;
  updatedAt: number;
}

/**
 * Stratix 统一 API 响应格式
 */
export interface StratixApiResponse<T = any> {
  code: number;
  message: string;
  data: T | null;
  requestId: string;
}

/**
 * Agent 配置（Stratix 核心数据结构）
 */
export interface StratixAgentConfig {
  agentId: string;
  name: string;
  type: 'writer' | 'dev' | 'analyst' | 'custom' | string;
  soul: StratixSoulConfig;
  memory: StratixMemoryConfig;
  skills: StratixSkillConfig[];
  model: StratixModelConfig;
  openClawConfig: StratixOpenClawConfig;
  character?: CharacterData;
  position?: { x: number; y: number };
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Soul 配置
 */
export interface StratixSoulConfig {
  identity: string;
  goals: string[];
  personality: string;
}

/**
 * 记忆配置
 */
export interface StratixMemoryConfig {
  shortTerm: string[];
  longTerm: string[];
  context: string;
}

/**
 * 技能配置
 */
export interface StratixSkillConfig {
  skillId: string;
  name: string;
  description: string;
  parameters: StratixSkillParameter[];
  executeScript: string;
}

/**
 * 技能参数
 */
export interface StratixSkillParameter {
  paramId: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  required: boolean;
  defaultValue: any;
}

/**
 * 模型配置
 */
export interface StratixModelConfig {
  name: string;
  params: {
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    [key: string]: any;
  };
}

/**
 * OpenClaw 对接配置
 */
export interface StratixOpenClawConfig {
  accountId: string;
  endpoint: string;
  apiKey?: string;
  connectionMode?: 'direct' | 'gateway';
}

/**
 * 指令数据
 */
export interface StratixCommandData {
  commandId: string;
  skillId: string;
  agentId: string;
  params: Record<string, any>;
  executeAt: number;
}

/**
 * 前端操作事件类型
 */
export type StratixFrontendEventType = 
  | 'stratix:agent_select'
  | 'stratix:agent_deselect'
  | 'stratix:skill_selected'
  | 'stratix:command_execute'
  | 'stratix:command_cancel';

/**
 * 状态同步事件类型
 */
export type StratixStateSyncEventType =
  | 'stratix:agent_status_update'
  | 'stratix:command_status_update'
  | 'stratix:agent_create'
  | 'stratix:config_updated';

/**
 * 前端操作事件（Stratix RTS / 指令面板 → 事件总线）
 */
export interface StratixFrontendOperationEvent {
  eventType: StratixFrontendEventType;
  payload: {
    agentIds?: string[];
    skill?: StratixSkillConfig;
    command?: StratixCommandData;
    commandId?: string;
  };
  timestamp: number;
  requestId: string;
}

/**
 * 状态同步事件（事件总线 → 前端模块）
 */
export interface StratixStateSyncEvent {
  eventType: StratixStateSyncEventType;
  payload: {
    agentId?: string;
    status?: 'online' | 'offline' | 'busy' | 'error';
    commandStatus?: 'pending' | 'running' | 'success' | 'failed';
    commandId?: string;
    data?: any;
  };
  timestamp: number;
  requestId: string;
}

/**
 * 创建 Agent 请求
 */
export interface StratixCreateAgentRequest {
  config: StratixAgentConfig;
}

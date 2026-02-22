/**
 * Stratix OpenClaw Adapter - 类型定义
 * 
 * 本文件定义了 OpenClaw 适配器所需的所有 TypeScript 接口和类型
 */

import { StratixOpenClawConfig } from '@/stratix-core/stratix-protocol';

/**
 * OpenClaw 适配器统一接口
 * 所有适配器（本地/远程）必须实现此接口
 */
export interface OpenClawAdapterInterface {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  execute(action: OpenClawAction): Promise<OpenClawResponse>;
  getStatus(): Promise<OpenClawStatus>;
  subscribe(callback: (event: OpenClawEvent) => void): void;
}

/**
 * OpenClaw 操作定义
 */
export interface OpenClawAction {
  action: string;
  params: Record<string, any>;
}

/**
 * OpenClaw 响应格式
 */
export interface OpenClawResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * OpenClaw 状态信息
 */
export interface OpenClawStatus {
  connected: boolean;
  accountId: string;
  lastActive: number;
  [key: string]: any;
}

/**
 * OpenClaw 事件定义
 */
export interface OpenClawEvent {
  type: string;
  data: any;
}

/**
 * OpenClaw 连接配置（扩展自 StratixOpenClawConfig）
 */
export interface OpenClawConnectionConfig extends StratixOpenClawConfig {
  timeout?: number;
  retryAttempts?: number;
}

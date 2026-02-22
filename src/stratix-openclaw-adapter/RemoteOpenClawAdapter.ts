/**
 * Stratix OpenClaw Adapter - 远程 OpenClaw 适配器
 * 
 * 负责与远程 OpenClaw 服务进行通信
 * 支持 HTTP API 和 API Key 认证
 */

import { StratixOpenClawConfig } from '@/stratix-core/stratix-protocol';
import {
  OpenClawAdapterInterface,
  OpenClawAction,
  OpenClawResponse,
  OpenClawStatus,
  OpenClawEvent,
} from './types';
import axios from 'axios';

export class RemoteOpenClawAdapter implements OpenClawAdapterInterface {
  private config: StratixOpenClawConfig;
  private subscribers: ((event: OpenClawEvent) => void)[] = [];

  constructor(config: StratixOpenClawConfig) {
    this.config = config;
  }

  public async connect(): Promise<void> {
    const status = await this.getStatus();
    if (!status.connected) {
      throw new Error('Failed to connect to remote OpenClaw');
    }
  }

  public async disconnect(): Promise<void> {}

  public async execute(action: OpenClawAction): Promise<OpenClawResponse> {
    try {
      const headers: Record<string, string> = {};
      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await axios.post(
        `${this.config.endpoint}/api/execute`,
        { accountId: this.config.accountId, ...action },
        { headers }
      );
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  public async getStatus(): Promise<OpenClawStatus> {
    try {
      const headers: Record<string, string> = {};
      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await axios.get(
        `${this.config.endpoint}/api/status/${this.config.accountId}`,
        { headers }
      );
      return {
        connected: true,
        accountId: this.config.accountId,
        lastActive: Date.now(),
        ...response.data,
      };
    } catch (error) {
      return {
        connected: false,
        accountId: this.config.accountId,
        lastActive: 0,
      };
    }
  }

  public subscribe(callback: (event: OpenClawEvent) => void): void {
    this.subscribers.push(callback);
  }
}

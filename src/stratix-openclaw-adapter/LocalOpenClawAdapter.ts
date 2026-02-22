/**
 * Stratix OpenClaw Adapter - 本地 OpenClaw 适配器
 * 
 * 负责与本地运行的 OpenClaw 实例进行通信
 * 支持 WebSocket 和 HTTP API
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
import WebSocket from 'ws';

export class LocalOpenClawAdapter implements OpenClawAdapterInterface {
  private config: StratixOpenClawConfig;
  private ws: WebSocket | null = null;
  private subscribers: ((event: OpenClawEvent) => void)[] = [];

  constructor(config: StratixOpenClawConfig) {
    this.config = config;
  }

  public async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = this.config.endpoint.replace('http', 'ws');
      this.ws = new WebSocket(`${wsUrl}/ws/${this.config.accountId}`);

      this.ws.on('open', () => resolve());
      this.ws.on('error', (err: Error) => reject(err));
      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const event = JSON.parse(data.toString());
          this.subscribers.forEach((cb) => cb(event));
        } catch (e) {
          console.error('Failed to parse OpenClaw event:', e);
        }
      });
    });
  }

  public async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public async execute(action: OpenClawAction): Promise<OpenClawResponse> {
    try {
      const response = await axios.post(`${this.config.endpoint}/api/execute`, {
        accountId: this.config.accountId,
        ...action,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  public async getStatus(): Promise<OpenClawStatus> {
    try {
      const response = await axios.get(
        `${this.config.endpoint}/api/status/${this.config.accountId}`
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

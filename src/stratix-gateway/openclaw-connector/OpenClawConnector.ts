/**
 * Stratix Gateway - OpenClaw 连接器
 * 
 * 管理与 OpenClaw 实例的连接，支持本地和远程调用
 * 提供连接池管理和错误重试机制
 */

import { StratixOpenClawConfig } from '../../stratix-core/stratix-protocol';
import axios, { AxiosInstance, AxiosError } from 'axios';

interface ConnectionInfo {
  config: StratixOpenClawConfig;
  client: AxiosInstance;
  lastUsed: number;
  status: 'active' | 'inactive' | 'error';
}

export class OpenClawConnector {
  private connectionPool: Map<string, ConnectionInfo> = new Map();
  private maxRetries: number;
  private requestTimeout: number;

  constructor(options?: { maxRetries?: number; timeout?: number }) {
    this.maxRetries = options?.maxRetries ?? 3;
    this.requestTimeout = options?.timeout ?? 30000;
  }

  private getOrCreateClient(config: StratixOpenClawConfig): AxiosInstance {
    const key = `${config.endpoint}:${config.accountId}`;
    
    if (!this.connectionPool.has(key)) {
      const client = axios.create({
        baseURL: config.endpoint,
        timeout: this.requestTimeout,
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
        }
      });

      this.connectionPool.set(key, {
        config,
        client,
        lastUsed: Date.now(),
        status: 'active'
      });
    }

    const connInfo = this.connectionPool.get(key)!;
    connInfo.lastUsed = Date.now();
    return connInfo.client;
  }

  public async execute(config: StratixOpenClawConfig, action: any): Promise<any> {
    return this.retryOperation(async () => {
      const client = this.getOrCreateClient(config);
      const response = await client.post('/api/execute', {
        accountId: config.accountId,
        action
      });
      return response.data;
    });
  }

  public async getStatus(config: StratixOpenClawConfig): Promise<any> {
    return this.retryOperation(async () => {
      const client = this.getOrCreateClient(config);
      const response = await client.get(`/api/status/${config.accountId}`);
      return response.data;
    });
  }

  private async retryOperation<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public getConnectionStatus(key: string): ConnectionInfo | undefined {
    return this.connectionPool.get(key);
  }

  public clearConnection(key: string): void {
    this.connectionPool.delete(key);
  }

  public clearAllConnections(): void {
    this.connectionPool.clear();
  }
}

export default OpenClawConnector;

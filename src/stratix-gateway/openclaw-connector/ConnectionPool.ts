/**
 * Stratix Gateway - 连接池管理
 * 
 * 管理 OpenClaw 实例的连接池，实现连接复用、自动重连
 * 提供连接健康检查机制
 */

import { StratixOpenClawConfig } from '../../stratix-core/stratix-protocol';
import axios, { AxiosInstance, AxiosError } from 'axios';

export interface ConnectionInfo {
  key: string;
  endpoint: string;
  accountId: string;
  status: 'connected' | 'disconnected' | 'error' | 'reconnecting';
  lastUsed: number;
  createdAt: number;
  errorCount: number;
  lastError?: string;
}

export interface ConnectionPoolOptions {
  maxConnections?: number;
  idleTimeout?: number;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  healthCheckInterval?: number;
  requestTimeout?: number;
}

export interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  errorConnections: number;
}

interface InternalConnection {
  config: StratixOpenClawConfig;
  client: AxiosInstance;
  info: ConnectionInfo;
}

const DEFAULT_OPTIONS: Required<ConnectionPoolOptions> = {
  maxConnections: 100,
  idleTimeout: 300000,
  reconnectAttempts: 3,
  reconnectDelay: 1000,
  healthCheckInterval: 60000,
  requestTimeout: 30000,
};

export class ConnectionPool {
  private connections: Map<string, InternalConnection> = new Map();
  private options: Required<ConnectionPoolOptions>;
  private healthCheckTimer?: ReturnType<typeof setInterval>;
  private idleCheckTimer?: ReturnType<typeof setInterval>;

  constructor(options?: ConnectionPoolOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  public async getAdapter(config: StratixOpenClawConfig): Promise<AxiosInstance> {
    const key = this.generateKey(config);

    if (this.connections.has(key)) {
      const conn = this.connections.get(key)!;
      conn.info.lastUsed = Date.now();
      conn.info.status = 'connected';
      return conn.client;
    }

    if (this.connections.size >= this.options.maxConnections) {
      await this.cleanupIdleConnections();
    }

    if (this.connections.size >= this.options.maxConnections) {
      throw new Error('Connection pool exhausted: maximum connections reached');
    }

    return this.createAdapter(config);
  }

  public async releaseAdapter(key: string): Promise<void> {
    const conn = this.connections.get(key);
    if (conn) {
      conn.info.lastUsed = Date.now();
    }
  }

  public async removeAdapter(key: string): Promise<void> {
    const conn = this.connections.get(key);
    if (conn) {
      this.connections.delete(key);
    }
  }

  public async disconnectAll(): Promise<void> {
    this.connections.clear();
    this.stopHealthCheck();
  }

  public getConnectionInfo(key: string): ConnectionInfo | null {
    const conn = this.connections.get(key);
    return conn ? { ...conn.info } : null;
  }

  public getAllConnectionInfo(): ConnectionInfo[] {
    return Array.from(this.connections.values()).map(conn => ({ ...conn.info }));
  }

  public getPoolStats(): PoolStats {
    const connections = Array.from(this.connections.values());
    const now = Date.now();
    const idleThreshold = now - 60000;

    return {
      totalConnections: connections.length,
      activeConnections: connections.filter(c => c.info.lastUsed > idleThreshold).length,
      idleConnections: connections.filter(c => c.info.lastUsed <= idleThreshold && c.info.status === 'connected').length,
      errorConnections: connections.filter(c => c.info.status === 'error').length,
    };
  }

  public startHealthCheck(): void {
    if (this.healthCheckTimer) return;

    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.options.healthCheckInterval);

    this.idleCheckTimer = setInterval(() => {
      this.cleanupIdleConnections();
    }, this.options.idleTimeout / 2);
  }

  public stopHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
    if (this.idleCheckTimer) {
      clearInterval(this.idleCheckTimer);
      this.idleCheckTimer = undefined;
    }
  }

  private async createAdapter(config: StratixOpenClawConfig): Promise<AxiosInstance> {
    const key = this.generateKey(config);

    const client = axios.create({
      baseURL: config.endpoint,
      timeout: this.options.requestTimeout,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
      },
    });

    const info: ConnectionInfo = {
      key,
      endpoint: config.endpoint,
      accountId: config.accountId,
      status: 'connected',
      lastUsed: Date.now(),
      createdAt: Date.now(),
      errorCount: 0,
    };

    this.connections.set(key, { config, client, info });

    return client;
  }

  private generateKey(config: StratixOpenClawConfig): string {
    return `${config.endpoint}:${config.accountId}`;
  }

  private handleConnectionError(key: string, error: Error): void {
    const conn = this.connections.get(key);
    if (!conn) return;

    conn.info.errorCount++;
    conn.info.lastError = error.message;

    if (conn.info.errorCount >= this.options.reconnectAttempts) {
      conn.info.status = 'error';
    }
  }

  public async attemptReconnect(key: string): Promise<boolean> {
    const conn = this.connections.get(key);
    if (!conn) return false;

    conn.info.status = 'reconnecting';

    for (let attempt = 1; attempt <= this.options.reconnectAttempts; attempt++) {
      try {
        await conn.client.get(`/api/status/${conn.config.accountId}`);
        conn.info.status = 'connected';
        conn.info.errorCount = 0;
        conn.info.lastError = undefined;
        return true;
      } catch (error) {
        conn.info.errorCount++;
        conn.info.lastError = (error as Error).message;

        if (attempt < this.options.reconnectAttempts) {
          const delay = this.options.reconnectDelay * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    conn.info.status = 'error';
    return false;
  }

  private async cleanupIdleConnections(): Promise<void> {
    const now = Date.now();
    const idleConnections: string[] = [];

    for (const [key, conn] of this.connections) {
      if (now - conn.info.lastUsed > this.options.idleTimeout && conn.info.status !== 'error') {
        idleConnections.push(key);
      }
    }

    for (const key of idleConnections) {
      await this.removeAdapter(key);
    }
  }

  private async performHealthCheck(): Promise<void> {
    for (const [key, conn] of this.connections) {
      if (conn.info.status === 'error') {
        await this.attemptReconnect(key);
        continue;
      }

      try {
        await conn.client.get(`/api/status/${conn.config.accountId}`);
        conn.info.status = 'connected';
      } catch (error) {
        this.handleConnectionError(key, error as Error);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async executeWithRetry<T>(
    config: StratixOpenClawConfig,
    operation: (client: AxiosInstance) => Promise<T>
  ): Promise<T> {
    const client = await this.getAdapter(config);
    const key = this.generateKey(config);
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.options.reconnectAttempts; attempt++) {
      try {
        const result = await operation(client);
        const conn = this.connections.get(key);
        if (conn) {
          conn.info.errorCount = 0;
          conn.info.lastError = undefined;
        }
        return result;
      } catch (error) {
        lastError = error as Error;
        this.handleConnectionError(key, lastError);

        if (attempt < this.options.reconnectAttempts) {
          const delay = this.options.reconnectDelay * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }
}

export default ConnectionPool;

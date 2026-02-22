/**
 * Stratix OpenClaw Adapter - 连接池管理
 * 
 * 负责管理多个 OpenClaw 实例的连接池
 * 支持适配器缓存、复用和自动选择
 */

import { StratixOpenClawConfig } from '@/stratix-core/stratix-protocol';
import { OpenClawAdapterInterface } from './types';
import { LocalOpenClawAdapter } from './LocalOpenClawAdapter';
import { RemoteOpenClawAdapter } from './RemoteOpenClawAdapter';

export class ConnectionPool {
  private adapters: Map<string, OpenClawAdapterInterface> = new Map();

  public async getAdapter(config: StratixOpenClawConfig): Promise<OpenClawAdapterInterface> {
    const key = `${config.endpoint}:${config.accountId}`;

    if (!this.adapters.has(key)) {
      const adapter = this.createAdapter(config);
      await adapter.connect();
      this.adapters.set(key, adapter);
    }

    return this.adapters.get(key)!;
  }

  private createAdapter(config: StratixOpenClawConfig): OpenClawAdapterInterface {
    const isLocal =
      config.endpoint.includes('localhost') || config.endpoint.includes('127.0.0.1');
    return isLocal ? new LocalOpenClawAdapter(config) : new RemoteOpenClawAdapter(config);
  }

  public async disconnectAll(): Promise<void> {
    const disconnects = Array.from(this.adapters.values()).map((adapter) =>
      adapter.disconnect()
    );
    await Promise.all(disconnects);
    this.adapters.clear();
  }
}

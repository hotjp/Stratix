/**
 * Stratix OpenClaw Adapter - 模块入口
 * 
 * 导出所有类型、类和工厂函数
 */

import { StratixOpenClawConfig } from '@/stratix-core/stratix-protocol';
import { OpenClawAdapterInterface } from './types';
import { LocalOpenClawAdapter } from './LocalOpenClawAdapter';
import { RemoteOpenClawAdapter } from './RemoteOpenClawAdapter';
import { ConnectionPool } from './ConnectionPool';

export {
  OpenClawAdapterInterface,
  OpenClawAction,
  OpenClawResponse,
  OpenClawStatus,
  OpenClawEvent,
  OpenClawConnectionConfig,
} from './types';

export { LocalOpenClawAdapter } from './LocalOpenClawAdapter';
export { RemoteOpenClawAdapter } from './RemoteOpenClawAdapter';
export { ConnectionPool } from './ConnectionPool';

export function createOpenClawAdapter(config: StratixOpenClawConfig): OpenClawAdapterInterface {
  const isLocal =
    config.endpoint.includes('localhost') || config.endpoint.includes('127.0.0.1');
  return isLocal
    ? new LocalOpenClawAdapter(config)
    : new RemoteOpenClawAdapter(config);
}

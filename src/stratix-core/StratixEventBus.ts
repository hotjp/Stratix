/**
 * Stratix Core - 事件总线实现
 * 
 * 基于 mitt 实现的模块间通信事件发布/订阅机制
 * 所有模块通过此事件总线进行通信
 */

import mitt from 'mitt';
import {
  StratixFrontendOperationEvent,
  StratixStateSyncEvent,
} from './stratix-protocol';

/**
 * Stratix 事件类型联合
 */
type StratixEvent = StratixFrontendOperationEvent | StratixStateSyncEvent;

/**
 * Stratix 事件总线
 * 
 * 单例模式实现，提供全局统一的事件发布/订阅机制
 */
class StratixEventBus {
  private static instance: StratixEventBus;
  private emitter = mitt<Record<string, StratixEvent>>();

  private constructor() {}

  /**
   * 获取 StratixEventBus 单例实例
   * @returns StratixEventBus 实例
   */
  public static getInstance(): StratixEventBus {
    if (!StratixEventBus.instance) {
      StratixEventBus.instance = new StratixEventBus();
    }
    return StratixEventBus.instance;
  }

  /**
   * 发布事件
   * @param event Stratix 事件对象
   */
  public emit(event: StratixEvent): void {
    this.emitter.emit(event.eventType, event);
  }

  /**
   * 订阅事件
   * @param eventType 事件类型（必须以 stratix: 为前缀）
   * @param handler 事件处理函数
   */
  public subscribe(
    eventType: string,
    handler: (event: StratixEvent) => void
  ): void {
    this.emitter.on(eventType, handler);
  }

  /**
   * 取消订阅事件
   * @param eventType 事件类型
   * @param handler 事件处理函数
   */
  public unsubscribe(
    eventType: string,
    handler: (event: StratixEvent) => void
  ): void {
    this.emitter.off(eventType, handler);
  }

  /**
   * 清除所有事件监听器
   * 注意：通常只在测试或重置时使用
   */
  public clearAll(): void {
    this.emitter.all.clear();
  }
}

export default StratixEventBus;

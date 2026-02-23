import { createOpenClawAdapter, LocalOpenClawAdapter } from '@/stratix-openclaw-adapter';
import type { OpenClawAdapterInterface, ChatResponse } from '@/stratix-openclaw-adapter';
import type { StratixOpenClawConfig } from '@/stratix-core/stratix-protocol';
import type { ChatMessage } from '../types';
import { browserStorage } from './BrowserStorage';

const STORAGE_KEY = 'stratix_character_creator_openclaw';
const CLIENT_ID = 'stratix-character-creator';

export interface CharacterCreatorOpenClawConfig {
  serverType: 'local' | 'remote';
  endpoint: string;
  connectionMode: 'http' | 'websocket';
  lastConnected?: number;
}

interface WSMessage {
  type: 'text' | 'ping' | 'pong' | 'response' | 'error';
  message?: string;
  content?: string;
  requestId?: string;
  error?: string;
}

interface PendingRequest {
  resolve: (value: string) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

class OpenClawService {
  private adapter: OpenClawAdapterInterface | null = null;
  private config: CharacterCreatorOpenClawConfig | null = null;
  private ws: WebSocket | null = null;
  private wsConnected: boolean = false;
  private requestId: number = 0;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private messageQueue: WSMessage[] = [];

  async loadConfig(): Promise<CharacterCreatorOpenClawConfig | null> {
    try {
      const stored = await browserStorage.get<CharacterCreatorOpenClawConfig>(STORAGE_KEY);
      if (stored) {
        this.config = stored;
        return stored;
      }
    } catch (e) {
      console.error('[OpenClaw] Failed to load config:', e);
    }
    return null;
  }

  async saveConfig(config: CharacterCreatorOpenClawConfig): Promise<void> {
    this.config = config;
    await browserStorage.set(STORAGE_KEY, config);
  }

  getConfig(): CharacterCreatorOpenClawConfig | null {
    return this.config;
  }

  getDefaultConfig(): CharacterCreatorOpenClawConfig {
    return {
      serverType: 'local',
      endpoint: 'http://localhost:18789',
      connectionMode: 'http'
    };
  }

  private getWebSocketUrl(): string {
    if (!this.config) return '';
    const endpoint = this.config.endpoint.replace(/^http/, 'ws');
    return `${endpoint}/ws?clientId=${CLIENT_ID}`;
  }

  private createAdapter(): OpenClawAdapterInterface {
    if (!this.config) {
      throw new Error('No configuration');
    }

    const stratixConfig: StratixOpenClawConfig = {
      accountId: 'stratix-character-creator',
      endpoint: this.config.endpoint,
      connectionMode: this.config.serverType === 'local' ? 'gateway' : 'direct'
    };

    return createOpenClawAdapter(stratixConfig);
  }

  async testConnection(): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!this.config) {
      return { success: false, error: 'No configuration' };
    }

    if (this.config.serverType === 'local') {
      return this.testLocalConnection();
    } else {
      if (this.config.connectionMode === 'websocket') {
        return this.testWebSocketConnection();
      } else {
        return this.testHttpConnection();
      }
    }
  }

  private async testLocalConnection(): Promise<{ success: boolean; message?: string; error?: string }> {
    const httpResult = await this.testHttpConnection();
    if (!httpResult.success) {
      return { 
        success: false, 
        error: `HTTP 连接失败: ${httpResult.error}` 
      };
    }

    const wsResult = await this.testWebSocketConnection();
    if (!wsResult.success) {
      return { 
        success: false, 
        error: `WebSocket 连接失败: ${wsResult.error}` 
      };
    }

    this.config!.lastConnected = Date.now();
    await this.saveConfig(this.config!);

    return { 
      success: true, 
      message: 'HTTP & WebSocket 均连接成功' 
    };
  }

  private async testHttpConnection(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      this.adapter = this.createAdapter();
      await this.adapter.connect();
      
      const status = await this.adapter.getStatus();
      
      if (status.connected) {
        this.config!.lastConnected = Date.now();
        await this.saveConfig(this.config!);
        
        return { 
          success: true, 
          message: `HTTP connected to ${this.config!.endpoint}` 
        };
      } else {
        return { 
          success: false, 
          error: status.error || 'Gateway not responding' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  private async testWebSocketConnection(): Promise<{ success: boolean; message?: string; error?: string }> {
    return new Promise((resolve) => {
      const url = this.getWebSocketUrl();
      let settled = false;

      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          testWs.close();
          resolve({ success: false, error: 'Connection timeout (5s)' });
        }
      }, 5000);

      const testWs = new WebSocket(url);

      testWs.onopen = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          testWs.close();
          
          this.config!.lastConnected = Date.now();
          this.saveConfig(this.config!);
          
          resolve({ success: true, message: `WebSocket connected to ${this.config!.endpoint}` });
        }
      };

      testWs.onerror = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          resolve({ success: false, error: 'WebSocket connection failed - check if OpenClaw Gateway is running' });
        }
      };

      testWs.onclose = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          resolve({ success: false, error: 'Connection closed unexpectedly' });
        }
      };
    });
  }

  private async ensureWebSocket(): Promise<boolean> {
    if (this.ws && this.wsConnected && this.ws.readyState === WebSocket.OPEN) {
      return true;
    }

    if (!this.config) {
      return false;
    }

    return new Promise((resolve) => {
      const url = this.getWebSocketUrl();

      const timeout = setTimeout(() => {
        if (this.ws?.readyState !== WebSocket.OPEN) {
          resolve(false);
        }
      }, 10000);

      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.wsConnected = true;
          console.log('[OpenClaw] WebSocket connected');
          this.flushMessageQueue();
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as WSMessage;
            this.handleWebSocketMessage(data);
          } catch (e) {
            console.error('[OpenClaw] Failed to parse WS message:', e);
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          console.error('[OpenClaw] WebSocket error:', error);
          this.wsConnected = false;
          resolve(false);
        };

        this.ws.onclose = () => {
          clearTimeout(timeout);
          this.wsConnected = false;
          console.log('[OpenClaw] WebSocket disconnected');
        };
      } catch (e) {
        clearTimeout(timeout);
        resolve(false);
      }
    });
  }

  private handleWebSocketMessage(data: WSMessage): void {
    if (data.type === 'response' || data.type === 'text') {
      const requestId = data.requestId;
      if (requestId && this.pendingRequests.has(requestId)) {
        const pending = this.pendingRequests.get(requestId)!;
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(requestId);

        if (data.error) {
          pending.reject(new Error(data.error));
        } else {
          pending.resolve(data.message || data.content || '');
        }
      }
    } else if (data.type === 'error') {
      console.error('[OpenClaw] WS error:', data.error);
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const msg = this.messageQueue.shift()!;
      this.ws.send(JSON.stringify(msg));
    }
  }

  async chat(messages: ChatMessage[], systemPrompt: string): Promise<{ success: boolean; content?: string; error?: string }> {
    if (!this.config) {
      return { success: false, error: 'No configuration' };
    }

    if (this.config.connectionMode === 'websocket') {
      return this.chatViaWebSocket(messages, systemPrompt);
    } else {
      return this.chatViaHttp(messages, systemPrompt);
    }
  }

  private async chatViaWebSocket(messages: ChatMessage[], systemPrompt: string): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      const connected = await this.ensureWebSocket();
      if (!connected) {
        return { success: false, error: 'WebSocket not connected' };
      }

      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
      if (!lastUserMessage) {
        return { success: false, error: 'No user message' };
      }

      const requestId = `req_${++this.requestId}_${Date.now()}`;

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          this.pendingRequests.delete(requestId);
          resolve({ success: false, error: 'Request timeout (30s)' });
        }, 30000);

        this.pendingRequests.set(requestId, {
          resolve: (content) => {
            resolve({ success: true, content });
          },
          reject: (error) => {
            resolve({ success: false, error: error.message });
          },
          timeout
        });

        const wsMessage: WSMessage = {
          type: 'text',
          message: lastUserMessage.content,
          requestId
        };

        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(wsMessage));
        } else {
          this.messageQueue.push(wsMessage);
        }
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Chat failed'
      };
    }
  }

  private async chatViaHttp(messages: ChatMessage[], systemPrompt: string): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      if (!this.adapter) {
        if (!this.config) {
          return { success: false, error: 'No configuration' };
        }
        this.adapter = this.createAdapter();
        await this.adapter.connect();
      }

      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
      if (!lastUserMessage) {
        return { success: false, error: 'No user message found' };
      }

      const chatMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }))
      ];

      if (this.adapter instanceof LocalOpenClawAdapter) {
        const response = await this.adapter.openaiChatCompletion({
          messages: chatMessages,
          model: 'openclaw'
        });

        return {
          success: true,
          content: response.choices[0]?.message?.content || ''
        };
      }

      const response = await this.adapter.sendMessage(lastUserMessage.content, {
        sessionId: 'character-creator-session'
      });

      return {
        success: true,
        content: response.content
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Chat failed'
      };
    }
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.wsConnected = false;
    }
    if (this.adapter) {
      await this.adapter.disconnect();
      this.adapter = null;
    }
    this.pendingRequests.forEach(pending => {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Disconnected'));
    });
    this.pendingRequests.clear();
    this.messageQueue = [];
  }

  isConnected(): boolean {
    if (this.config?.connectionMode === 'websocket') {
      return this.wsConnected && this.ws?.readyState === WebSocket.OPEN;
    }
    return this.adapter !== null;
  }

  hasValidConfig(): boolean {
    return this.config !== null && this.config.lastConnected !== undefined;
  }
}

export const openClawService = new OpenClawService();
export default OpenClawService;

import Phaser from 'phaser';
import { openClawService } from '../core/OpenClawService';
import type { ChatMessage, SavedCharacter } from '../types';

const THEME = {
  bg: '#0d0d14',
  panelBg: '#12121a',
  panelBorder: '#2a2a3e',
  accent: '#00ffff',
  accentDim: '#1a3a3a',
  text: '#ffffff',
  textMuted: '#6a6a8a',
  success: '#00ff88',
  error: '#ff4444',
  userBg: '#1a2a3a',
  aiBg: '#1a1a2a'
};

export interface AgentChatPanelConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  character: SavedCharacter;
  onComplete: () => void;
  onBack: () => void;
}

export class AgentChatPanel {
  private scene: Phaser.Scene;
  private config: AgentChatPanelConfig;
  private container: Phaser.GameObjects.DOMElement | null = null;
  private messages: ChatMessage[] = [];
  private systemPrompt: string = '';

  constructor(scene: Phaser.Scene, config: AgentChatPanelConfig) {
    this.scene = scene;
    this.config = config;
    this.buildSystemPrompt();
  }

  private buildSystemPrompt(): void {
    const char = this.config.character;
    const parts = Object.entries(char.parts)
      .map(([category, selection]) => `${category}: ${selection.itemId}`)
      .join(', ');
    
    this.systemPrompt = `你是游戏中的一个角色，名叫"${char.name}"。

角色信息：
- 体型: ${char.bodyType}
- 装备配置: ${parts}

请以这个角色的身份与玩家对话。保持角色一致性，用符合角色身份的语气和方式回应。
回答要简洁有性格，不要过度解释自己是AI。`;
  }

  create(): Phaser.GameObjects.DOMElement {
    const html = this.generateHTML();
    this.container = this.scene.add.dom(
      this.config.x,
      this.config.y
    ).createFromHTML(html).setOrigin(0, 0);

    this.setupEventListeners();
    return this.container;
  }

  private generateHTML(): string {
    const char = this.config.character;
    
    return `
      <div class="agent-chat" style="
        width: ${this.config.width}px;
        height: ${this.config.height}px;
        background: ${THEME.panelBg};
        border: 1px solid ${THEME.panelBorder};
        border-radius: 4px;
        overflow: hidden;
        font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', monospace;
        color: ${THEME.text};
        display: flex;
        flex-direction: column;
      ">
        <div class="header" style="
          padding: 16px;
          border-bottom: 1px solid ${THEME.panelBorder};
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div>
            <div style="font-size: 11px; color: ${THEME.textMuted}; letter-spacing: 1px; margin-bottom: 4px;">第三步 STEP 3</div>
            <div style="font-size: 14px; color: ${THEME.accent};">Agent 对话测试</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; color: ${THEME.text};">${char.name}</div>
            <div style="font-size: 10px; color: ${THEME.textMuted};">${char.bodyType}</div>
          </div>
        </div>
        
        <div id="chat-messages" style="
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        ">
          <div class="welcome-message" style="
            padding: 12px;
            background: ${THEME.accentDim};
            border-radius: 4px;
            font-size: 11px;
            color: ${THEME.accent};
            text-align: center;
          ">
            已连接到 ${char.name} 的 Agent，开始对话测试
          </div>
        </div>
        
        <div class="input-area" style="
          padding: 16px;
          border-top: 1px solid ${THEME.panelBorder};
        ">
          <div style="display: flex; gap: 8px;">
            <input type="text" id="chat-input" placeholder="输入消息..." style="
              flex: 1;
              padding: 10px 12px;
              background: ${THEME.bg};
              border: 1px solid ${THEME.panelBorder};
              border-radius: 4px;
              color: ${THEME.text};
              font-family: inherit;
              font-size: 12px;
            ">
            <button id="send-btn" style="
              padding: 10px 16px;
              background: ${THEME.accent};
              border: none;
              border-radius: 4px;
              color: ${THEME.bg};
              font-family: inherit;
              font-size: 12px;
              cursor: pointer;
            ">发送</button>
          </div>
        </div>
        
        <div class="footer" style="
          padding: 12px 16px;
          border-top: 1px solid ${THEME.panelBorder};
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <button id="reset-btn" style="
            padding: 8px 16px;
            background: transparent;
            border: 1px solid ${THEME.panelBorder};
            border-radius: 4px;
            color: ${THEME.textMuted};
            font-family: inherit;
            font-size: 11px;
            cursor: pointer;
          ">重置对话</button>
          <div style="display: flex; gap: 8px;">
            <button id="back-btn" style="
              padding: 10px 20px;
              background: transparent;
              border: 1px solid ${THEME.panelBorder};
              border-radius: 4px;
              color: ${THEME.textMuted};
              font-family: inherit;
              font-size: 12px;
              cursor: pointer;
            ">← 返回</button>
            <button id="complete-btn" style="
              padding: 10px 24px;
              background: ${THEME.success};
              border: none;
              border-radius: 4px;
              color: ${THEME.bg};
              font-family: inherit;
              font-size: 12px;
              cursor: pointer;
            ">完成创建 ✓</button>
          </div>
        </div>
      </div>
    `;
  }

  private setupEventListeners(): void {
    if (!this.container) return;

    const node = this.container.node as HTMLElement;

    const chatInput = node.querySelector('#chat-input') as HTMLInputElement;
    const sendBtn = node.querySelector('#send-btn') as HTMLButtonElement;
    const resetBtn = node.querySelector('#reset-btn') as HTMLButtonElement;
    const backBtn = node.querySelector('#back-btn') as HTMLButtonElement;
    const completeBtn = node.querySelector('#complete-btn') as HTMLButtonElement;
    const messagesContainer = node.querySelector('#chat-messages') as HTMLElement;

    const sendMessage = async () => {
      const content = chatInput.value.trim();
      if (!content) return;

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: Date.now()
      };

      this.messages.push(userMessage);
      this.renderMessage(messagesContainer, userMessage);
      chatInput.value = '';

      sendBtn.disabled = true;
      sendBtn.textContent = '...';

      const result = await openClawService.chat(this.messages, this.systemPrompt);

      if (result.success && result.content) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.content,
          timestamp: Date.now()
        };
        this.messages.push(aiMessage);
        this.renderMessage(messagesContainer, aiMessage);
      } else {
        this.renderError(messagesContainer, result.error || 'Unknown error');
      }

      sendBtn.disabled = false;
      sendBtn.textContent = '发送';
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    sendBtn?.addEventListener('click', sendMessage);
    
    chatInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });

    resetBtn?.addEventListener('click', () => {
      this.messages = [];
      messagesContainer.innerHTML = `
        <div class="welcome-message" style="
          padding: 12px;
          background: ${THEME.accentDim};
          border-radius: 4px;
          font-size: 11px;
          color: ${THEME.accent};
          text-align: center;
        ">
          对话已重置，开始新的测试
        </div>
      `;
    });

    backBtn?.addEventListener('click', () => {
      this.config.onBack();
    });

    completeBtn?.addEventListener('click', () => {
      this.config.onComplete();
    });
  }

  private renderMessage(container: HTMLElement, message: ChatMessage): void {
    const isUser = message.role === 'user';
    const msgDiv = document.createElement('div');
    msgDiv.style.cssText = `
      padding: 10px 12px;
      background: ${isUser ? THEME.userBg : THEME.aiBg};
      border-radius: 4px;
      max-width: 85%;
      align-self: ${isUser ? 'flex-end' : 'flex-start'};
      font-size: 12px;
      line-height: 1.5;
    `;
    msgDiv.innerHTML = `
      <div style="font-size: 10px; color: ${THEME.textMuted}; margin-bottom: 4px;">
        ${isUser ? '你' : this.config.character.name}
      </div>
      <div>${this.escapeHtml(message.content)}</div>
    `;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
  }

  private renderError(container: HTMLElement, error: string): void {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      padding: 10px 12px;
      background: #2a1a1a;
      border-radius: 4px;
      border-left: 3px solid ${THEME.error};
      font-size: 11px;
      color: ${THEME.error};
    `;
    errorDiv.textContent = `Error: ${error}`;
    container.appendChild(errorDiv);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  destroy(): void {
    this.container?.destroy();
  }
}

export default AgentChatPanel;

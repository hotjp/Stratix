import Phaser from 'phaser';
import { openClawService, CharacterCreatorOpenClawConfig } from '../core/OpenClawService';

const THEME = {
  bg: '#0d0d14',
  panelBg: '#12121a',
  panelBorder: '#2a2a3e',
  accent: '#00ffff',
  accentDim: '#1a3a3a',
  text: '#ffffff',
  textMuted: '#6a6a8a',
  success: '#00ff88',
  error: '#ff4444'
};

export interface OpenClawConfigPanelConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  onConfigured: () => void;
}

export class OpenClawConfigPanel {
  private scene: Phaser.Scene;
  private config: OpenClawConfigPanelConfig;
  private container: Phaser.GameObjects.DOMElement | null = null;
  private currentConfig: CharacterCreatorOpenClawConfig;

  constructor(scene: Phaser.Scene, config: OpenClawConfigPanelConfig) {
    this.scene = scene;
    this.config = config;
    this.currentConfig = openClawService.getDefaultConfig();
  }

  async create(): Promise<Phaser.GameObjects.DOMElement> {
    const savedConfig = await openClawService.loadConfig();
    if (savedConfig) {
      this.currentConfig = savedConfig;
    }

    const html = this.generateHTML();
    this.container = this.scene.add.dom(
      this.config.x,
      this.config.y
    ).createFromHTML(html).setOrigin(0, 0);

    this.setupEventListeners();
    return this.container;
  }

  private generateHTML(): string {
    const cfg = this.currentConfig;
    
    return `
      <div class="openclaw-config" style="
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
        ">
          <div style="font-size: 11px; color: ${THEME.textMuted}; letter-spacing: 1px; margin-bottom: 4px;">第二步 STEP 2</div>
          <div style="font-size: 14px; color: ${THEME.accent};">OpenClaw 服务配置</div>
        </div>
        
        <div class="content" style="
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        ">
          <div class="form-group" style="margin-bottom: 20px;">
            <label style="display: block; font-size: 11px; color: ${THEME.textMuted}; margin-bottom: 8px;">服务类型 SERVER TYPE</label>
            <div style="display: flex; gap: 12px;">
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                <input type="radio" name="serverType" value="local" ${cfg.serverType === 'local' ? 'checked' : ''} style="accent-color: ${THEME.accent};">
                <span style="font-size: 12px;">本地 Local</span>
              </label>
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                <input type="radio" name="serverType" value="remote" ${cfg.serverType === 'remote' ? 'checked' : ''} style="accent-color: ${THEME.accent};">
                <span style="font-size: 12px;">远程 Remote</span>
              </label>
            </div>
          </div>
          
          <div id="connection-mode-group" class="form-group" style="margin-bottom: 20px; ${cfg.serverType === 'local' ? 'display: none;' : ''}">
            <label style="display: block; font-size: 11px; color: ${THEME.textMuted}; margin-bottom: 8px;">连接模式 CONNECTION MODE</label>
            <div style="display: flex; gap: 12px;">
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                <input type="radio" name="connectionMode" value="http" ${cfg.connectionMode === 'http' ? 'checked' : ''} style="accent-color: ${THEME.accent};">
                <span style="font-size: 12px;">HTTP API</span>
              </label>
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                <input type="radio" name="connectionMode" value="websocket" ${cfg.connectionMode === 'websocket' ? 'checked' : ''} style="accent-color: ${THEME.accent};">
                <span style="font-size: 12px;">WebSocket</span>
              </label>
            </div>
            <div style="font-size: 10px; color: ${THEME.textMuted}; margin-top: 6px;">
              WebSocket 模式适合实时交互，HTTP 适合单次请求
            </div>
          </div>
          
          <div id="local-hint" style="padding: 10px; background: ${THEME.accentDim}; border-radius: 4px; margin-bottom: 16px; ${cfg.serverType === 'local' ? '' : 'display: none;'}">
            <div style="font-size: 11px; color: ${THEME.accent};">
              本地连接将同时测试 HTTP API 和 WebSocket 两个协议
            </div>
          </div>
          
          <div class="form-group" style="margin-bottom: 20px;">
            <label style="display: block; font-size: 11px; color: ${THEME.textMuted}; margin-bottom: 8px;">
              <span id="endpoint-label">${cfg.serverType === 'local' ? '本地地址' : '远程地址'} ENDPOINT</span>
            </label>
            <input type="text" id="endpoint-input" value="${cfg.endpoint}" placeholder="${cfg.serverType === 'local' ? 'http://localhost:18789' : 'https://your-server:18789'}" style="
              width: 100%;
              padding: 10px 12px;
              background: ${THEME.bg};
              border: 1px solid ${THEME.panelBorder};
              border-radius: 4px;
              color: ${THEME.text};
              font-family: inherit;
              font-size: 12px;
              box-sizing: border-box;
            ">
            <div style="font-size: 10px; color: ${THEME.textMuted}; margin-top: 6px;">
              ${cfg.serverType === 'local' ? '确保 OpenClaw Gateway 已启动 (默认端口 18789)' : '输入远程服务器完整地址'}
            </div>
          </div>
          
          <div id="status-message" style="
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 20px;
            display: none;
            font-size: 12px;
          "></div>
          
          <div class="actions" style="display: flex; gap: 12px;">
            <button id="test-btn" style="
              flex: 1;
              padding: 12px;
              background: ${THEME.accentDim};
              border: 1px solid ${THEME.accent};
              border-radius: 4px;
              color: ${THEME.accent};
              font-family: inherit;
              font-size: 12px;
              cursor: pointer;
              transition: all 0.2s;
            ">测试连接 TEST</button>
          </div>
        </div>
        
        <div class="footer" style="
          padding: 16px;
          border-top: 1px solid ${THEME.panelBorder};
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        ">
          <button id="next-btn" style="
            padding: 10px 24px;
            background: ${cfg.lastConnected ? THEME.success : THEME.panelBorder};
            border: none;
            border-radius: 4px;
            color: ${cfg.lastConnected ? THEME.bg : THEME.textMuted};
            font-family: inherit;
            font-size: 12px;
            cursor: ${cfg.lastConnected ? 'pointer' : 'not-allowed'};
            transition: all 0.2s;
          " ${cfg.lastConnected ? '' : 'disabled'}>下一步 NEXT →</button>
        </div>
      </div>
    `;
  }

  private setupEventListeners(): void {
    if (!this.container) return;

    const node = this.container.node as HTMLElement;

    const serverTypeInputs = node.querySelectorAll('input[name="serverType"]');
    const connectionModeInputs = node.querySelectorAll('input[name="connectionMode"]');
    const endpointInput = node.querySelector('#endpoint-input') as HTMLInputElement;
    const testBtn = node.querySelector('#test-btn') as HTMLButtonElement;
    const nextBtn = node.querySelector('#next-btn') as HTMLButtonElement;
    const statusMsg = node.querySelector('#status-message') as HTMLElement;
    const endpointLabel = node.querySelector('#endpoint-label') as HTMLElement;
    const connectionModeGroup = node.querySelector('#connection-mode-group') as HTMLElement;
    const localHint = node.querySelector('#local-hint') as HTMLElement;

    serverTypeInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.currentConfig.serverType = target.value as 'local' | 'remote';
        
        if (this.currentConfig.serverType === 'local') {
          endpointLabel.textContent = '本地地址 ENDPOINT';
          endpointInput.placeholder = 'http://localhost:18789';
          if (!endpointInput.value || endpointInput.value.includes('.')) {
            endpointInput.value = 'http://localhost:18789';
          }
          connectionModeGroup.style.display = 'none';
          localHint.style.display = 'block';
        } else {
          endpointLabel.textContent = '远程地址 ENDPOINT';
          endpointInput.placeholder = 'https://your-server:18789';
          connectionModeGroup.style.display = 'block';
          localHint.style.display = 'none';
        }
      });
    });

    connectionModeInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.currentConfig.connectionMode = target.value as 'http' | 'websocket';
      });
    });

    endpointInput?.addEventListener('input', () => {
      this.currentConfig.endpoint = endpointInput.value;
    });

    testBtn?.addEventListener('click', async () => {
      testBtn.disabled = true;
      testBtn.textContent = '测试中...';
      statusMsg.style.display = 'block';
      statusMsg.style.background = `${THEME.accentDim}`;
      statusMsg.style.color = THEME.accent;

      if (this.currentConfig.serverType === 'local') {
        statusMsg.textContent = '正在测试 HTTP API...';
      } else {
        statusMsg.textContent = `正在连接 (${this.currentConfig.connectionMode.toUpperCase()})...`;
      }

      await openClawService.saveConfig(this.currentConfig);
      
      const result = await openClawService.testConnection();

      if (result.success) {
        statusMsg.style.background = '#1a2a1a';
        statusMsg.style.color = THEME.success;
        statusMsg.innerHTML = `✓ 连接成功: ${result.message}<br><span style="color: ${THEME.textMuted}; font-size: 10px;">配置已保存</span>`;
        
        this.currentConfig = openClawService.getConfig()!;
        
        nextBtn.disabled = false;
        nextBtn.style.background = THEME.success;
        nextBtn.style.color = THEME.bg;
        nextBtn.style.cursor = 'pointer';
      } else {
        statusMsg.style.background = '#2a1a1a';
        statusMsg.style.color = THEME.error;
        statusMsg.innerHTML = `✗ 连接失败: ${result.error}<br><span style="color: ${THEME.textMuted}; font-size: 10px;">请检查 OpenClaw Gateway 是否已启动</span>`;
      }

      testBtn.disabled = false;
      testBtn.textContent = '测试连接 TEST';
    });

    nextBtn?.addEventListener('click', () => {
      if (!nextBtn.disabled) {
        this.config.onConfigured();
      }
    });
  }

  destroy(): void {
    this.container?.destroy();
  }
}

export default OpenClawConfigPanel;

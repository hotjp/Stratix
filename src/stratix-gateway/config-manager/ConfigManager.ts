/**
 * Stratix Gateway - 配置管理器
 * 
 * 管理 Agent 配置的持久化存储和 CRUD 操作
 * 使用 lowdb 进行本地 JSON 数据库存储
 */

import { StratixAgentConfig, StratixApiResponse } from '../../stratix-core/stratix-protocol';
import { StratixConfigValidator, StratixRequestHelper } from '../../stratix-core/utils';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { ensureDirSync } from 'fs-extra';
import path from 'path';

interface StratixDatabase {
  agents: StratixAgentConfig[];
  templates: StratixAgentConfig[];
}

export class ConfigManager {
  private db: Low<StratixDatabase>;
  private dbPath: string;
  private validator: StratixConfigValidator;
  private requestHelper: StratixRequestHelper;

  constructor(dbPath: string = 'stratix-data/stratix.db.json') {
    this.dbPath = dbPath;
    this.validator = StratixConfigValidator.getInstance();
    this.requestHelper = StratixRequestHelper.getInstance();
    
    this.initializeDatabase();
    this.db = new Low<StratixDatabase>(
      new JSONFile<StratixDatabase>(this.dbPath),
      { agents: [], templates: [] }
    );
  }

  private initializeDatabase(): void {
    const dir = path.dirname(this.dbPath);
    ensureDirSync(dir);
  }

  public async createAgent(config: StratixAgentConfig): Promise<StratixApiResponse<StratixAgentConfig>> {
    const validation = this.validator.validateAgentConfig(config);
    if (!validation.valid) {
      return this.requestHelper.badRequest(`配置验证失败: ${validation.errors.join(', ')}`);
    }

    await this.db.read();
    
    const existing = this.db.data.agents.find(a => a.agentId === config.agentId);
    if (existing) {
      return this.requestHelper.error(409, 'Agent already exists');
    }

    this.db.data.agents.push(config);
    await this.db.write();

    return this.requestHelper.success(config, 'Agent created');
  }

  public async getAgent(agentId: string): Promise<StratixAgentConfig | null> {
    await this.db.read();
    return this.db.data.agents.find(a => a.agentId === agentId) || null;
  }

  public async listAgents(): Promise<StratixAgentConfig[]> {
    await this.db.read();
    return this.db.data.agents;
  }

  public async saveAgent(config: StratixAgentConfig): Promise<StratixApiResponse<StratixAgentConfig>> {
    const validation = this.validator.validateAgentConfig(config);
    if (!validation.valid) {
      return this.requestHelper.badRequest(`配置验证失败: ${validation.errors.join(', ')}`);
    }

    await this.db.read();
    
    const index = this.db.data.agents.findIndex(a => a.agentId === config.agentId);
    if (index >= 0) {
      this.db.data.agents[index] = config;
    } else {
      this.db.data.agents.push(config);
    }
    
    await this.db.write();

    return this.requestHelper.success(config, 'Agent saved');
  }

  public async deleteAgent(agentId: string): Promise<StratixApiResponse<null>> {
    await this.db.read();
    
    const index = this.db.data.agents.findIndex(a => a.agentId === agentId);
    if (index < 0) {
      return this.requestHelper.notFound('Agent not found');
    }

    this.db.data.agents = this.db.data.agents.filter(a => a.agentId !== agentId);
    await this.db.write();

    return this.requestHelper.success(null, 'Agent deleted');
  }
}

export default ConfigManager;

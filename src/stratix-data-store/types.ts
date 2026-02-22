import { StratixAgentConfig } from '../stratix-core/stratix-protocol';

export interface StratixCommandLog {
  logId: string;
  commandId: string;
  agentId: string;
  skillId: string;
  skillName: string;
  params: Record<string, any>;
  status: 'pending' | 'running' | 'success' | 'failed';
  result?: string;
  error?: string;
  startTime: number;
  endTime?: number;
}

export interface StratixDatabaseMetadata {
  createdAt: number;
  updatedAt: number;
}

export interface StratixTemplates {
  preset: StratixAgentConfig[];
  custom: StratixAgentConfig[];
}

export interface StratixDatabase {
  version: string;
  agents: StratixAgentConfig[];
  templates: StratixTemplates;
  logs: StratixCommandLog[];
  metadata: StratixDatabaseMetadata;
}

export const DEFAULT_DB: StratixDatabase = {
  version: '1.0.0',
  agents: [],
  templates: { preset: [], custom: [] },
  logs: [],
  metadata: { createdAt: Date.now(), updatedAt: Date.now() }
};

export interface LogQueryOptions {
  agentId?: string;
  status?: StratixCommandLog['status'];
  limit?: number;
  offset?: number;
}

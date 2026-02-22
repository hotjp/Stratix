/**
 * Stratix Gateway - 模板管理器
 * 
 * 管理 Agent 配置模板，提供模板的增删改查、导入导出功能
 * 支持模板分类和标签管理
 */

import { StratixAgentConfig, StratixApiResponse } from '../../stratix-core/stratix-protocol';
import { StratixRequestHelper } from '../../stratix-core/utils';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { ensureDirSync } from 'fs-extra';
import path from 'path';
import { randomBytes } from 'crypto';

const generateId = (): string => {
  return `${Date.now()}-${randomBytes(8).toString('hex')}`;
};

export interface StratixTemplate {
  templateId: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  config: StratixAgentConfig;
  createdAt: number;
  updatedAt: number;
  isBuiltIn: boolean;
}

export interface TemplateFilter {
  category?: string;
  tags?: string[];
  keyword?: string;
}

export interface TemplateExportData {
  version: string;
  exportedAt: number;
  templates: StratixTemplate[];
}

type ConflictStrategy = 'overwrite' | 'skip' | 'rename';

interface TemplateDatabase {
  templates: StratixTemplate[];
}

const BUILT_IN_TEMPLATES: Omit<StratixTemplate, 'templateId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'AI 文案助手',
    description: '专业的 AI 文案创作助手，支持多种文案风格',
    category: 'copywriting',
    tags: ['文案', '创作', 'AI'],
    isBuiltIn: true,
    config: {
      agentId: '',
      name: 'AI 文案助手',
      type: 'writer',
      soul: {
        identity: '专业的文案创作专家',
        goals: ['创作高质量文案', '满足用户需求', '保持创意'],
        personality: '专业、创意、细致',
      },
      memory: {
        shortTerm: [],
        longTerm: [],
        context: '文案创作场景',
      },
      skills: [],
      model: {
        name: 'gpt-4',
        params: { temperature: 0.7, maxTokens: 2000 },
      },
      openClawConfig: {
        accountId: '',
        endpoint: 'http://localhost:3000',
      },
    },
  },
  {
    name: '代码生成助手',
    description: '智能代码生成和优化助手',
    category: 'development',
    tags: ['代码', '开发', 'AI'],
    isBuiltIn: true,
    config: {
      agentId: '',
      name: '代码生成助手',
      type: 'dev',
      soul: {
        identity: '专业的软件开发工程师',
        goals: ['生成高质量代码', '优化代码结构', '解决技术问题'],
        personality: '严谨、高效、创新',
      },
      memory: {
        shortTerm: [],
        longTerm: [],
        context: '软件开发场景',
      },
      skills: [],
      model: {
        name: 'gpt-4',
        params: { temperature: 0.3, maxTokens: 4000 },
      },
      openClawConfig: {
        accountId: '',
        endpoint: 'http://localhost:3000',
      },
    },
  },
  {
    name: '数据分析助手',
    description: '专业的数据分析和可视化助手',
    category: 'analysis',
    tags: ['数据', '分析', '可视化'],
    isBuiltIn: true,
    config: {
      agentId: '',
      name: '数据分析助手',
      type: 'analyst',
      soul: {
        identity: '专业的数据分析师',
        goals: ['分析数据趋势', '提供洞察建议', '生成可视化报告'],
        personality: '严谨、客观、细致',
      },
      memory: {
        shortTerm: [],
        longTerm: [],
        context: '数据分析场景',
      },
      skills: [],
      model: {
        name: 'gpt-4',
        params: { temperature: 0.2, maxTokens: 3000 },
      },
      openClawConfig: {
        accountId: '',
        endpoint: 'http://localhost:3000',
      },
    },
  },
];

const TEMPLATE_CATEGORIES = ['copywriting', 'development', 'analysis', 'marketing', 'custom'];

export class TemplateManager {
  private db: Low<TemplateDatabase>;
  private dbPath: string;
  private requestHelper: StratixRequestHelper;

  constructor(dbPath: string = 'stratix-data/stratix.db.json') {
    this.dbPath = dbPath.replace('.db.json', '.templates.db.json');
    this.requestHelper = StratixRequestHelper.getInstance();
    this.initializeDatabase();
    this.db = new Low<TemplateDatabase>(
      new JSONFile<TemplateDatabase>(this.dbPath),
      { templates: [] }
    );
    this.initBuiltInTemplates();
  }

  private initializeDatabase(): void {
    const dir = path.dirname(this.dbPath);
    ensureDirSync(dir);
  }

  private async initBuiltInTemplates(): Promise<void> {
    await this.db.read();

    for (const template of BUILT_IN_TEMPLATES) {
      const existing = this.db.data.templates.find(
        t => t.name === template.name && t.isBuiltIn
      );
      if (!existing) {
        const now = Date.now();
        this.db.data.templates.push({
          ...template,
          templateId: `template-built-in-${generateId()}`,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    await this.db.write();
  }

  public async createTemplate(
    template: Omit<StratixTemplate, 'templateId' | 'createdAt' | 'updatedAt'>
  ): Promise<StratixApiResponse<StratixTemplate>> {
    await this.db.read();

    const now = Date.now();
    const newTemplate: StratixTemplate = {
      ...template,
      templateId: `template-${generateId()}`,
      createdAt: now,
      updatedAt: now,
      isBuiltIn: false,
    };

    this.db.data.templates.push(newTemplate);
    await this.db.write();

    return this.requestHelper.success(newTemplate, 'Template created');
  }

  public async getTemplate(templateId: string): Promise<StratixTemplate | null> {
    await this.db.read();
    return this.db.data.templates.find(t => t.templateId === templateId) || null;
  }

  public async listTemplates(filter?: TemplateFilter): Promise<StratixTemplate[]> {
    await this.db.read();
    let templates = [...this.db.data.templates];

    if (filter) {
      if (filter.category) {
        templates = templates.filter(t => t.category === filter.category);
      }
      if (filter.tags && filter.tags.length > 0) {
        templates = templates.filter(t =>
          filter.tags!.some(tag => t.tags.includes(tag))
        );
      }
      if (filter.keyword) {
        const keyword = filter.keyword.toLowerCase();
        templates = templates.filter(
          t =>
            t.name.toLowerCase().includes(keyword) ||
            t.description.toLowerCase().includes(keyword)
        );
      }
    }

    return templates;
  }

  public async updateTemplate(
    templateId: string,
    updates: Partial<StratixTemplate>
  ): Promise<StratixApiResponse<StratixTemplate>> {
    await this.db.read();

    const index = this.db.data.templates.findIndex(t => t.templateId === templateId);
    if (index < 0) {
      return this.requestHelper.notFound('Template not found');
    }

    const template = this.db.data.templates[index];
    if (template.isBuiltIn) {
      return this.requestHelper.error(403, 'Cannot modify built-in template');
    }

    const updatedTemplate: StratixTemplate = {
      ...template,
      ...updates,
      templateId: template.templateId,
      createdAt: template.createdAt,
      updatedAt: Date.now(),
      isBuiltIn: template.isBuiltIn,
    };

    this.db.data.templates[index] = updatedTemplate;
    await this.db.write();

    return this.requestHelper.success(updatedTemplate, 'Template updated');
  }

  public async deleteTemplate(templateId: string): Promise<StratixApiResponse<null>> {
    await this.db.read();

    const index = this.db.data.templates.findIndex(t => t.templateId === templateId);
    if (index < 0) {
      return this.requestHelper.notFound('Template not found');
    }

    const template = this.db.data.templates[index];
    if (template.isBuiltIn) {
      return this.requestHelper.error(403, 'Cannot delete built-in template');
    }

    this.db.data.templates = this.db.data.templates.filter(t => t.templateId !== templateId);
    await this.db.write();

    return this.requestHelper.success(null, 'Template deleted');
  }

  public async exportTemplates(templateIds?: string[]): Promise<TemplateExportData> {
    await this.db.read();

    let templates = this.db.data.templates;
    if (templateIds && templateIds.length > 0) {
      templates = templates.filter(t => templateIds.includes(t.templateId));
    }

    return {
      version: '1.0.0',
      exportedAt: Date.now(),
      templates,
    };
  }

  public async importTemplates(
    data: TemplateExportData,
    conflictStrategy: ConflictStrategy = 'skip'
  ): Promise<{ imported: number; skipped: number }> {
    await this.db.read();

    let imported = 0;
    let skipped = 0;

    for (const template of data.templates) {
      const existing = this.db.data.templates.find(t => t.templateId === template.templateId);

      if (existing) {
        switch (conflictStrategy) {
          case 'overwrite':
            const index = this.db.data.templates.findIndex(t => t.templateId === template.templateId);
            this.db.data.templates[index] = {
              ...template,
              updatedAt: Date.now(),
            };
            imported++;
            break;
          case 'skip':
            skipped++;
            break;
          case 'rename':
            const renamedTemplate: StratixTemplate = {
              ...template,
              templateId: `template-${generateId()}`,
              name: `${template.name} (imported)`,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              isBuiltIn: false,
            };
            this.db.data.templates.push(renamedTemplate);
            imported++;
            break;
        }
      } else {
        this.db.data.templates.push({
          ...template,
          createdAt: template.createdAt || Date.now(),
          updatedAt: Date.now(),
          isBuiltIn: false,
        });
        imported++;
      }
    }

    await this.db.write();
    return { imported, skipped };
  }

  public async getCategories(): Promise<string[]> {
    return [...TEMPLATE_CATEGORIES];
  }

  public async getTags(): Promise<string[]> {
    await this.db.read();
    const tagSet = new Set<string>();
    this.db.data.templates.forEach(t => t.tags.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet);
  }

  public async createFromTemplate(
    templateId: string,
    overrides?: Partial<StratixAgentConfig>
  ): Promise<StratixAgentConfig | null> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      return null;
    }

    return {
      ...template.config,
      ...overrides,
      agentId: overrides?.agentId || `agent-${generateId()}`,
    };
  }
}

export default TemplateManager;

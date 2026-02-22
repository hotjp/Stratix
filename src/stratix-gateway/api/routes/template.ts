/**
 * Stratix Gateway - 模板管理 API 路由
 */

import { Router, Request, Response } from 'express';
import { ConfigManager } from '../../config-manager/ConfigManager';
import { StratixRequestHelper } from '../../../stratix-core/utils';
import { Low } from 'lowdb';

interface StratixTemplateConfig {
  templateId: string;
  name: string;
  type: string;
  description?: string;
  skills: any[];
  createdAt?: number;
}

interface StratixDatabase {
  agents: any[];
  templates: StratixTemplateConfig[];
}

const router = Router();
const configManager = new ConfigManager();
const requestHelper = StratixRequestHelper.getInstance();

router.get('/list', async (req: Request, res: Response) => {
  try {
    res.json(requestHelper.success([], 'Templates fetched'));
  } catch (error) {
    res.status(500).json(requestHelper.serverError('Internal server error'));
  }
});

router.post('/import', async (req: Request, res: Response) => {
  try {
    const template = req.body;
    res.json(requestHelper.success(template, 'Template imported'));
  } catch (error) {
    res.status(500).json(requestHelper.serverError('Internal server error'));
  }
});

router.post('/export', async (req: Request, res: Response) => {
  try {
    const { templateId, format = 'json' } = req.body;
    res.json(requestHelper.success({ templateId }, 'Template exported'));
  } catch (error) {
    res.status(500).json(requestHelper.serverError('Internal server error'));
  }
});

export default router;

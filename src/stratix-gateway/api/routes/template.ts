/**
 * Stratix Gateway - 模板管理 API 路由
 */

import { Router, Request, Response } from 'express';
import { TemplateManager } from '../../config-manager/TemplateManager';
import { StratixRequestHelper } from '../../../stratix-core/utils';

const router = Router();
const templateManager = new TemplateManager();
const requestHelper = StratixRequestHelper.getInstance();

router.get('/list', async (req: Request, res: Response) => {
  try {
    const { category, tags, keyword } = req.query;
    const filter: any = {};
    if (category) filter.category = category;
    if (tags) filter.tags = String(tags).split(',');
    if (keyword) filter.keyword = keyword;

    const templates = await templateManager.listTemplates(filter);
    res.json(requestHelper.success(templates, 'Templates fetched'));
  } catch (error) {
    res.status(500).json(requestHelper.serverError('Internal server error'));
  }
});

router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await templateManager.getCategories();
    res.json(requestHelper.success(categories, 'Categories fetched'));
  } catch (error) {
    res.status(500).json(requestHelper.serverError('Internal server error'));
  }
});

router.get('/tags', async (req: Request, res: Response) => {
  try {
    const tags = await templateManager.getTags();
    res.json(requestHelper.success(tags, 'Tags fetched'));
  } catch (error) {
    res.status(500).json(requestHelper.serverError('Internal server error'));
  }
});

router.get('/:templateId', async (req: Request, res: Response): Promise<void> => {
  try {
    const templateId = String(req.params.templateId);
    const template = await templateManager.getTemplate(templateId);
    if (!template) {
      res.status(404).json(requestHelper.notFound('Template not found'));
      return;
    }
    res.json(requestHelper.success(template, 'Template fetched'));
  } catch (error) {
    res.status(500).json(requestHelper.serverError('Internal server error'));
  }
});

router.post('/create', async (req: Request, res: Response) => {
  try {
    const result = await templateManager.createTemplate(req.body);
    res.status(result.code === 200 ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json(requestHelper.serverError('Internal server error'));
  }
});

router.put('/:templateId', async (req: Request, res: Response): Promise<void> => {
  try {
    const templateId = String(req.params.templateId);
    const result = await templateManager.updateTemplate(templateId, req.body);
    res.status(result.code).json(result);
  } catch (error) {
    res.status(500).json(requestHelper.serverError('Internal server error'));
  }
});

router.delete('/:templateId', async (req: Request, res: Response): Promise<void> => {
  try {
    const templateId = String(req.params.templateId);
    const result = await templateManager.deleteTemplate(templateId);
    res.status(result.code).json(result);
  } catch (error) {
    res.status(500).json(requestHelper.serverError('Internal server error'));
  }
});

router.post('/import', async (req: Request, res: Response) => {
  try {
    const { data, conflictStrategy = 'skip' } = req.body;
    const result = await templateManager.importTemplates(data, conflictStrategy);
    res.json(requestHelper.success(result, 'Templates imported'));
  } catch (error) {
    res.status(500).json(requestHelper.serverError('Internal server error'));
  }
});

router.post('/export', async (req: Request, res: Response) => {
  try {
    const { templateIds } = req.body;
    const exportData = await templateManager.exportTemplates(templateIds);
    res.json(requestHelper.success(exportData, 'Templates exported'));
  } catch (error) {
    res.status(500).json(requestHelper.serverError('Internal server error'));
  }
});

router.post('/apply/:templateId', async (req: Request, res: Response): Promise<void> => {
  try {
    const templateId = String(req.params.templateId);
    const overrides = req.body;
    const config = await templateManager.createFromTemplate(templateId, overrides);
    if (!config) {
      res.status(404).json(requestHelper.notFound('Template not found'));
      return;
    }
    res.json(requestHelper.success(config, 'Agent config created from template'));
  } catch (error) {
    res.status(500).json(requestHelper.serverError('Internal server error'));
  }
});

export default router;

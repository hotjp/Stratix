/**
 * Stratix Gateway - Agent 配置 API 路由
 */

import { Router, Request, Response } from 'express';
import { ConfigManager } from '../../config-manager/ConfigManager';
import { StratixRequestHelper } from '../../../stratix-core/utils';

const router = Router();
const configManager = new ConfigManager();
const requestHelper = StratixRequestHelper.getInstance();

router.post('/create', async (req: Request, res: Response) => {
  try {
    const agentConfig = req.body;
    const result = await configManager.createAgent(agentConfig);
    res.json(result);
  } catch (error) {
    res.status(500).json(requestHelper.serverError('Internal server error'));
  }
});

router.put('/save', async (req: Request, res: Response) => {
  try {
    const agentConfig = req.body;
    const result = await configManager.saveAgent(agentConfig);
    res.json(result);
  } catch (error) {
    res.status(500).json(requestHelper.serverError('Internal server error'));
  }
});

router.get('/get', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.query;
    const agent = await configManager.getAgent(agentId as string);
    
    if (!agent) {
      res.json(requestHelper.notFound('Agent not found'));
    } else {
      res.json(requestHelper.success(agent, 'Agent fetched'));
    }
  } catch (error) {
    res.status(500).json(requestHelper.serverError('Internal server error'));
  }
});

router.delete('/delete', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.query;
    const result = await configManager.deleteAgent(agentId as string);
    res.json(result);
  } catch (error) {
    res.status(500).json(requestHelper.serverError('Internal server error'));
  }
});

router.get('/list', async (req: Request, res: Response) => {
  try {
    const agents = await configManager.listAgents();
    res.json(requestHelper.success(agents, 'Agents fetched'));
  } catch (error) {
    res.status(500).json(requestHelper.serverError('Internal server error'));
  }
});

export default router;

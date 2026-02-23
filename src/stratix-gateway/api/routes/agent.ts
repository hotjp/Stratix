import { Router, Request, Response } from 'express';
import { dataStoreService } from '../../dataStoreService';
import { StratixRequestHelper } from '../../../stratix-core/utils';
import { StratixConfigValidator } from '../../../stratix-core/utils';

const router = Router();
const requestHelper = StratixRequestHelper.getInstance();
const validator = StratixConfigValidator.getInstance();

router.post('/create', async (req: Request, res: Response) => {
  try {
    const agentConfig = req.body;
    
    const validation = validator.validateAgentConfig(agentConfig);
    if (!validation.valid) {
      res.json(requestHelper.badRequest(`配置验证失败: ${validation.errors.join(', ')}`));
      return;
    }

    const store = dataStoreService.getStore();
    const existing = await store.getAgent(agentConfig.agentId);
    if (existing) {
      res.json(requestHelper.error(409, 'Agent already exists'));
      return;
    }

    await store.saveAgent(agentConfig);
    res.json(requestHelper.success(agentConfig, 'Agent created'));
  } catch (error) {
    res.status(500).json(requestHelper.serverError('Internal server error'));
  }
});

router.put('/save', async (req: Request, res: Response) => {
  try {
    const agentConfig = req.body;
    
    const validation = validator.validateAgentConfig(agentConfig);
    if (!validation.valid) {
      res.json(requestHelper.badRequest(`配置验证失败: ${validation.errors.join(', ')}`));
      return;
    }

    const store = dataStoreService.getStore();
    await store.saveAgent(agentConfig);
    res.json(requestHelper.success(agentConfig, 'Agent saved'));
  } catch (error) {
    res.status(500).json(requestHelper.serverError('Internal server error'));
  }
});

router.get('/get', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.query;
    const store = dataStoreService.getStore();
    const agent = await store.getAgent(agentId as string);
    
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
    const store = dataStoreService.getStore();
    const deleted = await store.deleteAgent(agentId as string);
    
    if (!deleted) {
      res.json(requestHelper.notFound('Agent not found'));
    } else {
      res.json(requestHelper.success(null, 'Agent deleted'));
    }
  } catch (error) {
    res.status(500).json(requestHelper.serverError('Internal server error'));
  }
});

router.get('/list', async (req: Request, res: Response) => {
  try {
    const store = dataStoreService.getStore();
    const agents = await store.listAgents();
    res.json(requestHelper.success(agents, 'Agents fetched'));
  } catch (error) {
    res.status(500).json(requestHelper.serverError('Internal server error'));
  }
});

export default router;

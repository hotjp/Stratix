import { Router, Request, Response } from 'express';
import { StratixRequestHelper } from '../../../stratix-core/utils';
import http from 'http';
import https from 'https';
import WebSocket, { WebSocketServer } from 'ws';

const router = Router();
const requestHelper = StratixRequestHelper.getInstance();

interface ProxyConfig {
  endpoint: string;
  apiKey?: string;
}

const activeProxies = new Map<string, ProxyConfig>();
let wss: WebSocketServer | null = null;

function getProxyKey(endpoint: string): string {
  return endpoint.replace(/[^a-zA-Z0-9]/g, '_');
}

router.post('/connect', async (req: Request, res: Response) => {
  try {
    const { endpoint, apiKey } = req.body;
    
    if (!endpoint) {
      res.status(400).json(requestHelper.badRequest('endpoint is required'));
      return;
    }

    const proxyKey = getProxyKey(endpoint);
    activeProxies.set(proxyKey, { endpoint, apiKey });

    res.json(requestHelper.success({ 
      endpoint, 
      connected: true,
      proxyKey
    }, 'OpenClaw connection configured'));
  } catch {
    res.status(500).json(requestHelper.serverError('Internal server error'));
  }
});

router.get('/test', async (req: Request, res: Response) => {
  try {
    const endpoint = req.query.endpoint as string;
    const apiKey = req.query.apiKey as string | undefined;
    
    if (!endpoint) {
      res.status(400).json(requestHelper.badRequest('endpoint is required'));
      return;
    }

    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        res.json(requestHelper.success({ 
          endpoint, 
          connected: true,
          status: response.status 
        }, 'OpenClaw connection successful'));
      } else {
        res.json(requestHelper.error(response.status, `OpenClaw returned status ${response.status}`));
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    const err = error as Error;
    res.json(requestHelper.error(502, `Connection failed: ${err.message}`));
  }
});

router.use('/proxy/:proxyKey', (req: Request, res: Response) => {
  const proxyKey = String(req.params.proxyKey);
  const config = activeProxies.get(proxyKey);
  
  if (!config) {
    res.status(404).json(requestHelper.notFound('OpenClaw connection not found. Call /connect first.'));
    return;
  }

  const baseUrl = `/api/stratix/openclaw/proxy/${proxyKey}`;
  const pathAfterProxy = req.originalUrl.slice(req.originalUrl.indexOf(baseUrl) + baseUrl.length) || '/';
  const targetUrl = `${config.endpoint}${pathAfterProxy}`;
  const urlObj = new URL(targetUrl);
  
  const isHttps = urlObj.protocol === 'https:';
  const httpModule = isHttps ? https : http;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Host': urlObj.host,
  };
  
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }
  
  const agentId = req.headers['x-openclaw-agent-id'];
  if (agentId) {
    headers['x-openclaw-agent-id'] = Array.isArray(agentId) ? agentId[0] : agentId;
  }

  const bodyData = ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body);

  const options: http.RequestOptions = {
    hostname: urlObj.hostname,
    port: urlObj.port || (isHttps ? 443 : 80),
    path: urlObj.pathname + urlObj.search,
    method: req.method,
    headers,
    timeout: 60000,
  };

  const proxyReq = httpModule.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode || 502);
    
    const contentType = proxyRes.headers['content-type'];
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('[OpenClaw Proxy] Error:', err.message);
    if (!res.headersSent) {
      res.status(502).json(requestHelper.error(502, `OpenClaw connection failed: ${err.message}`));
    }
  });

  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    if (!res.headersSent) {
      res.status(504).json(requestHelper.error(504, 'OpenClaw request timeout'));
    }
  });

  if (bodyData) {
    proxyReq.write(bodyData);
  }
  
  proxyReq.end();
});

router.post('/disconnect', async (req: Request, res: Response) => {
  try {
    const { endpoint } = req.body;
    
    if (!endpoint) {
      res.status(400).json(requestHelper.badRequest('endpoint is required'));
      return;
    }

    const proxyKey = getProxyKey(endpoint);
    activeProxies.delete(proxyKey);

    res.json(requestHelper.success({ endpoint }, 'OpenClaw connection removed'));
  } catch {
    res.status(500).json(requestHelper.serverError('Internal server error'));
  }
});

router.get('/connections', async (_req: Request, res: Response) => {
  try {
    const connections = Array.from(activeProxies.entries()).map(([key, config]) => ({
      proxyKey: key,
      endpoint: config.endpoint
    }));
    res.json(requestHelper.success(connections, 'Active connections'));
  } catch {
    res.status(500).json(requestHelper.serverError('Internal server error'));
  }
});

export function initWebSocketServer(server: http.Server) {
  wss = new WebSocketServer({ noServer: true });
  
  wss.on('connection', (clientWs: WebSocket, req: http.IncomingMessage, proxyKey: string, targetPath: string) => {
    const config = activeProxies.get(proxyKey);
    
    if (!config) {
      clientWs.close(1008, 'Proxy not found');
      return;
    }
    
    const targetUrl = `${config.endpoint}${targetPath}`;
    const urlObj = new URL(targetUrl);
    const wsProtocol = urlObj.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${urlObj.host}${urlObj.pathname}${urlObj.search}`;
    
    console.log('[WS Proxy] Connecting to:', wsUrl);
    
    const targetWs = new WebSocket(wsUrl, {
      headers: {
        'Host': urlObj.host,
        ...(config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}),
      },
    });
    
    targetWs.on('open', () => {
      console.log('[WS Proxy] Connected to target');
    });
    
    targetWs.on('message', (data: Buffer, isBinary: boolean) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(data, { binary: isBinary });
      }
    });
    
    targetWs.on('close', (code, reason) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close(code, reason);
      }
    });
    
    targetWs.on('error', (err: Error) => {
      console.error('[WS Proxy] Target error:', err.message);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close(1011, 'Target connection error');
      }
    });
    
    clientWs.on('message', (data: Buffer, isBinary: boolean) => {
      if (targetWs.readyState === WebSocket.OPEN) {
        targetWs.send(data, { binary: isBinary });
      }
    });
    
    clientWs.on('close', () => {
      if (targetWs.readyState === WebSocket.OPEN) {
        targetWs.close();
      }
    });
    
    clientWs.on('error', (err: Error) => {
      console.error('[WS Proxy] Client error:', err.message);
      if (targetWs.readyState === WebSocket.OPEN) {
        targetWs.close();
      }
    });
  });
  
  server.on('upgrade', (req: http.IncomingMessage, socket: any, head: Buffer) => {
    const url = req.url || '';
    const match = url.match(/\/api\/stratix\/openclaw\/proxy\/([^\/]+)(\/.*)?$/);
    
    if (!match || !wss) {
      return;
    }
    
    const proxyKey = match[1];
    const targetPath = match[2] || '/';
    
    console.log('[WS Proxy] Upgrade request for proxy:', proxyKey);
    
    wss.handleUpgrade(req, socket, head, (clientWs) => {
      wss!.emit('connection', clientWs, req, proxyKey, targetPath);
    });
  });
}

export default router;

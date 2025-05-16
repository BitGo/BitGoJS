/**
 * @prettier
 */
import * as express from 'express';
import debug from 'debug';
import { handleV2Sign } from './signing/multisig';

const debugLogger = debug('enclaved:routes');

/**
 * Handler for express ping to check service health
 */
function handlePingExpress(_req: express.Request) {
  return {
    status: 'enclaved express server is ok!',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Handler for version info
 */
function handleVersionInfo(_req: express.Request) {
  const pjson = require('../package.json');
  return {
    version: pjson.version,
    name: pjson.name,
  };
}

/**
 * Adds the ping route handlers
 * @param app Express application
 */
function setupPingRoutes(app: express.Application) {
  app.get('/api/v2/pingexpress', promiseWrapper(handlePingExpress));
  app.get('/api/v2/version', promiseWrapper(handleVersionInfo));
}

function setupSigningRoutes(app: express.Application) {
  app.post('/api/v2/:coin/sign', promiseWrapper(handleV2Sign));
}

function setupKeyGenRoutes(app: express.Application) {
  // Register additional routes here as needed
  debugLogger('KeyGen routes configured');
}

/**
 * Setup all routes for the Enclaved Express application
 * @param app Express application
 */
export function setupRoutes(app: express.Application): void {
  // Register health check routes
  setupPingRoutes(app);

  // Register signing routes
  setupSigningRoutes(app);

  // Register keygen routes
  setupKeyGenRoutes(app);

  // Add a catch-all for unsupported routes
  app.use('*', (_req, res) => {
    res.status(404).json({
      error: 'Route not found or not supported in enclaved mode',
    });
  });

  debugLogger('All routes configured');
}

// promiseWrapper implementation
export function promiseWrapper(promiseRequestHandler: any) {
  return async function promWrapper(req: any, res: any, next: any) {
    debug(`handle: ${req.method} ${req.originalUrl}`);
    try {
      const result = await promiseRequestHandler(req, res, next);
      if (typeof result === 'object' && result !== null && 'body' in result && 'status' in result) {
        const { status, body } = result as { status: number; body: unknown };
        res.status(status).send(body);
      } else {
        res.status(200).send(result);
      }
    } catch (e) {
      res.status(500).json({ error: e.message || String(e) });
    }
  };
}

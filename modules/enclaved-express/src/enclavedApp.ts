/**
 * @prettier
 */
import * as express from 'express';
import * as path from 'path';
import debug from 'debug';
import * as https from 'https';
import * as http from 'http';
import * as morgan from 'morgan';
import * as fs from 'fs';
import * as timeout from 'connect-timeout';
import * as bodyParser from 'body-parser';
import * as _ from 'lodash';
import { SSL_OP_NO_TLSv1 } from 'constants';

import { Config, config, TlsMode } from './config';
import * as routes from './routes';

const debugLogger = debug('enclaved:express');
const pjson = require('../package.json');

/**
 * Set up the logging middleware provided by morgan
 *
 * @param app
 * @param config
 */
function setupLogging(app: express.Application, config: Config): void {
  // Set up morgan for logging, with optional logging into a file
  let middleware;
  if (config.logFile) {
    // create a write stream (in append mode)
    const accessLogPath = path.resolve(config.logFile);
    const accessLogStream = fs.createWriteStream(accessLogPath, { flags: 'a' });
    /* eslint-disable-next-line no-console */
    console.log('Log location: ' + accessLogPath);
    // setup the logger
    middleware = morgan('combined', { stream: accessLogStream });
  } else {
    middleware = morgan('combined');
  }

  app.use(middleware);
  morgan.token('remote-user', function (req: express.Request) {
    return (req as any).clientCert ? (req as any).clientCert.subject.CN : 'unknown';
  });
}

/**
 * Create a startup function which will be run upon server initialization
 *
 * @param config
 * @param baseUri
 * @return {Function}
 */
export function startup(config: Config, baseUri: string): () => void {
  return function () {
    /* eslint-disable no-console */
    console.log('BitGo-Enclaved-Express running');
    console.log(`Base URI: ${baseUri}`);
    /* eslint-enable no-console */
  };
}

function isTLS(config: Config): boolean {
  const { keyPath, crtPath, tlsKey, tlsCert, tlsMode } = config;
  if (tlsMode === TlsMode.DISABLED) return false;
  return Boolean((keyPath && crtPath) || (tlsKey && tlsCert));
}

async function createHttpsServer(app: express.Application, config: Config): Promise<https.Server> {
  const { keyPath, crtPath, tlsKey, tlsCert, tlsMode, mtlsRequestCert, mtlsRejectUnauthorized } = config;
  let key: string;
  let cert: string;
  if (tlsKey && tlsCert) {
    key = tlsKey;
    cert = tlsCert;
  } else if (keyPath && crtPath) {
    const privateKeyPromise = require('fs').promises.readFile(keyPath, 'utf8');
    const certificatePromise = require('fs').promises.readFile(crtPath, 'utf8');
    [key, cert] = await Promise.all([privateKeyPromise, certificatePromise]);
  } else {
    throw new Error('Failed to get TLS key and certificate');
  }

  const httpsOptions: https.ServerOptions = {
    secureOptions: SSL_OP_NO_TLSv1,
    key,
    cert,
    // Add mTLS options if in mTLS mode
    requestCert: tlsMode === TlsMode.MTLS && mtlsRequestCert,
    rejectUnauthorized: tlsMode === TlsMode.MTLS && mtlsRejectUnauthorized,
  };

  const server = https.createServer(httpsOptions, app);

  // Add middleware to validate client certificate fingerprints if in mTLS mode
  if (tlsMode === TlsMode.MTLS && config.mtlsAllowedClientFingerprints?.length) {
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      const clientCert = (req as any).socket?.getPeerCertificate();
      if (!clientCert) {
        return res.status(403).json({ error: 'Client certificate required' });
      }

      const fingerprint = clientCert.fingerprint256?.replace(/:/g, '').toUpperCase();
      if (!fingerprint || !config.mtlsAllowedClientFingerprints?.includes(fingerprint)) {
        return res.status(403).json({ error: 'Invalid client certificate fingerprint' });
      }

      // Store client certificate info for logging
      (req as any).clientCert = clientCert;
      next();
    });
  }

  return server;
}

function createHttpServer(app: express.Application): http.Server {
  return http.createServer(app);
}

export async function createServer(config: Config, app: express.Application): Promise<https.Server | http.Server> {
  const server = isTLS(config) ? await createHttpsServer(app, config) : createHttpServer(app);
  if (config.keepAliveTimeout !== undefined) {
    server.keepAliveTimeout = config.keepAliveTimeout;
  }
  if (config.headersTimeout !== undefined) {
    server.headersTimeout = config.headersTimeout;
  }
  return server;
}

export function createBaseUri(config: Config): string {
  const { bind, port } = config;
  const tls = isTLS(config);
  const isStandardPort = (port === 80 && !tls) || (port === 443 && tls);
  return `http${tls ? 's' : ''}://${bind}${!isStandardPort ? ':' + port : ''}`;
}

/**
 * Create error handling middleware
 */
function errorHandler() {
  return function (err: any, req: express.Request, res: express.Response, _next: express.NextFunction) {
    debugLogger('Error: ' + (err && err.message ? err.message : String(err)));
    const statusCode = err && err.status ? err.status : 500;
    const result = {
      error: err && err.message ? err.message : String(err),
      name: err && err.name ? err.name : 'Error',
      code: err && err.code ? err.code : undefined,
      version: pjson.version,
    };
    return res.status(statusCode).json(result);
  };
}

/**
 * Create and configure the express application
 */
export function app(cfg: Config): express.Application {
  debugLogger('app is initializing');

  const app = express();

  setupLogging(app, cfg);
  debugLogger('logging setup');

  const { debugNamespace } = cfg;

  // enable specified debug namespaces
  if (_.isArray(debugNamespace)) {
    for (const ns of debugNamespace) {
      if (ns && !debug.enabled(ns)) {
        debug.enable(ns);
      }
    }
  }

  // Be more robust about accepting URLs with double slashes
  app.use(function replaceUrlSlashes(req: express.Request, res: express.Response, next: express.NextFunction) {
    req.url = req.url.replace(/\/{2,}/g, '/');
    next();
  });

  // Set timeout
  app.use(timeout(cfg.timeout));

  // Add body parser
  app.use(bodyParser.json({ limit: '20mb' }));

  // Setup routes
  routes.setupRoutes(app);

  // Add error handler
  app.use(errorHandler());

  return app;
}

// Add prepareIpc function
async function prepareIpc(ipcSocketFilePath: string) {
  if (process.platform === 'win32') {
    throw new Error(`IPC option is not supported on platform ${process.platform}`);
  }
  try {
    const stat = fs.statSync(ipcSocketFilePath);
    if (!stat.isSocket()) {
      throw new Error('IPC socket is not actually a socket');
    }
    fs.unlinkSync(ipcSocketFilePath);
  } catch (e: any) {
    if (e.code !== 'ENOENT') {
      throw e;
    }
  }
}

export async function init(): Promise<void> {
  const cfg = config();
  const expressApp = app(cfg);
  const server = await createServer(cfg, expressApp);
  const { port, bind, ipc } = cfg;
  const baseUri = createBaseUri(cfg);

  if (ipc) {
    await prepareIpc(ipc);
    server.listen(ipc, startup(cfg, baseUri));
  } else {
    server.listen(port, bind, startup(cfg, baseUri));
  }
}

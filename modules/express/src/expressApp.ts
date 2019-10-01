/**
 * @prettier
 */
import * as express from 'express';
import * as httpProxy from 'http-proxy';
import * as url from 'url';
import * as Bluebird from 'bluebird';
import * as path from 'path';
import * as _ from 'lodash';
import * as debugLib from 'debug';
import * as https from 'https';
import * as http from 'http';
import * as morgan from 'morgan';
import { Request as StaticRequest } from 'express-serve-static-core';

const fs = Bluebird.promisifyAll(require('fs'));

import { Config, config } from './config';

const debug = debugLib('bitgo:express');

// eslint-disable-next-line @typescript-eslint/camelcase
import { SSL_OP_NO_TLSv1 } from 'constants';
import { NodeEnvironmentError, TlsConfigurationError } from './errors';

import { Environments } from 'bitgo';
import { setupRoutes } from './clientRoutes';
const { version } = require('bitgo/package.json');
const pjson = require('../package.json');

const BITGOEXPRESS_USER_AGENT = `BitGoExpress/${pjson.version} BitGoJS/${version}`;

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
    console.log('Log location: ' + accessLogPath);
    // setup the logger
    middleware = morgan('combined', { stream: accessLogStream });
  } else {
    middleware = morgan('combined');
  }

  app.use(middleware);
  morgan.token('remote-user', function(req) {
    return req.isProxy ? 'proxy' : 'local_express';
  });
}

/**
 * If we're running in a custom env, set the appropriate environment URI and network properties
 *
 * @param config
 */
function configureEnvironment(config: Config): void {
  const { customRootUri, customBitcoinNetwork } = config;
  if (customRootUri) {
    Environments['custom'].uri = customRootUri;
  }

  if (customBitcoinNetwork) {
    Environments['custom'].network = customBitcoinNetwork;
  }
}

/**
 * Create and configure the proxy middleware and add it to the app middleware stack
 *
 * @param app bitgo-express Express app
 * @param config
 */
function configureProxy(app: express.Application, config: Config): void {
  const { env, timeout } = config;

  // Mount the proxy middleware
  const options = {
    timeout: timeout,
    proxyTimeout: timeout,
    secure: true,
  };

  if (Environments[env].network === 'testnet') {
    // Need to do this to make supertest agent pass (set rejectUnauthorized to false)
    options.secure = false;
  }

  const proxy = httpProxy.createProxyServer(options);

  const sendError = (res: http.ServerResponse, status: number, json: object) => {
    res.writeHead(status, {
      'Content-Type': 'application/json',
    });

    res.end(JSON.stringify(json));
  };

  proxy.on('proxyReq', function(proxyReq, req) {
    // Need to rewrite the host, otherwise cross-site protection kicks in
    const parsedUri = url.parse(Environments[env].uri).hostname;
    if (parsedUri) {
      proxyReq.setHeader('host', parsedUri);
    }

    const userAgent = req.headers['user-agent']
      ? BITGOEXPRESS_USER_AGENT + ' ' + req.headers['user-agent']
      : BITGOEXPRESS_USER_AGENT;
    proxyReq.setHeader('User-Agent', userAgent);
  });

  proxy.on('error', (err, _, res) => {
    debug('Proxy server error: ', err);
    sendError(res, 500, {
      error: 'BitGo Express encountered an error while attempting to proxy your request to BitGo. Please try again.',
    });
  });

  proxy.on('econnreset', (err, _, res) => {
    debug('Proxy server connection reset error: ', err);
    sendError(res, 500, {
      error:
        'BitGo Express encountered a connection reset error while attempting to proxy your request to BitGo. Please try again.',
    });
  });

  app.use(function(req: StaticRequest, res: express.Response) {
    if (req.url && (/^\/api\/v[12]\/.*$/.test(req.url) || /^\/oauth\/token.*$/.test(req.url))) {
      req.isProxy = true;
      proxy.web(req, res, { target: Environments[env].uri, changeOrigin: true });
      return;
    }

    // user tried to access a url which is not an api route, do not proxy
    res.status(404).send('bitgo-express can only proxy BitGo API requests');
  });
}

/**
 * Create an HTTP server configured for accepting HTTPS connections
 *
 * @param config application configuration
 * @param app
 * @return {Server}
 */
async function createHttpsServer(app: express.Application, config: Config): Promise<https.Server> {
  const { keyPath, crtPath } = config;
  const privateKeyPromise = fs.readFileAsync(keyPath, 'utf8');
  const certificatePromise = fs.readFileAsync(crtPath, 'utf8');

  const [key, cert] = await Promise.all([privateKeyPromise, certificatePromise]);

  // eslint-disable-next-line @typescript-eslint/camelcase
  return https.createServer({ secureOptions: SSL_OP_NO_TLSv1, key, cert }, app);
}

/**
 * Create an HTTP server configured for accepting plain old HTTP connections
 *
 * @param app
 * @return {Server}
 */
function createHttpServer(app: express.Application): http.Server {
  return http.createServer(app);
}

/**
 * Create a startup function which will be run upon server initialization
 *
 * @param config
 * @param baseUri
 * @return {Function}
 */
export function startup(config: Config, baseUri: string): () => void {
  return function() {
    const { env, customRootUri, customBitcoinNetwork } = config;
    console.log('BitGo-Express running');
    console.log(`Environment: ${env}`);
    console.log(`Base URI: ${baseUri}`);
    if (customRootUri) {
      console.log(`Custom root URI: ${customRootUri}`);
    }
    if (customBitcoinNetwork) {
      console.log(`Custom bitcoin network: ${customBitcoinNetwork}`);
    }
  };
}

/**
 * helper function to determine whether we should run the server over TLS or not
 */
function isTLS(config: Config): boolean {
  const { keyPath, crtPath } = config;
  return Boolean(keyPath && crtPath);
}

/**
 * Create either a HTTP or HTTPS server
 * @param config
 * @param app
 * @return {Server}
 */
export async function createServer(config: Config, app: express.Application) {
  return isTLS(config) ? await createHttpsServer(app, config) : createHttpServer(app);
}

/**
 * Create the base URI where the BitGoExpress server will be available once started
 * @return {string}
 */
export function createBaseUri(config: Config): string {
  const { bind, port } = config;
  const tls = isTLS(config);
  const isStandardPort = (port === 80 && !tls) || (port === 443 && tls);
  return `http${tls ? 's' : ''}://${bind}${!isStandardPort ? ':' + port : ''}`;
}

/**
 * Check environment and other preconditions to ensure bitgo-express can start safely
 * @param config
 */
function checkPreconditions(config: Config) {
  const { env, disableEnvCheck, bind, disableSSL, keyPath, crtPath, customRootUri, customBitcoinNetwork } = config;

  // warn or throw if the NODE_ENV is not production when BITGO_ENV is production - this can leak system info from express
  if (env === 'prod' && process.env.NODE_ENV !== 'production') {
    if (!disableEnvCheck) {
      throw new NodeEnvironmentError(
        'NODE_ENV should be set to production when running against prod environment. Use --disableenvcheck if you really want to run in a non-production node configuration.'
      );
    } else {
      console.warn(
        `warning: unsafe NODE_ENV '${process.env.NODE_ENV}'. NODE_ENV must be set to 'production' when running against BitGo production environment.`
      );
    }
  }

  const needsTLS = env === 'prod' && bind !== 'localhost' && !disableSSL;

  // make sure keyPath and crtPath are set when running over TLS
  if (needsTLS && !(keyPath && crtPath)) {
    throw new TlsConfigurationError('Must enable TLS when running against prod and listening on external interfaces!');
  }

  if (Boolean(keyPath) !== Boolean(crtPath)) {
    throw new TlsConfigurationError('Must provide both keypath and crtpath when running in TLS mode!');
  }

  if ((customRootUri || customBitcoinNetwork) && env !== 'custom') {
    console.warn(`customRootUri or customBitcoinNetwork is set, but env is '${env}'. Setting env to 'custom'.`);
    config.env = 'custom';
  }
}

export function app(cfg: Config): express.Application {
  debug('app is initializing');

  const app = express();

  setupLogging(app, cfg);

  const { debugNamespace, disableProxy } = cfg;

  // enable specified debug namespaces
  if (_.isArray(debugNamespace)) {
    _.forEach(debugNamespace, ns => debugLib.enable(ns));
  }

  checkPreconditions(cfg);

  // Be more robust about accepting URLs with double slashes
  app.use(function(req, res, next) {
    req.url = req.url.replace(/\/\//g, '/');
    next();
  });

  // Decorate the client routes
  setupRoutes(app, cfg);

  configureEnvironment(cfg);

  if (!disableProxy) {
    configureProxy(app, cfg);
  }

  return app;
}

export async function init(): Bluebird<void> {
  const cfg = config();
  const expressApp = app(cfg);

  const server = await createServer(cfg, expressApp);

  const { port, bind } = cfg;
  const baseUri = createBaseUri(cfg);

  server.listen(port, bind, startup(cfg, baseUri));
  server.timeout = 300 * 1000; // 5 minutes
}

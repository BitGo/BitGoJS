/**
 * @prettier
 */
import * as express from 'express';
import * as path from 'path';
import * as _ from 'lodash';
import * as debugLib from 'debug';
import * as https from 'https';
import * as http from 'http';
import * as morgan from 'morgan';
import * as fs from 'fs';
import { Request as StaticRequest } from 'express-serve-static-core';
import * as timeout from 'connect-timeout';

import { Config, config } from './config';

const debug = debugLib('bitgo:express');

import { SSL_OP_NO_TLSv1 } from 'constants';
import { IpcError, NodeEnvironmentError, TlsConfigurationError, ExternalSignerConfigError } from './errors';

import { Environments } from 'bitgo';
import * as clientRoutes from './clientRoutes';

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
  morgan.token('remote-user', function (req: StaticRequest) {
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
 * Create an HTTP server configured for accepting HTTPS connections
 *
 * @param config application configuration
 * @param app
 * @return {Server}
 */
async function createHttpsServer(
  app: express.Application,
  config: Config & { keyPath: string; crtPath: string }
): Promise<https.Server> {
  const { keyPath, crtPath } = config;
  const privateKeyPromise = fs.promises.readFile(keyPath, 'utf8');
  const certificatePromise = fs.promises.readFile(crtPath, 'utf8');

  const [key, cert] = await Promise.all([privateKeyPromise, certificatePromise]);

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
  return function () {
    const { env, ipc, customRootUri, customBitcoinNetwork, signerMode } = config;
    /* eslint-disable no-console */
    console.log('BitGo-Express running');
    console.log(`Environment: ${env}`);
    if (ipc) {
      console.log(`IPC path: ${ipc}`);
    } else {
      console.log(`Base URI: ${baseUri}`);
    }
    if (customRootUri) {
      console.log(`Custom root URI: ${customRootUri}`);
    }
    if (customBitcoinNetwork) {
      console.log(`Custom bitcoin network: ${customBitcoinNetwork}`);
    }
    if (signerMode) {
      console.log(`External signer mode: ${signerMode}`);
    }
    /* eslint-enable no-console */
  };
}

/**
 * helper function to determine whether we should run the server over TLS or not
 */
function isTLS(config: Config): config is Config & { keyPath: string; crtPath: string } {
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
 * Check the that the json file containing the external signer private key exists
 * @param path
 */
function checkSignerPrvPath(path: string) {
  try {
    const privKeyFile = fs.readFileSync(path, { encoding: 'utf8' });
    JSON.parse(privKeyFile);
  } catch (e) {
    throw new Error(`Failed to parse ${path} - ${e.message}`);
  }
}

/**
 * Check environment and other preconditions to ensure bitgo-express can start safely
 * @param config
 */
function checkPreconditions(config: Config) {
  const {
    env,
    disableEnvCheck,
    bind,
    ipc,
    disableSSL,
    keyPath,
    crtPath,
    customRootUri,
    customBitcoinNetwork,
    externalSignerUrl,
    signerMode,
    signerFileSystemPath,
  } = config;

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

  const needsTLS = !ipc && env === 'prod' && bind !== 'localhost' && !disableSSL;

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

  if (externalSignerUrl !== undefined && (signerMode !== undefined || signerFileSystemPath !== undefined)) {
    throw new ExternalSignerConfigError(
      'signerMode or signerFileSystemPath is set, but externalSignerUrl is also set.'
    );
  }

  if ((signerMode !== undefined || signerFileSystemPath !== undefined) && !(signerMode && signerFileSystemPath)) {
    throw new ExternalSignerConfigError(
      'signerMode and signerFileSystemPath must both be set in order to run in external signing mode.'
    );
  }

  if (signerFileSystemPath !== undefined) {
    checkSignerPrvPath(signerFileSystemPath);
  }
}

export function setupRoutes(app: express.Application, config: Config): void {
  if (config.signerMode) {
    clientRoutes.setupSigningRoutes(app, config);
  } else {
    clientRoutes.setupAPIRoutes(app, config);
  }
}

export function app(cfg: Config): express.Application {
  debug('app is initializing');

  const app = express();

  setupLogging(app, cfg);
  debug('logging setup');

  const { debugNamespace } = cfg;

  // enable specified debug namespaces
  if (_.isArray(debugNamespace)) {
    for (const ns of debugNamespace) {
      if (ns && !debugLib.enabled(ns)) {
        debugLib.enable(ns);
      }
    }
  }

  checkPreconditions(cfg);
  debug('preconditions satisfied');

  // Be more robust about accepting URLs with double slashes
  app.use(function replaceUrlSlashes(req, res, next) {
    req.url = req.url.replace(/\/\//g, '/');
    next();
  });

  app.use(timeout(cfg.timeout));

  // Decorate the client routes
  setupRoutes(app, cfg);

  configureEnvironment(cfg);

  return app;
}

/**
 * Prepare to listen on an IPC (unix domain) socket instead of a normal TCP port.
 * @param ipcSocketFilePath path to file where IPC socket should be created
 */
export async function prepareIpc(ipcSocketFilePath: string) {
  if (process.platform === 'win32') {
    throw new IpcError(`IPC option is not supported on platform ${process.platform}`);
  }

  try {
    const stat = fs.statSync(ipcSocketFilePath);
    if (!stat.isSocket()) {
      throw new IpcError('IPC socket is not actually a socket');
    }
    // ipc socket does exist and is indeed a socket. However, the socket cannot already exist prior
    // to being bound since it will be created by express internally when binding. If there's a stale
    // socket from the last run, clean it up before attempting to bind to it again. Arguably, it would
    // be better to do this before exiting, but that gets a bit more complicated when all exit paths
    // need to clean up the socket file correctly.
    fs.unlinkSync(ipcSocketFilePath);
  } catch (e) {
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

import * as express from 'express';
import httpProxy = require('http-proxy');
import url = require('url');
const morgan = require('morgan');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
const _ = require('lodash');
const debugLib = require('debug');
const debug = debugLib('bitgo:express');
const https = require('https');
const http = require('http');
const co = Promise.coroutine;
import { ArgumentParser } from 'argparse';
import { ServerResponse } from 'http';

// eslint-disable-next-line @typescript-eslint/camelcase
import { SSL_OP_NO_TLSv1 } from 'constants';

const { Environments } = require('bitgo');
const { version } = require('bitgo/package.json');
const pjson = require('../package.json');
import { TlsConfigurationError, NodeEnvironmentError } from './errors';

const BITGOEXPRESS_USER_AGENT = `BitGoExpress/${pjson.version} BitGoJS/${version}`;
const DEFAULT_TIMEOUT = 305 * 1000;

/**
 * Do some additional argument validation which can't easily be done in argparse
 *
 * @param args
 * @return {*}
 */
function validateArgs(args) {
  const { env, bind, disablessl, crtpath, keypath, disableenvcheck } = args;
  const needsTLS = env === 'prod' && bind !== 'localhost' && !disablessl;

  if (needsTLS && !(keypath && crtpath)) {
    throw new TlsConfigurationError('Must enable TLS when running against prod and listening on external interfaces!');
  }

  if (Boolean(keypath) !== Boolean(crtpath)) {
    throw new TlsConfigurationError('Must provide both keypath and crtpath when running in TLS mode!');
  }

  if (env === 'prod' && process.env.NODE_ENV !== 'production') {
    if (!disableenvcheck) {
      throw new NodeEnvironmentError('NODE_ENV should be set to production when running against prod environment. Use --disableenvcheck if you really want to run in a non-production node configuration.');
    } else {
      console.warn(`warning: unsafe NODE_ENV '${process.env.NODE_ENV}'. NODE_ENV must be set to 'production' when running against BitGo production environment.`);
    }
  }

  return args;
}

/**
 * Set up the logging middleware provided by morgan
 *
 * @param logfile
 * @param app
 */
function setupLogging({ logfile }, app) {
  // Set up morgan for logging, with optional logging into a file
  let middleware;
  if (logfile) {
    // create a write stream (in append mode)
    const accessLogPath = path.resolve(logfile);
    const accessLogStream = fs.createWriteStream(accessLogPath, { flags: 'a' });
    console.log('Log location: ' + accessLogPath);
    // setup the logger
    middleware = morgan('combined', { stream: accessLogStream });
  } else {
    middleware = morgan('combined');
  }

  app.use(middleware);
  morgan.token('remote-user', function(req) { return req.isProxy ? 'proxy' : 'local_express'; });
}

/**
 * If we're running in a custom env, set the appropriate environment URI and network properties
 *
 * @param args
 */
function configureEnvironment(args) {
  const { customrooturi, custombitcoinnetwork } = args;
  if (customrooturi || custombitcoinnetwork) {
    args.env = 'custom';
  }

  if (customrooturi) {
    Environments['custom'].uri = customrooturi;
  }

  if (custombitcoinnetwork) {
    Environments['custom'].network = custombitcoinnetwork;
  }
}

/**
 * Create and configure the proxy middleware and add it to the app middleware stack
 *
 * @param app bitgo-express Express app
 * @param env BitGo environment name
 * @param timeout Request timeout delay in milliseconds
 */
function configureProxy(app, { env, timeout = DEFAULT_TIMEOUT }) {
  // Mount the proxy middleware
  const options = {
    timeout: timeout,
    proxyTimeout: timeout,
    secure: null
  };

  if (Environments[env].network === 'testnet') {
    // Need to do this to make supertest agent pass (set rejectUnauthorized to false)
    options.secure = false;
  }

  const proxy = httpProxy.createProxyServer(options);

  const sendError = (res: ServerResponse, status: number, json: object) => {
    res.writeHead(status, {
      'Content-Type': 'application/json'
    });

    res.end(JSON.stringify(json));
  };

  proxy.on('proxyReq', function(proxyReq, req) {
    // Need to rewrite the host, otherwise cross-site protection kicks in
    proxyReq.setHeader('host', url.parse(Environments[env].uri).hostname);

    const userAgent = req.headers['user-agent'] ? BITGOEXPRESS_USER_AGENT + ' ' + req.headers['user-agent'] : BITGOEXPRESS_USER_AGENT;
    proxyReq.setHeader('User-Agent', userAgent);
  });

  proxy.on('error', (err, _, res) => {
    debug('Proxy server error: ', err);
    sendError(res, 500, {
      error: 'BitGo Express encountered an error while attempting to proxy your request to BitGo. Please try again.'
    });
  });

  proxy.on('econnreset', (err, _, res) => {
    debug('Proxy server connection reset error: ', err);
    sendError(res, 500, {
      error: 'BitGo Express encountered a connection reset error while attempting to proxy your request to BitGo. Please try again.'
    });
  });

  app.use(function(req, res) {
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
 * @param keypath
 * @param crtpath
 * @param app
 * @return {Server}
 */
function createHttpsServer({ keypath, crtpath }, app) {
  return co(function *createHttpsServer() {
    const privateKeyPromise = fs.readFileAsync(keypath, 'utf8');
    const certificatePromise = fs.readFileAsync(crtpath, 'utf8');

    const [key, cert] = yield Promise.all([privateKeyPromise, certificatePromise]);

    // eslint-disable-next-line @typescript-eslint/camelcase
    return https.createServer({ secureOptions: SSL_OP_NO_TLSv1, key, cert }, app);
  }).call(this);
}

/**
 * Create an HTTP server configured for accepting plain old HTTP connections
 *
 * @param app
 * @return {Server}
 */
function createHttpServer(app) {
  return http.createServer(app);
}

/**
 * Configure argparse with all possible command line arguments
 * @return {*}
 */
module.exports.parseArgs = function() {
  const parser = new ArgumentParser({
    version: pjson.version,
    addHelp: true,
    description: 'BitGo-Express'
  });

  parser.addArgument(['-p', '--port'], {
    defaultValue: 3080,
    type: 'int',
    help: 'Port to listen on'
  });

  parser.addArgument(['-b', '--bind'], {
    defaultValue: 'localhost',
    help: 'Bind to given address to listen for connections (default: localhost)'
  });

  parser.addArgument(['-e', '--env'], {
    defaultValue: 'test',
    help: 'BitGo environment to proxy against (prod, test)'
  });

  parser.addArgument(['-d', '--debug'], {
    action: 'appendConst',
    dest: 'debugnamespace',
    constant: 'bitgo:express',
    help: 'Enable basic debug logging for incoming requests'
  });

  parser.addArgument(['-D', '--debugnamespace'], {
    action: 'append',
    help: 'Enable a specific debugging namespace for more fine-grained debug output. May be given more than once.'
  });

  parser.addArgument(['-k', '--keypath'], {
    help: 'Path to the SSL Key file (required if running production)'
  });

  parser.addArgument(['-c', '--crtpath'], {
    help: 'Path to the SSL Crt file (required if running production)'
  });

  parser.addArgument( ['-u', '--customrooturi'], {
    defaultValue: process.env.BITGO_CUSTOM_ROOT_URI,
    help: 'Force custom root BitGo URI (e.g. https://test.bitgo.com)'
  });

  parser.addArgument(['-n', '--custombitcoinnetwork'], {
    defaultValue: process.env.BITGO_CUSTOM_BITCOIN_NETWORK,
    help: 'Force custom bitcoin network (e.g. testnet)'
  });

  parser.addArgument(['-l', '--logfile'], {
    help: 'Filepath to write the access log'
  });

  parser.addArgument(['--disablessl'], {
    action: 'storeTrue',
    help: 'Allow running against production in non-SSL mode (at your own risk!)'
  });

  parser.addArgument(['--disableproxy'], {
    action: 'storeTrue',
    help: 'disable the proxy, not routing any non-express routes'
  });

  parser.addArgument(['--disableenvcheck'], {
    action: 'storeTrue',
    defaultValue: true, // BG-9584: temporarily disable env check while we give users time to react to change in runtime behavior
    help: 'disable checking for proper NODE_ENV when running in prod environment'
  });

  parser.addArgument(['-t', '--timeout'], {
    defaultValue: (process.env.BITGO_TIMEOUT as any) * 1000 || DEFAULT_TIMEOUT,
    help: 'Proxy server timeout in milliseconds'
  });

  return parser.parseArgs();
};

/**
 * Create a startup function which will be run upon server initialization
 *
 * @param env
 * @param customrooturi
 * @param custombitcoinnetwork
 * @param baseUri
 * @return {Function}
 */
module.exports.startup = function({ env, customrooturi, custombitcoinnetwork } = {} as any, baseUri) {
  return function() {
    console.log('BitGo-Express running');
    console.log(`Environment: ${env}`);
    console.log(`Base URI: ${baseUri}`);
    if (customrooturi) {
      console.log(`Custom root URI: ${customrooturi}`);
    }
    if (custombitcoinnetwork) {
      console.log(`Custom bitcoin network: ${custombitcoinnetwork}`);
    }
  };
};

/**
 * Create either a HTTP or HTTPS server
 * @param args
 * @param tls
 * @param app
 * @return {Server}
 */
module.exports.createServer = co(function *(args = {} as any, tls = false, app) {
  return tls ? yield createHttpsServer(args, app) : createHttpServer(app);
});

/**
 * Create the base URI where the BitGoExpress server will be available once started
 * @param bind
 * @param port
 * @param tls
 * @return {string}
 */
module.exports.createBaseUri = function({ bind, port }, tls) {
  const isStandardPort = (port === 80 && !tls) || (port === 443 && tls);
  return `http${tls ? 's' : ''}://${bind}${!isStandardPort ? ':' + port : ''}`;
};

module.exports.app = function(args) {
  debug('app is initializing');

  validateArgs(args);

  // Create express app
  const app = express();

  setupLogging(args, app);

  // Be more robust about accepting URLs with double slashes
  app.use(function(req, res, next) {
    req.url = req.url.replace(/\/\//g, '/');
    next();
  });

  // enable specified debug namespaces
  if (_.isArray(args.debugnamespace)) {
    _.forEach(args.debugnamespace, (ns) => debugLib.enable(ns));
  }

  // Decorate the client routes
  require('./clientRoutes')(app, args);

  configureEnvironment(args);

  if (!args.disableproxy) {
    configureProxy(app, args);
  }

  return app;
};

/**
 * @prettier
 */
import * as bodyParser from 'body-parser';
import * as bluebird from 'bluebird';
import * as url from 'url';
import * as debugLib from 'debug';
import { BitGo, Coin, Errors } from 'bitgo';
import * as _ from 'lodash';
import * as express from 'express';

// RequestTracer should be extracted into a separate npm package (along with
// the rest of the BitGoJS HTTP request machinery)
import { RequestTracer } from 'bitgo/dist/src/v2/internal/util';

import { Config } from './config';
import { ApiResponseError } from './errors';

const { version } = require('bitgo/package.json');
const pjson = require('../package.json');
const debug = debugLib('bitgo:express');

const BITGOEXPRESS_USER_AGENT = `BitGoExpress/${pjson.version} BitGoJS/${version}`;

declare module 'express-serve-static-core' {
  export interface Request {
    bitgo: BitGo;
  }
}

function handlePing(req: express.Request, res: express.Response, next: express.NextFunction) {
  return req.bitgo.ping();
}

function handlePingExpress(req: express.Request) {
  return {
    status: 'express server is ok!',
  };
}

function handleLogin(req: express.Request) {
  const username = req.body.username || req.body.email;
  const body = req.body;
  body.username = username;
  return req.bitgo.authenticate(body);
}

function handleDecrypt(req: express.Request) {
  return {
    decrypted: req.bitgo.decrypt(req.body),
  };
}

function handleEncrypt(req: express.Request) {
  return {
    encrypted: req.bitgo.encrypt(req.body),
  };
}

/**
 * @deprecated
 * @param req
 */
function handleVerifyAddress(req: express.Request) {
  return {
    verified: req.bitgo.verifyAddress(req.body),
  };
}

/**
 * @deprecated
 * @param req
 */
function handleCreateLocalKeyChain(req: express.Request) {
  return req.bitgo.keychains().create(req.body);
}

/**
 * @deprecated
 * @param req
 */
function handleDeriveLocalKeyChain(req: express.Request) {
  return req.bitgo.keychains().deriveLocal(req.body);
}

/**
 * @deprecated
 * @param req
 */
function handleCreateWalletWithKeychains(req: express.Request) {
  return req.bitgo.wallets().createWalletWithKeychains(req.body);
}

/**
 * @deprecated
 * @param req
 */
function handleSendCoins(req: express.Request) {
  return req.bitgo
    .wallets()
    .get({ id: req.params.id })
    .then(function(wallet) {
      return wallet.sendCoins(req.body);
    })
    .catch(function(err) {
      err.status = 400;
      throw err;
    })
    .then(function(result) {
      if (result.status === 'pendingApproval') {
        throw apiResponse(202, result);
      }
      return result;
    });
}

/**
 * @deprecated
 * @param req
 */
function handleSendMany(req: express.Request) {
  return req.bitgo
    .wallets()
    .get({ id: req.params.id })
    .then(function(wallet) {
      return wallet.sendMany(req.body);
    })
    .catch(function(err) {
      err.status = 400;
      throw err;
    })
    .then(function(result) {
      if (result.status === 'pendingApproval') {
        throw apiResponse(202, result);
      }
      return result;
    });
}

/**
 * @deprecated
 * @param req
 */
function handleCreateTransaction(req: express.Request) {
  return req.bitgo
    .wallets()
    .get({ id: req.params.id })
    .then(function(wallet) {
      return wallet.createTransaction(req.body);
    })
    .catch(function(err) {
      err.status = 400;
      throw err;
    });
}

/**
 * @deprecated
 * @param req
 */
function handleSignTransaction(req: express.Request) {
  return req.bitgo
    .wallets()
    .get({ id: req.params.id })
    .then(function(wallet) {
      return wallet.signTransaction(req.body);
    });
}

/**
 * @deprecated
 * @param req
 */
function handleShareWallet(req: express.Request) {
  return req.bitgo
    .wallets()
    .get({ id: req.params.id })
    .then(function(wallet) {
      return wallet.shareWallet(req.body);
    });
}

/**
 * @deprecated
 * @param req
 */
function handleAcceptShare(req: express.Request) {
  const params = req.body || {};
  params.walletShareId = req.params.shareId;
  return req.bitgo.wallets().acceptShare(params);
}

/**
 * @deprecated
 * @param req
 */
function handleApproveTransaction(req: express.Request) {
  const params = req.body || {};
  return req.bitgo
    .pendingApprovals()
    .get({ id: req.params.id })
    .then(function(pendingApproval) {
      if (params.state === 'approved') {
        return pendingApproval.approve(params);
      }
      return pendingApproval.reject(params);
    });
}

/**
 * @deprecated
 * @param req
 */
function handleConstructApprovalTx(req: express.Request) {
  const params = req.body || {};
  return req.bitgo
    .pendingApprovals()
    .get({ id: req.params.id })
    .then(function(pendingApproval) {
      return pendingApproval.constructApprovalTx(params);
    });
}

/**
 * @deprecated
 * @param req
 */
function handleConsolidateUnspents(req: express.Request) {
  return req.bitgo
    .wallets()
    .get({ id: req.params.id })
    .then(function(wallet) {
      return wallet.consolidateUnspents(req.body);
    });
}

/**
 * @deprecated
 * @param req
 */
function handleFanOutUnspents(req: express.Request) {
  return req.bitgo
    .wallets()
    .get({ id: req.params.id })
    .then(function(wallet) {
      return wallet.fanOutUnspents(req.body);
    });
}

/**
 * @deprecated
 * @param req
 */
function handleCalculateMinerFeeInfo(req: express.Request) {
  return req.bitgo.calculateMinerFeeInfo({
    bitgo: req.bitgo,
    feeRate: req.body.feeRate,
    nP2shInputs: req.body.nP2shInputs,
    nP2pkhInputs: req.body.nP2pkhInputs,
    nP2shP2wshInputs: req.body.nP2shP2wshInputs,
    nOutputs: req.body.nOutputs,
  });
}

/**
 * Builds the API's URL string, optionally building the querystring if parameters exist
 * @param req
 * @return {string}
 */
function createAPIPath(req: express.Request) {
  let apiPath = '/' + req.params[0];
  if (!_.isEmpty(req.query)) {
    // req.params does not contain the querystring, so we manually add them here
    const urlDetails = url.parse(req.url);
    if (urlDetails.search) {
      // "search" is the properly URL encoded query params, prefixed with "?"
      apiPath += urlDetails.search;
    }
  }
  return apiPath;
}

/**
 * handle any other V1 API call
 * @deprecated
 * @param req
 * @param res
 * @param next
 */
function handleREST(req: express.Request, res: express.Response, next: express.NextFunction) {
  const method = req.method;
  const bitgo = req.bitgo;
  const bitgoURL = bitgo.url(createAPIPath(req));
  return redirectRequest(bitgo, method, bitgoURL, req, next);
}

/**
 * handle any other V2 API call
 * @param req
 * @param res
 * @param next
 */
function handleV2UserREST(req: express.Request, res: express.Response, next: express.NextFunction) {
  const method = req.method;
  const bitgo = req.bitgo;
  const bitgoURL = bitgo.url('/user' + createAPIPath(req), 2);
  return redirectRequest(bitgo, method, bitgoURL, req, next);
}

/**
 * handle v2 address validation
 * @param req
 */
function handleV2VerifyAddress(req: express.Request): { isValid: boolean } {
  if (!_.isString(req.body.address)) {
    throw new Error('Expected address to be a string');
  }

  if (req.body.supportOldScriptHashVersion !== undefined && !_.isBoolean(req.body.supportOldScriptHashVersion)) {
    throw new Error('Expected supportOldScriptHashVersion to be a boolean.');
  }

  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);

  if (coin instanceof Coin.AbstractUtxoCoin) {
    return {
      isValid: coin.isValidAddress(req.body.address, !!req.body.supportOldScriptHashVersion),
    };
  }

  return {
    isValid: coin.isValidAddress(req.body.address),
  };
}

/**
 * handle address canonicalization
 * @param req
 */
function handleCanonicalAddress(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  if (!['ltc', 'bch', 'bsv'].includes(coin.getFamily())) {
    throw new Error('only Litecoin/Bitcoin Cash/Bitcoin SV address canonicalization is supported');
  }

  const address = req.body.address;
  const fallbackVersion = req.body.scriptHashVersion; // deprecate
  const version = req.body.version;
  return (coin as Coin.Bch | Coin.Bsv | Coin.Ltc).canonicalAddress(address, version || fallbackVersion);
}

/**
 * handle new wallet creation
 * @param req
 */
async function handleV2GenerateWallet(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const result = await coin.wallets().generateWallet(req.body);
  // @ts-ignore
  return result.wallet._wallet;
}

/**
 * handle v2 approve transaction
 * @param req
 */
async function handleV2PendingApproval(req: express.Request): Promise<any> {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const params = req.body || {};
  const pendingApproval = await coin.pendingApprovals().get({ id: req.params.id });
  if (params.state === 'approved') {
    return pendingApproval.approve(params);
  }
  return pendingApproval.reject(params);
}

/**
 * create a keychain
 * @param req
 */
function handleV2CreateLocalKeyChain(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  return coin.keychains().create(req.body);
}

/**
 * handle wallet share
 * @param req
 */
async function handleV2ShareWallet(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const wallet = await coin.wallets().get({ id: req.params.id });
  return wallet.shareWallet(req.body);
}

/**
 * handle accept wallet share
 * @param req
 */
async function handleV2AcceptWalletShare(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const params = _.extend({}, req.body, { walletShareId: req.params.id });
  return coin.wallets().acceptShare(params);
}

/**
 * handle wallet sign transaction
 */
async function handleV2SignTxWallet(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const wallet = await coin.wallets().get({ id: req.params.id });
  return wallet.signTransaction(req.body);
}

/**
 * handle sign transaction
 * @param req
 */
function handleV2SignTx(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  return coin.signTransaction(req.body);
}

/**
 * handle wallet recover token
 * @param req
 */
async function handleV2RecoverToken(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);

  const wallet = await coin.wallets().get({ id: req.params.id });
  return wallet.recoverToken(req.body);
}

/**
 * handle wallet fanout unspents
 * @param req
 */
async function handleV2ConsolidateUnspents(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const wallet = await coin.wallets().get({ id: req.params.id });
  return wallet.consolidateUnspents(req.body);
}

/**
 * handle wallet fanout unspents
 * @param req
 */
async function handleV2FanOutUnspents(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const wallet = await coin.wallets().get({ id: req.params.id });
  return wallet.fanoutUnspents(req.body);
}

/**
 * handle wallet sweep
 * @param req
 */
async function handleV2Sweep(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const wallet = await coin.wallets().get({ id: req.params.id });
  return wallet.sweep(req.body);
}

/**
 * handle CPFP accelerate transaction creation
 * @param req
 */
async function handleV2AccelerateTransaction(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const wallet = await coin.wallets().get({ id: req.params.id });
  return wallet.accelerateTransaction(req.body);
}

/**
 * handle send one
 * @param req
 */
async function handleV2SendOne(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const reqId = new RequestTracer();
  const wallet = await coin.wallets().get({ id: req.params.id, reqId });
  req.body.reqId = reqId;

  let result;
  try {
    result = await wallet.send(req.body);
  } catch (err) {
    err.status = 400;
    throw err;
  }
  if (result.status === 'pendingApproval') {
    throw apiResponse(202, result);
  }
  return result;
}

/**
 * handle send many
 * @param req
 */
async function handleV2SendMany(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const reqId = new RequestTracer();
  const wallet = await coin.wallets().get({ id: req.params.id, reqId });
  req.body.reqId = reqId;
  let result;
  try {
    result = await wallet.sendMany(req.body);
  } catch (err) {
    err.status = 400;
    throw err;
  }
  if (result.status === 'pendingApproval') {
    throw apiResponse(202, result);
  }
  return result;
}

/**
 * handle any other API call
 * @param req
 * @param res
 * @param next
 */
function handleV2CoinSpecificREST(req: express.Request, res: express.Response, next: express.NextFunction) {
  const method = req.method;
  const bitgo = req.bitgo;

  try {
    const coin = bitgo.coin(req.params.coin);
    const coinURL = coin.url(createAPIPath(req));
    return redirectRequest(bitgo, method, coinURL, req, next);
  } catch (e) {
    if (e instanceof Errors.UnsupportedCoinError) {
      const queryParams = _.transform(
        req.query,
        (acc: string[], value, key) => {
          for (const val of _.castArray(value)) {
            acc.push(`${key}=${val}`);
          }
        },
        []
      );
      const baseUrl = bitgo.url(req.baseUrl.replace(/^\/api\/v2/, ''), 2);
      const url = _.isEmpty(queryParams) ? baseUrl : `${baseUrl}?${queryParams.join('&')}`;

      debug(`coin ${req.params.coin} not supported, attempting to handle as a coinless route with url ${url}`);
      return redirectRequest(bitgo, method, url, req, next);
    }

    throw e;
  }
}

/**
 * Redirect a request using the bitgo request functions
 * @param bitgo
 * @param method
 * @param url
 * @param req
 * @param next
 */
function redirectRequest(bitgo: BitGo, method: string, url: string, req: express.Request, next: express.NextFunction) {
  switch (method) {
    case 'GET':
      return bitgo
        .get(url)
        .result()
        .nodeify();
    case 'POST':
      return bitgo
        .post(url)
        .send(req.body)
        .result()
        .nodeify();
    case 'PUT':
      return bitgo
        .put(url)
        .send(req.body)
        .result()
        .nodeify();
    case 'DELETE':
      return bitgo
        .del(url)
        .send(req.body)
        .result()
        .nodeify();
  }
  // something has presumably gone wrong
  next();
}

/**
 *
 * @param status
 * @param result
 * @param message
 */
function apiResponse(status: number, result: any, message?: string): ApiResponseError {
  return new ApiResponseError(message, status, result);
}

const expressJSONParser = bodyParser.json({ limit: '20mb' });

/**
 * Perform body parsing here only on routes we want
 */
function parseBody(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Set the default Content-Type, in case the client doesn't set it.  If
  // Content-Type isn't specified, Express silently refuses to parse the
  // request body.
  req.headers['content-type'] = req.headers['content-type'] || 'application/json';
  return expressJSONParser(req, res, next);
}

/**
 * Create the bitgo object in the request
 * @param config
 */
function prepareBitGo(config: Config) {
  const { env, customRootUri, customBitcoinNetwork } = config;

  return function(req: express.Request, res: express.Response, next: express.NextFunction) {
    // Get access token
    let accessToken;
    if (req.headers.authorization) {
      const authSplit = req.headers.authorization.split(' ');
      if (authSplit.length === 2 && authSplit[0].toLowerCase() === 'bearer') {
        accessToken = authSplit[1];
      }
    }
    const userAgent = req.headers['user-agent']
      ? BITGOEXPRESS_USER_AGENT + ' ' + req.headers['user-agent']
      : BITGOEXPRESS_USER_AGENT;
    const bitgoConstructorParams = {
      env,
      customRootURI: customRootUri,
      customBitcoinNetwork,
      accessToken,
      userAgent,
    };

    req.bitgo = new BitGo(bitgoConstructorParams);
    (req.bitgo as any)._promise.longStackSupport = true;

    next();
  };
}

/**
 * Promise handler wrapper to handle sending responses and error cases
 * @param promiseRequestHandler
 */
function promiseWrapper(promiseRequestHandler: Function) {
  return function(req: express.Request, res: express.Response, next: express.NextFunction) {
    debug(`handle: ${req.method} ${req.originalUrl}`);
    bluebird
      .try(promiseRequestHandler.bind(null, req, res, next))
      .then(function(result: any) {
        let status = 200;
        if (result.__redirect) {
          res.redirect(result.url);
          status = 302;
        } else if (result.__render) {
          res.render(result.template, result.params);
        } else {
          res.status(status).send(result);
        }
      })
      .catch(function(caught) {
        let err;
        if (caught instanceof Error) {
          err = caught;
        } else if (typeof caught === 'string') {
          err = new Error('(string_error) ' + caught);
        } else {
          err = new Error('(object_error) ' + JSON.stringify(caught));
        }

        const message = err.message || 'local error';
        // use attached result, or make one
        let result = err.result || { error: message };
        result = _.extend({}, result);
        result.message = err.message;
        const status = err.status || 500;
        if (!(status >= 200 && status < 300)) {
          console.log('error %s: %s', status, err.message);
        }
        if (status === 500) {
          console.log(err.stack);
        }
        res.status(status).send(result);
      })
      .done();
  };
}

export function setupRoutes(app: express.Application, config: Config) {
  // When adding new routes to BitGo Express make sure that you also add the exact same routes to the server. Since
  // some customers were confused when calling a BitGo Express route on the BitGo server, we now handle all BitGo
  // Express routes on the BitGo server and return an error message that says that one should call BitGo Express
  // instead.
  // V1 routes should be added to www/config/routes.js
  // V2 routes should be added to www/config/routesV2.js

  // ping
  // /api/v[12]/pingexpress is the only exception to the rule above, as it explicitly checks the health of the
  // express server without running into rate limiting with the BitGo server.
  app.get('/api/v[12]/ping', prepareBitGo(config), promiseWrapper(handlePing));
  app.get('/api/v[12]/pingexpress', promiseWrapper(handlePingExpress));

  // auth
  app.post('/api/v[12]/user/login', parseBody, prepareBitGo(config), promiseWrapper(handleLogin));

  app.post('/api/v[12]/decrypt', parseBody, prepareBitGo(config), promiseWrapper(handleDecrypt));
  app.post('/api/v[12]/encrypt', parseBody, prepareBitGo(config), promiseWrapper(handleEncrypt));
  app.post('/api/v[12]/verifyaddress', parseBody, prepareBitGo(config), promiseWrapper(handleVerifyAddress));
  app.post(
    '/api/v[12]/calculateminerfeeinfo',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleCalculateMinerFeeInfo)
  );

  app.post('/api/v1/keychain/local', parseBody, prepareBitGo(config), promiseWrapper(handleCreateLocalKeyChain));
  app.post('/api/v1/keychain/derive', parseBody, prepareBitGo(config), promiseWrapper(handleDeriveLocalKeyChain));
  app.post(
    '/api/v1/wallets/simplecreate',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleCreateWalletWithKeychains)
  );

  app.post('/api/v1/wallet/:id/sendcoins', parseBody, prepareBitGo(config), promiseWrapper(handleSendCoins));
  app.post('/api/v1/wallet/:id/sendmany', parseBody, prepareBitGo(config), promiseWrapper(handleSendMany));
  app.post(
    '/api/v1/wallet/:id/createtransaction',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleCreateTransaction)
  );
  app.post(
    '/api/v1/wallet/:id/signtransaction',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleSignTransaction)
  );

  app.post('/api/v1/wallet/:id/simpleshare', parseBody, prepareBitGo(config), promiseWrapper(handleShareWallet));
  app.post(
    '/api/v1/walletshare/:shareId/acceptShare',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleAcceptShare)
  );

  app.put(
    '/api/v1/pendingapprovals/:id/express',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleApproveTransaction)
  );
  app.put(
    '/api/v1/pendingapprovals/:id/constructTx',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleConstructApprovalTx)
  );

  app.put(
    '/api/v1/wallet/:id/consolidateunspents',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleConsolidateUnspents)
  );
  app.put('/api/v1/wallet/:id/fanoutunspents', parseBody, prepareBitGo(config), promiseWrapper(handleFanOutUnspents));

  // any other API call
  app.use('/api/v[1]/*', parseBody, prepareBitGo(config), promiseWrapper(handleREST));

  // API v2

  // create keychain
  app.post(
    '/api/v2/:coin/keychain/local',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleV2CreateLocalKeyChain)
  );

  // generate wallet
  app.post('/api/v2/:coin/wallet/generate', parseBody, prepareBitGo(config), promiseWrapper(handleV2GenerateWallet));

  // share wallet
  app.post('/api/v2/:coin/wallet/:id/share', parseBody, prepareBitGo(config), promiseWrapper(handleV2ShareWallet));
  app.post(
    '/api/v2/:coin/walletshare/:id/acceptshare',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleV2AcceptWalletShare)
  );
  // sign transaction
  app.post('/api/v2/:coin/signtx', parseBody, prepareBitGo(config), promiseWrapper(handleV2SignTx));
  app.post('/api/v2/:coin/wallet/:id/signtx', parseBody, prepareBitGo(config), promiseWrapper(handleV2SignTxWallet));
  app.post(
    '/api/v2/:coin/wallet/:id/recovertoken',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleV2RecoverToken)
  );

  // send transaction
  app.post('/api/v2/:coin/wallet/:id/sendcoins', parseBody, prepareBitGo(config), promiseWrapper(handleV2SendOne));
  app.post('/api/v2/:coin/wallet/:id/sendmany', parseBody, prepareBitGo(config), promiseWrapper(handleV2SendMany));

  // unspent changes
  app.post(
    '/api/v2/:coin/wallet/:id/consolidateunspents',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleV2ConsolidateUnspents)
  );
  app.post(
    '/api/v2/:coin/wallet/:id/fanoutunspents',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleV2FanOutUnspents)
  );

  app.post('/api/v2/:coin/wallet/:id/sweep', parseBody, prepareBitGo(config), promiseWrapper(handleV2Sweep));

  // CPFP
  app.post(
    '/api/v2/:coin/wallet/:id/acceleratetx',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleV2AccelerateTransaction)
  );

  // Miscellaneous
  app.post('/api/v2/:coin/canonicaladdress', parseBody, prepareBitGo(config), promiseWrapper(handleCanonicalAddress));
  app.post('/api/v2/:coin/verifyaddress', parseBody, prepareBitGo(config), promiseWrapper(handleV2VerifyAddress));
  app.put(
    '/api/v2/:coin/pendingapprovals/:id',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleV2PendingApproval)
  );

  // any other API v2 call
  app.use('/api/v2/user/*', parseBody, prepareBitGo(config), promiseWrapper(handleV2UserREST));
  app.use('/api/v2/:coin/*', parseBody, prepareBitGo(config), promiseWrapper(handleV2CoinSpecificREST));
}

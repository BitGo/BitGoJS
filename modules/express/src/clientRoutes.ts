import * as bodyParser from 'body-parser';
import * as bluebird from 'bluebird';
import * as url from 'url';
import * as debugLib from 'debug';

const BitGoJS = require('bitgo');
const { version } = require('bitgo/package.json');
const pjson = require('../package.json');
const debug = debugLib('bitgo:express');

import { randomBytes } from 'crypto';
import * as _ from 'lodash';

const co = bluebird.coroutine;
const BITGOEXPRESS_USER_AGENT = `BitGoExpress/${pjson.version} BitGoJS/${version}`;

const createRequestId = function() {
  return {
    _seed: randomBytes(10),
    _seq: 0,
    inc: function() { this._seq++; },
    toString: function() {
      return `${this._seed.toString('hex')}-${_.padStart(this._seq.toString(16), 4, '0')}`;
    }
  };
};

const handlePing = function(req, res, next) {
  return req.bitgo.ping();
};

const handlePingExpress = function(req) {
  return {
    status: 'express server is ok!'
  };
};

const handleLogin = function(req) {
  const username = req.body.username || req.body.email;
  const body = req.body;
  body.username = username;
  return req.bitgo.authenticate(body);
};

const handleDecrypt = function(req) {
  return {
    decrypted: req.bitgo.decrypt(req.body)
  };
};

const handleEncrypt = function(req) {
  return {
    encrypted: req.bitgo.encrypt(req.body)
  };
};

const handleVerifyAddress = function(req) {
  return {
    verified: req.bitgo.verifyAddress(req.body)
  };
};

const handleCreateLocalKeyChain = function(req) {
  return req.bitgo.keychains().create(req.body);
};

const handleDeriveLocalKeyChain = function(req) {
  return req.bitgo.keychains().deriveLocal(req.body);
};

const handleCreateWalletWithKeychains = function(req) {
  return req.bitgo.wallets().createWalletWithKeychains(req.body);
};

const handleSendCoins = function(req) {
  return req.bitgo.wallets().get({ id: req.params.id })
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
};

const handleSendMany = function(req) {
  return req.bitgo.wallets().get({ id: req.params.id })
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
};

const handleCreateTransaction = function(req) {
  return req.bitgo.wallets().get({ id: req.params.id })
  .then(function(wallet) {
    return wallet.createTransaction(req.body);
  })
  .catch(function(err) {
    err.status = 400;
    throw err;
  });
};

const handleSignTransaction = function(req) {
  return req.bitgo.wallets().get({ id: req.params.id })
  .then(function(wallet) {
    return wallet.signTransaction(req.body);
  });
};

const handleShareWallet = function(req) {
  return req.bitgo.wallets().get({ id: req.params.id })
  .then(function(wallet) {
    return wallet.shareWallet(req.body);
  });
};

const handleAcceptShare = function(req) {
  const params = req.body || {};
  params.walletShareId = req.params.shareId;
  return req.bitgo.wallets().acceptShare(params);
};

const handleApproveTransaction = function(req) {
  const params = req.body || {};
  return req.bitgo.pendingApprovals().get({ id: req.params.id })
  .then(function(pendingApproval) {
    if (params.state === 'approved') {
      return pendingApproval.approve(params);
    }
    return pendingApproval.reject(params);
  });
};

const handleConstructApprovalTx = function(req) {
  const params = req.body || {};
  return req.bitgo.pendingApprovals().get({ id: req.params.id })
  .then(function(pendingApproval) {
    return pendingApproval.constructApprovalTx(params);
  });
};

const handleConsolidateUnspents = function(req) {
  return req.bitgo.wallets().get({ id: req.params.id })
  .then(function(wallet) {
    return wallet.consolidateUnspents(req.body);
  });
};

const handleFanOutUnspents = function(req) {
  return req.bitgo.wallets().get({ id: req.params.id })
  .then(function(wallet) {
    return wallet.fanOutUnspents(req.body);
  });
};

const handleCalculateMinerFeeInfo = function(req) {
  return req.bitgo.calculateMinerFeeInfo({
    bitgo: req.bitgo,
    feeRate: req.body.feeRate,
    nP2shInputs: req.body.nP2shInputs,
    nP2pkhInputs: req.body.nP2pkhInputs,
    nP2shP2wshInputs: req.body.nP2shP2wshInputs,
    nOutputs: req.body.nOutputs
  });
};

/**
 * Builds the API's URL string, optionally building the querystring if parameters exist
 * @param req
 * @return {string}
 */
const createAPIPath = function(req) {
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
};

// handle any other API call
const handleREST = function(req, res, next) {
  const method = req.method;
  const bitgo = req.bitgo;
  const bitgoURL = bitgo.url(createAPIPath(req));
  return redirectRequest(bitgo, method, bitgoURL, req, next);
};

// handle any other API call
const handleV2UserREST = function(req, res, next) {
  const method = req.method;
  const bitgo = req.bitgo;
  const bitgoURL = bitgo.url('/user' + createAPIPath(req), 2);
  return redirectRequest(bitgo, method, bitgoURL, req, next);
};

// handle v2 address validation
const handleV2VerifyAddress = function(req) {
  if (!_.isString(req.body.address)) {
    throw new Error('Expected address to be a string');
  }

  if (req.body.supportOldScriptHashVersion !== undefined &&
    !_.isBoolean(req.body.supportOldScriptHashVersion)) {
    throw new Error('Expected supportOldScriptHashVersion to be a boolean.');
  }
  const supportOldScriptHashVersion = !!req.body.supportOldScriptHashVersion;

  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);

  const result = coin.isValidAddress(req.body.address, supportOldScriptHashVersion);
  return {
    isValid: !!result
  };
};

// handle address canonicalization
const handleCanonicalAddress = function(req) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  if (!['ltc', 'bch', 'bsv'].includes(coin.getFamily())) {
    throw new Error('only Litecoin/Bitcoin Cash/Bitcoin SV address canonicalization is supported');
  }
  const address = req.body.address;
  const fallbackVersion = req.body.scriptHashVersion; // deprecate
  const version = req.body.version;
  return coin.canonicalAddress(address, version || fallbackVersion);
};

// handle new wallet creation
const handleV2GenerateWallet = function(req) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  return coin.wallets().generateWallet(req.body)
  .then(function(result) {
    return result.wallet._wallet;
  });
};

// handle v2 approve transaction
const handleV2PendingApproval = co(function *(req) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const params = req.body || {};
  const pendingApproval = yield coin.pendingApprovals().get({ id: req.params.id });
  if (params.state === 'approved') {
    return pendingApproval.approve(params);
  }
  return pendingApproval.reject(params);
});

// create a keychain
const handleV2CreateLocalKeyChain = function(req) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  return coin.keychains().create(req.body);
};

// handle wallet share
const handleV2ShareWallet = co(function *(req) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const wallet = yield coin.wallets().get({ id: req.params.id });
  return wallet.shareWallet(req.body);
});

// handle accept wallet share
const handleV2AcceptWalletShare = co(function *(req) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const params = _.extend({}, req.body, { walletShareId: req.params.id });
  return coin.wallets().acceptShare(params);
});

// handle wallet sign transaction
const handleV2SignTxWallet = co(function *(req) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const wallet = yield coin.wallets().get({ id: req.params.id });
  return wallet.signTransaction(req.body);
});

// handle sign transaction
const handleV2SignTx = function(req) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  return coin.signTransaction(req.body);
};

// handle wallet recover token
const handleV2RecoverToken = co(function *(req) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);

  const wallet = yield coin.wallets().get({ id: req.params.id });
  return wallet.recoverToken(req.body);
});

// handle wallet fanout unspents
const handleV2ConsolidateUnspents = co(function *(req) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const wallet = yield coin.wallets().get({ id: req.params.id });
  return wallet.consolidateUnspents(req.body);
});

// handle wallet fanout unspents
const handleV2FanOutUnspents = co(function *(req) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const wallet = yield coin.wallets().get({ id: req.params.id });
  return wallet.fanoutUnspents(req.body);
});

// handle wallet sweep
const handleV2Sweep = co(function *handleV2Sweep(req) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const wallet = yield coin.wallets().get({ id: req.params.id });
  return wallet.sweep(req.body);
});

// handle CPFP accelerate transaction creation
const handleV2AccelerateTransaction = co(function *handleV2AccelerateTransaction(req) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const wallet = yield coin.wallets().get({ id: req.params.id });
  return wallet.accelerateTransaction(req.body);
});

// handle send one
const handleV2SendOne = function(req) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const reqId = createRequestId();
  return coin.wallets().get({ id: req.params.id, reqId })
  .then(function(wallet) {
    req.body.reqId = reqId;
    return wallet.send(req.body);
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
};

// handle send many
const handleV2SendMany = function(req) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const reqId = createRequestId();
  return coin.wallets().get({ id: req.params.id, reqId })
  .then(function(wallet) {
    req.body.reqId = reqId;
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
};

// handle any other API call
const handleV2CoinSpecificREST = function(req, res, next) {
  const method = req.method;
  const bitgo = req.bitgo;

  try {
    const coin = bitgo.coin(req.params.coin);
    const coinURL = coin.url(createAPIPath(req));
    return redirectRequest(bitgo, method, coinURL, req, next);
  } catch (e) {
    if (e instanceof BitGoJS.Errors.UnsupportedCoinError) {
      const queryParams = _.transform(req.query, (acc, value, key) => {
        for (const val of _.castArray(value)) {
          acc.push(`${key}=${val}`);
        }
      }, []);
      const baseUrl = bitgo.url(req.baseUrl.replace(/^\/api\/v2/, ''), 2);
      const url = _.isEmpty(queryParams) ? baseUrl : `${baseUrl}?${queryParams.join('&')}`;

      debug(`coin ${req.params.coin} not supported, attempting to handle as a coinless route with url ${url}`);
      return redirectRequest(bitgo, method, url, req, next);
    }

    throw e;
  }
};

const redirectRequest = function(bitgo, method, url, req, next) {
  switch (method) {
    case 'GET':
      return bitgo.get(url).result().nodeify();
    case 'POST':
      return bitgo.post(url).send(req.body).result().nodeify();
    case 'PUT':
      return bitgo.put(url).send(req.body).result().nodeify();
    case 'DELETE':
      return bitgo.del(url).send(req.body).result().nodeify();
  }
  // something has presumably gone wrong
  next();
};

const apiResponse = function(status, result, message = null) {
  const err: any = new Error(message);
  err.status = status;
  err.result = result;
  return err;
};

const expressJSONParser = bodyParser.json({ limit: '20mb' });

// Perform body parsing here only on routes we want
const parseBody = function(req, res, next) {
  // Set the default Content-Type, in case the client doesn't set it.  If
  // Content-Type isn't specified, Express silently refuses to parse the
  // request body.
  req.headers['content-type'] = req.headers['content-type'] || 'application/json';
  return expressJSONParser(req, res, next);
};

// Create the bitgo object in the request
const prepareBitGo = function(args) {
  const params: any = { env: args.env };
  if (args.customrooturi) {
    params.customRootURI = args.customrooturi;
  }
  if (args.custombitcoinnetwork) {
    params.customBitcoinNetwork = args.custombitcoinnetwork;
  }

  return function(req, res, next) {
    // Get access token
    let accessToken;
    if (req.headers.authorization) {
      const authSplit = req.headers.authorization.split(' ');
      if (authSplit.length === 2 && authSplit[0].toLowerCase() === 'bearer') {
        accessToken = authSplit[1];
      }
    }

    const userAgent = req.headers['user-agent'] ? BITGOEXPRESS_USER_AGENT + ' ' + req.headers['user-agent'] : BITGOEXPRESS_USER_AGENT;
    params.accessToken = accessToken;
    params.userAgent = userAgent;

    req.bitgo = new BitGoJS.BitGo(params);
    req.bitgo._promise.longStackSupport = true;

    next();
  };
};

// Promise handler wrapper to handle sending responses and error cases
const promiseWrapper = function(promiseRequestHandler, args) {
  return function(req, res, next) {
    debug(`handle: ${req.method} ${req.originalUrl}`);
    bluebird.try(promiseRequestHandler.bind(null, req, res, next))
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
};

exports = module.exports = function(app, args) {
  // When adding new routes to BitGo Express make sure that you also add the exact same routes to the server. Since
  // some customers were confused when calling a BitGo Express route on the BitGo server, we now handle all BitGo
  // Express routes on the BitGo server and return an error message that says that one should call BitGo Express
  // instead.
  // V1 routes should be added to www/config/routes.js
  // V2 routes should be added to www/config/routesV2.js

  // ping
  // /api/v[12]/pingexpress is the only exception to the rule above, as it explicitly checks the health of the
  // express server without running into rate limiting with the BitGo server.
  app.get('/api/v[12]/ping', prepareBitGo(args), promiseWrapper(handlePing, args));
  app.get('/api/v[12]/pingexpress', promiseWrapper(handlePingExpress, args));

  // auth
  app.post('/api/v[12]/user/login', parseBody, prepareBitGo(args), promiseWrapper(handleLogin, args));

  app.post('/api/v[12]/decrypt', parseBody, prepareBitGo(args), promiseWrapper(handleDecrypt, args));
  app.post('/api/v[12]/encrypt', parseBody, prepareBitGo(args), promiseWrapper(handleEncrypt, args));
  app.post('/api/v[12]/verifyaddress', parseBody, prepareBitGo(args), promiseWrapper(handleVerifyAddress, args));
  app.post('/api/v[12]/calculateminerfeeinfo', parseBody, prepareBitGo(args), promiseWrapper(handleCalculateMinerFeeInfo, args));

  app.post('/api/v1/keychain/local', parseBody, prepareBitGo(args), promiseWrapper(handleCreateLocalKeyChain, args));
  app.post('/api/v1/keychain/derive', parseBody, prepareBitGo(args), promiseWrapper(handleDeriveLocalKeyChain, args));
  app.post('/api/v1/wallets/simplecreate', parseBody, prepareBitGo(args), promiseWrapper(handleCreateWalletWithKeychains, args));

  app.post('/api/v1/wallet/:id/sendcoins', parseBody, prepareBitGo(args), promiseWrapper(handleSendCoins, args));
  app.post('/api/v1/wallet/:id/sendmany', parseBody, prepareBitGo(args), promiseWrapper(handleSendMany, args));
  app.post('/api/v1/wallet/:id/createtransaction', parseBody, prepareBitGo(args), promiseWrapper(handleCreateTransaction, args));
  app.post('/api/v1/wallet/:id/signtransaction', parseBody, prepareBitGo(args), promiseWrapper(handleSignTransaction, args));

  app.post('/api/v1/wallet/:id/simpleshare', parseBody, prepareBitGo(args), promiseWrapper(handleShareWallet, args));
  app.post('/api/v1/walletshare/:shareId/acceptShare', parseBody, prepareBitGo(args), promiseWrapper(handleAcceptShare, args));

  app.put('/api/v1/pendingapprovals/:id/express', parseBody, prepareBitGo(args), promiseWrapper(handleApproveTransaction, args));
  app.put('/api/v1/pendingapprovals/:id/constructTx', parseBody, prepareBitGo(args), promiseWrapper(handleConstructApprovalTx, args));

  app.put('/api/v1/wallet/:id/consolidateunspents', parseBody, prepareBitGo(args), promiseWrapper(handleConsolidateUnspents, args));
  app.put('/api/v1/wallet/:id/fanoutunspents', parseBody, prepareBitGo(args), promiseWrapper(handleFanOutUnspents, args));

  // any other API call
  app.use('/api/v[1]/*', parseBody, prepareBitGo(args), promiseWrapper(handleREST, args));

  // API v2

  // create keychain
  app.post('/api/v2/:coin/keychain/local', parseBody, prepareBitGo(args), promiseWrapper(handleV2CreateLocalKeyChain, args));

  // generate wallet
  app.post('/api/v2/:coin/wallet/generate', parseBody, prepareBitGo(args), promiseWrapper(handleV2GenerateWallet, args));

  // share wallet
  app.post('/api/v2/:coin/wallet/:id/share', parseBody, prepareBitGo(args), promiseWrapper(handleV2ShareWallet, args));
  app.post('/api/v2/:coin/walletshare/:id/acceptshare', parseBody, prepareBitGo(args), promiseWrapper(handleV2AcceptWalletShare, args));
  // sign transaction
  app.post('/api/v2/:coin/signtx', parseBody, prepareBitGo(args), promiseWrapper(handleV2SignTx, args));
  app.post('/api/v2/:coin/wallet/:id/signtx', parseBody, prepareBitGo(args), promiseWrapper(handleV2SignTxWallet, args));
  app.post('/api/v2/:coin/wallet/:id/recovertoken', parseBody, prepareBitGo(args), promiseWrapper(handleV2RecoverToken, args));

  // send transaction
  app.post('/api/v2/:coin/wallet/:id/sendcoins', parseBody, prepareBitGo(args), promiseWrapper(handleV2SendOne, args));
  app.post('/api/v2/:coin/wallet/:id/sendmany', parseBody, prepareBitGo(args), promiseWrapper(handleV2SendMany, args));

  // unspent changes
  app.post('/api/v2/:coin/wallet/:id/consolidateunspents', parseBody, prepareBitGo(args), promiseWrapper(handleV2ConsolidateUnspents, args));
  app.post('/api/v2/:coin/wallet/:id/fanoutunspents', parseBody, prepareBitGo(args), promiseWrapper(handleV2FanOutUnspents, args));

  app.post('/api/v2/:coin/wallet/:id/sweep', parseBody, prepareBitGo(args), promiseWrapper(handleV2Sweep, args));

  // CPFP
  app.post('/api/v2/:coin/wallet/:id/acceleratetx', parseBody, prepareBitGo(args), promiseWrapper(handleV2AccelerateTransaction, args));

  // Miscellaneous
  app.post('/api/v2/:coin/canonicaladdress', parseBody, prepareBitGo(args), promiseWrapper(handleCanonicalAddress, args));
  app.post('/api/v2/:coin/verifyaddress', parseBody, prepareBitGo(args), promiseWrapper(handleV2VerifyAddress, args));
  app.put('/api/v2/:coin/pendingapprovals/:id', parseBody, prepareBitGo(args), promiseWrapper(handleV2PendingApproval, args));


  // any other API v2 call
  app.use('/api/v2/user/*', parseBody, prepareBitGo(args), promiseWrapper(handleV2UserREST, args));
  app.use('/api/v2/:coin/*', parseBody, prepareBitGo(args), promiseWrapper(handleV2CoinSpecificREST, args));

};

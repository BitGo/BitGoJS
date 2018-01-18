const bodyParser = require('body-parser');

const BitGoJS = require('./index');
const TransactionBuilder = require('./transactionBuilder');
const common = require('./common');
const Promise = require('bluebird');
const co = Promise.coroutine;
const url = require('url');
const _ = require('lodash');
const pjson = require('../package.json');

const BITGOEXPRESS_USER_AGENT = 'BitGoExpress/' + pjson.version;

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

const handleEthGenerateWallet = function(req) {
  return req.bitgo.eth().wallets().generateWallet(req.body);
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

const handleEthSendTransaction = function(req) {
  return req.bitgo.eth().wallets().get({ id: req.params.id })
  .then(function(wallet) {
    return wallet.sendTransaction(req.body);
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
  return TransactionBuilder.calculateMinerFeeInfo({
    bitgo: req.bitgo,
    feeRate: req.body.feeRate,
    nP2SHInputs: req.body.nP2SHInputs,
    nP2PKHInputs: req.body.nP2PKHInputs,
    nP2SHP2WSHInputs: req.body.nP2SHP2WSHInputs,
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
  common.validateParams(req.body, ['address'], []);

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
  if (!['ltc', 'bch'].includes(coin.getFamily())) {
    throw new Error('only Litecoin/Bitcoin Cash address canonicalization is supported');
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

// handle send one
const handleV2SendOne = function(req) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  return coin.wallets().get({ id: req.params.id })
  .then(function(wallet) {
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
  return coin.wallets().get({ id: req.params.id })
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

// handle any other API call
const handleV2CoinSpecificREST = function(req, res, next) {
  const method = req.method;
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const coinURL = coin.url(createAPIPath(req));
  return redirectRequest(bitgo, method, coinURL, req, next);
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

const apiResponse = function(status, result, message) {
  const err = new Error(message);
  err.status = status;
  err.result = result;
  return err;
};

const expressJSONParser = bodyParser.json();

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
  const params = { env: args.env };
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
    if (args.debug) {
      console.log('handle: ' + url.parse(req.url).pathname);
    }
    Promise.try(promiseRequestHandler, req, res, next)
    .then(function(result) {
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

  // eth
  app.post('/api/v1/eth/wallet/generate', parseBody, prepareBitGo(args), promiseWrapper(handleEthGenerateWallet, args));
  app.post('/api/v1/eth/wallet/:id/sendtransaction', parseBody, prepareBitGo(args), promiseWrapper(handleEthSendTransaction, args));

  // any other API call
  app.use('/api/v[1]/*', parseBody, prepareBitGo(args), promiseWrapper(handleREST, args));

  // API v2

  // generate wallet
  app.post('/api/v2/:coin/wallet/generate', parseBody, prepareBitGo(args), promiseWrapper(handleV2GenerateWallet, args));

  // share wallet
  app.post('/api/v2/:coin/wallet/:id/share', parseBody, prepareBitGo(args), promiseWrapper(handleV2ShareWallet, args));
  app.post('/api/v2/:coin/walletshare/:id/acceptshare', parseBody, prepareBitGo(args), promiseWrapper(handleV2AcceptWalletShare, args));
  // sign transaction
  app.post('/api/v2/:coin/signtx', parseBody, prepareBitGo(args), promiseWrapper(handleV2SignTx, args));
  app.post('/api/v2/:coin/wallet/:id/signtx', parseBody, prepareBitGo(args), promiseWrapper(handleV2SignTxWallet, args));

  // send transaction
  app.post('/api/v2/:coin/wallet/:id/sendcoins', parseBody, prepareBitGo(args), promiseWrapper(handleV2SendOne, args));
  app.post('/api/v2/:coin/wallet/:id/sendmany', parseBody, prepareBitGo(args), promiseWrapper(handleV2SendMany, args));

  // unspent changes
  app.post('/api/v2/:coin/wallet/:id/consolidateunspents', parseBody, prepareBitGo(args), promiseWrapper(handleV2ConsolidateUnspents, args));
  app.post('/api/v2/:coin/wallet/:id/fanoutunspents', parseBody, prepareBitGo(args), promiseWrapper(handleV2FanOutUnspents, args));

  // Miscellaneous
  app.post('/api/v2/:coin/canonicaladdress', parseBody, prepareBitGo(args), promiseWrapper(handleCanonicalAddress, args));
  app.post('/api/v2/:coin/verifyaddress', parseBody, prepareBitGo(args), promiseWrapper(handleV2VerifyAddress, args));
  app.put('/api/v2/:coin/pendingapprovals/:id', parseBody, prepareBitGo(args), promiseWrapper(handleV2PendingApproval, args));


  // any other API v2 call
  app.use('/api/v2/user/*', parseBody, prepareBitGo(args), promiseWrapper(handleV2UserREST, args));
  app.use('/api/v2/:coin/*', parseBody, prepareBitGo(args), promiseWrapper(handleV2CoinSpecificREST, args));

};

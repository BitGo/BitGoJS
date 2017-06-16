var bodyParser = require('body-parser');

var BitGoJS = require('./index');
var TransactionBuilder = require('./transactionBuilder');
var common = require('./common');
var Q = require('q');
var url = require('url');
var _ = require('lodash');
var pjson = require('../package.json');

var BITGOEXPRESS_USER_AGENT = "BitGoExpress/" + pjson.version;

var handleLogin = function(req) {
  var username = req.body.username || req.body.email;
  var body = req.body;
  body.username = username;
  return req.bitgo.authenticate(body);
};

var handleDecrypt = function(req) {
  return {
    decrypted: req.bitgo.decrypt(req.body)
  };
};

var handleEncrypt = function(req) {
  return {
    encrypted: req.bitgo.encrypt(req.body)
  };
};

var handleVerifyAddress = function(req) {
  return {
    verified: req.bitgo.verifyAddress(req.body)
  };
};

var handleCreateLocalKeyChain = function(req) {
  return req.bitgo.keychains().create(req.body);
};

var handleDeriveLocalKeyChain = function(req) {
  return req.bitgo.keychains().deriveLocal(req.body);
};

var handleCreateWalletWithKeychains = function(req) {
  return req.bitgo.wallets().createWalletWithKeychains(req.body);
};

var handleEthGenerateWallet = function(req) {
  return req.bitgo.eth().wallets().generateWallet(req.body);
};

var handleSendCoins = function(req) {
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

var handleSendMany = function(req) {
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

var handleCreateTransaction = function(req) {
  return req.bitgo.wallets().get({ id: req.params.id })
  .then(function(wallet) {
    return wallet.createTransaction(req.body);
  })
  .catch(function(err) {
    err.status = 400;
    throw err;
  });
};

var handleEthSendTransaction = function(req) {
  return req.bitgo.eth().wallets().get({ id: req.params.id })
  .then(function(wallet) {
    return wallet.sendTransaction(req.body);
  })
  .catch(function(err) {
    err.status = 400;
    throw err;
  });
};

var handleSignTransaction = function(req) {
  return req.bitgo.wallets().get({ id: req.params.id })
  .then(function(wallet) {
    return wallet.signTransaction(req.body);
  });
};

var handleShareWallet = function(req) {
  return req.bitgo.wallets().get({ id: req.params.id })
  .then(function(wallet) {
    return wallet.shareWallet(req.body);
  });
};

var handleAcceptShare = function(req) {
  var params = req.body || {};
  params.walletShareId = req.params.shareId;
  return req.bitgo.wallets().acceptShare(params);
};

var handleApproveTransaction = function(req) {
  var params = req.body || {};
  return req.bitgo.pendingApprovals().get({ id: req.params.id })
  .then(function(pendingApproval) {
    if (params.state === 'approved') {
      return pendingApproval.approve(params);
    }
    return pendingApproval.reject(params);
  });
};

var handleConstructApprovalTx = function(req) {
  var params = req.body || {};
  return req.bitgo.pendingApprovals().get({ id: req.params.id })
  .then(function(pendingApproval) {
    return pendingApproval.constructApprovalTx(params);
  });
};

var handleConsolidateUnspents = function(req) {
  return req.bitgo.wallets().get({ id: req.params.id })
  .then(function(wallet) {
    return wallet.consolidateUnspents(req.body);
  });
};

var handleFanOutUnspents = function(req) {
  return req.bitgo.wallets().get({ id: req.params.id })
  .then(function(wallet) {
    return wallet.fanOutUnspents(req.body);
  });
};

var handleCalculateMinerFeeInfo = function(req) {
  return TransactionBuilder.calculateMinerFeeInfo({
    bitgo: req.bitgo,
    feeRate: req.body.feeRate,
    nP2SHInputs: req.body.nP2SHInputs,
    nP2PKHInputs: req.body.nP2PKHInputs,
    nOutputs: req.body.nOutputs
  });
};

/**
 * Builds the API's URL string, optionally building the querystring if parameters exist
 * @param req
 * @return {string}
 */
var createAPIPath = function(req) {
  var apiPath = '/' + req.params[0];
  if (!_.isEmpty(req.query)) {
    // req.params does not contain the querystring, so we manually add them here
    var urlDetails = url.parse(req.url);
    if (urlDetails.search) {
      // "search" is the properly URL encoded query params, prefixed with "?"
      apiPath += urlDetails.search;
    }
  }
  return apiPath;
};

// handle any other API call
var handleREST = function(req, res, next) {
  var method = req.method;
  var bitgo = req.bitgo;
  var bitgoURL = bitgo.url(createAPIPath(req));
  return redirectRequest(bitgo, method, bitgoURL, req, next);
};

// handle v2 address validation
const handleV2VerifyAddress = function(req) {
  common.validateParams(req.body, ['address'], []);

  if (req.body.supportOldScriptHashVersion !== undefined &&
    typeof(req.body.supportOldScriptHashVersion) !== 'boolean') {
    throw new Error('Expected supportOldScriptHashVersion to be a boolean.');
  }
  const supportOldScriptHashVersion = !!req.body.supportOldScriptHashVersion;

  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);

  const result = coin.isValidAddress(req.body.address, supportOldScriptHashVersion);
  return {
    isValid: !!result
  }
};

// handle Litecoin address canonicalization
var handleLtcCanonicalAddress = function(req) {
  var bitgo = req.bitgo;
  var coin = bitgo.coin(req.params.coin);
  if (coin.getFamily() !== 'ltc') {
    throw new Error('only Litecoin address canonicalization is supported');
  }
  var address = req.body.address;
  var version = req.body.scriptHashVersion;
  return coin.canonicalAddress(address, version);
};

// handle new wallet creation
var handleV2GenerateWallet = function(req) {
  var bitgo = req.bitgo;
  var coin = bitgo.coin(req.params.coin);
  return coin.wallets().generateWallet(req.body)
  .then(function(result) {
    return result.wallet._wallet;
  });
};

// handle sign transaction
var handleV2SignTx = function(req) {
  var bitgo = req.bitgo;
  var coin = bitgo.coin(req.params.coin);
  return coin.sign(req.body);
};

// handle send one
var handleV2SendOne = function(req) {
  var bitgo = req.bitgo;
  var coin = bitgo.coin(req.params.coin);
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
var handleV2SendMany = function(req) {
  var bitgo = req.bitgo;
  var coin = bitgo.coin(req.params.coin);
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
var handleV2REST = function(req, res, next) {
  var method = req.method;
  var bitgo = req.bitgo;
  var coin = bitgo.coin(req.params.coin);
  var coinURL = coin.url(createAPIPath(req));
  return redirectRequest(bitgo, method, coinURL, req, next);
};

var redirectRequest = function(bitgo, method, url, req, next) {
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

var apiResponse = function(status, result, message) {
  var err = new Error(message);
  err.status = status;
  err.result = result;
  return err;
};

// Perform body parsing here only on routes we want
var parseBody = bodyParser.json();
// Create the bitgo object in the request
var prepareBitGo = function(args) {
  var params = { env: args.env };
  if (args.customrooturi) {
    params.customRootURI = args.customrooturi;
  }
  if (args.custombitcoinnetwork) {
    params.customBitcoinNetwork = args.custombitcoinnetwork;
  }

  return function(req, res, next) {
    // Get access token
    var accessToken;
    if (req.headers.authorization) {
      var authSplit = req.headers.authorization.split(" ");
      if (authSplit.length === 2 && authSplit[0].toLowerCase() === 'bearer') {
        accessToken = authSplit[1];
      }
    }

    var userAgent = req.headers['user-agent'] ? BITGOEXPRESS_USER_AGENT + " " + req.headers['user-agent'] : BITGOEXPRESS_USER_AGENT;
    params.accessToken = accessToken;
    params.userAgent = userAgent;

    req.bitgo = new BitGoJS.BitGo(params);
    req.bitgo._promise.longStackSupport = true;

    next();
  }
};

// Promise handler wrapper to handle sending responses and error cases
var promiseWrapper = function(promiseRequestHandler, args) {
  return function(req, res, next) {
    if (args.debug) {
      console.log('handle: ' + url.parse(req.url).pathname);
    }
    Q.fcall(promiseRequestHandler, req, res, next)
    .then(function(result) {
      var status = 200;
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
      var err;
      if (caught instanceof Error) {
        err = caught;
      } else if (typeof caught === 'string') {
        err = new Error("(string_error) " + caught);
      } else {
        err = new Error("(object_error) " + JSON.stringify(caught));
      }

      var message = err.message || 'local error';
      // use attached result, or make one
      var result = err.result || { error: message };
      result = _.extend({}, result);
      result.message = err.message;
      var status = err.status || 500;
      if (!(status >= 200 && status < 300)) {
        console.log('error %s: %s', status, err.message);
      }
      if (status == 500) {
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
  app.use('/api/v1/*', parseBody, prepareBitGo(args), promiseWrapper(handleREST, args));

  // API v2

  // generate wallet
  app.post('/api/v2/:coin/wallet/generate', parseBody, prepareBitGo(args), promiseWrapper(handleV2GenerateWallet, args));

  // sign transaction
  app.post('/api/v2/:coin/signtx', parseBody, prepareBitGo(args), promiseWrapper(handleV2SignTx, args));

  // send transaction
  app.post('/api/v2/:coin/wallet/:id/sendcoins', parseBody, prepareBitGo(args), promiseWrapper(handleV2SendOne, args));
  app.post('/api/v2/:coin/wallet/:id/sendmany', parseBody, prepareBitGo(args), promiseWrapper(handleV2SendMany, args));

  // Miscellaneous
  app.post('/api/v2/:coin/canonicaladdress', parseBody, prepareBitGo(args), promiseWrapper(handleLtcCanonicalAddress, args));
  app.post('/api/v2/:coin/verifyaddress', parseBody, prepareBitGo(args), promiseWrapper(handleV2VerifyAddress, args));

  // any other API v2 call
  app.use('/api/v2/:coin/*', parseBody, prepareBitGo(args), promiseWrapper(handleV2REST, args));

};
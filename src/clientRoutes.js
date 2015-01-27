var bodyParser = require('body-parser');

var BitGoJS = require('./index');
var common = require('./common');
var q = require('q');

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
  return req.bitgo.keychains().create();
};

var handleCreateWalletWithKeychains = function(req) {
  return req.bitgo.wallets().createWalletWithKeychains(req.body);
};

var handleSendCoins = function(req) {
  return req.bitgo.wallets().get({id: req.params.id})
  .then(function(wallet) {
    return wallet.sendCoins(req.body);
  });
};

var handleSendMany = function(req) {
  return req.bitgo.wallets().get({id: req.params.id})
  .then(function(wallet) {
    return wallet.sendMany(req.body);
  });
};

var handleCreateTransaction = function(req) {
  return req.bitgo.wallets().get({id: req.params.id})
  .then(function(wallet) {
    return wallet.createTransaction(req.body);
  });
};

var handleShareWallet = function(req) {
  return req.bitgo.wallets().get({id: req.params.id})
  .then(function(wallet) {
    return wallet.shareWallet(req.body);
  });
};

var handleAcceptShare = function(req) {
  var params = req.body || {};
  params.walletShareId = req.params.shareId;
  return req.bitgo.wallets().acceptShare(params);
};

// Perform body parsing here only on routes we want
var parseBody = bodyParser.json();

// Create the bitgo object in the request
var prepareBitGo = function(req, res, next){
  // Get access token
  var accessToken;
  if (req.headers.authorization) {
    var authSplit = req.headers.authorization.split(" ");
    if (authSplit.length === 2 && authSplit[0].toLowerCase() === 'bearer') {
      accessToken = authSplit[1];
    }
  }

  req.bitgo = new BitGoJS.BitGo({accessToken: accessToken});

  next();
};

exports = module.exports = function(app, wrapper) {
  app.post('/api/v1/decrypt', parseBody, prepareBitGo, wrapper(handleDecrypt));
  app.post('/api/v1/encrypt', parseBody, prepareBitGo, wrapper(handleEncrypt));
  app.post('/api/v1/verifyaddress', parseBody, prepareBitGo, wrapper(handleVerifyAddress));

  app.post('/api/v1/keychain/local', parseBody, prepareBitGo, wrapper(handleCreateLocalKeyChain));
  app.post('/api/v1/wallets/simplecreate', parseBody, prepareBitGo, wrapper(handleCreateWalletWithKeychains));

  app.post('/api/v1/wallet/:id/sendcoins', parseBody, prepareBitGo, wrapper(handleSendCoins));
  app.post('/api/v1/wallet/:id/sendmany', parseBody, prepareBitGo, wrapper(handleSendMany));
  app.post('/api/v1/wallet/:id/createtransaction', parseBody, prepareBitGo, wrapper(handleCreateTransaction));

  app.post('/api/v1/wallet/:id/simpleshare', parseBody, prepareBitGo, wrapper(handleShareWallet));
  app.post('/api/v1/walletshare/:shareId/acceptShare', parseBody, prepareBitGo, wrapper(handleAcceptShare));
};

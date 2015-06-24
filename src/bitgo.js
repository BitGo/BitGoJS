//
// BitGo JavaScript SDK
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//
var superagent = require('superagent');
var Address = require('bitcoinjs-lib/src/address');
var Blockchain = require('./blockchain');
var Keychains = require('./keychains');
var Wallet = require('./wallet');
var Wallets = require('./wallets');
var PendingApprovals = require('./pendingapprovals');
var sjcl = require('./sjcl.min');
var common = require('./common');
var ECKey = require('bitcoinjs-lib/src/eckey');
var ECPubkey = require('bitcoinjs-lib/src/ecpubkey');
var BufferUtils = require('bitcoinjs-lib/src/bufferutils');
var networks = require('bitcoinjs-lib/src/networks');
var Util = require('./util');
var Q = require('q');
var pjson = require('../package.json');

if (!process.browser) {
  require('superagent-proxy')(superagent);
}

// Patch superagent to return promises
var _end = superagent.Request.prototype.end;
superagent.Request.prototype.end = function() {
  var self = this;

  return new Q.Promise(function(resolve, reject) {
    var error;
    try {
      return _end.call(self, function(error, response) {
        if (error) {
          return reject(error);
        }
        return resolve(response);
      });
    } catch (_error) {
      error = _error;
      return reject(error);
    }
  });
};

// Shortcuts to avoid having to call end()
superagent.Request.prototype.then = function() {
  var _ref;
  return (_ref = this.end()).then.apply(_ref, arguments);
};
superagent.Request.prototype["catch"] = function() {
  var _ref;
  return (_ref = this.end())["catch"].apply(_ref, arguments);
};

// Handle HTTP errors appropriately, returning the result body, or a named
// field from the body, if the optionalField parameter is provided.
superagent.Request.prototype.result = function(optionalField) {

  var errFromResponse = function(res) {
    var err = new Error(res.body.error ? res.body.error : res.status.toString());
    err.status = res.status;
    if (res.body.needsOTP) {
      err.needsOTP = true;
    }
    return err;
  };

  return this.then(
    function(res) {
      if (typeof(res.status) === 'number' && res.status >= 200 && res.status < 300) {
        return optionalField ? res.body[optionalField] : res.body;
      }
      throw errFromResponse(res);
    },
    function(e) {
      if (e.response) {
        throw errFromResponse(e.response);
      }
      throw e;
    }
  );
};

//
// Constructor for BitGo Object
// arguments:
//   @useProduction: flag to use the production bitcoin network rather than the
//                   testnet network.
//
var BitGo = function(params) {
  params = params || {};
  if (!common.validateParams(params, [], ['clientId', 'clientSecret', 'refreshToken', 'accessToken', 'userAgent', 'customRootURI', 'customBitcoinNetwork']) ||
      (params.useProduction && typeof(params.useProduction) != 'boolean')) {
    throw new Error('invalid argument');
  }

  if ((!params.clientId) !== (!params.clientSecret)) {
    throw new Error('invalid argument - must provide both client id and secret');
  }

  // By default, we operate on the test server.
  // Deprecate useProduction in the future
  if (params.useProduction) {
    if (params.env && params.env !== 'prod') {
      throw new Error("Cannot set test environment and use production");
    }
    params.env = 'prod';
  }

  if (params.customRootURI ||
      params.customBitcoinNetwork ||
      process.env.BITGO_CUSTOM_ROOT_URI ||
      process.env.BITGO_CUSTOM_BITCOIN_NETWORK) {
    params.env = 'custom';
    if (params.customRootURI) {
      common.Environments['custom'].uri = params.customRootURI;
    }
    if (params.customBitcoinNetwork) {
      common.Environments['custom'].network = params.customBitcoinNetwork;
    }
  }

  if (params.env) {
    if (common.Environments[params.env]) {
      this._baseUrl = common.Environments[params.env].uri;
    } else {
      throw new Error('invalid environment');
    }
  } else {
    params.env = process.env.BITGO_ENV || 'test';
  }
  this.env = params.env;

  common.setNetwork(common.Environments[params.env].network);

  if (!this._baseUrl) {
    this._baseUrl = common.Environments[params.env].uri;
  }

  this._baseApiUrl = this._baseUrl + '/api/v1';
  this._user = null;
  this._keychains = null;
  this._wallets = null;
  this._clientId = params.clientId;
  this._clientSecret = params.clientSecret;
  this._token = params.accessToken || null;
  this._refreshToken = params.refreshToken || null;
  this._userAgent = params.userAgent || 'BitGoJS/' + this.version();

  // whether to perform extra client-side validation for some things, such as
  // address validation or signature validation. defaults to true, but can be
  // turned off by setting to false. can also be overridden individually in the
  // functions that use it.
  this._validate = params.validate === undefined ? true : params.validate;

  // Create superagent methods specific to this BitGo instance.
  this.request = {};
  var methods = ['get', 'post', 'put', 'del'];

  if (!params.proxy && process.env.BITGO_USE_PROXY) {
    params.proxy = process.env.BITGO_USE_PROXY;
  }

  if (process.browser && params.proxy) {
    throw new Error('cannot use https proxy params while in browser');
  }

  // This is a patching function which can apply our authorization
  // headers to any outbound request.
  var createPatch = function(method) {
    return function() {
      var req = superagent[method].apply(null, arguments);
      if (params.proxy) {
        req = req.proxy(params.proxy);
      }
      if (self._token) {
        req.set('Authorization', "Bearer " + self._token);
      }
      if (!process.browser) {
        // If not in the browser, set the User-Agent. Browsers don't allow
        // setting of User-Agent, so we must disable this when run in the
        // browser (browserify sets process.browser).
        req.set('User-Agent', self._userAgent);
      }
      return req;
    };
  };

  for (var index in methods) {
    var self = this;
    var method = methods[index];
    self[method] = createPatch(method);
  }
};

BitGo.prototype.getValidate = function() {
  return this._validate;
};

BitGo.prototype.setValidate = function(validate) {
  if (typeof(validate) !== 'boolean') {
    throw new Error('invalid argument');
  }
  this._validate = validate;
};

BitGo.prototype.getEnv = function() {
  return this.env;
};

BitGo.prototype.clear = function() {
  this._user = this._token = this._refreshToken = undefined;
};

// Helper function to return a rejected promise or call callback with error
BitGo.prototype.reject = function(msg, callback) {
  return Q().thenReject(new Error(msg)).nodeify(callback);
};

//
// version
// Gets the version of the BitGoJS API
//
BitGo.prototype.version = function() {
  return pjson.version;
};

BitGo.prototype.toJSON = function() {
  return {
    user: this._user,
    token: this._token
  };
};

BitGo.prototype.fromJSON = function(json) {
  this._user = json.user;
  this._token = json.token;
};

BitGo.prototype.user = function() {
  return this._user;
};

BitGo.prototype.verifyAddress = function(params) {
  params = params || {};
  common.validateParams(params, ['address'], []);

  var address;

  try {
    address = Address.fromBase58Check(params.address);
  } catch(e) {
    return false;
  }

  var network = common.getNetwork();
  return address.version === networks[network].pubKeyHash || address.version === networks[network].scriptHash;
};

BitGo.prototype.verifyPassword = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['password'], []);

  if (!this._user || !this._user.username) {
    throw new Error('no current user');
  }
  var key = sjcl.codec.utf8String.toBits(this._user.username);
  var hmac = new sjcl.misc.hmac(key, sjcl.hash.sha256);
  var hmacPassword = sjcl.codec.hex.fromBits(hmac.encrypt(params.password));

  return this.post(this.url('/user/verifypassword'))
  .send({ password: hmacPassword })
  .result('valid')
  .nodeify(callback);
};

//
// encrypt
// Utility function to encrypt locally.
//
BitGo.prototype.encrypt = function(params) {
  params = params || {};
  common.validateParams(params, ['input', 'password'], []);

  var encryptOptions = { iter: 10000, ks: 256 };
  return sjcl.encrypt(params.password, params.input, encryptOptions);
};

//
// decrypt
// Utility function to decrypt locally.
//
BitGo.prototype.decrypt = function(params) {
  params = params || {};
  common.validateParams(params, ['input', 'password'], []);

  return sjcl.decrypt(params.password, params.input);
};

//
// ecdhSecret
// Construct an ECDH secret from a private key and other user's public key
//
BitGo.prototype.getECDHSecret = function(params) {
  params = params || {};
  common.validateParams(params, ['otherPubKeyHex'], []);

  if (typeof(params.eckey) !== 'object') {
    throw new Error('eckey object required');
  }

  var otherKeyPub = ECPubkey.fromHex(params.otherPubKeyHex);
  var secretPoint = otherKeyPub.Q.multiply(params.eckey.d);
  var secret = Util.bnToByteArrayUnsigned(secretPoint.affineX);
  return new Buffer(secret).toString('hex');
};

//
// user sharing keychain
// Gets the user's private keychain, used for receiving shares
BitGo.prototype.getECDHSharingKeychain = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], []);

  var self = this;

  return this.get(this.url('/user/settings'))
  .result()
  .then(function(result) {
    if (!result.settings.ecdhKeychain) {
      return self.reject('ecdh keychain not found for user', callback);
    }

    return self.keychains().get({ xpub: result.settings.ecdhKeychain });
  })
  .nodeify(callback);
};

//
// market
// Get the latest bitcoin prices.
//
BitGo.prototype.market = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.get(this.url('/market/latest'))
  .result()
  .nodeify(callback);
};

//
// market data yesterday
// Get market data from yesterday
//
BitGo.prototype.yesterday = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.get(this.url('/market/yesterday'))
  .result()
  .nodeify(callback);
};

//
// authenticate
// Login to the bitgo system.
// Returns:
//   {
//     token: <user's token>,
//     user: <user object
//   }
BitGo.prototype.authenticate = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['username', 'password'], ['otp'], callback);

  var username = params.username;
  var password = params.password;
  var otp = params.otp;

  // Calculate the password HMAC so we don't send clear-text passwords
  var key = sjcl.codec.utf8String.toBits(username);
  var hmac = new sjcl.misc.hmac(key, sjcl.hash.sha256);
  var hmacPassword = sjcl.codec.hex.fromBits(hmac.encrypt(password));

  var authParams = {
    email: username,
    password: hmacPassword
  };

  if (otp) {
    authParams.otp = otp;
  }

  var self = this;
  if (this._token) {
    return this.reject('already logged in', callback);
  }

  return this.post(this.url('/user/login'))
  .send(authParams)
  .result()
  .then(function(body) {
    self._user = body.user;
    self._token = body.access_token;
    return body;
  })
  .nodeify(callback);
};

//
// authenticateWithAuthCode
// Login to the bitgo system using an authcode generated via Oauth
// Returns:
//   {
//     authCode: <authentication code sent from the BitGo OAuth redirect>
//   }
BitGo.prototype.authenticateWithAuthCode = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['authCode'], [], callback);

  if (!this._clientId || !this._clientSecret) {
    throw new Error('Need client id and secret set first to use this');
  }

  var authCode = params.authCode;

  var self = this;
  if (this._token) {
    return this.reject('already logged in', callback);
  }

  var token_result;

  return this.post(this._baseUrl + '/oauth/token')
  .send({
    grant_type: 'authorization_code',
    code: authCode,
    client_id: self._clientId,
    client_secret: self._clientSecret
  })
  .result()
  .then(function(body) {
    token_result = body;
    self._token = body.access_token;
    self._refreshToken = body.refresh_token;
    return self.me();
  })
  .then(function(user) {
    self._user = user;
    return token_result;
  })
  .nodeify(callback);
};

//
// refreshToken
// Use refresh token to get new access token.
// If the refresh token is null/defined, then we use the stored token from auth
// Returns:
//   {
//     refreshToken: <optional refresh code sent from a previous authcode>
//   }
BitGo.prototype.refreshToken = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], ['refreshToken'], callback);

  var refreshToken = params.refreshToken || this._refreshToken;

  if (!refreshToken) {
    throw new Error('Must provide refresh token or have authenticated with Oauth before');
  }

  if (!this._clientId || !this._clientSecret) {
    throw new Error('Need client id and secret set first to use this');
  }

  var self = this;
  return this.post(this._baseUrl + '/oauth/token')
  .send({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: self._clientId,
    client_secret: self._clientSecret
  })
  .result()
  .then(function(body) {
    self._token = body.access_token;
    self._refreshToken = body.refresh_token;
    return body;
  })
  .nodeify(callback);
};

//
// logout
// Logout of BitGo
//
BitGo.prototype.logout = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  var self = this;
  return this.get(this.url('/user/logout'))
  .result()
  .then(function() {
    self.clear();
  })
  .nodeify(callback);
};

//
// getUser
// Get a user by ID (name/email only)
//
BitGo.prototype.getUser = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['id'], [], callback);

  return this.get(this.url('/user/' + params.id))
  .result('user')
  .nodeify(callback);
};

//
// me
// Get the current logged in user
//
BitGo.prototype.me = function(params, callback) {
  return this.getUser({id: 'me'}, callback);
};

//
// unlock
// Unlock the session by providing Authy OTP
//
BitGo.prototype.unlock = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], ['otp'], callback);

  return this.post(this.url('/user/unlock'))
  .send(params)
  .result()
  .nodeify(callback);
};

//
// lock
// Lock the session
//
BitGo.prototype.lock = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.post(this.url('/user/lock'))
  .result()
  .nodeify(callback);
};

//
// me
// Get the current session
//
BitGo.prototype.session = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.get(this.url('/user/session'))
  .result('session')
  .nodeify(callback);
};

//
// sendOTP
// Trigger a push/sms for the OTP code
//
BitGo.prototype.sendOTP = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.post(this.url('/user/sendotp'))
  .send(params)
  .result()
  .nodeify(callback);
};

//
// getSharingKey
// Get a key for sharing a wallet with a user
//
BitGo.prototype.getSharingKey = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['email'], [], callback);

  return this.post(this.url('/user/sharingkey'))
  .send(params)
  .result()
  .nodeify(callback);
};

//
// ping
// Test connectivity to the server
//
BitGo.prototype.ping = function(params,callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.get(this.url('/ping'))
  .result()
  .nodeify(callback);
};

//
// Blockchain
// Get the blockchain object.
//
BitGo.prototype.blockchain = function() {
  if (!this._blockchain) {
    this._blockchain = new Blockchain(this);
  }
  return this._blockchain;
};

//
// keychains
// Get the user's keychains object.
//
BitGo.prototype.keychains = function() {
  if (!this._keychains) {
    this._keychains = new Keychains(this);
  }
  return this._keychains;
};

//
// wallets
// Get the user's wallets object.
//
BitGo.prototype.wallets = function() {
  if (!this._wallets) {
    this._wallets = new Wallets(this);
  }
  return this._wallets;
};

//
// pendingApprovals
// Get pending approvals that can be approved/ or rejected
//
BitGo.prototype.pendingApprovals = function( ) {
  if (!this._pendingApprovals) {
    this._pendingApprovals = new PendingApprovals(this);
  }
  return this._pendingApprovals;
};

//
// newWallet
// A factory method to create a new Wallet object, initialized with the wallet params
// Can be used to reconstitute a wallet from cached data
//
BitGo.prototype.newWalletObject = function(walletParams) {
  return new Wallet(this, walletParams);
};

BitGo.prototype.url = function(path) {
  return this._baseApiUrl + path;
};

//
// labels
// Get all the address labels on all of the user's wallets
//
BitGo.prototype.labels = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.get(this.url('/labels'))
  .result('labels')
  .nodeify(callback);
};

//
// estimateFee
// Estimates approximate fee per kb needed for a tx to get into a block
// Parameters include:
//   numBlocks:  target blocks for the transaction to be confirmed
//
BitGo.prototype.estimateFee = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  var url = this.url('/tx/fee');
  if (params.numBlocks) {
    if (typeof(params.numBlocks) != 'number') {
      throw new Error('invalid argument');
    }
    url += '?numBlocks=' + params.numBlocks;
  }

  return this.get(url)
  .result()
  .nodeify(callback);
};

module.exports = BitGo;

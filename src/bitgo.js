//
// BitGo JavaScript SDK
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var superagent = require('superagent');
var bitcoin = require('./bitcoin');
var Blockchain = require('./blockchain');
var Keychains = require('./keychains');
var TravelRule = require('./travelRule');
var Wallet = require('./wallet');
var Wallets = require('./wallets');
var Markets = require('./markets');
var PendingApprovals = require('./pendingapprovals');
var sjcl = require('./sjcl.min');
var common = require('./common');
var Util = require('./util');
var Q = require('q');
var pjson = require('../package.json');
var moment = require('moment');
var _ = require('lodash');

if (!process.browser) {
  require('superagent-proxy')(superagent);
}

// Patch superagent to return promises
var _end = superagent.Request.prototype.end;
superagent.Request.prototype.end = function(cb) {
  var self = this;
  if (typeof cb === 'function') return _end.call(self, cb)

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
    if (res.body) {
      err.result = res.body;
    }
    if (_.has(res.headers, 'x-auth-required') && (res.headers['x-auth-required'] === 'true')) {
      err.invalidToken = true;
    }
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
var testNetWarningMessage = false;
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

  if (params.env === 'production') {
    params.env = 'prod'; // make life easier
  }

  if (params.customRootURI ||
      params.customBitcoinNetwork ||
      params.customSigningAddress ||
      process.env.BITGO_CUSTOM_ROOT_URI ||
      process.env.BITGO_CUSTOM_BITCOIN_NETWORK) {
    params.env = 'custom';
    if (params.customRootURI) {
      common.Environments['custom'].uri = params.customRootURI;
    }
    if (params.customBitcoinNetwork) {
      common.Environments['custom'].network = params.customBitcoinNetwork;
    }
    if (params.customSigningAddress) {
      common.Environments['custom'].customSigningAddress = params.customSigningAddress;
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
    if (!testNetWarningMessage && params.env === 'test') {
      testNetWarningMessage = true;
      console.log('BitGo SDK env not set - defaulting to testnet at test.bitgo.com.');
    }
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
      req.timeout(process.env.BITGO_TIMEOUT || 60000);
      return req;
    };
  };

  for (var index in methods) {
    var self = this;
    var method = methods[index];
    self[method] = createPatch(method);
  }

  // Kick off first load of constants
  this.fetchConstants();
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
    token: this._token,
    extensionKey: this._extensionKey ?  this._extensionKey.toWIF() : null
  };
};

BitGo.prototype.fromJSON = function(json) {
  this._user = json.user;
  this._token = json.token;
  if (json.extensionKey) {
    this._extensionKey = bitcoin.ECPair.fromWIF(json.extensionKey, bitcoin.getNetwork());
  }
};

BitGo.prototype.user = function() {
  return this._user;
};

BitGo.prototype.verifyAddress = function(params) {
  params = params || {};
  common.validateParams(params, ['address'], []);

  var address;

  try {
    address = bitcoin.address.fromBase58Check(params.address);
  } catch(e) {
    return false;
  }

  var network = bitcoin.getNetwork();
  return address.version === network.pubKeyHash || address.version === network.scriptHash;
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

  // SJCL internally reuses salts for the same password, so we force a new random salt everytime
  // We use random.randomWords(2,0) because it's what SJCL uses for randomness by default
  var randomSalt = sjcl.random.randomWords(2,0);
  var encryptOptions = { iter: 10000, ks: 256, salt: randomSalt };
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

  var otherKeyPub = bitcoin.ECPair.fromPublicKeyBuffer(new Buffer(params.otherPubKeyHex, 'hex'));
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

/**
 * Get bitcoin market data
 */
BitGo.prototype.markets = function() {
  if (!this._markets) {
    this._markets = new Markets(this);
  }
  return this._markets;
};

//
// (Deprecated: Will be removed in the future) use bitgo.markets().latest()
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
// (Deprecated: Will be removed in the future) use bitgo.markets().yesterday()
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

/**
 * Synchronous method for activating an access token.
 * @param params
 *  - accessToken: the token to be used
 * @param callback
 */
BitGo.prototype.authenticateWithAccessToken = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['accessToken'], [], callback);

  this._token = params.accessToken;
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
  var trust = params.trust;

  // Calculate the password HMAC so we don't send clear-text passwords
  var key = sjcl.codec.utf8String.toBits(username);
  var hmac = new sjcl.misc.hmac(key, sjcl.hash.sha256);
  var hmacPassword = sjcl.codec.hex.fromBits(hmac.encrypt(password));

  var authParams = {
    email: username,
    password: hmacPassword,
    forceSMS: !!params.forceSMS
  };

  if (otp) {
    authParams.otp = otp;
    if (trust) {
      authParams.trust = 1;
    }
  }

  if (params.extensible) {
    this._extensionKey = bitcoin.makeRandomKey();
    authParams.extensible = true;
    authParams.extensionAddress = this._extensionKey.getAddress();
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

/**
 *
 * @param params
 * - operatingSystem: one of ios, android
 * - pushToken: hex-formatted token for the respective native push notification service
 * @param callback
 * @returns {*}
 */
BitGo.prototype.registerPushToken = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['pushToken', 'operatingSystem'], [], callback);

  if (!this._token) {
    // this device has to be registered to an extensible session
    return this.reject('not logged in', callback);
  }

  var postParams = _.pick(params, ['pushToken', 'operatingSystem']);

  return this.post(this.url('/devices'))
  .send(postParams)
  .result()
  .nodeify(callback);
};

/**
 *
 * @param params
 * - pushVerificationToken: the token received via push notification to confirm the device's mobility
 * @param callback
 */
BitGo.prototype.verifyPushToken = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['pushVerificationToken'], [], callback);

  if (!this._token) {
    // this device has to be registered to an extensible session
    return this.reject('not logged in', callback);
  }

  var postParams = _.pick(params, 'pushVerificationToken');

  return this.post(this.url('/devices/verify'))
  .send(postParams)
  .result()
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
// listAccessTokens
// Get information on all of the BitGo access tokens on the user
// Returns:
// {
//    id: <id of the token>
//    label: <the user-provided label for this token>
//    user: <id of the user on the token>
//    enterprise <id of the enterprise this token is valid for>
//    client: <the auth client that this token belongs to>
//    scope: <list of allowed OAuth scope values>
//    created: <date the token was created>
//    expires: <date the token will expire>
//    origin: <the origin for which this token is valid>
//    isExtensible: <flag indicating if the token can be extended>
//    extensionAddress: <address whose private key's signature is necessary for extensions>
//    unlock: <info for actions that require an unlock before firing>
// }
//
BitGo.prototype.listAccessTokens = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.get(this.url('/user/accesstoken'))
  .send()
  .result('accessTokens')
  .nodeify(callback);
};

//
// addAccessToken
// Add a BitGo API Access Token to the current user account
// Params:
// {
//    otp: (required) <valid otp code>
//    label: (required) <label for the token>
//    duration: <length of time in seconds the token will be valid for>
//    ipRestrict: <array of IP address strings to whitelist>
//    txValueLimit: <number of outgoing satoshis allowed on this token>
// }
// Returns:
// {
//    id: <id of the token>
//    token: <access token hex string to be used for BitGo API request verification>
//    label: <user-provided label for this token>
//    user: <id of the user on the token>
//    enterprise <id of the enterprise this token is valid for>
//    client: <the auth client that this token belongs to>
//    scope: <list of allowed OAuth scope values>
//    created: <date the token was created>
//    expires: <date the token will expire>
//    origin: <the origin for which this token is valid>
//    isExtensible: <flag indicating if the token can be extended>
//    extensionAddress: <address whose private key's signature is necessary for extensions>
//    unlock: <info for actions that require an unlock before firing>
// }
//
BitGo.prototype.addAccessToken = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['otp', 'label'], [], callback);

  // check non-string params
  if (params.duration) {
    if (typeof(params.duration) !== 'number' || params.duration < 0) {
      throw new Error('duration must be greater than 0');
    }
  }
  if (params.ipRestrict) {
    if (!_.isArray(params.ipRestrict)) {
      throw new Error('ipRestrict must be an array');
    }
    _.forEach(params.ipRestrict, function(ipAddr) {
      if (!_.isString(ipAddr)) {
        throw new Error('ipRestrict must be an array of IP address strings');
      }
    });
  }
  if (params.txValueLimit) {
    if (typeof(params.txValueLimit) !== 'number') {
      throw new Error('txValueLimit must be a number');
    }
    if (params.txValueLimit < 0) {
      throw new Error('txValueLimit must be a non-negative number')
    }
  }

  return this.post(this.url('/user/accesstoken'))
  .send(params)
  .result()
  .nodeify(callback);
};

//
// removeAccessToken
// Sets the expire time of an access token matching either the id or label to the current date, effectively deleting it
// Params:
// {
//    id: <id of the access token to be deleted>
//    label: <label of the access token to be deleted>
// }
// Returns:
// {
//    id: <id of the token>
//    label: <user-provided label for this token>
//    user: <id of the user on the token>
//    enterprise <id of the enterprise this token is valid for>
//    client: <the auth client that this token belongs to>
//    scope: <list of allowed OAuth scope values>
//    created: <date the token was created>
//    expires: <date the token will expire>
//    origin: <the origin for which this token is valid>
//    isExtensible: <flag indicating if the token can be extended>
//    extensionAddress: <address whose private key's signature is necessary for extensions>
//    unlock: <info for actions that require an unlock before firing>
// }
//
BitGo.prototype.removeAccessToken = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], ['id', 'label'], callback);
  var exactlyOne = !!params.id ^ !!params.label;
  if (!exactlyOne) {
    throw new Error('must provide exactly one of id or label')
  }

  var self = this;

  return Q().then(function() {
    if (params.id) {
      return params.id;
    }

    // we have to get the id of the token by using the label before we can delete it
    return self.listAccessTokens()
    .then(function(tokens) {
      if (!tokens) {
        throw new Error('token with this label does not exist');
      }

      var matchingTokens = _.filter(tokens, { label: params.label });
      if (matchingTokens.length > 1) {
        throw new Error('ambiguous call: multiple tokens matching this label');
      }
      if (matchingTokens.length === 0) {
        throw new Error('token with this label does not exist');
      }
      return matchingTokens[0].id;
    });
  })
  .then(function(tokenId) {
    return self.del(self.url('/user/accesstoken/' + tokenId))
    .send()
    .result();
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

/**
 * Extend token, provided the current token is extendable
 * @param params
 * - duration: duration in seconds by which to extend the token, starting at the current time
 * @param callback
 */
BitGo.prototype.extendToken = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  var timestamp = Date.now();
  var duration = params.duration;
  var message = timestamp + '|' + this._token + '|' + duration;
  var signature = bitcoin.message.sign(this._extensionKey, message, bitcoin.networks.bitcoin).toString('hex');

  return this.post(this.url('/user/extendtoken'))
  .send(params)
  .set('timestamp', timestamp)
  .set('signature', signature)
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
// travel rule
// Get the travel rule object
//
BitGo.prototype.travelRule = function() {
  if (!this._travel) {
    this._travelRule = new TravelRule(this);
  }
  return this._travelRule;
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
// newWalletObject
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
//   maxFee: maximum fee willing to be paid (for safety)
//
BitGo.prototype.estimateFee = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  var queryParams = { version: 12 };
  if (params.numBlocks) {
    if (typeof(params.numBlocks) != 'number') {
      throw new Error('invalid argument');
    }
    queryParams.numBlocks = params.numBlocks;
  }
  if (params.maxFee) {
    if (typeof(params.maxFee) != 'number') {
      throw new Error('invalid argument');
    }
    queryParams.maxFee = params.maxFee;
  }

  return this.get(this.url('/tx/fee'))
  .query(queryParams)
  .result()
  .nodeify(callback);
};

//
// instantGuarantee
// Get BitGo's guarantee using an instant id
//
BitGo.prototype.instantGuarantee = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['id'], [], callback);

  var self = this;
  return this.get(this.url('/instant/' + params.id))
  .result()
  .then(function(body) {
    if (!body.guarantee) {
      throw new Error('no guarantee found in response body');
    }
    if (!body.signature) {
      throw new Error('no signature found in guarantee response body');
    }
    var signingAddress = common.Environments[self.env].signingAddress;
    if (!bitcoin.message.verify(signingAddress, new Buffer(body.signature, 'hex'), body.guarantee, bitcoin.getNetwork())) {
      throw new Error('incorrect signature');
    }
    return body;
  })
  .nodeify(callback);
};

//
// getBitGoFeeAddress
// Get a target address for payment of a BitGo fee
//
BitGo.prototype.getBitGoFeeAddress = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  var self = this;
  return this.post(this.url('/billing/address'))
  .send({})
  .result()
  .nodeify(callback);
};

//
// getWalletAddress
// Gets an address object (including the wallet id) given an address
//
BitGo.prototype.getWalletAddress = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['address'], [], callback);

  var self = this;
  return this.get(this.url('/walletaddress/' + params.address))
  .result()
  .nodeify(callback);
};

//
// fetchConstants
// Receives a TTL and refetches as necessary
//
BitGo.prototype.fetchConstants = function(params, callback) {
  params = params || {};
  var self = this;

  if (self._constants && self._constantsExpire && new Date() < self._constantsExpire) {
    return Q().then(function() {
      return self._constants;
    })
    .nodeify(callback);
  }

  return this.get(this.url('/client/constants'))
  .result()
  .then(function(result) {
    self._constants = result.constants;
    self._constantsExpire = moment.utc().add(result.ttl, 'second').toDate();
    return self._constants;
  })
  .nodeify(callback);
};

//
// getConstants
// Get a set of constants from the server to use as defaults
//
BitGo.prototype.getConstants = function(params) {
  params = params || {};

  var defaultConstants = {
    maxFee: 0.1e8,
    maxFeeRate: 100000,
    minFeeRate: 2000,
    fallbackFeeRate: 20000,
    minOutputSize: 2730
  };

  this.fetchConstants(params);
  return this._constants || defaultConstants;
};

module.exports = BitGo;

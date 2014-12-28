//
// BitGo JavaScript SDK
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var superagent = require('superagent');
var Address = require('./bitcoin/address');
var Blockchain = require('./blockchain');
var Keychains = require('./keychains');
var Wallets = require('./wallets');
var sjcl = require('./bitcoin/sjcl.min');
var common = require('./common');

//
// Constructor for BitGo Object
// arguments:
//   @useProduction: flag to use the production bitcoin network rather than the
//                   testnet network.
//
var BitGo = function(params) {
  params = params || {};
  if (!common.validateParams(params, [], ['clientId', 'clientSecret', 'refreshToken', 'accessToken']) ||
      (params.useProduction && typeof(params.useProduction) != 'boolean')) {
    throw new Error('invalid argument');
  }

  if (!params.clientId !== !params.clientSecret) {
    throw new Error('invalid argument - must provide both client id and secret');
  }

  // By default, we operate on the test server.
  if (params.useProduction) {
    this._baseUrl = 'https://www.bitgo.com';
  } else {
    this._baseUrl = 'https://test.bitgo.com';
  }

  this._baseApiUrl = this._baseUrl + '/api/v1';
  this._user = null;
  this._keychains = null;
  this._wallets = null;
  this._clientId = params.clientId;
  this._clientSecret = params.clientSecret;
  this._token = params.accessToken || null;
  this._refreshToken = params.refreshToken || null;

  // Create superagent methods specific to this BitGo instance.
  this.request = {};
  var methods = ['get', 'post', 'put', 'del'];

  // This is a patching function which can apply our authorization
  // headers to any outbound request.
  var createPatch = function(method) {
    return function() {
      var req = superagent[method].apply(null, arguments);
      if (self._token) {
        req.set('Authorization', "Bearer " + self._token);
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


//
// version
// Gets the version of the BitGoJS API
//
BitGo.prototype.version = function() {
  return '0.1.0';
};

BitGo.prototype.verifyAddress = function(params) {
  params = params || {};
  common.validateParams(params, ['address'], []);

  try {
    var address = new Address(params.address);
    return true;
  } catch(e) {
    return false;
  }
};

//
// encrypt
// Utility function to encrypt locally.
//
BitGo.prototype.encrypt = function(params) {
  params = params || {};
  common.validateParams(params, ['password', 'input'], []);

  var encryptOptions = { iter: 10000, ks: 256 };
  return sjcl.encrypt(params.password, params.input, encryptOptions);
};

//
// decrypt
// Utility function to decrypt locally.
//
BitGo.prototype.decrypt = function(params) {
  params = params || {};
  common.validateParams(params, ['password', 'opaque']);

  return sjcl.decrypt(params.password, params.opaque);
};

//
// market
// Get the latest bitcoin prices.
//
BitGo.prototype.market = function(params, callback) {
  params = params || {};
  common.validateParams(params);

  if (typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }

  this.get(this.url('/market/latest'))
  .end(function(err, res) {
    if (err) {
      return callback(err);
    }
    callback(null, res.body);
  });
};

//
// market data yesterday
// Get market data from yesterday
//
BitGo.prototype.yesterday = function(params, callback) {
  params = params || {};
  common.validateParams(params);

  if (typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }

  this.get(this.url('/market/yesterday'))
  .end(function(err, res) {
    if (err) {
      return callback(err);
    }
    callback(null, res.body);
  });
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
  common.validateParams(params, ['username', 'password'], ['otp']);

  if (typeof(callback) != 'function') {
    throw new Error('illegal callback argument');
  }

  var username = params.username;
  var password = params.password;
  var otp = params.otp;

  var authParams = {
    email: username,
    password: password
  };

  if (otp) {
    authParams.otp = otp;
  }

  var self = this;
  if (this._token) {
    return callback(new Error('already logged in'));
  }

  this.post(this.url('/user/login'))
  .send(authParams)
  .end(function(err, res) {
    if (self.handleBitGoAPIError(err, res, callback)) {
      return;
    }
    self._user = res.body.user;
    self._token = res.body.access_token;
    callback(null, res.body);
  });
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
  common.validateParams(params, ['authCode'], []);

  if (typeof(callback) != 'function') {
    throw new Error('illegal callback argument');
  }

  if (!this._clientId || !this._clientSecret) {
    throw new Error('Need client id and secret set first to use this');
  }

  var authCode = params.authCode;

  var self = this;
  if (this._token) {
    return callback(new Error('already logged in'));
  }

  this.post(this._baseUrl + '/oauth/token')
  .send({
    grant_type: 'authorization_code',
    code: authCode,
    client_id: self._clientId,
    client_secret: self._clientSecret
  })
  .end(function(err, token_result) {
    if (self.handleBitGoAPIError(err, token_result, callback)) {
      return;
    }
    self._token = token_result.body.access_token;
    self._refreshToken = token_result.body.refresh_token;
    self.me({}, function(err, me_result) {
      if (err) {
        callback(err);
      }

      self._user = me_result;
      callback(null, token_result.body);
    });
  });
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
  common.validateParams(params, [], ['refreshToken']);

  if (typeof(callback) != 'function') {
    throw new Error('illegal callback argument');
  }

  var refreshToken = params['refreshToken'];
  if (!refreshToken) {
    refreshToken = this._refreshToken;
  }

  if (!refreshToken) {
    throw new Error('Must provide refresh token or have authenticated with Oauth before');
  }

  if (!this._clientId || !this._clientSecret) {
    throw new Error('Need client id and secret set first to use this');
  }

  var self = this;
  this.post(this._baseUrl + '/oauth/token')
  .send({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: self._clientId,
    client_secret: self._clientSecret
  })
  .end(function(err, refresh_result) {
    if (self.handleBitGoAPIError(err, refresh_result, callback)) {
      return;
    }
    self._token = refresh_result.body.access_token;
    self._refreshToken = refresh_result.body.refresh_token;
    callback(null, refresh_result.body);
  });
};

//
// logout
// Logout of BitGo
//
BitGo.prototype.logout = function(params, callback) {
  params = params || {};
  common.validateParams(params);

  if (typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }

  var self = this;
  this.get(this.url('/user/login'))
  .send()
  .end(function(err, res) {
    delete self._user;
    delete self._token;
    callback(err);
  });
};

//
// me
// Get the current logged in user
//
BitGo.prototype.me = function(params, callback) {
  params = params || {};
  common.validateParams(params);

  if (typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }

  if (!this._token) {
    return callback(new Error('not authenticated'));
  }

  var self = this;
  this.get(this.url('/user/me'))
  .send()
  .end(function(err, res) {
    if (self.handleBitGoAPIError(err, res, callback)) {
      return;
    }

    callback(null, res.body.user);
  });
};

//
// unlock
// Unlock the session by providing Authy OTP
//
BitGo.prototype.unlock = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], ['otp']);

  if (typeof(callback) != 'function') {
    throw new Error('invalid callback argument');
  }

  var otp = params['otp'];
  if (!this._token) {
    return callback(new Error('not authenticated'));
  }

  var self = this;
  this.post(this.url('/user/unlock'))
  .send(params)
  .end(function(err, res) {
    if (self.handleBitGoAPIError(err, res, callback)) {
      return;
    }
    callback(null, {});
  });
};

//
// lock
// Lock the session
//
BitGo.prototype.lock = function(params, callback) {
  params = params || {};
  common.validateParams(params);

  if (typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }

  if (!this._token) {
    return callback(new Error('not authenticated'));
  }

  var self = this;
  this.post(this.url('/user/lock'))
  .send()
  .end(function(err, res) {
    if (self.handleBitGoAPIError(err, res, callback)) {
      return;
    }
    callback(null, {});
  });
};

//
// ping
// Test connectivity to the server
//
BitGo.prototype.ping = function(params,callback) {
  params = params || {};
  common.validateParams(params);

  if (typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }

  var self = this;
  this.get(this.url('/ping'))
  .send({})
  .end(function(err, res) {
    if (self.handleBitGoAPIError(err, res, callback)) {
      return;
    }
    callback(null, res.body);
  });
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
// Handles HTTP errors from the BitGo API
// Returns:
//   true if an error was handled and the callback was called.  The caller should stop processing.
//   false if the caller should continue.
//
BitGo.prototype.handleBitGoAPIError = function(err, res, callback) {
  if (err) {
    // TODO: assert type of err object?
    callback(err);
    return true;
  }

  if (res.status == 200) {
    return false;   // no error!
  }

  if (res.status == 401 && res.body.needsOTP) {
    callback({status: 401, needsOTP: true});
    return true;
  }

  var error = res.body.error ? res.body.error : res.status.toString();
  callback({status: res.status, error: error, details: new Error(error)});
  return true;
};

BitGo.prototype.url = function(path) {
  return this._baseApiUrl + path;
};

module.exports = BitGo;

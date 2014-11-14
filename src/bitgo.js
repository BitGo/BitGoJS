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

//
// Constructor for BitGo Object
// arguments:
//   @useProduction: flag to use the production bitcoin network rather than the
//                   testnet network.
//
var BitGo = function(useProduction) {
  if (useProduction && typeof(useProduction) != 'boolean') {
    throw new Error('invalid argument');
  }

  // By default, we operate on the test server.
  if (useProduction) {
    this._baseUrl = 'https://www.bitgo.com/api/v1';
  } else {
    this._baseUrl = 'https://test.bitgo.com/api/v1';
  }

  this._user = null;
  this._keychains = null;
  this._wallets = null;

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

BitGo.prototype.verifyAddress = function(addr) {
  if (typeof(addr) != 'string') {
    throw new Error('invalid argument');
  }
  try {
    var address = new Address(addr);
    return true;
  } catch(e) {
    return false;
  }
};

//
// encrypt
// Utility function to encrypt locally.
//
BitGo.prototype.encrypt = function(password, string) {
  var encryptOptions = { iter: 10000, ks: 256 };
  return sjcl.encrypt(password, string, encryptOptions);
};

//
// decrypt
// Utility function to decrypt locally.
//
BitGo.prototype.decrypt = function(password, opaque) {
  return sjcl.decrypt(password, opaque);
};

BitGo.prototype.url = function(path) {
  return this._baseUrl + path;
};

//
// market
// Get the latest bitcoin prices.
//
BitGo.prototype.market = function(callback) {
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
BitGo.prototype.yesterday = function(callback) {
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
BitGo.prototype.authenticate = function(username, password, otp, callback) {
  if (typeof(username) != 'string' || typeof(password) != 'string' ||
      typeof(otp) != 'string' || typeof(callback) != 'function') {
    throw new Error('illegal argument');
  }

  var self = this;
  if (this._user) {
    return callback(new Error('already logged in'));
  }

  this.post(this.url('/user/login'))
  .send({email: username, password: password, otp: otp})
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
// logout
// Logout of BitGo
//
BitGo.prototype.logout = function(callback) {
  if (typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }

  if (!this._user) {
    return callback(null);  // We're not logged in.
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
BitGo.prototype.me = function(callback) {
  if (typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }

  if (!this._user) {
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
BitGo.prototype.unlock = function(otp, callback) {
  if (typeof(otp) != 'string' || typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }

  if (!this._user) {
    return callback(new Error('not authenticated'));
  }

  var self = this;
  this.post(this.url('/user/unlock'))
  .send({otp: otp})
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
BitGo.prototype.lock = function(callback) {
  if (typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }

  if (!this._user) {
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
BitGo.prototype.ping = function(callback) {
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

module.exports = BitGo;

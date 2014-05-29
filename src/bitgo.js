//
// BitGo JavaScript SDK
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var request = require('superagent');
var Keychains = require('./keychains');

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
    this._baseUrl = 'https://beer.bitgo.com/api/v1';
  }

  // We use a browser session for repeated requests.
  this._agent = request.agent();

  // The keychains object for this user.
  this._keychains = null;

  // The user object for this user.
  this._user = null;
};

//
// version
// Gets the version of the BitGoJS API
//
BitGo.prototype.version = function() {
  return '0.1.0';
};

//
// market
// Get the latest bitcoin prices.
//
BitGo.prototype.market = function(callback) {
  if (typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }

  var url = this._baseUrl + '/market/latest';
  this._agent
  .get(url)
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
//
BitGo.prototype.authenticate = function(username, password, otp, callback) {
  if (typeof(username) != 'string' || typeof(password) != 'string' ||
      typeof(otp) != 'string' || typeof(callback) != 'function') {
    throw new Error('illegal argument');
  }

  var self = this;
  var url = this._baseUrl + '/user/login/local';

  if (this._user) {
    return callback(new Error('already logged in'));
  }

  this._agent
  .post(url)
  .send({email: username, password: password, otp: otp})
  .end(function(err, res) {
    if (err) {
      return callback(err);
    }
    if (res.status == 401 && res.body.needsOTP) {
      return callback({status: 401, needsOTP: true});
    }
    self._user = res.body.user;
    self._agent.saveToken(res.body.token);
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
  var url = this._baseUrl + '/user/logout';
  this._agent
  .get(url)
  .send()
  .end(function(err, res) {
    delete self._user;
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

  var url = this._baseUrl + '/user/me';
  this._agent
  .get(url)
  .send()
  .end(function(err, res) {
    if (err) {
      return callback(err);
    }
    if (res.status != 200) {
      return callback(new Error(res.body.error));
    }
    callback(null, res.body.user);
  });
};

//
// keychains
// get the user's keychains object.
//
BitGo.prototype.keychains = function() {
  if (!this._keychains) {
    this._keychains = new Keychains(this);
  }
  return this._keychains;
}

module.exports = BitGo;

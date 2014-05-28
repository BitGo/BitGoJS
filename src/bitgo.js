//
// BitGo JavaScript SDK
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var request = require('superagent');

//
// Constructor for BitGo Object
// arguments:
//   @useProduction: flag to use the production bitcoin network rather than the
//                   testnet network.
//
var BitGo = function(useProduction) {
  if (useProduction) {
    this.baseUrl = 'https://www.bitgo.com/api/v1';
  } else {
    this.baseUrl = 'https://beer.bitgo.com/api/v1';
  }
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
  var url = this.baseUrl + '/market/latest';
  request
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
  var self = this;
  var url = this.baseUrl + '/user/login/local';

  if (this.user) {
    return callback(new Error('already logged in'));
  }

  request
  .post(url)
  .send({email: username, password: password, otp: otp})
  .end(function(err, res) {
    if (err) {
      return callback(err);
    }
    if (res.status == 401 && res.body.needsOTP) {
      return callback({status: 401, needsOTP: true});
    }
    self.user = res.body.user;
    self.token = res.body.token;
    callback(null, res.body);
  });
};

//
// logout
// Logout of BitGo
//
BitGo.prototype.logout = function(callback) {
  if (!this.user) {
    return callback(null);  // We're not logged in.
  }

  var self = this;
  var url = this.baseUrl + '/user/logout';
  request
  .get(url)
  .set('Authorization', 'Bearer ' + this.token)
  .send()
  .end(function(err, res) {
    delete self.user;
    delete self.token;
    callback(err);
  });
};

//
// me
// Get the current logged in user
//
BitGo.prototype.me = function(callback) {
  if (!this.token) {
    return callback(new Error('not authenticated'));
  }

  var url = this.baseUrl + '/user/me';
  request
  .get(url)
  .set('Authorization', 'Bearer ' + this.token)
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

module.exports = BitGo;

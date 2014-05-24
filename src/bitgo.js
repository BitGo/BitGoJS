//
// BitGo JavaScript SDK
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var request = require('superagent');

//
// Constructor for BitGo Object
// arguments:
//   @useProduction: flag to use the production bitcoin network rather than the testnet network.
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
        throw err;
      }
      callback(res.body);
    });
};

module.exports = BitGo;

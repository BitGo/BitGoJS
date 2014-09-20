//
// BitGo object augmented for testing
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var BitGo = require('../../src/bitgo.js');

BitGo.TEST_USER = 'mike+test@bitgo.com';
BitGo.TEST_PASSWORD = 'itestutestwetest';
BitGo.TEST_PASSWORD_HMAC = 'ce897c2ded122c6cbacf9084691f1d6f9eb8433d6b9a655f2698947889333fe3';

//
// testUserOTP
// Get an OTP code for the test user.
//
BitGo.prototype.testUserOTP = function() {
  return "0000000";
};

//
// authenticateTestUser
// Authenticate the test user.
//
BitGo.prototype.authenticateTestUser = function(otp, callback) {
  this.authenticate(BitGo.TEST_USER, BitGo.TEST_PASSWORD, otp, function(err, response) {
    if (!err && response) {
      response.should.have.property('access_token');
      response.should.have.property('user');
    }
    callback(err, response);
  });
};

module.exports = BitGo;

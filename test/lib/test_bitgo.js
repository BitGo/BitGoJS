//
// BitGo object augmented for testing
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var BitGo = require('../../src/bitgo.js');

BitGo.TEST_USER = 'tester@bitgo.com';
BitGo.TEST_PASSWORD = 'testtesttest';
BitGo.TEST_PASSWORD_HMAC = 'b160a6cc799280822912251d0a6b25f8ff32f0ad7e6dda7d9fda59ee1bc57080';

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

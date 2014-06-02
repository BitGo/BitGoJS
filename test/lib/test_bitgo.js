//
// BitGo object augmented for testing
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var speakeasy = require('./speakeasy');

var BitGo = require('../../src/bitgo.js');

BitGo.TEST_USER = 'mike+test@bitgo.com';
BitGo.TEST_PASSWORD = 'itestutestwetest';
BitGo.TEST_OTP_KEY = 'KVVT4LS5O5ICMPB6LJTWMT2GGJ4SKTBW';

//
// testUserOTP
// Get an OTP code for the test user.
//
BitGo.prototype.testUserOTP = function() {
  var parameters = {
    key: BitGo.TEST_OTP_KEY,
    step: 60,
    time: Math.floor(new Date().getTime() / 1000)
  };
  return speakeasy.totp(parameters);
};

//
// authenticateTestUser
// Authenticate the test user.
//
BitGo.prototype.authenticateTestUser = function(otp, callback) {
  this.authenticate(BitGo.TEST_USER, BitGo.TEST_PASSWORD, otp, callback);
};

module.exports = BitGo;

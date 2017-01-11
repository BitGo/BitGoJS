// test data and for the BitGo SDK v2


var BitGo = require('../../../src/bitgo.js');

BitGo.TEST_USER = 'tester@bitgo.com';

if (process.env.BITGOJS_TEST_PASSWORD) {
  BitGo.TEST_PASSWORD = process.env.BITGOJS_TEST_PASSWORD;
} else {
  // Test accounts are locked internally to prevent tampering
  // Contact bencxr@fragnetics.com benchan for further help on how to fix this
  throw new Error("Need to set BITGOJS_TEST_PASSWORD env variable - please see the developer setup docs.");
}

BitGo.prototype.initializeTestVars = function() {
  if (this.getEnv() === 'dev' || this.getEnv() === 'local') {
    BitGo.TEST_USERID = '585caccd5573b0a8416a745ed58d8cb4';
    BitGo.TEST_WALLET1_PASSCODE = 'iVWeATjqLS1jJShrPpETti0b';
    BitGo.TEST_WALLET1_XPUB = 'xpub661MyMwAqRbcGicVM5K5UnocWoFt3Yh1RZKzSEHPPARhyMf9w7DVqM3PgBgiVW5NHRp8UteqhMoQb17rCQsLbmGXuPx43MKskyB31R97p3G';
    BitGo.TEST_WALLET1_ID = '585cc5335573b0a8416aadb1fce63ce3';
  } else {
    BitGo.TEST_USERID = '543c11ed356d00cb7600000b98794503';
    BitGo.TEST_WALLET1_PASSCODE = 'iVWeATjqLS1jJShrPpETti0b';
    BitGo.TEST_WALLET1_XPUB = 'xpub661MyMwAqRbcFWFN9gpFpnSVy6bF3kMZAkSXtu3ZYKPgq2KUVo1xEMnMXDcavwDJ4zH57iUHVfEGVK7dEgo7ufKRzTkeWYSBDuye5g7w4pe';
    BitGo.TEST_WALLET1_ID = '585cc6eb16efb0a50675fe4e3054662b';
  }
};

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
  return this.authenticate({ username: BitGo.TEST_USER, password: BitGo.TEST_PASSWORD, otp: otp })
  .then(function(response) {
    response.should.have.property('access_token');
    response.should.have.property('user');
  })
  .nodeify(callback);
};

module.exports = BitGo;

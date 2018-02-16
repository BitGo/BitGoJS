//
// Test for Keychains
//

require('should');
const Promise = require('bluebird');
const co = Promise.coroutine;
const _ = require('lodash');

const TestV2BitGo = require('../../lib/test_bitgo');

describe('V2 Keychains', function() {
  describe('Update Password', function() {
    let bitgo;
    let basecoin;
    let keychains;

    before(co(function *() {
      bitgo = new TestV2BitGo({ env: 'test' });
      bitgo.initializeTestVars();
      basecoin = bitgo.coin('tltc');
      keychains = basecoin.keychains();
      yield bitgo.authenticateChangePWTestUser({ otp: bitgo.testUserOTP() });
    }));

    it('should successfully update the passwords for all wallets that match the oldPassword', co(function *() {
      const newPassword = 'newPassword';
      const keys = yield keychains.updatePassword({ oldPassword: TestV2BitGo.TEST_PASSWORD, newPassword });
      _.each(keys, function(encryptedPrv, pub) {
        pub.should.startWith('xpub');
        const decryptedPrv = bitgo.decrypt({ input: encryptedPrv, password: newPassword });
        decryptedPrv.should.startWith('xprv');
      });
    }));
  });
});

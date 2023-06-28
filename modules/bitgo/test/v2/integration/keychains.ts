//
// Test for Keychains
//

import 'should';
import * as Promise from 'bluebird';
const co = Promise.coroutine;
import * as _ from 'lodash';

import { TestBitGo } from '../../lib/test_bitgo';

describe('V2 Keychains', function () {
  describe('Update Password', function () {
    let bitgo;
    let basecoin;
    let keychains;
    let correctPassword;

    before(
      co(function* () {
        bitgo = new TestBitGo({ env: 'test' });
        bitgo.initializeTestVars();
        basecoin = bitgo.coin('tltc');
        keychains = basecoin.keychains();
        const loginPasswords = yield bitgo.authenticateChangePWTestUser(bitgo.testUserOTP());
        correctPassword = loginPasswords.password;
      })
    );

    it(
      'should successfully update the passwords for all wallets that match the oldPassword',
      co(function* () {
        const newPassword = 'newPassword';
        const keys = yield keychains.updatePassword({ oldPassword: correctPassword, newPassword });
        _.each(keys, function (encryptedPrv, pub) {
          pub.should.startWith('xpub');
          const decryptedPrv = bitgo.decrypt({ input: encryptedPrv, password: newPassword });
          decryptedPrv.should.startWith('xprv');
        });
      })
    );
  });
});

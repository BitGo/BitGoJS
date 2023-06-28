import * as crypto from 'crypto';
import 'should';

import * as Promise from 'bluebird';
const co = Promise.coroutine;

import { TestBitGo } from '../../../lib/test_bitgo';
import { bip32 } from '../../../../src/bip32util';

const nock = require('nock');
nock.enableNetConnect();

describe('XRP:', function () {
  let bitgo;
  let basecoin;
  const someWalletId = '5d850d60d47f46b1033afa21fdeab87f'; // one of the many random XRP wallets on this account

  before(function () {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
    return bitgo.authenticateTestUser(bitgo.testUserOTP()).then(function () {
      basecoin = bitgo.coin('txrp');
    });
  });

  after(function () {
    nock.cleanAll();
  });

  it('Should generate wallet with custom root address', function () {
    const hdNode = bip32.fromSeed(crypto.randomBytes(32));
    if (!hdNode.privateKey) {
      throw new Error('no privateKey');
    }
    const params = {
      passphrase: TestBitGo.V2.TEST_WALLET1_PASSCODE,
      label: 'Ripple Root Address Test',
      disableTransactionNotifications: true,
      rootPrivateKey: hdNode.privateKey.toString('hex'),
    };

    return basecoin
      .wallets()
      .generateWallet(params)
      .then(function (res) {
        res.should.have.property('wallet');
        res.should.have.property('userKeychain');
        res.should.have.property('backupKeychain');
        res.should.have.property('bitgoKeychain');

        res.userKeychain.should.have.property('pub');
        res.userKeychain.should.have.property('prv');
        res.userKeychain.should.have.property('encryptedPrv');

        res.backupKeychain.should.have.property('pub');

        res.bitgoKeychain.should.have.property('pub');
        res.bitgoKeychain.isBitGo.should.equal(true);
        res.bitgoKeychain.should.not.have.property('prv');
        res.bitgoKeychain.should.not.have.property('encryptedPrv');
      });
  });

  it(
    'should create an XRP address',
    co(function* () {
      const wallet = yield basecoin.wallets().get({ id: someWalletId });
      const addrObj = yield wallet.createAddress();
      addrObj.should.have.property('address');
      addrObj.should.have.property('wallet');
      addrObj.should.have.property('keychains');
    })
  );
});

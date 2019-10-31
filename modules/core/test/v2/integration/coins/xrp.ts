const crypto = require('crypto');
import 'should';

import * as Bluebird from 'bluebird';
const co = Bluebird.coroutine;

import * as utxoLib from 'bitgo-utxo-lib';
import { BaseCoin } from '../../../../src/v2';
import { TestBitGo } from '../../../lib/test_bitgo';

const nock = require('nock');
nock.enableNetConnect();

describe('XRP:', function() {
  let bitgo: typeof TestBitGo;
  let basecoin: BaseCoin;
  const someWalletId = '5d850d60d47f46b1033afa21fdeab87f'; // one of the many random XRP wallets on this account

  before(co(function *() {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
    yield bitgo.authenticateTestUser(bitgo.testUserOTP());
    basecoin = bitgo.coin('txrp');
  }));

  after(function() {
    nock.cleanAll();
  });

  it('Should generate wallet with custom root address', co(function *() {
    const hdNode = utxoLib.HDNode.fromSeedBuffer(crypto.randomBytes(32));
    const params = {
      passphrase: TestBitGo.V2.TEST_WALLET1_PASSCODE,
      label: 'Ripple Root Address Test',
      disableTransactionNotifications: true,
      rootPrivateKey: hdNode.getKey().getPrivateKeyBuffer().toString('hex'),
    };

    const res = yield basecoin.wallets().generateWallet(params);
    res.should.have.property('wallet');
    res.should.have.property('userKeychain');
    res.should.have.property('backupKeychain');
    res.should.have.property('bitgoKeychain');

    res.userKeychain.should.have.property('pub');
    res.userKeychain.should.have.property('prv');
    res.userKeychain.should.have.property('encryptedPrv');

    res.backupKeychain.should.have.property('pub');

    res.bitgoKeychain.should.have.property('pub');
    res.bitgoKeychain.should.have.property('isBitGo', true);
    res.bitgoKeychain.should.not.have.property('prv');
    res.bitgoKeychain.should.not.have.property('encryptedPrv');
  }));

  it('should create an XRP address', co(function *() {
    const wallet = yield basecoin.wallets().get({ id: someWalletId });
    const addrObj = yield wallet.createAddress();
    addrObj.should.have.property('address');
    addrObj.should.have.property('wallet');
    addrObj.should.have.property('keychains');
  }));
});

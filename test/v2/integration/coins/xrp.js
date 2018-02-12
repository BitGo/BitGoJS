const crypto = require('crypto');
require('should');

const Promise = require('bluebird');
const co = Promise.coroutine;

const prova = require('../../../../src/prova');
const TestV2BitGo = require('../../../lib/test_bitgo');

const nock = require('nock');
nock.enableNetConnect();

describe('XRP:', function() {
  let bitgo;
  let basecoin;
  const someWalletId = '595ecd567615fbc707c601324127abb7'; // one of the many random XRP wallets on this account

  before(function() {
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
    return bitgo.authenticateTestUser(bitgo.testUserOTP())
    .then(function() {
      basecoin = bitgo.coin('txrp');
    });
  });

  after(function() {
    nock.cleanAll();
  });

  it('Should generate wallet with custom root address', function() {
    const hdNode = prova.HDNode.fromSeedBuffer(crypto.randomBytes(32));
    const params = {
      passphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE,
      label: 'Ripple Root Address Test',
      disableTransactionNotifications: true,
      rootPrivateKey: hdNode.getKey().getPrivateKeyBuffer().toString('hex')
    };

    return basecoin.wallets().generateWallet(params)
    .then(function(res) {
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

  it('should create an XRP address', co(function *() {
    const wallet = yield basecoin.wallets().get({ id: someWalletId });
    const addrObj = yield wallet.createAddress();
    addrObj.should.have.property('address');
    addrObj.should.have.property('wallet');
    addrObj.should.have.property('keychains');
  }));
});

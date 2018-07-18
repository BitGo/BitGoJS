require('should');

const Promise = require('bluebird');
const co = Promise.coroutine;

const TestV2BitGo = require('../../../lib/test_bitgo');
const stellar = require('../../../../src/v2/coins/xlm');
const coin = new stellar();

const nock = require('nock');
nock.enableNetConnect();

// TODO Enable when the key server is updated to support XLM in test
xdescribe('XLM:', function() {
  let bitgo;
  let basecoin;
  const someWalletId = ''; // todo set to one of the XLM wallets on this account

  before(function() {
    bitgo = new TestV2BitGo({ env: 'local' }); // todo set to test
    bitgo.initializeTestVars();
    return bitgo.authenticateTestUser(bitgo.testUserOTP())
    .then(function() {
      basecoin = bitgo.coin('txlm');
    });
  });

  after(function() {
    nock.cleanAll();
  });

  it('Should generate wallet', co(function *() {
    const params = {
      passphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE,
      label: 'Stellar Wallet Test'
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
    res.backupKeychain.should.have.property('prv');

    res.bitgoKeychain.should.have.property('pub');
    res.bitgoKeychain.isBitGo.should.equal(true);
    res.bitgoKeychain.should.not.have.property('prv');
    res.bitgoKeychain.should.not.have.property('encryptedPrv');
  }));

  it('Should generate wallet with custom root address', co(function *() {
    const keyPair = coin.generateKeyPair();
    const params = {
      passphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE,
      label: 'Stellar Wallet Test',
      rootPrivateKey: keyPair.prv
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
    res.backupKeychain.should.have.property('prv');

    res.bitgoKeychain.should.have.property('pub');
    res.bitgoKeychain.isBitGo.should.equal(true);
    res.bitgoKeychain.should.not.have.property('prv');
    res.bitgoKeychain.should.not.have.property('encryptedPrv');
  }));

  // todo enable when platform changes are available in test
  xit('should create an XLM address', co(function *() {
    const wallet = yield basecoin.wallets().get({ id: someWalletId });
    const addrObj = yield wallet.createAddress();
    addrObj.should.have.property('address');
    addrObj.should.have.property('wallet');
    addrObj.should.have.property('keychains');
  }));
});

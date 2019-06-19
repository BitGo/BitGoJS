import 'should';

import * as Bluebird from 'bluebird';
const co = Bluebird.coroutine;

const TestV2BitGo = require('../../../lib/test_bitgo');

import * as nock from 'nock';

describe('XLM:', function() {
  let bitgo;
  let basecoin;
  const uninitializedWallet = '5d00475a913edd7d0340fb45728c43e2'; // wallet which has not been initialized on-chain
  const initializedWallet = '5d0d1fbe957f229b03de7998c2495070'; // wallet which has been correctly initialized on chain

  before(function() {
    nock.restore();
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
    return bitgo.authenticateTestUser(bitgo.testUserOTP())
    .then(function() {
      basecoin = bitgo.coin('txlm');
    });
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
    const keyPair = basecoin.generateKeyPair();
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

  it('should fail to create an XLM address for a wallet pending on-chain init', co(function *() {
    const wallet = yield basecoin.wallets().get({ id: uninitializedWallet });
    yield wallet.createAddress().should.be.rejectedWith('wallet pending on-chain initialization');
  }));

  it('should create an XLM address for an initialized wallet', co(function *() {
    const wallet = yield basecoin.wallets().get({ id: initializedWallet });
    const addrObj = yield wallet.createAddress();
    addrObj.should.have.property('address');
    addrObj.should.have.property('wallet');
    addrObj.should.have.property('keychains');
  }));
});

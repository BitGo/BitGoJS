import 'should';

import * as Bluebird from 'bluebird';
import { BaseCoin } from '../../../../src/v2';
const co = Bluebird.coroutine;

import { TestBitGo } from '../../../lib/test_bitgo';

import * as nock from 'nock';

describe('XLM:', function () {
  let bitgo: typeof TestBitGo;
  let basecoin: BaseCoin;
  const uninitializedWallet = '5f24525bf2501a0027c98eaa32ec62b3'; // wallet which has not been initialized on-chain
  const initializedWallet = '5f24528f330faa0019763182d2e4f863'; // wallet which has been correctly initialized on chain

  before(
    co(function* () {
      nock.restore();
      bitgo = new TestBitGo({ env: 'test' });
      bitgo.initializeTestVars();
      yield bitgo.authenticateTestUser(bitgo.testUserOTP());
      basecoin = bitgo.coin('txlm');
    })
  );

  function verifyGeneratedWallet(wallet) {
    wallet.should.have.property('wallet');
    wallet.should.have.property('userKeychain');
    wallet.should.have.property('backupKeychain');
    wallet.should.have.property('bitgoKeychain');

    wallet.userKeychain.should.have.property('pub');
    wallet.userKeychain.should.have.property('prv');
    wallet.userKeychain.should.have.property('encryptedPrv');

    wallet.backupKeychain.should.have.property('pub');
    wallet.backupKeychain.should.have.property('prv');

    wallet.bitgoKeychain.should.have.property('pub');
    wallet.bitgoKeychain.isBitGo.should.equal(true);
    wallet.bitgoKeychain.should.not.have.property('prv');
    wallet.bitgoKeychain.should.not.have.property('encryptedPrv');
  }

  it(
    'Should generate wallet',
    co(function* () {
      const params = {
        passphrase: TestBitGo.V2.TEST_WALLET1_PASSCODE,
        label: 'Stellar Wallet Test',
      };

      const res = yield basecoin.wallets().generateWallet(params);
      verifyGeneratedWallet(res);
    })
  );

  it(
    'Should generate wallet with custom root address',
    co(function* () {
      const keyPair = basecoin.generateKeyPair();
      const params = {
        passphrase: TestBitGo.V2.TEST_WALLET1_PASSCODE,
        label: 'Stellar Wallet Test',
        rootPrivateKey: keyPair.prv,
      };

      const res = yield basecoin.wallets().generateWallet(params);
      verifyGeneratedWallet(res);
    })
  );

  it(
    'should fail to create an XLM address for a wallet pending on-chain init',
    co(function* () {
      const wallet = yield basecoin.wallets().get({ id: uninitializedWallet });
      yield wallet.createAddress().should.be.rejectedWith('wallet pending on-chain initialization');
    })
  );

  it(
    'should create an XLM address for an initialized wallet',
    co(function* () {
      const wallet = yield basecoin.wallets().get({ id: initializedWallet });
      const addrObj = yield wallet.createAddress();
      addrObj.should.have.property('address');
      addrObj.should.have.property('wallet');
      addrObj.should.have.property('keychains');
    })
  );
});

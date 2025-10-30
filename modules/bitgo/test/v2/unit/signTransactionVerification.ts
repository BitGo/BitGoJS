import nock = require('nock');
import * as sinon from 'sinon';
import * as assert from 'assert';
import 'should';

import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo } from '@bitgo/sdk-test';
import { Tbtc } from '@bitgo/sdk-coin-btc';
import { common, BaseCoin, BitGoBase, Wallet, WalletSignTransactionOptions } from '@bitgo/sdk-core';

describe('Wallet signTransaction with verifyTxParams', function () {
  let wallet: Wallet;
  let basecoin: BaseCoin;
  let verifyTransactionStub: sinon.SinonStub;

  beforeEach(function () {
    const bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.initializeTestVars();
    bitgo.safeRegister('tbtc', Tbtc.createInstance);
    basecoin = bitgo.coin('tbtc');

    // Mock wallet data
    const walletData = {
      id: 'test-wallet-id',
      coin: 'tbtc',
      label: 'Test Wallet',
      m: 2,
      n: 3,
      keys: ['key1', 'key2', 'key3'],
      multisigType: 'onchain',
      type: 'hot',
      balance: 100000,
      balanceString: '100000',
      confirmedBalance: 100000,
      confirmedBalanceString: '100000',
      spendableBalance: 100000,
      spendableBalanceString: '100000',
    };

    wallet = new Wallet(bitgo as unknown as BitGoBase, basecoin as unknown as BaseCoin, walletData);

    // Create stubs for verification
    sinon.stub(basecoin, 'signTransaction').resolves({ txHex: 'mock-signed-tx-hex' });
    verifyTransactionStub = sinon.stub(basecoin, 'verifyTransaction');
  });

  afterEach(function () {
    sinon.restore();
    nock.cleanAll();
  });

  it('should fail verification when verifyTransaction throws an error', async function () {
    // Mock the verification function to throw an error (simulating verification failure)
    verifyTransactionStub.throws(new Error('Transaction verification failed'));

    const txPrebuild = {
      txHex: 'mock-tx-hex',
      walletId: 'test-wallet-id',
    };

    const verifyTxParams = {
      txParams: {
        recipients: [
          {
            address: 'test-address',
            amount: '10000',
          },
        ],
        type: 'send',
      },
    };

    const signParams: WalletSignTransactionOptions = {
      txPrebuild,
      verifyTxParams,
    };

    try {
      await wallet.signTransaction(signParams);
      assert.fail('Should have thrown verification error');
    } catch (error) {
      assert.ok(
        error.message.includes('Transaction verification failed'),
        `Error message should contain 'Transaction verification failed', got: ${error.message}`
      );
    }

    // Verify that the verification function was called with the expected parameters
    sinon.assert.calledOnce(verifyTransactionStub);
    const callArgs = verifyTransactionStub.getCall(0).args;
    const verifyParams = callArgs[0];
    assert.strictEqual(verifyParams.txPrebuild.txHex, 'mock-tx-hex');
    assert.deepStrictEqual(verifyParams.txParams, verifyTxParams.txParams);
  });

  it('should pass verification when verifyTransaction succeeds', async function () {
    // Mock the verification function to succeed (no error thrown)
    verifyTransactionStub.returns(true);

    // Mock key retrieval endpoints
    const bgUrl = common.Environments['mock'].uri;
    nock(bgUrl).get('/api/v2/tbtc/key/key1').reply(200, {
      id: 'key1',
      pub: 'pub',
      prv: 'prv',
    });

    nock(bgUrl).get('/api/v2/tbtc/key/key2').reply(200, {
      id: 'key2',
      pub: 'pub',
      prv: 'prv',
    });

    nock(bgUrl).get('/api/v2/tbtc/key/key3').reply(200, {
      id: 'key3',
      pub: 'pub',
    });

    const txPrebuild = {
      txHex: 'mock-tx-hex',
      walletId: 'test-wallet-id',
    };

    const verifyTxParams: WalletSignTransactionOptions['verifyTxParams'] = {
      txParams: {
        recipients: [
          {
            address: 'test-address',
            amount: '1000',
          },
        ],
        type: 'send',
      },
    };

    const signParams: WalletSignTransactionOptions = {
      txPrebuild,
      verifyTxParams,
      prv: 'prv',
    };

    const result = await wallet.signTransaction(signParams);

    // Verify the result
    result.should.have.property('txHex', 'mock-signed-tx-hex');

    // Verify that the verification function was called with the expected parameters
    sinon.assert.calledOnce(verifyTransactionStub);
    const callArgs = verifyTransactionStub.getCall(0).args;
    const verifyParams = callArgs[0];
    assert.strictEqual(verifyParams.txPrebuild.txHex, 'mock-tx-hex');
    assert.deepStrictEqual(verifyParams.txParams, verifyTxParams.txParams);
  });
});

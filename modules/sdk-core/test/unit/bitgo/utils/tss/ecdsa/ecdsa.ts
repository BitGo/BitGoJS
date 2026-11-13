import * as assert from 'assert';
import * as sinon from 'sinon';
import { CoinFeature } from '@bitgo/statics';
import {
  BitGoBase,
  EcdsaUtils,
  IBaseCoin,
  IRequestTracer,
  IWallet,
  TssSignTxRequestParamsWithPrv,
  TxRequest,
} from '../../../../../../src';
import { InvalidTransactionError } from '../../../../../../src/bitgo/errors';

/**
 * Regression tests for WCI-2239: the ECDSA MPCv1 signing path verified
 * serializedTxHex and signed signableHex without binding the two fields for
 * TSS_VERIFY_USE_SERIALIZED_TX_HEX coins (BSC/XDC). signRequestBase must call
 * baseCoin.assertSignableConsistency(serializedTxHex, signableHex) after
 * verifyTransaction, matching the MPCv2 path.
 */

const serializedTxHex = 'f86c808504a817c80082520894' + '00'.repeat(20) + '80808080';
const signableHex = 'f86c808504a817c80082520894' + '11'.repeat(20) + '80808080';

const unsignedTx = {
  derivationPath: 'm/0',
  serializedTxHex,
  signableHex,
};

const txRequest = {
  txRequestId: 'wci-2239-test',
  apiVersion: 'full',
  walletId: '62fe536a6b4cf70007acb48c0e7bb0b0',
  transactions: [
    {
      unsignedTx,
    },
  ],
} as unknown as TxRequest;

const params: TssSignTxRequestParamsWithPrv = {
  txRequest,
  txParams: { recipients: [{ address: '0x' + '00'.repeat(20), amount: '1000' }] },
  prv: JSON.stringify({ pShare: { i: 1 }, backupNShare: 'fake' }),
  reqId: { inc: sinon.stub(), toString: () => 'req' } as unknown as IRequestTracer,
};

function makeUtils(mockCoin: unknown): EcdsaUtils {
  const mockBg = {
    getEnv: sinon.stub().returns('test'),
    setRequestTracer: sinon.stub(),
  } as unknown as BitGoBase;
  const mockWallet = {
    id: sinon.stub().returns('62fe536a6b4cf70007acb48c0e7bb0b0'),
    multisigType: sinon.stub().returns('tss'),
    coinSpecific: sinon.stub().returns({}),
  } as unknown as IWallet;
  return new EcdsaUtils(mockBg, mockCoin as IBaseCoin, mockWallet);
}

describe('EcdsaUtils.signRequestBase - signableHex consistency (WCI-2239)', function () {
  afterEach(function () {
    sinon.restore();
  });

  it('calls assertSignableConsistency with (serializedTxHex, signableHex) for TSS_VERIFY_USE_SERIALIZED_TX_HEX coins', async function () {
    const consistencySpy = sinon.spy();
    const mockCoin = {
      getConfig: sinon.stub().returns({ features: [CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX] }),
      verifyTransaction: sinon.stub().resolves(),
      assertSignableConsistency: consistencySpy,
      getChain: sinon.stub().returns('tbsc'),
    };
    const utils = makeUtils(mockCoin);
    sinon.stub(utils, 'getOfflineSignerPaillierModulus').throws(new Error('SENTINEL_PAST_CONSISTENCY'));

    await assert.rejects(utils.signTxRequest(params), /SENTINEL_PAST_CONSISTENCY/);

    assert.strictEqual(consistencySpy.callCount, 1);
    assert.deepStrictEqual(consistencySpy.firstCall.args, [unsignedTx.serializedTxHex, unsignedTx.signableHex]);
  });

  it('aborts before any share production when assertSignableConsistency throws', async function () {
    const mockCoin = {
      getConfig: sinon.stub().returns({ features: [CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX] }),
      verifyTransaction: sinon.stub().resolves(),
      assertSignableConsistency: sinon
        .stub()
        .throws(
          new InvalidTransactionError('signableHex is inconsistent with serializedTxHex: possible server tampering')
        ),
      getChain: sinon.stub().returns('tbsc'),
    };
    const utils = makeUtils(mockCoin);
    const paillierSpy = sinon.spy(utils, 'getOfflineSignerPaillierModulus');

    await assert.rejects(utils.signTxRequest(params), /possible server tampering/);

    assert.strictEqual(paillierSpy.callCount, 0);
  });

  it('skips the check for coins without the TSS_VERIFY_USE_SERIALIZED_TX_HEX feature', async function () {
    const consistencySpy = sinon.spy();
    const verifyTransactionStub = sinon.stub().resolves();
    const mockCoin = {
      getConfig: sinon.stub().returns({ family: 'eth' }),
      verifyTransaction: verifyTransactionStub,
      assertSignableConsistency: consistencySpy,
      getChain: sinon.stub().returns('teth'),
    };
    const utils = makeUtils(mockCoin);
    sinon.stub(utils, 'getOfflineSignerPaillierModulus').throws(new Error('SENTINEL_PAST_CONSISTENCY'));

    await assert.rejects(utils.signTxRequest(params), /SENTINEL_PAST_CONSISTENCY/);

    assert.strictEqual(consistencySpy.callCount, 0);
    assert.strictEqual(verifyTransactionStub.firstCall.args[0].txPrebuild.txHex, signableHex);
  });

  it('does not crash for flag coins without assertSignableConsistency (ICP shape)', async function () {
    const mockCoin = {
      getConfig: sinon.stub().returns({ features: [CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX] }),
      verifyTransaction: sinon.stub().resolves(),
      getChain: sinon.stub().returns('ticp'),
    };
    const utils = makeUtils(mockCoin);
    sinon.stub(utils, 'getOfflineSignerPaillierModulus').throws(new Error('SENTINEL_PAST_CONSISTENCY'));

    await assert.rejects(utils.signTxRequest(params), /SENTINEL_PAST_CONSISTENCY/);
  });
});

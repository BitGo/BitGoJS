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

  it('routes to serializedTxHex and calls assertSignableConsistency when coin envelope check returns true (CECHO-2681)', async function () {
    const verifyTransactionStub = sinon.stub().resolves();
    const consistencySpy = sinon.spy();
    const mockCoin = {
      getConfig: sinon.stub().returns({ features: [CoinFeature.EIP1559] }),
      shouldVerifyWithSerializedTxHex: sinon.stub().returns(true),
      verifyTransaction: verifyTransactionStub,
      assertSignableConsistency: consistencySpy,
      getChain: sinon.stub().returns('hteth'),
    };
    const utils = makeUtils(mockCoin);
    sinon.stub(utils, 'getOfflineSignerPaillierModulus').throws(new Error('SENTINEL_PAST_CONSISTENCY'));

    await assert.rejects(utils.signTxRequest(params), /SENTINEL_PAST_CONSISTENCY/);

    assert.strictEqual(verifyTransactionStub.callCount, 1);
    assert.strictEqual(verifyTransactionStub.firstCall.args[0].txPrebuild.txHex, serializedTxHex);
    assert.strictEqual(verifyTransactionStub.firstCall.args[0].txPrebuild.txInfo, signableHex);
    assert.strictEqual(consistencySpy.callCount, 1);
    assert.deepStrictEqual(consistencySpy.firstCall.args, [serializedTxHex, signableHex]);
  });

  it('fails closed before signing when serializedTxHex is missing on the serialized route (CECHO-2681)', async function () {
    const verifyTransactionStub = sinon.stub().resolves();
    const consistencySpy = sinon.spy();
    const mockCoin = {
      getConfig: sinon.stub().returns({ features: [CoinFeature.EIP1559] }),
      shouldVerifyWithSerializedTxHex: sinon.stub().returns(true),
      verifyTransaction: verifyTransactionStub,
      assertSignableConsistency: consistencySpy,
      getChain: sinon.stub().returns('hteth'),
    };
    const utils = makeUtils(mockCoin);
    const paillierSpy = sinon.spy(utils, 'getOfflineSignerPaillierModulus');

    for (const missingHex of ['', '   ', undefined]) {
      const missingTxRequest = {
        ...txRequest,
        transactions: [{ unsignedTx: { derivationPath: 'm/0', serializedTxHex: missingHex, signableHex } }],
      } as unknown as TxRequest;
      await assert.rejects(
        utils.signTxRequest({ ...params, txRequest: missingTxRequest }),
        /Missing serializedTxHex for transaction requiring serialized verification/
      );
    }

    assert.strictEqual(verifyTransactionStub.callCount, 0);
    assert.strictEqual(consistencySpy.callCount, 0);
    assert.strictEqual(paillierSpy.callCount, 0);
  });

  it('fails closed when a pre-hashed-route coin request is missing serializedTxHex (CECHO-2681)', async function () {
    const verifyTransactionStub = sinon.stub().resolves();
    const mockCoin = {
      getConfig: sinon.stub().returns({ features: [CoinFeature.EIP1559] }),
      isSignablePreHashed: (u: { serializedTxHex?: string }) => u.serializedTxHex?.startsWith('0000') ?? false,
      verifyTransaction: verifyTransactionStub,
      getChain: sinon.stub().returns('flr'),
    };
    const utils = makeUtils(mockCoin);
    const paillierSpy = sinon.spy(utils, 'getOfflineSignerPaillierModulus');

    for (const missingHex of ['', '   ', undefined]) {
      const missingTxRequest = {
        ...txRequest,
        transactions: [{ unsignedTx: { derivationPath: 'm/0', serializedTxHex: missingHex, signableHex } }],
      } as unknown as TxRequest;
      await assert.rejects(
        utils.signTxRequest({ ...params, txRequest: missingTxRequest }),
        /Missing serializedTxHex for transaction requiring serialized verification/
      );
    }

    assert.strictEqual(verifyTransactionStub.callCount, 0);
    assert.strictEqual(paillierSpy.callCount, 0);
  });

  it('rejects a pre-hashed signable before verification because MPCv1 always hashes signableHex', async function () {
    const preHashedHex = '000000000001' + 'aa'.repeat(30);
    const preHashedSignable = 'bb'.repeat(32);
    const verifyTransactionStub = sinon.stub().resolves();
    const mockCoin = {
      getConfig: sinon.stub().returns({ features: [CoinFeature.EIP1559] }),
      isSignablePreHashed: (u: { serializedTxHex?: string }) => u.serializedTxHex?.startsWith('0000') ?? false,
      verifyTransaction: verifyTransactionStub,
      getChain: sinon.stub().returns('flr'),
    };
    const utils = makeUtils(mockCoin);
    const paillierSpy = sinon.spy(utils, 'getOfflineSignerPaillierModulus');

    const preHashedTxRequest = {
      ...txRequest,
      transactions: [
        { unsignedTx: { derivationPath: 'm/0', serializedTxHex: preHashedHex, signableHex: preHashedSignable } },
      ],
    } as unknown as TxRequest;

    await assert.rejects(
      utils.signTxRequest({ ...params, txRequest: preHashedTxRequest }),
      /Pre-hashed signable is not supported by ECDSA MPCv1 signing/
    );

    assert.strictEqual(verifyTransactionStub.callCount, 0);
    assert.strictEqual(paillierSpy.callCount, 0);
  });

  it('keeps a non-pre-hashed request from a pre-hashed-route coin on the normal route', async function () {
    const verifyTransactionStub = sinon.stub().resolves();
    const mockCoin = {
      getConfig: sinon.stub().returns({ features: [CoinFeature.EIP1559] }),
      shouldVerifyWithSerializedTxHex: sinon.stub().returns(true),
      isSignablePreHashed: (u: { serializedTxHex?: string }) => u.serializedTxHex?.startsWith('0000') ?? false,
      verifyTransaction: verifyTransactionStub,
      assertSignableConsistency: sinon.spy(),
      getChain: sinon.stub().returns('flr'),
    };
    const utils = makeUtils(mockCoin);
    sinon.stub(utils, 'getOfflineSignerPaillierModulus').throws(new Error('SENTINEL_PAST_CONSISTENCY'));

    await assert.rejects(utils.signTxRequest(params), /SENTINEL_PAST_CONSISTENCY/);

    assert.strictEqual(verifyTransactionStub.callCount, 1);
    assert.strictEqual(verifyTransactionStub.firstCall.args[0].txPrebuild.txHex, serializedTxHex);
  });

  it('propagates coin-hook rejection of an unsupported legacy envelope before verification', async function () {
    const verifyTransactionStub = sinon.stub().resolves();
    const mockCoin = {
      getConfig: sinon.stub().returns({ features: [CoinFeature.EIP1559] }),
      shouldVerifyWithSerializedTxHex: sinon
        .stub()
        .throws(new InvalidTransactionError('Unsupported legacy type-0 signing preimage: pre-EIP-155')),
      verifyTransaction: verifyTransactionStub,
      getChain: sinon.stub().returns('hteth'),
    };
    const utils = makeUtils(mockCoin);
    const paillierSpy = sinon.spy(utils, 'getOfflineSignerPaillierModulus');

    await assert.rejects(utils.signTxRequest(params), /Unsupported legacy type-0 signing preimage: pre-EIP-155/);

    assert.strictEqual(verifyTransactionStub.callCount, 0);
    assert.strictEqual(paillierSpy.callCount, 0);
  });
});

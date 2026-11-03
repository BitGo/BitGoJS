import * as assert from 'assert';
import * as sinon from 'sinon';
import {
  BitGoBase,
  EcdsaUtils,
  IBaseCoin,
  IRequestTracer,
  IWallet,
  TssSignTxRequestParamsWithPrv,
  TxRequest,
} from '../../../../../../src';

/**
 * CECHO-2460: the EVM TSS verifier must receive both the caller's own txParams and the stored
 * tx request intent. `txParams` is the post-`resolveEffectiveTxParams` object (the stored intent
 * is back-filled into it), so it cannot tell the verifier whether the caller declared anything;
 * `callerTxParams` is the untouched caller input that decides which source is authoritative.
 *
 * This pins the ECDSA (MPCv1) wiring. EcdsaMPCv2Utils has the equivalent test in ecdsaMPCv2.ts.
 */
describe('EcdsaUtils signing verifyTransaction wiring', function () {
  const walletID = '62fe536a6b4cf70007acb48c0e7bb0b0';
  const derivationPath = 'm/0';
  const signableHex = 'f86c808504a817c80082520894' + '00'.repeat(20) + '80808080';

  const makeTxRequest = (intent: Record<string, unknown>): TxRequest =>
    ({
      txRequestId: 'ecdsa-wiring',
      apiVersion: 'full',
      walletId: walletID,
      intent,
      transactions: [
        {
          unsignedTx: { derivationPath, signableHex, serializedTxHex: signableHex },
          signatureShares: [],
        },
      ],
    } as unknown as TxRequest);

  // Minimal signing material: signRequestBase only needs pShare.i === 1, a backupNShare and
  // the paillier modulus before it hands the unsigned bytes to verifyTransaction.
  const prv = JSON.stringify({ pShare: { i: 1, n: 'paillier-modulus' }, backupNShare: {} });

  let verifyTransactionStub: sinon.SinonStub;

  const signWith = async (txParams: TssSignTxRequestParamsWithPrv['txParams'], intent: Record<string, unknown>) => {
    const mockBitgo = {
      getEnv: sinon.stub().returns('test'),
      setRequestTracer: sinon.stub(),
    } as unknown as BitGoBase;
    const mockCoin = {
      verifyTransaction: verifyTransactionStub,
      getConfig: sinon.stub().returns({}),
      getChain: sinon.stub().returns('hteth'),
    } as unknown as IBaseCoin;
    const mockWallet = {
      id: sinon.stub().returns(walletID),
      multisigType: sinon.stub().returns('tss'),
      coinSpecific: sinon.stub().returns(undefined),
    };

    const utils = new EcdsaUtils(mockBitgo, mockCoin, mockWallet as unknown as IWallet);
    // Stop right after the verifier: the TSS networking that follows is covered elsewhere.
    sinon.stub(utils, 'getEcdsaSigningChallenges').rejects(new Error('stop-after-verify'));

    try {
      await utils.signTxRequest({
        txRequest: makeTxRequest(intent),
        txParams,
        prv,
        reqId: { inc: sinon.stub(), toString: sinon.stub().returns('test-req') } as unknown as IRequestTracer,
      });
    } catch (e) {
      assert.match((e as Error).message, /stop-after-verify/);
    }

    assert.strictEqual(verifyTransactionStub.callCount, 1, 'verifyTransaction must be reached exactly once');
    return verifyTransactionStub.firstCall.args[0] as {
      txParams: { type?: string; recipients?: unknown[] };
      intent?: Record<string, unknown>;
      callerTxParams?: unknown;
    };
  };

  beforeEach(function () {
    verifyTransactionStub = sinon.stub().resolves(true);
  });

  afterEach(function () {
    sinon.restore();
  });

  it('passes the caller txParams and the stored intent to the verifier on a direct send', async function () {
    const callerTxParams = {
      type: 'transfer',
      recipients: [{ address: '0x' + '11'.repeat(20), amount: '1000' }],
    };
    const intent = {
      intentType: 'payment',
      recipients: [{ address: { address: '0x' + '11'.repeat(20) }, amount: { value: '1000', symbol: 'hteth' } }],
    };

    const verifyArgs = await signWith(callerTxParams, intent);

    assert.strictEqual(verifyArgs.intent, intent, 'stored intent must reach verifyTransaction');
    assert.deepStrictEqual(
      verifyArgs.callerTxParams,
      callerTxParams,
      'the untouched caller input must reach the verifier'
    );
    assert.strictEqual(verifyArgs.txParams.type, 'transfer');
    assert.deepStrictEqual(verifyArgs.txParams.recipients, callerTxParams.recipients);
  });

  it('passes callerTxParams as undefined on the pending-approval path', async function () {
    const intent = {
      intentType: 'payment',
      recipients: [{ address: { address: '0x' + '22'.repeat(20) }, amount: { value: '1000', symbol: 'hteth' } }],
    };

    const verifyArgs = await signWith(undefined, intent);

    assert.strictEqual(verifyArgs.intent, intent, 'stored intent must reach verifyTransaction');
    assert.strictEqual(
      verifyArgs.callerTxParams,
      undefined,
      'the pending-approval path supplies no caller params; the stored intent speaks'
    );
    assert.strictEqual(verifyArgs.txParams.type, 'payment');
    assert.strictEqual(verifyArgs.txParams.recipients?.length, 1, 'stored recipients are back-filled');
  });
});

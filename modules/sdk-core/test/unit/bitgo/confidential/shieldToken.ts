/**
 * @prettier
 */
import sinon from 'sinon';
import assert from 'assert';
import 'should';
import { ConfidentialToken, Wallet } from '../../../../src';

describe('ConfidentialToken.shieldToken', function () {
  let wallet: Wallet;
  let confidential: ConfidentialToken;
  let mockBitGo: any;
  let mockBaseCoin: any;

  function mockRequest(result: any) {
    return {
      send: sinon.stub().returnsThis(),
      set: sinon.stub().returnsThis(),
      query: sinon.stub().returnsThis(),
      result: sinon.stub().resolves(result),
    };
  }

  beforeEach(function () {
    mockBitGo = {
      post: sinon.stub(),
      get: sinon.stub(),
      del: sinon.stub(),
      url: sinon.stub().callsFake((path: string, version = 2) => `https://bitgo.com/api/v${version}${path}`),
      microservicesUrl: sinon.stub().callsFake((path: string) => `https://bitgo.com${path}`),
      setRequestTracer: sinon.stub(),
    };

    mockBaseCoin = {
      getFamily: sinon.stub().returns('eth'),
      getChain: sinon.stub().returns('hteth'),
      url: sinon.stub().callsFake((path: string) => `https://bitgo.com/api/v2/hteth${path}`),
      keychains: sinon.stub(),
      supportsTss: sinon.stub().returns(true),
      getMPCAlgorithm: sinon.stub(),
    };

    const mockWalletData = {
      id: 'test-wallet-id',
      coin: 'hteth',
      keys: ['user-key', 'backup-key', 'bitgo-key'],
      enterprise: 'test-enterprise-id',
      multisigType: 'tss',
    };

    wallet = new Wallet(mockBitGo, mockBaseCoin, mockWalletData);
    confidential = new ConfidentialToken(wallet);
  });

  afterEach(function () {
    sinon.restore();
  });

  it('should reject missing tokenName', async function () {
    await assert.rejects(() => confidential.shieldToken({ tokenName: '', amount: '1000' }), {
      message: 'tokenName is required',
    });
  });

  it('should reject missing amount', async function () {
    await assert.rejects(() => confidential.shieldToken({ tokenName: 'hteth:cusdt', amount: '' }), {
      message: 'amount is required',
    });
  });

  it('should reject non-positive amount', async function () {
    await assert.rejects(() => confidential.shieldToken({ tokenName: 'hteth:cusdt', amount: '0' }), {
      message: /amount must be a positive integer string/,
    });
  });

  it('should create wrapApprove, poll journey, and sign WP-created wrap', async function () {
    const wrapLinkId = 'wrap-link-1';
    const wrapApproveTxRequestId = 'txreq-approve-1';
    const wrapTxRequestId = 'txreq-wrap-1';

    const wrapApproveResult = {
      txRequest: {
        txRequestId: wrapApproveTxRequestId,
        transactions: [
          {
            unsignedTx: {
              coinSpecific: { wrapLinkId },
            },
          },
        ],
      },
      transfer: { state: 'confirmed' },
    };

    const sendManyStub = sinon.stub(wallet, 'sendMany').resolves(wrapApproveResult);

    const journeyReq = mockRequest({
      wrapLinkId,
      status: 'WRAP',
      wrapApproveTxRequestId,
      wrapTxRequestId,
    });
    mockBitGo.get.returns(journeyReq);

    const wrapResult = { txRequestId: wrapTxRequestId };
    const signAndSendStub = sinon.stub(wallet, 'signAndSendTxRequest').resolves(wrapResult as any);

    const result = await confidential.shieldToken({
      tokenName: 'hteth:cusdt',
      amount: '1000000',
      walletPassphrase: 'secret',
      pollIntervalMs: 1,
      pollTimeoutMs: 1000,
    });

    sendManyStub.calledOnce.should.be.true();
    const sendManyArgs = sendManyStub.firstCall.args[0]!;
    sendManyArgs.type!.should.equal('wrapApprove');
    sendManyArgs.shieldParams!.should.deepEqual({ tokenName: 'hteth:cusdt', amount: '1000000' });
    sendManyArgs.walletPassphrase!.should.equal('secret');

    signAndSendStub.calledOnce.should.be.true();
    signAndSendStub.firstCall.args[0].should.deepEqual({
      txRequestId: wrapTxRequestId,
      walletPassphrase: 'secret',
      isTxRequestFull: true,
    });

    result.should.deepEqual({
      wrapLinkId,
      wrapApproveTxRequestId,
      wrapTxRequestId,
      raw: {
        wrapApproveResult,
        wrapResult,
      },
    });
  });

  it('should return pendingApproval without polling wrap for custodial path', async function () {
    sinon.stub(wallet, 'sendMany').resolves({
      pendingApproval: { id: 'pa-1', state: 'awaitingSignature' },
      txRequest: {
        txRequestId: 'txreq-approve-1',
        transactions: [{ unsignedTx: { coinSpecific: { wrapLinkId: 'wrap-link-1' } } }],
      },
    });
    const signAndSendStub = sinon.stub(wallet, 'signAndSendTxRequest');

    const result = await confidential.shieldToken({
      tokenName: 'hteth:cusdt',
      amount: '1000000',
    });

    result.wrapLinkId.should.equal('wrap-link-1');
    result.pendingApprovalId!.should.equal('pa-1');
    assert.strictEqual(result.wrapTxRequestId, undefined);
    signAndSendStub.called.should.be.false();
  });

  it('should be exposed as wallet.shieldToken', async function () {
    const stub = sinon.stub(ConfidentialToken.prototype, 'shieldToken').resolves({
      wrapLinkId: 'w',
      wrapApproveTxRequestId: 'a',
    });
    await wallet.shieldToken({ tokenName: 'hteth:cusdt', amount: '1' });
    stub.calledOnce.should.be.true();
  });
});

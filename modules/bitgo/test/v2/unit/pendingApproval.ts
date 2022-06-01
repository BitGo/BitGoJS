/**
 * @prettier
 */
import 'should';
import * as nock from 'nock';
import * as sinon from 'sinon';

import { TestBitGo } from '../../lib/test_bitgo';

import {
  BaseCoin,
  Environments,
  PendingApproval,
  PendingApprovalData,
  RequestTracer,
  SignatureShareType,
  State,
  TssUtils,
  Type,
  Wallet,
} from '@bitgo/sdk-core';

describe('Pending Approvals:', () => {
  let sandbox: sinon.SinonSandbox;
  let bitgo: typeof TestBitGo;
  let basecoin: BaseCoin;
  let wallet: Wallet;
  let bgUrl: string;

  const coin = 'tbtc';
  const walletId = 'wallet_id';

  const pendingApprovalData: PendingApprovalData = {
    id: 'pa0',
    info: {
      type: Type.TRANSACTION_REQUEST,
      transactionRequest: {
        coinSpecific: {
          [coin]: {},
        },
        recipients: [],
        buildParams: {
          type: 'consolidate',
        },
        sourceWallet: walletId,
      },
    },
    state: State.PENDING,
    creator: 'test',
  };
  const walletData = {
    id: walletId,
    coin,
    pendingApprovals: [pendingApprovalData],
  };

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  before(async () => {
    nock.disableNetConnect();
    // create wallet
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin(coin);

    wallet = new Wallet(bitgo, basecoin, walletData);
    bgUrl = Environments[bitgo.getEnv()].uri;
    (pendingApprovalData as any).wallet = wallet;
  });

  it('should call consolidate instead of build when rebuilding consolidation pending approvals', async () => {
    const scope = nock(bgUrl).post(`/api/v2/${coin}/wallet/${walletId}/consolidateUnspents`).reply(200);
    const pendingApprovals = wallet.pendingApprovals();
    pendingApprovals.should.have.length(1);
    const pendingApproval = pendingApprovals[0];

    // approval will fail when attempting to resign. This is ok - we just want to make sure
    // the consolidateUnspents endpoint was called already before failing
    await pendingApproval.approve({ xprv: 'nonsense' }).should.be.rejected();

    scope.done();
  });

  it('should call approve and do the TSS flow and fail if the txRequestId is missing', async () => {
    const pendingApproval = wallet.pendingApprovals()[0];
    const reqId = new RequestTracer();
    const params = { walletPassphrase: 'test' };
    await pendingApproval.recreateAndSignTSSTransaction(params, reqId).should.be.rejectedWith('txRequestId not found');
  });

  it('should call approve and do the TSS flow and fail if the walletPassphrase is missing', async () => {
    const pendingApproval = wallet.pendingApprovals()[0];
    pendingApprovalData['txRequestId'] = 'requestTxIdTest';
    const reqId = new RequestTracer();
    const params = {};
    await pendingApproval
      .recreateAndSignTSSTransaction(params, reqId)
      .should.be.rejectedWith('walletPassphrase not found');
  });

  it('should call approve and do the TSS flow and fail if the wallet is missing', async () => {
    const pendingApproval = new PendingApproval(bitgo, basecoin, pendingApprovalData);
    const reqId = new RequestTracer();
    const params = { walletPassphrase: 'test' };
    await pendingApproval.recreateAndSignTSSTransaction(params, reqId).should.be.rejectedWith('Wallet not found');
  });

  it('should call approve and do the TSS flow and success', async () => {
    pendingApprovalData['txRequestId'] = 'requestTxIdTest';
    const pendingApproval = new PendingApproval(bitgo, basecoin, pendingApprovalData, wallet);
    const reqId = new RequestTracer();
    const txRequestId = 'test';
    const walletPassphrase = 'test';
    const decryptedPrvResponse = 'decryptedPrv';
    const params = { txRequestId, walletPassphrase };
    const txRequest = {
      txRequestId: txRequestId,
      unsignedTxs: [{ signableHex: 'randomhex', serializedTxHex: 'randomhex2', derivationPath: 'm/0' }],
      signatureShares: [
        {
          from: SignatureShareType.BITGO,
          to: SignatureShareType.USER,
          share: '9d7159a76700635TEST',
        },
      ],
    };

    const decryptedPrv = sandbox.stub(Wallet.prototype, 'getPrv');
    decryptedPrv.calledOnceWithExactly({ walletPassphrase });
    decryptedPrv.resolves(decryptedPrvResponse);

    const recreateTxRequest = sandbox.stub(TssUtils.prototype, 'recreateTxRequest');
    recreateTxRequest.calledOnceWithExactly(txRequest.txRequestId, decryptedPrvResponse, reqId);
    recreateTxRequest.resolves(txRequest);

    const recreatedTx = await pendingApproval.recreateAndSignTSSTransaction(params, reqId);
    recreatedTx.should.be.deepEqual({ txHex: txRequest.unsignedTxs[0].serializedTxHex });

    sandbox.verify();
  });
});

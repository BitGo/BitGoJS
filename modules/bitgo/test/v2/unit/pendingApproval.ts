/**
 * @prettier
 */
import 'should';
import * as nock from 'nock';
import * as sinon from 'sinon';
import { TestableBG, TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../src';

import {
  BaseCoin,
  ECDSAUtils,
  EddsaUtils,
  Environments,
  PendingApproval,
  PendingApprovalData,
  PendingApprovalInfo,
  RequestTracer,
  SignatureShareType,
  State,
  TssUtils,
  TxRequest,
  Type,
  Wallet,
} from '@bitgo/sdk-core';

describe('Pending Approvals:', () => {
  let sandbox: sinon.SinonSandbox;
  let bitgo: TestableBG & BitGo;
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
    nock.disableNetConnect();
  });

  afterEach(function () {
    sandbox.restore();
  });

  before(async () => {
    // create wallet
    bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin(coin);

    wallet = new Wallet(bitgo, basecoin, walletData);
    bgUrl = Environments[bitgo.getEnv()].uri;
    (pendingApprovalData as any).wallet = wallet;
  });

  ['tsol', 'teth', 'tbtc'].forEach((coinName) => {
    it(`should use correct tssUtils for  ${coinName}`, () => {
      const coin = bitgo.coin(coinName);
      const pendingAproval = new PendingApproval(bitgo, coin, {} as unknown as PendingApprovalData);
      if (coin.supportsTss()) {
        if (coin.getMPCAlgorithm() === 'ecdsa') {
          pendingAproval['tssUtils'].should.be.instanceOf(ECDSAUtils.EcdsaUtils);
        } else if (coin.getMPCAlgorithm() === 'eddsa') {
          pendingAproval['tssUtils'].should.be.instanceOf(EddsaUtils);
        }
      } else {
        (pendingAproval['tssUtils'] === undefined).should.be.true();
      }
    });
  });

  ['MPCv2', undefined].forEach((multisigTypeVersion) => {
    it(`should use correct tssUtils for multisigTypeVersion: ${multisigTypeVersion}`, () => {
      const coin = bitgo.coin('hteth');
      const walletDataMpcV2 = {
        ...walletData,
        multisigTypeVersion: multisigTypeVersion,
      };
      const walletMPCv2 = new Wallet(bitgo, basecoin, walletDataMpcV2);

      const pendingAproval = new PendingApproval(bitgo, coin, {} as unknown as PendingApprovalData, walletMPCv2);
      if (walletMPCv2.multisigTypeVersion() === 'MPCv2') {
        pendingAproval['tssUtils'].should.be.instanceOf(ECDSAUtils.EcdsaMPCv2Utils);
      } else {
        pendingAproval['tssUtils'].should.be.instanceOf(ECDSAUtils.EcdsaUtils);
      }
    });
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

  it('should approve for transactionRequestLite if we cannot recreate transaction', async () => {
    const pendingApprovalData2 = { ...pendingApprovalData, txRequestId: '1234-4567-6789' };
    const pendingApproval = new PendingApproval(bitgo, basecoin, pendingApprovalData2, wallet);

    const paScope = nock(bgUrl)
      .put(`/api/v2/${coin}/pendingapprovals/${pendingApprovalData.id}`, {
        state: 'approved',
        otp: undefined,
      })
      .reply(200, {
        ...pendingApprovalData2,
        state: 'approved',
      });
    const recreateTransactionTssStub = sandbox.stub(PendingApproval.prototype, 'recreateAndSignTSSTransaction');
    const recreateTransactionStub = sandbox.stub(PendingApproval.prototype, 'recreateAndSignTransaction');

    pendingApproval.type().should.equal(Type.TRANSACTION_REQUEST);
    await pendingApproval.approve({});
    recreateTransactionTssStub.notCalled.should.be.true();
    recreateTransactionStub.notCalled.should.be.true();

    paScope.isDone().should.be.true();
  });

  function testRecreateTransaction(coinName: string, recreateTransaction: boolean, type: Type) {
    it(`[${coinName}] should ${
      recreateTransaction ? 'not ' : ''
    }recreate the transaction during approving a pending approval if there are no recipients for PA type ${type}`, async () => {
      const coin = bitgo.coin(coinName);
      const txRequestId = coin.supportsTss() ? 'requestTxIdTest' : undefined;
      const pendingApprovalInfo =
        type === 'transactionRequest'
          ? {
              type,
              transactionRequest: {
                coinSpecific: {
                  [coinName]: { txHex: 'gabagool' },
                },
                recipients: [],
                buildParams: {},
                sourceWallet: walletId,
              },
            }
          : ({ type } as unknown as PendingApprovalInfo);
      const pendingApprovalDataTemp: PendingApprovalData = {
        id: 'pa0',
        info: pendingApprovalInfo,
        wallet: walletId,
        state: State.PENDING,
        creator: 'test',
        txRequestId,
      };

      const walletDataTemp = {
        id: walletId,
        coinName,
        pendingApprovals: [pendingApprovalDataTemp],
      };
      const walletTemp = new Wallet(bitgo, coin, walletDataTemp);
      pendingApprovalDataTemp.wallet = walletTemp.id();

      const pendingApprovals = walletTemp.pendingApprovals();
      pendingApprovals.should.have.length(1);
      const pendingApproval = pendingApprovals[0];

      let stub: sinon.SinonStub;
      if (coin.supportsTss()) {
        stub = sandbox.stub(PendingApproval.prototype, 'recreateAndSignTSSTransaction').resolves({
          txHex: 'gabagool',
        });
      } else {
        stub = sandbox.stub(PendingApproval.prototype, 'recreateAndSignTransaction').resolves({
          state: 'approved',
          halfSigned: { txHex: 'gabagool' },
        });
      }

      const paScope = nock(bgUrl)
        .put(`/api/v2/${coinName}/pendingapprovals/${pendingApprovalDataTemp.id}`, {
          state: 'approved',
          halfSigned: type === Type.TRANSACTION_REQUEST ? { txHex: 'gabagool' } : undefined,
        })
        .reply(200, {
          ...pendingApprovalDataTemp,
          state: 'approved',
        });

      await pendingApproval.approve({ xprv: 'nonsense', walletPassphrase: 'gabagoolio' });

      // Should not call build and should call pa
      paScope.isDone().should.be.true();
      stub.calledOnce.should.equal(recreateTransaction);
    });
  }

  testRecreateTransaction('tbtc', false, Type.TRANSACTION_REQUEST);
  testRecreateTransaction('tsol', true, Type.TRANSACTION_REQUEST);
  testRecreateTransaction('tsol', true, Type.TRANSACTION_REQUEST_FULL);
  testRecreateTransaction('teth', true, Type.TRANSACTION_REQUEST_FULL);

  describe('recreateAndSignTSSTransaction', function () {
    let coin: BaseCoin;

    before(() => {
      coin = bitgo.coin('tsol');
    });

    it('should call approve and do the TSS flow and fail if the txRequestId is missing', async () => {
      const pendingApproval = wallet.pendingApprovals()[0];
      const reqId = new RequestTracer();
      const params = { walletPassphrase: 'test' };
      await pendingApproval
        .recreateAndSignTSSTransaction(params, reqId)
        .should.be.rejectedWith('txRequestId not found');
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
      const pendingApproval = new PendingApproval(bitgo, coin, pendingApprovalData);
      const reqId = new RequestTracer();
      const params = { walletPassphrase: 'test' };
      await pendingApproval.recreateAndSignTSSTransaction(params, reqId).should.be.rejectedWith('Wallet not found');
    });

    it('should get txHex for transactionRequestLite', async () => {
      pendingApprovalData['txRequestId'] = 'requestTxIdTest';
      const pendingApproval = new PendingApproval(bitgo, coin, pendingApprovalData, wallet);
      const reqId = new RequestTracer();
      const txRequestId = 'test';
      const walletPassphrase = 'test';
      const decryptedPrvResponse = 'decryptedPrv';
      const params = { txRequestId, walletPassphrase };
      const txRequest: TxRequest = {
        apiVersion: 'lite',
        txRequestId: txRequestId,
        unsignedTxs: [{ signableHex: 'randomhex', serializedTxHex: 'randomhex2', derivationPath: 'm/0' }],
        signatureShares: [
          {
            from: SignatureShareType.BITGO,
            to: SignatureShareType.USER,
            share: '9d7159a76700635TEST',
          },
        ],
        transactions: [],
        userId: 'userId',
        date: new Date().toISOString(),
        intent: {
          intentType: 'payment',
        },
        latest: true,
        walletId: 'walletId',
        version: 1,
        policiesChecked: false,
        walletType: 'hot',
        state: 'pendingUserSignature',
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

    it('should get txHex for transactionRequestFull ', async () => {
      pendingApprovalData['txRequestId'] = 'requestTxIdTest';
      const pendingApproval = new PendingApproval(bitgo, coin, pendingApprovalData, wallet);
      const reqId = new RequestTracer();
      const txRequestId = 'test';
      const walletPassphrase = 'test';
      const decryptedPrvResponse = 'decryptedPrv';
      const params = { txRequestId, walletPassphrase };
      const txRequest: TxRequest = {
        txRequestId: txRequestId,
        apiVersion: 'full',
        unsignedTxs: [],
        transactions: [
          {
            unsignedTx: { signableHex: 'randomhex', serializedTxHex: 'randomhex2', derivationPath: 'm/0' },
            signatureShares: [
              {
                from: SignatureShareType.BITGO,
                to: SignatureShareType.USER,
                share: '9d7159a76700635TEST',
              },
            ],
            state: 'initialized',
          },
        ],
        userId: 'userId',
        date: new Date().toISOString(),
        intent: {
          intentType: 'payment',
        },
        latest: true,
        walletId: 'walletId',
        version: 1,
        policiesChecked: false,
        walletType: 'hot',
        state: 'pendingDelivery',
      };

      const decryptedPrv = sandbox.stub(Wallet.prototype, 'getPrv');
      decryptedPrv.calledOnceWithExactly({ walletPassphrase });
      decryptedPrv.resolves(decryptedPrvResponse);

      const recreateTxRequest = sandbox.stub(TssUtils.prototype, 'recreateTxRequest');
      recreateTxRequest.calledOnceWithExactly(txRequest.txRequestId, decryptedPrvResponse, reqId);
      recreateTxRequest.resolves(txRequest);

      const recreatedTx = await pendingApproval.recreateAndSignTSSTransaction(params, reqId);
      recreatedTx.should.be.deepEqual({ txHex: txRequest.transactions![0].unsignedTx.serializedTxHex });

      sandbox.verify();
    });
  });
});

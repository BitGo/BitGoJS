/**
 * @prettier
 */
import should = require('should');
import nock = require('nock');
import * as sinon from 'sinon';
import { TestableBG, TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../src';
import * as ethAbi from 'ethereumjs-abi';
import { coins as staticsCoins } from '@bitgo/statics';

import {
  BaseCoin,
  ECDSAUtils,
  EddsaUtils,
  Environments,
  Keychains,
  PendingApproval,
  PendingApprovalData,
  PendingApprovalInfo,
  RequestTracer,
  SignatureShareType,
  SignedTransaction,
  State,
  TransactionType,
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
  const attestation = {
    signature: 'signature',
    credentialId: 'credential-id',
    clientDataJSON: 'client-data-json',
    authenticatorData: 'authenticator-data',
  };

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

  it('should pass attestation without bypassing multisig half-signing', async () => {
    const pendingApproval = new PendingApproval(bitgo, basecoin, pendingApprovalData, wallet);
    const halfSignedTxHex = 'half-signed-transaction';
    const paScope = nock(bgUrl)
      .put(`/api/v2/${coin}/pendingapprovals/${pendingApprovalData.id}`, {
        state: 'approved',
        attestation,
        halfSigned: { txHex: halfSignedTxHex },
      })
      .reply(200, {
        ...pendingApprovalData,
        state: 'approved',
      });

    await pendingApproval.approve({ tx: halfSignedTxHex, attestation });

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

  describe('recreateAndSignTransaction', function () {
    it('should preserve the verifyTokenEnablement verification flag when rebuilding an enabletoken pending approval (CSHLD-1358)', async () => {
      const enableTokenPendingApprovalData: PendingApprovalData = {
        id: 'pa-enabletoken',
        info: {
          type: Type.TRANSACTION_REQUEST,
          transactionRequest: {
            coinSpecific: {
              [coin]: {},
            },
            recipients: [],
            buildParams: {
              type: 'enabletoken',
            },
            sourceWallet: walletId,
          },
        },
        state: State.PENDING,
        creator: 'test',
      };
      const pendingApproval = new PendingApproval(bitgo, basecoin, enableTokenPendingApprovalData, wallet);

      const prebuildAndSignStub = sandbox
        .stub(Wallet.prototype, 'prebuildAndSignTransaction')
        .resolves({ txHex: 'signed-tx-hex' });
      sandbox.stub(basecoin, 'parseTransaction').resolves({});

      await pendingApproval.recreateAndSignTransaction({});

      prebuildAndSignStub.calledOnce.should.be.true();
      const prebuildParamsArg = prebuildAndSignStub.getCall(0).args[0]!;
      prebuildParamsArg.verification!.should.have.property('verifyTokenEnablement', true);
    });

    it('should not set verifyTokenEnablement for non-enabletoken pending approvals', async () => {
      const fanoutPendingApprovalData: PendingApprovalData = {
        id: 'pa-fanout',
        info: {
          type: Type.TRANSACTION_REQUEST,
          transactionRequest: {
            coinSpecific: {
              [coin]: {},
            },
            recipients: [],
            buildParams: {
              type: 'fanout',
            },
            sourceWallet: walletId,
          },
        },
        state: State.PENDING,
        creator: 'test',
      };
      const pendingApproval = new PendingApproval(bitgo, basecoin, fanoutPendingApprovalData, wallet);

      const prebuildAndSignStub = sandbox
        .stub(Wallet.prototype, 'prebuildAndSignTransaction')
        .resolves({ txHex: 'signed-tx-hex' });
      sandbox.stub(basecoin, 'parseTransaction').resolves({});

      await pendingApproval.recreateAndSignTransaction({});

      prebuildAndSignStub.calledOnce.should.be.true();
      const prebuildParamsArg = prebuildAndSignStub.getCall(0).args[0]!;
      (prebuildParamsArg.verification === undefined).should.be.true();
    });

    function makeEthIntentPendingApproval(legType: 'wrap' | 'finalizeUnwrap') {
      const htethCoin = bitgo.coin('hteth');
      const paData: PendingApprovalData = {
        id: `pa-${legType}`,
        info: {
          type: Type.TRANSACTION_REQUEST,
          transactionRequest: {
            coinSpecific: { hteth: {} },
            recipients: [{ address: '0x7db562c4dd465cc895761c56f83b6af0e32689ba', amount: '1000000' }],
            buildParams: { type: legType },
            sourceWallet: walletId,
          },
        },
        wallet: walletId,
        state: State.PENDING,
        creator: 'test',
      };
      const ethWallet = new Wallet(bitgo, htethCoin, {
        id: walletId,
        coin: 'hteth',
        pendingApprovals: [paData],
      });
      return { pendingApproval: ethWallet.pendingApprovals()[0], htethCoin, paData };
    }

    (['wrap', 'finalizeUnwrap'] as const).forEach((legType) => {
      it(`sends empty recipients when approving a ${legType} intent pending approval`, async () => {
        const { pendingApproval, htethCoin, paData } = makeEthIntentPendingApproval(legType);

        const prebuildAndSignStub = sandbox
          .stub(Wallet.prototype, 'prebuildAndSignTransaction')
          .resolves({ halfSigned: { txHex: 'half-signed-hex' } });
        sandbox.stub(htethCoin, 'parseTransaction').resolves({});

        const paScope = nock(bgUrl)
          .put(`/api/v2/hteth/pendingapprovals/pa-${legType}`, (body) => {
            body.state.should.equal('approved');
            body.halfSigned.txHex.should.equal('half-signed-hex');
            return true;
          })
          .reply(200, { ...paData, state: 'approved' });

        await pendingApproval.approve({ xprv: 'nonsense', walletPassphrase: 'pw' });

        paScope.isDone().should.be.true();
        prebuildAndSignStub.calledOnce.should.be.true();
        const prebuildParamsArg = prebuildAndSignStub.getCall(0).args[0]!;
        prebuildParamsArg.recipients!.should.deepEqual([]);
        prebuildParamsArg.type!.should.equal(legType);
        (prebuildParamsArg.pendingApprovalId as string).should.equal(`pa-${legType}`);
      });
    });

    it('keeps forwarding stored recipients for a transfer-type pending approval rebuild', async () => {
      const htethCoin = bitgo.coin('hteth');
      const transferPaData: PendingApprovalData = {
        id: 'pa-transfer',
        info: {
          type: Type.TRANSACTION_REQUEST,
          transactionRequest: {
            coinSpecific: { hteth: {} },
            recipients: [{ address: '0x7db562c4dd465cc895761c56f83b6af0e32689ba', amount: '1000000' }],
            buildParams: {},
            sourceWallet: walletId,
          },
        },
        wallet: walletId,
        state: State.PENDING,
        creator: 'test',
      };
      const ethWallet = new Wallet(bitgo, htethCoin, {
        id: walletId,
        coin: 'hteth',
        pendingApprovals: [transferPaData],
      });
      const pendingApproval = ethWallet.pendingApprovals()[0];

      const prebuildAndSignStub = sandbox
        .stub(Wallet.prototype, 'prebuildAndSignTransaction')
        .resolves({ txHex: 'signed-tx-hex' });
      sandbox.stub(htethCoin, 'parseTransaction').resolves({});

      await pendingApproval.recreateAndSignTransaction({});

      const prebuildParamsArg = prebuildAndSignStub.getCall(0).args[0]!;
      prebuildParamsArg.recipients!.should.deepEqual([
        { address: '0x7db562c4dd465cc895761c56f83b6af0e32689ba', amount: '1000000' },
      ]);
    });

    describe('real prebuildAndSignTransaction on ERC-7984 intent legs', function () {
      const baseAddress = '0x7db562c4dd465cc895761c56f83b6af0e32689ba';
      const otherAddress = '0x1b85b55b88ba9f5b803bb9ebe5c0cfc6a045b9aa';
      const pair = staticsCoins.get('hteth:cusdt') as unknown as { contractAddress: string };
      const wrapper = pair.contractAddress;
      const amount = '1000000';
      const unwrapParams = { tokenName: 'hteth:cusdt', amount };
      const requestId = Buffer.alloc(32, 0xab);
      const encryptedAmount = Buffer.alloc(32, 0xcd);
      const proof = Buffer.from('deadbeef', 'hex');

      const encodeCall = (name: string, types: string[], values: unknown[]): string =>
        '0x' + Buffer.concat([ethAbi.methodID(name, types), ethAbi.rawEncode(types, values)]).toString('hex');

      afterEach(() => {
        nock.cleanAll();
      });

      // Rebuilds the leg through the real prebuildAndSignTransaction: only the signing seams are stubbed, so
      // the real verifyTransaction runs against the nocked /tx/build prebuild.
      async function setupLegApproval(
        legType: 'wrap' | 'unwrap' | 'finalizeUnwrap',
        innerCalldata: string,
        paBuildParams: NonNullable<PendingApprovalInfo['transactionRequest']>['buildParams']
      ) {
        const paId = `pa-${legType}-real`;
        const sendMultiSigCalldata = encodeCall(
          'sendMultiSig',
          ['address', 'uint', 'bytes', 'uint', 'uint', 'bytes'],
          [wrapper, 0, Buffer.from(innerCalldata.slice(2), 'hex'), 1234, 1, Buffer.alloc(0)]
        );

        const htethCoin = bitgo.coin('hteth');
        // AbstractEthLikeNewCoins is not a bitgo-module dependency; the builder is used structurally.
        const txBuilder = (
          htethCoin as unknown as {
            getTransactionBuilder(): {
              type(type: TransactionType): void;
              fee(fee: { fee: string; gasLimit: string }): void;
              counter(counter: number): void;
              contract(contract: string): void;
              data(data: string): void;
              build(): Promise<{ toBroadcastFormat(): string }>;
            };
          }
        ).getTransactionBuilder();
        txBuilder.type(TransactionType.ContractCall);
        txBuilder.fee({ fee: '10', gasLimit: '100000' });
        txBuilder.counter(1);
        txBuilder.contract(baseAddress);
        txBuilder.data(sendMultiSigCalldata);
        const txHex = (await txBuilder.build()).toBroadcastFormat();

        const paData: PendingApprovalData = {
          id: paId,
          info: {
            type: Type.TRANSACTION_REQUEST,
            transactionRequest: {
              coinSpecific: { hteth: {} },
              recipients: [{ address: wrapper, amount: '0' }],
              buildParams: paBuildParams,
              sourceWallet: walletId,
            },
          },
          wallet: walletId,
          state: State.PENDING,
          creator: 'test',
        };
        const ethWallet = new Wallet(bitgo, htethCoin, {
          id: walletId,
          coin: 'hteth',
          coinSpecific: { baseAddress },
          multisigType: 'onchain',
          pendingApprovals: [paData],
        });

        sandbox.stub(htethCoin, 'parseTransaction').resolves({});
        sandbox
          .stub(Keychains.prototype, 'getKeysForSigning')
          .resolves([{ id: 'k1', type: 'independent', pub: '0x02' + 'aa'.repeat(64) }]);
        sandbox
          .stub(Wallet.prototype, 'signTransaction')
          .resolves({ halfSigned: { txHex: 'half-signed-hex' } } as unknown as SignedTransaction);

        const buildScope = nock(bgUrl)
          .post(`/api/v2/hteth/wallet/${walletId}/tx/build`, (body) => {
            body.type.should.equal(legType);
            body.pendingApprovalId.should.equal(paId);
            body.recipients.should.deepEqual([]);
            should.not.exist(body.wrapParams);
            if (legType === 'unwrap') {
              body.unwrapParams.should.deepEqual(unwrapParams);
            } else {
              should.not.exist(body.unwrapParams);
            }
            return true;
          })
          .reply(200, {
            txHex,
            recipients: [{ address: wrapper, amount: '0', data: innerCalldata }],
            feeInfo: { fee: '1000' },
            coin: 'hteth',
            walletId,
          });
        const paScope = nock(bgUrl)
          .put(`/api/v2/hteth/pendingapprovals/${paId}`, (body) => {
            body.state.should.equal('approved');
            body.halfSigned.txHex.should.equal('half-signed-hex');
            return true;
          })
          .reply(200, { ...paData, state: 'approved' });

        return { pendingApproval: ethWallet.pendingApprovals()[0], buildScope, paScope };
      }

      const wrapCalldata = encodeCall('wrap', ['address', 'uint256'], [baseAddress, amount]);
      const legs = [
        { legType: 'wrap', inner: wrapCalldata, paBuildParams: { type: 'wrap' } },
        {
          legType: 'finalizeUnwrap',
          inner: encodeCall('finalizeUnwrap', ['bytes32', 'uint64', 'bytes'], [requestId, amount, proof]),
          paBuildParams: { type: 'finalizeUnwrap' },
        },
        {
          legType: 'unwrap',
          inner: encodeCall(
            'unwrap',
            ['address', 'address', 'bytes32', 'bytes'],
            [baseAddress, baseAddress, encryptedAmount, proof]
          ),
          paBuildParams: { type: 'unwrap', unwrapParams },
        },
      ] as const;

      legs.forEach(({ legType, inner, paBuildParams }) => {
        it(`approves a ${legType} pending approval and verifies the rebuilt leg`, async () => {
          const { pendingApproval, buildScope, paScope } = await setupLegApproval(legType, inner, paBuildParams);

          const result = await pendingApproval.approve({ xprv: 'nonsense', walletPassphrase: 'pw' });

          buildScope.isDone().should.be.true();
          paScope.isDone().should.be.true();
          result.state.should.equal('approved');
        });
      });

      it('rejects the approval when the rebuilt wrap mints to an address other than the wallet base', async () => {
        const tamperedWrap = encodeCall('wrap', ['address', 'uint256'], [otherAddress, amount]);
        const { pendingApproval, buildScope, paScope } = await setupLegApproval('wrap', tamperedWrap, {
          type: 'wrap',
        });

        await pendingApproval
          .approve({ xprv: 'nonsense', walletPassphrase: 'pw' })
          .should.be.rejectedWith(/mint recipient must be the wallet base address/);

        buildScope.isDone().should.be.true();
        paScope.isDone().should.be.false();
      });
    });
  });

  describe('message-sign approvals (transactionRequestFull)', () => {
    const buildMessageSignPendingApprovalData = (intentType: string): PendingApprovalData => ({
      id: 'pa-msg',
      info: {
        type: Type.TRANSACTION_REQUEST_FULL,
        transactionRequestFull: {
          txRequestId: 'txreq-msg-1',
          intent: { intentType },
        },
      } as PendingApprovalInfo,
      state: State.PENDING,
      creator: 'test',
      txRequestId: 'txreq-msg-1',
    });

    ['signMessage', 'signTypedStructuredData'].forEach((intentType) => {
      it(`should approve without the post-approve auto-sign for a ${intentType} approval`, async () => {
        const ethBaseCoin = bitgo.coin('teth');
        const paData = buildMessageSignPendingApprovalData(intentType);
        const pendingApproval = new PendingApproval(bitgo, ethBaseCoin, paData, wallet);

        const paScope = nock(bgUrl)
          .put(`/api/v2/teth/pendingapprovals/pa-msg`, { state: 'approved', otp: undefined })
          .reply(200, { ...paData, state: 'approved' });
        const recreateTransactionTssStub = sandbox.stub(PendingApproval.prototype, 'recreateAndSignTSSTransaction');

        await pendingApproval.approve({ walletPassphrase: 'pass' });

        recreateTransactionTssStub.notCalled.should.be.true();
        paScope.isDone().should.be.true();
      });
    });

    it('should keep the post-approve auto-sign for transaction approvals', async () => {
      const ethBaseCoin = bitgo.coin('teth');
      const paData = buildMessageSignPendingApprovalData('payment');
      const pendingApproval = new PendingApproval(bitgo, ethBaseCoin, paData, wallet);

      const paScope = nock(bgUrl)
        .put(`/api/v2/teth/pendingapprovals/pa-msg`, { state: 'approved', otp: undefined })
        .reply(200, { ...paData, state: 'approved' });
      const recreateTransactionTssStub = sandbox.stub(PendingApproval.prototype, 'recreateAndSignTSSTransaction');

      await pendingApproval.approve({ walletPassphrase: 'pass' });

      recreateTransactionTssStub.calledOnce.should.be.true();
      paScope.isDone().should.be.true();
    });
  });
});

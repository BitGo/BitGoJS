import sinon from 'sinon';
import assert from 'assert';
import 'should';
import { ActiveOperationExistsError, DefiVault, Wallet } from '../../../../src';

describe('DefiVault', function () {
  let wallet: Wallet;
  let defiVault: DefiVault;
  let mockBitGo: any;
  let mockBaseCoin: any;

  // Helper to create a chainable request mock
  function mockRequest(result: any) {
    return {
      send: sinon.stub().returnsThis(),
      query: sinon.stub().returnsThis(),
      result: sinon.stub().resolves(result),
    };
  }

  beforeEach(function () {
    mockBitGo = {
      post: sinon.stub(),
      get: sinon.stub(),
      del: sinon.stub(),
      url: sinon.stub().callsFake((path: string, version: number) => `https://bitgo.com/api/v${version}${path}`),
      microservicesUrl: sinon.stub().callsFake((path: string) => `https://bitgo.com${path}`),
      setRequestTracer: sinon.stub(),
    };

    mockBaseCoin = {
      getFamily: sinon.stub().returns('eth'),
      url: sinon.stub(),
      keychains: sinon.stub(),
      supportsTss: sinon.stub().returns(true),
      getMPCAlgorithm: sinon.stub(),
    };

    const mockWalletData = {
      id: 'test-wallet-id',
      coin: 'eth',
      keys: ['user-key', 'backup-key', 'bitgo-key'],
    };

    wallet = new Wallet(mockBitGo, mockBaseCoin, mockWalletData);
    defiVault = wallet.defi;
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('getVaultConfig', function () {
    it('should fetch vault config for a given vaultId', async function () {
      const vaultConfig = {
        id: 'vlt-concrete-1',
        name: 'Concrete BTC Vault',
        provider: 'concrete_btccx',
        status: 'active',
        coin: 'btc',
        assetToken: 'btc',
        shareToken: 'cbtc',
        riskManager: 'manager-1',
        custodyType: 'custodial',
        concreteConfig: {
          sourceWalletId: 'src-wallet',
          escrowWalletId: 'escrow-wallet',
          escrowDepositAddress: '1ExampleBtcAddress',
          positionWalletId: 'pos-wallet',
          positionBaseAddress: '1PositionAddress',
        },
      };

      const req = mockRequest(vaultConfig);
      mockBitGo.get.returns(req);

      const result = await defiVault.getVaultConfig({ vaultId: 'vlt-concrete-1' });

      result.should.deepEqual(vaultConfig);
      mockBitGo.get.calledWith('https://bitgo.com/api/defi-service/v1/vaults/vlt-concrete-1').should.be.true();
    });

    it('should throw if vaultId is missing', async function () {
      await assert.rejects(() => defiVault.getVaultConfig({ vaultId: '' }), {
        message: 'vaultId is required',
      });
    });

    it('should propagate errors from the API (e.g. 404)', async function () {
      const req = mockRequest(null);
      req.result.rejects(new Error('Not Found'));
      mockBitGo.get.returns(req);

      await assert.rejects(() => defiVault.getVaultConfig({ vaultId: 'vlt-not-found' }), {
        message: 'Not Found',
      });
    });
  });

  describe('depositToVault', function () {
    describe('concrete_btccx provider', function () {
      it('should call sendMany once with defi-deposit type and no recipients', async function () {
        const vaultConfig = { id: 'vlt-btc-1', provider: 'concrete_btccx' };
        const getVaultConfigReq = mockRequest(vaultConfig);
        mockBitGo.get.returns(getVaultConfigReq);

        const sendManyStub = sinon.stub(wallet, 'sendMany').resolves({
          pendingApproval: {
            id: 'pa-uuid-123',
            state: 'awaitingSignature',
          },
        });

        const result = await defiVault.depositToVault({
          vaultId: 'vlt-btc-1',
          amount: '5000000',
        });

        // Returns ConcreteDepositResult shape
        (result as any).pendingApprovalId.should.equal('pa-uuid-123');
        (result as any).state.should.equal('awaitingSignature');

        // Only one sendMany call — no second deposit sendMany
        sendManyStub.calledOnce.should.be.true();

        const callArgs: any = sendManyStub.firstCall.args[0];
        callArgs.type.should.equal('defi-deposit');
        callArgs.defiParams.vaultId.should.equal('vlt-btc-1');
        callArgs.defiParams.amount.should.equal('5000000');
        callArgs.defiParams.actionType.should.equal('defi-deposit');
        // No recipients key at all
        assert.strictEqual(callArgs.recipients, undefined);
      });

      it('should pass walletPassphrase when provided', async function () {
        const vaultConfig = { id: 'vlt-btc-2', provider: 'concrete_btccx' };
        mockBitGo.get.returns(mockRequest(vaultConfig));

        const sendManyStub = sinon.stub(wallet, 'sendMany').resolves({
          pendingApproval: { id: 'pa-uuid-456', state: 'awaitingSignature' },
        });

        await defiVault.depositToVault({
          vaultId: 'vlt-btc-2',
          amount: '1000000',
          walletPassphrase: 'hunter2',
        });

        const callArgs: any = sendManyStub.firstCall.args[0];
        callArgs.walletPassphrase.should.equal('hunter2');
      });

      it('should default state to awaitingSignature when absent from pendingApproval', async function () {
        const vaultConfig = { id: 'vlt-btc-3', provider: 'concrete_btccx' };
        mockBitGo.get.returns(mockRequest(vaultConfig));

        sinon.stub(wallet, 'sendMany').resolves({
          pendingApproval: { id: 'pa-no-state' },
        });

        const result = await defiVault.depositToVault({ vaultId: 'vlt-btc-3', amount: '1000000' });
        (result as any).state.should.equal('awaitingSignature');
      });

      it('should throw when sendMany returns no pendingApproval', async function () {
        const vaultConfig = { id: 'vlt-btc-4', provider: 'concrete_btccx' };
        mockBitGo.get.returns(mockRequest(vaultConfig));

        sinon.stub(wallet, 'sendMany').resolves({ txRequest: { txRequestId: 'unexpected' } });

        await assert.rejects(
          () => defiVault.depositToVault({ vaultId: 'vlt-btc-4', amount: '1000000' }),
          { message: 'Unexpected sendMany response for defi-deposit: no pendingApproval.id' }
        );
      });
    });

    describe('morpho provider', function () {
      it('should call sendMany for approve and deposit on happy path', async function () {
        const vaultConfig = { id: 'vlt-galaxy-usdc', provider: 'morpho' };
        mockBitGo.get.returns(mockRequest(vaultConfig));

        const operationId = 'op-uuid-123';

        const sendManyStub = sinon.stub(wallet, 'sendMany');
        // WP writes operationId into the built tx's coinSpecific (full apiVersion),
        // not into the intent — mirror that real shape here.
        sendManyStub.onFirstCall().resolves({
          txRequest: {
            txRequestId: 'txreq-approve-1',
            intent: { intentType: 'defi-approve' },
            transactions: [{ unsignedTx: { coinSpecific: { operationId } } }],
          },
        });
        sendManyStub.onSecondCall().resolves({
          txRequest: {
            txRequestId: 'txreq-deposit-1',
            intent: { intentType: 'defi-deposit' },
            transactions: [{ unsignedTx: { coinSpecific: { operationId } } }],
          },
        });

        const result = await defiVault.depositToVault({
          vaultId: 'vlt-galaxy-usdc',
          amount: '1000000',
        });

        (result as any).operationId.should.equal(operationId);
        (result as any).txRequestIds.approve.should.equal('txreq-approve-1');
        (result as any).txRequestIds.deposit.should.equal('txreq-deposit-1');

        // Verify sendMany was called with correct params for approve
        sendManyStub.calledTwice.should.be.true();
        const approveArgs: any = sendManyStub.firstCall.args[0];
        approveArgs.type.should.equal('defiApprove');
        approveArgs.defiParams.vaultId.should.equal('vlt-galaxy-usdc');
        approveArgs.defiParams.amount.should.equal('1000000');

        // Verify sendMany was called with correct params for deposit
        const depositArgs: any = sendManyStub.secondCall.args[0];
        depositArgs.type.should.equal('defiDeposit');
        depositArgs.defiParams.operationId.should.equal(operationId);
      });

      it('should extract operationId from the lite apiVersion coinSpecific', async function () {
        const vaultConfig = { id: 'vlt-galaxy-usdc', provider: 'morpho' };
        mockBitGo.get.returns(mockRequest(vaultConfig));

        const operationId = 'op-uuid-lite';

        const sendManyStub = sinon.stub(wallet, 'sendMany');
        sendManyStub.onFirstCall().resolves({
          txRequest: {
            txRequestId: 'txreq-approve-lite',
            intent: { intentType: 'defi-approve' },
            unsignedTxs: [{ coinSpecific: { operationId } }],
          },
        });
        sendManyStub.onSecondCall().resolves({
          txRequest: { txRequestId: 'txreq-deposit-lite' },
        });

        const result = await defiVault.depositToVault({ vaultId: 'vlt-galaxy-usdc', amount: '1000000' });

        (result as any).operationId.should.equal(operationId);
        const depositArgs: any = sendManyStub.secondCall.args[0];
        depositArgs.defiParams.operationId.should.equal(operationId);
      });

      it('should fall back to intent.operationId for forward-compat', async function () {
        const vaultConfig = { id: 'vlt-galaxy-usdc', provider: 'morpho' };
        mockBitGo.get.returns(mockRequest(vaultConfig));

        const operationId = 'op-uuid-intent';

        const sendManyStub = sinon.stub(wallet, 'sendMany');
        sendManyStub.onFirstCall().resolves({
          txRequest: {
            txRequestId: 'txreq-approve-intent',
            intent: { intentType: 'defi-approve', operationId },
          },
        });
        sendManyStub.onSecondCall().resolves({
          txRequest: { txRequestId: 'txreq-deposit-intent' },
        });

        const result = await defiVault.depositToVault({ vaultId: 'vlt-galaxy-usdc', amount: '1000000' });

        (result as any).operationId.should.equal(operationId);
      });

      it('should throw when operationId is absent from the approve txRequest', async function () {
        const vaultConfig = { id: 'vlt-galaxy-usdc', provider: 'morpho' };
        mockBitGo.get.returns(mockRequest(vaultConfig));

        const sendManyStub = sinon.stub(wallet, 'sendMany');
        sendManyStub.onFirstCall().resolves({
          txRequest: {
            txRequestId: 'txreq-approve-missing',
            intent: { intentType: 'defi-approve' },
            transactions: [{ unsignedTx: { coinSpecific: {} } }],
          },
        });

        await assert.rejects(() => defiVault.depositToVault({ vaultId: 'vlt-galaxy-usdc', amount: '1000000' }), {
          message: 'operationId not found in approve txRequest response',
        });

        // Deposit sendMany must not be issued when the operationId is missing
        sendManyStub.calledOnce.should.be.true();
      });

      // TODO(CGD-1709): Re-enable when active operation pre-flight check is restored
      xit('should reject when an active operation already exists', async function () {
        const preflightReq = mockRequest({
          items: [{ operationId: 'existing-op-id', state: 'APPROVE_TX_REQUESTED' }],
        });
        mockBitGo.get.returns(preflightReq);

        await assert.rejects(
          () => defiVault.depositToVault({ vaultId: 'vlt-galaxy-usdc', amount: '1000000' }),
          (err: Error) => {
            (err instanceof ActiveOperationExistsError).should.be.true();
            (err as ActiveOperationExistsError).operationId.should.equal('existing-op-id');
            return true;
          }
        );
      });

      it('should propagate deposit sendMany failure without cleanup', async function () {
        const vaultConfig = { id: 'vlt-galaxy-usdc', provider: 'morpho' };
        mockBitGo.get.returns(mockRequest(vaultConfig));

        const operationId = 'op-uuid-456';

        // Mock sendMany: approve succeeds, deposit fails
        const sendManyStub = sinon.stub(wallet, 'sendMany');
        sendManyStub.onFirstCall().resolves({
          txRequest: {
            txRequestId: 'txreq-approve-2',
            intent: { intentType: 'defi-approve' },
            transactions: [{ unsignedTx: { coinSpecific: { operationId } } }],
          },
        });
        sendManyStub.onSecondCall().rejects(new Error('deposit creation failed'));

        await assert.rejects(() => defiVault.depositToVault({ vaultId: 'vlt-galaxy-usdc', amount: '1000000' }), {
          message: 'deposit creation failed',
        });

        // SDK does not attempt cleanup — reconciler handles orphaned approvals
        mockBitGo.del.called.should.be.false();
      });

      it('should pass clientIdempotencyKey and walletPassphrase when provided', async function () {
        const vaultConfig = { id: 'vlt-galaxy-usdc', provider: 'morpho' };
        mockBitGo.get.returns(mockRequest(vaultConfig));

        const operationId = 'op-uuid-789';

        const sendManyStub = sinon.stub(wallet, 'sendMany');
        sendManyStub.onFirstCall().resolves({
          txRequest: {
            txRequestId: 'txreq-approve-3',
            intent: { intentType: 'defi-approve' },
            transactions: [{ unsignedTx: { coinSpecific: { operationId } } }],
          },
        });
        sendManyStub.onSecondCall().resolves({
          txRequest: {
            txRequestId: 'txreq-deposit-3',
            intent: { intentType: 'defi-deposit' },
            transactions: [{ unsignedTx: { coinSpecific: { operationId } } }],
          },
        });

        await defiVault.depositToVault({
          vaultId: 'vlt-galaxy-usdc',
          amount: '1000000',
          clientIdempotencyKey: 'idem-key-123',
          walletPassphrase: 'test-passphrase',
        });

        const approveArgs: any = sendManyStub.firstCall.args[0];
        approveArgs.defiParams.clientIdempotencyKey.should.equal('idem-key-123');
        approveArgs.walletPassphrase.should.equal('test-passphrase');

        const depositArgs: any = sendManyStub.secondCall.args[0];
        depositArgs.defiParams.clientIdempotencyKey.should.equal('idem-key-123');
        depositArgs.walletPassphrase.should.equal('test-passphrase');
      });
    });

    it('should throw if vaultId is missing', async function () {
      await assert.rejects(() => defiVault.depositToVault({ vaultId: '', amount: '1000000' }), {
        message: 'vaultId is required',
      });
    });

    it('should throw if amount is missing', async function () {
      const vaultConfig = { id: 'vlt-1', provider: 'morpho' };
      mockBitGo.get.returns(mockRequest(vaultConfig));

      await assert.rejects(() => defiVault.depositToVault({ vaultId: 'vlt-1', amount: '' }), {
        message: 'amount is required',
      });
    });
  });

  describe('resumeDeposit', function () {
    it('should issue the deposit sendMany for a partial operation', async function () {
      const operation = {
        operationId: 'op-resume-1',
        walletId: 'test-wallet-id',
        vaultId: 'vlt-galaxy-usdc',
        type: 'DEPOSIT',
        assetAmount: '1000000',
        state: 'APPROVE_TX_REQUESTED',
        txRequestId: 'txreq-approve-existing',
        associatedTxRequestId: undefined,
        createdAt: '2026-05-14T07:12:00Z',
        updatedAt: '2026-05-14T07:12:00Z',
      };

      // getOperation call
      const getOpReq = mockRequest(operation);
      mockBitGo.get.returns(getOpReq);

      // deposit sendMany
      const sendManyStub = sinon.stub(wallet, 'sendMany');
      sendManyStub.resolves({
        txRequest: {
          txRequestId: 'txreq-deposit-resume',
          intent: { intentType: 'defi-deposit', operationId: 'op-resume-1' },
        },
      });

      const result = await defiVault.resumeDeposit({ operationId: 'op-resume-1' });

      (result as any).operationId.should.equal('op-resume-1');
      (result as any).txRequestIds.approve.should.equal('txreq-approve-existing');
      (result as any).txRequestIds.deposit.should.equal('txreq-deposit-resume');

      // Verify sendMany was called with correct defiParams
      const depositArgs: any = sendManyStub.firstCall.args[0];
      depositArgs.type.should.equal('defiDeposit');
      depositArgs.defiParams.vaultId.should.equal('vlt-galaxy-usdc');
      depositArgs.defiParams.amount.should.equal('1000000');
      depositArgs.defiParams.operationId.should.equal('op-resume-1');
    });

    it('should throw if deposit txRequest already exists', async function () {
      const operation = {
        operationId: 'op-already-done',
        walletId: 'test-wallet-id',
        vaultId: 'vlt-galaxy-usdc',
        type: 'DEPOSIT',
        assetAmount: '1000000',
        state: 'DEPOSIT_TX_REQUESTED',
        txRequestId: 'txreq-approve-x',
        associatedTxRequestId: 'txreq-deposit-x',
        createdAt: '2026-05-14T07:12:00Z',
        updatedAt: '2026-05-14T07:12:00Z',
      };

      const getOpReq = mockRequest(operation);
      mockBitGo.get.returns(getOpReq);

      await assert.rejects(() => defiVault.resumeDeposit({ operationId: 'op-already-done' }), {
        message: 'Deposit txRequest already exists for this operation; nothing to resume',
      });
    });

    it('should throw if operationId is missing', async function () {
      await assert.rejects(() => defiVault.resumeDeposit({ operationId: '' }), { message: 'operationId is required' });
    });
  });

  describe('getOperation', function () {
    it('should fetch an operation by ID', async function () {
      const operation = {
        operationId: 'op-get-1',
        walletId: 'test-wallet-id',
        vaultId: 'vlt-galaxy-usdc',
        type: 'DEPOSIT',
        assetAmount: '1000000',
        state: 'COMPLETED',
        txRequestId: 'txreq-1',
        associatedTxRequestId: 'txreq-2',
        createdAt: '2026-05-14T07:12:00Z',
        updatedAt: '2026-05-14T07:18:00Z',
      };

      const req = mockRequest(operation);
      mockBitGo.get.returns(req);

      const result = await defiVault.getOperation({ operationId: 'op-get-1' });
      result.should.deepEqual(operation);
    });

    it('should throw if operationId is missing', async function () {
      await assert.rejects(() => defiVault.getOperation({ operationId: '' }), { message: 'operationId is required' });
    });
  });

  describe('listOperations', function () {
    it('should list operations for a vault', async function () {
      const listResult = {
        items: [
          {
            operationId: 'op-1',
            walletId: 'test-wallet-id',
            vaultId: 'vlt-galaxy-usdc',
            type: 'DEPOSIT',
            assetAmount: '1000000',
            state: 'COMPLETED',
            createdAt: '2026-05-14T07:12:00Z',
            updatedAt: '2026-05-14T07:18:00Z',
          },
        ],
        nextCursor: 'cursor-abc',
      };

      const req = mockRequest(listResult);
      mockBitGo.get.returns(req);

      const result = await defiVault.listOperations({
        vaultId: 'vlt-galaxy-usdc',
        state: 'COMPLETED',
        limit: 10,
      });

      result.items.length.should.equal(1);
      result.nextCursor!.should.equal('cursor-abc');

      // Verify query params
      const queryArgs = req.query.firstCall.args[0];
      queryArgs.vaultId.should.equal('vlt-galaxy-usdc');
      queryArgs.state.should.equal('COMPLETED');
      queryArgs.limit.should.equal(10);
    });

    it('should throw if vaultId is missing', async function () {
      await assert.rejects(() => defiVault.listOperations({ vaultId: '' }), { message: 'vaultId is required' });
    });
  });

  describe('wallet.defi getter', function () {
    it('should return a DefiVault instance', function () {
      const defi = wallet.defi;
      (defi instanceof DefiVault).should.be.true();
    });

    it('should return the same instance on subsequent calls', function () {
      const defi1 = wallet.defi;
      const defi2 = wallet.defi;
      (defi1 === defi2).should.be.true();
    });
  });
});

import sinon from 'sinon';
import assert from 'assert';
import 'should';
import { CoinFeature } from '@bitgo/statics';
import { VaultProtocol } from '@bitgo/public-types';
import { ActiveOperationExistsError, DefiVault, Erc4626DepositResult, Wallet } from '../../../../src';

describe('DefiVault', function () {
  let wallet: Wallet;
  let defiVault: DefiVault;
  let mockBitGo: any;
  let mockBaseCoin: any;

  // Helper to create a chainable request mock
  function mockRequest(result: any) {
    return {
      send: sinon.stub().returnsThis(),
      set: sinon.stub().returnsThis(),
      query: sinon.stub().returnsThis(),
      result: sinon.stub().resolves(result),
    };
  }

  // The two-network-call prefix of every ERC-4626 deposit: the vault-config
  // fetch (protocol dispatch) followed by the active-operation pre-flight
  // listOperations call (no pending operations).
  function mockVaultGetWithNoActiveOperations(vault: unknown) {
    mockBitGo.get.onFirstCall().returns(mockRequest(vault));
    mockBitGo.get.onSecondCall().returns(mockRequest({ operations: [], nextCursor: null }));
  }

  function makeConcreteVault(id: string) {
    return {
      id,
      name: 'Concrete BTC Vault',
      protocol: VaultProtocol.CONCRETE_BTCCX,
      status: 'active',
      coin: 'btc',
      assetToken: 'btc',
      shareToken: 'cbtc',
      riskManager: 'manager-1',
      custodyType: 'qualified',
      vaultContractAddress: '0xVaultContract',
    };
  }

  function makeMorphoVault(id: string) {
    return {
      id,
      name: 'Morpho USDC Vault',
      protocol: VaultProtocol.MORPHO,
      status: 'active',
      coin: 'eth',
      assetToken: 'usdc',
      shareToken: 'musdc',
      riskManager: 'manager-2',
      custodyType: 'qualified',
      vaultContractAddress: '0xMorphoVault',
    };
  }

  function makeAaveVault(id: string) {
    return {
      id,
      name: 'Aave V3 USDC Vault',
      protocol: VaultProtocol.AAVE_V3,
      status: 'active',
      coin: 'eth',
      assetToken: 'usdc',
      shareToken: 'stataUSDC',
      riskManager: 'manager-3',
      custodyType: 'qualified',
      vaultContractAddress: '0xAaveVault',
    };
  }

  // A vault response whose `composition[]` no longer matches the strict
  // GetVaultResponse codec — mirrors the prod incident where a display-only
  // nested field was narrowed/removed server-side. The deposit dispatch path
  // must not hard-fail on it because it only reads `protocol`.
  function makeConcreteVaultWithStaleComposition(id: string) {
    return {
      ...makeConcreteVault(id),
      composition: [{ asset: 'btc', apy: 'not-a-number' /* stale shape */ }],
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
      getConfig: sinon.stub().returns({ features: [CoinFeature.EVM_COIN] }),
      url: sinon.stub(),
      keychains: sinon.stub(),
      supportsTss: sinon.stub().returns(true),
      getMPCAlgorithm: sinon.stub(),
    };

    const mockWalletData = {
      id: 'test-wallet-id',
      coin: 'eth',
      keys: ['user-key', 'backup-key', 'bitgo-key'],
      enterprise: 'test-enterprise-id',
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
        protocol: VaultProtocol.CONCRETE_BTCCX,
        status: 'active',
        coin: 'btc',
        assetToken: 'btc',
        shareToken: 'cbtc',
        riskManager: 'manager-1',
        custodyType: 'qualified',
        vaultContractAddress: '0xVaultContract',
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
      req.set.calledWith('enterprise-id', 'test-enterprise-id').should.be.true();
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

  describe('getVaultProtocol', function () {
    it('should fetch only the protocol for a given vaultId', async function () {
      mockBitGo.get.returns(mockRequest(makeMorphoVault('vlt-morpho-1')));

      const protocol = await defiVault.getVaultProtocol({ vaultId: 'vlt-morpho-1' });

      protocol.should.equal(VaultProtocol.MORPHO);
      mockBitGo.get.calledWith('https://bitgo.com/api/defi-service/v1/vaults/vlt-morpho-1').should.be.true();
    });

    it('should return CONCRETE_BTCCX for a concrete vault', async function () {
      mockBitGo.get.returns(mockRequest(makeConcreteVault('vlt-concrete-1')));

      const protocol = await defiVault.getVaultProtocol({ vaultId: 'vlt-concrete-1' });

      protocol.should.equal(VaultProtocol.CONCRETE_BTCCX);
    });

    it('should tolerate a stale/invalid composition[] field the full GetVaultResponse codec would reject', async function () {
      // The dispatch codec reads only `protocol`, so a display-only nested
      // field going stale server-side must not break this call.
      mockBitGo.get.returns(mockRequest(makeConcreteVaultWithStaleComposition('vlt-stale-1')));

      const protocol = await defiVault.getVaultProtocol({ vaultId: 'vlt-stale-1' });

      protocol.should.equal(VaultProtocol.CONCRETE_BTCCX);
    });

    it('should throw if vaultId is missing', async function () {
      await assert.rejects(() => defiVault.getVaultProtocol({ vaultId: '' }), {
        message: 'vaultId is required',
      });
    });

    it('should propagate errors from the API (e.g. 404)', async function () {
      const req = mockRequest(null);
      req.result.rejects(new Error('Not Found'));
      mockBitGo.get.returns(req);

      await assert.rejects(() => defiVault.getVaultProtocol({ vaultId: 'vlt-not-found' }), {
        message: 'Not Found',
      });
    });
  });

  describe('depositToVault', function () {
    describe('concrete_btccx provider', function () {
      it('should call sendMany once with defi-deposit type and no recipients', async function () {
        mockBitGo.get.returns(mockRequest(makeConcreteVault('vlt-btc-1')));

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
        mockBitGo.get.returns(mockRequest(makeConcreteVault('vlt-btc-2')));

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
        mockBitGo.get.returns(mockRequest(makeConcreteVault('vlt-btc-3')));

        sinon.stub(wallet, 'sendMany').resolves({
          pendingApproval: { id: 'pa-no-state' },
        });

        const result = await defiVault.depositToVault({ vaultId: 'vlt-btc-3', amount: '1000000' });
        (result as any).state.should.equal('awaitingSignature');
      });

      it('should tolerate a stale/invalid composition[] field that the full GetVaultResponse codec would reject', async function () {
        // Regression guard for the cross-repo codec-drift incident: the
        // deposit dispatch path reads only `protocol`, so a display-only
        // nested field going stale server-side must not break deposits.
        mockBitGo.get.returns(mockRequest(makeConcreteVaultWithStaleComposition('vlt-btc-stale')));

        const sendManyStub = sinon.stub(wallet, 'sendMany').resolves({
          pendingApproval: { id: 'pa-stale', state: 'awaitingSignature' },
        });

        const result = await defiVault.depositToVault({ vaultId: 'vlt-btc-stale', amount: '1000000' });

        (result as any).pendingApprovalId.should.equal('pa-stale');
        sendManyStub.calledOnce.should.be.true();
      });

      it('should throw when sendMany returns no pendingApproval', async function () {
        mockBitGo.get.returns(mockRequest(makeConcreteVault('vlt-btc-4')));

        sinon.stub(wallet, 'sendMany').resolves({ txRequest: { txRequestId: 'unexpected' } });

        await assert.rejects(() => defiVault.depositToVault({ vaultId: 'vlt-btc-4', amount: '1000000' }), {
          message: 'defi-deposit sendMany response: unknown; unknown',
        });
      });
    });

    describe('morpho provider', function () {
      it('should call sendMany for approve and deposit on happy path', async function () {
        mockVaultGetWithNoActiveOperations(makeMorphoVault('vlt-galaxy-usdc'));

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
        (result as any).should.not.have.property('pendingApprovalIds');

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
      it('should surface pendingApproval ids per leg when a policy gates both legs', async function () {
        mockVaultGetWithNoActiveOperations(makeMorphoVault('vlt-galaxy-usdc'));

        const operationId = 'op-uuid-gated';

        const sendManyStub = sinon.stub(wallet, 'sendMany');
        sendManyStub.onFirstCall().resolves({
          pendingApproval: { id: 'pa-approve-1' },
          txRequest: {
            txRequestId: 'txreq-approve-gated',
            intent: { intentType: 'defi-approve' },
            transactions: [{ unsignedTx: { coinSpecific: { operationId } } }],
          },
        });
        sendManyStub.onSecondCall().resolves({
          pendingApproval: { id: 'pa-deposit-1' },
          txRequest: {
            txRequestId: 'txreq-deposit-gated',
            intent: { intentType: 'defi-deposit' },
            transactions: [{ unsignedTx: { coinSpecific: { operationId } } }],
          },
        });

        const rawResult = await defiVault.depositToVault({ vaultId: 'vlt-galaxy-usdc', amount: '1000000' });
        const result = rawResult as Erc4626DepositResult;
        result.operationId.should.equal(operationId);
        result.pendingApprovalIds!.approve!.should.equal('pa-approve-1');
        result.pendingApprovalIds!.deposit!.should.equal('pa-deposit-1');
      });

      it('should surface only the gated leg id when a policy gates just one leg', async function () {
        mockVaultGetWithNoActiveOperations(makeMorphoVault('vlt-galaxy-usdc'));

        const operationId = 'op-uuid-deposit-gated';

        const sendManyStub = sinon.stub(wallet, 'sendMany');
        // Only the deposit leg trips a wallet policy; the approve leg (0-value
        // token approval) sails through un-gated.
        sendManyStub.onFirstCall().resolves({
          txRequest: {
            txRequestId: 'txreq-approve-ungated',
            intent: { intentType: 'defi-approve' },
            transactions: [{ unsignedTx: { coinSpecific: { operationId } } }],
          },
        });
        sendManyStub.onSecondCall().resolves({
          pendingApproval: { id: 'pa-deposit-only' },
          txRequest: {
            txRequestId: 'txreq-deposit-gated',
            intent: { intentType: 'defi-deposit' },
            transactions: [{ unsignedTx: { coinSpecific: { operationId } } }],
          },
        });

        const rawResult = await defiVault.depositToVault({ vaultId: 'vlt-galaxy-usdc', amount: '1000000' });
        const result = rawResult as Erc4626DepositResult;
        // pendingApprovalIds is per-leg: only the gated deposit leg appears,
        // and the deposit leg id must not be dropped for the un-gated approve.
        result.pendingApprovalIds!.should.deepEqual({ deposit: 'pa-deposit-only' });
      });

      it('should extract operationId from the lite apiVersion coinSpecific', async function () {
        mockVaultGetWithNoActiveOperations(makeMorphoVault('vlt-galaxy-usdc'));

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
        mockVaultGetWithNoActiveOperations(makeMorphoVault('vlt-galaxy-usdc'));

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
        mockVaultGetWithNoActiveOperations(makeMorphoVault('vlt-galaxy-usdc'));

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

      it('should reject with an enriched ActiveOperationExistsError when a pending deposit already exists', async function () {
        mockBitGo.get.onFirstCall().returns(mockRequest(makeMorphoVault('vlt-galaxy-usdc')));
        mockBitGo.get.onSecondCall().returns(
          mockRequest({
            operations: [
              {
                operationId: 'existing-op-id',
                walletId: 'test-wallet-id',
                vaultId: 'vlt-galaxy-usdc',
                type: 'DEPOSIT',
                assetAmount: '1000000',
                state: 'pending',
                createdAt: '2026-05-14T07:12:00Z',
                updatedAt: '2026-05-14T07:12:00Z',
              },
            ],
            nextCursor: null,
          })
        );
        const sendManyStub = sinon.stub(wallet, 'sendMany');

        await assert.rejects(
          () => defiVault.depositToVault({ vaultId: 'vlt-galaxy-usdc', amount: '1000000' }),
          (err: Error) => {
            (err instanceof ActiveOperationExistsError).should.be.true();
            const activeErr = err as ActiveOperationExistsError;
            activeErr.operationId.should.equal('existing-op-id');
            activeErr.vaultId.should.equal('vlt-galaxy-usdc');
            activeErr.assetAmount.should.equal('1000000');
            return true;
          }
        );
        sendManyStub.called.should.be.false();
      });

      it('should not block a deposit when only a withdraw is active (pre-flight filters type DEPOSIT)', async function () {
        const preflightReq = mockRequest({ operations: [], nextCursor: null });
        mockBitGo.get.onFirstCall().returns(mockRequest(makeMorphoVault('vlt-galaxy-usdc')));
        mockBitGo.get.onSecondCall().returns(preflightReq);

        const operationId = 'op-uuid-not-blocked';
        const sendManyStub = sinon.stub(wallet, 'sendMany');
        sendManyStub.onFirstCall().resolves({
          txRequest: {
            txRequestId: 'txreq-approve-nb',
            intent: { intentType: 'defi-approve' },
            transactions: [{ unsignedTx: { coinSpecific: { operationId } } }],
          },
        });
        sendManyStub.onSecondCall().resolves({
          txRequest: {
            txRequestId: 'txreq-deposit-nb',
            intent: { intentType: 'defi-deposit' },
            transactions: [{ unsignedTx: { coinSpecific: { operationId } } }],
          },
        });

        const rawResult = await defiVault.depositToVault({ vaultId: 'vlt-galaxy-usdc', amount: '1000000' });
        const result = rawResult as Erc4626DepositResult;
        result.operationId.should.equal(operationId);
        sendManyStub.calledTwice.should.be.true();

        // The pre-flight must scope to pending DEPOSITs for this wallet
        preflightReq.query.firstCall.args[0].should.deepEqual({
          walletId: 'test-wallet-id',
          state: 'pending',
          type: 'DEPOSIT',
        });
      });

      it('should propagate deposit sendMany failure without cleanup', async function () {
        mockVaultGetWithNoActiveOperations(makeMorphoVault('vlt-galaxy-usdc'));

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

      it('should throw if vaultId is missing', async function () {
        await assert.rejects(() => defiVault.depositToVault({ vaultId: '', amount: '1000000' }), {
          message: 'vaultId is required',
        });
      });

      it('should throw if amount is missing', async function () {
        await assert.rejects(() => defiVault.depositToVault({ vaultId: 'vlt-1', amount: '' }), {
          message: 'amount is required',
        });
      });
    });

    describe('aave_v3 provider', function () {
      it('should call sendMany for approve and deposit on happy path', async function () {
        mockVaultGetWithNoActiveOperations(makeAaveVault('vlt-aave-usdc'));

        const operationId = 'op-aave-123';
        const sendManyStub = sinon.stub(wallet, 'sendMany');
        sendManyStub.onFirstCall().resolves({
          txRequest: {
            txRequestId: 'txreq-aave-approve-1',
            intent: { intentType: 'defi-approve' },
            transactions: [{ unsignedTx: { coinSpecific: { operationId } } }],
          },
        });
        sendManyStub.onSecondCall().resolves({
          txRequest: {
            txRequestId: 'txreq-aave-deposit-1',
            intent: { intentType: 'defi-deposit' },
            transactions: [{ unsignedTx: { coinSpecific: { operationId } } }],
          },
        });

        const result = await defiVault.depositToVault({
          vaultId: 'vlt-aave-usdc',
          amount: '1000000',
        });

        (result as any).operationId.should.equal(operationId);
        (result as any).txRequestIds.approve.should.equal('txreq-aave-approve-1');
        (result as any).txRequestIds.deposit.should.equal('txreq-aave-deposit-1');
        sendManyStub.calledTwice.should.be.true();

        const approveArgs: any = sendManyStub.firstCall.args[0];
        approveArgs.type.should.equal('defiApprove');
        approveArgs.defiParams.should.deepEqual({ vaultId: 'vlt-aave-usdc', amount: '1000000' });

        const depositArgs: any = sendManyStub.secondCall.args[0];
        depositArgs.type.should.equal('defiDeposit');
        depositArgs.defiParams.should.deepEqual({
          vaultId: 'vlt-aave-usdc',
          amount: '1000000',
          operationId,
        });
      });

      it('should extract operationId from the lite apiVersion coinSpecific', async function () {
        mockVaultGetWithNoActiveOperations(makeAaveVault('vlt-aave-usdc'));

        const operationId = 'op-aave-lite';
        const sendManyStub = sinon.stub(wallet, 'sendMany');
        sendManyStub.onFirstCall().resolves({
          txRequest: {
            txRequestId: 'txreq-aave-approve-lite',
            unsignedTxs: [{ coinSpecific: { operationId } }],
          },
        });
        sendManyStub.onSecondCall().resolves({
          txRequest: { txRequestId: 'txreq-aave-deposit-lite' },
        });

        const result = await defiVault.depositToVault({ vaultId: 'vlt-aave-usdc', amount: '1000000' });

        (result as any).operationId.should.equal(operationId);
        (result as any).txRequestIds.approve.should.equal('txreq-aave-approve-lite');
        (result as any).txRequestIds.deposit.should.equal('txreq-aave-deposit-lite');
      });

      it('should throw when operationId is absent from the approve txRequest', async function () {
        mockVaultGetWithNoActiveOperations(makeAaveVault('vlt-aave-usdc'));

        const sendManyStub = sinon.stub(wallet, 'sendMany');
        sendManyStub.resolves({
          txRequest: {
            txRequestId: 'txreq-aave-approve-missing',
            transactions: [{ unsignedTx: { coinSpecific: {} } }],
          },
        });

        await assert.rejects(() => defiVault.depositToVault({ vaultId: 'vlt-aave-usdc', amount: '1000000' }), {
          message: 'operationId not found in approve txRequest response',
        });
        sendManyStub.calledOnce.should.be.true();
      });

      it('should propagate deposit sendMany failure without cleanup', async function () {
        mockVaultGetWithNoActiveOperations(makeAaveVault('vlt-aave-usdc'));

        const operationId = 'op-aave-failure';
        const sendManyStub = sinon.stub(wallet, 'sendMany');
        sendManyStub.onFirstCall().resolves({
          txRequest: {
            txRequestId: 'txreq-aave-approve-failure',
            transactions: [{ unsignedTx: { coinSpecific: { operationId } } }],
          },
        });
        sendManyStub.onSecondCall().rejects(new Error('Aave deposit creation failed'));

        await assert.rejects(() => defiVault.depositToVault({ vaultId: 'vlt-aave-usdc', amount: '1000000' }), {
          message: 'Aave deposit creation failed',
        });
        mockBitGo.del.called.should.be.false();
      });
    });

    it('should throw if vaultId is missing', async function () {
      await assert.rejects(() => defiVault.depositToVault({ vaultId: '', amount: '1000000' }), {
        message: 'vaultId is required',
      });
    });

    it('should throw if amount is missing', async function () {
      mockBitGo.get.returns(mockRequest(makeMorphoVault('vlt-1')));

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
        state: 'pending',
        // defi-service semantics (verified live): associatedTxRequestId = the
        // approve leg (set at approve-leg creation); txRequestId = the deposit
        // leg (null until it is issued).
        txRequestId: undefined,
        associatedTxRequestId: 'txreq-approve-existing',
        createdAt: '2026-05-14T07:12:00Z',
        updatedAt: '2026-05-14T07:12:00Z',
      };

      // getOperation call
      const getOpReq = mockRequest(operation);
      mockBitGo.get.returns(getOpReq);

      // deposit sendMany
      const sendManyStub = sinon.stub(wallet, 'sendMany');
      sendManyStub.resolves({
        pendingApproval: { id: 'pa-deposit-resume' },
        txRequest: {
          txRequestId: 'txreq-deposit-resume',
          intent: { intentType: 'defi-deposit', operationId: 'op-resume-1' },
        },
      });

      const rawResult = await defiVault.resumeDeposit({ operationId: 'op-resume-1', vaultId: 'vlt-galaxy-usdc' });
      // resumeDeposit's Erc4626 branch — the union result needs narrowing for property access.
      const result = rawResult as Erc4626DepositResult;

      result.operationId.should.equal('op-resume-1');
      result.txRequestIds.approve.should.equal('txreq-approve-existing');
      result.txRequestIds.deposit.should.equal('txreq-deposit-resume');
      result.pendingApprovalIds!.deposit!.should.equal('pa-deposit-resume');

      // getOperation must hit the vault-scoped route with the enterprise-id header
      mockBitGo.get.firstCall.args[0].should.endWith(
        '/api/defi-service/v1/vaults/vlt-galaxy-usdc/operations/op-resume-1'
      );
      getOpReq.set.firstCall.args.should.deepEqual(['enterprise-id', 'test-enterprise-id']);

      // Verify sendMany was called with correct defiParams
      const depositArgs = sendManyStub.firstCall.args[0] as
        | { type: string; defiParams: { vaultId: string; amount: string; operationId: string } }
        | undefined;
      assert.ok(depositArgs, 'sendMany must have been called');
      depositArgs.type.should.equal('defiDeposit');
      depositArgs.defiParams.vaultId.should.equal('vlt-galaxy-usdc');
      depositArgs.defiParams.amount.should.equal('1000000');
      depositArgs.defiParams.operationId.should.equal('op-resume-1');
    });

    it('should return the existing legs without issuing a new deposit when the operation is fully created', async function () {
      const operation = {
        operationId: 'op-already-done',
        walletId: 'test-wallet-id',
        vaultId: 'vlt-galaxy-usdc',
        type: 'DEPOSIT',
        assetAmount: '1000000',
        state: 'pending',
        // Live semantics: associatedTxRequestId = approve leg, txRequestId = deposit leg.
        txRequestId: 'txreq-deposit-x',
        associatedTxRequestId: 'txreq-approve-x',
        createdAt: '2026-05-14T07:12:00Z',
        updatedAt: '2026-05-14T07:12:00Z',
      };

      mockBitGo.get.returns(mockRequest(operation));
      const sendManyStub = sinon.stub(wallet, 'sendMany');

      const rawResult = await defiVault.resumeDeposit({ operationId: 'op-already-done', vaultId: 'vlt-galaxy-usdc' });
      const result = rawResult as Erc4626DepositResult;

      result.operationId.should.equal('op-already-done');
      result.txRequestIds.approve.should.equal('txreq-approve-x');
      result.txRequestIds.deposit.should.equal('txreq-deposit-x');
      // The fully-created path carries no pending-approval ids — the operation
      // record has none; callers discover PAs via the wallet's approval listing.
      result.should.not.have.property('pendingApprovalIds');
      sendManyStub.called.should.be.false();
    });

    it('should throw for a cancelled operation — resuming a dead operation must not issue a new leg', async function () {
      const operation = {
        operationId: 'op-cancelled',
        walletId: 'test-wallet-id',
        vaultId: 'vlt-galaxy-usdc',
        type: 'DEPOSIT',
        assetAmount: '1000000',
        state: 'cancelled',
        associatedTxRequestId: 'txreq-approve-x',
        createdAt: '2026-05-14T07:12:00Z',
        updatedAt: '2026-05-14T07:12:00Z',
      };

      mockBitGo.get.returns(mockRequest(operation));
      const sendManyStub = sinon.stub(wallet, 'sendMany');

      await assert.rejects(() => defiVault.resumeDeposit({ operationId: 'op-cancelled', vaultId: 'vlt-galaxy-usdc' }), {
        message: 'operation op-cancelled is cancelled; nothing to resume',
      });
      sendManyStub.called.should.be.false();
    });

    it('should throw when the operation belongs to a different wallet in the same enterprise', async function () {
      const operation = {
        operationId: 'op-other-wallet',
        walletId: 'some-other-wallet-id',
        vaultId: 'vlt-galaxy-usdc',
        type: 'DEPOSIT',
        assetAmount: '1000000',
        state: 'pending',
        associatedTxRequestId: 'txreq-approve-x',
        createdAt: '2026-05-14T07:12:00Z',
        updatedAt: '2026-05-14T07:12:00Z',
      };

      mockBitGo.get.returns(mockRequest(operation));
      const sendManyStub = sinon.stub(wallet, 'sendMany');

      await assert.rejects(
        () => defiVault.resumeDeposit({ operationId: 'op-other-wallet', vaultId: 'vlt-galaxy-usdc' }),
        { message: 'operation op-other-wallet does not belong to wallet test-wallet-id' }
      );
      sendManyStub.called.should.be.false();
    });

    it('should still throw for an unrecoverable operation with no approve txRequest', async function () {
      const operation = {
        operationId: 'op-no-legs',
        walletId: 'test-wallet-id',
        vaultId: 'vlt-galaxy-usdc',
        type: 'DEPOSIT',
        assetAmount: '1000000',
        state: 'pending',
        createdAt: '2026-05-14T07:12:00Z',
        updatedAt: '2026-05-14T07:12:00Z',
      };

      mockBitGo.get.returns(mockRequest(operation));

      await assert.rejects(() => defiVault.resumeDeposit({ operationId: 'op-no-legs', vaultId: 'vlt-galaxy-usdc' }), {
        message: 'Approve txRequest not found for this operation; cannot resume',
      });
    });

    it('should throw if the operation belongs to a different vault', async function () {
      const operation = {
        operationId: 'op-other-vault',
        walletId: 'test-wallet-id',
        vaultId: 'vlt-other-usdc',
        type: 'DEPOSIT',
        assetAmount: '1000000',
        state: 'pending',
        associatedTxRequestId: 'txreq-approve-x',
        createdAt: '2026-05-14T07:12:00Z',
        updatedAt: '2026-05-14T07:12:00Z',
      };

      mockBitGo.get.returns(mockRequest(operation));

      await assert.rejects(
        () => defiVault.resumeDeposit({ operationId: 'op-other-vault', vaultId: 'vlt-galaxy-usdc' }),
        { message: 'operation op-other-vault does not belong to vault vlt-galaxy-usdc' }
      );
    });

    it('should throw if vaultId or operationId is missing', async function () {
      await assert.rejects(() => defiVault.resumeDeposit({ operationId: '', vaultId: '' }), {
        message: 'vaultId and operationId are required',
      });
    });
  });

  describe('getOperation', function () {
    it('should fetch an operation by ID from the vault-scoped route with the enterprise-id header', async function () {
      const operation = {
        operationId: 'op-get-1',
        walletId: 'test-wallet-id',
        vaultId: 'vlt-galaxy-usdc',
        type: 'DEPOSIT',
        assetAmount: '1000000',
        state: 'completed',
        txRequestId: 'txreq-1',
        associatedTxRequestId: 'txreq-2',
        createdAt: '2026-05-14T07:12:00Z',
        updatedAt: '2026-05-14T07:18:00Z',
      };

      const req = mockRequest(operation);
      mockBitGo.get.returns(req);

      const result = await defiVault.getOperation({ vaultId: 'vlt-galaxy-usdc', operationId: 'op-get-1' });
      result.should.deepEqual(operation);

      mockBitGo.get.firstCall.args[0].should.endWith('/api/defi-service/v1/vaults/vlt-galaxy-usdc/operations/op-get-1');
      req.set.firstCall.args.should.deepEqual(['enterprise-id', 'test-enterprise-id']);
    });

    it('should throw if vaultId or operationId is missing', async function () {
      await assert.rejects(() => defiVault.getOperation({ vaultId: '', operationId: '' }), {
        message: 'vaultId and operationId are required',
      });
    });
  });

  describe('listOperations', function () {
    it('should list operations for a vault from the vault-scoped route', async function () {
      const listResult = {
        operations: [
          {
            operationId: 'op-1',
            walletId: 'test-wallet-id',
            vaultId: 'vlt-galaxy-usdc',
            type: 'DEPOSIT',
            assetAmount: '1000000',
            state: 'completed',
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
        walletId: 'test-wallet-id',
        state: 'pending',
        type: 'DEPOSIT',
        limit: 10,
        nextCursor: 'cursor-abc',
      });

      result.operations.length.should.equal(1);
      result.operations[0].state.should.equal('completed');
      result.nextCursor!.should.equal('cursor-abc');

      // vaultId moves from the query into the path
      mockBitGo.get.firstCall.args[0].should.endWith('/api/defi-service/v1/vaults/vlt-galaxy-usdc/operations');
      req.set.firstCall.args.should.deepEqual(['enterprise-id', 'test-enterprise-id']);

      // Verify query params — nextCursor (not cursor), no vaultId in the query
      const queryArgs = req.query.firstCall.args[0];
      queryArgs.should.not.have.property('vaultId');
      queryArgs.walletId.should.equal('test-wallet-id');
      queryArgs.state.should.equal('pending');
      queryArgs.type.should.equal('DEPOSIT');
      queryArgs.limit.should.equal(10);
      queryArgs.nextCursor.should.equal('cursor-abc');
    });

    it('should throw if vaultId is missing', async function () {
      await assert.rejects(() => defiVault.listOperations({ vaultId: '' }), { message: 'vaultId is required' });
    });
  });

  describe('withdrawFromVault', function () {
    it('should call sendMany with defiWithdraw and return operationId + txRequestId', async function () {
      const operationId = 'op-withdraw-1';

      const sendManyStub = sinon.stub(wallet, 'sendMany');
      sendManyStub.resolves({
        txRequest: {
          txRequestId: 'txreq-withdraw-1',
          transactions: [{ unsignedTx: { coinSpecific: { operationId } } }],
        },
      });

      const result = await defiVault.withdrawFromVault({
        vaultId: 'vlt-galaxy-usdc',
        amount: '500000',
      });

      result.operationId.should.equal(operationId);
      result.should.not.have.property('pendingApprovalId');

      sendManyStub.calledOnce.should.be.true();
      const args: any = sendManyStub.firstCall.args[0];
      args.type.should.equal('defiWithdraw');
      args.defiParams.vaultId.should.equal('vlt-galaxy-usdc');
      args.defiParams.amount.should.equal('500000');
    });
    it('should surface the pendingApproval id when a policy gates the withdraw', async function () {
      const operationId = 'op-withdraw-gated';

      const sendManyStub = sinon.stub(wallet, 'sendMany');
      sendManyStub.resolves({
        pendingApproval: { id: 'pa-withdraw-1' },
        txRequest: {
          txRequestId: 'txreq-withdraw-gated',
          transactions: [{ unsignedTx: { coinSpecific: { operationId } } }],
        },
      });

      const result = await defiVault.withdrawFromVault({
        vaultId: 'vlt-galaxy-usdc',
        amount: '500000',
      });

      result.operationId.should.equal(operationId);
      result.txRequestId.should.equal('txreq-withdraw-gated');
      result.pendingApprovalId!.should.equal('pa-withdraw-1');
    });

    it('should extract operationId from lite apiVersion coinSpecific', async function () {
      const operationId = 'op-withdraw-lite';

      const sendManyStub = sinon.stub(wallet, 'sendMany');
      sendManyStub.resolves({
        txRequest: {
          txRequestId: 'txreq-withdraw-lite',
          unsignedTxs: [{ coinSpecific: { operationId } }],
        },
      });

      const result = await defiVault.withdrawFromVault({ vaultId: 'vlt-galaxy-usdc', amount: '500000' });

      result.operationId.should.equal(operationId);
      result.txRequestId.should.equal('txreq-withdraw-lite');
    });

    it('should throw when operationId is absent from the withdraw txRequest response', async function () {
      const sendManyStub = sinon.stub(wallet, 'sendMany');
      sendManyStub.resolves({
        txRequest: {
          txRequestId: 'txreq-withdraw-missing',
          transactions: [{ unsignedTx: { coinSpecific: {} } }],
        },
      });

      await assert.rejects(() => defiVault.withdrawFromVault({ vaultId: 'vlt-galaxy-usdc', amount: '500000' }), {
        message: 'operationId not found in withdraw txRequest response',
      });
    });

    it('should pass walletPassphrase when provided', async function () {
      const operationId = 'op-withdraw-opts';

      const sendManyStub = sinon.stub(wallet, 'sendMany');
      sendManyStub.resolves({
        txRequest: {
          txRequestId: 'txreq-withdraw-opts',
          transactions: [{ unsignedTx: { coinSpecific: { operationId } } }],
        },
      });

      await defiVault.withdrawFromVault({
        vaultId: 'vlt-galaxy-usdc',
        amount: '500000',
        walletPassphrase: 'test-passphrase',
      });

      const args: any = sendManyStub.firstCall.args[0];
      args.walletPassphrase.should.equal('test-passphrase');
    });

    it('should throw if vaultId is missing', async function () {
      await assert.rejects(() => defiVault.withdrawFromVault({ vaultId: '', amount: '500000' }), {
        message: 'vaultId is required',
      });
    });

    it('should throw if amount is missing', async function () {
      await assert.rejects(() => defiVault.withdrawFromVault({ vaultId: 'vlt-1', amount: '' }), {
        message: 'amount is required',
      });
    });

    describe('prebuildTransactionTxRequests defiWithdraw defiParams validation', function () {
      it('should throw when defiParams is missing', async function () {
        await assert.rejects(
          () => (wallet as any).prebuildTransactionTxRequests({ type: 'defiWithdraw' }),
          /defiWithdraw\.defiParams/
        );
      });

      it('should throw when vaultId is not a string', async function () {
        await assert.rejects(
          () =>
            (wallet as any).prebuildTransactionTxRequests({
              type: 'defiWithdraw',
              defiParams: { vaultId: 123, amount: '500000' },
            }),
          /defiWithdraw\.defiParams/
        );
      });

      it('should throw when amount is not a string', async function () {
        await assert.rejects(
          () =>
            (wallet as any).prebuildTransactionTxRequests({
              type: 'defiWithdraw',
              defiParams: { vaultId: 'vlt-1', amount: 500000 },
            }),
          /defiWithdraw\.defiParams/
        );
      });
    });
  });

  // wrap and unwrap are the same orchestrator with a different sendMany type, so
  // the suite is generated over both to keep the two from drifting apart.
  (
    [
      ['wrap', 'wrapNative'],
      ['unwrap', 'unwrapNative'],
    ] as const
  ).forEach(function ([method, sendManyType]) {
    describe(method, function () {
      it(`should call sendMany once with ${sendManyType} type and return txRequestId`, async function () {
        const sendManyStub = sinon.stub(wallet, 'sendMany');
        sendManyStub.resolves({ txRequest: { txRequestId: `txreq-${method}-1` } });

        const result = await defiVault[method]({
          vaultId: 'vlt-galaxy-weth',
          amount: '1000000000000000000',
        });

        result.txRequestId.should.equal(`txreq-${method}-1`);

        sendManyStub.calledOnce.should.be.true();
        const args: any = sendManyStub.firstCall.args[0];
        args.type.should.equal(sendManyType);
        args.defiParams.should.deepEqual({
          vaultId: 'vlt-galaxy-weth',
          amount: '1000000000000000000',
        });
      });

      it('should extract txRequestId from the lite sendMany response shape', async function () {
        const sendManyStub = sinon.stub(wallet, 'sendMany');
        sendManyStub.resolves({ txRequestId: `txreq-${method}-lite` });

        const result = await defiVault[method]({ vaultId: 'vlt-galaxy-weth', amount: '5000' });

        result.txRequestId.should.equal(`txreq-${method}-lite`);
      });

      it('should throw when txRequestId is absent from the sendMany response', async function () {
        const sendManyStub = sinon.stub(wallet, 'sendMany');
        sendManyStub.resolves({ txRequest: {} });

        await assert.rejects(() => defiVault[method]({ vaultId: 'vlt-galaxy-weth', amount: '5000' }), {
          message: 'txRequestId not found in sendMany response',
        });
      });

      it('should leave operationId undefined in v1', async function () {
        // No operation is minted for wrap/unwrap until M5. Assert it stays absent
        // even when the response happens to carry one, so nobody "fixes" this by
        // wiring up extractOperationId.
        const sendManyStub = sinon.stub(wallet, 'sendMany');
        sendManyStub.resolves({
          txRequest: {
            txRequestId: `txreq-${method}-noop`,
            transactions: [{ unsignedTx: { coinSpecific: { operationId: 'op-should-be-ignored' } } }],
          },
        });

        const result = await defiVault[method]({ vaultId: 'vlt-galaxy-weth', amount: '5000' });

        assert.strictEqual(result.operationId, undefined);
      });

      it('should forward walletPassphrase when provided', async function () {
        const sendManyStub = sinon.stub(wallet, 'sendMany');
        sendManyStub.resolves({ txRequest: { txRequestId: `txreq-${method}-hot` } });

        await defiVault[method]({
          vaultId: 'vlt-galaxy-weth',
          amount: '5000',
          walletPassphrase: 'test-passphrase',
        });

        const args: any = sendManyStub.firstCall.args[0];
        args.walletPassphrase.should.equal('test-passphrase');
      });

      it('should omit walletPassphrase entirely when absent (custody path)', async function () {
        const sendManyStub = sinon.stub(wallet, 'sendMany');
        sendManyStub.resolves({ txRequest: { txRequestId: `txreq-${method}-custody` } });

        await defiVault[method]({ vaultId: 'vlt-galaxy-weth', amount: '5000' });

        const args: any = sendManyStub.firstCall.args[0];
        args.should.not.have.property('walletPassphrase');
      });

      it('should throw if vaultId is missing, without any network call', async function () {
        const sendManyStub = sinon.stub(wallet, 'sendMany');

        await assert.rejects(() => defiVault[method]({ vaultId: '', amount: '5000' }), {
          message: 'vaultId is required',
        });
        sendManyStub.called.should.be.false();
      });

      it('should throw if amount is missing, without any network call', async function () {
        const sendManyStub = sinon.stub(wallet, 'sendMany');

        await assert.rejects(() => defiVault[method]({ vaultId: 'vlt-galaxy-weth', amount: '' }), {
          message: 'amount must be a positive unsigned decimal integer string',
        });
        sendManyStub.called.should.be.false();
      });

      describe('amount boundary validation', function () {
        // The downstream BigIntFromString codec accepts all of these via JS's BigInt() constructor,
        // so the client-side guard is the only thing standing between a malformed/malicious amount
        // and a value-moving WETH9 deposit()/withdraw() call.
        const rejectedAmounts = [
          ['-1', 'negative'],
          ['0', 'zero'],
          ['0xabc', 'hexadecimal'],
          ['1.5', 'decimal point'],
          ['1e18', 'scientific notation'],
          ['+100', 'explicit sign'],
          [' 100', 'leading whitespace'],
          ['100 ', 'trailing whitespace'],
          ['abc', 'non-numeric'],
        ] as const;
        rejectedAmounts.forEach(([amount, why]) => {
          it(`should reject a ${why} amount (${JSON.stringify(amount)}), without any network call`, async function () {
            const sendManyStub = sinon.stub(wallet, 'sendMany');

            await assert.rejects(() => defiVault[method]({ vaultId: 'vlt-galaxy-weth', amount }), {
              message: 'amount must be a positive unsigned decimal integer string',
            });
            sendManyStub.called.should.be.false();
          });
        });

        ['1', '1000000000000000000', '007'].forEach((amount) => {
          it(`should accept amount ${JSON.stringify(amount)} and forward it verbatim`, async function () {
            const sendManyStub = sinon.stub(wallet, 'sendMany');
            sendManyStub.resolves({ txRequest: { txRequestId: 'txreq-boundary' } });

            await defiVault[method]({ vaultId: 'vlt-galaxy-weth', amount });

            const args: any = sendManyStub.firstCall.args[0];
            args.defiParams.amount.should.equal(amount);
          });
        });
      });

      describe('vaultId trimming', function () {
        it('should throw for a whitespace-only vaultId, without any network call', async function () {
          const sendManyStub = sinon.stub(wallet, 'sendMany');

          await assert.rejects(() => defiVault[method]({ vaultId: '   ', amount: '5000' }), {
            message: 'vaultId is required',
          });
          sendManyStub.called.should.be.false();
        });

        it('should trim surrounding whitespace from vaultId before calling sendMany', async function () {
          const sendManyStub = sinon.stub(wallet, 'sendMany');
          sendManyStub.resolves({ txRequest: { txRequestId: 'txreq-trim' } });

          await defiVault[method]({ vaultId: '  vlt-galaxy-weth  ', amount: '5000' });

          const args: any = sendManyStub.firstCall.args[0];
          args.defiParams.vaultId.should.equal('vlt-galaxy-weth');
        });
      });

      it('should throw a clear client-side error for a non-EVM coin, without any network call', async function () {
        mockBaseCoin.getFamily.returns('btc');
        mockBaseCoin.getConfig.returns({ features: [] });
        const sendManyStub = sinon.stub(wallet, 'sendMany');

        await assert.rejects(() => defiVault[method]({ vaultId: 'vlt-galaxy-weth', amount: '5000' }), {
          message: 'wrap/unwrap is not supported for btc wallets',
        });
        sendManyStub.called.should.be.false();
      });

      describe(`prebuildTransactionTxRequests ${sendManyType} defiParams validation`, function () {
        it('should throw when defiParams is missing', async function () {
          await assert.rejects(
            () => (wallet as any).prebuildTransactionTxRequests({ type: sendManyType }),
            new RegExp(`${sendManyType}\\.defiParams`)
          );
        });

        it('should throw when vaultId is not a string', async function () {
          await assert.rejects(
            () =>
              (wallet as any).prebuildTransactionTxRequests({
                type: sendManyType,
                defiParams: { vaultId: 123, amount: '5000' },
              }),
            new RegExp(`${sendManyType}\\.defiParams`)
          );
        });

        it('should throw when amount is not a numeric string', async function () {
          await assert.rejects(
            () =>
              (wallet as any).prebuildTransactionTxRequests({
                type: sendManyType,
                defiParams: { vaultId: 'vlt-1', amount: 5000 },
              }),
            new RegExp(`${sendManyType}\\.defiParams`)
          );
        });
      });
    });
  });

  describe('cold wallet rejection', function () {
    function makeColdWalletData(extra?: Record<string, unknown>) {
      return {
        id: 'test-wallet-id',
        coin: 'eth',
        keys: ['user-key', 'backup-key', 'bitgo-key'],
        enterprise: 'test-enterprise-id',
        ...extra,
      };
    }

    const coldRejection = 'DeFi vault flows are not supported for cold wallets';

    it('rejects depositToVault for a cold wallet before any network call', async function () {
      const coldDefi = new Wallet(mockBitGo, mockBaseCoin, makeColdWalletData({ type: 'cold' })).defi;

      await assert.rejects(() => coldDefi.depositToVault({ vaultId: 'vlt-galaxy-usdc', amount: '1000000' }), {
        message: coldRejection,
      });
      mockBitGo.get.called.should.be.false();
      mockBitGo.post.called.should.be.false();
    });

    it('rejects resumeDeposit for a cold wallet before any network call', async function () {
      const coldDefi = new Wallet(mockBitGo, mockBaseCoin, makeColdWalletData({ type: 'cold' })).defi;

      await assert.rejects(() => coldDefi.resumeDeposit({ operationId: 'op-1', vaultId: 'vlt-galaxy-usdc' }), {
        message: coldRejection,
      });
      mockBitGo.get.called.should.be.false();
    });

    it('rejects withdrawFromVault for a cold wallet before any network call', async function () {
      const coldDefi = new Wallet(mockBitGo, mockBaseCoin, makeColdWalletData({ type: 'cold' })).defi;

      await assert.rejects(() => coldDefi.withdrawFromVault({ vaultId: 'vlt-galaxy-usdc', amount: '1000000' }), {
        message: coldRejection,
      });
      mockBitGo.get.called.should.be.false();
    });

    it('rejects wrap and unwrap for a cold wallet before any network call', async function () {
      const coldDefi = new Wallet(mockBitGo, mockBaseCoin, makeColdWalletData({ type: 'cold' })).defi;

      await assert.rejects(() => coldDefi.wrap({ vaultId: 'vlt-galaxy-weth', amount: '1000' }), {
        message: coldRejection,
      });
      await assert.rejects(() => coldDefi.unwrap({ vaultId: 'vlt-galaxy-weth', amount: '1000' }), {
        message: coldRejection,
      });
      mockBitGo.get.called.should.be.false();
    });

    it('rejects on isCold alone, even when type is not set', async function () {
      const coldDefi = new Wallet(mockBitGo, mockBaseCoin, makeColdWalletData({ isCold: true })).defi;

      await assert.rejects(() => coldDefi.wrap({ vaultId: 'vlt-galaxy-weth', amount: '1000' }), {
        message: coldRejection,
      });
    });

    it('does not reject read-only flows for a cold wallet', async function () {
      const coldDefi = new Wallet(mockBitGo, mockBaseCoin, makeColdWalletData({ type: 'cold' })).defi;
      mockBitGo.get.returns(mockRequest(makeMorphoVault('vlt-galaxy-usdc')));

      await coldDefi.getVaultConfig({ vaultId: 'vlt-galaxy-usdc' });
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

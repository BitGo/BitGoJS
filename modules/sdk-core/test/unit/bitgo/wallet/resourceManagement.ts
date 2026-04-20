import * as assert from 'assert';
import sinon from 'sinon';
import 'should';
import 'should-sinon';
import { Wallet } from '../../../../src';

describe('Wallet - resource management', function () {
  let wallet: Wallet;
  let mockBitGo: any;
  let mockBaseCoin: any;
  let mockWalletData: any;

  const delegations = [
    { receiverAddress: 'TRecv1', amount: '1000', resource: 'ENERGY' },
    { receiverAddress: 'TRecv2', amount: '2000', resource: 'BANDWIDTH' },
  ];

  const undelegations = [{ receiverAddress: 'TRecv1', amount: '1000', resource: 'ENERGY' }];

  function stubPost(response: any) {
    const resultStub = sinon.stub().resolves(response);
    const sendStub = sinon.stub().returns({ result: resultStub });
    mockBitGo.post.returns({ send: sendStub });
    return { sendStub };
  }

  beforeEach(function () {
    mockBitGo = {
      post: sinon.stub(),
      setRequestTracer: sinon.stub(),
    };

    mockBaseCoin = {
      url: sinon.stub().callsFake((path: string) => `/ttrx${path}`),
      supportsResourceDelegation: sinon.stub().returns(true),
      supportsTss: sinon.stub().returns(false),
      getMPCAlgorithm: sinon.stub().returns('ecdsa'),
      getFullName: sinon.stub().returns('Tron'),
      postProcessPrebuild: sinon.stub().callsFake((prebuild: any) => Promise.resolve(prebuild)),
    };

    mockWalletData = {
      id: 'test-wallet-id',
      keys: ['user-key', 'backup-key', 'bitgo-key'],
      type: 'hot',
      multisigType: 'hot',
    };

    wallet = new Wallet(mockBitGo, mockBaseCoin, mockWalletData);
  });

  afterEach(function () {
    sinon.restore();
  });

  // ---------------------------------------------------------------------------
  // buildResourceDelegations
  // ---------------------------------------------------------------------------
  describe('buildResourceDelegations', function () {
    it('should throw if coin does not support resource delegation', async function () {
      mockBaseCoin.supportsResourceDelegation.returns(false);
      await (wallet.buildResourceDelegations({ delegations }) as any).should.be.rejectedWith(
        'Tron does not support resource delegation.'
      );
    });

    it('should throw if delegations array is empty', async function () {
      await (wallet.buildResourceDelegations({ delegations: [] }) as any).should.be.rejectedWith(
        'delegations must be a non-empty array.'
      );
    });

    it('should POST to /delegateResources/build and return prebuilds with walletId', async function () {
      stubPost({ transactions: [{ txHex: 'aaa' }, { txHex: 'bbb' }], errors: [] });

      const result = await wallet.buildResourceDelegations({ delegations });

      result.prebuilds.should.have.length(2);
      result.buildFailures.should.have.length(0);
      result.prebuilds[0].walletId.should.equal('test-wallet-id');
      result.prebuilds[1].walletId.should.equal('test-wallet-id');
      sinon.assert.calledOnce(mockBitGo.post);
      (mockBitGo.post.firstCall.args[0] as string).should.containEql('/delegateResources/build');
    });

    it('should return buildFailures when API returns errors', async function () {
      stubPost({
        transactions: [{ txHex: 'aaa' }],
        errors: [{ error: 'insufficient balance', receiverAddress: 'TRecv2' }],
      });

      const result = await wallet.buildResourceDelegations({ delegations });

      result.prebuilds.should.have.length(1);
      result.buildFailures.should.have.length(1);
      result.buildFailures[0].should.deepEqual({ message: 'insufficient balance', receiverAddress: 'TRecv2' });
    });

    it('should throw if API response is missing transactions array', async function () {
      stubPost({ errors: [] });

      await (wallet.buildResourceDelegations({ delegations }) as any).should.be.rejectedWith(
        'Unexpected response from /delegateResources/build: missing transactions array'
      );
    });

    it('should only send whitelisted params (delegations, apiVersion) to the API', async function () {
      const { sendStub } = stubPost({ transactions: [{ txHex: 'aaa' }], errors: [] });

      await wallet.buildResourceDelegations({ delegations, walletPassphrase: 'secret' });

      const bodyArg = sendStub.firstCall.args[0];
      bodyArg.should.have.property('delegations');
      bodyArg.should.not.have.property('walletPassphrase');
    });
  });

  // ---------------------------------------------------------------------------
  // buildResourceUndelegations
  // ---------------------------------------------------------------------------
  describe('buildResourceUndelegations', function () {
    it('should throw if undelegations array is empty', async function () {
      await (wallet.buildResourceUndelegations({ undelegations: [] }) as any).should.be.rejectedWith(
        'undelegations must be a non-empty array.'
      );
    });

    it('should POST to /undelegateResources/build and return prebuilds', async function () {
      stubPost({ transactions: [{ txHex: 'ccc' }], errors: [] });

      const result = await wallet.buildResourceUndelegations({ undelegations });

      result.prebuilds.should.have.length(1);
      result.buildFailures.should.have.length(0);
      sinon.assert.calledOnce(mockBitGo.post);
      (mockBitGo.post.firstCall.args[0] as string).should.containEql('/undelegateResources/build');
    });

    it('should return buildFailures when API returns errors for undelegations', async function () {
      stubPost({
        transactions: [],
        errors: [{ error: 'lock period active', receiverAddress: 'TRecv1' }],
      });

      const result = await wallet.buildResourceUndelegations({ undelegations });

      result.prebuilds.should.have.length(0);
      result.buildFailures.should.have.length(1);
      result.buildFailures[0].should.deepEqual({ message: 'lock period active', receiverAddress: 'TRecv1' });
    });
  });

  // ---------------------------------------------------------------------------
  // sendResourceDelegation (single)
  // ---------------------------------------------------------------------------
  describe('sendResourceDelegation', function () {
    it('should throw if coin does not support resource delegation', async function () {
      mockBaseCoin.supportsResourceDelegation.returns(false);
      await (wallet.sendResourceDelegation({ prebuildTx: { txHex: 'aaa' } as any }) as any).should.be.rejectedWith(
        'Tron does not support resource delegation.'
      );
    });

    it('should throw if prebuildTx is undefined for a non-custodial wallet', async function () {
      await (wallet.sendResourceDelegation({}) as any).should.be.rejectedWith(
        'Invalid prebuild for resource management transaction.'
      );
    });

    it('should call sendManyTxRequests for a TSS wallet', async function () {
      mockWalletData.multisigType = 'tss';
      wallet = new Wallet(mockBitGo, mockBaseCoin, mockWalletData);
      const sendManyStub = sinon.stub(wallet as any, 'sendManyTxRequests').resolves({ txid: 'tss-tx-1' });

      const result = await wallet.sendResourceDelegation({ prebuildTx: { txRequestId: 'req-1' } as any });

      result.should.deepEqual({ txid: 'tss-tx-1' });
      sendManyStub.should.be.calledOnce();
    });

    it('should call prebuildAndSignTransaction + submitTransaction for a hot wallet', async function () {
      const signedPrebuild = { txHex: 'signed-aaa', wallet };
      sinon.stub(wallet, 'prebuildAndSignTransaction').resolves(signedPrebuild as any);
      const submitStub = sinon.stub(wallet, 'submitTransaction').resolves({ txid: 'hot-tx-1' } as any);

      const result = await wallet.sendResourceDelegation({ prebuildTx: { txHex: 'aaa' } as any });

      result.should.deepEqual({ txid: 'hot-tx-1' });
      submitStub.should.be.calledOnce();
    });

    it('should call initiateTransaction for a custodial non-TSS wallet with stakingParams and recipients promoted from prebuildTx', async function () {
      mockWalletData.type = 'custodial';
      mockWalletData.multisigType = 'multisig';
      wallet = new Wallet(mockBitGo, mockBaseCoin, mockWalletData);
      const initiateStub = sinon.stub(wallet as any, 'initiateTransaction').resolves({ txid: 'custodial-tx-1' });

      const stakingParams = {
        actionType: 'delegateResource',
        owner_address: 'TOwner',
        receiver_address: 'TReceiver',
        receiverAddress: 'TReceiver',
        amount: '1000000000',
        resource: 'ENERGY',
      };
      const recipients = [{ address: 'TReceiver', amount: '0' }];

      const result = await wallet.sendResourceDelegation({
        prebuildTx: { txHex: 'aaa', stakingParams, recipients } as any,
      });

      result.should.deepEqual({ txid: 'custodial-tx-1' });
      initiateStub.should.be.calledOnce();
      const calledWith = initiateStub.firstCall.args[0];
      calledWith.should.containEql({ type: 'delegateResource', stakingParams, recipients });
    });
  });

  // ---------------------------------------------------------------------------
  // sendResourceDelegations (bulk)
  // ---------------------------------------------------------------------------
  describe('sendResourceDelegations', function () {
    beforeEach(function () {
      sinon.stub(wallet as any, 'getKeychainsAndValidatePassphrase').resolves();
    });

    it('should throw if coin does not support resource delegation', async function () {
      mockBaseCoin.supportsResourceDelegation.returns(false);
      await (wallet.sendResourceDelegations({ delegations }) as any).should.be.rejectedWith(
        'Tron does not support resource delegation.'
      );
    });

    it('should propagate build failures with receiverAddress into the failure array', async function () {
      sinon.stub(wallet as any, 'buildResourceManagementTransactions').resolves({
        prebuilds: [],
        buildFailures: [{ message: 'build error', receiverAddress: 'TRecv2' }],
      });

      const result = await wallet.sendResourceDelegations({ delegations });

      result.success.should.have.length(0);
      result.failure.should.have.length(1);
      result.failure[0].should.deepEqual({ message: 'build error', receiverAddress: 'TRecv2' });
    });

    it('should return all successes when no failures', async function () {
      sinon.stub(wallet as any, 'buildResourceManagementTransactions').resolves({
        prebuilds: [{ txHex: 'aaa' }, { txHex: 'bbb' }],
        buildFailures: [],
      });
      sinon.stub(wallet as any, 'sendResourceManagementTransaction').resolves({ txid: 'tx-ok' });

      const result = await wallet.sendResourceDelegations({ delegations });

      result.success.should.have.length(2);
      result.failure.should.have.length(0);
    });

    it('should capture send failures with the correct receiverAddress from input entries', async function () {
      sinon.stub(wallet as any, 'buildResourceManagementTransactions').resolves({
        prebuilds: [{ txHex: 'aaa' }, { txHex: 'bbb' }],
        buildFailures: [],
      });
      const sendStub = sinon.stub(wallet as any, 'sendResourceManagementTransaction');
      sendStub.onFirstCall().resolves({ txid: 'tx-1' });
      sendStub.onSecondCall().rejects(new Error('send failed'));

      const result = await wallet.sendResourceDelegations({ delegations });

      result.success.should.have.length(1);
      result.failure.should.have.length(1);
      result.failure[0].message.should.equal('send failed');
      result.failure[0].should.have.property('receiverAddress', 'TRecv2');
    });

    it('should combine build failures and send failures in the failure array', async function () {
      sinon.stub(wallet as any, 'buildResourceManagementTransactions').resolves({
        prebuilds: [{ txHex: 'aaa' }],
        buildFailures: [{ message: 'build error', receiverAddress: 'TRecv2' }],
      });
      sinon.stub(wallet as any, 'sendResourceManagementTransaction').rejects(new Error('send failed'));

      const result = await wallet.sendResourceDelegations({ delegations });

      result.success.should.have.length(0);
      result.failure.should.have.length(2);
      assert.ok(result.failure.find((f) => f.receiverAddress === 'TRecv2' && f.message === 'build error'));
      assert.ok(result.failure.find((f) => f.receiverAddress === 'TRecv1' && f.message === 'send failed'));
    });
  });

  // ---------------------------------------------------------------------------
  // sendResourceUndelegation (single)
  // ---------------------------------------------------------------------------
  describe('sendResourceUndelegation', function () {
    it('should throw if coin does not support resource delegation', async function () {
      mockBaseCoin.supportsResourceDelegation.returns(false);
      await (wallet.sendResourceUndelegation({ prebuildTx: { txHex: 'aaa' } as any }) as any).should.be.rejectedWith(
        'Tron does not support resource delegation.'
      );
    });

    it('should call sendManyTxRequests for a TSS wallet', async function () {
      mockWalletData.multisigType = 'tss';
      wallet = new Wallet(mockBitGo, mockBaseCoin, mockWalletData);
      const sendManyStub = sinon.stub(wallet as any, 'sendManyTxRequests').resolves({ txid: 'tss-undel-1' });

      const result = await wallet.sendResourceUndelegation({ prebuildTx: { txRequestId: 'req-2' } as any });

      result.should.deepEqual({ txid: 'tss-undel-1' });
      sendManyStub.should.be.calledOnce();
    });

    it('should call prebuildAndSignTransaction + submitTransaction for a hot wallet', async function () {
      const signedPrebuild = { txHex: 'signed-ccc', wallet };
      sinon.stub(wallet, 'prebuildAndSignTransaction').resolves(signedPrebuild as any);
      const submitStub = sinon.stub(wallet, 'submitTransaction').resolves({ txid: 'hot-undel-1' } as any);

      const result = await wallet.sendResourceUndelegation({ prebuildTx: { txHex: 'ccc' } as any });

      result.should.deepEqual({ txid: 'hot-undel-1' });
      submitStub.should.be.calledOnce();
    });
  });

  // ---------------------------------------------------------------------------
  // sendResourceUndelegations (bulk)
  // ---------------------------------------------------------------------------
  describe('sendResourceUndelegations', function () {
    beforeEach(function () {
      sinon.stub(wallet as any, 'getKeychainsAndValidatePassphrase').resolves();
    });

    it('should return all successes for undelegations', async function () {
      sinon.stub(wallet as any, 'buildResourceManagementTransactions').resolves({
        prebuilds: [{ txHex: 'ccc' }],
        buildFailures: [],
      });
      sinon.stub(wallet as any, 'sendResourceManagementTransaction').resolves({ txid: 'undel-tx-1' });

      const result = await wallet.sendResourceUndelegations({ undelegations });

      result.success.should.have.length(1);
      result.failure.should.have.length(0);
    });

    it('should capture send failures with correct receiverAddress for undelegations', async function () {
      sinon.stub(wallet as any, 'buildResourceManagementTransactions').resolves({
        prebuilds: [{ txHex: 'ccc' }],
        buildFailures: [],
      });
      sinon.stub(wallet as any, 'sendResourceManagementTransaction').rejects(new Error('undel send failed'));

      const result = await wallet.sendResourceUndelegations({ undelegations });

      result.failure.should.have.length(1);
      result.failure[0].message.should.equal('undel send failed');
      result.failure[0].should.have.property('receiverAddress', 'TRecv1');
    });

    it('should propagate undelegation build failures into the failure array', async function () {
      sinon.stub(wallet as any, 'buildResourceManagementTransactions').resolves({
        prebuilds: [],
        buildFailures: [{ message: 'lock period active', receiverAddress: 'TRecv1' }],
      });

      const result = await wallet.sendResourceUndelegations({ undelegations });

      result.success.should.have.length(0);
      result.failure.should.have.length(1);
      result.failure[0].should.deepEqual({ message: 'lock period active', receiverAddress: 'TRecv1' });
    });
  });
});

import * as sinon from 'sinon';

import 'should-http';
import 'should-sinon';
import '../../lib/asserts';

import * as express from 'express';

import { handleV2DelegateResources, handleV2UndelegateResources } from '../../../src/clientRoutes';

import { BitGo } from 'bitgo';

describe('Bulk resource management handlers', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.verifyAndRestore();
  });

  const delegations = [{ receiverAddress: 'TRecv1', amount: '1000', resource: 'ENERGY' }];
  const undelegations = [{ receiverAddress: 'TRecv1', amount: '1000', resource: 'ENERGY' }];

  function createDelegationMocks(result: unknown, opts: { supportsDelegation?: boolean; multisigType?: string } = {}) {
    const { supportsDelegation = true, multisigType = 'hot' } = opts;
    const sendStub = sandbox.stub().resolves(result);
    const walletStub = {
      _wallet: { multisigType },
      sendResourceDelegations: sendStub,
      sendResourceUndelegations: sandbox.stub(),
    };
    const coinStub = {
      supportsResourceDelegation: () => supportsDelegation,
      getFamily: () => 'trx',
      wallets: () => ({ get: () => Promise.resolve(walletStub) }),
    };
    return {
      bitgoStub: sinon.createStubInstance(BitGo as any, { coin: coinStub }),
      sendStub,
    };
  }

  function createUndelegationMocks(
    result: unknown,
    opts: { supportsDelegation?: boolean; multisigType?: string } = {}
  ) {
    const { supportsDelegation = true, multisigType = 'hot' } = opts;
    const sendStub = sandbox.stub().resolves(result);
    const walletStub = {
      _wallet: { multisigType },
      sendResourceDelegations: sandbox.stub(),
      sendResourceUndelegations: sendStub,
    };
    const coinStub = {
      supportsResourceDelegation: () => supportsDelegation,
      getFamily: () => 'trx',
      wallets: () => ({ get: () => Promise.resolve(walletStub) }),
    };
    return {
      bitgoStub: sinon.createStubInstance(BitGo as any, { coin: coinStub }),
      sendStub,
    };
  }

  // ---------------------------------------------------------------------------
  // handleV2DelegateResources
  // ---------------------------------------------------------------------------
  describe('handleV2DelegateResources', () => {
    it('should throw if delegations is not an array', async () => {
      const { bitgoStub } = createDelegationMocks({});
      const req = {
        bitgo: bitgoStub,
        decoded: { coin: 'ttrx', id: 'wallet-id', delegations: 'not-an-array' },
        body: {},
      };

      await handleV2DelegateResources(req as any).should.be.rejectedWith('delegations must be a non-empty array');
    });

    it('should throw if delegations is an empty array', async () => {
      const { bitgoStub } = createDelegationMocks({});
      const req = {
        bitgo: bitgoStub,
        decoded: { coin: 'ttrx', id: 'wallet-id', delegations: [] },
        body: {},
      };

      await handleV2DelegateResources(req as express.Request & typeof req).should.be.rejectedWith(
        'delegations must be a non-empty array'
      );
    });

    it('should throw if coin does not support resource delegation', async () => {
      const { bitgoStub } = createDelegationMocks({}, { supportsDelegation: false });
      const req = {
        bitgo: bitgoStub,
        decoded: { coin: 'ttrx', id: 'wallet-id', delegations },
        body: { delegations },
      };

      await handleV2DelegateResources(req as express.Request & typeof req).should.be.rejectedWith(
        'trx does not support resource delegation'
      );
    });

    it('should return result when all transactions succeed (200)', async () => {
      const result = { success: [{ txid: 'tx-1' }], failure: [] };
      const { bitgoStub, sendStub } = createDelegationMocks(result);
      const req = {
        bitgo: bitgoStub,
        decoded: { coin: 'ttrx', id: 'wallet-id', delegations },
        body: { delegations },
      };

      await handleV2DelegateResources(req as express.Request & typeof req).should.be.resolvedWith(result);
      sendStub.should.be.calledOnceWith(req.body);
    });

    it('should throw 202 when some transactions fail (partial success)', async () => {
      const result = { success: [{ txid: 'tx-1' }], failure: [{ message: 'err', receiverAddress: 'TRecv2' }] };
      const { bitgoStub } = createDelegationMocks(result);
      const req = {
        bitgo: bitgoStub,
        decoded: { coin: 'ttrx', id: 'wallet-id', delegations },
        body: { delegations },
      };

      await handleV2DelegateResources(req as express.Request & typeof req).should.be.rejectedWith({
        status: 202,
        result,
      });
    });

    it('should throw 400 when all transactions fail', async () => {
      const result = { success: [], failure: [{ message: 'err', receiverAddress: 'TRecv1' }] };
      const { bitgoStub } = createDelegationMocks(result);
      const req = {
        bitgo: bitgoStub,
        decoded: { coin: 'ttrx', id: 'wallet-id', delegations },
        body: { delegations },
      };

      await handleV2DelegateResources(req as express.Request & typeof req).should.be.rejectedWith({
        status: 400,
        result,
      });
    });

    it('should use wallet-level multisigType (not coin.supportsTss) for TSS detection', async () => {
      // The coin stub deliberately does NOT expose supportsTss() — only the wallet._wallet.multisigType
      // matters for the TSS routing decision in handleV2ResourceManagement.
      const result = { success: [{ txid: 'tx-1' }], failure: [] };
      const sendStub = sandbox.stub().resolves(result);
      const walletStub = {
        _wallet: { multisigType: 'tss' },
        sendResourceDelegations: sendStub,
        sendResourceUndelegations: sandbox.stub(),
      };
      const coinStub = {
        supportsResourceDelegation: () => true,
        getFamily: () => 'trx',
        wallets: () => ({ get: () => Promise.resolve(walletStub) }),
      };
      const bitgoStub = sinon.createStubInstance(BitGo as any, { coin: coinStub });
      const req = {
        bitgo: bitgoStub,
        decoded: { coin: 'ttrx', id: 'wallet-id', delegations },
        body: { delegations },
        params: { coin: 'ttrx' },
      };

      await handleV2DelegateResources(req as express.Request & typeof req).should.be.resolvedWith(result);
      sendStub.should.be.calledOnce();
    });

    it('should surface unexpected send errors as 400', async () => {
      const sendError = new Error('unexpected failure');
      const sendStub = sandbox.stub().rejects(sendError);
      const walletStub = {
        _wallet: { multisigType: 'hot' },
        sendResourceDelegations: sendStub,
        sendResourceUndelegations: sandbox.stub(),
      };
      const coinStub = {
        supportsResourceDelegation: () => true,
        getFamily: () => 'trx',
        wallets: () => ({ get: () => Promise.resolve(walletStub) }),
      };
      const bitgoStub = sinon.createStubInstance(BitGo as any, { coin: coinStub });
      const req = {
        bitgo: bitgoStub,
        decoded: { coin: 'ttrx', id: 'wallet-id', delegations },
        body: { delegations },
      };

      const err: any = await handleV2DelegateResources(req as express.Request & typeof req).should.be.rejected();
      err.status.should.equal(400);
    });
  });

  // ---------------------------------------------------------------------------
  // handleV2UndelegateResources
  // ---------------------------------------------------------------------------
  describe('handleV2UndelegateResources', () => {
    it('should throw if undelegations is not an array', async () => {
      const { bitgoStub } = createUndelegationMocks({});
      const req = {
        bitgo: bitgoStub,
        decoded: { coin: 'ttrx', id: 'wallet-id', undelegations: 'not-an-array' },
        body: {},
      };

      await handleV2UndelegateResources(req as any).should.be.rejectedWith('undelegations must be a non-empty array');
    });

    it('should throw if undelegations is an empty array', async () => {
      const { bitgoStub } = createUndelegationMocks({});
      const req = {
        bitgo: bitgoStub,
        decoded: { coin: 'ttrx', id: 'wallet-id', undelegations: [] },
        body: {},
      };

      await handleV2UndelegateResources(req as express.Request & typeof req).should.be.rejectedWith(
        'undelegations must be a non-empty array'
      );
    });

    it('should throw if coin does not support resource delegation', async () => {
      const { bitgoStub } = createUndelegationMocks({}, { supportsDelegation: false });
      const req = {
        bitgo: bitgoStub,
        decoded: { coin: 'ttrx', id: 'wallet-id', undelegations },
        body: { undelegations },
      };

      await handleV2UndelegateResources(req as express.Request & typeof req).should.be.rejectedWith(
        'trx does not support resource delegation'
      );
    });

    it('should return result when all transactions succeed (200)', async () => {
      const result = { success: [{ txid: 'undel-tx-1' }], failure: [] };
      const { bitgoStub, sendStub } = createUndelegationMocks(result);
      const req = {
        bitgo: bitgoStub,
        decoded: { coin: 'ttrx', id: 'wallet-id', undelegations },
        body: { undelegations },
      };

      await handleV2UndelegateResources(req as express.Request & typeof req).should.be.resolvedWith(result);
      sendStub.should.be.calledOnceWith(req.body);
    });

    it('should throw 202 when some transactions fail (partial success)', async () => {
      const result = {
        success: [{ txid: 'undel-tx-1' }],
        failure: [{ message: 'lock period active', receiverAddress: 'TRecv2' }],
      };
      const { bitgoStub } = createUndelegationMocks(result);
      const req = {
        bitgo: bitgoStub,
        decoded: { coin: 'ttrx', id: 'wallet-id', undelegations },
        body: { undelegations },
      };

      await handleV2UndelegateResources(req as express.Request & typeof req).should.be.rejectedWith({
        status: 202,
        result,
      });
    });

    it('should throw 400 when all transactions fail', async () => {
      const result = { success: [], failure: [{ message: 'lock period active', receiverAddress: 'TRecv1' }] };
      const { bitgoStub } = createUndelegationMocks(result);
      const req = {
        bitgo: bitgoStub,
        decoded: { coin: 'ttrx', id: 'wallet-id', undelegations },
        body: { undelegations },
      };

      await handleV2UndelegateResources(req as express.Request & typeof req).should.be.rejectedWith({
        status: 400,
        result,
      });
    });
  });
});

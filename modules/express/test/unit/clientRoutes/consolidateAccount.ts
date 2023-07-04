import * as sinon from 'sinon';

import 'should-http';
import 'should-sinon';
import '../../lib/asserts';

import * as express from 'express';

import { handleV2ConsolidateAccount } from '../../../src/clientRoutes';

import { BitGo } from 'bitgo';

describe('Consolidate account', () => {
  it('should fail if coin does not allow consolidation', async () => {
    const coinStub = sinon.stub().returns({ allowsAccountConsolidations: () => false });
    const stubBitgo = sinon.createStubInstance(BitGo as any, { coin: coinStub });

    const mockRequest = {
      bitgo: stubBitgo,
      params: {
        coin: 'tbtc',
        id: '23423423423423',
      },
      body: {
        consolidateAddresses: ['someAddr'],
      },
    };

    await handleV2ConsolidateAccount(mockRequest as express.Request & typeof mockRequest).should.be.rejectedWith(
      'invalid coin selected'
    );
  });

  it('should pass if coin allows consolidation', async () => {
    const result = { failure: [] };
    const { bitgoStub, consolidationStub } = createConsolidateMocks(result, true);

    const mockRequest = {
      bitgo: bitgoStub,
      params: {
        coin: 'txtz',
        id: '23423423423423',
      },
      body: {
        consolidateAddresses: ['someAddr'],
      },
    };

    await handleV2ConsolidateAccount(mockRequest as express.Request & typeof mockRequest).should.be.resolvedWith(
      result
    );
    consolidationStub.should.be.calledOnceWith(mockRequest.body);
  });

  it('should fail on invalid array in body addresses', async () => {
    const stubBitgo = sinon.createStubInstance(BitGo);

    const mockRequest = {
      bitgo: stubBitgo,
      params: {
        coin: 'talgo',
        id: '23423423423423',
      },
      body: {
        consolidateAddresses: 'someAddr',
      },
    };

    await handleV2ConsolidateAccount(mockRequest as express.Request & typeof mockRequest).should.be.rejectedWith(
      'consolidate address must be an array of addresses'
    );
  });

  function createConsolidateMocks(res, allowsAccountConsolidations = false, supportsTss = false) {
    const consolidationStub = sinon.stub().returns(res);
    const walletStub = { sendAccountConsolidations: consolidationStub };
    const coinStub = {
      supportsTss: () => supportsTss,
      allowsAccountConsolidations: () => allowsAccountConsolidations,
      wallets: () => ({ get: () => Promise.resolve(walletStub) }),
    };
    return {
      bitgoStub: sinon.createStubInstance(BitGo as any, { coin: coinStub }),
      consolidationStub,
    };
  }

  it('should return 400 when all transactions fail', async () => {
    const result = { success: [], failure: [0] };
    const body = 'testbody';
    const { bitgoStub, consolidationStub } = createConsolidateMocks(result, true);
    const mockRequest = {
      bitgo: bitgoStub,
      params: {
        coin: 'talgo',
      },
      body,
    };

    await handleV2ConsolidateAccount(mockRequest as express.Request & typeof mockRequest).should.be.rejectedWith({
      status: 400,
      result,
    });
    consolidationStub.should.be.calledOnceWith(body);
  });

  it('should return 202 when some transactions fail', async () => {
    const result = { success: [0], failure: [0] };
    const body = 'testbody';
    const { bitgoStub, consolidationStub } = createConsolidateMocks(result, true);
    const mockRequest = {
      bitgo: bitgoStub,
      params: {
        coin: 'talgo',
      },
      body,
    };

    await handleV2ConsolidateAccount(mockRequest as express.Request & typeof mockRequest).should.be.rejectedWith({
      status: 202,
      result,
    });
    consolidationStub.should.be.calledOnceWith(body);
  });

  it('should return 200 when all transactions succeed', async () => {
    const result = { failure: [] };
    const body = 'testbody';
    const { bitgoStub, consolidationStub } = createConsolidateMocks(result, true);
    const mockRequest = {
      bitgo: bitgoStub,
      params: {
        coin: 'talgo',
      },
      body,
    };

    await handleV2ConsolidateAccount(mockRequest as express.Request & typeof mockRequest).should.be.resolvedWith(
      result
    );
    consolidationStub.should.be.calledOnceWith(body);
  });
});

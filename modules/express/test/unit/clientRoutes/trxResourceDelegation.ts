import * as sinon from 'sinon';
import { decodeOrElse } from '@bitgo/sdk-core';

import 'should';
import 'should-sinon';
import '../../lib/asserts';

import * as express from 'express';

import { handleV2AccountResources, handleV2ResourceDelegations } from '../../../src/clientRoutes';
import { AccountResourcesResponse } from '../../../src/typedRoutes/api/v2/accountResources';
import { ResourceDelegationsResponse } from '../../../src/typedRoutes/api/v2/resourceDelegations';

import { BitGo } from 'bitgo';

describe('TRX Resource Delegation handlers', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.verifyAndRestore();
  });

  describe('handleV2AccountResources', () => {
    const mockResources = {
      resources: [
        {
          address: 'TAddr123',
          freeBandwidthAvailable: 1500,
          freeBandwidthUsed: 0,
          stakedBandwidthAvailable: 0,
          stakedBandwidthUsed: 0,
          energyAvailable: 0,
          energyUsed: 0,
        },
      ],
      failedAddresses: [],
    };

    function createMocks(result: unknown) {
      const getAccountResourcesStub = sandbox.stub().resolves(result);
      const walletStub = { getAccountResources: getAccountResourcesStub };
      const coinStub = {
        wallets: () => ({ get: () => Promise.resolve(walletStub) }),
      };
      const bitgoStub = sinon.createStubInstance(BitGo as any, { coin: coinStub });
      return { bitgoStub, getAccountResourcesStub };
    }

    it('should call getAccountResources with addresses and return codec-valid result', async () => {
      const { bitgoStub, getAccountResourcesStub } = createMocks(mockResources);

      const mockRequest = {
        bitgo: bitgoStub,
        decoded: {
          coin: 'ttrx',
          id: 'walletId123',
          addresses: ['TAddr123'],
        },
      };

      const result = await handleV2AccountResources(mockRequest as express.Request & typeof mockRequest);
      decodeOrElse('AccountResourcesResponse', AccountResourcesResponse[200], result, (_) => {
        throw new Error('Response did not match expected codec');
      });
      getAccountResourcesStub.should.be.calledOnceWith({
        addresses: ['TAddr123'],
        destinationAddress: undefined,
      });
    });

    it('should forward destinationAddress when provided', async () => {
      const { bitgoStub, getAccountResourcesStub } = createMocks(mockResources);

      const mockRequest = {
        bitgo: bitgoStub,
        decoded: {
          coin: 'ttrx',
          id: 'walletId123',
          addresses: ['TAddr123'],
          destinationAddress: 'TDest456',
        },
      };

      await handleV2AccountResources(mockRequest as express.Request & typeof mockRequest);
      getAccountResourcesStub.should.be.calledOnceWith({
        addresses: ['TAddr123'],
        destinationAddress: 'TDest456',
      });
    });
  });

  describe('handleV2ResourceDelegations', () => {
    const mockDelegations = {
      address: 'TAddr123',
      coin: 'ttrx',
      delegations: {
        outgoing: [],
        incoming: [],
      },
    };

    function createMocks(result: unknown) {
      const getResourceDelegationsStub = sandbox.stub().resolves(result);
      const walletStub = { getResourceDelegations: getResourceDelegationsStub };
      const coinStub = {
        wallets: () => ({ get: () => Promise.resolve(walletStub) }),
      };
      const bitgoStub = sinon.createStubInstance(BitGo as any, { coin: coinStub });
      return { bitgoStub, getResourceDelegationsStub };
    }

    it('should forward type and resource query params', async () => {
      const { bitgoStub, getResourceDelegationsStub } = createMocks(mockDelegations);

      const mockRequest = {
        bitgo: bitgoStub,
        decoded: {
          coin: 'ttrx',
          id: 'walletId123',
          type: 'outgoing' as const,
          resource: 'ENERGY',
        },
      };

      await handleV2ResourceDelegations(mockRequest as express.Request & typeof mockRequest);
      getResourceDelegationsStub.should.be.calledOnceWith({
        type: 'outgoing',
        resource: 'ENERGY',
        limit: undefined,
        nextBatchPrevId: undefined,
      });
    });

    it('should forward limit param', async () => {
      const { bitgoStub, getResourceDelegationsStub } = createMocks(mockDelegations);

      const mockRequest = {
        bitgo: bitgoStub,
        decoded: {
          coin: 'ttrx',
          id: 'walletId123',
          limit: 10,
        },
      };

      await handleV2ResourceDelegations(mockRequest as express.Request & typeof mockRequest);
      getResourceDelegationsStub.should.be.calledOnceWith({
        type: undefined,
        resource: undefined,
        limit: 10,
        nextBatchPrevId: undefined,
      });
    });

    it('should forward nextBatchPrevId for pagination', async () => {
      const { bitgoStub, getResourceDelegationsStub } = createMocks(mockDelegations);

      const mockRequest = {
        bitgo: bitgoStub,
        decoded: {
          coin: 'ttrx',
          id: 'walletId123',
          type: 'incoming' as const,
          nextBatchPrevId: 'cursor-abc123',
        },
      };

      await handleV2ResourceDelegations(mockRequest as express.Request & typeof mockRequest);
      getResourceDelegationsStub.should.be.calledOnceWith({
        type: 'incoming',
        resource: undefined,
        limit: undefined,
        nextBatchPrevId: 'cursor-abc123',
      });
    });

    it('should return codec-valid delegations result', async () => {
      const { bitgoStub } = createMocks(mockDelegations);

      const mockRequest = {
        bitgo: bitgoStub,
        decoded: {
          coin: 'ttrx',
          id: 'walletId123',
        },
      };

      const result = await handleV2ResourceDelegations(mockRequest as express.Request & typeof mockRequest);
      decodeOrElse('ResourceDelegationsResponse', ResourceDelegationsResponse[200], result, (_) => {
        throw new Error('Response did not match expected codec');
      });
    });
  });
});

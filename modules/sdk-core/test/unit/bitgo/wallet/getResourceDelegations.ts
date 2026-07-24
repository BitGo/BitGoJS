import * as sinon from 'sinon';
import 'should';
import { Wallet } from '../../../../src';

describe('Wallet - getResourceDelegations', function () {
  let wallet: Wallet;
  let mockBitGo: any;
  let mockBaseCoin: any;
  let mockWalletData: any;

  beforeEach(function () {
    mockBitGo = {
      get: sinon.stub(),
    };

    mockBaseCoin = {
      url: sinon.stub().returns('/test/coin'),
      supportsTss: sinon.stub().returns(false),
    };

    mockWalletData = {
      id: 'test-wallet-id',
      keys: ['user-key', 'backup-key', 'bitgo-key'],
    };

    wallet = new Wallet(mockBitGo, mockBaseCoin, mockWalletData);
  });

  afterEach(function () {
    sinon.restore();
  });

  const mockResponse = {
    address: 'TAddr123',
    coin: 'ttrx',
    delegations: {
      outgoing: [],
      incoming: [],
    },
  };

  function stubGet() {
    const resultStub = sinon.stub().resolves(mockResponse);
    const queryStub = sinon.stub().returns({ result: resultStub });
    mockBitGo.get.returns({ query: queryStub });
    return { queryStub, resultStub };
  }

  it('should call WP API with no query params when called with no options', async function () {
    const { queryStub } = stubGet();

    const result = await wallet.getResourceDelegations();

    result.should.deepEqual(mockResponse);
    sinon.assert.calledOnce(mockBitGo.get);
    sinon.assert.calledWith(queryStub, {});
  });

  it('should include type in query params when provided', async function () {
    const { queryStub } = stubGet();

    await wallet.getResourceDelegations({ type: 'outgoing' });

    sinon.assert.calledWith(queryStub, { type: 'outgoing' });
  });

  it('should include resource in query params when provided', async function () {
    const { queryStub } = stubGet();

    await wallet.getResourceDelegations({ resource: 'ENERGY' });

    sinon.assert.calledWith(queryStub, { resource: 'ENERGY' });
  });

  it('should include limit in query params when provided', async function () {
    const { queryStub } = stubGet();

    await wallet.getResourceDelegations({ limit: 10 });

    sinon.assert.calledWith(queryStub, { limit: 10 });
  });

  it('should include nextBatchPrevId in query params when provided', async function () {
    const { queryStub } = stubGet();

    await wallet.getResourceDelegations({ nextBatchPrevId: 'cursor-abc123' });

    sinon.assert.calledWith(queryStub, { nextBatchPrevId: 'cursor-abc123' });
  });

  it('should include all provided params in query', async function () {
    const { queryStub } = stubGet();

    await wallet.getResourceDelegations({
      type: 'incoming',
      resource: 'BANDWIDTH',
      limit: 5,
      nextBatchPrevId: 'cursor-xyz',
    });

    sinon.assert.calledWith(queryStub, {
      type: 'incoming',
      resource: 'BANDWIDTH',
      limit: 5,
      nextBatchPrevId: 'cursor-xyz',
    });
  });
});

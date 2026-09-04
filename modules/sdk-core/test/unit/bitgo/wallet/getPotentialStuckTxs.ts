import * as sinon from 'sinon';
import 'should';
import { Wallet } from '../../../../src';

describe('Wallet - getPotentialStuckTxs', function () {
  let wallet: Wallet;
  let mockBitGo: any;
  let mockBaseCoin: any;

  beforeEach(function () {
    mockBitGo = { get: sinon.stub() };
    mockBaseCoin = {
      url: sinon.stub().returns('/api/v2/btc'),
      supportsTss: sinon.stub().returns(false),
    };
    wallet = new Wallet(mockBitGo, mockBaseCoin, {
      id: 'test-wallet-id',
      keys: ['user-key', 'backup-key', 'bitgo-key'],
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  function stubGet() {
    const response = [{ txId: 'tx-id' }];
    const resultStub = sinon.stub().resolves(response);
    const queryStub = sinon.stub().returns({ result: resultStub });
    mockBitGo.get.returns({ query: queryStub });
    return { response, queryStub };
  }

  it('does not add age filters when no options are supplied', async function () {
    const { response, queryStub } = stubGet();

    const result = await wallet.getPotentialStuckTxs();

    result.should.deepEqual(response);
    sinon.assert.calledWith(mockBitGo.get, '/api/v2/btc');
    sinon.assert.calledWith(mockBaseCoin.url, '/wallet/test-wallet-id/potentialStuckTxs');
    sinon.assert.calledWith(queryStub, {});
  });

  it('forwards the minimum unconfirmed minutes filter', async function () {
    const { queryStub } = stubGet();

    await wallet.getPotentialStuckTxs({ minUnconfirmedMinutes: 30 });

    sinon.assert.calledWith(queryStub, { minUnconfirmedMinutes: 30 });
  });

  it('forwards the minimum unconfirmed blocks filter', async function () {
    const { queryStub } = stubGet();

    await wallet.getPotentialStuckTxs({ minUnconfirmedBlocks: 6 });

    sinon.assert.calledWith(queryStub, { minUnconfirmedBlocks: 6 });
  });

  it('forwards both age filters together', async function () {
    const { queryStub } = stubGet();

    await wallet.getPotentialStuckTxs({ minUnconfirmedMinutes: 30, minUnconfirmedBlocks: 6 });

    sinon.assert.calledWith(queryStub, { minUnconfirmedMinutes: 30, minUnconfirmedBlocks: 6 });
  });
});

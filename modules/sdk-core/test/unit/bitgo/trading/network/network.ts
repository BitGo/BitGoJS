/**
 * @prettier
 */
import assert from 'assert';
import sinon from 'sinon';
import { TradingNetwork } from '../../../../../src/bitgo/trading/network/network';

describe('TradingNetwork', function () {
  const enterpriseId = 'enterprise-id';
  const walletId = 'wallet-id';
  const signature = 'signature';
  let mockBitGo: any;
  let mockWallet: any;
  let requestCalls: Array<{ method: string; url: string; headers: Record<string, string>; body: unknown }>;
  let tradingNetwork: TradingNetwork;
  let tradingAccount: { signPayload: sinon.SinonStub };

  beforeEach(function () {
    requestCalls = [];
    tradingAccount = { signPayload: sinon.stub().resolves(signature) };
    mockWallet = {
      id: sinon.stub().returns(walletId),
      toTradingAccount: sinon.stub().returns(tradingAccount),
    };

    mockBitGo = {
      microservicesUrl: sinon.stub().callsFake((path: string) => `https://microservices.example${path}`),
    };

    for (const method of ['get', 'post', 'put']) {
      mockBitGo[method] = sinon.stub().callsFake((url: string) => {
        const call: { method: string; url: string; headers: Record<string, string>; body: unknown } = {
          method,
          url,
          headers: {},
          body: undefined,
        };
        requestCalls.push(call);
        const request = {
          set: sinon.stub().callsFake((name: string, value: string) => {
            call.headers[name] = value;
            return request;
          }),
          send: sinon.stub().callsFake((body: unknown) => {
            call.body = body;
            return request;
          }),
          result: sinon.stub().resolves({ ok: true }),
        };
        return request;
      });
    }

    tradingNetwork = new TradingNetwork(enterpriseId, mockWallet, mockBitGo);
  });

  it('uses enterprise-scoped URLs and headers for network reads', async function () {
    await tradingNetwork.getBalances({ pageNumber: 2 });
    await tradingNetwork.getSettlementById({ settlementId: 'settlement-id' });

    assert.deepStrictEqual(requestCalls, [
      {
        method: 'get',
        url: 'https://microservices.example/api/network/v1/enterprises/enterprise-id/clients/balances',
        headers: { 'enterprise-id': enterpriseId },
        body: { pageNumber: 2 },
      },
      {
        method: 'get',
        url: 'https://microservices.example/api/network/v1/enterprises/enterprise-id/clients/settlements/settlement-id',
        headers: { 'enterprise-id': enterpriseId },
        body: {},
      },
    ]);
  });

  it('prepares a signed allocation with generated identifiers', async function () {
    const prepared = await tradingNetwork.prepareAllocation({
      connectionId: 'connection-id',
      amount: { currency: 'tbtc', quantity: '100' },
      notes: 'test',
    });

    assert.strictEqual(prepared.connectionId, 'connection-id');
    assert.strictEqual(prepared.signature, signature);
    assert.match(prepared.clientExternalId, /^[0-9a-f-]{36}$/);
    assert.match(prepared.nonce, /^[0-9a-f]{64}$/);
    assert.strictEqual(prepared.payload, JSON.stringify({
      connectionId: 'connection-id',
      amount: { currency: 'tbtc', quantity: '100' },
      notes: 'test',
      clientExternalId: prepared.clientExternalId,
      nonce: prepared.nonce,
    }));
    sinon.assert.calledOnceWithExactly(tradingAccount.signPayload, {
      payload: prepared.payload,
      walletPassphrase: undefined,
    });
  });

  it('submits allocation and deallocation payloads to connection-scoped endpoints', async function () {
    const params = {
      connectionId: 'connection-id',
      payload: '{}',
      signature,
      amount: { currency: 'tbtc', quantity: '100' },
      clientExternalId: 'external-id',
      nonce: 'nonce',
    };

    await tradingNetwork.createAllocation(params);
    await tradingNetwork.createDeallocation(params);

    assert.deepStrictEqual(requestCalls, [
      {
        method: 'post',
        url: 'https://microservices.example/api/network/v1/enterprises/enterprise-id/clients/connections/connection-id/allocations',
        headers: { 'enterprise-id': enterpriseId },
        body: {
          payload: params.payload,
          signature: params.signature,
          amount: params.amount,
          clientExternalId: params.clientExternalId,
          nonce: params.nonce,
        },
      },
      {
        method: 'post',
        url: 'https://microservices.example/api/network/v1/enterprises/enterprise-id/clients/connections/connection-id/deallocations',
        headers: { 'enterprise-id': enterpriseId },
        body: {
          payload: params.payload,
          signature: params.signature,
          amount: params.amount,
          clientExternalId: params.clientExternalId,
          nonce: params.nonce,
        },
      },
    ]);
  });
});

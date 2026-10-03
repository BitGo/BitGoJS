import * as assert from 'assert';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { BaseCoin, decodeOrElse } from '@bitgo/sdk-core';
import { setupAgent } from '../../lib/testutil';
import { VerifyKeyResponse } from '../../../src/typedRoutes/api/v2/verifyKey';

describe('verifyKey', function () {
  const agent = setupAgent();

  const walletId = '68c02f96aa757d9212bd1a536f123456';
  const coin = 'tsol';
  // wallet.verifyKey is stubbed in every test below, so the body value is opaque to these tests
  const prv = '{"uShare":"stub-u","bitgoYShare":"stub-y","backupYShare":"stub-b"}';

  function stubVerifyKey(verifyKeyStub: sinon.SinonStub) {
    const mockWallet = { verifyKey: verifyKeyStub };
    const mockCoin = {
      wallets: sinon.stub().returns({ get: sinon.stub().resolves(mockWallet) }),
    };
    // a partial stand-in: the handler under test only calls coin.wallets().get()
    sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as unknown as BaseCoin);
  }

  afterEach(function () {
    sinon.restore();
  });

  it('returns 200 { match: true } and passes the prv to wallet.verifyKey', async function () {
    const verifyKeyStub = sinon.stub().resolves({ match: true });
    stubVerifyKey(verifyKeyStub);

    const result = await agent
      .post(`/api/v2/${coin}/wallet/${walletId}/verifyKey`)
      .set('Authorization', 'Bearer test_access_token_12345')
      .set('Content-Type', 'application/json')
      .send({ prv });

    assert.strictEqual(result.status, 200);
    assert.deepStrictEqual(result.body, { match: true });
    sinon.assert.calledOnceWithExactly(verifyKeyStub, { prv });
    decodeOrElse('express.v2.wallet.verifyKey', VerifyKeyResponse[200], result.body, (errors) => {
      throw new Error(`Response did not match expected codec: ${errors}`);
    });
  });

  it('returns 200 { match: false } when the key does not belong to the wallet', async function () {
    const verifyKeyStub = sinon.stub().resolves({ match: false });
    stubVerifyKey(verifyKeyStub);

    const result = await agent
      .post(`/api/v2/${coin}/wallet/${walletId}/verifyKey`)
      .set('Authorization', 'Bearer test_access_token_12345')
      .set('Content-Type', 'application/json')
      .send({ prv });

    assert.strictEqual(result.status, 200);
    assert.deepStrictEqual(result.body, { match: false });
  });

  it('returns 400 with the SDK error message when wallet.verifyKey rejects', async function () {
    const verifyKeyStub = sinon.stub().rejects(new Error('Key verification is not supported for this wallet type'));
    stubVerifyKey(verifyKeyStub);

    const result = await agent
      .post(`/api/v2/${coin}/wallet/${walletId}/verifyKey`)
      .set('Authorization', 'Bearer test_access_token_12345')
      .set('Content-Type', 'application/json')
      .send({ prv });

    assert.strictEqual(result.status, 400);
    assert.strictEqual(result.body.message, 'Key verification is not supported for this wallet type');
  });

  it('returns 400 without calling wallet.verifyKey when the body has no prv', async function () {
    const verifyKeyStub = sinon.stub().resolves({ match: true });
    stubVerifyKey(verifyKeyStub);

    const result = await agent
      .post(`/api/v2/${coin}/wallet/${walletId}/verifyKey`)
      .set('Authorization', 'Bearer test_access_token_12345')
      .set('Content-Type', 'application/json')
      .send({});

    assert.strictEqual(result.status, 400);
    sinon.assert.notCalled(verifyKeyStub);
  });

  it('propagates the upstream status when the wallet lookup fails', async function () {
    const verifyKeyStub = sinon.stub().resolves({ match: true });
    const notFound = Object.assign(new Error('wallet not found'), { status: 404 });
    sinon.stub(BitGo.prototype, 'coin').returns({
      wallets: sinon.stub().returns({ get: sinon.stub().rejects(notFound) }),
    } as unknown as BaseCoin);

    const result = await agent
      .post(`/api/v2/${coin}/wallet/${walletId}/verifyKey`)
      .set('Authorization', 'Bearer test_access_token_12345')
      .set('Content-Type', 'application/json')
      .send({ prv });

    assert.strictEqual(result.status, 404);
    sinon.assert.notCalled(verifyKeyStub);
  });

  it('propagates a status-bearing error from wallet.verifyKey instead of wrapping it to 400', async function () {
    const verifyKeyStub = sinon.stub().rejects(Object.assign(new Error('keychain fetch failed'), { status: 429 }));
    stubVerifyKey(verifyKeyStub);

    const result = await agent
      .post(`/api/v2/${coin}/wallet/${walletId}/verifyKey`)
      .set('Authorization', 'Bearer test_access_token_12345')
      .set('Content-Type', 'application/json')
      .send({ prv });

    assert.strictEqual(result.status, 429);
    assert.strictEqual(result.body.message, 'keychain fetch failed');
  });

  it('surfaces a transport-level failure as an infrastructure error rather than a 400', async function () {
    const verifyKeyStub = sinon
      .stub()
      .rejects(Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }));
    stubVerifyKey(verifyKeyStub);

    const result = await agent
      .post(`/api/v2/${coin}/wallet/${walletId}/verifyKey`)
      .set('Authorization', 'Bearer test_access_token_12345')
      .set('Content-Type', 'application/json')
      .send({ prv });

    assert.strictEqual(result.status, 500);
    assert.strictEqual(result.body.message, 'connect ECONNREFUSED');
  });

  it('returns 400 with a stringified message when wallet.verifyKey rejects with a non-Error', async function () {
    const verifyKeyStub = sinon.stub().callsFake(() => Promise.reject('not an error'));
    stubVerifyKey(verifyKeyStub);

    const result = await agent
      .post(`/api/v2/${coin}/wallet/${walletId}/verifyKey`)
      .set('Authorization', 'Bearer test_access_token_12345')
      .set('Content-Type', 'application/json')
      .send({ prv });

    assert.strictEqual(result.status, 400);
    assert.strictEqual(result.body.message, 'not an error');
  });

  it('returns 400 without echoing the material when prv is not a string', async function () {
    const verifyKeyStub = sinon.stub().resolves({ match: true });
    stubVerifyKey(verifyKeyStub);

    const result = await agent
      .post(`/api/v2/${coin}/wallet/${walletId}/verifyKey`)
      .set('Authorization', 'Bearer test_access_token_12345')
      .set('Content-Type', 'application/json')
      .send({ prv: { uShare: { seed: 'deadbeefdeadbeef' } } });

    assert.strictEqual(result.status, 400);
    assert.ok(!JSON.stringify(result.body).includes('deadbeef'), 'response must not echo the material');
    assert.ok(result.body.error.includes("got '[REDACTED]'"), 'response must show the redaction marker');
    sinon.assert.notCalled(verifyKeyStub);
  });
});

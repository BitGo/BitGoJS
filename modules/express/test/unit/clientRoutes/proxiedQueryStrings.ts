import 'should';
import nock from 'nock';
import { common } from '@bitgo/sdk-core';
import { setupAgent } from '../../lib/testutil';

const BITGO_TEST_URI = common.Environments.test.uri;

/**
 * createAPIPath() (via the REST proxy handlers) is responsible for forwarding the client's
 * query string bytes verbatim to the BitGo API. These tests run real requests through the
 * express app and assert the exact upstream request path the BitGo SDK receives.
 */
describe('proxied request query strings', function () {
  const upstreamPaths: string[] = [];

  before(function () {
    if (!nock.isActive()) {
      nock.activate();
    }
    // Block external network but allow supertest's local connections
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });

  beforeEach(function () {
    nock.cleanAll();
    upstreamPaths.length = 0;
    // Single interceptor capturing every upstream GET path; the SDK prefetches
    // /api/v1/client/constants on every unauthenticated BitGo instance, so filter it out.
    nock(BITGO_TEST_URI)
      .persist(true)
      .get(/.*/)
      .reply(function (this: { req: { path: string } }) {
        const path = this.req.path;
        if (!path.startsWith('/api/v1/client/constants')) {
          upstreamPaths.push(path);
        }
        return [200, { ok: true }] as const;
      });
  });

  afterEach(function () {
    nock.cleanAll();
  });

  after(function () {
    if (nock.isActive()) {
      nock.restore();
    }
  });

  it('should forward a v1 path without query string', async function () {
    const agent = setupAgent();
    const res = await agent.get('/api/v1/wallets');
    res.status.should.equal(200);
    upstreamPaths.should.deepEqual(['/api/v1/wallets']);
  });

  it('should forward a simple v1 query string verbatim', async function () {
    const agent = setupAgent();
    const res = await agent.get('/api/v1/wallets?allTokens=true&limit=5');
    res.status.should.equal(200);
    upstreamPaths.should.deepEqual(['/api/v1/wallets?allTokens=true&limit=5']);
  });

  it('should forward percent-encoded v1 query values verbatim', async function () {
    const agent = setupAgent();
    const res = await agent.get('/api/v1/wallets?space=%20&apostrophe=%27&plus=%2B');
    res.status.should.equal(200);
    upstreamPaths.should.deepEqual(['/api/v1/wallets?space=%20&apostrophe=%27&plus=%2B']);
  });

  it('should forward a plus sign in a v1 query verbatim', async function () {
    const agent = setupAgent();
    const res = await agent.get('/api/v1/wallets?label=a+b');
    res.status.should.equal(200);
    upstreamPaths.should.deepEqual(['/api/v1/wallets?label=a+b']);
  });

  it('should forward repeated v1 query keys verbatim', async function () {
    const agent = setupAgent();
    const res = await agent.get('/api/v1/wallets?coin=eth&coin=btc');
    res.status.should.equal(200);
    upstreamPaths.should.deepEqual(['/api/v1/wallets?coin=eth&coin=btc']);
  });

  it('should forward a v1 query parameter with an empty value verbatim', async function () {
    const agent = setupAgent();
    const res = await agent.get('/api/v1/wallets?empty=');
    res.status.should.equal(200);
    upstreamPaths.should.deepEqual(['/api/v1/wallets?empty=']);
  });

  it('should not forward a bare question mark with no query params', async function () {
    const agent = setupAgent();
    const res = await agent.get('/api/v1/wallets?');
    res.status.should.equal(200);
    upstreamPaths.should.deepEqual(['/api/v1/wallets']);
  });

  it('should forward a v2 user path with query string verbatim', async function () {
    const agent = setupAgent();
    const res = await agent.get('/api/v2/user/me?client=web');
    res.status.should.equal(200);
    upstreamPaths.should.deepEqual(['/api/v2/user/me?client=web']);
  });

  it('should forward a v2 coin path with query string verbatim', async function () {
    const agent = setupAgent();
    const res = await agent.get('/api/v2/tbtc/wallet?allTokens=true');
    res.status.should.equal(200);
    upstreamPaths.should.deepEqual(['/api/v2/tbtc/wallet?allTokens=true']);
  });
});

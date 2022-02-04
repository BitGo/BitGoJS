/**
 * @prettier
 */
import 'should';
import 'should-http';
import * as sinon from 'sinon';

import * as request from 'supertest';
import { app as expressApp } from '../../src/expressApp';
import * as nock from 'nock';
import { Environments } from 'bitgo';
import { Btc } from 'bitgo/dist/src/v2/coins/btc';

describe('Custom signing function', () => {
  let agent: request.SuperAgentTest;
  const externalSignerUrl = 'https://external-signer.invalid';
  before(() => {
    const args: any = {
      debug: true,
      env: 'test',
      externalSignerUrl,
    };

    const app = expressApp(args);
    agent = request.agent(app);

    if (!nock.isActive()) {
      nock.activate();
    }
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });

  after(() => {
    if (nock.isActive()) {
      nock.restore();
    }
  });

  it('should make a request to external signer when sending', async function () {
    const bgUrl = Environments.test.uri;
    // setup nock to external signer
    const signernock = nock(externalSignerUrl)
      .post('/api/v2/btc/sign')
      .reply(200, { externalSigner: 'external signer response' });

    // setup nock to wallet platform GET /wallet/fakeid
    const wpWalletnock = nock(bgUrl)
      .get('/api/v2/btc/wallet/fakeid')
      .reply(200, { id: 'fakeid', keys: ['abc', 'def', 'ghi'], coinSpecific: {} });
    const wpKeychainNocks = [
      nock(bgUrl).get('/api/v2/btc/key/abc').reply(200, { pub: 'xpubabc' }),
      nock(bgUrl).get('/api/v2/btc/key/def').reply(200, { pub: 'xpubdef' }),
      nock(bgUrl).get('/api/v2/btc/key/ghi').reply(200, { pub: 'xpubghi' }),
    ];
    const wpLatestBlockNock = nock(bgUrl).get('/api/v2/btc/public/block/latest').reply(200);

    const wpBuildnock = nock(bgUrl)
      .post('/api/v2/btc/wallet/fakeid/tx/build')
      .reply(200, { wpBuild: 'WP build response' });
    const wpSendnock = nock(bgUrl).post('/api/v2/btc/wallet/fakeid/tx/send').reply(200, { wpSend: 'WP send response' });

    const postProcessPrebuildStub = sinon.stub(Btc.prototype, 'postProcessPrebuild').resolvesArg(0);
    const verifyTransactionStub = sinon.stub(Btc.prototype, 'verifyTransaction').resolves(true);

    // make request to express application to initiate send
    const result = await agent
      .post('/api/v2/btc/wallet/fakeid/sendcoins')
      .type('json')
      .send({ address: 'abc', amount: 123 });

    // check to make sure request to external signer was successful
    result.ok.should.be.true();

    // make sure wallet platform request contained response from external signer
    result.body.should.have.property('wpSend', 'WP send response');

    signernock.done();
    wpKeychainNocks.forEach((s) => s.done());
    wpLatestBlockNock.done();
    wpWalletnock.done();
    wpBuildnock.done();
    wpSendnock.done();

    postProcessPrebuildStub.restore();
    verifyTransactionStub.restore();
  });
});

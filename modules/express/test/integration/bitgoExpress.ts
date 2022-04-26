/**
 * @prettier
 */
import * as should from 'should';
import 'should-http';

import { agent as supertest } from 'supertest';
import { DefaultConfig } from '../../src/config';
import { app as expressApp } from '../../src/expressApp';
import * as nock from 'nock';
import { Environments } from '@bitgo/sdk-core';

describe('Bitgo Express', function () {
  let agent;
  before(function () {
    nock.restore();

    const args = {
      ...DefaultConfig,
      debug: false,
      env: 'test' as const,
      logfile: '/dev/null',
    };

    const app = expressApp(args);
    agent = supertest(app);
  });

  describe('verify address', function () {
    describe('failure', function () {
      it('should mark as invalid bad btc address', async function () {
        const res = await agent
          .post('/api/v2/btc/verifyaddress')
          .send({ address: '3P14159f73E4gFr7JterCCQh9QjiTjiZrR' });

        res.should.have.status(200);
        res.body.isValid.should.equal(false);
      });

      it('should mark as invalid bad ltc address', async function () {
        const res = await agent
          .post('/api/v2/ltc/verifyaddress')
          .send({ address: '3Ps3MeHaYm2s5WPsRo1kHkCvS8EFawzG7R' });

        res.should.have.status(200);
        res.body.isValid.should.equal(false);
      });

      it('should mark as invalid bad tltc address', async function () {
        const res = await agent
          .post('/api/v2/tltc/verifyaddress')
          .send({ address: 'QeKCcxtfqprzZsWZihRgxJk2QJrrLMjS4s' });

        res.should.have.status(200);
        res.body.isValid.should.equal(false);
      });

      it('should mark as invalid bad tltc address when not allowing old script hash version', async function () {
        const res = await agent
          .post('/api/v2/ltc/verifyaddress')
          .send({ address: '3Ps3MeHaYm2s5WPsRo1kHkCvS8EFawzG7Q' });

        res.should.have.status(200);
        res.body.isValid.should.equal(false);
      });

      it('should mark as invalid bad eth address', async function () {
        const res = await agent
          .post('/api/v2/eth/verifyaddress')
          .send({ address: '0xd4a4aa09f57b7e83cd817ec24df9f86daf253d1' });

        res.should.have.status(200);
        res.body.isValid.should.equal(false);
      });

      it('should mark as invalid bad xrp address', async function () {
        const res = await agent
          .post('/api/v2/xrp/verifyaddress')
          .send({ address: 'rw5bfvumHWZirKLG5gUQ89dyqtiUUbmxP' });

        res.should.have.status(200);
        res.body.isValid.should.equal(false);
      });
    });

    describe('success', function () {
      it('should verify valid btc address', async function () {
        const res = await agent
          .post('/api/v2/btc/verifyaddress')
          .send({ address: '3P14159f73E4gFr7JterCCQh9QjiTjiZrG' });

        res.should.have.status(200);
        res.body.isValid.should.equal(true);
      });

      it('should verify valid tbtc address', async function () {
        const res = await agent
          .post('/api/v2/tbtc/verifyaddress')
          .send({ address: '2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc' });

        res.should.have.status(200);
        res.body.isValid.should.equal(true);
      });

      it('should verify valid ltc address', async function () {
        const res = await agent
          .post('/api/v2/ltc/verifyaddress')
          .send({ address: 'MW5BfXhYVstHt1fmXg167PTKkpphfP6xQ3' });

        res.should.have.status(200);
        res.body.isValid.should.equal(true);
      });

      it('should verify old-style P2SH ltc address when allowing old script hash version', async function () {
        const res = await agent.post('/api/v2/ltc/verifyaddress').send({
          address: '3Ps3MeHaYm2s5WPsRo1kHkCvS8EFawzG7Q',
          supportOldScriptHashVersion: true,
        });

        res.should.have.status(200);
        res.body.isValid.should.equal(true);
      });

      it('should verify tltc address', async function () {
        const res = await agent
          .post('/api/v2/tltc/verifyaddress')
          .send({ address: 'QeKCcxtfqprzZsWZihRgxJk2QJrrLMjS4c' });

        res.should.have.status(200);
        res.body.isValid.should.equal(true);
      });

      it('should verify valid eth address', async function () {
        const res = await agent
          .post('/api/v2/eth/verifyaddress')
          .send({ address: '0xd4a4aa09f57b7e83cd817ec24df9f86daf253d1d' });

        res.should.have.status(200);
        res.body.isValid.should.equal(true);
      });

      it('should verify valid xrp address', async function () {
        const res = await agent
          .post('/api/v2/xrp/verifyaddress')
          .send({ address: 'rw5bfvumHWZirKLG5gUQ89dyqtiUUbmxPD' });

        res.should.have.status(200);
        res.body.isValid.should.equal(true);
      });
    });
  });

  describe('Request body size limits', () => {
    it('should handle request bodies <=20mb', async function () {
      // actual number of bytes sent will be roughly 6x the number of bytes in
      // the buffer. Therefore, to create a request body between 12mb and 20mb,
      // we should create a buffer with between 2e6 and 3.3e6 bytes
      const numBytes = Math.floor(Math.random() * 2e6 + 1.3e6);
      const res = await agent
        .post('/api/v2/btc/verifyaddress')
        .send({ address: '3P14159f73E4gFr7JterCCQh9QjiTjiZrG', garbage: Buffer.alloc(numBytes).toString('utf8') });

      res.should.have.status(200);
      res.body.isValid.should.equal(true);
    });

    it('should fail for request bodies >20mb', async function () {
      // actual number of bytes sent will be roughly 6x the number of bytes in
      // the buffer. Therefore, to create a request body between 20mb and 25mb,
      // we should create a buffer with between 3.334e6 and 4.166e6 bytes.
      // we use 3.5e6 instead to give a bit of buffer space (no pun intended)
      const numBytes = Math.floor(Math.random() * 0.826e6 + 3.5e6);
      const res = await agent
        .post('/api/v2/btc/verifyaddress')
        .send({ address: '3P14159f73E4gFr7JterCCQh9QjiTjiZrG', garbage: Buffer.alloc(numBytes).toString('utf8') });

      res.should.have.status(413);
    });
  });

  it('should not proxy a non-api route', async function () {
    const res = await agent.get('/info/solutions').send();
    res.should.have.status(404);
  });

  it('should proxy the oauth/token route', async function () {
    const res = await agent.post('/oauth/token').send();
    res.should.not.have.status(404);
  });

  it('should handle coinless routes', async function () {
    const routes = [
      agent.get('/api/v2/reports/'),
      agent.get('/api/v2/wallet/balances/merged/'),
      agent.get('/api/v2/enterprise/1234/'),
      agent.post('/api/v2/sendlabels/'),
      agent.put('/api/v2/sendlabels/123'),
      agent.delete('/api/v2/sendlabels/323'),
    ];

    for (const res of await Promise.all(routes)) {
      res.should.have.status(401);
    }
  });

  it('should handle coinless routes with multiple query params', async function () {
    const res = await agent.get('/api/v2/market/latest?coin=tbtc&coin=tltc');
    res.should.have.status(200);
    should.exist(res.body.marketData);
    res.body.marketData.should.have.length(2);
    res.body.marketData[0].should.have.property('coin', 'tbtc');
    res.body.marketData[1].should.have.property('coin', 'tltc');
  });

  it('should handle coinless routes with a single query param', async function () {
    const res = await agent.get('/api/v2/market/latest?coin=tbtc');
    res.should.have.status(200);
    should.exist(res.body.marketData);
    res.body.marketData.should.have.length(1);
    res.body.marketData[0].should.have.property('coin', 'tbtc');
  });

  it('should pass POST body data to the proxy target url', async function () {
    const path = '/api/v2/post';
    const body = { some: 'data' };
    const serverResponse = { testResponse: 'server response' };

    // client constants are retrieved upon BitGo
    // object creation so they need to be nocked
    const scopes = [
      nock(Environments.test.uri).get('/api/v1/client/constants').reply(200, {}),
      nock(Environments.test.uri).post(path, body).reply(200, serverResponse),
    ];

    const postRes = await agent.post(path).send(body);
    postRes.should.have.status(200);
    postRes.should.have.property('body', serverResponse);
    scopes.forEach((s) => s.done());
  });

  describe('proxy error handling', () => {
    let agent;
    before(() => {
      const args = {
        ...DefaultConfig,
        debug: true,
        env: 'test' as const,
        timeout: 500,
      };

      const app = expressApp(args);
      agent = supertest(app);

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

    it('should handle ECONNRESET errors from the proxy server', async function () {
      const path = '/api/v2/fakeroute';

      // client constants are retrieved upon BitGo
      // object creation so they need to be nocked
      nock(Environments.test.uri).get('/api/v1/client/constants').reply(200, {});

      // first request to ping endpoint should time out
      nock(Environments.test.uri).get(path).delayConnection(1000).reply(200);

      // we should return 503 in the case of a timeout
      let pingRes = await agent.get(path).send({});
      pingRes.should.have.status(503);

      nock(Environments.test.uri).get(path).reply(200);

      pingRes = await agent.get(path).send({});
      pingRes.should.have.status(200);
    });

    it('should handle log4j injection string', async function () {
      const res = await agent.get('/').query('a=${jndi:dns://3.127.145.40:53/}').send({});
      res.should.have.status(404);
    });
  });
});

require('should');
require('should-http');
const request = require('supertest-as-promised');
const co = require('bluebird').coroutine;
const expressApp = require('../../../src/expressApp').app;

describe('Bitgo Express', function() {

  let agent;
  before(() => {
    if (process.browser) {
      // Bitgo Express tests not supported in browser
      this.skip();
    }

    const args = {
      debug: false,
      env: 'test',
      logfile: '/dev/null'
    };

    const app = expressApp(args);
    agent = request.agent(app);
  });

  describe('verify address', function() {

    describe('failure', function() {
      it('should mark as invalid bad btc address', co(function *() {
        const res = yield agent.post('/api/v2/btc/verifyaddress')
        .send({ address: '3P14159f73E4gFr7JterCCQh9QjiTjiZrR' });

        res.should.have.status(200);
        res.body.isValid.should.equal(false);
      }));

      it('should mark as invalid bad ltc address', co(function *() {
        const res = yield agent.post('/api/v2/ltc/verifyaddress')
        .send({ address: '3Ps3MeHaYm2s5WPsRo1kHkCvS8EFawzG7R' });

        res.should.have.status(200);
        res.body.isValid.should.equal(false);
      }));

      it('should mark as invalid bad tltc address', co(function *() {
        const res = yield agent.post('/api/v2/tltc/verifyaddress')
        .send({ address: 'QeKCcxtfqprzZsWZihRgxJk2QJrrLMjS4s' });

        res.should.have.status(200);
        res.body.isValid.should.equal(false);
      }));

      it('should mark as invalid bad tltc address when not allowing old script hash version', co(function *() {
        const res = yield agent.post('/api/v2/ltc/verifyaddress')
        .send({ address: '3Ps3MeHaYm2s5WPsRo1kHkCvS8EFawzG7Q' });

        res.should.have.status(200);
        res.body.isValid.should.equal(false);
      }));

      it('should mark as invalid bad eth address', co(function *() {
        const res = yield agent.post('/api/v2/eth/verifyaddress')
        .send({ address: '0xd4a4aa09f57b7e83cd817ec24df9f86daf253d1' });

        res.should.have.status(200);
        res.body.isValid.should.equal(false);
      }));

      it('should mark as invalid bad xrp address', co(function *() {
        const res = yield agent.post('/api/v2/xrp/verifyaddress')
        .send({ address: 'rw5bfvumHWZirKLG5gUQ89dyqtiUUbmxP' });

        res.should.have.status(200);
        res.body.isValid.should.equal(false);
      }));

    });

    describe('success', function() {
      it('should verify valid btc address', co(function *() {
        const res = yield agent.post('/api/v2/btc/verifyaddress')
        .send({ address: '3P14159f73E4gFr7JterCCQh9QjiTjiZrG' });

        res.should.have.status(200);
        res.body.isValid.should.equal(true);
      }));

      it('should verify valid tbtc address', co(function *() {
        const res = yield agent.post('/api/v2/tbtc/verifyaddress')
        .send({ address: '2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc' });

        res.should.have.status(200);
        res.body.isValid.should.equal(true);
      }));

      it('should verify valid ltc address', co(function *() {
        const res = yield agent.post('/api/v2/ltc/verifyaddress')
        .send({ address: 'MW5BfXhYVstHt1fmXg167PTKkpphfP6xQ3' });

        res.should.have.status(200);
        res.body.isValid.should.equal(true);
      }));

      it('should verify old-style P2SH ltc address when allowing old script hash version', co(function *() {
        const res = yield agent.post('/api/v2/ltc/verifyaddress')
        .send({
          address: '3Ps3MeHaYm2s5WPsRo1kHkCvS8EFawzG7Q',
          supportOldScriptHashVersion: true
        });

        res.should.have.status(200);
        res.body.isValid.should.equal(true);
      }));

      it('should verify tltc address', co(function *() {
        const res = yield agent.post('/api/v2/tltc/verifyaddress')
        .send({ address: 'QeKCcxtfqprzZsWZihRgxJk2QJrrLMjS4c' });

        res.should.have.status(200);
        res.body.isValid.should.equal(true);
      }));

      it('should verify valid eth address', co(function *() {
        const res = yield agent.post('/api/v2/eth/verifyaddress')
        .send({ address: '0xd4a4aa09f57b7e83cd817ec24df9f86daf253d1d' });

        res.should.have.status(200);
        res.body.isValid.should.equal(true);
      }));

      it('should verify valid xrp address', co(function *() {
        const res = yield agent.post('/api/v2/xrp/verifyaddress')
        .send({ address: 'rw5bfvumHWZirKLG5gUQ89dyqtiUUbmxPD' });

        res.should.have.status(200);
        res.body.isValid.should.equal(true);
      }));
    });
  });

  describe('Request body size limits', () => {
    it('should handle request bodies <=20mb', co(function *() {
      // actual number of bytes sent will be roughly 6x the number of bytes in
      // the buffer. Therefore, to create a request body between 12mb and 20mb,
      // we should create a buffer with between 2e6 and 3.3e6 bytes
      const numBytes = Math.floor(Math.random() * 2e6 + 1.3e6);
      const res = yield agent.post('/api/v2/btc/verifyaddress')
      .send({ address: '3P14159f73E4gFr7JterCCQh9QjiTjiZrG', garbage: Buffer.alloc(numBytes).toString('utf8') });

      res.should.have.status(200);
      res.body.isValid.should.equal(true);
    }));

    it('should fail for request bodies >20mb', co(function *() {
      // actual number of bytes sent will be roughly 6x the number of bytes in
      // the buffer. Therefore, to create a request body between 20mb and 25mb,
      // we should create a buffer with between 3.334e6 and 4.166e6 bytes.
      // we use 3.5e6 instead to give a bit of buffer space (no pun intended)
      const numBytes = Math.floor(Math.random() * 0.826e6 + 3.5e6);
      const res = yield agent.post('/api/v2/btc/verifyaddress')
      .send({ address: '3P14159f73E4gFr7JterCCQh9QjiTjiZrG', garbage: Buffer.alloc(numBytes).toString('utf8') });

      res.should.have.status(413);
    }));
  });

  describe('Only API routes are proxied', () => {
    it('should not proxy a non-api route', co(function *() {
      const res = yield agent.get('/info/solutions').send();
      res.should.have.status(404);
    }));
  });
});

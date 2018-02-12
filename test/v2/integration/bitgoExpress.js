require('should');
const request = require('supertest-as-promised');

const expressApp = require('../../../src/expressApp');
const TestBitGo = require('../../lib/test_bitgo');

describe('Bitgo Express V2', function() {
  let agent;

  before(function() {
    if (process.browser) {
      // Bitgo Express tests not supported in browser
      this.skip();
    }

    const args = {
      debug: false,
      env: 'test',
      logfile: '/dev/null'
    };
    const bitgo = new TestBitGo();
    bitgo.initializeTestVars();
    const app = expressApp(args);
    agent = request.agent(app);
  });

  describe('verify address', function() {
    describe('failure', function() {
      it('should mark as invalid bad btc address', function() {
        return agent.post('/api/v2/btc/verifyaddress')
        .send({ address: '3P14159f73E4gFr7JterCCQh9QjiTjiZrR' })
        .then(function(res) {
          res.should.have.status(200);
          res.body.isValid.should.equal(false);
        });
      });

      it('should mark as invalid bad ltc address', function() {
        return agent.post('/api/v2/ltc/verifyaddress')
        .send({ address: '3Ps3MeHaYm2s5WPsRo1kHkCvS8EFawzG7R' })
        .then(function(res) {
          res.should.have.status(200);
          res.body.isValid.should.equal(false);
        });
      });

      it('should mark as invalid bad tltc address', function() {
        return agent.post('/api/v2/tltc/verifyaddress')
        .send({ address: 'QeKCcxtfqprzZsWZihRgxJk2QJrrLMjS4s' })
        .then(function(res) {
          res.should.have.status(200);
          res.body.isValid.should.equal(false);
        });
      });

      it('should mark as invalid bad tltc address when not allowing old script hash version', function() {
        return agent.post('/api/v2/ltc/verifyaddress')
        .send({
          address: '3Ps3MeHaYm2s5WPsRo1kHkCvS8EFawzG7Q'
        })
        .then(function(res) {
          res.should.have.status(200);
          res.body.isValid.should.equal(false);
        });
      });

      it('should mark as invalid bad eth address', function() {
        return agent.post('/api/v2/eth/verifyaddress')
        .send({ address: '0xd4a4aa09f57b7e83cd817ec24df9f86daf253d1' })
        .then(function(res) {
          res.should.have.status(200);
          res.body.isValid.should.equal(false);
        });
      });

      it('should mark as invalid bad xrp address', function() {
        return agent.post('/api/v2/xrp/verifyaddress')
        .send({ address: 'rw5bfvumHWZirKLG5gUQ89dyqtiUUbmxP' })
        .then(function(res) {
          res.should.have.status(200);
          res.body.isValid.should.equal(false);
        });
      });

    });

    describe('success', function() {
      it('should verify valid btc address', function() {
        return agent.post('/api/v2/btc/verifyaddress')
        .send({ address: '3P14159f73E4gFr7JterCCQh9QjiTjiZrG' })
        .then(function(res) {
          res.should.have.status(200);
          res.body.isValid.should.equal(true);
        });
      });

      it('should verify valid tbtc address', function() {
        return agent.post('/api/v2/tbtc/verifyaddress')
        .send({ address: '2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc' })
        .then(function(res) {
          res.should.have.status(200);
          res.body.isValid.should.equal(true);
        });
      });

      it('should verify valid ltc address', function() {
        return agent.post('/api/v2/ltc/verifyaddress')
        .send({ address: 'MW5BfXhYVstHt1fmXg167PTKkpphfP6xQ3' })
        .then(function(res) {
          res.should.have.status(200);
          res.body.isValid.should.equal(true);
        });
      });

      it('should verify old-style P2SH ltc address when allowing old script hash version', function() {
        return agent.post('/api/v2/ltc/verifyaddress')
        .send({
          address: '3Ps3MeHaYm2s5WPsRo1kHkCvS8EFawzG7Q',
          supportOldScriptHashVersion: true
        })
        .then(function(res) {
          res.should.have.status(200);
          res.body.isValid.should.equal(true);
        });
      });

      it('should verify tltc address', function() {
        return agent.post('/api/v2/tltc/verifyaddress')
        .send({ address: 'QeKCcxtfqprzZsWZihRgxJk2QJrrLMjS4c' })
        .then(function(res) {
          res.should.have.status(200);
          res.body.isValid.should.equal(true);
        });
      });

      it('should verify valid eth address', function() {
        return agent.post('/api/v2/eth/verifyaddress')
        .send({ address: '0xd4a4aa09f57b7e83cd817ec24df9f86daf253d1d' })
        .then(function(res) {
          res.should.have.status(200);
          res.body.isValid.should.equal(true);
        });
      });

      it('should verify valid xrp address', function() {
        return agent.post('/api/v2/xrp/verifyaddress')
        .send({ address: 'rw5bfvumHWZirKLG5gUQ89dyqtiUUbmxPD' })
        .then(function(res) {
          res.should.have.status(200);
          res.body.isValid.should.equal(true);
        });
      });
    });
  });
});

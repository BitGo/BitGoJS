var assert = require('assert');
var should = require('should');
var request = require('supertest');

var BitGoJS = require('../src/index');
var expessApp = require('../src/expressApp');
var TestBitGo = require('./lib/test_bitgo');

describe('Bitgo Express', function() {
  var agent;

  before(function (done) {
    var args = {
      debug: false,
      env: 'test'
    };
    var app = expessApp(args);
    agent = request.agent(app);
    done();
  });

  describe('proxied calls', function() {

    it('error - not authed', function(done) {
      agent.get('/api/v1/wallet')
      .send()
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) { throw err; }
        res.should.have.status(401);
        done();
      });
    });

    it('market data', function(done) {
      agent.get('/api/v1/market/latest')
      .send()
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) { throw err; }
        res.should.have.status(200);

        res.body.should.have.property('latest');
        res.body.latest.should.have.property('currencies');
        res.body.latest.currencies.should.have.property('USD');

        usdMarketData = res.body.latest.currencies.USD;
        usdMarketData.should.have.property('last');
        usdMarketData.should.have.property('bid');
        usdMarketData.should.have.property('ask');
        done();
      });
    });

    var walletId;
    it('get wallet list (authed)', function(done) {
      agent.get('/api/v1/wallet')
      .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
      .send()
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) { throw err; }
        res.should.have.status(200);
        res.body.should.have.property('wallets');
        Object.keys(res.body.wallets).length.should.not.equal(0);
        walletId = Object.keys(res.body.wallets)[0];
        done();
      });
    });

    it('post unlock (authed)', function(done) {
      agent.post('/api/v1/user/unlock')
      .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
      .send({ otp: '0000000', duration: 3 })
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) { throw err; }
        res.body.should.have.property('session');
        res.body.session.should.have.property('client');
        res.body.session.client.should.equal('test');
        done();
      });
    });

    it('put label set (authed)', function(done) {
      agent.put('/api/v1/labels/' + walletId + '/2MxCSYu2isiAPbUAoiqniZ8HSSEH1uMDruk')
      .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
      .send({ label: 'testLabel' })
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) { throw err; }
        res.body.should.have.property('walletId');
        res.body.should.have.property('address');
        res.body.should.have.property('label');
        res.body.label.should.equal('testLabel');
        res.body.walletId.should.equal(walletId);
        done();
      });
    });
  });

  describe('handled calls', function() {

    it('error - not authed', function(done) {
      agent.post('/api/v1/wallets/simplecreate')
      .send({ passphrase:'abc', label:'helloworld' })
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) { throw err; }
        res.should.have.status(401);
        done();
      });
    });

    it('new keychain', function(done) {
      agent.post('/api/v1/keychain/local')
      .send()
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) { throw err; }
        res.should.have.status(200);
        res.body.should.have.property('xpub');
        res.body.should.have.property('xprv');
        done();
      });
    });

    it('decrypt', function(done) {
      var encryptedString = '{"iv":"n4zHXVTi/Go/riCP8fNs/A==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"zvLyve+4AJU=","ct":"gNMqheicMoD8ZmNzRwuQfWGAh+HA933l"}';
      agent.post('/api/v1/decrypt')
      .send({input: encryptedString, password: 'password'})
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) { throw err; }
        res.should.have.status(200);
        res.body.should.have.property('decrypted');
        res.body.decrypted.should.equal('this is a secret');
        done();
      });
    });

    it('create wallet', function(done) {
      agent.post('/api/v1/user/unlock')
      .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
      .send({ otp: '0000000', duration: 5 })
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) { throw err; }
        res.should.have.status(200);

        var backupXpub = "xpub6AHA9hZDN11k2ijHMeS5QqHx2KP9aMBRhTDqANMnwVtdyw2TDYRmF8PjpvwUFcL1Et8Hj59S3gTSMcUQ5gAqTz3Wd8EsMTmF3DChhqPQBnU";
        agent.post('/api/v1/wallets/simplecreate')
        .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
        .send({ passphrase: "chamchatka", label: "kokoko", backupXpub: backupXpub })
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) { throw err; }
          res.should.have.status(200);
          res.body.should.have.property('wallet');
          res.body.should.have.property('backupKeychain');
          res.body.backupKeychain.should.have.property('xpub');
          res.body.backupKeychain.xpub.should.equal(backupXpub);
          done();
        });
      });
    });
  });
});

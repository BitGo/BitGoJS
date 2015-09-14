if (process.browser) {
  // Bitgo Express tests not supported in browser
  return;
};

var assert = require('assert');
var should = require('should');
var request = require("supertest-as-promised");

var BitGoJS = require('../src/index');
var expessApp = require('../src/expressApp');
var TestBitGo = require('./lib/test_bitgo');

describe('Bitgo Express', function() {
  var agent;

  before(function (done) {
    var args = {
      debug: false,
      env: 'test',
      logfile: '/dev/null'
    };
    bitgo = new TestBitGo();
    bitgo.initializeTestVars();
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

    it('get wallet list (authed)', function(done) {
      agent.get('/api/v1/wallet')
      .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
      .send()
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) { throw err; }
        res.should.have.status(200);
        res.body.should.have.property('wallets');
        res.body.wallets.length.should.not.equal(0);
        res.body.wallets[0].should.have.property('label');
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
      var walletId = '2MvfC3e6njdTXqWDfGvNUqDs5kwimfaTGjK';
      agent.put('/api/v1/labels/' + walletId + '/msj42CCGruhRsFrGATiUuh25dtxYtnpbTx')
      .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
      .send({ label: 'testLabel_bitgoExpressSDK' })
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) { throw err; }
        res.body.should.have.property('walletId');
        res.body.should.have.property('address');
        res.body.should.have.property('label');
        res.body.label.should.equal('testLabel_bitgoExpressSDK');
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

    it('send coins - wallet1 to wallet3', function(done) {
      agent.post('/api/v1/user/unlock')
      .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
      .send({ otp: '0000000', duration: 10 })
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) { throw err; }
        res.should.have.status(200);

        agent.post('/api/v1/wallet/' + TestBitGo.TEST_WALLET1_ADDRESS + '/sendcoins')
        .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
        .send({ address: TestBitGo.TEST_WALLET3_ADDRESS, amount: 0.002 * 1e8, walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE })
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) { throw err; }
          res.status.should.equal(200);
          res.body.should.have.property('tx');
          res.body.should.have.property('hash');
          res.body.should.have.property('fee');
          res.body.should.have.property('feeRate');
          done();
        });
      });
    });

    it('send coins - wallet3 to wallet1 with insufficient amount', function(done) {
      agent.post('/api/v1/user/unlock')
      .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
      .send({ otp: '0000000', duration: 10 })
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) { throw err; }
        res.should.have.status(200);

        agent.post('/api/v1/wallet/' + TestBitGo.TEST_WALLET3_ADDRESS + '/createtransaction')
        .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
        .send({ recipients: [{ address: TestBitGo.TEST_WALLET1_ADDRESS, amount: 10000 * 1e8 }], walletPassphrase: TestBitGo.TEST_WALLET3_PASSCODE })
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) { throw err; }
          res.body.should.have.property('message');
          res.body.result.should.have.property('fee');
          res.body.result.should.have.property('available');
          res.body.message.should.equal("Insufficient funds");
          res.body.result.fee.should.be.greaterThan(546);
          res.body.result.available.should.be.greaterThan(546);
          done();
        });
      });
    });

    it('send coins - wallet3 to wallet1 with fee', function(done) {
      agent.post('/api/v1/user/unlock')
      .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
      .send({ otp: '0000000', duration: 10 })
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) { throw err; }
        res.should.have.status(200);

        agent.post('/api/v1/wallet/' + TestBitGo.TEST_WALLET3_ADDRESS + '/sendcoins')
        .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
        .send({ address: TestBitGo.TEST_WALLET1_ADDRESS, amount: 0.001 * 1e8, walletPassphrase: TestBitGo.TEST_WALLET3_PASSCODE, fee: 0.005 * 1e8 })
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) { throw err; }
          res.status.should.equal(200);
          res.body.should.have.property('tx');
          res.body.should.have.property('hash');
          res.body.should.have.property('fee');
          res.body.fee.should.equal(0.005 * 1e8);
          done();
        });
      });
    });

    it('create and reject a pending approval', function(done) {
      agent.post('/api/v1/user/unlock')
      .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN_SHAREDUSER)
      .send({ otp: '0000000', duration: 10 })
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) { throw err; }
        res.should.have.status(200);
        agent.post('/api/v1/wallet/' + TestBitGo.TEST_SHARED_WALLET_ADDRESS + '/sendcoins')
        .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
        .send({ address: TestBitGo.TEST_WALLET1_ADDRESS, amount: 0.001 * 1e8, walletPassphrase: TestBitGo.TEST_PASSWORD })
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) { throw err; }
          res.status.should.equal(202);
          res.body.should.have.property('pendingApproval');
          res.body.status.should.eql('pendingApproval');
          var pendingApprovalId = res.body.pendingApproval;
          agent.put('/api/v1/pendingapprovals/' + pendingApprovalId + '/express')
          .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN_SHAREDUSER)
          .send({ walletPassphrase: TestBitGo.TEST_PASSWORD, state: 'rejected' })
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) { throw err; }
            res.body.state.should.eql('rejected');
            done();
          });
        });
      });
    });

    it('create a transaction and then reconstruct a tx to approve (with original fee)', function() {
      return agent.post('/api/v1/user/unlock')
      .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
      .send({ otp: '0000000', duration: 20 })
      .then(function(res) {
        res.should.have.status(200);
        return agent.post('/api/v1/wallet/' + TestBitGo.TEST_SHARED_WALLET_ADDRESS + '/sendcoins')
        .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
        .send({
          address: TestBitGo.TEST_WALLET1_ADDRESS,
          amount: 0.001 * 1e8,
          walletPassphrase: TestBitGo.TEST_PASSWORD,
          fee: 12345
        })
        .expect('Content-Type', /json/);
      })
      .then(function(res) {
        res.status.should.equal(202);
        res.body.should.have.property('pendingApproval');
        res.body.status.should.eql('pendingApproval');
        var pendingApprovalId = res.body.pendingApproval;
        return agent.put('/api/v1/pendingapprovals/' + pendingApprovalId + '/constructTx')
        .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
        .send({walletPassphrase: TestBitGo.TEST_PASSWORD, useOriginalFee: true});
      })
      .then(function(res) {
        res.body.should.have.property('tx');
        res.body.tx.should.not.eql('');
        res.body.fee.should.eql(12345);
      });
    });

    it('create and accept a pending approval', function(done) {
      agent.post('/api/v1/user/unlock')
      .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN_SHAREDUSER)
      .send({ otp: '0000000', duration: 10 })
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) { throw err; }
        res.should.have.status(200);
        agent.post('/api/v1/wallet/' + TestBitGo.TEST_SHARED_WALLET_ADDRESS + '/sendcoins')
        .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
        .send({ address: TestBitGo.TEST_WALLET1_ADDRESS, amount: 0.001 * 1e8, walletPassphrase: TestBitGo.TEST_PASSWORD })
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) { throw err; }
          res.status.should.equal(202);
          res.body.should.have.property('pendingApproval');
          res.body.status.should.eql('pendingApproval');
          var pendingApprovalId = res.body.pendingApproval;
          agent.put('/api/v1/pendingapprovals/' + pendingApprovalId + '/express')
          .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN_SHAREDUSER)
          .send({ walletPassphrase: TestBitGo.TEST_PASSWORD, state: 'approved' })
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) { throw err; }
            res.body.state.should.eql('approved');
            done();
          });
        });
      });
    });

    it('create and accept a pending approval (2 step accept by constructing tx with original user)', function(done) {
      agent.post('/api/v1/user/unlock')
      .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
      .send({ otp: '0000000', duration: 20 })
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) { throw err; }
        res.should.have.status(200);
        agent.post('/api/v1/wallet/' + TestBitGo.TEST_SHARED_WALLET_ADDRESS + '/sendcoins')
        .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
        .send({ address: TestBitGo.TEST_WALLET1_ADDRESS, amount: 0.001 * 1e8, walletPassphrase: TestBitGo.TEST_PASSWORD, fee: 12345 })
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) { throw err; }
          res.status.should.equal(202);
          res.body.should.have.property('pendingApproval');
          res.body.status.should.eql('pendingApproval');
          var pendingApprovalId = res.body.pendingApproval;
          agent.put('/api/v1/pendingapprovals/' + pendingApprovalId + '/constructTx')
          .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
          .send({ walletPassphrase: TestBitGo.TEST_PASSWORD })
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) { throw err; }
            res.body.should.have.property('tx');
            res.body.tx.should.not.eql('');
            res.body.fee.should.not.eql(12345); // fee should be recalculated dynamically
            var txHex = res.body.tx;
            agent.post('/api/v1/user/unlock')
            .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN_SHAREDUSER)
            .send({ otp: '0000000', duration: 10 })
            .expect('Content-Type', /json/)
            .end(function(err, res) {
              if (err) { throw err; }
              agent.put('/api/v1/pendingapprovals/' + pendingApprovalId)
              .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN_SHAREDUSER)
              .send({ tx: txHex, state: 'approved'})
              .expect('Content-Type', /json/)
              .end(function (err, res) {
                if (err) {
                  throw err;
                }
                res.body.state.should.eql('approved');
                done();
              });
            });
          });
        });
      });
    });
  });
});

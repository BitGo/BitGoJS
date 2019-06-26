import 'should';
import * as nock from 'nock';
require('should-http');
const request = require('supertest-as-promised');
const _ = require('lodash');

const expressApp = require('../../src/expressApp');
const TestBitGo = require('bitgo/test/lib/test_bitgo');
const testUtil = require('bitgo/test/integration/testutil');

describe('Bitgo Express V1', function() {
  let agent;
  let bitgo;

  before(function() {
    nock.restore();

    const args = {
      debug: false,
      env: 'test',
      logfile: '/dev/null'
    };
    bitgo = new TestBitGo();
    bitgo.initializeTestVars();
    const app = expressApp.app(args);
    agent = request.agent(app);
  });

  describe('proxied calls', function() {

    it('error - not authed', function() {
      return agent.get('/api/v1/wallet')
      .send()
      .then(function(res) {
        res.should.have.status(401);
      });
    });

    it('error - proxied calls disabled', function() {
      const app = expressApp.app(_.extend(
        {},
        {
          debug: false,
          env: 'test',
          logfile: '/dev/null'
        },
        { disableproxy: true })
      );
      const disabledProxyAgent = request.agent(app);
      return disabledProxyAgent.get('/')
      .send()
      .then(function(res) {
        res.should.have.status(404);
      });
    });

    it('market data', function() {
      return agent.get('/api/v1/market/latest')
      .send()
      .then(function(res) {
        res.should.have.status(200);
        res.body.should.have.property('latest');
        res.body.latest.should.have.property('currencies');
        res.body.latest.currencies.should.have.property('USD');

        const usdMarketData = res.body.latest.currencies.USD;
        usdMarketData.should.have.property('last');
        usdMarketData.should.have.property('bid');
        usdMarketData.should.have.property('ask');
      });
    });

    it('get wallet list (authed)', function() {
      return agent.get('/api/v1/wallet')
      .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
      .send()
      .then(function(res) {
        res.should.have.status(200);
        res.body.should.have.property('wallets');
        res.body.wallets.length.should.not.equal(0);
        res.body.wallets[0].should.have.property('label');
      });
    });

    it('post unlock (authed)', function() {
      return agent.post('/api/v1/user/unlock')
      .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
      .send({ otp: bitgo.testUserOTP(), duration: 3 })
      .then(function(res) {
        res.body.should.have.property('session');
        res.body.session.should.have.property('client');
        res.body.session.client.should.equal('test');
      });
    });

    it('put label set (authed)', function() {
      const walletId = '2MvfC3e6njdTXqWDfGvNUqDs5kwimfaTGjK';
      return agent.put('/api/v1/labels/' + walletId + '/msj42CCGruhRsFrGATiUuh25dtxYtnpbTx')
      .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
      .send({ label: 'testLabel_bitgoExpressSDK' })
      .then(function(res) {
        res.body.should.have.property('walletId');
        res.body.should.have.property('address');
        res.body.should.have.property('label');
        res.body.label.should.equal('testLabel_bitgoExpressSDK');
        res.body.walletId.should.equal(walletId);
      });
    });
  });

  describe('handled calls', function() {

    it('error - not authed', function() {
      return agent.post('/api/v1/wallets/simplecreate')
      .send({ passphrase: 'abc', label: 'helloworld' })
      .then(function(res) {
        res.should.have.status(401);
      });
    });

    it('new keychain', function() {
      return agent.post('/api/v1/keychain/local')
      .send()
      .then(function(res) {
        res.should.have.status(200);
        res.body.should.have.property('xpub');
        res.body.should.have.property('xprv');
      });
    });

    it('derive BIP32 private keychain', function() {
      return agent.post('/api/v1/keychain/derive')
      .send({
        path: 'm/1/2/3/4',
        xprv: 'xprv9s21ZrQH143K3o5A54b28GYVnDAa7gdPSxjWGz9ARzbxqYax8gbds5yGiU4D56GgSRwp7t9T8p54xh6MN19h8n6HJyR5FCkQopoUxC34EV3'
      })
      .then(function(res) {
        res.should.have.status(200);
        res.body.should.have.property('xpub');
        res.body.should.have.property('xprv');
        res.body.xprv.should.eql('xprvA1yY6N1A6aT3B9VUb2mhnLpNyPwAguPY3sibAXYXiEUVjT62TZNHTy13LhrdJ4BcGmt2hnRdgGQFLDowBqANkysSRw6KXri2MpGjkPAbGrS');
        res.body.xpub.should.eql('xpub6ExtVsY3vx1LPdZwh4Ji9Um7XRmf6N7PR6eBxux9Ga1UcFRB16gY1mKXBzVPcGZVpnDPYboEPYdPxfsrnq1Yec49RN4usyB5ba8NNtVbHeG');
        res.body.path.should.eql('m/1/2/3/4');
      });
    });

    it('derive BIP32 public keychain', function() {
      return agent.post('/api/v1/keychain/derive')
      .send({
        path: 'm/3/4/5/6',
        xpub: 'xpub6ExtVsY3vx1LPdZwh4Ji9Um7XRmf6N7PR6eBxux9Ga1UcFRB16gY1mKXBzVPcGZVpnDPYboEPYdPxfsrnq1Yec49RN4usyB5ba8NNtVbHeG'
      })
      .then(function(res) {
        res.should.have.status(200);
        res.body.should.have.property('xpub');
        res.body.should.not.have.property('xprv');
        res.body.xpub.should.eql('xpub6N5Svn29v8op8f6VgHeM9FXvmpoFx7535qW4HKFHeM7HqJDD2dWQq92MKduYZjuWi4FWZQsGDtHwRtLpmCRWMxy3d3r77jcsxDpYNAGpbuY');
        res.body.path.should.eql('m/3/4/5/6');
      });
    });

    it('decrypt', function() {
      const encryptedString = '{"iv":"n4zHXVTi/Go/riCP8fNs/A==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"zvLyve+4AJU=","ct":"gNMqheicMoD8ZmNzRwuQfWGAh+HA933l"}';
      return agent.post('/api/v1/decrypt')
      .send({ input: encryptedString, password: 'password' })
      .then(function(res) {
        res.should.have.status(200);
        res.body.should.have.property('decrypted');
        res.body.decrypted.should.equal('this is a secret');
      });
    });

    it('create wallet', function() {
      const backupXpub = 'xpub6AHA9hZDN11k2ijHMeS5QqHx2KP9aMBRhTDqANMnwVtdyw2TDYRmF8PjpvwUFcL1Et8Hj59S3gTSMcUQ5gAqTz3Wd8EsMTmF3DChhqPQBnU';
      return testUtil.unlockToken(agent, TestBitGo.TEST_ACCESSTOKEN, 15)
      .then(function() {
        return agent.post('/api/v1/wallets/simplecreate')
        .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
        .send({ passphrase: 'chamchatka', label: 'kokoko', backupXpub: backupXpub });
      })
      .then(function(res) {
        res.should.have.status(200);
        res.body.should.have.property('wallet');
        res.body.should.have.property('backupKeychain');
        res.body.backupKeychain.should.have.property('xpub');
        res.body.backupKeychain.xpub.should.equal(backupXpub);
      });
    });

    it('create transaction - wallet1 to wallet3', function() {
      return testUtil.unlockToken(agent, TestBitGo.TEST_ACCESSTOKEN, 15)
      .then(function() {
        return agent.post('/api/v1/wallet/' + TestBitGo.TEST_WALLET1_ADDRESS + '/createtransaction')
        .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
        .send({ recipients: [{ address: TestBitGo.TEST_WALLET3_ADDRESS, amount: 2 * 1e8 }], walletPassphrase: TestBitGo.TEST_WALLET3_PASSCODE });
      })
      .then(function(res) {
        res.status.should.eql(200);
        const {
          nP2shInputs = 0,
          nP2shP2wshInputs = 0,
          nP2pkhInputs,
          nOutputs
        } = res.body.txInfo;
        (nP2shInputs + nP2shP2wshInputs).should.be.greaterThan(0);
        nP2pkhInputs.should.eql(0);
        nOutputs.should.be.greaterThan(2); // change + bitgo fee + destination
      });
    });

    it('send coins - wallet1 to wallet3', function() {
      return testUtil.unlockToken(agent, TestBitGo.TEST_ACCESSTOKEN, 15)
      .then(function() {
        return agent.post('/api/v1/wallet/' + TestBitGo.TEST_WALLET1_ADDRESS + '/sendcoins')
        .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
        .send({ address: TestBitGo.TEST_WALLET3_ADDRESS, amount: 0.002 * 1e8, walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE });
      })
      .then(function(res) {
        res.status.should.equal(200);
        res.body.should.have.property('tx');
        res.body.should.have.property('hash');
        res.body.should.have.property('fee');
        res.body.should.have.property('feeRate');
      });
    });

    it('create transaction - wallet3 to wallet1 with insufficient amount', function() {
      return testUtil.unlockToken(agent, TestBitGo.TEST_ACCESSTOKEN, 15)
      .then(function() {
        return agent.post('/api/v1/wallet/' + TestBitGo.TEST_WALLET3_ADDRESS + '/createtransaction')
        .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
        .send({ recipients: [{ address: TestBitGo.TEST_WALLET1_ADDRESS, amount: 10000 * 1e8 }], walletPassphrase: TestBitGo.TEST_WALLET3_PASSCODE });
      })
      .then(function(res) {
        res.status.should.eql(400);
        res.body.should.have.property('message');
        res.body.should.have.property('fee');
        res.body.should.have.property('available');
        res.body.message.should.equal('Insufficient funds');
        res.body.fee.should.be.greaterThan(546);
        res.body.available.should.be.greaterThan(546);
        const txInfo = res.body.txInfo;
        txInfo.nP2shInputs.should.be.greaterThan(0);
        txInfo.nP2pkhInputs.should.eql(0);
        txInfo.nOutputs.should.be.greaterThan(2); // change + bitgo fee + destination
      });
    });

    it('send coins - wallet3 to wallet1 with insufficient amount', function() {
      return testUtil.unlockToken(agent, TestBitGo.TEST_ACCESSTOKEN, 15)
      .then(function() {
        return agent.post('/api/v1/wallet/' + TestBitGo.TEST_WALLET3_ADDRESS + '/sendcoins')
        .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
        .send({ address: TestBitGo.TEST_WALLET1_ADDRESS, amount: 10000 * 1e8, walletPassphrase: TestBitGo.TEST_WALLET3_PASSCODE, fee: 0.0003 * 1e8 });
      })
      .then(function(res) {
        res.status.should.equal(400);
        res.body.should.have.property('fee');
        res.body.should.have.property('available');
        res.body.message.should.equal('Insufficient funds');
        res.body.should.have.property('fee');
        res.body.fee.should.equal(0.0003 * 1e8);
        const txInfo = res.body.txInfo;
        txInfo.nP2shInputs.should.be.greaterThan(0);
        txInfo.nP2pkhInputs.should.eql(0);
        txInfo.nOutputs.should.be.greaterThan(2); // change + bitgo fee + destination
      });
    });

    it('send coins - wallet3 to wallet1 with fee', function() {
      return testUtil.unlockToken(agent, TestBitGo.TEST_ACCESSTOKEN, 15)
      .then(function() {
        return agent.post('/api/v1/wallet/' + TestBitGo.TEST_WALLET3_ADDRESS + '/sendcoins')
        .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
        .send({ address: TestBitGo.TEST_WALLET1_ADDRESS, amount: 0.001 * 1e8, walletPassphrase: TestBitGo.TEST_WALLET3_PASSCODE, fee: 0.0003 * 1e8 });
      })
      .then(function(res) {
        res.status.should.equal(200);
        res.body.should.have.property('tx');
        res.body.should.have.property('hash');
        res.body.should.have.property('fee');
        res.body.fee.should.equal(Math.round(0.0003 * 1e8));
      });
    });

    xit('create and reject a pending approval', function() {
      return testUtil.unlockToken(agent, TestBitGo.TEST_ACCESSTOKEN, 15)
      .then(function() {
        return testUtil.unlockToken(agent, TestBitGo.TEST_ACCESSTOKEN_SHAREDUSER, 15);
      })
      .then(function() {
        return agent.post('/api/v1/wallet/' + TestBitGo.TEST_SHARED_WALLET_ADDRESS + '/sendcoins')
        .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
        .send({
          address: TestBitGo.TEST_WALLET1_ADDRESS,
          amount: 0.001 * 1e8,
          walletPassphrase: TestBitGo.TEST_PASSWORD,
          otp: bitgo.testUserOTP()
        });
      })
      .then(function(res) {
        res.should.have.status(202);
        res.body.should.have.property('pendingApproval');
        res.body.status.should.eql('pendingApproval');
        const pendingApprovalId = res.body.pendingApproval;
        return agent.put('/api/v1/pendingapprovals/' + pendingApprovalId + '/express')
        .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN_SHAREDUSER)
        .send({ walletPassphrase: TestBitGo.TEST_PASSWORD, state: 'rejected' });
      })
      .then(function(res) {
        res.body.state.should.eql('rejected');
      });
    });

    xit('create a transaction and then reconstruct a tx to approve (with original fee)', function() {
      return testUtil.unlockToken(agent, TestBitGo.TEST_ACCESSTOKEN_SHAREDUSER, 15)
      .then(function() {
        return testUtil.unlockToken(agent, TestBitGo.TEST_ACCESSTOKEN, 15);
      })
      .then(function() {
        return agent.post('/api/v1/wallet/' + TestBitGo.TEST_SHARED_WALLET_ADDRESS + '/sendcoins')
        .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
        .send({
          address: TestBitGo.TEST_WALLET1_ADDRESS,
          amount: 0.001 * 1e8,
          walletPassphrase: TestBitGo.TEST_PASSWORD,
          fee: 12345
        });
      })
      .then(function(res) {
        res.should.have.status(202);
        res.body.should.have.property('pendingApproval');
        res.body.status.should.eql('pendingApproval');
        const pendingApprovalId = res.body.pendingApproval;
        return agent.put('/api/v1/pendingapprovals/' + pendingApprovalId + '/constructTx')
        .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
        .send({ walletPassphrase: TestBitGo.TEST_PASSWORD, useOriginalFee: true });
      })
      .then(function(res) {
        res.body.should.have.property('tx');
        res.body.tx.should.not.eql('');
        res.body.fee.should.eql(12345);
      });
    });

    it('calculate tx size from parameters', function() {
      return agent.post('/api/v1/calculateminerfeeinfo')
      .send({
        feeRate: 20000,
        nP2shInputs: 2,
        nP2pkhInputs: 1,
        nP2shP2wshInputs: 0,
        nOutputs: 4
      })
      .then(function(res) {
        res.should.have.status(200);
        res.body.size.should.eql(920);
        res.body.fee.should.eql(18400);
      });
    });

    xit('create and accept a pending approval', function() {
      return testUtil.unlockToken(agent, TestBitGo.TEST_ACCESSTOKEN, 15)
      .then(function() {
        return testUtil.unlockToken(agent, TestBitGo.TEST_ACCESSTOKEN_SHAREDUSER, 15);
      })
      .then(function() {
        return agent.post('/api/v1/wallet/' + TestBitGo.TEST_SHARED_WALLET_ADDRESS + '/sendcoins')
        .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
        .send({ address: TestBitGo.TEST_WALLET1_ADDRESS, amount: 0.001 * 1e8, walletPassphrase: TestBitGo.TEST_PASSWORD, otp: bitgo.testUserOTP() });
      })
      .then(function(res) {
        res.should.have.status(202);
        res.body.should.have.property('pendingApproval');
        res.body.status.should.eql('pendingApproval');
        const pendingApprovalId = res.body.pendingApproval;
        return agent.put('/api/v1/pendingapprovals/' + pendingApprovalId + '/express')
        .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN_SHAREDUSER)
        .send({ walletPassphrase: TestBitGo.TEST_PASSWORD, state: 'approved', otp: bitgo.testUserOTP() });
      })
      .then(function(res) {
        res.body.state.should.eql('approved');
      });
    });

    xit('create and accept a pending approval using the xprv', function() {
      return testUtil.unlockToken(agent, TestBitGo.TEST_ACCESSTOKEN, 15)
      .then(function(res) {
        return testUtil.unlockToken(agent, TestBitGo.TEST_ACCESSTOKEN_SHAREDUSER, 15);
      })
      .then(function(res) {
        return agent.post('/api/v1/wallet/' + TestBitGo.TEST_SHARED_WALLET_ADDRESS + '/sendcoins')
        .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
        .send({ address: TestBitGo.TEST_WALLET1_ADDRESS, amount: 0.001 * 1e8, walletPassphrase: TestBitGo.TEST_PASSWORD, otp: bitgo.testUserOTP() });
      })
      .then(function(res) {
        res.should.have.status(202);
        res.body.should.have.property('pendingApproval');
        res.body.status.should.eql('pendingApproval');
        const pendingApprovalId = res.body.pendingApproval;
        return agent.put('/api/v1/pendingapprovals/' + pendingApprovalId + '/express')
        .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN_SHAREDUSER)
        .send({ xprv: 'xprv9s21ZrQH143K3GisDvcsLyQZ88CrgtHziPuQ4ZZU6x3v8AZxEYEBZ7ANwfAPVz9mqraSjREVaCdFgv1u7mHvjuDRZ25J4wGJ73yooYhDoJ4',
          state: 'approved',
          otp: bitgo.testUserOTP()
        });
      })
      .then(function(res) {
        res.body.state.should.eql('approved');
      });
    });

    xit('create and accept a pending approval (2 step accept by constructing tx with original user)', function() {
      let pendingApprovalId;
      return testUtil.unlockToken(agent, TestBitGo.TEST_ACCESSTOKEN, 15)
      .then(function(res) {
        return testUtil.unlockToken(agent, TestBitGo.TEST_ACCESSTOKEN_SHAREDUSER, 15);
      })
      .then(function(res) {
        return agent.post('/api/v1/wallet/' + TestBitGo.TEST_SHARED_WALLET_ADDRESS + '/sendcoins')
        .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
        .send({ address: TestBitGo.TEST_WALLET1_ADDRESS, amount: 0.001 * 1e8, walletPassphrase: TestBitGo.TEST_PASSWORD, fee: 12345, otp: bitgo.testUserOTP() });
      })
      .then(function(res) {
        res.should.have.status(202);
        res.body.should.have.property('pendingApproval');
        res.body.status.should.eql('pendingApproval');
        pendingApprovalId = res.body.pendingApproval;
        return agent.put('/api/v1/pendingapprovals/' + pendingApprovalId + '/constructTx')
        .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN)
        .send({ walletPassphrase: TestBitGo.TEST_PASSWORD });
      })
      .then(function(res) {
        res.body.should.have.property('tx');
        res.body.tx.should.not.eql('');
        res.body.fee.should.not.eql(12345); // fee should be recalculated dynamically
        const txHex = res.body.tx;
        return agent.put('/api/v1/pendingapprovals/' + pendingApprovalId)
        .set('Authorization', 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN_SHAREDUSER)
        .send({ tx: txHex, state: 'approved', otp: bitgo.testUserOTP() });
      })
      .then(function(res) {
        res.body.state.should.eql('approved');
      });
    });
  });
});

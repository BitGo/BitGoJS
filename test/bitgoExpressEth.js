if (process.browser) {
  throw new Error('bitgo express tests not supported in browser');
}

const request = require('supertest-as-promised');
const Promise = require('bluebird');
const co = Promise.coroutine;
const BN = require('ethereumjs-util').BN;

const expressApp = require('../src/expressApp');
const TestBitGo = require('./lib/test_bitgo');
const testUtil = require('./testutil');


// this should exist on the test env hand have some eth funding
const testWalletId = '598f606cd8fc24710d2ebadb1d9459bb';
const testWalletPassphrase = 'moon';

// this address belongs to the test wallet
const testWalletFirstAddress = '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e';

describe('Bitgo Express TETH v2', function () {
  let agent;

  const authHeader = {
    Authorization: 'Bearer ' + TestBitGo.TEST_ACCESSTOKEN
  };

  before(co(function *() {
    const args = {
      debug: false,
      env: 'test',
      logfile: '/dev/null'
    };
    const bitgo = new TestBitGo();
    bitgo.initializeTestVars();
    const app = expressApp(args);
    agent = request.agent(app);
    yield testUtil.unlockToken(agent, TestBitGo.TEST_ACCESSTOKEN, 15);
  }));

  it('can create new wallet and delete it', co(function *() {
    const label = 'bitgoExpressEth.js temporary test wallet';
    let res = yield agent
      .post('/api/v2/teth/wallet/generate')
      .set(authHeader)
      .send({ passphrase: testWalletPassphrase, label });
    res.statusCode.should.equal(200);

    res = yield agent
      .delete(`/api/v2/teth/wallet/${res.body.id}`)
      .set(authHeader)
      .send({ passphrase: testWalletPassphrase });
    res.statusCode.should.equal(200);
  }));

  it('can list wallets', co(function *() {
    const res = yield agent
      .get('/api/v2/teth/wallet')
      .set(authHeader);
    res.statusCode.should.equal(200);
    res.body.wallets.length.should.not.equal(0);
  }));

  it('can fetch testWallet', co(function *() {
    const res = yield agent
      .get(`/api/v2/teth/wallet/${testWalletId}`)
      .set(authHeader);
    res.statusCode.should.equal(200);
    res.body.id.should.equal(testWalletId);

    ((new BN(res.body.spendableBalanceString)).gt(0)).should.equal(true);
  }));

  it('can list deposit addresses', co(function *() {
    const res = yield agent
      .get(`/api/v2/teth/wallet/${testWalletId}/addresses`)
      .set(authHeader);
    res.statusCode.should.equal(200);
    res.body.addresses
      .filter(({ address }) => address === testWalletFirstAddress).length
      .should.equal(1);
  }));

  it('can create new address', co(function *() {
    const res = yield agent
      .post(`/api/v2/teth/wallet/${testWalletId}/address`)
      .set(authHeader);
    res.statusCode.should.equal(200);
  }));

  it('can do sendcoins', co(function *() {
    // fetch one new address
    let res = yield agent
      .post(`/api/v2/teth/wallet/${testWalletId}/address`)
      .set(authHeader);
    res.statusCode.should.equal(200);
    const { address } = res.body;

    res = yield agent
      .post(`/api/v2/teth/wallet/${testWalletId}/sendcoins`)
      .set(authHeader)
      .send({
        walletPassphrase: testWalletPassphrase,
        address: address,
        amount: '10000'
      });
    res.statusCode.should.equal(200);
  }));


  it('can do sendmany', co(function *() {
    // fetch two new address
    let res;
    res = yield agent.post(`/api/v2/teth/wallet/${testWalletId}/address`).set(authHeader);
    const address1 = res.body.address;
    res = yield agent.post(`/api/v2/teth/wallet/${testWalletId}/address`).set(authHeader);
    const address2 = res.body.address;

    res = yield agent
      .post(`/api/v2/teth/wallet/${testWalletId}/sendmany`)
      .set(authHeader)
      .send({
        walletPassphrase: testWalletPassphrase,
        recipients: [
          { address: address1, amount: '10000' },
          { address: address2, amount: '20000' }
        ]
      });

    // Ethereum does not support "sendmany" with multiple recipients, see JIRA BG-994
    res.statusCode.should.equal(400);

    // Sendmany with single recipient is fine
    res = yield agent
      .post(`/api/v2/teth/wallet/${testWalletId}/sendmany`)
      .set(authHeader)
      .send({
        walletPassphrase: testWalletPassphrase,
        recipients: [
          { address: address1, amount: '10000' }
        ]
      });
    res.statusCode.should.equal(200);
  }));
});

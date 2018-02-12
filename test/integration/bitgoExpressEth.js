if (process.browser) {
  throw new Error('bitgo express tests not supported in browser');
}

const request = require('supertest-as-promised');
const Promise = require('bluebird');
const co = Promise.coroutine;
const BN = require('ethereumjs-util').BN;

const expressApp = require('../../src/expressApp');
const TestBitGo = require('../lib/test_bitgo');
const testUtil = require('./testutil');


describe('Bitgo Express TETH v2', function() {
  let agent;
  let testWalletId;
  let testWalletPassphrase;
  let testWalletFirstAddress;

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

    // this should exist on the test env hand have some eth funding
    testWalletId = TestBitGo.V2.TEST_ETH_WALLET_ID;
    testWalletPassphrase = TestBitGo.V2.TEST_ETH_WALLET_PASSPHRASE;

    // this address belongs to the test wallet
    testWalletFirstAddress = TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS;

    yield bitgo.checkFunded(agent);
  }));

  it('can create new wallet and delete it', co(function *() {
    const label = 'bitgoExpressEth.js temporary test wallet';
    let res = yield agent
    .post('/api/v2/teth/wallet/generate')
    .set(authHeader)
    .send({ passphrase: testWalletPassphrase, label, enterprise: TestBitGo.TEST_ENTERPRISE });
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
    .get(`/api/v2/teth/wallet/${testWalletId}/addresses`)
    .set(authHeader);
    res.statusCode.should.equal(200);
    const { addresses } = res.body;
    const destAddress = addresses[1].address;

    res = yield agent
    .post(`/api/v2/teth/wallet/${testWalletId}/sendcoins`)
    .set(authHeader)
    .send({
      walletPassphrase: testWalletPassphrase,
      address: destAddress,
      amount: '10000'
    });
    res.statusCode.should.equal(200);
  }));


  it('can do sendmany', co(function *() {
    // fetch two new addresses
    let res = yield agent
    .get(`/api/v2/teth/wallet/${testWalletId}/addresses`)
    .set(authHeader);
    res.statusCode.should.equal(200);
    const { addresses } = res.body;
    const destAddress1 = addresses[1].address;
    const destAddress2 = addresses[2].address;

    res = yield agent
    .post(`/api/v2/teth/wallet/${testWalletId}/sendmany`)
    .set(authHeader)
    .send({
      walletPassphrase: testWalletPassphrase,
      recipients: [
        { address: destAddress1, amount: '10000' },
        { address: destAddress2, amount: '20000' }
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
        { address: destAddress1, amount: '10000' }
      ]
    });
    res.statusCode.should.equal(200);
  }));
});

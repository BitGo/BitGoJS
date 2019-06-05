import 'should';
require('should-http');
const request = require('supertest-as-promised');

const expressApp = require('../../src/expressApp');
const TestV2BitGo = require('bitgo/test/lib/test_bitgo');
const testUtil = require('bitgo/test/integration/testutil');

import * as bluebird from 'bluebird';
const co = bluebird.coroutine;

describe('Express ETH', () => {
  let agent;
  let testWalletId;
  let testWalletPassphrase;
  let testWalletFirstAddress;

  const authHeader = {
    Authorization: 'Bearer ' + TestV2BitGo.TEST_ACCESSTOKEN
  };

  before(co(function *() {
    const args = {
      debug: false,
      env: 'test',
      logfile: '/dev/null'
    };
    const bitgo = new TestV2BitGo();
    bitgo.initializeTestVars();
    const app = expressApp.app(args);
    agent = request.agent(app);
    yield bitgo.checkFunded(agent);

    // this should exist on the test env hand have some eth funding
    testWalletId = TestV2BitGo.V2.TEST_ETH_WALLET_ID;
    testWalletPassphrase = TestV2BitGo.V2.TEST_ETH_WALLET_PASSPHRASE;

    // this address belongs to the test wallet
    testWalletFirstAddress = TestV2BitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS;

    yield testUtil.unlockToken(agent, TestV2BitGo.TEST_ACCESSTOKEN, 30);
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
    res.should.have.status(200);
  }));


  it('can do sendmany', co(function *() {
    // fetch two new addresses
    let res = yield agent
    .get(`/api/v2/teth/wallet/${testWalletId}/addresses`)
    .set(authHeader);
    res.should.have.status(200);
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
    res.should.have.status(400);

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
    res.should.have.status(200);
  }));

  it('can create new wallet and delete it', co(function *() {
    const label = 'bitgoExpressEth.js temporary test wallet';
    let res = yield agent
    .post('/api/v2/teth/wallet/generate')
    .set(authHeader)
    .send({ passphrase: testWalletPassphrase, label, enterprise: TestV2BitGo.TEST_ENTERPRISE });
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

    res.body.spendableBalanceString.length.should.be.greaterThan(1);
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
});

import { TestBitGo } from '@bitgo/sdk-test';
import { common, Wallet, encodeLnurl, parseLightningInvoice } from '@bitgo/sdk-core';
import { BitGo } from '../../../src/bitgo';
import * as nock from 'nock';
import * as assert from 'assert';
import * as sinon from 'sinon';
import fixtures from '../fixtures/lightning/lightning';
import invoices from '../fixtures/lightning/invoices';

describe('lightning API requests', function () {
  const bitgo = TestBitGo.decorate(BitGo, { env: 'test' });
  bitgo.initializeTestVars();
  const basecoin = bitgo.coin('tbtc');
  const walletData = {
    id: '5b34252f1bf349930e34020a00000000',
    coin: 'tbtc',
    keys: ['5b3424f91bf349930e34017500000000', '5b3424f91bf349930e34017600000000', '5b3424f91bf349930e34017700000000'],
    coinSpecific: {},
  };
  const wallet = new Wallet(bitgo, basecoin, walletData);
  const bgUrl = common.Environments[bitgo.getEnv()].uri;
  const address = 'fake_address';
  const testUrl = 'https://service.com';

  it('should return the lightning balance of a wallet', async function () {
    const scope = nock(bgUrl).get(`/api/v2/wallet/${wallet.id()}/lightning/balance`).reply(200, {
      balance: 1000,
      availableBalance: 1000,
      maximumBalance: 1e8,
    });
    const res = await wallet.lightning().getBalance();
    assert.deepStrictEqual(res, {
      balance: 1000,
      availableBalance: 1000,
      maximumBalance: 1e8,
    });
    scope.done();
  });

  it('should generate a lightning deposit address', async function () {
    const scope = nock(bgUrl).post(`/api/v2/wallet/${wallet.id()}/lightning/address`).reply(200, {
      address,
    });
    const res = await wallet.lightning().createDepositAddress();
    assert.deepStrictEqual(res, {
      address,
    });
    scope.done();
  });

  it('should create a lightning invoice', async function () {
    const scope = nock(bgUrl).post(`/api/v2/wallet/${wallet.id()}/lightning/invoice`).reply(200, fixtures.invoice);
    const res = await wallet.lightning().createInvoice({ value: 123, memo: 'test payment' });
    assert.deepStrictEqual(res, fixtures.invoice);
    scope.done();
  });

  it('should parse a zero value lightning invoice', function () {
    const parsedInvoice = parseLightningInvoice(invoices.zeroValueInvoice);
    assert.deepStrictEqual(parsedInvoice, fixtures.parsedZeroValueInvoice);
  });

  it('should pay a lightning invoice', async function () {
    const scope = nock(bgUrl).post(`/api/v2/wallet/${wallet.id()}/lightning/payment`).reply(200, fixtures.payment);
    const res = await wallet.lightning().payInvoice({ invoice: 'fake_invoice' });
    assert.deepStrictEqual(res, fixtures.payment);
    scope.done();
  });

  it('should withdraw a value from lightning wallet to regular wallet', async function () {
    const scope = nock(bgUrl).post(`/api/v2/wallet/${wallet.id()}/lightning/withdrawal`).reply(200, fixtures.withdraw);
    sinon.stub(wallet, 'createAddress').resolves({ address: 'fake_address' });
    const res = await wallet.lightning().withdraw({ value: 30000 });
    assert.deepStrictEqual(res, fixtures.withdraw);
    scope.done();
  });

  it('should deposit an amount from on-chain wallet to lightning wallet', async function () {
    const scope = nock(bgUrl).post(`/api/v2/wallet/${wallet.id()}/lightning/address`).reply(200, {
      address,
    });
    sinon.stub(wallet, 'send').resolves(fixtures.deposit);
    const res = await wallet.lightning().deposit({ amount: 100000 });
    assert.deepStrictEqual(res, fixtures.deposit);
    scope.done();
  });

  it('should fetch lightning invoices', async function () {
    const scope = nock(bgUrl).get(`/api/v2/wallet/${wallet.id()}/lightning/invoices`).reply(200, fixtures.invoices);
    const res = await wallet.lightning().getInvoices();
    assert.deepStrictEqual(res, fixtures.invoices);
    scope.done();
  });

  it('should fetch filtered lightning invoices', async function () {
    const scope = nock(bgUrl)
      .get(`/api/v2/wallet/${wallet.id()}/lightning/invoices`)
      .query({ status: 'settled', limit: 1 })
      .reply(200, [fixtures.invoices[0]]);
    const res = await wallet.lightning().getInvoices({ status: 'settled', limit: 1 });
    assert.deepStrictEqual(res, [fixtures.invoices[0]]);
    scope.done();
  });

  it('should fetch lightning payments', async function () {
    const scope = nock(bgUrl).get(`/api/v2/wallet/${wallet.id()}/lightning/payments`).reply(200, fixtures.payments);
    const res = await wallet.lightning().getPayments();
    assert.deepStrictEqual(res, fixtures.payments);
    scope.done();
  });

  it('should fetch filtered lightning payments', async function () {
    const scope = nock(bgUrl)
      .get(`/api/v2/wallet/${wallet.id()}/lightning/payments`)
      .query({ status: 'in_flight', limit: 1 })
      .reply(200, [fixtures.payments[0]]);
    const res = await wallet.lightning().getPayments({ status: 'in_flight', limit: 1 });
    assert.deepStrictEqual(res, [fixtures.payments[0]]);
    scope.done();
  });

  it('should decode lnurl-pay', async function () {
    const lnurl = encodeLnurl('https://service.com/api?q=fake');
    const scope = nock(testUrl).get('/api').query({ q: 'fake' }).reply(200, fixtures.decodedLnurl);
    const decodedLnurl = await wallet.lightning().decodeLnurlPay(lnurl);

    assert.deepStrictEqual(decodedLnurl, { ...fixtures.decodedLnurl, domain: 'service.com' });
    scope.done();
  });

  it('should fetch lnurl-pay invoice', async function () {
    const callback = 'https://service.com/api?q=fake';
    const invoice = invoices.lnurlPayInvoice;
    const lnurlReqScope = nock(testUrl)
      .get('/api')
      .query({ q: 'fake', amount: 2000000000 })
      .reply(200, { pr: invoice });
    const res = await wallet.lightning().fetchLnurlPayInvoice({
      callback,
      millisatAmount: '2000000000',
      metadata:
        'One piece of chocolate cake, one icecream cone, one pickle, one slice of swiss cheese, one slice of salami, one lollypop, one piece of cherry pie, one sausage, one cupcake, and one slice of watermelon',
    });

    assert.deepStrictEqual(res, invoice);
    lnurlReqScope.done();
  });
});

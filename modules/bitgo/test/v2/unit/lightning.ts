import { TestBitGo } from '@bitgo/sdk-test';
import { common, Wallet } from '@bitgo/sdk-core';
import { BitGo } from '../../../src/bitgo';
import * as nock from 'nock';
import * as assert from 'assert';
import * as sinon from 'sinon';
import fixtures from '../fixtures/lightning/lightning';

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

  it('should return the balance of lightning wallet', async function () {
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

  it('should generate a lightning address', async function () {
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
    const scope = nock(bgUrl).post(`/api/v2/wallet/${wallet.id()}/lightning/invoice`).reply(200, fixtures.invoice
    );
    const res = await wallet.lightning().createInvoice({ value: 123, memo: 'test payment' });
    assert.deepStrictEqual(res, fixtures.invoice);
    scope.done();
  });

  it('should pay a lightning invoice', async function () {
    const scope = nock(bgUrl).post(`/api/v2/wallet/${wallet.id()}/lightning/payment`).reply(200, fixtures.payment);
    const res = await wallet.lightning().payInvoice({ invoice: 'fake_invoice' });
    assert.deepStrictEqual(res, fixtures.payment);
    scope.done();
  });
  
  it('should withdraw a value from lightning wallet to regular wallet', async function () {
    const scope = nock(bgUrl).post(`/api/v2/wallet/${wallet.id()}/lightning/withdrawal`).reply(200, fixtures.withdraw
    );
    sinon.stub(wallet, 'createAddress').resolves({ address: 'fake_address' });
    const res = await wallet.lightning().withdraw({ value: 30000 });
    assert.deepStrictEqual(res, fixtures.withdraw);
    scope.done();
  });

  it('should deposit an amount from on-chain wallet to lightning wallet', async function () {
    sinon.stub(wallet, 'send').resolves(fixtures.deposit);
    const res = await wallet.lightning().deposit({ amount: 100000, address: 'fake_address' });
    assert.deepStrictEqual(res, fixtures.deposit);
  });
});

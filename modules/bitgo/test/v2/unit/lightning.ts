import { TestBitGo } from '@bitgo/sdk-test';
import { common, Wallet } from '@bitgo/sdk-core';
import { BitGo } from '../../../src/bitgo';
import * as nock from 'nock';
import * as assert from 'assert';

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
});

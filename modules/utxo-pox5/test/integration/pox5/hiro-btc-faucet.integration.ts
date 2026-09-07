import assert from 'node:assert/strict';

import { HIRO_BTC_FAUCET_COINS, requestHiroBtcFaucet } from './hiro-btc-faucet';

// Opt in with POX5_HIRO_FAUCET_SMOKE=1 and one network-valid address per coin.
// Each enabled test requests test BTC and verifies the faucet returns a txid.
const liveFaucetTestsEnabled = process.env.POX5_HIRO_FAUCET_SMOKE === '1';

describe('PoX-5 live Hiro BTC faucet smoke tests', function () {
  for (const coin of HIRO_BTC_FAUCET_COINS) {
    it(`accepts a ${coin} address and publishes the faucet transaction`, async function (this: Mocha.Context) {
      if (!liveFaucetTestsEnabled) this.skip();
      this.timeout(120_000);
      const addressVariable = `POX5_HIRO_FAUCET_ADDRESS_${coin.toUpperCase()}`;
      const address = process.env[addressVariable];
      if (!address) throw new Error(`${addressVariable} is required when POX5_HIRO_FAUCET_SMOKE=1`);

      const txid = await requestHiroBtcFaucet(coin, address, { timeoutMs: 30_000 });
      assert.match(txid, /^[0-9a-f]{64}$/i, `${coin} faucet returned an invalid transaction id`);
    });
  }
});

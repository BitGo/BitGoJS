import assert from 'node:assert/strict';

import { bitGoWalletCreationCoins } from './bitgo-api';
import { loadPox5LocalConfig } from './config';
import { HiroRegtestFundingAdapter } from './funding';
import { HIRO_BTC_FAUCET_PROFILES, hiroBtcFaucetRequestUrl, requestHiroBtcFaucet } from './hiro-btc-faucet';

describe('PoX-5 Hiro BTC faucets', function () {
  it('configures a faucet for every tbtcstx wallet-creation coin', function () {
    assert.deepEqual(Object.keys(HIRO_BTC_FAUCET_PROFILES).sort(), [...bitGoWalletCreationCoins].sort());
  });

  it('keeps local regtest funding off the public Hiro faucets', async function () {
    const config = loadPox5LocalConfig(
      {
        STACKS_REGTEST_ENV_ROOT: '/tmp/stacks-regtest-env',
        POX5_COMPOSE_BASE_FILE: '/tmp/stacks-regtest-env/docker-compose.yml',
      },
      '/tmp/bitgojs'
    );

    await assert.rejects(new HiroRegtestFundingAdapter(config).requestFaucet('bcrt1qfaucetcheck'), /local profile/);
  });

  for (const coin of bitGoWalletCreationCoins) {
    it(`posts ${coin} to its Hiro faucet with the correct amount mode`, async function () {
      const address = 'bcrt1qfaucetcheck';
      const profile = HIRO_BTC_FAUCET_PROFILES[coin];
      let requestUrl: string | undefined;
      let requestMethod: string | undefined;
      const fetcher: typeof fetch = async (input, init) => {
        requestUrl = String(input);
        requestMethod = init?.method;
        return new Response(JSON.stringify({ txid: 'a'.repeat(64) }), { status: 200 });
      };

      const txid = await requestHiroBtcFaucet(coin, address, { fetcher });

      assert.equal(txid, 'a'.repeat(64));
      assert.equal(requestMethod, 'POST');
      assert.ok(requestUrl);
      const parsedUrl = new URL(requestUrl);
      assert.equal(requestUrl, hiroBtcFaucetRequestUrl(coin, address));
      assert.equal(parsedUrl.origin + parsedUrl.pathname, profile.faucetUrl);
      assert.equal(parsedUrl.searchParams.get('address'), address);
      assert.equal(parsedUrl.searchParams.get('xlarge'), profile.xlarge ? 'true' : null);
    });
  }

  it('includes the response body when Hiro rejects a faucet request', async function () {
    const fetcher: typeof fetch = async () => new Response('rate limited', { status: 429 });

    await assert.rejects(
      requestHiroBtcFaucet('tbtcstxsignet', 'tb1qfaucetcheck', { fetcher }),
      /BTC faucet for tbtcstxsignet returned 429: rate limited/
    );
  });

  it('rejects successful responses without a transaction id', async function () {
    const fetcher: typeof fetch = async () => new Response(JSON.stringify({ success: true }), { status: 200 });

    await assert.rejects(
      requestHiroBtcFaucet('tbtcstxsignet', 'tb1qfaucetcheck', { fetcher }),
      /BTC faucet for tbtcstxsignet response did not contain a txid/
    );
  });
});

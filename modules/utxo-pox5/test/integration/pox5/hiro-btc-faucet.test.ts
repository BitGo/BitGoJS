import assert from 'node:assert/strict';

import { address as btcAddress } from '@bitgo/utxo-lib';

import { bitGoWalletCreationCoins } from './bitgo-api';
import { loadPox5LocalConfig } from './config';
import { HIRO_SIGNET_MEMPOOL_API, HiroRegtestFundingAdapter, HiroSignetFundingAdapter } from './funding';
import { HIRO_BTC_FAUCET_PROFILES, hiroBtcFaucetRequestUrl, requestHiroBtcFaucet } from './hiro-btc-faucet';

const signetAddress = btcAddress.toBech32(Buffer.alloc(20, 1), 0, 'tb');
const faucetTxid = 'a'.repeat(64);
const blockHash = 'b'.repeat(64);
const signetCheckpoint = '0000019991e15b7657534ae3b332d7a618ab10bdace1ca0350f210a64e175abd';

describe('PoX-5 Hiro BTC faucets', function () {
  it('configures a faucet for every tbtcstx wallet-creation coin', function () {
    assert.deepEqual(Object.keys(HIRO_BTC_FAUCET_PROFILES).sort(), [...bitGoWalletCreationCoins].sort());
    assert.equal(HIRO_BTC_FAUCET_PROFILES.tbtcstxsignet.xlarge, true);
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
      const address = coin === 'tbtcstxsignet' ? signetAddress : 'bcrt1qfaucetcheck';
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
      requestHiroBtcFaucet('tbtcstxsignet', signetAddress, { fetcher }),
      /BTC faucet for tbtcstxsignet returned 429: rate limited/
    );
  });

  it('rejects successful responses without a transaction id', async function () {
    const fetcher: typeof fetch = async () => new Response(JSON.stringify({ success: true }), { status: 200 });

    await assert.rejects(
      requestHiroBtcFaucet('tbtcstxsignet', signetAddress, { fetcher }),
      /BTC faucet for tbtcstxsignet response did not contain a txid/
    );
  });

  it('rejects regtest and malformed signet faucet addresses before sending', async function () {
    let requests = 0;
    const fetcher: typeof fetch = async () => {
      requests++;
      throw new Error('Unexpected faucet request');
    };
    for (const address of ['bcrt1qfaucetcheck', 'tb1qfaucetcheck']) {
      await assert.rejects(requestHiroBtcFaucet('tbtcstxsignet', address, { fetcher }), /valid signet address/);
    }
    assert.equal(requests, 0);
  });
});

describe('PoX-5 Hiro signet funding', function () {
  it('uses the Hiro signet faucet and independent Hiro explorer without Core RPC', async function () {
    const requests: string[] = [];
    let polls = 0;
    const fetcher: typeof fetch = async (input, init) => {
      const url = String(input);
      requests.push(url);
      if (url.includes('/faucets/btc?')) {
        assert.equal(init?.method, 'POST');
        return new Response(JSON.stringify({ txid: faucetTxid }), { status: 200 });
      }
      if (url.endsWith('/block-height/100')) return new Response(signetCheckpoint);
      if (url.endsWith('/block-height/123')) return new Response(blockHash);
      if (url.endsWith(`/tx/${faucetTxid}`)) {
        polls++;
        return Response.json({
          txid: faucetTxid,
          status: polls > 1 ? { confirmed: true, block_hash: blockHash, block_height: 123 } : { confirmed: false },
        });
      }
      throw new Error(`Unexpected URL ${url}`);
    };
    const adapter = new HiroSignetFundingAdapter({ fetcher, pollIntervalMs: 1, confirmationTimeoutMs: 1_000 });

    assert.equal(await adapter.requestFaucet(signetAddress), faucetTxid);
    assert.deepEqual(await adapter.waitForConfirmed(faucetTxid), {
      faucetTxid,
      blockHash,
      blockHeight: 123,
    });
    assert.equal(requests[0]?.split('?')[0], HIRO_BTC_FAUCET_PROFILES.tbtcstxsignet.faucetUrl);
    assert.deepEqual(requests.slice(1), [
      `${HIRO_SIGNET_MEMPOOL_API}/block-height/100`,
      `${HIRO_SIGNET_MEMPOOL_API}/tx/${faucetTxid}`,
      `${HIRO_SIGNET_MEMPOOL_API}/tx/${faucetTxid}`,
      `${HIRO_SIGNET_MEMPOOL_API}/block-height/123`,
    ]);
  });

  it('rejects public signet explorer history before looking up a Hiro signet transaction', async function () {
    const requests: string[] = [];
    const fetcher: typeof fetch = async (input) => {
      requests.push(String(input));
      return new Response('000002cfbc285703a0d485b4d308476e85da6876e3d6ae229dc969fa9fe02d1d');
    };
    const adapter = new HiroSignetFundingAdapter({
      mempoolApi: 'https://mempool.space/signet/api',
      fetcher,
    });
    await assert.rejects(
      adapter.waitForConfirmed(faucetTxid),
      /does not match the independent Hiro staking signet chain/
    );
    assert.deepEqual(requests, ['https://mempool.space/signet/api/block-height/100']);
  });

  it('supports a configured matching HTTPS explorer and rejects unsafe endpoints or timeouts', async function () {
    const fetcher: typeof fetch = async (input) =>
      String(input).endsWith('/block-height/100') ? new Response(signetCheckpoint) : new Response('', { status: 404 });
    const adapter = new HiroSignetFundingAdapter({
      mempoolApi: 'https://my-signet-explorer.example/api/',
      fetcher,
      pollIntervalMs: 1,
      confirmationTimeoutMs: 20,
    });
    await assert.rejects(adapter.waitForConfirmed(faucetTxid), /Timed out waiting for signet transaction/);
    assert.throws(() => new HiroSignetFundingAdapter({ mempoolApi: 'http://localhost:3000/api' }), /HTTPS/);
    assert.throws(() => new HiroSignetFundingAdapter({ confirmationTimeoutMs: Infinity }), /positive integer/);
    assert.throws(() => new HiroSignetFundingAdapter({ pollIntervalMs: 0 }), /positive integer/);
    await assert.rejects(adapter.waitForConfirmed('not-a-txid'), /64 hexadecimal characters/);
  });

  it('rejects malformed or mismatched explorer transaction and confirmation data', async function () {
    for (const transaction of [
      { txid: 'c'.repeat(64), status: { confirmed: true, block_hash: blockHash, block_height: 123 } },
      { txid: faucetTxid, status: { confirmed: true, block_hash: blockHash, block_height: '123' } },
      { txid: faucetTxid, status: { confirmed: 'true' } },
    ]) {
      const fetcher: typeof fetch = async (input) =>
        String(input).endsWith('/block-height/100') ? new Response(signetCheckpoint) : Response.json(transaction);
      const adapter = new HiroSignetFundingAdapter({ fetcher, confirmationTimeoutMs: 1_000 });
      await assert.rejects(adapter.waitForConfirmed(faucetTxid), /Signet mempool.*invalid/);
    }
  });

  it('rejects a confirmed transaction in a non-canonical block', async function () {
    const fetcher: typeof fetch = async (input) => {
      const url = String(input);
      if (url.endsWith('/block-height/100')) return new Response(signetCheckpoint);
      if (url.endsWith('/block-height/123')) return new Response('c'.repeat(64));
      return Response.json({ txid: faucetTxid, status: { confirmed: true, block_hash: blockHash, block_height: 123 } });
    };
    await assert.rejects(
      new HiroSignetFundingAdapter({ fetcher }).waitForConfirmed(faucetTxid),
      /transaction block is not on the independent Hiro staking signet chain/
    );
  });
});

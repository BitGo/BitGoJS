import assert from 'node:assert/strict';

import { assertProtocolUnlock, liveEndpoints, liveNetworks, verifiedLiveTip } from './live-matrix-network';

describe('live PoX-5 network safety (offline)', function () {
  it('distinguishes signet from Hiro regtest and Stacks chain IDs', function () {
    assert.equal(liveNetworks.tbtcstx.chainId, 0x80000000);
    assert.equal(liveNetworks.tbtcstxprivate1.chainId, 0x100);
    assert.equal(liveNetworks.tbtcstxsignet.chainId, 1280);
    assert.match(liveNetworks.tbtcstxsignet.btcApi, /bitcoin\.staking-testnet\.hiro\.so\/api$/);
    assert.equal(liveNetworks.tbtcstxsignet.btcApi.includes('regtest'), false);
    assert.throws(
      () => liveEndpoints('tbtcstxsignet', { POX5_LIVE_BTC_API_TBTCSTXSIGNET: liveNetworks.tbtcstx.btcApi }),
      /network-matched/
    );
  });

  it('rejects a past, unbounded or implausible protocol unlock height', function () {
    assert.doesNotThrow(() => assertProtocolUnlock(100_000, 120_000, 25_000));
    assert.throws(() => assertProtocolUnlock(100_000, 100_001, 0), /safety bounds/);
    assert.throws(() => assertProtocolUnlock(100_000, 100_000, 25_000), /safety bounds/);
    assert.throws(() => assertProtocolUnlock(100_000, 130_000, 25_000), /safety bounds/);
    assert.throws(() => assertProtocolUnlock(100_000, 500_000_000, 500_000_000), /safety bounds/);
  });

  it('gets the independent Hiro signet tip after checking its chain checkpoint', async function () {
    const urls: string[] = [];
    const fetcher = (async (url: string) => {
      urls.push(url);
      return {
        ok: true,
        text: async () =>
          url.endsWith('/block-height/100')
            ? '0000019991e15b7657534ae3b332d7a618ab10bdace1ca0350f210a64e175abd'
            : ' 13238\n',
      };
    }) as typeof fetch;
    const height = await verifiedLiveTip('tbtcstxsignet', liveNetworks.tbtcstxsignet.btcApi, fetcher);
    assert.equal(height, 13_238);
    assert.deepEqual(urls, [
      'https://mempool.bitcoin.staking-testnet.hiro.so/api/block-height/100',
      'https://mempool.bitcoin.staking-testnet.hiro.so/api/blocks/tip/height',
    ]);
    await assert.rejects(verifiedLiveTip('tbtcstxsignet', liveNetworks.tbtcstx.btcApi, fetcher), /network-matched/);
  });
});

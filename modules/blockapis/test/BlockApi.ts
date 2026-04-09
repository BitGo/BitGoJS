import { Context } from 'mocha';
import * as assert from 'node:assert';

import { BlockApi, BlockstreamApi } from '../src';
import { getFixture } from './fixtures';
import { getHttpClient } from './http.util';

/**
 * Get the fixture for this test case.
 * @param api
 * @param name
 * @param defaultValue
 */
async function getFixtureForApi<T>(api: BlockApi, name: string, defaultValue?: T): Promise<T> {
  const filename = ['BlockApi', api.constructor.name, name, 'json'].join('.');
  return await getFixture(`${__dirname}/fixtures/${filename}`, defaultValue);
}

function testBlockApi(api: BlockApi) {
  describe(`BlockApi ${api.constructor.name}`, function () {
    const heights = [0, 210_000, 420_000, 630_000, 840_000];
    it('fetches block hashes by height', async function (this: Context) {
      this.timeout(10_000);
      const result = await Promise.all(heights.map((h) => api.getBlockIdAtHeight(h)));
      assert.deepStrictEqual(result, [
        '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
        '000000000000048b95347e83192f69cf0366076336c639f9b7228e9ba171342e',
        '000000000000000002cce816c0ab2c5c269cb081896b7dcb34b8422d6b74ffa1',
        '000000000000000000024bead8df69990852c202db0e0097c1a12ea637d7e96d',
        '0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5',
      ]);
    });

    it('fetches txids list in block', async function (this: Context) {
      this.timeout(10_000);
      const hash = await api.getBlockIdAtHeight(840_000);
      const result = await api.getTransactionIds(hash);
      assert.deepStrictEqual(result, await getFixtureForApi(api, `getTransactionIds.840k`, result));
    });
  });
}

testBlockApi(BlockstreamApi.forCoin('btc', { httpClient: getHttpClient('blockstream') }));

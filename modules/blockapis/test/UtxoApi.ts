import * as assert from 'assert';
import { BlockchairApi, BlockstreamApi, UtxoApi } from '../src';
import { getFixture } from './fixtures';
import { CachingHttpClient } from './CachingHttpClient';

function getTestAddress(coinName: string): string {
  switch (coinName) {
    case 'tbtc':
      return '2NEhVzd2Lom5g7ZF5K1qYrgZLpXecniqHcE';
  }
  throw new Error(`unsupported coin ${coinName}`);
}

function getTestTransactionId(coinName: string): string {
  switch (coinName) {
    case 'tbtc':
      return '19c6cd6b7b8a91e1a63d759eedd2818877a624771d38e00c3ffcedfdd09afc50';
  }
  throw new Error(`unsupported coin ${coinName}`);
}

const methods = ['getUnspentsForAddresses', 'getTransactionInputs', 'getTransactionHex'] as const;

type ApiMethod = typeof methods[number];

async function getFixtureUtxoApi<T>(coinName: string, api: UtxoApi, methodName: ApiMethod, v?: T): Promise<T> {
  return await getFixture(`${__dirname}/fixtures/UtxoApi.${api.constructor.name}.${coinName}.${methodName}.json`, v);
}

function getHttpClient(name: string): CachingHttpClient {
  return new CachingHttpClient(`${__dirname}/fixtures/responses/` + name);
}

function getApis(coinName: string): UtxoApi[] {
  if (coinName === 'tbtc') {
    return [
      // BitGoApi.forCoin(coinName),
      BlockchairApi.forCoin(coinName, { httpClient: getHttpClient('blockchair') }),
      BlockstreamApi.forCoin(coinName, { httpClient: getHttpClient('blockstream') }),
    ];
  }
  return [];
}

function runTestFetch(api: UtxoApi, coinName: string) {
  describe(`UtxoApi coinName=${coinName} api=${api.constructor.name}`, function () {
    it('fetches unspents by address', async function () {
      this.timeout(10_000);
      const unspents = await api.getUnspentsForAddresses([getTestAddress(coinName)]);
      assert.deepStrictEqual(unspents, await getFixtureUtxoApi(coinName, api, 'getUnspentsForAddresses', unspents));
    });

    it('fetches transaction hex', async function () {
      this.timeout(10_000);
      const txHex = await api.getTransactionHex(getTestTransactionId(coinName));
      assert.deepStrictEqual(txHex, await getFixtureUtxoApi(coinName, api, 'getTransactionHex', txHex));
    });

    it('fetches unspents for transaction', async function () {
      this.timeout(10_000);
      const unspents = await api.getTransactionInputs(getTestTransactionId(coinName));
      assert.deepStrictEqual(unspents, await getFixtureUtxoApi(coinName, api, 'getTransactionInputs', unspents));
    });
  });
}

function runTestCompare(api: UtxoApi, coinName: string) {
  describe(`UtxoApi coinName=${coinName} api=${api.constructor.name}`, function () {
    getApis(coinName)
      .filter((otherApi) => api.constructor !== otherApi.constructor)
      .forEach((otherApi) => {
        methods.forEach((methodName) => {
          it(`compare ${methodName} results with ${otherApi.constructor.name}`, async function () {
            const unspents = await getFixtureUtxoApi(coinName, api, methodName);
            const otherUnspents = await getFixtureUtxoApi(coinName, otherApi, methodName);
            assert.deepStrictEqual(unspents, otherUnspents);
          });
        });
      });
  });
}

['tbtc'].forEach((coinName) => {
  getApis(coinName).forEach((api) => {
    runTestFetch(api, coinName);
  });
  getApis(coinName).forEach((api) => {
    runTestCompare(api, coinName);
  });
});

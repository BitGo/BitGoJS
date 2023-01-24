import 'mocha';
import * as assert from 'assert';
import { BlockchairApi, BlockstreamApi, UtxoApi, CachingHttpClient } from '../src';
import { deepStrictEqualJSON, getFixture } from './fixtures';

function isHttpEnabled(): boolean {
  return process.env.BITGO_BLOCKAPIS_TEST_ENABLE_HTTP === '1';
}

function getTestAddresses(coinName: string): string[] {
  switch (coinName) {
    case 'tbtc':
      return ['2NEhVzd2Lom5g7ZF5K1qYrgZLpXecniqHcE'];
  }
  throw new Error(`unsupported coin ${coinName}`);
}

const nonexistentTx = '1111111111111111111111111111111111111111111111111111111111111111';

function getTestTransactionIds(coinName: string): string[] {
  switch (coinName) {
    case 'tbtc':
      return [
        '19c6cd6b7b8a91e1a63d759eedd2818877a624771d38e00c3ffcedfdd09afc50',
        '87f4cf756eef9979f0fb6a03db2ab2e0fd46060cf97714a990623093fe227a87',
        // unconfirmed (at time of caching)
        'fe38c68afcdd60dc0af11b692f81f512b886132b26165e404c0d0a30d7d6dc54',
        // not seen at all
        nonexistentTx,
      ];
  }
  throw new Error(`unsupported coin ${coinName}`);
}

type MethodArguments = unknown[];

class TestCase<T> {
  constructor(public coinName: string, public methodName: keyof UtxoApi, public args: unknown[]) {}

  func(api: UtxoApi) {
    return (api[this.methodName] as any)(...this.args);
  }

  async getFixture(api: UtxoApi, defaultValue?: T): Promise<T> {
    const filename = [
      'UtxoApi',
      api.constructor.name,
      this.coinName,
      this.methodName,
      this.args.join(','),
      'json',
    ].join('.');
    return await getFixture(`${__dirname}/fixtures/${filename}`, defaultValue);
  }

  async getFixtureNormal(api: UtxoApi): Promise<T> {
    if (this.methodName === 'getTransactionStatus') {
      // remove api-specific fields
      const blockInfo = (await this.getFixture(api)) as unknown as Record<string, unknown>;
      return {
        found: blockInfo.found,
        confirmed: blockInfo.confirmed,
        blockHeight: blockInfo.blockHeight,
      } as unknown as T;
    }
    return await this.getFixture(api);
  }

  /** Certain calls produce non-200 responses, and we don't cache those. */
  expectError(api: UtxoApi): boolean {
    if (this.args[0] === nonexistentTx) {
      if (this.methodName === 'getTransactionStatus') {
        // Blockstream returns a 404 for missing transactions
        return api.constructor.name === 'BlockstreamApi' && !isHttpEnabled();
      }
      return true;
    }
    return false;
  }

  title(): string {
    function elide(s: string, len: number) {
      return s.length > len ? `${s.slice(0, len)}...` : s;
    }
    return `${this.methodName}(${this.args.map((v) => elide(String(v), 4))})`;
  }
}

function getHttpClient(name: string): CachingHttpClient {
  return new CachingHttpClient(`${__dirname}/fixtures/responses/` + name, { isHttpEnabled: isHttpEnabled() });
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

function getTestCases(coinName: string): TestCase<unknown>[] {
  function getArguments(coinName: string, methodName: keyof UtxoApi): MethodArguments[] {
    switch (methodName) {
      case 'getTransactionHex':
      case 'getTransactionInputs':
      case 'getTransactionIO':
      case 'getTransactionSpends':
      case 'getTransactionStatus':
        return getTestTransactionIds(coinName).map((v) => [v]);
      case 'getUnspentsForAddresses':
        return getTestAddresses(coinName).map((v) => [[v]]);
    }
    throw new Error(`not implemented`);
  }

  const methods: (keyof UtxoApi)[] = [
    'getTransactionHex',
    'getTransactionInputs',
    'getTransactionIO',
    'getTransactionStatus',
    'getTransactionSpends',
    'getUnspentsForAddresses',
  ];

  return methods.flatMap((methodName) =>
    getArguments(coinName, methodName).map((args) => new TestCase(coinName, methodName, args))
  );
}

function runTestFetch(api: UtxoApi, coinName: string) {
  getTestCases(coinName).forEach((testCase) => {
    describe(`${api.constructor.name} ${testCase.title()}`, function () {
      it('fetches resource', async function () {
        this.timeout(10_000);
        if (testCase.expectError(api)) {
          await assert.rejects(() => testCase.func(api));
          return;
        }
        const resource = await testCase.func(api);
        deepStrictEqualJSON(resource, await testCase.getFixture(api, resource));
      });
    });
  });
}

function runTestCompare(api: UtxoApi, coinName: string) {
  getTestCases(coinName).forEach((testCase) => {
    describe(`method ${testCase.title()}`, function () {
      getApis(coinName)
        .filter((otherApi) => api.constructor !== otherApi.constructor)
        .forEach((otherApi) => {
          if (testCase.expectError(api) || testCase.expectError(otherApi)) {
            return;
          }
          it(`compare ${api.constructor.name} and ${otherApi.constructor.name}`, async function () {
            deepStrictEqualJSON(await testCase.getFixtureNormal(api), await testCase.getFixtureNormal(otherApi));
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

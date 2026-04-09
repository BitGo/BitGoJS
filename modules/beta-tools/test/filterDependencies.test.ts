import assert from 'assert';

import { DEFAULT_UTXO_PATTERNS, filterDependencies, isUtxoPackage } from '../src/filterDependencies';

describe('isUtxoPackage', function () {
  it('matches packages containing "utxo"', function () {
    assert.strictEqual(isUtxoPackage('@bitgo-beta/utxo-lib'), true);
    assert.strictEqual(isUtxoPackage('@bitgo-beta/abstract-utxo'), true);
  });

  it('matches packages containing "unspents"', function () {
    assert.strictEqual(isUtxoPackage('@bitgo-beta/unspents'), true);
  });

  it('matches packages containing "abstract-lightning"', function () {
    assert.strictEqual(isUtxoPackage('@bitgo-beta/abstract-lightning'), true);
  });

  it('matches babylonlabs-io-btc-staking-ts', function () {
    assert.strictEqual(isUtxoPackage('@bitgo-beta/babylonlabs-io-btc-staking-ts'), true);
  });

  it('does not match non-utxo packages', function () {
    assert.strictEqual(isUtxoPackage('@bitgo-beta/sdk-core'), false);
    assert.strictEqual(isUtxoPackage('@bitgo-beta/statics'), false);
    assert.strictEqual(isUtxoPackage('@bitgo-beta/sdk-coin-eth'), false);
  });

  it('uses custom patterns when provided', function () {
    assert.strictEqual(isUtxoPackage('@bitgo-beta/sdk-coin-ada', ['ada']), true);
    assert.strictEqual(isUtxoPackage('@bitgo-beta/utxo-lib', ['ada']), false);
  });
});

describe('filterDependencies', function () {
  const deps = [
    '@bitgo-beta/sdk-core',
    '@bitgo-beta/utxo-lib',
    '@bitgo-beta/statics',
    '@bitgo-beta/abstract-lightning',
    '@bitgo-beta/sdk-coin-eth',
    '@bitgo-beta/unspents',
  ];

  it('returns all deps with no filters', function () {
    const result = filterDependencies(deps, {
      ignore: [],
      onlyUtxo: false,
      ignoreUtxo: false,
      utxoPatterns: DEFAULT_UTXO_PATTERNS,
    });
    assert.deepStrictEqual(result, deps);
  });

  it('ignores specified packages', function () {
    const result = filterDependencies(deps, {
      ignore: ['@bitgo-beta/statics'],
      onlyUtxo: false,
      ignoreUtxo: false,
      utxoPatterns: DEFAULT_UTXO_PATTERNS,
    });
    assert.ok(!result.includes('@bitgo-beta/statics'));
    assert.strictEqual(result.length, 5);
  });

  it('filters to only UTXO packages', function () {
    const result = filterDependencies(deps, {
      ignore: [],
      onlyUtxo: true,
      ignoreUtxo: false,
      utxoPatterns: DEFAULT_UTXO_PATTERNS,
    });
    assert.deepStrictEqual(result, ['@bitgo-beta/utxo-lib', '@bitgo-beta/abstract-lightning', '@bitgo-beta/unspents']);
  });

  it('filters out UTXO packages', function () {
    const result = filterDependencies(deps, {
      ignore: [],
      onlyUtxo: false,
      ignoreUtxo: true,
      utxoPatterns: DEFAULT_UTXO_PATTERNS,
    });
    assert.deepStrictEqual(result, ['@bitgo-beta/sdk-core', '@bitgo-beta/statics', '@bitgo-beta/sdk-coin-eth']);
  });

  it('combines ignore with onlyUtxo', function () {
    const result = filterDependencies(deps, {
      ignore: ['@bitgo-beta/unspents'],
      onlyUtxo: true,
      ignoreUtxo: false,
      utxoPatterns: DEFAULT_UTXO_PATTERNS,
    });
    assert.deepStrictEqual(result, ['@bitgo-beta/utxo-lib', '@bitgo-beta/abstract-lightning']);
  });
});

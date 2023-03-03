import * as assert from 'assert';

import { DerivedWalletKeys, RootWalletKeys, WalletKeys } from '../../../src/bitgo';
import { getDefaultWalletKeys } from '../../../src/testutil';

describe('WalletKeys', function () {
  let defaultWalletKeys: RootWalletKeys;
  let exoticWalletKeys: RootWalletKeys;
  let defaultWalletKeysDerived: DerivedWalletKeys;
  let exoticWalletKeysDerived: DerivedWalletKeys;

  function mapBase58(k: WalletKeys): string[] {
    return k.triple.map((k) => k.toBase58());
  }

  before('setup derivations', function () {
    defaultWalletKeys = getDefaultWalletKeys();
    defaultWalletKeysDerived = defaultWalletKeys.deriveForChainAndIndex(1, 2);

    exoticWalletKeys = new RootWalletKeys(defaultWalletKeys.triple, [
      '99/99',
      RootWalletKeys.defaultPrefix,
      RootWalletKeys.defaultPrefix,
    ]);
    exoticWalletKeysDerived = exoticWalletKeys.deriveForChainAndIndex(1, 2);
  });

  it('does not accept duplicate keys', function () {
    const [a, b, c] = defaultWalletKeys.triple;
    assert.throws(() => {
      new WalletKeys([a, b, b]);
    });
    assert.throws(() => {
      new WalletKeys([a, a, c]);
    });
  });

  function assertEqlDerivedPaths(
    root: RootWalletKeys,
    derived: DerivedWalletKeys,
    chain: number,
    index: number,
    expectedPaths: string[]
  ) {
    const paths = root.triple.map((k) => root.getDerivationPath(k, chain, index));
    assert.deepStrictEqual(paths, expectedPaths);
    assert.deepStrictEqual(paths, derived.paths);
  }

  it('derives to expected values for default wallet keys', function () {
    assertEqlDerivedPaths(defaultWalletKeys, defaultWalletKeysDerived, 1, 2, ['0/0/1/2', '0/0/1/2', '0/0/1/2']);
    assert.deepStrictEqual(mapBase58(defaultWalletKeysDerived), [
      'xprv9zz8umnxxQR63smXBW8YkywRjpchgxuuUH1iJg5ViS8QwZmNuBCbkx69Bzyijwcvsthd3zF8FCy74FU3DC1gYKtzPinfPF5iWJwarkhHinS',
      'xprvA1gzohJxuwdy7UtoYwTA8pbskksjiywygp6LUJXW133TJn6ad2KX6XRGsV33nVYKqzsVZGq5h56u5NNkVFKmfMkn7Xqjen3MpZs8XdxABKQ',
      'xprv9zuZc2cWHuBL7PJyppMtjCtsRz5QKaGfrPKBgA1SsHMZHxNzC3ZaJYDSYzcuSwwf6duVWQvBs4CcwMknC9mQieFKqKpwc3Yo2hpusjMsZJi',
    ]);
  });

  it('derives to expected values for exotic wallet keys', function () {
    assertEqlDerivedPaths(exoticWalletKeys, exoticWalletKeysDerived, 1, 2, ['99/99/1/2', '0/0/1/2', '0/0/1/2']);
    assert.deepStrictEqual(mapBase58(exoticWalletKeysDerived), [
      'xprvA22MDSEU9wGJWzCGXQVFdYfcoTmhsXqQpMzGpLCG1Ad7txFp4bbbu1rckowNRVL96kH5rSWgmkaoJMgrgUuds7sQax5jdjqsXKauWAcvp3V',
      mapBase58(defaultWalletKeysDerived)[1],
      mapBase58(defaultWalletKeysDerived)[2],
    ]);
  });
});

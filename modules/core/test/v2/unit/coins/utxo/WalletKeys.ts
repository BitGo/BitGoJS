/**
 * @prettier
 */
import * as should from 'should';

import { getDefaultWalletKeys } from './util';

import { DerivedWalletKeys, RootWalletKeys, WalletKeys } from '../../../../../src/v2/coins/utxo/WalletKeys';

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
    should.throws(() => {
      new WalletKeys([a, b, b]);
    });
    should.throws(() => {
      new WalletKeys([a, a, c]);
    });
  });

  function shouldEqlDerivedPaths(
    root: RootWalletKeys,
    derived: DerivedWalletKeys,
    chain: number,
    index: number,
    expectedPaths: string[]
  ) {
    const paths = root.triple.map((k) => root.getDerivationPath(k, chain, index));
    paths.should.eql(expectedPaths);
    paths.should.eql(derived.paths);
  }

  it('derives to expected values for default wallet keys', function () {
    shouldEqlDerivedPaths(defaultWalletKeys, defaultWalletKeysDerived, 1, 2, ['0/0/1/2', '0/0/1/2', '0/0/1/2']);
    mapBase58(defaultWalletKeysDerived).should.eql([
      'xprv9zgfqaUb9iWAq8WmSTdoq617YeLDM3s9VBQAYqG3Zkrcoo6KmiM53KfjL7NtyFR13xLus7m3iVnfbDkoVG4PZ21gK18njDESSfLz3wsrAxk',
      'xprvA1JDN2ruFL1RPkKey89PMQ4xNHyn4qwa515yvjSpymdMhJWJKpL8sVuA6trrGfKo3YUQumxLBFRNhKJn5wKF9pHWb1ENGJ4fwMSi5rTefrL',
      'xprvA25Tn5wK3NdCa1gn2n5izydQVEYmPhMTXjHj8CYf9TsK6Pyj5K9B6M5iCnq226gbNQpDrhgZd68gJVZkKV7iGJzoXbhfxNUpTKyZ3gTguiH',
    ]);
  });

  it('derives to expected values for exotic wallet keys', function () {
    shouldEqlDerivedPaths(exoticWalletKeys, exoticWalletKeysDerived, 1, 2, ['99/99/1/2', '0/0/1/2', '0/0/1/2']);
    mapBase58(exoticWalletKeysDerived).should.eql([
      'xprv9zZRVSn7UqvWcLDiCHDWgz1boWDWGVHVyF6cYn5stL4oYyYE7TajNSA9r9VstcG67z49JaPJcvYCQvwDWbgMfrYz2Aa8gAN3fFG4jfHUifn',
      mapBase58(defaultWalletKeysDerived)[1],
      mapBase58(defaultWalletKeysDerived)[2],
    ]);
  });
});

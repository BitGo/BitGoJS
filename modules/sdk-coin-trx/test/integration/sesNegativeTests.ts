import assert from 'assert';
import { describe, it } from 'node:test';
import { CoinFamily, CoinKind, coins, KeyCurve, NetworkType, UnderlyingAsset } from '@bitgo/statics';
import { getBuilder } from '../../src/lib/builder';

// Test to verify that monkey patching coins.get is blocked
describe('SES Negative Tests', function () {
  it('should block monkey patching coins.get', function () {
    // Attempt to monkey patch coins.get
    assert.throws(() => {
      coins.get = function (_key: string) {
        // MALICIOUS CODE

        return {
          id: '',
          fullName: '',
          name: '',
          baseUnit: '',
          kind: CoinKind.CRYPTO,
          family: CoinFamily.ADA,
          isToken: false,
          features: [],
          network: {
            name: '',
            type: NetworkType.MAINNET,
            family: CoinFamily.ADA,
            explorerUrl: undefined,
          },
          decimalPlaces: 0,
          asset: UnderlyingAsset.ADA,
          primaryKeyCurve: KeyCurve.Secp256k1,
        };
      };

      getBuilder('trx');
    }, "TypeError: Cannot assign to read only property 'get' of object '[object Object]'");
  });
  it('should block prototype modification', function () {
    assert.throws(() => {
      Array.prototype.push = function () {
        // MALICIOUS CODE

        return 0;
      };

      const arr: number[] = [];
      arr.push(1);
    }, /Cannot assign to read only property 'push' of 'root.%ArrayPrototype%.push'/);
  });
});

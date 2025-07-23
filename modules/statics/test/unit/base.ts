import should from 'should';
import { UnderlyingAsset, UnderlyingAssetValue } from '../../src/base';

describe('UnderlyingAsset', function () {
  it('UnderlyingAsset values should be unique', function () {
    const underlyingAssetSet = new Set();
    const duplicateAssets: UnderlyingAssetValue[] = [];

    for (const asset of Object.keys(UnderlyingAsset)) {
      const assetValue = UnderlyingAsset[asset as keyof typeof UnderlyingAsset].toUpperCase() as UnderlyingAssetValue;
      if (underlyingAssetSet.has(assetValue)) {
        duplicateAssets.push(assetValue);
      }
      underlyingAssetSet.add(assetValue);
    }

    if (duplicateAssets.length !== 0) {
      const failureMessage = `
        Added duplicate UnderlyingAssets with values: ${duplicateAssets}
        You should re-use the existing asset if this refers to the same asset, but on different chains.
        If they are different assets, pick a unique name.
        `;
      should.fail(undefined, undefined, failureMessage);
    }
  });
});

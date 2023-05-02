const should = require('should');
const { UnderlyingAsset } = require('../../src/base');

describe('UnderlyingAsset', function () {
  it('UnderlyingAsset values should be unique', function () {
    const underlyingAssetSet = new Set();
    const duplicateAssets: (typeof UnderlyingAsset)[] = [];

    for (const asset in UnderlyingAsset) {
      const assetValue = UnderlyingAsset[asset].toUpperCase();
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

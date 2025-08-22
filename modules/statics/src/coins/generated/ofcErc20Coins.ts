import { ofcerc20, tofcerc20 } from '../ofc';
import { UnderlyingAsset } from '../base';

export const ofcErc20Coins = [
  ofcerc20(
    '19c91088-b24d-45f1-8b33-079b301966c6',
    'ofceth:frxusd',
    'frxusd',
    18,
    underlyingAssetForSymbol('eth:frxusd')
  ),
  ofcerc20(
    '8464e8a8-2011-4edd-a400-b0fc346baa96',
    'ofceth:rekt',
    'rekt',
    18,
    underlyingAssetForSymbol('eth:rekt')
  ),
  ofcerc20(
    'e0987fa0-e716-4982-9ece-1180861c9017',
    'ofceth:cgpt',
    'cgpt',
    18,
    underlyingAssetForSymbol('eth:cgpt')
  ),
  ofcerc20(
    '40c6198d-36a3-41b9-93b2-ab72786d838e',
    'ofceth:dka',
    'dka',
    18,
    underlyingAssetForSymbol('eth:dka')
  ),
  ofcerc20(
    'dd6a089c-f8cf-4a94-a626-b8020570c6ff',
    'ofceth:red',
    'red',
    18,
    underlyingAssetForSymbol('eth:red')
  ),
];

function underlyingAssetForSymbol(underlyingAssetValue: string): UnderlyingAsset {
  return (
    Object.values(UnderlyingAsset).find((value) => value === underlyingAssetValue) || UnderlyingAsset.INVALID_UNKNOWN
  );
}

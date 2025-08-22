import { ofcerc20, tofcerc20 } from '../ofc';
import { UnderlyingAsset } from '../base';

export const ofcErc20Coins = [
  ofcerc20(
    'e4765f54-76e4-4311-9f3f-1b2e24f0dae8',
    'ofceth:rekt',
    'rekt',
    18,
    underlyingAssetForSymbol('eth:rekt')
  ),
  ofcerc20(
    '719ac759-f8dd-4ce4-82a6-eea29d56fc12',
    'ofceth:dka',
    'dka',
    18,
    underlyingAssetForSymbol('eth:dka')
  ),
  ofcerc20(
    'cd18c26c-608b-443d-a113-9082772f8c14',
    'ofceth:cgpt',
    'cgpt',
    18,
    underlyingAssetForSymbol('eth:cgpt')
  ),
  ofcerc20(
    'fcd12232-23dc-49da-a35d-c13c2d349439',
    'ofceth:frxusd',
    'frxusd',
    18,
    underlyingAssetForSymbol('eth:frxusd')
  ),
  ofcerc20(
    '10b3b049-5778-44d2-95ec-66e3bef74479',
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

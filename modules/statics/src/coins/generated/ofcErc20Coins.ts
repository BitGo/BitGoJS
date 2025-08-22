import { ofcerc20, tofcerc20 } from '../ofc';
import { UnderlyingAsset } from '../base';

export const ofcErc20Coins = [
  ofcerc20(
    '0dc8fb5a-d00b-4e7a-be7f-aa45945b7d7b',
    'ofceth:frxusd',
    'frxusd',
    18,
    underlyingAssetForSymbol('eth:frxusd')
  ),
  ofcerc20(
    '05c0a7a7-c8c8-4924-8d6d-fa3fbd28b506',
    'ofceth:rekt',
    'rekt',
    18,
    underlyingAssetForSymbol('eth:rekt')
  ),
  ofcerc20(
    '8a9a8531-1205-46b0-bb5a-c029af9ae79e',
    'ofceth:red',
    'red',
    18,
    underlyingAssetForSymbol('eth:red')
  ),
  ofcerc20(
    '9f282064-53e2-4924-9554-d97a729aa5b4',
    'ofceth:dka',
    'dka',
    18,
    underlyingAssetForSymbol('eth:dka')
  ),
  ofcerc20(
    '9c8dfa9f-aaca-4dab-8f6a-a53b1c4f6641',
    'ofceth:cgpt',
    'cgpt',
    18,
    underlyingAssetForSymbol('eth:cgpt')
  ),
];

function underlyingAssetForSymbol(underlyingAssetValue: string): UnderlyingAsset {
  return (
    Object.values(UnderlyingAsset).find((value) => value === underlyingAssetValue) || UnderlyingAsset.INVALID_UNKNOWN
  );
}

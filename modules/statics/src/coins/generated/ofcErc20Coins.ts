import { ofcerc20, tofcerc20 } from '../ofc';
import { UnderlyingAsset } from '../base';

export const ofcErc20Coins = [
  ofcerc20(
    '2b20d530-8da9-4015-b18d-2ddddcdca097',
    'ofceth:red',
    'red',
    18,
    underlyingAssetForSymbol('eth:red')
  ),
  ofcerc20(
    '5b86a4c5-c03b-4650-bb93-ef0962331eef',
    'ofceth:dka',
    'dka',
    18,
    underlyingAssetForSymbol('eth:dka')
  ),
  ofcerc20(
    '0ba83390-d4f9-4abe-a20b-5ceb899a9010',
    'ofceth:cgpt',
    'cgpt',
    18,
    underlyingAssetForSymbol('eth:cgpt')
  ),
  ofcerc20(
    '1bbb3739-7319-431c-b251-87ee63e1eaf5',
    'ofceth:rekt',
    'rekt',
    18,
    underlyingAssetForSymbol('eth:rekt')
  ),
  ofcerc20(
    'f6471150-0055-4d35-88bd-89a90c2f0902',
    'ofceth:frxusd',
    'frxusd',
    18,
    underlyingAssetForSymbol('eth:frxusd')
  ),
];

function underlyingAssetForSymbol(underlyingAssetValue: string): UnderlyingAsset {
  return (
    Object.values(UnderlyingAsset).find((value) => value === underlyingAssetValue) || UnderlyingAsset.INVALID_UNKNOWN
  );
}

import { ofcerc20, tofcerc20 } from '../ofc';
import { UnderlyingAsset } from '../base';

export const ofcErc20Coins = [
  ofcerc20(
    'e6028622-3026-4278-b1dc-eb41f74b4d32',
    'ofceth:frxusd',
    'frxusd',
    18,
    underlyingAssetForSymbol('eth:frxusd')
  ),
  ofcerc20(
    'd4597e49-996b-46a2-9047-a1440dfad87e',
    'ofceth:red',
    'red',
    18,
    underlyingAssetForSymbol('eth:red')
  ),
  ofcerc20(
    '54c70737-810c-47f5-a6b8-10ea1dede677',
    'ofceth:cgpt',
    'cgpt',
    18,
    underlyingAssetForSymbol('eth:cgpt')
  ),
  ofcerc20(
    'efb5a07f-61bd-4637-8864-db53106c7b36',
    'ofceth:rekt',
    'rekt',
    18,
    underlyingAssetForSymbol('eth:rekt')
  ),
  ofcerc20(
    '2cfd1e18-29f7-460e-8595-5e60c358c0a7',
    'ofceth:dka',
    'dka',
    18,
    underlyingAssetForSymbol('eth:dka')
  ),
];

function underlyingAssetForSymbol(underlyingAssetValue: string): UnderlyingAsset {
  return (
    Object.values(UnderlyingAsset).find((value) => value === underlyingAssetValue) || UnderlyingAsset.INVALID_UNKNOWN
  );
}

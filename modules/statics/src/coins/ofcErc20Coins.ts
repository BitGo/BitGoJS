import { OfcCoin } from '../ofcCoin';
import { BaseUnit, CoinFeature, CoinKind, KeyCurve, UnderlyingAsset } from '../base';
import { Networks, OfcNetwork } from '../networks';

export function ofcerc20(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  asset: UnderlyingAsset,
  kind: CoinKind = CoinKind.CRYPTO,
  features: CoinFeature[] = OfcCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.replace(/^ofc/, '').toUpperCase(),
  network: OfcNetwork = Networks.main.ofc,
  isToken = true,
  addressCoin = 'eth',
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return Object.freeze(
    new OfcCoin({
      id,
      name,
      fullName,
      network,
      prefix,
      suffix,
      features,
      decimalPlaces,
      isToken,
      asset,
      kind,
      addressCoin,
      primaryKeyCurve,
      baseUnit: BaseUnit.ETH,
    })
  );
}

export function tofcerc20(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  asset: UnderlyingAsset,
  kind: CoinKind = CoinKind.CRYPTO,
  features: CoinFeature[] = OfcCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.replace(/^ofc/, '').toUpperCase(),
  network: OfcNetwork = Networks.test.ofc,
  isToken = true,
  addressCoin = 'teth',
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return Object.freeze(
    new OfcCoin({
      id,
      name,
      fullName,
      network,
      prefix,
      suffix,
      features,
      decimalPlaces,
      isToken,
      asset,
      kind,
      addressCoin,
      primaryKeyCurve,
      baseUnit: BaseUnit.ETH,
    })
  );
}

function underlyingAssetForSymbol(underlyingAssetValue: string): UnderlyingAsset {
  return (
    Object.values(UnderlyingAsset).find((value) => value === underlyingAssetValue) || UnderlyingAsset.INVALID_UNKNOWN
  );
}

export const ofcErc20Tokens = [
  ofcerc20(
    'ee579200-2f43-41f3-ba2e-365bcb20ff21',
    'ofcusdm1',
    'USDM1',
    18,
    underlyingAssetForSymbol('eth:usdm1'),
    undefined,
    [...OfcCoin.DEFAULT_FEATURES, CoinFeature.STABLECOIN]
  ),
  ofcerc20(
    '1458bca6-e0d3-455e-81c7-55862dc5af52',
    'ofcmon:usdc',
    'MON:USDC',
    6,
    underlyingAssetForSymbol('mon:usdc'),
    undefined,
    [...OfcCoin.DEFAULT_FEATURES, CoinFeature.STABLECOIN],
    '',
    undefined,
    undefined,
    true,
    'mon'
  ),
  ofcerc20(
    '7a8631a5-deed-43c5-92a0-13e3322429ba',
    'ofcmon:wmon',
    'Wrapped MON',
    18,
    underlyingAssetForSymbol('mon:wmon'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'mon'
  ),
  ofcerc20(
    '517ca4d1-a2c4-4606-914f-4c4b5b4943ff',
    'ofcxdc:usdc',
    'USD Coin (XDC)',
    6,
    underlyingAssetForSymbol('xdc:usdc'),
    undefined,
    [...OfcCoin.DEFAULT_FEATURES, CoinFeature.STABLECOIN],
    '',
    undefined,
    undefined,
    true,
    'xdc'
  ),
  ofcerc20(
    'b4666353-81d0-491b-a554-bdd8e677be24',
    'ofcxdc:lbt',
    'Law Block Token',
    18,
    underlyingAssetForSymbol('xdc:lbt'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'xdc'
  ),
  ofcerc20(
    '26dc9e5b-7bd5-4e77-859e-56e77e2582e7',
    'ofcxdc:cre',
    'Crescite',
    18,
    underlyingAssetForSymbol('xdc:cre'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'xdc'
  ),
  ofcerc20(
    '086883c7-f7e9-458e-a0a1-ed3ec525f9c6',
    'ofcxdc:gama',
    'Gama Token',
    18,
    underlyingAssetForSymbol('xdc:gama'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'xdc'
  ),
  ofcerc20(
    '0c8b533c-1929-4de8-af36-9cf4b4409c0d',
    'ofcxdc:srx',
    'STORX',
    18,
    underlyingAssetForSymbol('xdc:srx'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'xdc'
  ),
  ofcerc20(
    '3c7ec48a-ba51-47c9-9044-f29d9c0daf35',
    'ofcxdc:weth',
    'Wrapped Ether (XDC)',
    18,
    underlyingAssetForSymbol('xdc:weth'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'xdc'
  ),
];

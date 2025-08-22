import { CoinFeature, UnderlyingAsset } from '../base';
import { AccountCoin, erc20, terc20 } from '../account';
import { Networks } from '../networks';
import {
  EIGEN_FEATURES,
  ETH_FEATURES_WITH_FRANKFURT,
  ETH_FEATURES_WITH_FRANKFURT_EXCLUDE_SINGAPORE,
  ETH_FEATURES_WITH_FRANKFURT_GERMANY,
  ETH_FEATURES_WITH_GERMANY,
  HTETH_TOKEN_FEATURES,
  MATIC_FEATURES,
  MATIC_FEATURES_WITH_FRANKFURT,
  POL_FEATURES,
  RETH_ROCKET_FEATURES,
  TOKEN_FEATURES_WITH_NY_GERMANY_FRANKFURT,
  TOKEN_FEATURES_WITH_SWISS,
  TWETH_FEATURES,
  WETH_FEATURES,
  ZETA_EVM_FEATURES,
} from '../coinFeatures';

export const erc20Coins = [
  erc20(
    'e4efe466-0920-4d79-9200-3718fa4c0bd2',
    'eth:red',
    'Redstone',
    18,
    '0xc43c6bfeda065fe2c4c11765bf838789bd0bb5de',
    UnderlyingAsset['eth:red']
  ),
  erc20(
    '4882ce1f-49eb-43f7-b0e0-2697c480bd7e',
    'eth:dka',
    'dKargo',
    18,
    '0x5dc60C4D5e75D22588FA17fFEB90A63E535efCE0',
    UnderlyingAsset['eth:dka']
  ),
  erc20(
    'dacb2a70-2e93-4a12-94f4-21448ccc68e1',
    'eth:cgpt',
    'ChainGPT',
    18,
    '0x25931894a86d47441213199621f1f2994e1c39aa',
    UnderlyingAsset['eth:cgpt']
  ),
  erc20(
    '177706eb-7566-4a06-9903-4f09e9952ae8',
    'eth:rekt',
    'Rekt',
    18,
    '0xdd3B11eF34cd511a2DA159034a05fcb94D806686',
    UnderlyingAsset['eth:rekt']
  ),
  erc20(
    'de74740a-d439-4ca8-b6e7-63e9c93e1c9c',
    'eth:frxusd',
    'Frax USD',
    18,
    '0xcacd6fd266af91b8aed52accc382b4e165586e29',
    UnderlyingAsset['eth:frxusd']
  ),
];

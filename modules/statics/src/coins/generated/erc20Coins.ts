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
    '383aaa1a-0239-4427-82c3-00ed81720d53',
    'eth:frxusd',
    'Frax USD',
    18,
    '0xcacd6fd266af91b8aed52accc382b4e165586e29',
    UnderlyingAsset['eth:frxusd']
  ),
  erc20(
    'd0c9fd6c-e447-4e8d-af84-24d7a705e330',
    'eth:rekt',
    'Rekt',
    18,
    '0xdd3B11eF34cd511a2DA159034a05fcb94D806686',
    UnderlyingAsset['eth:rekt']
  ),
  erc20(
    '988314d1-09db-4654-a4bd-bba7d0c34e60',
    'eth:cgpt',
    'ChainGPT',
    18,
    '0x25931894a86d47441213199621f1f2994e1c39aa',
    UnderlyingAsset['eth:cgpt']
  ),
  erc20(
    '11370cf2-a95b-42c2-9f2f-be7b06e69c33',
    'eth:dka',
    'dKargo',
    18,
    '0x5dc60C4D5e75D22588FA17fFEB90A63E535efCE0',
    UnderlyingAsset['eth:dka']
  ),
  erc20(
    '33ea37ae-6070-40d6-939f-8908d780db1a',
    'eth:red',
    'Redstone',
    18,
    '0xc43c6bfeda065fe2c4c11765bf838789bd0bb5de',
    UnderlyingAsset['eth:red']
  ),
];

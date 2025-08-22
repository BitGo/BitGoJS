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
    '9dc244e1-1913-41fc-808a-c18754f61bb0',
    'eth:frxusd',
    'Frax USD',
    18,
    '0xcacd6fd266af91b8aed52accc382b4e165586e29',
    UnderlyingAsset['eth:frxusd']
  ),
  erc20(
    'fcf4c716-8744-4414-8ba5-ef02df77ffe5',
    'eth:red',
    'Redstone',
    18,
    '0xc43c6bfeda065fe2c4c11765bf838789bd0bb5de',
    UnderlyingAsset['eth:red']
  ),
  erc20(
    'a64e05f4-b31b-45ea-922e-5770f6d93637',
    'eth:cgpt',
    'ChainGPT',
    18,
    '0x25931894a86d47441213199621f1f2994e1c39aa',
    UnderlyingAsset['eth:cgpt']
  ),
  erc20(
    '138d02a7-6dc3-487d-840e-516db4da8b12',
    'eth:rekt',
    'Rekt',
    18,
    '0xdd3B11eF34cd511a2DA159034a05fcb94D806686',
    UnderlyingAsset['eth:rekt']
  ),
  erc20(
    'f9924c7b-b0d6-4669-8f2a-51c514b813cc',
    'eth:dka',
    'dKargo',
    18,
    '0x5dc60C4D5e75D22588FA17fFEB90A63E535efCE0',
    UnderlyingAsset['eth:dka']
  ),
];

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
    'e6198ff9-d7a9-46db-a873-0b403302439f',
    'eth:rekt',
    'Rekt',
    18,
    '0xdd3B11eF34cd511a2DA159034a05fcb94D806686',
    UnderlyingAsset['eth:rekt']
  ),
  erc20(
    '1783d9ef-c401-4b3f-b418-1e74975093b3',
    'eth:dka',
    'dKargo',
    18,
    '0x5dc60C4D5e75D22588FA17fFEB90A63E535efCE0',
    UnderlyingAsset['eth:dka']
  ),
  erc20(
    '92f3693f-0928-4cc4-a222-71a865d108d9',
    'eth:cgpt',
    'ChainGPT',
    18,
    '0x25931894a86d47441213199621f1f2994e1c39aa',
    UnderlyingAsset['eth:cgpt']
  ),
  erc20(
    '553d7deb-5d4b-4b24-84e5-d9ea5ae1fb7d',
    'eth:frxusd',
    'Frax USD',
    18,
    '0xcacd6fd266af91b8aed52accc382b4e165586e29',
    UnderlyingAsset['eth:frxusd']
  ),
  erc20(
    '82c7828a-3f91-43dc-9e95-87c14f7f012e',
    'eth:red',
    'Redstone',
    18,
    '0xc43c6bfeda065fe2c4c11765bf838789bd0bb5de',
    UnderlyingAsset['eth:red']
  ),
];

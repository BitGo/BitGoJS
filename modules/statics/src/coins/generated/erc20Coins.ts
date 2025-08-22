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
    '32c6825b-3688-4b92-b9d1-24a37352bdc4',
    'eth:frxusd',
    'Frax USD',
    18,
    '0xcacd6fd266af91b8aed52accc382b4e165586e29',
    UnderlyingAsset['eth:frxusd']
  ),
  erc20(
    'dbb30bf0-c375-40dd-a243-b543b99a1dc5',
    'eth:rekt',
    'Rekt',
    18,
    '0xdd3B11eF34cd511a2DA159034a05fcb94D806686',
    UnderlyingAsset['eth:rekt']
  ),
  erc20(
    'a0071ea4-f80b-405c-9d88-2a6b17318192',
    'eth:red',
    'Redstone',
    18,
    '0xc43c6bfeda065fe2c4c11765bf838789bd0bb5de',
    UnderlyingAsset['eth:red']
  ),
  erc20(
    'd6af972b-5cc3-4f48-8458-fd22a3d7c726',
    'eth:dka',
    'dKargo',
    18,
    '0x5dc60C4D5e75D22588FA17fFEB90A63E535efCE0',
    UnderlyingAsset['eth:dka']
  ),
  erc20(
    'a1abd89f-4bdd-43cd-841e-1526ad62f605',
    'eth:cgpt',
    'ChainGPT',
    18,
    '0x25931894a86d47441213199621f1f2994e1c39aa',
    UnderlyingAsset['eth:cgpt']
  ),
];

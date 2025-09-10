import { tadaToken } from '../account';
import { UnderlyingAsset } from '../base';
import { ADA_TOKEN_FEATURES } from '../coinFeatures';
import { Networks } from '../networks';

export const adaTokens = [
  tadaToken(
    'a7678172-84b3-4c7e-ac46-9875d23a1cb7',
    'tada:water',
    'Test ADA Token',
    0, // Tokens are not divisible - https://cardano-ledger.readthedocs.io/en/latest/explanations/token-bundles.html
    '2533cca6eb42076e144e9f2772c390dece9fce173bc38c72294b3924',
    'WATER',
    'asset1n69xf60d0760xvn8v2ffd5frvsm0cl2r8hfjf6',
    UnderlyingAsset['tada:water'],
    ADA_TOKEN_FEATURES,
    Networks.test.ada
  ),
];

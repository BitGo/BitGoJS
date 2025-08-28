import { tadaToken, AccountCoin } from '../account';
import { UnderlyingAsset } from '../base';
import { Networks } from '../networks';

export const adaTokens = [
  tadaToken(
    'a7678172-84b3-4c7e-ac46-9875d23a1cb7',
    'tada:water',
    'Test ADA Token',
    6,
    '2533cca6eb42076e144e9f2772c390dece9fce173bc38c72294b3924',
    'WATER',
    UnderlyingAsset['tada:water'],
    AccountCoin.DEFAULT_FEATURES,
    Networks.test.ada
  ),
];

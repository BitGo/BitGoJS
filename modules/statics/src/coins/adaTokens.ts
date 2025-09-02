import { tadaToken } from '../account';
import { UnderlyingAsset } from '../base';
import { ADA_TOKEN_FEATURES } from '../coinFeatures';
import { Networks } from '../networks';

export const adaTokens = [
  tadaToken(
    'a7678172-84b3-4c7e-ac46-9875d23a1cb7',
    'tada:water',
    'Test ADA Token',
    6,
    '2533cca6eb42076e144e9f2772c390dece9fce173bc38c72294b3924',
    'WATER',
    '5741544552',
    UnderlyingAsset['tada:water'],
    ADA_TOKEN_FEATURES,
    Networks.test.ada
  ),
];

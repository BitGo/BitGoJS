import { tadaToken, adaToken } from '../account';
import { UnderlyingAsset } from '../base';
import { ADA_TOKEN_FEATURES } from '../coinFeatures';

export const adaTokens = [
  tadaToken(
    'a7678172-84b3-4c7e-ac46-9875d23a1cb7',
    'tada:water',
    'Test ADA Token',
    0,
    '2533cca6eb42076e144e9f2772c390dece9fce173bc38c72294b3924',
    'WATER',
    'asset1n69xf60d0760xvn8v2ffd5frvsm0cl2r8hfjf6',
    UnderlyingAsset['tada:water'],
    ADA_TOKEN_FEATURES
  ),
  adaToken(
    '2d1f9c55-808d-4a6e-b494-62bdb54a16a4',
    'ada:min',
    'MIN ADA Token',
    6,
    '29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6',
    'MIN',
    'asset1d9v7aptfvpx7we2la8f25kwprkj2ma5rp6uwzv',
    UnderlyingAsset['ada:min'],
    ADA_TOKEN_FEATURES
  ),
];

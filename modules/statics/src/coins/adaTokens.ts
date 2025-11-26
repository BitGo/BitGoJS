import { tadaToken, adaToken } from '../account';
import { UnderlyingAsset } from '../base';
import { ADA_TOKEN_FEATURES, ADA_TOKEN_FEATURES_EXCLUDE_SINGAPORE } from '../coinFeatures';

export const adaTokens = [
  tadaToken(
    'a7678172-84b3-4c7e-ac46-9875d23a1cb7',
    'tada:water',
    'Test ADA Token',
    0,
    '2533cca6eb42076e144e9f2772c390dece9fce173bc38c72294b39245741544552',
    'WATER',
    'asset1n69xf60d0760xvn8v2ffd5frvsm0cl2r8hfjf6',
    UnderlyingAsset['tada:water'],
    ADA_TOKEN_FEATURES
  ),
  tadaToken(
    'e5b9f0a3-2ef1-4649-bcf8-b4dd012f908a',
    'tada:tusda',
    'Testnet USDA',
    6,
    '5ec37726eebe67f1db9f84e739b24e9e4dbb4c632a36a50ce74bfc86',
    'USDA',
    'asset1hc9l4ggxu7pgavfgndtn00cwr9uxesrf7ajqq7',
    UnderlyingAsset['tada:tusda'],
    ADA_TOKEN_FEATURES_EXCLUDE_SINGAPORE
  ),
  adaToken(
    '2d1f9c55-808d-4a6e-b494-62bdb54a16a4',
    'ada:min',
    'Minswap',
    6,
    '29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c64d494e',
    'MIN',
    'asset1d9v7aptfvpx7we2la8f25kwprkj2ma5rp6uwzv',
    UnderlyingAsset['ada:min'],
    ADA_TOKEN_FEATURES_EXCLUDE_SINGAPORE
  ),
  adaToken(
    '9b0edf33-71a8-49e3-86a9-1c8a4bc320ef',
    'ada:snek',
    'Snek',
    0,
    '279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f534e454b',
    'SNEK',
    'asset108xu02ckwrfc8qs9d97mgyh4kn8gdu9w8f5sxk',
    UnderlyingAsset['ada:snek'],
    ADA_TOKEN_FEATURES
  ),
  adaToken(
    'a167d1c4-3a18-47fb-946a-02e1aa14079b',
    'ada:wmtx',
    'World Mobile Token X',
    6,
    'e5a42a1a1d3d1da71b0449663c32798725888d2eb0843c4dabeca05a576f726c644d6f62696c65546f6b656e58',
    'WMTX',
    'asset1l2xup5vr08s07lxg5c4kkj7ur624rv5ayzhyc7',
    UnderlyingAsset['ada:wmtx'],
    ADA_TOKEN_FEATURES
  ),
  adaToken(
    '0ef40586-e63e-4d25-97b8-8a3f2e54c7d6',
    'ada:iag',
    'IAGON',
    6,
    '5d16cc1a177b5d9ba9cfa9793b07e60f1fb70fea1f8aef064415d114494147',
    'IAG',
    'asset1z62wksuv4sjkl24kjgr2sm8tfr4p0cf9p32rca',
    UnderlyingAsset['ada:iag'],
    ADA_TOKEN_FEATURES_EXCLUDE_SINGAPORE
  ),
  adaToken(
    'fc13d676-cf5f-49b4-bb6d-2b5fc95ea174',
    'ada:djed',
    'Djed USD',
    6,
    '8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd61446a65644d6963726f555344',
    'DJED',
    'asset15f3ymkjafxxeunv5gtdl54g5qs8ty9k84tq94x',
    UnderlyingAsset['ada:djed'],
    ADA_TOKEN_FEATURES
  ),
  adaToken(
    '13d88151-de98-409b-ab37-9675234f1124',
    'ada:usda',
    'Anzens USDA Stablecoin',
    6,
    'fe7c786ab321f41c654ef6c1af7b3250a613c24e4213e0425a7ae456',
    'USDA',
    'asset16fq594uun90f2jajmecjcdt4jnsnq7r3jdqsw5',
    UnderlyingAsset['ada:usda'],
    ADA_TOKEN_FEATURES
  ),
];

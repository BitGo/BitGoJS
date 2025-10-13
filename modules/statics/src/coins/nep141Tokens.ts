import { nep141Token, tnep141Token } from '../account';
import { CoinFeature, UnderlyingAsset } from '../base';
import { NEAR_TOKEN_FEATURES } from '../coinFeatures';

export const nep141Tokens = [
  nep141Token(
    'a4c48a49-aeb3-40ab-b9a4-92c0e501557b',
    'near:usdc',
    'USD Coin',
    6,
    '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
    '1250000000000000000000',
    UnderlyingAsset['near:usdc'],
    [...NEAR_TOKEN_FEATURES, CoinFeature.STABLECOIN]
  ),
  nep141Token(
    'fc9db945-ffae-40df-8fb8-de27fa3d3132',
    'near:usdt',
    'Tether USD',
    6,
    'usdt.tether-token.near',
    '1250000000000000000000',
    UnderlyingAsset['near:usdt'],
    [...NEAR_TOKEN_FEATURES, CoinFeature.STABLECOIN]
  ),
  nep141Token(
    'c34f7765-e8b6-46a5-bf03-5e547d5ebac2',
    'near:mpdao',
    'Meta Pool',
    6,
    'mpdao-token.near',
    '1250000000000000000000',
    UnderlyingAsset['near:mpdao'],
    NEAR_TOKEN_FEATURES
  ),
  nep141Token(
    '04a288c1-8aee-4ff2-b59b-a3e13ce49c03',
    'near:stnear',
    'stNEAR',
    24,
    'meta-pool.near',
    '1250000000000000000000',
    UnderlyingAsset['near:stnear'],
    NEAR_TOKEN_FEATURES
  ),

  // testnet tokens
  tnep141Token(
    'de55cb4b-afaf-4ac0-b271-d7eba49eb8e9',
    'tnear:tnep24dp',
    'Test NEP141 Token 24 Decimals',
    24,
    'ft-tnep24dp.testnet',
    '1250000000000000000000',
    UnderlyingAsset['tnear:tnep24dp'],
    NEAR_TOKEN_FEATURES
  ),
  tnep141Token(
    '272b824a-792a-444b-be3a-4783cd34ae59',
    'tnear:usdc',
    'USD Coin',
    6,
    '3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af',
    '1250000000000000000000',
    UnderlyingAsset['tnear:usdc'],
    [...NEAR_TOKEN_FEATURES, CoinFeature.STABLECOIN]
  ),
];

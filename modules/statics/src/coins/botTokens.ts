import { CoinFeature } from '@bitgo-beta/statics';
import { AccountCoin, terc20 } from '@bitgo-beta/statics/dist/src/account';
import { UnderlyingAsset } from '@bitgo-private/asset-metadata-service-types';

export const botTokens = [
  terc20(
    'c0d472f8-636f-4891-bb44-63ea69f32a54',
    'hteth:ams',
    'AMS Token v2',
    1,
    '0x8c7a17ef8e00f2f31cff598206d7fc5a8cb41111',
    UnderlyingAsset['hteth:ams'],
    [...AccountCoin.DEFAULT_FEATURES, CoinFeature.CUSTODY_BITGO_INDIA],
  ),
];

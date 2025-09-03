import { AccountCoin, terc20 } from '../account';
import { CoinFeature, UnderlyingAsset } from '../base';

export const botTokens = [
  terc20(
    'c0d472f8-636f-4891-bb44-63ea69f32a54',
    'hteth:ams',
    'AMS Token v2',
    1,
    '0x8c7a17ef8e00f2f31cff598206d7fc5a8cb41111',
    'hteth:ams' as unknown as UnderlyingAsset,
    [...AccountCoin.DEFAULT_FEATURES, CoinFeature.CUSTODY_BITGO_INDIA]
  ),
];

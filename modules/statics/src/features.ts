import { AccountCoin } from './account';
import { CoinFeature } from './base';

export const ETH_FEATURES = [
  ...AccountCoin.DEFAULT_FEATURES,
  CoinFeature.SUPPORTS_TOKENS,
  CoinFeature.ENTERPRISE_PAYS_FEES,
];

export const WETH_FEATURES = [
  ...AccountCoin.DEFAULT_FEATURES,
  CoinFeature.MULTISIG_COLD,
  CoinFeature.METAMASK_INSTITUTIONAL,
  CoinFeature.CUSTODY_BITGO_SWITZERLAND,
  CoinFeature.CUSTODY_BITGO_SINGAPORE,
  CoinFeature.LIQUID_STAKING,
];

export const MATIC_FEATURES = [
  ...AccountCoin.DEFAULT_FEATURES,
  CoinFeature.STAKING,
  CoinFeature.MULTISIG_COLD,
  CoinFeature.METAMASK_INSTITUTIONAL,
  CoinFeature.CUSTODY_BITGO_SWITZERLAND,
  CoinFeature.CUSTODY_BITGO_SINGAPORE,
];

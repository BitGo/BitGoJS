import { AccountCoin } from './account';
import { CoinFamily, CoinFeature } from './base';
import {
  APT_FEATURES,
  BSC_TOKEN_FEATURES,
  POLYGON_TOKEN_FEATURES,
  SOL_TOKEN_FEATURES,
  STX_TOKEN_FEATURES,
  SUI_TOKEN_FEATURES,
} from './coinFeatures';
import { OfcCoin } from './ofc';

export const networkFeatureMapForTokens: Partial<Record<CoinFamily, CoinFeature[]>> = {
  algo: AccountCoin.DEFAULT_FEATURES,
  apt: APT_FEATURES,
  arbeth: [...AccountCoin.DEFAULT_FEATURES, CoinFeature.EIP1559],
  avaxc: AccountCoin.DEFAULT_FEATURES,
  bera: [...AccountCoin.DEFAULT_FEATURES, CoinFeature.EIP1559],
  bsc: BSC_TOKEN_FEATURES,
  celo: AccountCoin.DEFAULT_FEATURES,
  eth: AccountCoin.DEFAULT_FEATURES,
  eos: AccountCoin.DEFAULT_FEATURES,
  hbar: AccountCoin.DEFAULT_FEATURES,
  opeth: [...AccountCoin.DEFAULT_FEATURES, CoinFeature.EIP1559],
  polygon: POLYGON_TOKEN_FEATURES,
  sol: SOL_TOKEN_FEATURES,
  stx: STX_TOKEN_FEATURES,
  sui: SUI_TOKEN_FEATURES,
  trx: AccountCoin.DEFAULT_FEATURES,
  xlm: AccountCoin.DEFAULT_FEATURES,
  xrp: AccountCoin.DEFAULT_FEATURES,
  ofc: OfcCoin.DEFAULT_FEATURES,
};

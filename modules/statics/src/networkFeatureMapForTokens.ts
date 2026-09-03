import { AccountCoin } from './account';
import { CoinFamily, CoinFeature } from './base';
import {
  ADA_TOKEN_FEATURES,
  APT_FEATURES,
  BSC_TOKEN_FEATURES,
  CANTON_TOKEN_FEATURES,
  EVM_FEATURES,
  POLYGON_TOKEN_FEATURES,
  POLYX_TOKEN_FEATURES,
  SOL_TOKEN_FEATURES,
  STX_TOKEN_FEATURES,
  SUI_TOKEN_FEATURES,
  TAO_TOKEN_FEATURES,
} from './coinFeatures';

const dynamicNetworkFeaturesMap = new Map<string, CoinFeature[]>();

/** Register default token features for a dynamically onboarded chain family. */
export function registerNetworkFeatures(family: string, features: CoinFeature[]): void {
  dynamicNetworkFeaturesMap.set(family, features);
}

/** Default token feature set shared by "plain" EVM-compatible chain families (no bespoke features). */
export const EVM_TOKEN_FEATURES: CoinFeature[] = [
  ...EVM_FEATURES,
  CoinFeature.SHARED_EVM_SIGNING,
  CoinFeature.SHARED_EVM_SDK,
  CoinFeature.EVM_COMPATIBLE_IMS,
  CoinFeature.EVM_COMPATIBLE_UI,
  CoinFeature.EVM_COMPATIBLE_WP,
  CoinFeature.SUPPORTS_ERC20,
];

// Set by coins.ts (which has access to the full coin map) so getNetworkFeatures() can fall back to
// EVM_TOKEN_FEATURES for any family whose base coin supports ERC20, without this module needing to
// import the coin map itself (that would create a circular import: coins.ts -> networkFeatureMapForTokens.ts
// -> allCoinsAndTokens.ts -> coins/botTokens.ts -> networkFeatureMapForTokens.ts).
let isErc20SupportedFamily: ((family: string) => boolean) | undefined;

/** Register a predicate used to detect whether a family's base coin carries CoinFeature.SUPPORTS_ERC20. */
export function registerErc20FamilyChecker(checker: (family: string) => boolean): void {
  isErc20SupportedFamily = checker;
}

/**
 * Look up token features for a family.
 * Checks the static map first, then the dynamic map, then falls back to EVM_TOKEN_FEATURES for any
 * family whose base coin supports ERC20 (see registerErc20FamilyChecker). Returns undefined if the
 * family isn't recognized by any of the three.
 */
export function getNetworkFeatures(family: string): CoinFeature[] | undefined {
  return (
    networkFeatureMapForTokens[family as CoinFamily] ??
    dynamicNetworkFeaturesMap.get(family) ??
    (isErc20SupportedFamily?.(family) ? EVM_TOKEN_FEATURES : undefined)
  );
}

/**
 * Resolve the final feature list for a token: the family's default token features
 * plus `additionalFeatures`, minus `excludedFeatures`. Used by generated bot-token
 * lists to apply the per-token diff returned by AMS (`features=false`).
 */
export function getTokenFeatures(
  family: string,
  additionalFeatures: CoinFeature[] = [],
  excludedFeatures: CoinFeature[] = []
): CoinFeature[] {
  const base = getNetworkFeatures(family) ?? [];
  const excluded = new Set<CoinFeature>(excludedFeatures);
  return [...new Set<CoinFeature>([...base, ...additionalFeatures])].filter((f) => !excluded.has(f));
}

export const networkFeatureMapForTokens: Partial<Record<CoinFamily, CoinFeature[]>> = {
  algo: AccountCoin.DEFAULT_FEATURES,
  apt: APT_FEATURES,
  arbeth: [...AccountCoin.DEFAULT_FEATURES, CoinFeature.EIP1559],
  avaxc: AccountCoin.DEFAULT_FEATURES,
  bera: [...AccountCoin.DEFAULT_FEATURES, CoinFeature.EIP1559],
  bsc: BSC_TOKEN_FEATURES,
  canton: CANTON_TOKEN_FEATURES,
  celo: AccountCoin.DEFAULT_FEATURES,
  eth: AccountCoin.DEFAULT_FEATURES,
  eos: AccountCoin.DEFAULT_FEATURES,
  gasevm: EVM_TOKEN_FEATURES,
  hbar: AccountCoin.DEFAULT_FEATURES,
  opeth: [...AccountCoin.DEFAULT_FEATURES, CoinFeature.EIP1559],
  katanaeth: EVM_TOKEN_FEATURES,
  polygon: POLYGON_TOKEN_FEATURES,
  scrolleth: EVM_TOKEN_FEATURES,
  sol: SOL_TOKEN_FEATURES,
  stx: STX_TOKEN_FEATURES,
  sui: SUI_TOKEN_FEATURES,
  tao: TAO_TOKEN_FEATURES,
  polyx: POLYX_TOKEN_FEATURES,
  trx: AccountCoin.DEFAULT_FEATURES,
  xlm: AccountCoin.DEFAULT_FEATURES,
  xrp: AccountCoin.DEFAULT_FEATURES,
  ofc: [],
  ada: ADA_TOKEN_FEATURES,
};

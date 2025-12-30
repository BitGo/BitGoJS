import { ofcerc20, tofcerc20, OfcCoin } from '../ofc';
import { erc20MasterTokens } from './erc20MasterTokens';
import { CoinFeature } from '../base';

/**
 * Merge custom features with OFC default features.
 * If custom features are provided, they extend the defaults (adding features like STABLECOIN).
 * If no custom features, return undefined to use the default.
 */
function mergeFeatureWithOfcDefaultFeatures(customFeatures: CoinFeature[] | undefined): CoinFeature[] | undefined {
  if (!customFeatures || customFeatures.length === 0) {
    return undefined; // Use OfcCoin.DEFAULT_FEATURES
  }
  // Merge defaults with custom features, avoiding duplicates
  const merged = new Set([...OfcCoin.DEFAULT_FEATURES, ...customFeatures]);
  return Array.from(merged);
}

/**
 * Generate mainnet OFC ERC20 coins from the master token list.
 * Only generates off-chain (OFC) tokens - ERC20 tokens are in erc20Coins.ts
 */
function generateOfcErc20Coins() {
  const coins = [];
  for (const coinDetail of erc20MasterTokens) {
    // Only generate mainnet OFC coins (offchain, not testnet)
    if (coinDetail.offchain && !coinDetail.isTestnet) {
      const features = mergeFeatureWithOfcDefaultFeatures(coinDetail.offchain.features);

      coins.push(
        ofcerc20(
          coinDetail.offchain.id,
          coinDetail.offchain.name,
          coinDetail.fullName,
          coinDetail.decimalPlaces,
          coinDetail.underlyingAsset,
          undefined, // kind - defaults to CoinKind.CRYPTO
          features,
          undefined, // prefix
          undefined, // suffix
          coinDetail.offchain.network, // network
          undefined, // isToken
          coinDetail.offchain.addressCoin // addressCoin
        )
      );
    }
  }
  return coins;
}

/**
 * Generate testnet OFC ERC20 coins from the master token list.
 * Only generates off-chain (tOFC) tokens - tERC20 tokens are in erc20Coins.ts
 */
function generateTestnetOfcErc20Coins() {
  const coins = [];
  for (const coinDetail of erc20MasterTokens) {
    // Only generate testnet OFC coins (offchain, testnet)
    if (coinDetail.offchain && coinDetail.isTestnet) {
      const features = mergeFeatureWithOfcDefaultFeatures(coinDetail.offchain.features);

      coins.push(
        tofcerc20(
          coinDetail.offchain.id,
          coinDetail.offchain.name,
          coinDetail.fullName,
          coinDetail.decimalPlaces,
          coinDetail.underlyingAsset,
          undefined, // kind - defaults to CoinKind.CRYPTO
          features,
          undefined, // prefix
          undefined, // suffix
          coinDetail.offchain.network, // network
          undefined, // isToken
          coinDetail.offchain.addressCoin // addressCoin
        )
      );
    }
  }
  return coins;
}

export const ofcErc20Coins = generateOfcErc20Coins();
export const tOfcErc20Coins = generateTestnetOfcErc20Coins();

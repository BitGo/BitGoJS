import { BitGoBase } from '@bitgo-beta/sdk-core';
import { CoinFeature, coins } from '@bitgo-beta/statics';
import { CosmosSharedCoin } from './cosmosSharedCoin';

/**
 * Register all coins that use the shared Cosmos SDK implementation
 * @param sdk BitGo instance
 */
export function register(sdk: BitGoBase): void {
  coins
    .filter((coin) => coin.features.includes(CoinFeature.SHARED_COSMOS_SDK))
    .forEach((coin) => {
      sdk.register(coin.name, CosmosSharedCoin.createInstance);
    });
}

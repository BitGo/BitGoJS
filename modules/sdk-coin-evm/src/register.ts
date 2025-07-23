import { BitGoBase } from '@bitgo/sdk-core';
import { CoinFeature, coins, NetworkType } from '@bitgo/statics';
import { EvmCoin } from './evmCoin';

export const registerAll = (sdk: BitGoBase): void => {
  coins
    .filter(
      (coin) =>
        coin.features.includes(CoinFeature.SHARED_EVM_SDK) && coin.network.type === NetworkType.MAINNET && !coin.isToken
    )
    .forEach((coin) => {
      register(coin.family, sdk);
    });
};

export const register = (coinFamily: string, sdk: BitGoBase): void => {
  if (coins.get(coinFamily).features.includes(CoinFeature.SHARED_EVM_SDK)) {
    coins
      .filter((coin) => coin.family === coinFamily && !coin.isToken)
      .forEach((coin) => {
        sdk.register(coin.name, EvmCoin.createInstance);
      });
    //TODO: add token registration after EVM Token Optimisation is implemented
  }
};
